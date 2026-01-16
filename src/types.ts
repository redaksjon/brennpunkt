/**
 * Type definitions for the coverage priority analyzer
 */

/**
 * Weights used to calculate priority scores
 */
export interface PriorityWeights {
    branches: number;
    functions: number;
    lines: number;
}

/**
 * Command-line options
 */
export interface AnalyzerOptions {
    coveragePath: string;
    weights: PriorityWeights;
    minLines: number;
    json: boolean;
    top: number | null;
}

/**
 * Raw coverage data parsed from LCOV file for a single source file
 */
export interface LcovFileData {
    file: string;
    linesFound: number;
    linesHit: number;
    functionsFound: number;
    functionsHit: number;
    branchesFound: number;
    branchesHit: number;
}

/**
 * Coverage metrics for a specific type (lines, functions, or branches)
 */
export interface CoverageMetric {
    found: number;
    hit: number;
    coverage: number;
}

/**
 * Overall coverage summary across all files
 */
export interface OverallCoverage {
    lines: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
    fileCount: number;
}

/**
 * Analyzed file data with coverage percentages and priority score
 */
export interface AnalyzedFile {
    file: string;
    lines: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
    priorityScore: number;
    uncoveredLines: number;
    uncoveredBranches: number;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
    overall: OverallCoverage;
    files: AnalyzedFile[];
}

/**
 * File coverage data used by MCP server
 * (Alias for LcovFileData for backwards compatibility)
 */
export type FileCoverage = LcovFileData;
