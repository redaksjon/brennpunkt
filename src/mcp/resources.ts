/**
 * MCP Resources Module
 * 
 * Implements the Resources capability for Brennpunkt.
 * Provides read-only access to coverage data, priorities, and configuration.
 */

import type { McpResource, McpResourceTemplate, McpResourceContents } from './types';
import { parseUri, buildCoverageUri, buildFileUri, buildPrioritiesUri, buildConfigUri, buildQuickWinsUri } from './uri';
import { loadProjectConfig, loadCoverage, generateSuggestedFocus, DEFAULT_WEIGHTS } from './tools/shared.js';
import { getPriorities } from './tools/getPriorities.js';
import { calculateOverallCoverage } from '../analyzer.js';
import type { FileCoverage } from '../types.js';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

// Resource templates
export const resourceTemplates: McpResourceTemplate[] = [
    {
        uriTemplate: 'brennpunkt://coverage/{projectPath}',
        name: 'Coverage Report',
        description: 'Full coverage data for a project',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'brennpunkt://file/{projectPath}/{filePath}',
        name: 'File Coverage',
        description: 'Detailed coverage for a specific file',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'brennpunkt://priorities?project={projectPath}',
        name: 'Priority List',
        description: 'Files ranked by testing priority',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'brennpunkt://config/{projectPath}',
        name: 'Project Configuration',
        description: 'Brennpunkt configuration for a project',
        mimeType: 'application/json',
    },
    {
        uriTemplate: 'brennpunkt://quick-wins?project={projectPath}',
        name: 'Quick Wins',
        description: 'Small files with high impact potential',
        mimeType: 'application/json',
    },
];

export async function handleListResources(): Promise<{
    resources: McpResource[];
    resourceTemplates?: McpResourceTemplate[];
}> {
    return {
        resources: [],
        resourceTemplates,
    };
}

export async function handleReadResource(uri: string): Promise<McpResourceContents> {
    const parsed = parseUri(uri);

    switch (parsed.resourceType) {
        case 'coverage':
            return readCoverageResource(parsed.projectPath!);
        case 'file':
            return readFileResource(parsed.projectPath!, parsed.filePath!);
        case 'priorities':
            return readPrioritiesResource(parsed.projectPath!, parsed.params);
        case 'config':
            return readConfigResource(parsed.projectPath!);
        case 'quick-wins':
            return readQuickWinsResource(parsed.projectPath!, parsed.params);
        default:
            throw new Error(`Unknown resource type: ${parsed.resourceType}`);
    }
}

// ============================================================================
// Resource Readers
// ============================================================================

async function readCoverageResource(projectPath: string): Promise<McpResourceContents> {
    const config = loadProjectConfig(projectPath);
    const files = loadCoverage(projectPath, config);
    const overall = calculateOverallCoverage(files);

    const uri = buildCoverageUri(resolve(projectPath));
    const data = {
        projectPath: resolve(projectPath),
        configUsed: existsSync(resolve(projectPath, 'brennpunkt.yaml')) 
            ? 'brennpunkt.yaml' 
            : 'defaults',
        overall: {
            lines: overall.lines.coverage,
            functions: overall.functions.coverage,
            branches: overall.branches.coverage,
            fileCount: overall.fileCount,
        },
        files: files.map((f: FileCoverage) => ({
            file: f.file,
            lines: {
                hit: f.linesHit,
                found: f.linesFound,
                coverage: f.linesFound > 0 ? (f.linesHit / f.linesFound) * 100 : 100,
            },
            functions: {
                hit: f.functionsHit,
                found: f.functionsFound,
                coverage: f.functionsFound > 0 ? (f.functionsHit / f.functionsFound) * 100 : 100,
            },
            branches: {
                hit: f.branchesHit,
                found: f.branchesFound,
                coverage: f.branchesFound > 0 ? (f.branchesHit / f.branchesFound) * 100 : 100,
            },
        })),
    };

    return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
    };
}

