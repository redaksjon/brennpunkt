#!/usr/bin/env node
/**
 * Brennpunkt - Coverage Priority Analyzer
 * 
 * Parses lcov.info and ranks files by testing priority.
 * Helps answer: "Where should I focus testing efforts next?"
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { Command } from 'commander';
import { z } from 'zod';
import { parseLcov } from './parser';
import { analyzeCoverage } from './analyzer';
import { formatTable, formatJson } from './formatter';
import type { AnalyzerOptions, PriorityWeights } from './types';

const VERSION = '__VERSION__';
const PROGRAM_NAME = 'brennpunkt';
const CONFIG_FILE_NAME = 'brennpunkt.yaml';

/**
 * Common locations where coverage tools place lcov.info files.
 * Searched in order - first match wins.
 */
const COVERAGE_SEARCH_PATHS = [
    'coverage/lcov.info',           // Jest, Vitest, c8 (most common)
    '.coverage/lcov.info',          // Some configurations
    'coverage/lcov/lcov.info',      // Karma
    'lcov.info',                    // Project root
    '.nyc_output/lcov.info',        // NYC legacy
    'test-results/lcov.info',       // Some CI configurations
];

/**
 * Configuration schema for brennpunkt
 */
export const ConfigSchema = z.object({
    coveragePath: z.string().optional(),
    weights: z.string().optional(),
    minLines: z.number().optional(),
    json: z.boolean().optional(),
    top: z.number().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Default configuration values
 */
const DEFAULTS: Config = {
    coveragePath: 'coverage/lcov.info',
    weights: '0.5,0.3,0.2',
    minLines: 10,
    json: false,
    top: undefined,
};

export interface Args {
    coveragePath?: string;
    weights?: string;
    minLines?: string;
    json?: boolean;
    top?: string;
    config?: string;
}

/**
 * Parse weights string into PriorityWeights object.
 * 
 * @param weightsStr - Comma-separated weights string (e.g., "0.5,0.3,0.2")
 * @returns Parsed weights object
 */
function parseWeights(weightsStr: string): PriorityWeights {
    const parts = weightsStr.split(',').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error('Weights must be three comma-separated numbers (branches,functions,lines)');
    }
    return {
        branches: parts[0],
        functions: parts[1],
        lines: parts[2],
    };
}

/**
 * Resolve the coverage file path.
 * If given path is relative, resolve it against current working directory.
 * 
 * @param inputPath - User-provided path
 * @returns Resolved absolute path
 */
function resolveCoveragePath(inputPath: string): string {
    if (inputPath.startsWith('/')) {
        return inputPath;
    }
    return resolve(process.cwd(), inputPath);
}

/**
 * Discover coverage file by searching common locations.
 * 
 * @returns Object with found path and search results, or null if not found
 */
export function discoverCoverageFile(): { found: string; searched: string[] } | null {
    const cwd = process.cwd();
    const searched: string[] = [];
    
    for (const searchPath of COVERAGE_SEARCH_PATHS) {
        const fullPath = resolve(cwd, searchPath);
        searched.push(fullPath);
        
        if (existsSync(fullPath)) {
            return { found: fullPath, searched };
        }
    }
    
    return null;
}

/**
 * Simple YAML parser for configuration files.
 * Handles basic key: value pairs and comments.
 */
function parseSimpleYaml(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) {
            continue;
        }
        
        const key = trimmed.slice(0, colonIndex).trim();
        let value: string | number | boolean = trimmed.slice(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        
        // Parse booleans
        if (value === 'true') {
            result[key] = true;
        } else if (value === 'false') {
            result[key] = false;
        }
        // Parse numbers
        else if (!isNaN(Number(value)) && value !== '') {
            result[key] = Number(value);
        }
        // Keep as string
        else {
            result[key] = value;
        }
    }
    
    return result;
}

/**
 * Read configuration from brennpunkt.yaml in the current directory or specified path.
 */
function readConfigFile(configPath?: string): Partial<Config> {
    const paths = configPath 
        ? [configPath]
        : [
            resolve(process.cwd(), CONFIG_FILE_NAME),
            resolve(process.cwd(), '.brennpunkt', 'config.yaml'),
        ];
    
    for (const filePath of paths) {
        if (existsSync(filePath)) {
            try {
                const content = readFileSync(filePath, 'utf-8');
                const parsed = parseSimpleYaml(content);
                return ConfigSchema.partial().parse(parsed);
            } catch {
                // Ignore parse errors, continue to next path or use defaults
            }
        }
    }
    
    return {};
}

