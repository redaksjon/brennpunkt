/**
 * MCP Prompts Module
 * 
 * Workflow templates for coverage improvement.
 */

import type { McpPrompt, McpPromptMessage } from './types';
import { buildCoverageUri, buildPrioritiesUri, buildQuickWinsUri } from './uri';

export const prompts: McpPrompt[] = [
    {
        name: 'improve_coverage',
        description: 'Complete workflow to improve test coverage to a target percentage. ' +
            'Analyzes current state, identifies gaps, estimates effort, and provides actionable plan.',
        arguments: [
            {
                name: 'projectPath',
                description: 'Absolute path to the project',
                required: true,
            },
            {
                name: 'targetPercentage',
                description: 'Target coverage percentage (default: 90)',
                required: false,
            },
            {
                name: 'focusMetric',
                description: 'Metric to focus on: lines, branches, or functions (default: lines)',
                required: false,
            },
        ],
    },
    {
        name: 'analyze_gaps',
        description: 'Understand why coverage is below target. ' +
            'Identifies patterns, problematic modules, and root causes.',
        arguments: [
            {
                name: 'projectPath',
                description: 'Absolute path to the project',
                required: true,
            },
            {
                name: 'targetPercentage',
                description: 'Target coverage to compare against (default: 90)',
                required: false,
            },
        ],
    },
    {
        name: 'quick_wins_workflow',
        description: 'Find fast paths to coverage improvement. ' +
            'Identifies small files with high impact, estimates effort and total improvement.',
        arguments: [
            {
                name: 'projectPath',
                description: 'Absolute path to the project',
                required: true,
            },
            {
                name: 'timeConstraint',
                description: 'Time available: quick (5 files), moderate (10 files), thorough (20 files)',
                required: false,
            },
        ],
    },
    {
        name: 'coverage_review',
        description: 'Code review focused on coverage gaps. ' +
            'Analyzes specific files, identifies untested functions/branches, suggests test cases.',
        arguments: [
            {
                name: 'projectPath',
                description: 'Absolute path to the project',
                required: true,
            },
            {
                name: 'filePattern',
                description: 'Filter to specific files (optional)',
                required: false,
            },
        ],
    },
];

export async function handleListPrompts(): Promise<{ prompts: McpPrompt[] }> {
    return { prompts };
}

export async function handleGetPrompt(
    name: string,
    args: Record<string, string>
): Promise<{ messages: McpPromptMessage[] }> {
    const prompt = prompts.find(p => p.name === name);
    
    if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
    }

    // Validate required arguments
    for (const arg of prompt.arguments || []) {
        if (arg.required && !args[arg.name]) {
            throw new Error(`Missing required argument: ${arg.name}`);
        }
    }

    // Generate messages based on prompt type
    switch (name) {
        case 'improve_coverage':
            return generateImproveCoveragePrompt(args);
        case 'analyze_gaps':
            return generateAnalyzeGapsPrompt(args);
        case 'quick_wins_workflow':
            return generateQuickWinsWorkflowPrompt(args);
        case 'coverage_review':
            return generateCoverageReviewPrompt(args);
        default:
            throw new Error(`Prompt handler not implemented: ${name}`);
    }
}

// ============================================================================
// Prompt Generators
// ============================================================================

async function generateImproveCoveragePrompt(
    args: Record<string, string>
): Promise<{ messages: McpPromptMessage[] }> {
    const projectPath = args.projectPath;
    const target = parseFloat(args.targetPercentage || '90');
    const metric = args.focusMetric || 'lines';

    const messages: McpPromptMessage[] = [];

    messages.push({
        role: 'user',
        content: {
            type: 'text',
            text: `I want to improve test coverage for ${projectPath} to ${target}% ${metric} coverage.`,
        },
    });

    let assistantText = `I'll help you improve test coverage to ${target}%.\n\n`;
    assistantText += `**Workflow:**\n`;
    assistantText += `1. Check current coverage: \`brennpunkt_coverage_summary\` with projectPath="${projectPath}"\n`;
    assistantText += `2. Get priorities: \`brennpunkt_get_priorities\` to identify top files\n`;
    assistantText += `3. Estimate impact: \`brennpunkt_estimate_impact\` to verify we'll hit ${target}%\n`;
    assistantText += `4. Write tests for highest priority files\n\n`;
    assistantText += `**Resources available:**\n`;
    assistantText += `- Coverage data: ${buildCoverageUri(projectPath)}\n`;
    assistantText += `- Priorities: ${buildPrioritiesUri(projectPath, { top: 5 })}\n\n`;
    assistantText += `Let me start by checking your current coverage...`;

    messages.push({
        role: 'assistant',
        content: {
            type: 'text',
            text: assistantText,
        },
    });

    return { messages };
}

