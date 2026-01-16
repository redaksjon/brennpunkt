import { describe, it, expect } from 'vitest';
import { calculateOverallCoverage, analyzeFile, analyzeCoverage } from '../src/analyzer';
import type { LcovFileData, PriorityWeights } from '../src/types';

describe('calculateOverallCoverage', () => {
    it('should calculate totals from multiple files', () => {
        const files: LcovFileData[] = [
            {
                file: 'src/file1.ts',
                linesFound: 100,
                linesHit: 80,
                functionsFound: 10,
                functionsHit: 8,
                branchesFound: 20,
                branchesHit: 15,
            },
            {
                file: 'src/file2.ts',
                linesFound: 50,
                linesHit: 40,
                functionsFound: 5,
                functionsHit: 4,
                branchesFound: 10,
                branchesHit: 8,
            },
        ];

        const result = calculateOverallCoverage(files);

        expect(result.fileCount).toBe(2);
        expect(result.lines.found).toBe(150);
        expect(result.lines.hit).toBe(120);
        expect(result.lines.coverage).toBe(80);
        expect(result.functions.found).toBe(15);
        expect(result.functions.hit).toBe(12);
        expect(result.functions.coverage).toBe(80);
        expect(result.branches.found).toBe(30);
        expect(result.branches.hit).toBe(23);
        expect(result.branches.coverage).toBeCloseTo(76.67, 1);
    });

    it('should handle empty file list', () => {
        const result = calculateOverallCoverage([]);

        expect(result.fileCount).toBe(0);
        expect(result.lines.found).toBe(0);
        expect(result.lines.hit).toBe(0);
        expect(result.lines.coverage).toBe(100);
    });

    it('should return 100% coverage when no lines found', () => {
        const files: LcovFileData[] = [
            {
                file: 'src/empty.ts',
                linesFound: 0,
                linesHit: 0,
                functionsFound: 0,
                functionsHit: 0,
                branchesFound: 0,
                branchesHit: 0,
            },
        ];

        const result = calculateOverallCoverage(files);

        expect(result.lines.coverage).toBe(100);
        expect(result.functions.coverage).toBe(100);
        expect(result.branches.coverage).toBe(100);
    });
});

describe('analyzeFile', () => {
    const defaultWeights: PriorityWeights = {
        branches: 0.5,
        functions: 0.3,
        lines: 0.2,
    };

    it('should calculate coverage percentages correctly', () => {
        const file: LcovFileData = {
            file: 'src/test.ts',
            linesFound: 100,
            linesHit: 80,
            functionsFound: 10,
            functionsHit: 7,
            branchesFound: 20,
            branchesHit: 12,
        };

        const result = analyzeFile(file, defaultWeights);

        expect(result.file).toBe('src/test.ts');
        expect(result.lines.coverage).toBe(80);
        expect(result.functions.coverage).toBe(70);
        expect(result.branches.coverage).toBe(60);
        expect(result.uncoveredLines).toBe(20);
        expect(result.uncoveredBranches).toBe(8);
    });

    it('should calculate higher priority score for low coverage', () => {
        const lowCoverageFile: LcovFileData = {
            file: 'src/low.ts',
            linesFound: 100,
            linesHit: 20,
            functionsFound: 10,
            functionsHit: 2,
            branchesFound: 20,
            branchesHit: 4,
        };

        const highCoverageFile: LcovFileData = {
            file: 'src/high.ts',
            linesFound: 100,
            linesHit: 95,
            functionsFound: 10,
            functionsHit: 10,
            branchesFound: 20,
            branchesHit: 19,
        };

        const lowResult = analyzeFile(lowCoverageFile, defaultWeights);
        const highResult = analyzeFile(highCoverageFile, defaultWeights);

        expect(lowResult.priorityScore).toBeGreaterThan(highResult.priorityScore);
    });

    it('should factor in file size (larger files = higher priority)', () => {
        const smallFile: LcovFileData = {
            file: 'src/small.ts',
            linesFound: 10,
            linesHit: 5,
            functionsFound: 2,
            functionsHit: 1,
            branchesFound: 4,
            branchesHit: 2,
        };

        const largeFile: LcovFileData = {
            file: 'src/large.ts',
            linesFound: 1000,
            linesHit: 500,
            functionsFound: 200,
            functionsHit: 100,
            branchesFound: 400,
            branchesHit: 200,
        };

        const smallResult = analyzeFile(smallFile, defaultWeights);
        const largeResult = analyzeFile(largeFile, defaultWeights);

        // Same coverage percentage (50%) but larger file should have higher score
        expect(largeResult.priorityScore).toBeGreaterThan(smallResult.priorityScore);
    });

    it('should handle 100% coverage (zero priority)', () => {
        const file: LcovFileData = {
            file: 'src/perfect.ts',
            linesFound: 100,
            linesHit: 100,
            functionsFound: 10,
            functionsHit: 10,
            branchesFound: 20,
            branchesHit: 20,
        };

        const result = analyzeFile(file, defaultWeights);

        expect(result.priorityScore).toBe(0);
        expect(result.uncoveredLines).toBe(0);
        expect(result.uncoveredBranches).toBe(0);
    });

    it('should handle zero found metrics (100% coverage)', () => {
        const file: LcovFileData = {
            file: 'src/empty.ts',
            linesFound: 0,
            linesHit: 0,
            functionsFound: 0,
            functionsHit: 0,
            branchesFound: 0,
            branchesHit: 0,
        };

        const result = analyzeFile(file, defaultWeights);

        expect(result.lines.coverage).toBe(100);
        expect(result.functions.coverage).toBe(100);
        expect(result.branches.coverage).toBe(100);
    });

    it('should respect custom weights', () => {
        // Use different coverage percentages for each metric
        // so weights actually affect the result
        const file: LcovFileData = {
            file: 'src/test.ts',
            linesFound: 100,
            linesHit: 80,      // 80% line coverage (20% gap)
            functionsFound: 10,
            functionsHit: 5,   // 50% function coverage (50% gap)
            branchesFound: 20,
            branchesHit: 4,    // 20% branch coverage (80% gap)
        };

        const branchHeavyWeights: PriorityWeights = {
            branches: 0.9,
            functions: 0.05,
            lines: 0.05,
        };

        const lineHeavyWeights: PriorityWeights = {
            branches: 0.05,
            functions: 0.05,
            lines: 0.9,
        };

        const branchResult = analyzeFile(file, branchHeavyWeights);
        const lineResult = analyzeFile(file, lineHeavyWeights);

        // Branch-heavy weights should produce higher score because branches have worst coverage
        expect(branchResult.priorityScore).toBeGreaterThan(lineResult.priorityScore);
    });
});

