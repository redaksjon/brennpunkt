import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatTable, formatJson, supportsColor, color, colorPct, getColorCode } from '../src/formatter';
import type { AnalysisResult, AnalyzerOptions } from '../src/types';

describe('supportsColor', () => {
    const originalEnv = { ...process.env };
    const originalIsTTY = process.stdout.isTTY;

    beforeEach(() => {
        // Reset env before each test
        delete process.env.NO_COLOR;
        delete process.env.FORCE_COLOR;
        delete process.env.TERM;
    });

    afterEach(() => {
        // Restore original env
        process.env = { ...originalEnv };
        Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
    });

    it('should return false when NO_COLOR is set', () => {
        process.env.NO_COLOR = '1';
        expect(supportsColor()).toBe(false);
    });

    it('should return false when NO_COLOR is empty string (still defined)', () => {
        process.env.NO_COLOR = '';
        expect(supportsColor()).toBe(false);
    });

    it('should return true when FORCE_COLOR is set', () => {
        process.env.FORCE_COLOR = '1';
        expect(supportsColor()).toBe(true);
    });

    it('should return false when stdout is not a TTY', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
        expect(supportsColor()).toBe(false);
    });

    it('should return false when TERM is dumb', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
        process.env.TERM = 'dumb';
        expect(supportsColor()).toBe(false);
    });

    it('should return true when TTY and no blocking env vars', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
        process.env.TERM = 'xterm-256color';
        expect(supportsColor()).toBe(true);
    });
});

describe('color', () => {
    it('should wrap text with ANSI codes when useColors is true', () => {
        const result = color('\x1b[32m', 'test', true);
        expect(result).toBe('\x1b[32mtest\x1b[0m');
    });

    it('should return plain text when useColors is false', () => {
        const result = color('\x1b[32m', 'test', false);
        expect(result).toBe('test');
    });
});

describe('colorPct', () => {
    it('should return green for >= 90%', () => {
        const result = colorPct(95, true);
        expect(result).toContain('\x1b[32m'); // green
        expect(result).toContain('95.00%');
    });

    it('should return yellow for >= 80% and < 90%', () => {
        const result = colorPct(85, true);
        expect(result).toContain('\x1b[33m'); // yellow
        expect(result).toContain('85.00%');
    });

    it('should return red for < 80%', () => {
        const result = colorPct(70, true);
        expect(result).toContain('\x1b[31m'); // red
        expect(result).toContain('70.00%');
    });

    it('should return plain text when colors disabled', () => {
        const result = colorPct(95, false);
        expect(result).toBe('95.00%');
        expect(result).not.toContain('\x1b[');
    });

    it('should handle exactly 90%', () => {
        const result = colorPct(90, true);
        expect(result).toContain('\x1b[32m'); // green
    });

    it('should handle exactly 80%', () => {
        const result = colorPct(80, true);
        expect(result).toContain('\x1b[33m'); // yellow
    });
});

describe('getColorCode', () => {
    it('should return empty string when colors disabled', () => {
        expect(getColorCode(50, false)).toBe('');
        expect(getColorCode(90, false)).toBe('');
    });

    it('should return red for < 50%', () => {
        expect(getColorCode(49, true)).toBe('\x1b[31m');
        expect(getColorCode(0, true)).toBe('\x1b[31m');
    });

    it('should return yellow for >= 50% and < 80%', () => {
        expect(getColorCode(50, true)).toBe('\x1b[33m');
        expect(getColorCode(79, true)).toBe('\x1b[33m');
    });

    it('should return green for >= 80%', () => {
        expect(getColorCode(80, true)).toBe('\x1b[32m');
        expect(getColorCode(100, true)).toBe('\x1b[32m');
    });
});

describe('formatJson', () => {
    it('should return valid JSON string', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 80, coverage: 80 },
                functions: { found: 10, hit: 8, coverage: 80 },
                branches: { found: 20, hit: 15, coverage: 75 },
                fileCount: 2,
            },
            files: [
                {
                    file: 'src/test.ts',
                    lines: { found: 100, hit: 80, coverage: 80 },
                    functions: { found: 10, hit: 8, coverage: 80 },
                    branches: { found: 20, hit: 15, coverage: 75 },
                    priorityScore: 45.5,
                    uncoveredLines: 20,
                    uncoveredBranches: 5,
                },
            ],
        };

        const json = formatJson(result);
        const parsed = JSON.parse(json);

        expect(parsed.overall.lines.coverage).toBe(80);
        expect(parsed.files).toHaveLength(1);
        expect(parsed.files[0].file).toBe('src/test.ts');
    });

    it('should handle empty files array', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 0, hit: 0, coverage: 100 },
                functions: { found: 0, hit: 0, coverage: 100 },
                branches: { found: 0, hit: 0, coverage: 100 },
                fileCount: 0,
            },
            files: [],
        };

        const json = formatJson(result);
        const parsed = JSON.parse(json);

        expect(parsed.files).toHaveLength(0);
        expect(parsed.overall.fileCount).toBe(0);
    });
});

