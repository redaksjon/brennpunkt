/**
 * Shared types, constants, and utilities for MCP tools
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseLcov } from '../../parser.js';
import type { FileCoverage, PriorityWeights as PriorityWeightsType } from '../../types.js';

// Re-export PriorityWeights type
export type PriorityWeights = PriorityWeightsType;

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry {
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

export interface ConfigCacheEntry {
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

export const COVERAGE_SEARCH_PATHS = [
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

export function generateReason(file: FileCoverage): string {
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
