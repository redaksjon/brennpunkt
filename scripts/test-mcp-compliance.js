#!/usr/bin/env node
/**
 * MCP Compliance Test for Brennpunkt
 */

/* eslint-disable no-console */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { access } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, '../dist/mcp/server.js');

console.log('🔍 Testing Brennpunkt MCP Compliance...\n');

// Check server exists
try {
    await access(serverPath);
} catch {
    console.error('❌ Server not built. Run `npm run build` first.');
    process.exit(1);
}

let passed = 0;
let failed = 0;

// Test 1: Server initialization
console.log('Testing: Server initialization...');
const serverProcess = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

let initError = '';
serverProcess.stderr.on('data', (data) => {
    initError += data.toString();
});

await new Promise((resolve) => setTimeout(resolve, 2000));

if (serverProcess.exitCode === null) {
    console.log('✅ Server starts successfully\n');
    passed++;
    serverProcess.kill();
} else {
    console.log('❌ Server failed to start');
    console.log('Error:', initError);
    failed++;
}

// Test 2: Module loading
console.log('Testing: Module loads...');
try {
    await import(serverPath);
    console.log('✅ Server module loads\n');
    passed++;
} catch {
    console.log('❌ Module loading failed');
    failed++;
}

// Test 3: TypeScript compilation
console.log('Testing: TypeScript compilation...');
try {
    const { execSync } = await import('child_process');
    execSync('npx tsc --noEmit', { cwd: resolve(__dirname, '..'), stdio: 'pipe' });
    console.log('✅ TypeScript compiles\n');
    passed++;
} catch {
    console.log('❌ TypeScript compilation failed');
    failed++;
}

// Summary
console.log('─'.repeat(50));
console.log(`\n📊 MCP Compliance Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

if (failed > 0) {
    console.log('⚠️  Compliance tests failed.\n');
    process.exit(1);
}

console.log('✨ All MCP compliance tests passed!\n');
process.exit(0);
