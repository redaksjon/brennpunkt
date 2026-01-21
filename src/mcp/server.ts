#!/usr/bin/env node
/**
 * Brennpunkt MCP Server
 *
 * Exposes coverage analysis as MCP tools for AI coding assistants.
 * Instead of running tests repeatedly, AI tools can query existing
 * coverage data for prioritized, actionable insights.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as Resources from './resources.js';
import { getPrompts, getPrompt } from './prompts/index.js';
import { tools, handleToolCall } from './tools/index.js';

// ============================================================================
// Server Setup
// ============================================================================

async function main() {
    const server = new Server(
        {
            name: 'brennpunkt',
            version: '0.1.0',
            // Server-level description for AI tools discovering this MCP server
            description:
                'Test coverage priority analyzer. Reads lcov.info coverage data (produced by Jest, Vitest, Mocha, c8, NYC, Karma, Playwright, or any lcov-compatible tool) and ranks files by testing priority. ' +
                'Use this to identify WHERE to focus testing efforts for maximum coverage impact WITHOUT running tests. ' +
                'Provides actionable insights: priority scores, coverage gaps, and specific suggestions for each file.',
        },
        {
            capabilities: {
                tools: {},
                resources: {
                    subscribe: false,
                    listChanged: false,
                },
                prompts: {
                    listChanged: false,
                },
            },
        }
    );

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools,
    }));

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        try {
            const result = await handleToolCall(name, args);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                content: [{ type: 'text', text: `Error: ${message}` }],
                isError: true,
            };
        }
    });

    // List resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return Resources.handleListResources();
    });

    // Read resource
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        try {
            const contents = await Resources.handleReadResource(uri);
            return { contents: [contents] };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read resource ${uri}: ${message}`);
        }
    });

    // List prompts
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
        return { prompts: getPrompts() };
    });

    // Get prompt
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            const messages = await getPrompt(name, args || {});
            return { messages };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get prompt ${name}: ${message}`);
        }
    });

    // Start server
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