describe('analyzeCoverage', () => {
    const defaultWeights: PriorityWeights = {
        branches: 0.5,
        functions: 0.3,
        lines: 0.2,
    };

    it('should filter files by minimum lines', () => {
        const files: LcovFileData[] = [
            {
                file: 'src/small.ts',
                linesFound: 5,
                linesHit: 2,
                functionsFound: 1,
                functionsHit: 0,
                branchesFound: 2,
                branchesHit: 1,
            },
            {
                file: 'src/large.ts',
                linesFound: 100,
                linesHit: 50,
                functionsFound: 10,
                functionsHit: 5,
                branchesFound: 20,
                branchesHit: 10,
            },
        ];

        const result = analyzeCoverage(files, defaultWeights, 10, null);

        expect(result.files).toHaveLength(1);
        expect(result.files[0].file).toBe('src/large.ts');
        // Overall should still include all files
        expect(result.overall.fileCount).toBe(2);
    });

    it('should sort by priority score (descending)', () => {
        const files: LcovFileData[] = [
            {
                file: 'src/high-coverage.ts',
                linesFound: 100,
                linesHit: 95,
                functionsFound: 10,
                functionsHit: 10,
                branchesFound: 20,
                branchesHit: 19,
            },
            {
                file: 'src/low-coverage.ts',
                linesFound: 100,
                linesHit: 20,
                functionsFound: 10,
                functionsHit: 2,
                branchesFound: 20,
                branchesHit: 4,
            },
            {
                file: 'src/medium-coverage.ts',
                linesFound: 100,
                linesHit: 50,
                functionsFound: 10,
                functionsHit: 5,
                branchesFound: 20,
                branchesHit: 10,
            },
        ];

        const result = analyzeCoverage(files, defaultWeights, 1, null);

        expect(result.files[0].file).toBe('src/low-coverage.ts');
        expect(result.files[1].file).toBe('src/medium-coverage.ts');
        expect(result.files[2].file).toBe('src/high-coverage.ts');
    });

    it('should limit results with top parameter', () => {
        const files: LcovFileData[] = Array.from({ length: 10 }, (_, i) => ({
            file: `src/file${i}.ts`,
            linesFound: 100,
            linesHit: 50 + i * 5,
            functionsFound: 10,
            functionsHit: 5,
            branchesFound: 20,
            branchesHit: 10,
        }));

        const result = analyzeCoverage(files, defaultWeights, 1, 3);

        expect(result.files).toHaveLength(3);
        expect(result.overall.fileCount).toBe(10);
    });

    it('should handle empty file list', () => {
        const result = analyzeCoverage([], defaultWeights, 1, null);

        expect(result.files).toHaveLength(0);
        expect(result.overall.fileCount).toBe(0);
    });
});
