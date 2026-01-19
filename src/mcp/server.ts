#!/usr/bin/env node
/**
 * Brennpunkt MCP Server
 * 
 * Exposes coverage analysis as MCP tools for AI coding assistants.
 * Instead of running tests repeatedly, AI tools can query existing
 * coverage data for prioritized, actionable insights.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseLcov } from '../parser.js';
import { analyzeFile, calculateOverallCoverage } from '../analyzer.js';
import type { FileCoverage, PriorityWeights } from '../types.js';
import * as Resources from './resources.js';

// ============================================================================
// Types
// ============================================================================

interface CacheEntry {
    data: FileCoverage[];
    mtime: number;
    path: string;
}

export interface ProjectConfig {
    coveragePath?: string;
    weights?: PriorityWeights;
    minLines?: number;
    top?: number;
}

interface ConfigCacheEntry {
    config: ProjectConfig;
    mtime: number;
}

export interface PriorityResult {
    file: string;
    priorityScore: number;
    coverage: {
        lines: number;
        functions: number;
        branches: number;
    };
    uncovered: {
        lines: number;
        branches: number;
        functions: number;
    };
    reason: string;
    suggestedFocus: string;
}

// ============================================================================
// Constants
// ============================================================================

const COVERAGE_SEARCH_PATHS = [
    'coverage/lcov.info',
    '.coverage/lcov.info',
    'coverage/lcov/lcov.info',
    'lcov.info',
    '.nyc_output/lcov.info',
    'test-results/lcov.info',
];

export const DEFAULT_WEIGHTS: PriorityWeights = {
    branches: 0.5,
    functions: 0.3,
    lines: 0.2,
};

export const DEFAULT_CONFIG: ProjectConfig = {
    weights: DEFAULT_WEIGHTS,
    minLines: 10,
};

// ============================================================================
// Coverage Cache (per-project)
// ============================================================================

const MAX_CACHE_SIZE = 50; // Limit memory usage
const cacheByProject: Map<string, CacheEntry> = new Map();
const configCache: Map<string, ConfigCacheEntry> = new Map();

/**
 * Add to cache with size limit (LRU eviction).
 */
function addToCache<T>(cache: Map<string, T>, key: string, value: T): void {
    // Evict oldest entries if at capacity
    if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, value);
}

function findCoverageFile(projectPath: string): string | null {
    for (const relativePath of COVERAGE_SEARCH_PATHS) {
        const absolutePath = resolve(projectPath, relativePath);
        if (existsSync(absolutePath)) {
            return absolutePath;
        }
    }
    return null;
}

// ============================================================================
// Project Configuration Loading
// ============================================================================

/**
 * Load project configuration from brennpunkt.yaml if it exists.
 * Respects the project's configured weights, minLines, coveragePath, etc.
 */
export function loadProjectConfig(projectPath: string): ProjectConfig {
    // Validate project path first
    const validatedPath = validateProjectPath(projectPath);
    const configPath = resolve(validatedPath, 'brennpunkt.yaml');
    
    if (!existsSync(configPath)) {
        return { ...DEFAULT_CONFIG };
    }
    
    const stat = statSync(configPath);
    
    // Check cache
    const cached = configCache.get(configPath);
    if (cached && cached.mtime === stat.mtimeMs) {
        return cached.config;
    }
    
    // Parse YAML config (simple parser for our known format)
    const content = readFileSync(configPath, 'utf-8');
    const config: ProjectConfig = { ...DEFAULT_CONFIG };
    
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;
        
        const key = trimmed.slice(0, colonIndex).trim();
        let value = trimmed.slice(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        
        switch (key) {
            case 'coveragePath':
                config.coveragePath = value;
                break;
            case 'weights': {
                const parts = value.split(',').map(s => parseFloat(s.trim()));
                if (parts.length === 3 && parts.every(n => !isNaN(n))) {
                    config.weights = {
                        branches: parts[0],
                        functions: parts[1],
                        lines: parts[2],
                    };
                }
                break;
            }
            case 'minLines': {
                const num = parseInt(value, 10);
                if (!isNaN(num)) config.minLines = num;
                break;
            }
            case 'top': {
                const num = parseInt(value, 10);
                if (!isNaN(num)) config.top = num;
                break;
            }
        }
    }
    
    // Cache the config (with size limit)
    addToCache(configCache, configPath, { config, mtime: stat.mtimeMs });
    
    return config;
}

/**
 * Validate that the project path is a real directory and doesn't contain
 * suspicious path components.
 */