/**
 * Generate a default configuration file.
 */
function generateConfigFile(outputPath?: string): void {
    const filePath = outputPath || resolve(process.cwd(), CONFIG_FILE_NAME);
    
    const configContent = `# Brennpunkt Configuration
# https://github.com/redaksjon/brennpunkt

# Path to lcov.info coverage file
# coveragePath: coverage/lcov.info

# Priority weights for branches, functions, lines (must sum to 1.0)
# Higher branch weight means untested branches are prioritized more heavily
# weights: "0.5,0.3,0.2"

# Minimum number of lines for a file to be included in analysis
# Helps filter out tiny utility files
# minLines: 10

# Output format (true for JSON, false for table)
# json: false

# Limit results to top N files (comment out or remove for all files)
# top: 20
`;
    
    // Create directory if needed
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(filePath, configContent, 'utf-8');
    process.stdout.write(`Configuration file created: ${filePath}\n`);
}

/**
 * Display the current configuration with sources.
 */
function checkConfig(cliArgs: Args): void {
    const fileConfig = readConfigFile(cliArgs.config);
    
    process.stdout.write('\n');
    process.stdout.write('================================================================================\n');
    process.stdout.write('BRENNPUNKT CONFIGURATION\n');
    process.stdout.write('================================================================================\n\n');
    
    const configPath = cliArgs.config || resolve(process.cwd(), CONFIG_FILE_NAME);
    const configExists = existsSync(configPath);
    
    process.stdout.write(`Config file: ${configPath}\n`);
    process.stdout.write(`Status: ${configExists ? 'Found' : 'Not found (using defaults)'}\n\n`);
    
    process.stdout.write('RESOLVED CONFIGURATION:\n');
    process.stdout.write('--------------------------------------------------------------------------------\n');
    
    const mergedConfig = { ...DEFAULTS, ...fileConfig };
    
    const formatValue = (key: string, value: unknown, isFromFile: boolean) => {
        const source = isFromFile ? '[config file]' : '[default]    ';
        process.stdout.write(`  ${source} ${key.padEnd(15)}: ${JSON.stringify(value)}\n`);
    };
    
    for (const key of Object.keys(DEFAULTS)) {
        const fileValue = fileConfig[key as keyof Config];
        const isFromFile = fileValue !== undefined;
        formatValue(key, mergedConfig[key as keyof Config], isFromFile);
    }
    
    process.stdout.write('\n================================================================================\n');
}

/**
 * Run the coverage analysis with the given configuration.
 * 
 * @param config - Configuration options
 * @param explicitPath - Whether coverage path was explicitly provided by user
 */
function runAnalysis(config: Config, explicitPath: boolean): void {
    let resolvedPath: string;
    
    if (explicitPath && config.coveragePath) {
        // User explicitly provided a path - use it directly
        resolvedPath = resolveCoveragePath(config.coveragePath);
        
        if (!existsSync(resolvedPath)) {
            process.stderr.write(`Error: Could not find coverage file at ${resolvedPath}\n`);
            process.stderr.write('Run tests with coverage first: npm test -- --coverage\n');
            process.exit(1);
        }
    } else {
        // No explicit path - use smart discovery
        const discovered = discoverCoverageFile();
        
        if (!discovered) {
            process.stderr.write('Error: Could not find coverage file\n');
            process.stderr.write('\nSearched locations:\n');
            for (const searchPath of COVERAGE_SEARCH_PATHS) {
                process.stderr.write(`  - ${searchPath}\n`);
            }
            process.stderr.write('\nRun tests with coverage first: npm test -- --coverage\n');
            process.stderr.write('Or specify path explicitly: brennpunkt <path-to-lcov.info>\n');
            process.exit(1);
        }
        
        resolvedPath = discovered.found;
        // Show which file was discovered (helpful for debugging)
        const relativePath = resolvedPath.replace(process.cwd() + '/', '');
        process.stderr.write(`Using coverage file: ${relativePath}\n\n`);
    }

    // Parse options
    let weights: PriorityWeights;
    try {
        weights = parseWeights(config.weights || DEFAULTS.weights!);
    } catch (err) {
        process.stderr.write(`Error: ${(err as Error).message}\n`);
        process.exit(1);
    }

    const options: AnalyzerOptions = {
        coveragePath: resolvedPath,
        weights,
        minLines: config.minLines ?? DEFAULTS.minLines!,
        json: config.json ?? DEFAULTS.json!,
        top: config.top ?? null,
    };

    // Read and parse coverage file
    let lcovContent: string;
    try {
        lcovContent = readFileSync(resolvedPath, 'utf-8');
    } catch (err) {
        process.stderr.write(`Error: Could not read ${resolvedPath}\n`);
        process.stderr.write(`${(err as Error).message}\n`);
        process.exit(1);
    }

    // Parse LCOV data
    const files = parseLcov(lcovContent);

    if (files.length === 0) {
        process.stderr.write('Warning: No coverage data found in the file\n');
        process.exit(0);
    }

    // Analyze coverage
    const result = analyzeCoverage(files, options.weights, options.minLines, options.top);

    // Output results
    if (options.json) {
        process.stdout.write(formatJson(result) + '\n');
    } else {
        process.stdout.write(formatTable(result, options) + '\n');
    }
}

