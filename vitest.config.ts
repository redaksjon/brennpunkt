import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        setupFiles: ['tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules/**/*', 'dist/**/*'],
        testTimeout: 30000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'dist/**/*', 
                'node_modules/**/*', 
                'tests/**/*',
                // CLI entry point - requires TTY interaction
                'src/main.ts',
                // Type definitions only
                'src/types.ts',
                // Re-exports only
                'src/index.ts',
                // MCP server - future feature, not compiled yet
                'src/mcp/**/*',
            ],
            thresholds: {
                lines: 80,
                statements: 80,
                branches: 65,
                functions: 85,
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