export function validateProjectPath(projectPath: string): string {
    // Resolve to absolute path
    const resolved = resolve(projectPath);
    
    // Check for path traversal attempts
    if (projectPath.includes('..')) {
        throw new Error('Invalid projectPath: path traversal (..) not allowed');
    }
    
    // Verify it's an existing directory
    if (!existsSync(resolved)) {
        throw new Error(`Project path does not exist: ${resolved}`);
    }
    
    const stat = statSync(resolved);
    if (!stat.isDirectory()) {
        throw new Error(`Project path is not a directory: ${resolved}`);
    }
    
    return resolved;
}

export function loadCoverage(projectPath: string, config: ProjectConfig): FileCoverage[] {
    // Validate and resolve the project path
    const resolvedProjectPath = validateProjectPath(projectPath);
    
    // Find coverage file - use config's coveragePath if set, otherwise search
    const path = config.coveragePath 
        ? resolve(resolvedProjectPath, config.coveragePath)
        : findCoverageFile(resolvedProjectPath);
    
    if (!path) {
        throw new Error(
            `No coverage file found in ${resolvedProjectPath}. ` +
            'Run tests with coverage first: npm test -- --coverage\n' +
            'Searched: ' + COVERAGE_SEARCH_PATHS.join(', ')
        );
    }

    if (!existsSync(path)) {
        throw new Error(`Coverage file not found: ${path}`);
    }

    const stat = statSync(path);
    
    // Check per-project cache
    const cached = cacheByProject.get(path);
    if (cached && cached.mtime === stat.mtimeMs) {
        return cached.data;
    }

    // Parse and cache
    const content = readFileSync(path, 'utf-8');
    const data = parseLcov(content);
    
    // Cache with size limit
    addToCache(cacheByProject, path, {
        data,
        mtime: stat.mtimeMs,
        path,
    });

    return data;
}

// ============================================================================
// Analysis Helpers
// ============================================================================

function generateReason(file: FileCoverage): string {
    const lineCov = file.linesFound > 0 
        ? Math.round((file.linesHit / file.linesFound) * 100) 
        : 100;
    const branchCov = file.branchesFound > 0 
        ? Math.round((file.branchesHit / file.branchesFound) * 100) 
        : 100;
    const funcCov = file.functionsFound > 0 
        ? Math.round((file.functionsHit / file.functionsFound) * 100) 
        : 100;

    const issues: string[] = [];
    
    if (branchCov < 50) {
        issues.push(`${branchCov}% branch coverage (${file.branchesFound - file.branchesHit} untested branches)`);
    }
    if (funcCov < 70) {
        issues.push(`${funcCov}% function coverage (${file.functionsFound - file.functionsHit} untested functions)`);
    }
    if (lineCov < 60) {
        issues.push(`${lineCov}% line coverage`);
    }

    if (issues.length === 0) {
        return 'Moderate coverage gaps across metrics.';
    }

    return issues.join('. ') + '.';
}

export function generateSuggestedFocus(file: FileCoverage): string {
    const branchCov = file.branchesFound > 0 
        ? (file.branchesHit / file.branchesFound) * 100 
        : 100;
    const funcCov = file.functionsFound > 0 
        ? (file.functionsHit / file.functionsFound) * 100 
        : 100;

    if (branchCov < 50) {
        return 'Focus on testing conditional logic, error handling paths, and edge cases.';
    }
    if (funcCov < 70) {
        return 'Focus on testing untested functions - some may be dead code or missing feature tests.';
    }
    return 'Improve general test coverage across the file.';
}

export function getPriorities(
    files: FileCoverage[],
    top: number = 5,
    minLines: number = 10,
    weights: PriorityWeights = DEFAULT_WEIGHTS
): PriorityResult[] {
    const analyzed = files
        .filter(f => f.linesFound >= minLines)
        .map(f => {
            const analysis = analyzeFile(f, weights);
            return {
                file: f.file,
                priorityScore: analysis.priorityScore,
                coverage: {
                    lines: analysis.lines.coverage,
                    functions: analysis.functions.coverage,
                    branches: analysis.branches.coverage,
                },
                uncovered: {
                    lines: f.linesFound - f.linesHit,
                    branches: f.branchesFound - f.branchesHit,
                    functions: f.functionsFound - f.functionsHit,
                },
                reason: generateReason(f),
                suggestedFocus: generateSuggestedFocus(f),
            };
        })
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, top);

    return analyzed;
}

// ============================================================================
// Tool Definitions
// ============================================================================

