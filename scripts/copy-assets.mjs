#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Copy markdown prompt files from src/mcp/prompts/ to dist/mcp/prompts/
 * This ensures prompts are available when the MCP server runs from dist/
 */
import { cp, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const srcPromptsDir = join(projectRoot, 'src', 'mcp', 'prompts');
const distPromptsDir = join(projectRoot, 'dist', 'mcp', 'prompts');

async function copyPrompts() {
    // Read all files in src/mcp/prompts/
    let files;
    try {
        files = await readdir(srcPromptsDir);
    } catch {
        console.log('No prompts directory found, skipping.');
        return;
    }
    
    // Filter to .md files only
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    if (mdFiles.length === 0) {
        console.log('No prompt .md files found in src/mcp/prompts/');
        return;
    }

    // Ensure destination directory exists
    await mkdir(distPromptsDir, { recursive: true });

    console.log(`Copying ${mdFiles.length} prompt files to dist/mcp/prompts/...`);
    
    for (const file of mdFiles) {
        const srcPath = join(srcPromptsDir, file);
        const destPath = join(distPromptsDir, file);
        
        // Copy the file
        await cp(srcPath, destPath);
        console.log(`  ${relative(projectRoot, srcPath)} → ${relative(projectRoot, destPath)}`);
    }
    
    console.log('Done copying prompts.');
}

copyPrompts().catch((err) => {
    console.error('Error copying prompt files:', err);
    process.exit(1);
});
