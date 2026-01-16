/**
 * Brennpunkt - Coverage Priority Analyzer
 * 
 * Public API exports for programmatic usage.
 */

export { parseLcov } from './parser';
export { analyzeCoverage, analyzeFile, calculateOverallCoverage } from './analyzer';
export { formatTable, formatJson } from './formatter';
export type {
    PriorityWeights,
    AnalyzerOptions,
    LcovFileData,
    CoverageMetric,
    OverallCoverage,
    AnalyzedFile,
    AnalysisResult,
} from './types';
