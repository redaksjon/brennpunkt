# Brennpunkt

**Coverage Priority Analyzer** — Parses `lcov.info` and ranks files by testing priority. Helps answer: *"Where should I focus testing efforts next?"*

<!-- Test publish 2026-01-22 -->

## What is Brennpunkt?

Brennpunkt is a command-line tool that analyzes test coverage reports and tells you **where to focus your testing efforts for maximum impact**. Instead of showing you raw percentages, it calculates a priority score for each file based on coverage gaps, file size, and configurable weights.

**Think of it as a coverage report that actually tells you what to do next.**

### Where Does This Fit In?

When you run tests with coverage enabled, your test framework generates a coverage report. This report is typically stored in a format called **LCOV** (originally from the Linux Test Project). Brennpunkt reads this LCOV data and transforms it into actionable priorities.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Your Tests    │ ──▶  │  Coverage Tool  │ ──▶  │   lcov.info     │
│   (Jest, etc.)  │      │  (v8, istanbul) │      │   (raw data)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Prioritized    │ ◀──  │   Brennpunkt    │ ◀──  │  Parses LCOV    │
│  Action List    │      │   (this tool)   │      │  Calculates     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### What Produces LCOV Files?

Most JavaScript/TypeScript test frameworks can generate LCOV coverage data:

| Test Framework | Coverage Provider | Command |
|----------------|-------------------|---------|
| **Vitest** | v8 (built-in) | `vitest run --coverage` |
| **Jest** | istanbul/v8 | `jest --coverage` |
| **Mocha** | c8 / nyc | `c8 mocha` or `nyc mocha` |
| **Node.js** | c8 | `c8 node script.js` |
| **Karma** | karma-coverage | Configure in `karma.conf.js` |
| **AVA** | c8 | `c8 ava` |
| **Playwright** | v8 | `npx playwright test --coverage` |

The output is typically a file called `lcov.info` in a `coverage/` directory.

### Compatible With

Brennpunkt works with any tool that produces LCOV format output:

- ✅ **Vitest** (recommended for new projects)
- ✅ **Jest** (most popular)
- ✅ **c8** (native V8 coverage)
- ✅ **NYC/Istanbul** (legacy but widely used)
- ✅ **Karma** (Angular projects)
- ✅ **Any CI system** that archives coverage artifacts

### What Brennpunkt Assumes

1. **You have tests** — Brennpunkt analyzes coverage, it doesn't run tests
2. **You have LCOV output** — Run your tests with `--coverage` first
3. **You want to improve coverage** — This tool helps prioritize, not measure

## The Challenge

You're staring at a failed CI build: **"Coverage threshold not met: 85.2% < 90%"**

Now what? You open the coverage report and see a wall of percentages. File after file, each showing line coverage, branch coverage, function coverage. Some files are at 45%, others at 98%. The "Uncovered Lines" column shows cryptic ranges like `23-27, 45, 89-102`.

**The problem:** You need to close a 5% coverage gap, but the standard coverage report doesn't tell you *where to focus*. You're left doing mental math:
- Which files have the most uncovered lines?
- Which gaps are in critical code vs. tiny utilities?
- Should you prioritize that file with 50% line coverage or the one with 0% branch coverage?

Traditional coverage tools show you *what* isn't covered. They don't tell you *what matters most*.

**Brennpunkt was built to solve this.** Instead of presenting raw percentages, it calculates a **priority score** that weighs coverage gaps against file importance. Run one command and immediately see which files will have the biggest impact on your coverage goals.

It was also designed with **agentic coding tools** in mind. When an AI assistant needs to improve test coverage, it shouldn't wade through percentage tables—it needs a ranked list of where to focus. Brennpunkt's JSON output integrates directly into automated workflows, giving coding agents clear, actionable targets.

## Installation

```bash
npm install -g @redaksjon/brennpunkt
```

Or use directly with npx:

```bash
npx @redaksjon/brennpunkt
```

## Usage