async function generateAnalyzeGapsPrompt(
    args: Record<string, string>
): Promise<{ messages: McpPromptMessage[] }> {
    const projectPath = args.projectPath;
    const target = parseFloat(args.targetPercentage || '90');

    const messages: McpPromptMessage[] = [];

    messages.push({
        role: 'user',
        content: {
            type: 'text',
            text: `Analyze coverage gaps in ${projectPath}. Why is coverage below ${target}%?`,
        },
    });

    let assistantText = `I'll analyze coverage gaps to understand the patterns.\n\n`;
    assistantText += `**Analysis Plan:**\n`;
    assistantText += `1. Get current coverage summary: \`brennpunkt_coverage_summary\`\n`;
    assistantText += `2. Examine top priority files: \`brennpunkt_get_priorities\` with top=10\n`;
    assistantText += `3. Look for patterns:\n`;
    assistantText += `   - Are gaps in specific modules?\n`;
    assistantText += `   - Common issue (branches, functions, lines)?\n`;
    assistantText += `   - Error handling missing?\n`;
    assistantText += `   - Edge cases untested?\n\n`;
    assistantText += `**Resources:**\n`;
    assistantText += `- Full coverage: ${buildCoverageUri(projectPath)}\n`;
    assistantText += `- Priority analysis: ${buildPrioritiesUri(projectPath, { top: 10 })}\n\n`;
    assistantText += `Let me examine the coverage data...`;

    messages.push({
        role: 'assistant',
        content: {
            type: 'text',
            text: assistantText,
        },
    });

    return { messages };
}

async function generateQuickWinsWorkflowPrompt(
    args: Record<string, string>
): Promise<{ messages: McpPromptMessage[] }> {
    const projectPath = args.projectPath;
    const constraint = args.timeConstraint || 'moderate';
    
    const fileCount = constraint === 'quick' ? 5 : constraint === 'thorough' ? 20 : 10;

    const messages: McpPromptMessage[] = [];

    messages.push({
        role: 'user',
        content: {
            type: 'text',
            text: `Find quick wins to improve coverage in ${projectPath}. I have ${constraint} time available.`,
        },
    });

    let assistantText = `I'll find ${fileCount} quick wins - small files with high impact.\n\n`;
    assistantText += `**Strategy:**\n`;
    assistantText += `1. Get quick wins: Use resource ${buildQuickWinsUri(projectPath, 100)}\n`;
    assistantText += `2. Estimate total impact: \`brennpunkt_estimate_impact\` with identified files\n`;
    assistantText += `3. Present in priority order with effort estimates\n`;
    assistantText += `4. Suggest test approaches for each\n\n`;
    assistantText += `**Criteria:**\n`;
    assistantText += `- Small files (<100 lines)\n`;
    assistantText += `- High impact potential\n`;
    assistantText += `- Currently have coverage gaps\n\n`;
    assistantText += `Let me identify the quick wins...`;

    messages.push({
        role: 'assistant',
        content: {
            type: 'text',
            text: assistantText,
        },
    });

    return { messages };
}

async function generateCoverageReviewPrompt(
    args: Record<string, string>
): Promise<{ messages: McpPromptMessage[] }> {
    const projectPath = args.projectPath;
    const pattern = args.filePattern || 'highest priority files';

    const messages: McpPromptMessage[] = [];

    messages.push({
        role: 'user',
        content: {
            type: 'text',
            text: `Review coverage for ${pattern} in ${projectPath}. What tests should I write?`,
        },
    });

    let assistantText = `I'll perform a detailed coverage review.\n\n`;
    assistantText += `**Review Process:**\n`;
    assistantText += `1. Get priorities: \`brennpunkt_get_priorities\` to identify files\n`;
    assistantText += `2. For each file:\n`;
    assistantText += `   - Get details: \`brennpunkt_get_file_coverage\`\n`;
    assistantText += `   - Identify untested functions/branches\n`;
    assistantText += `   - Suggest specific test cases\n`;
    assistantText += `3. Prioritize suggestions by impact\n\n`;
    assistantText += `**Resources:**\n`;
    assistantText += `- Priorities: ${buildPrioritiesUri(projectPath, { top: 5 })}\n\n`;
    assistantText += `Let me start the review...`;

    messages.push({
        role: 'assistant',
        content: {
            type: 'text',
            text: assistantText,
        },
    });

    return { messages };
}
