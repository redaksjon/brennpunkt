/**
 * Estimate Impact Tool - Project coverage if specific files were fully tested
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { calculateOverallCoverage } from '../../analyzer.js';
import type { FileCoverage } from '../../types.js';
import {
    loadProjectConfig,
    loadCoverage,
} from './shared.js';

// ============================================================================
// Tool Definition
// ============================================================================

export const tool: Tool = {
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
};

// ============================================================================
// Tool Handler
// ============================================================================

export async function handler(args: { projectPath: string; files: string[] }) {
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
