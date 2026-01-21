/**
 * Get File Coverage Tool - Detailed coverage for a specific file
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import {
    loadProjectConfig,
    loadCoverage,
    generateSuggestedFocus,
} from './shared.js';

// ============================================================================
// Tool Definition
// ============================================================================

export const tool: Tool = {
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
};

// ============================================================================
// Tool Handler
// ============================================================================

export async function handler(args: { projectPath: string; file: string }) {
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
