import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { discoverCoverageFile } from '../src/main';

describe('discoverCoverageFile', () => {
    const testDir = resolve(process.cwd(), '.test-discovery');
    const originalCwd = process.cwd();

    beforeEach(() => {
        // Create a test directory
        if (!existsSync(testDir)) {
            mkdirSync(testDir, { recursive: true });
        }
        process.chdir(testDir);
    });

    afterEach(() => {
        // Restore original directory and clean up
        process.chdir(originalCwd);
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    it('should return null when no coverage file exists', () => {
        const result = discoverCoverageFile();
        expect(result).toBeNull();
    });

    it('should find coverage/lcov.info (most common location)', () => {
        mkdirSync(resolve(testDir, 'coverage'), { recursive: true });
        writeFileSync(resolve(testDir, 'coverage/lcov.info'), 'SF:test.ts\nend_of_record');

        const result = discoverCoverageFile();

        expect(result).not.toBeNull();
        expect(result!.found).toBe(resolve(testDir, 'coverage/lcov.info'));
    });

    it('should find lcov.info in project root', () => {
        writeFileSync(resolve(testDir, 'lcov.info'), 'SF:test.ts\nend_of_record');

        const result = discoverCoverageFile();

        expect(result).not.toBeNull();
        expect(result!.found).toBe(resolve(testDir, 'lcov.info'));
    });

    it('should find .coverage/lcov.info', () => {
        mkdirSync(resolve(testDir, '.coverage'), { recursive: true });
        writeFileSync(resolve(testDir, '.coverage/lcov.info'), 'SF:test.ts\nend_of_record');

        const result = discoverCoverageFile();

        expect(result).not.toBeNull();
        expect(result!.found).toBe(resolve(testDir, '.coverage/lcov.info'));
    });

    it('should find coverage/lcov/lcov.info (Karma)', () => {
        mkdirSync(resolve(testDir, 'coverage/lcov'), { recursive: true });
        writeFileSync(resolve(testDir, 'coverage/lcov/lcov.info'), 'SF:test.ts\nend_of_record');

        const result = discoverCoverageFile();

        expect(result).not.toBeNull();
        expect(result!.found).toBe(resolve(testDir, 'coverage/lcov/lcov.info'));
    });

    it('should find .nyc_output/lcov.info (NYC legacy)', () => {
        mkdirSync(resolve(testDir, '.nyc_output'), { recursive: true });
        writeFileSync(resolve(testDir, '.nyc_output/lcov.info'), 'SF:test.ts\nend_of_record');

        const result = discoverCoverageFile();

        expect(result).not.toBeNull();
        expect(result!.found).toBe(resolve(testDir, '.nyc_output/lcov.info'));
    });

    it('should prioritize coverage/lcov.info over other locations', () => {
        // Create files in multiple locations
        mkdirSync(resolve(testDir, 'coverage'), { recursive: true });
        writeFileSync(resolve(testDir, 'coverage/lcov.info'), 'SF:priority.ts\nend_of_record');
        writeFileSync(resolve(testDir, 'lcov.info'), 'SF:root.ts\nend_of_record');

        const result = discoverCoverageFile();

        expect(result).not.toBeNull();
        // coverage/lcov.info should win because it's first in search order
        expect(result!.found).toContain('coverage/lcov.info');
    });

    it('should include searched paths in result', () => {
        mkdirSync(resolve(testDir, 'coverage'), { recursive: true });
        writeFileSync(resolve(testDir, 'coverage/lcov.info'), 'SF:test.ts\nend_of_record');

        const result = discoverCoverageFile();

        expect(result).not.toBeNull();
        expect(result!.searched).toBeDefined();
        expect(result!.searched.length).toBeGreaterThan(0);
        // First searched path should be the found one
        expect(result!.searched[0]).toBe(result!.found);
    });
});