```bash
# Analyze coverage (auto-discovers lcov.info location)
brennpunkt

# Specify a custom coverage file path
brennpunkt path/to/lcov.info

# Show only top 10 priority files
brennpunkt --top 10

# Output as JSON for tooling integration
brennpunkt --json

# Custom weights for branches, functions, lines
brennpunkt --weights 0.6,0.2,0.2

# Exclude files with fewer than 50 lines
brennpunkt --min-lines 50
```

## Coverage File Discovery

When no coverage file is specified, brennpunkt automatically searches common locations:

| Search Order | Location | Test Framework |
|--------------|----------|----------------|
| 1 | `coverage/lcov.info` | Jest, Vitest, c8 (most common) |
| 2 | `.coverage/lcov.info` | Some configurations |
| 3 | `coverage/lcov/lcov.info` | Karma |
| 4 | `lcov.info` | Project root |
| 5 | `.nyc_output/lcov.info` | NYC legacy |
| 6 | `test-results/lcov.info` | Some CI configurations |

The first file found is used. When a file is auto-discovered, brennpunkt shows which file was selected:

```
Using coverage file: coverage/lcov.info

📊 Coverage Priority Report
...
```

To skip discovery and use a specific file:

```bash
brennpunkt path/to/your/lcov.info
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `[coverage-path]` | Path to lcov.info file | Auto-discovered |
| `-w, --weights <B,F,L>` | Custom weights for branches, functions, lines | `0.5,0.3,0.2` |
| `-m, --min-lines <N>` | Exclude files with fewer than N lines | `10` |
| `-j, --json` | Output as JSON | `false` |
| `-t, --top <N>` | Show only top N priority files | (all) |
| `-c, --config <path>` | Path to configuration file | `brennpunkt.yaml` |
| `--init-config` | Generate a default configuration file | |
| `--check-config` | Display resolved configuration and exit | |
| `-V, --version` | Show version | |
| `-h, --help` | Show help | |

## Configuration

Brennpunkt reads configuration from a `brennpunkt.yaml` file in your project directory. This follows the pattern of other development tools like ESLint, Prettier, and TypeScript.

### Initialize Configuration

Generate a default configuration file in your project:

```bash
brennpunkt --init-config
```

This creates a `brennpunkt.yaml` file with all available options commented out.

### Configuration File

Create a `brennpunkt.yaml` file in your project root:

```yaml
# Brennpunkt Configuration
# https://github.com/redaksjon/brennpunkt

# Path to lcov.info coverage file
coveragePath: coverage/lcov.info

# Priority weights for branches, functions, lines (should sum to 1.0)
# Higher branch weight = untested branches are prioritized more heavily
weights: "0.5,0.3,0.2"

# Minimum number of lines for a file to be included
# Helps filter out tiny utility files
minLines: 10

# Output format (true for JSON, false for table)
json: false

# Limit results to top N files (remove for all files)
top: 20
```

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `coveragePath` | string | Path to the lcov.info file | `coverage/lcov.info` |
| `weights` | string | Comma-separated weights for branches,functions,lines | `"0.5,0.3,0.2"` |
| `minLines` | number | Exclude files with fewer than N lines | `10` |
| `json` | boolean | Output as JSON instead of table | `false` |
| `top` | number | Limit output to top N priority files | (all files) |

### Configuration Precedence

Configuration is resolved in this order (highest priority first):

1. **CLI arguments** — Always override everything
2. **Config file** — `brennpunkt.yaml` in current directory
3. **Built-in defaults** — Fallback values

### Check Configuration

View the resolved configuration with source tracking:

```bash
brennpunkt --check-config
```

Output:

```
================================================================================
BRENNPUNKT CONFIGURATION
================================================================================

Config file: brennpunkt.yaml
Status: Found

RESOLVED CONFIGURATION:
--------------------------------------------------------------------------------
  [config file] coveragePath   : "coverage/lcov.info"
  [config file] weights        : "0.6,0.2,0.2"
  [config file] minLines       : 20
  [default]     json           : false
  [config file] top            : 10

