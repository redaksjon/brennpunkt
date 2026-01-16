/**
 * Coverage analysis and priority scoring
 */

import type { 
    LcovFileData, 
    PriorityWeights, 
    OverallCoverage, 
    AnalyzedFile,
    AnalysisResult 
} from './types';

/**
 * Calculate overall coverage statistics from all files.
 * This aggregates totals before any filtering is applied.
 * 
 * @param files - Array of parsed LCOV file data
 * @returns Overall coverage summary
 */
export function calculateOverallCoverage(files: LcovFileData[]): OverallCoverage {
    const totals = files.reduce((acc, f) => ({
        linesFound: acc.linesFound + f.linesFound,
        linesHit: acc.linesHit + f.linesHit,
        functionsFound: acc.functionsFound + f.functionsFound,
        functionsHit: acc.functionsHit + f.functionsHit,
        branchesFound: acc.branchesFound + f.branchesFound,
        branchesHit: acc.branchesHit + f.branchesHit,
    }), {
        linesFound: 0,
        linesHit: 0,
        functionsFound: 0,
        functionsHit: 0,
        branchesFound: 0,
        branchesHit: 0,
    });

    return {
        lines: {
            found: totals.linesFound,
            hit: totals.linesHit,
            coverage: totals.linesFound > 0 
                ? Math.round((totals.linesHit / totals.linesFound) * 10000) / 100 
                : 100,
        },
        functions: {
            found: totals.functionsFound,
            hit: totals.functionsHit,
            coverage: totals.functionsFound > 0 
                ? Math.round((totals.functionsHit / totals.functionsFound) * 10000) / 100 
                : 100,
        },
        branches: {
            found: totals.branchesFound,
            hit: totals.branchesHit,
            coverage: totals.branchesFound > 0 
                ? Math.round((totals.branchesHit / totals.branchesFound) * 10000) / 100 
                : 100,
        },
        fileCount: files.length,
    };
}

/**
 * Calculate coverage percentages and priority score for a single file.
 * 
 * Priority scoring logic:
 * - Higher score = higher priority for testing
 * - Based on coverage gaps (100 - coverage%) for each metric
 * - Weighted by the provided weights (default: branches 0.5, functions 0.3, lines 0.2)
 * - Scaled by file size (log10) so larger files with low coverage rank higher
 * 
 * @param file - Parsed LCOV data for a single file
 * @param weights - Weights for each coverage type
 * @returns Analyzed file with coverage percentages and priority score
 */
export function analyzeFile(file: LcovFileData, weights: PriorityWeights): AnalyzedFile {
    const lineCoverage = file.linesFound > 0 
        ? (file.linesHit / file.linesFound) * 100 
        : 100;
    
    const functionCoverage = file.functionsFound > 0 
        ? (file.functionsHit / file.functionsFound) * 100 
        : 100;
    
    const branchCoverage = file.branchesFound > 0 
        ? (file.branchesHit / file.branchesFound) * 100 
        : 100;

    // Priority score: lower coverage = higher priority (inverted)
    // Weighted combination of coverage gaps
    const lineGap = 100 - lineCoverage;
    const functionGap = 100 - functionCoverage;
    const branchGap = 100 - branchCoverage;

    // Factor in file size - bigger files with low coverage = more important
    const sizeFactor = Math.log10(Math.max(file.linesFound, 1) + 1);

    const priorityScore = (
        (branchGap * weights.branches) +
        (functionGap * weights.functions) +
        (lineGap * weights.lines)
    ) * sizeFactor;

    return {
        file: file.file,
        lines: {
            found: file.linesFound,
            hit: file.linesHit,
            coverage: Math.round(lineCoverage * 100) / 100,
        },
        functions: {
            found: file.functionsFound,
            hit: file.functionsHit,
            coverage: Math.round(functionCoverage * 100) / 100,
        },
        branches: {
            found: file.branchesFound,
            hit: file.branchesHit,
            coverage: Math.round(branchCoverage * 100) / 100,
        },
        priorityScore: Math.round(priorityScore * 100) / 100,
        uncoveredLines: file.linesFound - file.linesHit,
        uncoveredBranches: file.branchesFound - file.branchesHit,
    };
}

/**
 * Perform complete coverage analysis on LCOV data.
 * 
 * @param files - Array of parsed LCOV file data
 * @param weights - Priority weights for scoring
 * @param minLines - Minimum lines threshold for including a file
 * @param top - Optional limit on number of results
 * @returns Complete analysis result with overall and per-file data
 */
export function analyzeCoverage(
    files: LcovFileData[],
    weights: PriorityWeights,
    minLines: number,
    top: number | null
): AnalysisResult {
    // Calculate overall coverage from ALL files (before filtering)
    const overall = calculateOverallCoverage(files);
    
    // Filter and analyze
    const analyzed = files
        .filter(f => f.linesFound >= minLines)
        .map(f => analyzeFile(f, weights))
        .sort((a, b) => b.priorityScore - a.priorityScore);

    // Apply top limit if specified
    const results = top ? analyzed.slice(0, top) : analyzed;

    return {
        overall,
        files: results,
    };
}