async function readFileResource(projectPath: string, filePath: string): Promise<McpResourceContents> {
    const config = loadProjectConfig(projectPath);
    const files = loadCoverage(projectPath, config);
    
    const file = files.find((f: FileCoverage) =>
        f.file === filePath ||
        f.file.endsWith(filePath) ||
        filePath.endsWith(f.file)
    );

    if (!file) {
        throw new Error(`File not found in coverage data: ${filePath}`);
    }

    const lineCov = file.linesFound > 0 ? (file.linesHit / file.linesFound) * 100 : 100;
    const funcCov = file.functionsFound > 0 ? (file.functionsHit / file.functionsFound) * 100 : 100;
    const branchCov = file.branchesFound > 0 ? (file.branchesHit / file.branchesFound) * 100 : 100;

    const uri = buildFileUri(resolve(projectPath), filePath);
    const data = {
        projectPath: resolve(projectPath),
        configUsed: existsSync(resolve(projectPath, 'brennpunkt.yaml')) 
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

    return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
    };
}

async function readPrioritiesResource(projectPath: string, params: Record<string, string>): Promise<McpResourceContents> {
    const config = loadProjectConfig(projectPath);
    const files = loadCoverage(projectPath, config);
    
    // Parse query parameters
    const top = params.top ? parseInt(params.top, 10) : (config.top ?? 5);
    const minLines = params.minLines ? parseInt(params.minLines, 10) : (config.minLines ?? 10);
    const weights = config.weights ?? DEFAULT_WEIGHTS;
    
    const priorities = getPriorities(files, top, minLines, weights);
    const overall = calculateOverallCoverage(files);

    const uri = buildPrioritiesUri(resolve(projectPath), { top, minLines });
    const data = {
        projectPath: resolve(projectPath),
        configUsed: existsSync(resolve(projectPath, 'brennpunkt.yaml')) 
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

    return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
    };
}

async function readConfigResource(projectPath: string): Promise<McpResourceContents> {
    const config = loadProjectConfig(projectPath);
    const configPath = resolve(projectPath, 'brennpunkt.yaml');
    const hasConfig = existsSync(configPath);

    const uri = buildConfigUri(resolve(projectPath));
    const data = {
        projectPath: resolve(projectPath),
        configPath,
        hasConfig,
        config: {
            coveragePath: config.coveragePath ?? 'auto-detect',
            weights: config.weights ?? DEFAULT_WEIGHTS,
            minLines: config.minLines ?? 10,
            top: config.top ?? 5,
        },
        source: hasConfig ? 'brennpunkt.yaml' : 'defaults',
    };

    return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
    };
}

async function readQuickWinsResource(projectPath: string, params: Record<string, string>): Promise<McpResourceContents> {
    const config = loadProjectConfig(projectPath);
    const files = loadCoverage(projectPath, config);
    const overall = calculateOverallCoverage(files);
    
    const minLines = config.minLines ?? 10;
    const maxLines = params.maxLines ? parseInt(params.maxLines, 10) : 100;

    // Find quick wins - small files with low coverage
    const quickWins = files
        .filter((f: FileCoverage) => f.linesFound >= minLines && f.linesFound <= maxLines)
        .map((f: FileCoverage) => {
            const uncoveredLines = f.linesFound - f.linesHit;
            const potentialImpact = overall.lines.found > 0
                ? (uncoveredLines / overall.lines.found) * 100
                : 0;
            const currentCoverage = f.linesFound > 0
                ? (f.linesHit / f.linesFound) * 100
                : 100;

            return {
                file: f.file,
                linesTotal: f.linesFound,
                uncoveredLines,
                currentCoverage: Math.round(currentCoverage * 10) / 10,
                potentialImpact: Math.round(potentialImpact * 100) / 100,
            };
        })
        .filter((f: { uncoveredLines: number }) => f.uncoveredLines > 0)
        .sort((a: { potentialImpact: number }, b: { potentialImpact: number }) => b.potentialImpact - a.potentialImpact)
        .slice(0, 10);

    const uri = buildQuickWinsUri(resolve(projectPath), maxLines);
    const data = {
        projectPath: resolve(projectPath),
        configUsed: existsSync(resolve(projectPath, 'brennpunkt.yaml')) 
            ? 'brennpunkt.yaml' 
            : 'defaults',
        criteria: {
            minLines,
            maxLines,
        },
        overall: {
            lines: overall.lines.coverage,
        },
        quickWins,
    };

    return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
    };
}
