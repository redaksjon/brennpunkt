/**
 * MCP Prompt Handlers
 *
 * Provides workflow templates via MCP prompts.
 * Prompts are loaded from external markdown files in this directory.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { McpPrompt, McpPromptMessage } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper to resolve the prompts directory path
 * When bundled, the MCP server is at dist/mcp/server.js and prompts are at dist/mcp/prompts/
 * When running from source, prompts are at src/mcp/prompts/
 */
function getPromptsDir(): string {
    // Check if we're running from a bundled file
    // When bundled, server.js is at dist/mcp/server.js, so __dirname is dist/mcp
    // Prompts are at dist/mcp/prompts/ (same directory level as server.js)
    const isBundled = __dirname.includes('/dist') || __dirname.includes('\\dist') ||
                      __filename.includes('dist/mcp/server.js') || __filename.includes('dist\\mcp\\server.js');

    if (isBundled) {
        // Check if __dirname already ends with 'mcp' (most common case)
        // This handles: dist/mcp, node_modules/.../dist/mcp, etc.
        if (__dirname.endsWith('mcp') || __dirname.endsWith('mcp/') || __dirname.endsWith('mcp\\')) {
            // Already in mcp directory, prompts are in prompts/ subdirectory
            return resolve(__dirname, 'prompts');
        }
        // Check if __dirname contains /mcp/ or \mcp\ (handles nested paths)
        if (__dirname.includes('/mcp/') || __dirname.includes('\\mcp\\')) {
            // Extract path up to and including 'mcp', then add 'prompts'
            const mcpIndex = Math.max(__dirname.lastIndexOf('/mcp/'), __dirname.lastIndexOf('\\mcp\\'));
            if (mcpIndex !== -1) {
                const basePath = __dirname.substring(0, mcpIndex + 4); // +4 for '/mcp'
                return resolve(basePath, 'prompts');
            }
        }
        // Fallback: assume we're in dist/mcp, resolve prompts from here
        return resolve(__dirname, 'prompts');
    }
    // When running from source, prompts are in the same directory as this file
    return __dirname;
}

/**
 * Helper to load a prompt template from a markdown file
 */
function loadTemplate(name: string): string {
    const promptsDir = getPromptsDir();
    const path = resolve(promptsDir, `${name}.md`);
    try {
        return readFileSync(path, 'utf-8').trim();
    } catch (error) {
        throw new Error(`Failed to load prompt template "${name}" from ${path}: ${error}`);
    }
}

/**
 * Helper to replace placeholders in a template
 */
function fillTemplate(template: string, args: Record<string, string>): string {
    return template.replace(/\${(\w+)}/g, (_, key) => {
        return args[key] || `[${key}]`;
    });
}

/**
 * Get all available prompts
 */
export function getPrompts(): McpPrompt[] {
    return [
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
}

/**
 * Get a prompt by name
 */
export async function getPrompt(
    name: string,
    args: Record<string, string>
): Promise<McpPromptMessage[]> {
    // Validate prompt exists
    const prompts = getPrompts();
    if (!prompts.find(p => p.name === name)) {
        throw new Error(`Unknown prompt: ${name}`);
    }

    // Load and fill template
    const template = loadTemplate(name);

    // Set default values for common arguments if missing
    const filledArgs = { ...args };
    if (name === 'improve_coverage') {
        if (!filledArgs.targetPercentage) filledArgs.targetPercentage = '90';
        if (!filledArgs.focusMetric) filledArgs.focusMetric = 'lines';
    }
    if (name === 'analyze_gaps' && !filledArgs.targetPercentage) {
        filledArgs.targetPercentage = '90';
    }
    if (name === 'quick_wins_workflow' && !filledArgs.timeConstraint) {
        filledArgs.timeConstraint = 'moderate';
    }
    if (name === 'coverage_review' && !filledArgs.filePattern) {
        filledArgs.filePattern = 'highest priority files';
    }

    const content = fillTemplate(template, filledArgs);

    return [
        {
            role: 'user',
            content: {
                type: 'text',
                text: content,
            },
        },
    ];
}