const tools: Tool[] = [
    {
        name: 'brennpunkt_get_priorities',
        description: 
            'Analyze test coverage and get files ranked by priority for testing. ' +
            'This tool reads EXISTING coverage data (lcov.info) - it does NOT run tests. ' +
            'Works with ANY test framework that produces lcov format: Jest, Vitest, Mocha, c8, NYC/Istanbul, Karma, AVA, Playwright, etc. ' +
            'Use this BEFORE writing tests to know where to focus efforts for maximum coverage impact. ' +
            'Higher priority scores indicate files with larger coverage gaps in more important code. ' +
            'Returns actionable suggestions for each file, not just percentages.',
        inputSchema: {
            type: 'object',
            properties: {
                projectPath: {
                    type: 'string',
                    description: 'Absolute path to the project directory. The tool searches for lcov.info in common locations (coverage/, .coverage/, etc.)',
                },
                top: {
                    type: 'number',
                    description: 'Number of top priority files to return (default: 5)',
                },
                minLines: {
                    type: 'number',
                    description: 'Exclude files with fewer lines than this threshold (default: 10). Helps filter out tiny utility files.',
                },
            },
            required: ['projectPath'],
        },
    },
    {
        name: 'brennpunkt_coverage_summary',
        description: 
            'Get a quick summary of overall project test coverage status. ' +
            'Reads EXISTING coverage data from lcov.info - does NOT run tests. ' +
            'Works with any test framework that produces lcov format (Jest, Vitest, Mocha, c8, NYC, Karma, etc.). ' +
            'Returns: overall percentages for lines/functions/branches, status indicators (ok/warning/critical), ' +
            'the single highest-priority file, and "quick wins" (small files where a few tests would have outsized impact). ' +
            'Use this for a fast overview before diving into specific files.',
        inputSchema: {
            type: 'object',
            properties: {
                projectPath: {
                    type: 'string',
                    description: 'Absolute path to the project directory. The tool searches for lcov.info in common locations.',
                },
            },
            required: ['projectPath'],
        },
    },
    {
        name: 'brennpunkt_get_file_coverage',
        description: 
            'Get detailed test coverage information for a specific source file. ' +
            'Reads EXISTING coverage data - does NOT run tests. ' +
            'Works with any test framework producing lcov format. ' +
            'Returns: exact counts of covered/uncovered lines, functions, and branches, ' +
            'plus actionable suggestions for what to test (e.g., "Focus on error handling paths"). ' +
            'Use this after identifying a high-priority file to understand exactly what needs testing.',
        inputSchema: {
            type: 'object',
            properties: {
                projectPath: {
                    type: 'string',
                    description: 'Absolute path to the project directory.',
                },
                file: {
                    type: 'string',
                    description: 'Path to the source file to analyze. Can be relative to project (src/auth/login.ts) or as it appears in the coverage report.',
                },
            },
            required: ['projectPath', 'file'],
        },
    },
    {
        name: 'brennpunkt_estimate_impact',
        description: 
            'Estimate how much overall coverage would improve if specific files were fully tested. ' +
            'Reads EXISTING coverage data - does NOT run tests. ' +
            'Works with any test framework producing lcov format. ' +
            'Use this for planning: "If I write tests for these 3 files, will I hit 90% coverage?" ' +
            'Returns current coverage, projected coverage after testing the specified files, and the improvement delta.',
        inputSchema: {
            type: 'object',
            properties: {
                projectPath: {
                    type: 'string',
                    description: 'Absolute path to the project directory.',
                },
                files: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of source file paths to estimate impact for. Paths can be relative to project.',
                },
            },
            required: ['projectPath', 'files'],
        },
    },
];

// ============================================================================
// Tool Handlers
// ============================================================================

async function handleGetPriorities(args: { projectPath: string; top?: number; minLines?: number }) {
    // Load project configuration (respects brennpunkt.yaml if present)
    const config = loadProjectConfig(args.projectPath);
    const files = loadCoverage(args.projectPath, config);
    
    // Args override config, config overrides defaults
    const top = args.top ?? config.top ?? 5;
    const minLines = args.minLines ?? config.minLines ?? 10;
    const weights = config.weights ?? DEFAULT_WEIGHTS;
    
    const priorities = getPriorities(files, top, minLines, weights);
    const overall = calculateOverallCoverage(files);

    return {
        projectPath: resolve(args.projectPath),
        configUsed: existsSync(resolve(args.projectPath, 'brennpunkt.yaml')) 
            ? 'brennpunkt.yaml' 
            : 'defaults',
        overall: {
            lines: overall.lines.coverage,
            functions: overall.functions.coverage,
            branches: overall.branches.coverage,
            fileCount: overall.fileCount,
        },
        priorities,
    };
}

