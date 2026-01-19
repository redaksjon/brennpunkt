/**
 * MCP Types for Brennpunkt
 * 
 * Type definitions for Resources, Prompts, and URI handling.
 */

// ============================================================================
// Resource Types
// ============================================================================

export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface McpResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface McpResourceContents {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
}

export type ResourceType = 
    | 'coverage'        // brennpunkt://coverage/{projectPath}
    | 'file'            // brennpunkt://file/{projectPath}/{filePath}
    | 'priorities'      // brennpunkt://priorities?project=...
    | 'config'          // brennpunkt://config/{projectPath}
    | 'quick-wins';     // brennpunkt://quick-wins?project=...

// ============================================================================
// Prompt Types
// ============================================================================

export interface McpPromptArgument {
    name: string;
    description?: string;
    required?: boolean;
}

export interface McpPrompt {
    name: string;
    description?: string;
    arguments?: McpPromptArgument[];
}

export interface McpPromptMessage {
    role: 'user' | 'assistant';
    content: McpPromptContent;
}

export type McpPromptContent = McpTextContent | McpResourceContent;

export interface McpTextContent {
    type: 'text';
    text: string;
}

export interface McpResourceContent {
    type: 'resource';
    resource: McpResourceContents;
}

// ============================================================================
// URI Types
// ============================================================================

export interface ParsedResourceUri {
    scheme: 'brennpunkt';
    resourceType: ResourceType;
    projectPath?: string;
    filePath?: string;
    params: Record<string, string>;
}