describe('formatTable', () => {
    const defaultOptions: AnalyzerOptions = {
        coveragePath: 'coverage/lcov.info',
        weights: { branches: 0.5, functions: 0.3, lines: 0.2 },
        minLines: 10,
        json: false,
        top: null,
    };

    it('should include header and overall coverage', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 80, coverage: 80 },
                functions: { found: 10, hit: 8, coverage: 80 },
                branches: { found: 20, hit: 16, coverage: 80 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/test.ts',
                    lines: { found: 100, hit: 80, coverage: 80 },
                    functions: { found: 10, hit: 8, coverage: 80 },
                    branches: { found: 20, hit: 16, coverage: 80 },
                    priorityScore: 40,
                    uncoveredLines: 20,
                    uncoveredBranches: 4,
                },
            ],
        };

        const output = formatTable(result, defaultOptions);

        expect(output).toContain('Coverage Priority Report');
        expect(output).toContain('OVERALL COVERAGE');
        expect(output).toContain('Files: 1');
    });

    it('should display file information in table format', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 50, coverage: 50 },
                functions: { found: 10, hit: 5, coverage: 50 },
                branches: { found: 20, hit: 10, coverage: 50 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/module.ts',
                    lines: { found: 100, hit: 50, coverage: 50 },
                    functions: { found: 10, hit: 5, coverage: 50 },
                    branches: { found: 20, hit: 10, coverage: 50 },
                    priorityScore: 100,
                    uncoveredLines: 50,
                    uncoveredBranches: 10,
                },
            ],
        };

        const output = formatTable(result, defaultOptions);

        expect(output).toContain('src/module.ts');
        expect(output).toContain('#1');
        expect(output).toContain('50.0%');
    });

    it('should truncate long file paths', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 80, coverage: 80 },
                functions: { found: 10, hit: 8, coverage: 80 },
                branches: { found: 20, hit: 16, coverage: 80 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/very/deeply/nested/directory/structure/with/long/path/module.ts',
                    lines: { found: 100, hit: 80, coverage: 80 },
                    functions: { found: 10, hit: 8, coverage: 80 },
                    branches: { found: 20, hit: 16, coverage: 80 },
                    priorityScore: 40,
                    uncoveredLines: 20,
                    uncoveredBranches: 4,
                },
            ],
        };

        const output = formatTable(result, defaultOptions);

        expect(output).toContain('...');
        expect(output).toContain('module.ts');
    });

    it('should include recommendations section', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 50, coverage: 50 },
                functions: { found: 10, hit: 5, coverage: 50 },
                branches: { found: 20, hit: 10, coverage: 50 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/low-coverage.ts',
                    lines: { found: 100, hit: 50, coverage: 50 },
                    functions: { found: 10, hit: 5, coverage: 50 },
                    branches: { found: 20, hit: 10, coverage: 50 },
                    priorityScore: 100,
                    uncoveredLines: 50,
                    uncoveredBranches: 10,
                },
            ],
        };

        const output = formatTable(result, defaultOptions);

        expect(output).toContain('Recommended Focus');
        expect(output).toContain('src/low-coverage.ts');
    });

    it('should display weights in output', () => {
        const options: AnalyzerOptions = {
            ...defaultOptions,
            weights: { branches: 0.6, functions: 0.2, lines: 0.2 },
        };

        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 80, coverage: 80 },
                functions: { found: 10, hit: 8, coverage: 80 },
                branches: { found: 20, hit: 16, coverage: 80 },
                fileCount: 1,
            },
            files: [],
        };

        const output = formatTable(result, options);

        expect(output).toContain('B=0.6');
        expect(output).toContain('F=0.2');
        expect(output).toContain('L=0.2');
    });

    it('should show summary statistics', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 200, hit: 100, coverage: 50 },
                functions: { found: 20, hit: 10, coverage: 50 },
                branches: { found: 40, hit: 20, coverage: 50 },
                fileCount: 2,
            },
            files: [
                {
                    file: 'src/file1.ts',
                    lines: { found: 100, hit: 50, coverage: 50 },
                    functions: { found: 10, hit: 5, coverage: 50 },
                    branches: { found: 20, hit: 10, coverage: 50 },
                    priorityScore: 100,
                    uncoveredLines: 50,
                    uncoveredBranches: 10,
                },
                {
                    file: 'src/file2.ts',
                    lines: { found: 100, hit: 50, coverage: 50 },
                    functions: { found: 10, hit: 5, coverage: 50 },
                    branches: { found: 20, hit: 10, coverage: 50 },
                    priorityScore: 100,
                    uncoveredLines: 50,
                    uncoveredBranches: 10,
                },
            ],
        };

        const output = formatTable(result, defaultOptions);

        expect(output).toContain('Total files analyzed: 2');
        expect(output).toContain('Total uncovered lines: 100');
        expect(output).toContain('Total uncovered branches: 20');
    });

    it('should include ANSI color codes when forceColors is true', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 95, coverage: 95 },
                functions: { found: 10, hit: 9, coverage: 90 },
                branches: { found: 20, hit: 14, coverage: 70 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/test.ts',
                    lines: { found: 100, hit: 95, coverage: 95 },
                    functions: { found: 10, hit: 9, coverage: 90 },
                    branches: { found: 20, hit: 14, coverage: 70 },
                    priorityScore: 30,
                    uncoveredLines: 5,
                    uncoveredBranches: 6,
                },
            ],
        };

        const output = formatTable(result, defaultOptions, true);

        // Should contain ANSI escape codes
        expect(output).toContain('\x1b[32m'); // green for 95% lines
        expect(output).toContain('\x1b[0m');  // reset
    });

    it('should not include ANSI color codes when forceColors is false', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 95, coverage: 95 },
                functions: { found: 10, hit: 9, coverage: 90 },
                branches: { found: 20, hit: 14, coverage: 70 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/test.ts',
                    lines: { found: 100, hit: 95, coverage: 95 },
                    functions: { found: 10, hit: 9, coverage: 90 },
                    branches: { found: 20, hit: 14, coverage: 70 },
                    priorityScore: 30,
                    uncoveredLines: 5,
                    uncoveredBranches: 6,
                },
            ],
        };

        const output = formatTable(result, defaultOptions, false);

        // Should NOT contain ANSI escape codes
        expect(output).not.toContain('\x1b[32m');
        expect(output).not.toContain('\x1b[33m');
        expect(output).not.toContain('\x1b[31m');
    });

    it('should color code different coverage levels correctly', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 300, hit: 200, coverage: 66.67 },
                functions: { found: 30, hit: 20, coverage: 66.67 },
                branches: { found: 60, hit: 40, coverage: 66.67 },
                fileCount: 3,
            },
            files: [
                {
                    // Low coverage - should be red
                    file: 'src/low.ts',
                    lines: { found: 100, hit: 40, coverage: 40 },
                    functions: { found: 10, hit: 4, coverage: 40 },
                    branches: { found: 20, hit: 8, coverage: 40 },
                    priorityScore: 120,
                    uncoveredLines: 60,
                    uncoveredBranches: 12,
                },
                {
                    // Medium coverage - should be yellow
                    file: 'src/medium.ts',
                    lines: { found: 100, hit: 70, coverage: 70 },
                    functions: { found: 10, hit: 7, coverage: 70 },
                    branches: { found: 20, hit: 14, coverage: 70 },
                    priorityScore: 60,
                    uncoveredLines: 30,
                    uncoveredBranches: 6,
                },
                {
                    // High coverage - should be green
                    file: 'src/high.ts',
                    lines: { found: 100, hit: 90, coverage: 90 },
                    functions: { found: 10, hit: 9, coverage: 90 },
                    branches: { found: 20, hit: 18, coverage: 90 },
                    priorityScore: 20,
                    uncoveredLines: 10,
                    uncoveredBranches: 2,
                },
            ],
        };

        const output = formatTable(result, defaultOptions, true);

        // Check that all three color codes are present (red, yellow, green)
        expect(output).toContain('\x1b[31m'); // red for < 50%
        expect(output).toContain('\x1b[33m'); // yellow for 50-80%
        expect(output).toContain('\x1b[32m'); // green for >= 80%
    });

    it('should show appropriate recommendations for files with different issues', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 50, coverage: 50 },
                functions: { found: 10, hit: 5, coverage: 50 },
                branches: { found: 20, hit: 10, coverage: 50 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/problematic.ts',
                    lines: { found: 100, hit: 50, coverage: 50 },
                    functions: { found: 10, hit: 5, coverage: 50 },
                    branches: { found: 20, hit: 10, coverage: 50 },
                    priorityScore: 100,
                    uncoveredLines: 50,
                    uncoveredBranches: 10,
                },
            ],
        };

        const output = formatTable(result, defaultOptions, false);

        // Should mention all three types of issues
        expect(output).toContain('untested branches');
        expect(output).toContain('untested functions');
        expect(output).toContain('uncovered lines');
    });

    it('should show "General coverage improvement" when no specific issues', () => {
        const result: AnalysisResult = {
            overall: {
                lines: { found: 100, hit: 85, coverage: 85 },
                functions: { found: 10, hit: 9, coverage: 90 },
                branches: { found: 20, hit: 18, coverage: 90 },
                fileCount: 1,
            },
            files: [
                {
                    file: 'src/good.ts',
                    lines: { found: 100, hit: 85, coverage: 85 },
                    functions: { found: 10, hit: 9, coverage: 90 },
                    branches: { found: 20, hit: 18, coverage: 90 },
                    priorityScore: 15,
                    uncoveredLines: 15,
                    uncoveredBranches: 2,
                },
            ],
        };

        const output = formatTable(result, defaultOptions, false);

        expect(output).toContain('General coverage improvement');
    });
});