================================================================================
```

### Using a Custom Config Path

```bash
# Use a config file in a different location
brennpunkt --config .config/brennpunkt.yaml

# Generate config in a specific location
brennpunkt --init-config --config .config/brennpunkt.yaml
```

## Priority Scoring

Files are ranked by a priority score that considers:

1. **Coverage gaps** — The difference between 100% and actual coverage for branches, functions, and lines
2. **Weights** — Customizable weights determine relative importance (default: branches 50%, functions 30%, lines 20%)
3. **File size** — Larger files with low coverage rank higher (logarithmic scaling)

**Formula:**
```
priorityScore = (branchGap × branchWeight + functionGap × functionWeight + lineGap × lineWeight) × log10(lines + 1)
```

### Why These Default Weights?

- **Branches (50%)** — Untested branches hide conditional bugs. A function might execute but still have untested error paths.
- **Functions (30%)** — Untested functions indicate dead code or missing feature tests.
- **Lines (20%)** — Basic execution coverage. High line coverage doesn't guarantee correctness.

### Customizing Weights

```yaml
# Prioritize branch coverage heavily
weights: "0.7,0.2,0.1"

# Equal weights for all metrics
weights: "0.33,0.33,0.34"

# Focus on function coverage
weights: "0.2,0.6,0.2"
```

## Output

### Terminal Output

```
📊 Coverage Priority Report

┌─────────────────────────────────────────────────────────────────┐
│                      OVERALL COVERAGE                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Lines: 78.50%  │  Functions: 82.30%  │  Branches: 65.20%       │
│  (1234/1572)    │  (156/190)          │  (98/150)               │
└─────────────────┴─────────────────┴─────────────────────────────┘

Files: 25 | Weights: B=0.5, F=0.3, L=0.2 | Min lines: 10

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Priority  File                                         Lines       Funcs       Branch      Uncov Lines Score
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
#1        src/complex-module.ts                        45.2%       50.0%       35.0%       120         156.3
#2        src/another-module.ts                        62.5%       70.0%       55.0%       75          98.7
...

🎯 Recommended Focus (Top 3):

  1. src/complex-module.ts
     13 untested branches, 5 untested functions, 120 uncovered lines

  2. src/another-module.ts
     9 untested branches, 3 untested functions, 75 uncovered lines
```

### JSON Output

```json
{
  "overall": {
    "lines": { "found": 1572, "hit": 1234, "coverage": 78.5 },
    "functions": { "found": 190, "hit": 156, "coverage": 82.3 },
    "branches": { "found": 150, "hit": 98, "coverage": 65.2 },
    "fileCount": 25
  },
  "files": [
    {
      "file": "src/complex-module.ts",
      "lines": { "found": 218, "hit": 98, "coverage": 45.2 },
      "functions": { "found": 10, "hit": 5, "coverage": 50 },
      "branches": { "found": 20, "hit": 7, "coverage": 35 },
      "priorityScore": 156.3,
      "uncoveredLines": 120,
      "uncoveredBranches": 13
    }
  ]
}
```

## Integration

### npm Scripts (Post-Test Hook)

The simplest integration is adding brennpunkt to your `package.json` as a post-test script:

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "posttest": "brennpunkt --top 10"
  }
}
```

Now every time you run `npm test`, you'll automatically see prioritized coverage guidance:

```bash
$ npm test

✓ tests/auth.test.ts (15 tests)
✓ tests/api.test.ts (23 tests)

Coverage: 85.2%

Using coverage file: coverage/lcov.info

📊 Coverage Priority Report
...
🎯 Recommended Focus (Top 3):
  1. src/auth/login.ts - 13 untested branches
```

### GitHub Actions

Add brennpunkt to your CI workflow to surface coverage priorities in pull requests:

```yaml
name: Test & Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm test -- --coverage
      
      # Add coverage priority analysis
      - name: Coverage Priority Analysis
        run: npx @redaksjon/brennpunkt --top 10
      
      # Optional: Save JSON report as artifact
      - name: Generate Priority Report
        run: npx @redaksjon/brennpunkt --json > coverage-priority.json
      
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-priority
          path: coverage-priority.json
```

### Generic CI Integration

For any CI system, add brennpunkt after your test command:

```bash
# Run tests with coverage
npm test -- --coverage

# Analyze and display priorities
npx @redaksjon/brennpunkt --top 10

# Or save for later processing
npx @redaksjon/brennpunkt --json > coverage-priority.json
```

### Fail on High-Priority Gaps (Advanced)

Use brennpunkt with `jq` to fail builds when critical files have low coverage:

```bash
#!/bin/bash
# fail-on-priority.sh

# Get the top priority file's score
TOP_SCORE=$(brennpunkt --json --top 1 | jq '.files[0].priorityScore')

# Fail if priority score exceeds threshold
if (( $(echo "$TOP_SCORE > 100" | bc -l) )); then
  echo "❌ High-priority coverage gap detected (score: $TOP_SCORE)"
  echo "Run 'brennpunkt --top 5' to see recommended files to test"
  exit 1
fi

echo "✅ Coverage priorities within acceptable range"
```

## AI & MCP Integration

Brennpunkt is designed to work with AI coding assistants. Instead of running tests repeatedly, AI tools can query existing coverage data for prioritized, actionable insights.

### The Problem

When you ask an AI to "improve test coverage," it typically runs tests, parses text output, and guesses priorities. This is slow (30s-5min per test run) and wasteful when coverage data already exists.

### Solution 1: JSON Output for AI Prompts

The simplest integration—include brennpunkt output in your prompts:

```bash
# In your prompt to Cursor/Claude/etc:
"I need to improve test coverage. Here's the priority analysis:

$(brennpunkt --json --top 3)

Write tests for the #1 priority file, focusing on untested branches."
```

### Solution 2: MCP Server

For deeper integration, Brennpunkt runs as an MCP (Model Context Protocol) server, allowing AI tools like Cursor and Claude to query coverage data directly.

**Key features:**
- Works with **any test framework** producing lcov format (Jest, Vitest, Mocha, c8, NYC, Karma, AVA, Playwright, etc.)
- **One-time setup** for all your projects—no per-project configuration
- **Reads existing coverage data**—does NOT run tests
- **Respects project configuration**—automatically loads `brennpunkt.yaml` from each project
- **Sub-100ms responses**—fast enough for interactive use

**Available MCP Tools:**

| Tool | Purpose |
|------|---------|
| `brennpunkt_get_priorities` | Get files ranked by testing priority with reasons and suggestions |
| `brennpunkt_coverage_summary` | Quick overview: percentages, status, quick wins |
| `brennpunkt_get_file_coverage` | Detailed coverage for a specific file |
| `brennpunkt_estimate_impact` | "If I test these files, will I hit 90%?" |

**Available MCP Resources (NEW):**

| Resource URI | Purpose |
|--------------|---------|
| `brennpunkt://coverage/{projectPath}` | Full coverage data as JSON for analysis |
| `brennpunkt://file/{projectPath}/{filePath}` | Detailed single-file coverage |
| `brennpunkt://priorities?project={path}&top={n}` | Pre-ranked priority list |
| `brennpunkt://config/{projectPath}` | Project configuration (yaml or defaults) |
| `brennpunkt://quick-wins?project={path}` | Small files with high impact |

Resources allow AI assistants to read coverage data directly without tool calls, enabling complex analysis like "Compare branch coverage across all auth files" and parallel data access.

**Available MCP Prompts (NEW):**

| Prompt | Purpose | Key Arguments |
|--------|---------|---------------|
| `improve_coverage` | Complete workflow to reach target percentage | projectPath, targetPercentage, focusMetric |
| `analyze_gaps` | Understand patterns in coverage gaps | projectPath, targetPercentage |
| `quick_wins_workflow` | Find fast paths to improvement | projectPath, timeConstraint |
| `coverage_review` | Detailed review with test suggestions | projectPath, filePattern |

