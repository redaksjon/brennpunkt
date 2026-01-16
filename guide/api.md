# Programmatic API

Use brennpunkt as a library in your Node.js applications.

## Installation

```bash
npm install @redaksjon/brennpunkt
```

## Basic Usage

```typescript
import { parseLcov, analyzeCoverage, formatJson, formatTable } from '@redaksjon/brennpunkt';
import { readFileSync } from 'node:fs';

// Read coverage file
const lcovContent = readFileSync('coverage/lcov.info', 'utf-8');

// Parse LCOV format
const files = parseLcov(lcovContent);

// Analyze with default weights
const result = analyzeCoverage(
  files,
  { branches: 0.5, functions: 0.3, lines: 0.2 },  // weights
  10,   // minLines
  null  // top (null = all files)
);

// Output as JSON
console.log(formatJson(result));

// Or as formatted table
console.log(formatTable(result, { 
  coveragePath: 'coverage/lcov.info',
  weights: { branches: 0.5, functions: 0.3, lines: 0.2 },
  minLines: 10,
  json: false,
  top: null
}));
```

## API Reference

### `parseLcov(content: string): FileCoverage[]`

Parse LCOV format content into structured coverage data.

**Parameters**:
- `content`: Raw LCOV file content as string

**Returns**: Array of `FileCoverage` objects

```typescript
interface FileCoverage {
  file: string;
  linesFound: number;
  linesHit: number;
  functionsFound: number;
  functionsHit: number;
  branchesFound: number;
  branchesHit: number;
}
```

**Example**:

```typescript
const lcov = `SF:src/index.ts
LF:100
LH:80
FNF:10
FNH:8
BRF:20
BRH:15
end_of_record`;

const files = parseLcov(lcov);
// [{ file: 'src/index.ts', linesFound: 100, linesHit: 80, ... }]
```

### `analyzeCoverage(files, weights, minLines, top): AnalysisResult`

Analyze coverage data and calculate priority scores.

**Parameters**:
- `files`: Array of `FileCoverage` from `parseLcov()`
- `weights`: `PriorityWeights` object
- `minLines`: Minimum lines threshold (number)
- `top`: Limit to top N files (number or null)

```typescript
interface PriorityWeights {
  branches: number;
  functions: number;
  lines: number;
}
```

**Returns**: `AnalysisResult` object

```typescript
interface AnalysisResult {
  overall: {
    lines: { found: number; hit: number; coverage: number };
    functions: { found: number; hit: number; coverage: number };
    branches: { found: number; hit: number; coverage: number };
    fileCount: number;
  };
  files: AnalyzedFile[];
}

interface AnalyzedFile {
  file: string;
  lines: { found: number; hit: number; coverage: number };
  functions: { found: number; hit: number; coverage: number };
  branches: { found: number; hit: number; coverage: number };
  priorityScore: number;
  uncoveredLines: number;
  uncoveredBranches: number;
}
```

**Example**:

```typescript
const result = analyzeCoverage(
  files,
  { branches: 0.5, functions: 0.3, lines: 0.2 },
  10,
  5  // Top 5 only
);

console.log(result.overall.lines.coverage);  // 85.5
console.log(result.files[0].priorityScore);  // 156.3
```

### `formatJson(result: AnalysisResult): string`

Format analysis result as JSON string.

**Parameters**:
- `result`: `AnalysisResult` from `analyzeCoverage()`

**Returns**: Formatted JSON string

```typescript
const jsonOutput = formatJson(result);
console.log(jsonOutput);
// { "overall": { ... }, "files": [ ... ] }
```

### `formatTable(result, options): string`

Format analysis result as human-readable table.

**Parameters**:
- `result`: `AnalysisResult` from `analyzeCoverage()`
- `options`: `AnalyzerOptions` object

**Returns**: Formatted table string with ANSI colors

```typescript
interface AnalyzerOptions {
  coveragePath: string;
  weights: PriorityWeights;
  minLines: number;
  json: boolean;
  top: number | null;
}
```

