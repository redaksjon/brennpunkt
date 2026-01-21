/**
 * Coverage Summary Tool - Get overall project coverage status
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { calculateOverallCoverage } from '../../analyzer.js';
import {
    loadProjectConfig,
    loadCoverage,
    DEFAULT_WEIGHTS,
} from './shared.js';
import { getPriorities } from './getPriorities.js';

// ============================================================================
// Tool Definition
// ============================================================================

export const tool: Tool = {
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
};

// ============================================================================
// Tool Handler
// ============================================================================

export async function handler(args: { projectPath: string }) {
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
