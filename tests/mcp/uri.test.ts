import { describe, it, expect } from 'vitest';
import {
    parseUri,
    buildCoverageUri,
    buildFileUri,
    buildPrioritiesUri,
    buildConfigUri,
    buildQuickWinsUri,
    isBrenppunktUri,
    getResourceType,
} from '../../src/mcp/uri';

describe('URI Parser', () => {
    describe('parseUri - coverage', () => {
        it('should parse simple coverage URI', () => {
            const result = parseUri('brennpunkt://coverage/Users/dev/project');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'coverage',
                projectPath: 'Users/dev/project',
                params: {},
            });
        });

        it('should parse coverage URI with encoded path', () => {
            const result = parseUri('brennpunkt://coverage/Users/dev/my%20project');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'coverage',
                projectPath: 'Users/dev/my project',
                params: {},
            });
        });

        it('should throw if coverage URI missing project path', () => {
            expect(() => parseUri('brennpunkt://coverage')).toThrow('Coverage URI requires project path');
        });
    });

    describe('parseUri - file', () => {
        it('should parse file URI', () => {
            const result = parseUri('brennpunkt://file/%2FUsers%2Fdev%2Fproject/src/index.ts');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'file',
                projectPath: '/Users/dev/project',
                filePath: 'src/index.ts',
                params: {},
            });
        });

        it('should parse file URI with deep nested path', () => {
            const result = parseUri('brennpunkt://file/%2FUsers%2Fdev%2Fproject/src/components/auth/Login.tsx');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'file',
                projectPath: '/Users/dev/project',
                filePath: 'src/components/auth/Login.tsx',
                params: {},
            });
        });

        it('should parse file URI with encoded characters', () => {
            const result = parseUri('brennpunkt://file/%2FUsers%2Fdev%2Fmy%20project/src/my%20file.ts');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'file',
                projectPath: '/Users/dev/my project',
                filePath: 'src/my file.ts',
                params: {},
            });
        });

        it('should throw if file URI missing paths', () => {
            expect(() => parseUri('brennpunkt://file')).toThrow('File URI requires project path and file path');
            expect(() => parseUri('brennpunkt://file/project')).toThrow('File URI requires project path and file path');
        });
    });

    describe('parseUri - priorities', () => {
        it('should parse priorities URI with project param', () => {
            const result = parseUri('brennpunkt://priorities?project=/Users/dev/project');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'priorities',
                projectPath: '/Users/dev/project',
                params: {
                    project: '/Users/dev/project',
                },
            });
        });

        it('should parse priorities URI with multiple params', () => {
            const result = parseUri('brennpunkt://priorities?project=/Users/dev/project&top=10&minLines=50');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'priorities',
                projectPath: '/Users/dev/project',
                params: {
                    project: '/Users/dev/project',
                    top: '10',
                    minLines: '50',
                },
            });
        });

        it('should throw if priorities URI missing project param', () => {
            expect(() => parseUri('brennpunkt://priorities')).toThrow('Priorities URI requires project parameter');
            expect(() => parseUri('brennpunkt://priorities?top=10')).toThrow('Priorities URI requires project parameter');
        });
    });

    describe('parseUri - config', () => {
        it('should parse config URI', () => {
            const result = parseUri('brennpunkt://config/Users/dev/project');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'config',
                projectPath: 'Users/dev/project',
                params: {},
            });
        });

        it('should parse config URI with encoded path', () => {
            const result = parseUri('brennpunkt://config/Users/dev/my%20special%20project');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'config',
                projectPath: 'Users/dev/my special project',
                params: {},
            });
        });

        it('should throw if config URI missing project path', () => {
            expect(() => parseUri('brennpunkt://config')).toThrow('Config URI requires project path');
        });
    });

    describe('parseUri - quick-wins', () => {
        it('should parse quick-wins URI with project param', () => {
            const result = parseUri('brennpunkt://quick-wins?project=/Users/dev/project');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'quick-wins',
                projectPath: '/Users/dev/project',
                params: {
                    project: '/Users/dev/project',
                },
            });
        });

        it('should parse quick-wins URI with maxLines param', () => {
            const result = parseUri('brennpunkt://quick-wins?project=/Users/dev/project&maxLines=100');
            expect(result).toEqual({
                scheme: 'brennpunkt',
                resourceType: 'quick-wins',
                projectPath: '/Users/dev/project',
                params: {
                    project: '/Users/dev/project',
                    maxLines: '100',
                },
            });
        });

        it('should throw if quick-wins URI missing project param', () => {
            expect(() => parseUri('brennpunkt://quick-wins')).toThrow('Quick wins URI requires project parameter');
        });
    });

    describe('parseUri - error cases', () => {
        it('should throw for invalid scheme', () => {
            expect(() => parseUri('http://coverage/project')).toThrow('Invalid URI scheme');
            expect(() => parseUri('ftp://coverage/project')).toThrow('Invalid URI scheme');
        });

        it('should throw for missing resource type', () => {
            expect(() => parseUri('brennpunkt://')).toThrow('No resource type specified');
        });

        it('should throw for unknown resource type', () => {
            expect(() => parseUri('brennpunkt://unknown/path')).toThrow('Unknown resource type: unknown');
        });
    });

    describe('buildCoverageUri', () => {
        it('should build coverage URI', () => {
            const uri = buildCoverageUri('/Users/dev/project');
            expect(uri).toBe('brennpunkt://coverage//Users/dev/project');
        });

        it('should handle paths with spaces', () => {
            const uri = buildCoverageUri('/Users/dev/my project');
            expect(uri).toBe('brennpunkt://coverage//Users/dev/my%20project');
        });

        it('should preserve slashes in path', () => {
            const uri = buildCoverageUri('/Users/dev/nested/path/project');
            expect(uri).toBe('brennpunkt://coverage//Users/dev/nested/path/project');
        });
    });

    describe('buildFileUri', () => {
        it('should build file URI', () => {
            const uri = buildFileUri('/Users/dev/project', 'src/index.ts');
            expect(uri).toBe('brennpunkt://file/%2FUsers%2Fdev%2Fproject/src/index.ts');
        });

        it('should handle paths with spaces', () => {
            const uri = buildFileUri('/Users/dev/my project', 'src/my file.ts');
            expect(uri).toBe('brennpunkt://file/%2FUsers%2Fdev%2Fmy%20project/src/my%20file.ts');
        });

        it('should handle deep nested paths', () => {
            const uri = buildFileUri('/Users/dev/project', 'src/components/auth/Login.tsx');
            expect(uri).toBe('brennpunkt://file/%2FUsers%2Fdev%2Fproject/src/components/auth/Login.tsx');
        });
    });

    describe('buildPrioritiesUri', () => {
        it('should build priorities URI with project only', () => {
            const uri = buildPrioritiesUri('/Users/dev/project');
            expect(uri).toBe('brennpunkt://priorities?project=%2FUsers%2Fdev%2Fproject');
        });

        it('should build priorities URI with top option', () => {
            const uri = buildPrioritiesUri('/Users/dev/project', { top: 5 });
            expect(uri).toBe('brennpunkt://priorities?project=%2FUsers%2Fdev%2Fproject&top=5');
        });

        it('should build priorities URI with minLines option', () => {
            const uri = buildPrioritiesUri('/Users/dev/project', { minLines: 20 });
            expect(uri).toBe('brennpunkt://priorities?project=%2FUsers%2Fdev%2Fproject&minLines=20');
        });

        it('should build priorities URI with all options', () => {
            const uri = buildPrioritiesUri('/Users/dev/project', { top: 10, minLines: 50 });
            expect(uri).toBe('brennpunkt://priorities?project=%2FUsers%2Fdev%2Fproject&top=10&minLines=50');
        });
    });

    describe('buildConfigUri', () => {
        it('should build config URI', () => {
            const uri = buildConfigUri('/Users/dev/project');
            expect(uri).toBe('brennpunkt://config//Users/dev/project');
        });

        it('should handle paths with spaces', () => {
            const uri = buildConfigUri('/Users/dev/my project');
            expect(uri).toBe('brennpunkt://config//Users/dev/my%20project');
        });
    });

    describe('buildQuickWinsUri', () => {
        it('should build quick-wins URI with project only', () => {
            const uri = buildQuickWinsUri('/Users/dev/project');
            expect(uri).toBe('brennpunkt://quick-wins?project=%2FUsers%2Fdev%2Fproject');
        });

        it('should build quick-wins URI with maxLines', () => {
            const uri = buildQuickWinsUri('/Users/dev/project', 100);
            expect(uri).toBe('brennpunkt://quick-wins?project=%2FUsers%2Fdev%2Fproject&maxLines=100');
        });
    });

    describe('isBrenppunktUri', () => {
        it('should return true for valid brennpunkt URIs', () => {
            expect(isBrenppunktUri('brennpunkt://coverage/path')).toBe(true);
            expect(isBrenppunktUri('brennpunkt://file/path/file')).toBe(true);
            expect(isBrenppunktUri('brennpunkt://priorities?project=x')).toBe(true);
        });

        it('should return false for non-brennpunkt URIs', () => {
            expect(isBrenppunktUri('http://example.com')).toBe(false);
            expect(isBrenppunktUri('file:///path')).toBe(false);
            expect(isBrenppunktUri('ftp://server')).toBe(false);
            expect(isBrenppunktUri('not a uri')).toBe(false);
        });
    });

    describe('getResourceType', () => {
        it('should extract resource type from URI', () => {
            expect(getResourceType('brennpunkt://coverage/path')).toBe('coverage');
            expect(getResourceType('brennpunkt://file/path/file')).toBe('file');
            expect(getResourceType('brennpunkt://priorities?project=x')).toBe('priorities');
            expect(getResourceType('brennpunkt://config/path')).toBe('config');
            expect(getResourceType('brennpunkt://quick-wins?project=x')).toBe('quick-wins');
        });

        it('should return null for non-brennpunkt URIs', () => {
            expect(getResourceType('http://example.com')).toBeNull();
            expect(getResourceType('file:///path')).toBeNull();
            expect(getResourceType('not a uri')).toBeNull();
        });
    });

    describe('Round-trip tests', () => {
        it('should parse built coverage URI correctly', () => {
            const projectPath = '/Users/dev/my project';
            const uri = buildCoverageUri(projectPath);
            const parsed = parseUri(uri);
            expect(parsed.projectPath).toBe(projectPath);
            expect(parsed.resourceType).toBe('coverage');
        });

        it('should parse built file URI correctly', () => {
            const projectPath = '/Users/dev/my project';
            const filePath = 'src/my file.ts';
            const uri = buildFileUri(projectPath, filePath);
            const parsed = parseUri(uri);
            expect(parsed.projectPath).toBe(projectPath);
            expect(parsed.filePath).toBe(filePath);
            expect(parsed.resourceType).toBe('file');
        });

        it('should parse built priorities URI correctly', () => {
            const projectPath = '/Users/dev/project';
            const uri = buildPrioritiesUri(projectPath, { top: 10, minLines: 50 });
            const parsed = parseUri(uri);
            expect(parsed.projectPath).toBe(projectPath);
            expect(parsed.resourceType).toBe('priorities');
            expect(parsed.params.top).toBe('10');
            expect(parsed.params.minLines).toBe('50');
        });

        it('should parse built config URI correctly', () => {
            const projectPath = '/Users/dev/my project';
            const uri = buildConfigUri(projectPath);
            const parsed = parseUri(uri);
            expect(parsed.projectPath).toBe(projectPath);
            expect(parsed.resourceType).toBe('config');
        });

        it('should parse built quick-wins URI correctly', () => {
            const projectPath = '/Users/dev/project';
            const uri = buildQuickWinsUri(projectPath, 100);
            const parsed = parseUri(uri);
            expect(parsed.projectPath).toBe(projectPath);
            expect(parsed.resourceType).toBe('quick-wins');
            expect(parsed.params.maxLines).toBe('100');
        });
    });
});
