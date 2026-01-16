/**
 * Output formatting for terminal and JSON
 */

import type { AnalyzedFile, AnalyzerOptions, AnalysisResult } from './types';

/**
 * Check if output supports colors.
 * Disabled when:
 * - stdout is not a TTY (piped to file or another process)
 * - NO_COLOR environment variable is set
 * - TERM is 'dumb'
 * 
 * @returns true if colors should be used
 */
export function supportsColor(): boolean {
    // Respect NO_COLOR standard (https://no-color.org/)
    if (process.env.NO_COLOR !== undefined) {
        return false;
    }
    // Check if FORCE_COLOR is set
    if (process.env.FORCE_COLOR !== undefined) {
        return true;
    }
    // Check if stdout is a TTY
    if (!process.stdout.isTTY) {
        return false;
    }
    // Check for dumb terminal
    if (process.env.TERM === 'dumb') {
        return false;
    }
    return true;
}

/**
 * Wrap text with ANSI color code if colors are enabled.
 * 
 * @param code - ANSI color code
 * @param text - Text to wrap
 * @param useColors - Whether to apply colors
 * @returns Colored or plain text
 */
export function color(code: string, text: string, useColors: boolean): string {
    if (!useColors) return text;
    return `${code}${text}\x1b[0m`;
}

/**
 * Format a percentage with color codes for terminal output.
 * Green >= 90%, Yellow >= 80%, Red < 80%
 * 
 * @param pct - Percentage value
 * @param useColors - Whether to apply colors
 * @returns Colored string for terminal
 */
export function colorPct(pct: number, useColors: boolean): string {
    const text = `${pct.toFixed(2)}%`;
    if (pct >= 90) return color('\x1b[32m', text, useColors);
    if (pct >= 80) return color('\x1b[33m', text, useColors);
    return color('\x1b[31m', text, useColors);
}

/**
 * Get color code based on coverage percentage.
 * 
 * @param coverage - Coverage percentage
 * @param useColors - Whether to apply colors
 * @returns ANSI color code or empty string if colors disabled
 */
export function getColorCode(coverage: number, useColors: boolean): string {
    if (!useColors) return '';
    if (coverage < 50) return '\x1b[31m';
    if (coverage < 80) return '\x1b[33m';
    return '\x1b[32m';
}

/**
 * Format analysis result as a colored terminal table.
 * 
 * @param result - Analysis result
 * @param options - Analyzer options (for displaying weights)
 * @param forceColors - Optional override for color support (for testing)
 * @returns Formatted string for terminal output
 */
export function formatTable(result: AnalysisResult, options: AnalyzerOptions, forceColors?: boolean): string {
    const { overall, files: analyzed } = result;
    const lines: string[] = [];
    const divider = '─'.repeat(120);
    const useColors = forceColors !== undefined ? forceColors : supportsColor();
    const reset = useColors ? '\x1b[0m' : '';
    
    lines.push('');
    lines.push('📊 Coverage Priority Report');
    lines.push('');
    
    // Overall coverage summary box
    lines.push('┌─────────────────────────────────────────────────────────────────┐');
    lines.push('│                      OVERALL COVERAGE                           │');
    lines.push('├─────────────────┬─────────────────┬─────────────────────────────┤');
    lines.push(`│  Lines: ${colorPct(overall.lines.coverage, useColors).padEnd(24)}│  Functions: ${colorPct(overall.functions.coverage, useColors).padEnd(20)}│  Branches: ${colorPct(overall.branches.coverage, useColors).padEnd(22)}│`);
    lines.push(`│  (${overall.lines.hit}/${overall.lines.found})`.padEnd(18) + `│  (${overall.functions.hit}/${overall.functions.found})`.padEnd(18) + `│  (${overall.branches.hit}/${overall.branches.found})`.padEnd(30) + '│');
    lines.push('└─────────────────┴─────────────────┴─────────────────────────────┘');
    lines.push(`\nFiles: ${overall.fileCount} | Weights: B=${options.weights.branches}, F=${options.weights.functions}, L=${options.weights.lines} | Min lines: ${options.minLines}\n`);
    
    lines.push(divider);
    lines.push(
        'Priority'.padEnd(10) +
        'File'.padEnd(45) +
        'Lines'.padEnd(12) +
        'Funcs'.padEnd(12) +
        'Branch'.padEnd(12) +
        'Uncov Lines'.padEnd(12) +
        'Score'
    );
    lines.push(divider);

    analyzed.forEach((item: AnalyzedFile, index: number) => {
        const priority = index + 1;
        const fileName = item.file.length > 43 
            ? '...' + item.file.slice(-40) 
            : item.file;
        
        // Color coding based on coverage
        const colorLine = getColorCode(item.lines.coverage, useColors);
        const colorFunc = getColorCode(item.functions.coverage, useColors);
        const colorBranch = getColorCode(item.branches.coverage, useColors);

        lines.push(
            `#${priority}`.padEnd(10) +
            fileName.padEnd(45) +
            `${colorLine}${item.lines.coverage.toFixed(1)}%${reset}`.padEnd(21) +
            `${colorFunc}${item.functions.coverage.toFixed(1)}%${reset}`.padEnd(21) +
            `${colorBranch}${item.branches.coverage.toFixed(1)}%${reset}`.padEnd(21) +
            `${item.uncoveredLines}`.padEnd(12) +
            item.priorityScore.toFixed(1)
        );
    });

    lines.push(divider);
    lines.push(`\nTotal files analyzed: ${analyzed.length}`);
    
    // Summary stats
    const totalUncoveredLines = analyzed.reduce((sum: number, f: AnalyzedFile) => sum + f.uncoveredLines, 0);
    const totalUncoveredBranches = analyzed.reduce((sum: number, f: AnalyzedFile) => sum + f.uncoveredBranches, 0);
    lines.push(`Total uncovered lines: ${totalUncoveredLines}`);
    lines.push(`Total uncovered branches: ${totalUncoveredBranches}`);
    
    // Top 3 recommendations
    lines.push('');
    lines.push('🎯 Recommended Focus (Top 3):');
    lines.push('');
    analyzed.slice(0, 3).forEach((item: AnalyzedFile, i: number) => {
        const reasons: string[] = [];
        if (item.branches.coverage < 70) reasons.push(`${item.branches.found - item.branches.hit} untested branches`);
        if (item.functions.coverage < 80) reasons.push(`${item.functions.found - item.functions.hit} untested functions`);
        if (item.lines.coverage < 70) reasons.push(`${item.uncoveredLines} uncovered lines`);
        
        lines.push(`  ${i + 1}. ${item.file}`);
        lines.push(`     ${reasons.join(', ') || 'General coverage improvement'}`);
        lines.push('');
    });

    return lines.join('\n');
}

/**
 * Format analysis result as JSON.
 * 
 * @param result - Analysis result
 * @returns JSON string
 */
export function formatJson(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
}
