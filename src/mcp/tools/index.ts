/**
 * MCP Tools - Exports all tool definitions and handlers
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import * as GetPriorities from './getPriorities.js';
import * as CoverageSummary from './coverageSummary.js';
import * as GetFileCoverage from './getFileCoverage.js';
import * as EstimateImpact from './estimateImpact.js';

// ============================================================================
// All Tools
// ============================================================================

export const tools: Tool[] = [
    GetPriorities.tool,
    CoverageSummary.tool,
    GetFileCoverage.tool,
    EstimateImpact.tool,
];

// ============================================================================
// Tool Handler Router
// ============================================================================

export async function handleToolCall(name: string, args: unknown): Promise<unknown> {
    switch (name) {
        case 'brennpunkt_get_priorities':
            return GetPriorities.handler(args as { projectPath: string; top?: number; minLines?: number });
        case 'brennpunkt_coverage_summary':
            return CoverageSummary.handler(args as { projectPath: string });
        case 'brennpunkt_get_file_coverage':
            return GetFileCoverage.handler(args as { projectPath: string; file: string });
        case 'brennpunkt_estimate_impact':
            return EstimateImpact.handler(args as { projectPath: string; files: string[] });
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
