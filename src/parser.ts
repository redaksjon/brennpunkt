/**
 * LCOV file parser
 */

import type { LcovFileData } from './types';

/**
 * Parse an LCOV format file content into structured file coverage data.
 * 
 * LCOV format documentation:
 * - SF:<source file path> - Start of file record
 * - LF:<lines found> - Total number of instrumented lines
 * - LH:<lines hit> - Number of lines with execution count > 0
 * - FNF:<functions found> - Total number of functions
 * - FNH:<functions hit> - Number of functions executed
 * - BRF:<branches found> - Total number of branches
 * - BRH:<branches hit> - Number of branches taken
 * - end_of_record - End of file record
 * 
 * @param content - Raw LCOV file content
 * @returns Array of parsed file coverage data
 */
export function parseLcov(content: string): LcovFileData[] {
    const files: LcovFileData[] = [];
    let current: LcovFileData | null = null;

    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('SF:')) {
            current = {
                file: trimmed.slice(3),
                linesFound: 0,
                linesHit: 0,
                functionsFound: 0,
                functionsHit: 0,
                branchesFound: 0,
                branchesHit: 0,
            };
        } else if (current) {
            if (trimmed.startsWith('LF:')) {
                current.linesFound = parseInt(trimmed.slice(3), 10);
            } else if (trimmed.startsWith('LH:')) {
                current.linesHit = parseInt(trimmed.slice(3), 10);
            } else if (trimmed.startsWith('FNF:')) {
                current.functionsFound = parseInt(trimmed.slice(4), 10);
            } else if (trimmed.startsWith('FNH:')) {
                current.functionsHit = parseInt(trimmed.slice(4), 10);
            } else if (trimmed.startsWith('BRF:')) {
                current.branchesFound = parseInt(trimmed.slice(4), 10);
            } else if (trimmed.startsWith('BRH:')) {
                current.branchesHit = parseInt(trimmed.slice(4), 10);
            } else if (trimmed === 'end_of_record') {
                files.push(current);
                current = null;
            }
        }
    }

    return files;
}
