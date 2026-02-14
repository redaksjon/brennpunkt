/**
 * Tests for MCP prompt system
 */

import { describe, it, expect } from 'vitest';
import { getPrompts, getPrompt } from '../../src/mcp/prompts/index.js';

describe('MCP Prompts', () => {
    describe('getPrompts', () => {
        it('should return all available prompts', () => {
            const prompts = getPrompts();
            expect(prompts).toHaveLength(4);
            expect(prompts.map(p => p.name)).toEqual([
                'improve_coverage',
                'analyze_gaps',
                'quick_wins_workflow',
                'coverage_review',
            ]);
        });

        it('should mark projectPath as optional for all prompts', () => {
            const prompts = getPrompts();
            for (const prompt of prompts) {
                const projectPathArg = prompt.arguments?.find(arg => arg.name === 'projectPath');
                expect(projectPathArg?.required).toBe(false);
            }
        });
    });

    describe('getPrompt', () => {
        describe('improve_coverage', () => {
            it('should use provided projectPath', async () => {
                const messages = await getPrompt('improve_coverage', {
                    projectPath: '/test/path',
                });
                expect(messages).toHaveLength(1);
                expect(messages[0].content.text).toContain('/test/path');
            });

            it('should use [INFER_FROM_CONTEXT] when projectPath is missing', async () => {
                const messages = await getPrompt('improve_coverage', {});
                expect(messages).toHaveLength(1);
                expect(messages[0].content.text).toContain('[INFER_FROM_CONTEXT]');
            });

            it('should use default targetPercentage of 90', async () => {
                const messages = await getPrompt('improve_coverage', {
                    projectPath: '/test/path',
                });
                expect(messages[0].content.text).toContain('90%');
            });

            it('should use custom targetPercentage', async () => {
                const messages = await getPrompt('improve_coverage', {
                    projectPath: '/test/path',
                    targetPercentage: '85',
                });
                expect(messages[0].content.text).toContain('85%');
            });

            it('should use default focusMetric of lines', async () => {
                const messages = await getPrompt('improve_coverage', {
                    projectPath: '/test/path',
                });
                expect(messages[0].content.text).toContain('lines coverage');
            });

            it('should use custom focusMetric', async () => {
                const messages = await getPrompt('improve_coverage', {
                    projectPath: '/test/path',
                    focusMetric: 'branches',
                });
                expect(messages[0].content.text).toContain('branches coverage');
            });

            it('should include context inference instructions', async () => {
                const messages = await getPrompt('improve_coverage', {});
                expect(messages[0].content.text).toContain('Determining the Project Path');
                expect(messages[0].content.text).toContain('Check recent messages');
                expect(messages[0].content.text).toContain('Check workspace paths');
            });
        });

        describe('analyze_gaps', () => {
            it('should use [INFER_FROM_CONTEXT] when projectPath is missing', async () => {
                const messages = await getPrompt('analyze_gaps', {});
                expect(messages[0].content.text).toContain('[INFER_FROM_CONTEXT]');
            });

            it('should include context inference instructions', async () => {
                const messages = await getPrompt('analyze_gaps', {});
                expect(messages[0].content.text).toContain('Determining the Project Path');
            });
        });

        describe('quick_wins_workflow', () => {
            it('should use [INFER_FROM_CONTEXT] when projectPath is missing', async () => {
                const messages = await getPrompt('quick_wins_workflow', {});
                expect(messages[0].content.text).toContain('[INFER_FROM_CONTEXT]');
            });

            it('should include context inference instructions', async () => {
                const messages = await getPrompt('quick_wins_workflow', {});
                expect(messages[0].content.text).toContain('Determining the Project Path');
            });

            it('should use default timeConstraint of moderate', async () => {
                const messages = await getPrompt('quick_wins_workflow', {
                    projectPath: '/test/path',
                });
                expect(messages[0].content.text).toContain('moderate');
            });
        });

        describe('coverage_review', () => {
            it('should use [INFER_FROM_CONTEXT] when projectPath is missing', async () => {
                const messages = await getPrompt('coverage_review', {});
                expect(messages[0].content.text).toContain('[INFER_FROM_CONTEXT]');
            });

            it('should include context inference instructions', async () => {
                const messages = await getPrompt('coverage_review', {});
                expect(messages[0].content.text).toContain('Determining the Project Path');
            });

            it('should use default filePattern', async () => {
                const messages = await getPrompt('coverage_review', {
                    projectPath: '/test/path',
                });
                expect(messages[0].content.text).toContain('highest priority files');
            });
        });

        it('should throw error for unknown prompt', async () => {
            await expect(getPrompt('unknown_prompt', {})).rejects.toThrow('Unknown prompt');
        });
    });
});
