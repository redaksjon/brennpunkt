/**
 * URI Parser for Brennpunkt MCP Resources
 * 
 * Handles parsing and construction of brennpunkt:// URIs.
 * 
 * URI Schemes:
 * - brennpunkt://coverage/{projectPath}
 * - brennpunkt://file/{projectPath}/{filePath}
 * - brennpunkt://priorities?project={path}&top={n}
 * - brennpunkt://config/{projectPath}
 * - brennpunkt://quick-wins?project={path}&maxLines={n}
 */

import type { ParsedResourceUri, ResourceType } from './types';

const SCHEME = 'brennpunkt';

export function parseUri(uri: string): ParsedResourceUri {
    if (!uri.startsWith(`${SCHEME}://`)) {
        throw new Error(`Invalid URI scheme: ${uri}. Expected ${SCHEME}://`);
    }

    const withoutScheme = uri.substring(`${SCHEME}://`.length);
    const [pathPart, queryPart] = withoutScheme.split('?');
    // Don't filter empty segments - they indicate absolute paths
    const segments = pathPart.split('/');

    if (segments.length === 0 || !segments[0]) {
        throw new Error(`Invalid URI: ${uri}. No resource type specified.`);
    }

    const resourceType = segments[0] as ResourceType;
    const params = parseQueryParams(queryPart);

    switch (resourceType) {
        case 'coverage':
            return parseCoverageUri(segments, params);
        case 'file':
            return parseFileUri(segments, params);
        case 'priorities':
            return parsePrioritiesUri(params);
        case 'config':
            return parseConfigUri(segments, params);
        case 'quick-wins':
            return parseQuickWinsUri(params);
        default:
            throw new Error(`Unknown resource type: ${resourceType}`);
    }
}

function parseQueryParams(queryPart?: string): Record<string, string> {
    if (!queryPart) return {};
    const params: Record<string, string> = {};
    const pairs = queryPart.split('&');
    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value !== undefined) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
    }
    return params;
}

function parseCoverageUri(segments: string[], params: Record<string, string>): ParsedResourceUri {
    // segments[0] is 'coverage', segments[1] onwards is the path
    // For absolute paths: brennpunkt://coverage//Users/dev/project
    // segments = ['coverage', '', 'Users', 'dev', 'project']
    // If segments[1] is empty, path started with / (absolute)
    const pathSegments = segments.slice(1);
    let projectPath: string;
    
    if (pathSegments.length === 0) {
        throw new Error('Coverage URI requires project path');
    }
    
    if (pathSegments[0] === '') {
        // Absolute path
        projectPath = '/' + pathSegments.slice(1).join('/');
    } else {
        // Relative path
        projectPath = pathSegments.join('/');
    }
    
    if (!projectPath || projectPath === '/') {
        throw new Error('Coverage URI requires project path');
    }
    
    return {
        scheme: SCHEME,
        resourceType: 'coverage',
        projectPath: decodeURIComponent(projectPath),
        params,
    };
}

function parseFileUri(segments: string[], params: Record<string, string>): ParsedResourceUri {
    // segments[0] is 'file'
    // With the new builder: brennpunkt://file/{fullyEncodedProject}/{filePathWithSlashes}
    // Example: brennpunkt://file/%2FUsers%2Fdev%2Fproject/src/index.ts
    // segments = ['file', '%2FUsers%2Fdev%2Fproject', 'src', 'index.ts']
    
    if (segments.length < 3) {
        throw new Error('File URI requires project path and file path');
    }
    
    const projectPath = decodeURIComponent(segments[1]);
    const filePath = segments.slice(2).join('/');
    
    return {
        scheme: SCHEME,
        resourceType: 'file',
        projectPath: decodeURIComponent(projectPath),
        filePath: decodeURIComponent(filePath),
        params,
    };
}

function parsePrioritiesUri(params: Record<string, string>): ParsedResourceUri {
    const projectPath = params.project;
    if (!projectPath) {
        throw new Error('Priorities URI requires project parameter');
    }
    return {
        scheme: SCHEME,
        resourceType: 'priorities',
        projectPath,
        params,
    };
}

function parseConfigUri(segments: string[], params: Record<string, string>): ParsedResourceUri {
    // segments[0] is 'config', segments[1] onwards is the path
    // For absolute paths: brennpunkt://config//Users/dev/project
    // segments = ['config', '', 'Users', 'dev', 'project']
    // If segments[1] is empty, path started with / (absolute)
    const pathSegments = segments.slice(1);
    let projectPath: string;
    
    if (pathSegments.length === 0) {
        throw new Error('Config URI requires project path');
    }
    
    if (pathSegments[0] === '') {
        // Absolute path
        projectPath = '/' + pathSegments.slice(1).join('/');
    } else {
        // Relative path
        projectPath = pathSegments.join('/');
    }
    
    if (!projectPath || projectPath === '/') {
        throw new Error('Config URI requires project path');
    }
    
    return {
        scheme: SCHEME,
        resourceType: 'config',
        projectPath: decodeURIComponent(projectPath),
        params,
    };
}

function parseQuickWinsUri(params: Record<string, string>): ParsedResourceUri {
    const projectPath = params.project;
    if (!projectPath) {
        throw new Error('Quick wins URI requires project parameter');
    }
    return {
        scheme: SCHEME,
        resourceType: 'quick-wins',
        projectPath,
        params,
    };
}

// ============================================================================
// URI Builders
// ============================================================================

export function buildCoverageUri(projectPath: string): string {
    return `${SCHEME}://coverage/${encodeURIComponent(projectPath).replace(/%2F/g, '/')}`;
}

export function buildFileUri(projectPath: string, filePath: string): string {
    // Encode project path fully (including slashes) to avoid ambiguity
    const encodedProject = encodeURIComponent(projectPath);
    const encodedFile = encodeURIComponent(filePath).replace(/%2F/g, '/');
    return `${SCHEME}://file/${encodedProject}/${encodedFile}`;
}

export function buildPrioritiesUri(projectPath: string, options?: { top?: number; minLines?: number }): string {
    const params = new URLSearchParams();
    params.set('project', projectPath);
    if (options?.top) params.set('top', String(options.top));
    if (options?.minLines) params.set('minLines', String(options.minLines));
    return `${SCHEME}://priorities?${params.toString()}`;
}

export function buildConfigUri(projectPath: string): string {
    return `${SCHEME}://config/${encodeURIComponent(projectPath).replace(/%2F/g, '/')}`;
}

export function buildQuickWinsUri(projectPath: string, maxLines?: number): string {
    const params = new URLSearchParams();
    params.set('project', projectPath);
    if (maxLines) params.set('maxLines', String(maxLines));
    return `${SCHEME}://quick-wins?${params.toString()}`;
}

export function isBrenppunktUri(uri: string): boolean {
    return uri.startsWith(`${SCHEME}://`);
}

export function getResourceType(uri: string): ResourceType | null {
    if (!isBrenppunktUri(uri)) return null;
    const withoutScheme = uri.substring(`${SCHEME}://`.length);
    const firstSegment = withoutScheme.split('/')[0].split('?')[0];
    return firstSegment as ResourceType;
}