### `discoverCoverageFile(): { found: string; searched: string[] } | null`

Search for coverage file in common locations.

**Returns**: Object with found path and searched paths, or null if not found

```typescript
const discovery = discoverCoverageFile();
if (discovery) {
  console.log(`Found: ${discovery.found}`);
  console.log(`Searched: ${discovery.searched.join(', ')}`);
} else {
  console.log('No coverage file found');
}
```

## Advanced Examples

### Custom Analysis Pipeline

```typescript
import { parseLcov, analyzeCoverage } from '@redaksjon/brennpunkt';
import { readFileSync, writeFileSync } from 'node:fs';

async function runAnalysis() {
  // Read coverage
  const lcov = readFileSync('coverage/lcov.info', 'utf-8');
  const files = parseLcov(lcov);
  
  // Filter specific directories
  const srcFiles = files.filter(f => f.file.startsWith('src/'));
  
  // Analyze with custom weights
  const result = analyzeCoverage(
    srcFiles,
    { branches: 0.7, functions: 0.2, lines: 0.1 },
    20,
    10
  );
  
  // Process results
  const criticalFiles = result.files.filter(f => f.priorityScore > 100);
  
  if (criticalFiles.length > 0) {
    console.error('Critical coverage gaps:');
    criticalFiles.forEach(f => {
      console.error(`  - ${f.file}: ${f.priorityScore.toFixed(1)}`);
    });
    process.exit(1);
  }
  
  // Save report
  writeFileSync('coverage-analysis.json', JSON.stringify(result, null, 2));
}

runAnalysis();
```

### Integration with Test Framework

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['lcov', 'text'],
    },
    onFinished: async () => {
      const { parseLcov, analyzeCoverage, formatTable } = await import('@redaksjon/brennpunkt');
      const { readFileSync } = await import('node:fs');
      
      const lcov = readFileSync('coverage/lcov.info', 'utf-8');
      const files = parseLcov(lcov);
      const result = analyzeCoverage(
        files,
        { branches: 0.5, functions: 0.3, lines: 0.2 },
        10,
        5
      );
      
      console.log('\n' + formatTable(result, {
        coveragePath: 'coverage/lcov.info',
        weights: { branches: 0.5, functions: 0.3, lines: 0.2 },
        minLines: 10,
        json: false,
        top: 5
      }));
    }
  }
});
```

### AI/LLM Integration

```typescript
import { parseLcov, analyzeCoverage } from '@redaksjon/brennpunkt';
import { readFileSync } from 'node:fs';

// Get actionable data for AI assistants
function getCoverageTargets(topN = 3) {
  const lcov = readFileSync('coverage/lcov.info', 'utf-8');
  const files = parseLcov(lcov);
  const result = analyzeCoverage(
    files,
    { branches: 0.5, functions: 0.3, lines: 0.2 },
    10,
    topN
  );
  
  return result.files.map(f => ({
    file: f.file,
    priority: f.priorityScore,
    missingBranches: f.uncoveredBranches,
    missingLines: f.uncoveredLines,
    branchCoverage: f.branches.coverage,
    suggestion: f.branches.coverage < 50 
      ? 'Focus on branch coverage - test conditional logic'
      : f.functions.coverage < 50
        ? 'Focus on function coverage - test more entry points'
        : 'General coverage improvement'
  }));
}

// Example output for AI:
// [
//   {
//     file: 'src/auth/login.ts',
//     priority: 156.3,
//     missingBranches: 13,
//     missingLines: 45,
//     branchCoverage: 35,
//     suggestion: 'Focus on branch coverage - test conditional logic'
//   }
// ]
```

## TypeScript Types

All types are exported from the package:

```typescript
import type {
  FileCoverage,
  AnalyzedFile,
  AnalysisResult,
  PriorityWeights,
  AnalyzerOptions
} from '@redaksjon/brennpunkt';
```