Prompts transform brennpunkt from a data provider to a coverage improvement partner, guiding you through actionable workflows instead of just showing numbers.

**One-Time Setup (works for all projects):**

```json
{
  "mcpServers": {
    "brennpunkt": {
      "command": "npx",
      "args": ["-y", "-p", "@redaksjon/brennpunkt", "brennpunkt-mcp"]
    }
  }
}
```

Or if installed globally (`npm install -g @redaksjon/brennpunkt`):

```json
{
  "mcpServers": {
    "brennpunkt": {
      "command": "brennpunkt-mcp"
    }
  }
}
```

The AI passes the current workspace path as `projectPath` to each tool—no need to configure per-project.

**Project Configuration Respected:**

If a project has a `brennpunkt.yaml`, the MCP server automatically uses it:

```yaml
# /path/to/project/brennpunkt.yaml
weights: "0.7,0.2,0.1"   # This project prioritizes branch coverage
minLines: 20
```

Each response includes `configUsed` so the AI knows what settings are active.

**Example Workflows:**

```
Human: What files should I focus on to improve test coverage?

AI: [calls brennpunkt_get_priorities with projectPath from workspace]

AI: The highest priority file is src/auth/login.ts (score: 156.3).
    It has 35% branch coverage with 13 untested branches.
    Suggested focus: Test error handling paths in validateCredentials().
```

```
Human: If I fully test login.ts and handler.ts, will I hit 90%?

AI: [calls brennpunkt_estimate_impact with those files]

AI: Current: 85.2% → Estimated: 91.8% (+6.6%)
    Yes, testing those two files should get you above 90%.
```

```
Human: Compare coverage between auth-service and user-service.

AI: [calls brennpunkt_coverage_summary for each project]

AI: auth-service: 92.1% lines, 85.3% branches
    user-service: 78.4% lines, 62.1% branches
    
    user-service needs attention, especially branch coverage.
```

**Why MCP Instead of Running Tests:**

| Aspect | Running Tests | MCP Query |
|--------|---------------|-----------|
| Speed | 30s-5min | <100ms |
| Data | Raw percentages | Prioritized + actionable suggestions |
| Efficiency | Redundant test runs | Reads existing coverage |
| Multi-project | Reconfigure each time | Query any project path |

See [guide/ai-integration.md](./guide/ai-integration.md) for complete documentation.

### Quick Start: Cursor Rule (No MCP Required)

Don't want to configure MCP? Add this to your project's `.cursorrules` file for instant AI-powered coverage prioritization:

```markdown
# Coverage Priority Analysis

When working on test coverage improvements:

1. Run `npx @redaksjon/brennpunkt --json --top 5` to get prioritized files
2. Focus on the highest priority file first (highest priorityScore)
3. Pay special attention to:
   - Files with low branch coverage (untested conditionals hide bugs)
   - Files with high uncoveredLines count
4. After writing tests, re-run brennpunkt to see updated priorities

When I ask about test coverage, run brennpunkt and interpret the results.
Suggest specific test cases based on the uncovered branches and functions.
```

**Usage**: After adding this rule, just ask Cursor:
- "What files need test coverage?"
- "Help me improve test coverage"
- "Where should I focus my testing efforts?"

The AI will automatically run brennpunkt and provide actionable recommendations.

## Programmatic Usage

You can also use brennpunkt as a library:

```typescript
import { parseLcov, analyzeCoverage, formatJson } from '@redaksjon/brennpunkt';
import { readFileSync } from 'node:fs';

const lcovContent = readFileSync('coverage/lcov.info', 'utf-8');
const files = parseLcov(lcovContent);

const result = analyzeCoverage(files, {
  branches: 0.5,
  functions: 0.3,
  lines: 0.2,
}, 10, null);

console.log(formatJson(result));
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## License

Apache-2.0