async function handleCoverageSummary(args: { projectPath: string }) {
    // Load project configuration
    const config = loadProjectConfig(args.projectPath);
    const files = loadCoverage(args.projectPath, config);
    const overall = calculateOverallCoverage(files);
    
    const minLines = config.minLines ?? 10;
    const weights = config.weights ?? DEFAULT_WEIGHTS;
    const priorities = getPriorities(files, 3, minLines, weights);

    const getStatus = (value: number, target: number) => {
        if (value >= target) return 'ok';
        if (value >= target - 10) return 'warning';
        return 'critical';
    };

    // Find quick wins - small files with low coverage
    const quickWins = files
        .filter(f => f.linesFound >= minLines && f.linesFound <= 100)
        .map(f => ({
            file: f.file,
            uncoveredLines: f.linesFound - f.linesHit,
            potentialImpact: ((f.linesFound - f.linesHit) / overall.lines.found) * 100,
        }))
        .filter(f => f.uncoveredLines > 0)
        .sort((a, b) => b.potentialImpact - a.potentialImpact)
        .slice(0, 3)
        .map(f => `${f.file} - ${f.uncoveredLines} uncovered lines (~${f.potentialImpact.toFixed(1)}% potential impact)`);

    return {
        projectPath: resolve(args.projectPath),
        configUsed: existsSync(resolve(args.projectPath, 'brennpunkt.yaml')) 
            ? 'brennpunkt.yaml' 
            : 'defaults',
        overall: {
            lines: {
                percentage: overall.lines.coverage,
                status: getStatus(overall.lines.coverage, 90),
            },
            functions: {
                percentage: overall.functions.coverage,
                status: getStatus(overall.functions.coverage, 80),
            },
            branches: {
                percentage: overall.branches.coverage,
                status: getStatus(overall.branches.coverage, 80),
            },
        },
        filesAnalyzed: overall.fileCount,
        filesNeedingAttention: priorities.length,
        topPriority: priorities[0] 
            ? `${priorities[0].file} (score: ${priorities[0].priorityScore.toFixed(1)})`
            : 'None - good coverage!',
        quickWins,
    };
}

async function handleGetFileCoverage(args: { projectPath: string; file: string }) {
    // Load project configuration
    const config = loadProjectConfig(args.projectPath);
    const files = loadCoverage(args.projectPath, config);
    
    const file = files.find(f => 
        f.file === args.file || 
        f.file.endsWith(args.file) ||
        args.file.endsWith(f.file)
    );

    if (!file) {
        return {
            error: `File not found in coverage data: ${args.file}`,
            projectPath: resolve(args.projectPath),
            availableFiles: files.slice(0, 10).map(f => f.file),
            hint: 'File paths in coverage data may differ from your project paths.',
        };
    }

    const lineCov = file.linesFound > 0 
        ? (file.linesHit / file.linesFound) * 100 
        : 100;
    const funcCov = file.functionsFound > 0 
        ? (file.functionsHit / file.functionsFound) * 100 
        : 100;
    const branchCov = file.branchesFound > 0 
        ? (file.branchesHit / file.branchesFound) * 100 
        : 100;

    return {
        projectPath: resolve(args.projectPath),
        configUsed: existsSync(resolve(args.projectPath, 'brennpunkt.yaml')) 
            ? 'brennpunkt.yaml' 
            : 'defaults',
        file: file.file,
        coverage: {
            lines: {
                covered: file.linesHit,
                total: file.linesFound,
                percentage: Math.round(lineCov * 10) / 10,
            },
            functions: {
                covered: file.functionsHit,
                total: file.functionsFound,
                percentage: Math.round(funcCov * 10) / 10,
            },
            branches: {
                covered: file.branchesHit,
                total: file.branchesFound,
                percentage: Math.round(branchCov * 10) / 10,
            },
        },
        uncovered: {
            lines: file.linesFound - file.linesHit,
            functions: file.functionsFound - file.functionsHit,
            branches: file.branchesFound - file.branchesHit,
        },
        suggestedFocus: generateSuggestedFocus(file),
    };
}

