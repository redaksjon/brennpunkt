/**
 * Get Priorities Tool - Rank files by testing priority
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { analyzeFile, calculateOverallCoverage } from '../../analyzer.js';
import type { FileCoverage } from '../../types.js';
import {
    loadProjectConfig,
    loadCoverage,
    generateReason,
    generateSuggestedFocus,
    DEFAULT_WEIGHTS,
    type PriorityResult,
    type PriorityWeights,
} from './shared.js';

// ============================================================================
// Tool Definition
// ============================================================================

export const tool: Tool = {
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
};

// ============================================================================
// Helper Functions
// ============================================================================

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
// Tool Handler
// ============================================================================

export async function handler(args: { projectPath: string; top?: number; minLines?: number }) {
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