/**
 * Main entry point for the CLI.
 */
function main(): void {
    const program = new Command();

    program
        .name(PROGRAM_NAME)
        .description('Coverage priority analyzer - identify where to focus testing efforts')
        .version(VERSION)
        .argument('[coverage-path]', 'Path to lcov.info file', DEFAULTS.coveragePath)
        .option('-w, --weights <weights>', 'Custom weights for branches,functions,lines', DEFAULTS.weights)
        .option('-m, --min-lines <number>', 'Exclude files with fewer than N lines', String(DEFAULTS.minLines))
        .option('-j, --json', 'Output as JSON', DEFAULTS.json)
        .option('-t, --top <number>', 'Show only top N priority files')
        .option('-c, --config <path>', 'Path to configuration file', CONFIG_FILE_NAME)
        .option('--init-config', 'Generate a default brennpunkt.yaml configuration file')
        .option('--check-config', 'Display resolved configuration and exit');

    program.parse();

    const cliArgs: Args = program.opts<Args>();
    const coveragePath = program.args[0] || cliArgs.coveragePath;

    // Handle --init-config
    if (process.argv.includes('--init-config')) {
        generateConfigFile(cliArgs.config);
        return;
    }

    // Handle --check-config
    if (process.argv.includes('--check-config')) {
        checkConfig(cliArgs);
        return;
    }

    // Read config from file (if exists)
    const fileConfig = readConfigFile(cliArgs.config);

    // Determine if coverage path was explicitly provided
    // (CLI argument takes precedence over config file)
    const explicitPath = Boolean(coveragePath || fileConfig.coveragePath);

    // Parse and validate numeric CLI arguments
    let parsedMinLines: number | undefined;
    let parsedTop: number | undefined;
    
    if (cliArgs.minLines) {
        parsedMinLines = parseInt(cliArgs.minLines, 10);
        if (isNaN(parsedMinLines) || parsedMinLines < 0) {
            process.stderr.write(`Error: --min-lines must be a non-negative number\n`);
            process.exit(1);
        }
    }
    
    if (cliArgs.top) {
        parsedTop = parseInt(cliArgs.top, 10);
        if (isNaN(parsedTop) || parsedTop <= 0) {
            process.stderr.write(`Error: --top must be a positive number\n`);
            process.exit(1);
        }
    }

    // Merge configuration: defaults < file config < CLI args
    const config: Config = {
        ...DEFAULTS,
        ...fileConfig,
        ...(coveragePath && { coveragePath }),
        ...(cliArgs.weights && { weights: cliArgs.weights }),
        ...(parsedMinLines !== undefined && { minLines: parsedMinLines }),
        ...(cliArgs.json !== undefined && { json: cliArgs.json }),
        ...(parsedTop !== undefined && { top: parsedTop }),
    };

    runAnalysis(config, explicitPath);
}

// Only run main when executed directly (not when imported in tests)
// Check if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                          process.env.VITEST === 'true' ||
                          process.argv.some(arg => arg.includes('vitest'));

if (!isTestEnvironment) {
    main();
}