async function handleEstimateImpact(args: { projectPath: string; files: string[] }) {
    // Load project configuration
    const config = loadProjectConfig(args.projectPath);
    const allFiles = loadCoverage(args.projectPath, config);
    const overall = calculateOverallCoverage(allFiles);

    // Find the requested files
    const targetFiles = args.files
        .map(path => allFiles.find(f => 
            f.file === path || 
            f.file.endsWith(path) ||
            path.endsWith(f.file)
        ))
        .filter((f): f is FileCoverage => f !== undefined);

    if (targetFiles.length === 0) {
        return {
            error: 'None of the specified files found in coverage data',
            projectPath: resolve(args.projectPath),
            requestedFiles: args.files,
        };
    }

    // Calculate potential improvement if these files were 100% covered
    const additionalLines = targetFiles.reduce(
        (sum, f) => sum + (f.linesFound - f.linesHit), 
        0
    );
    const additionalFunctions = targetFiles.reduce(
        (sum, f) => sum + (f.functionsFound - f.functionsHit), 
        0
    );
    const additionalBranches = targetFiles.reduce(
        (sum, f) => sum + (f.branchesFound - f.branchesHit), 
        0
    );

    const newLineCoverage = overall.lines.found > 0
        ? ((overall.lines.hit + additionalLines) / overall.lines.found) * 100
        : 100;
    const newFuncCoverage = overall.functions.found > 0
        ? ((overall.functions.hit + additionalFunctions) / overall.functions.found) * 100
        : 100;
    const newBranchCoverage = overall.branches.found > 0
        ? ((overall.branches.hit + additionalBranches) / overall.branches.found) * 100
        : 100;

    const lineImprovement = newLineCoverage - overall.lines.coverage;
    const funcImprovement = newFuncCoverage - overall.functions.coverage;
    const branchImprovement = newBranchCoverage - overall.branches.coverage;

    return {
        projectPath: resolve(args.projectPath),
        configUsed: existsSync(resolve(args.projectPath, 'brennpunkt.yaml')) 
            ? 'brennpunkt.yaml' 
            : 'defaults',
        filesAnalyzed: targetFiles.map(f => f.file),
        currentCoverage: {
            lines: Math.round(overall.lines.coverage * 10) / 10,
            functions: Math.round(overall.functions.coverage * 10) / 10,
            branches: Math.round(overall.branches.coverage * 10) / 10,
        },
        estimatedCoverage: {
            lines: Math.round(newLineCoverage * 10) / 10,
            functions: Math.round(newFuncCoverage * 10) / 10,
            branches: Math.round(newBranchCoverage * 10) / 10,
        },
        improvement: {
            lines: `+${lineImprovement.toFixed(1)}%`,
            functions: `+${funcImprovement.toFixed(1)}%`,
            branches: `+${branchImprovement.toFixed(1)}%`,
        },
        additionalCoverage: {
            lines: additionalLines,
            functions: additionalFunctions,
            branches: additionalBranches,
        },
    };
}

// ============================================================================
// Server Setup
// ============================================================================

async function main() {
    const server = new Server(
        {
            name: 'brennpunkt',
            version: '0.1.0',
            // Server-level description for AI tools discovering this MCP server
            description: 
                'Test coverage priority analyzer. Reads lcov.info coverage data (produced by Jest, Vitest, Mocha, c8, NYC, Karma, Playwright, or any lcov-compatible tool) and ranks files by testing priority. ' +
                'Use this to identify WHERE to focus testing efforts for maximum coverage impact WITHOUT running tests. ' +
                'Provides actionable insights: priority scores, coverage gaps, and specific suggestions for each file.',
        },
        {
            capabilities: {
                tools: {},
                resources: {
                    subscribe: false,
                    listChanged: false,
                },
                prompts: {
                    listChanged: false,
                },
            },
        }
    );

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools,
    }));

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            let result: unknown;

            switch (name) {
                case 'brennpunkt_get_priorities':
                    result = await handleGetPriorities(args as { projectPath: string; top?: number; minLines?: number });
                    break;
                case 'brennpunkt_coverage_summary':
                    result = await handleCoverageSummary(args as { projectPath: string });
                    break;
                case 'brennpunkt_get_file_coverage':
                    result = await handleGetFileCoverage(args as { projectPath: string; file: string });
                    break;
                case 'brennpunkt_estimate_impact':
                    result = await handleEstimateImpact(args as { projectPath: string; files: string[] });
                    break;
                default:
                    return {
                        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                        isError: true,
                    };
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                content: [{ type: 'text', text: `Error: ${message}` }],
                isError: true,
            };
        }
    });

    // List resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return Resources.handleListResources();
    });

    // Read resource
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        try {
            const contents = await Resources.handleReadResource(uri);
            return { contents: [contents] };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read resource ${uri}: ${message}`);
        }
    });

    // Start server
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
