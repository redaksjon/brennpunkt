# Brennpunkt AI Guide

This directory contains comprehensive documentation designed to help AI assistants and developers understand and use Brennpunkt - a coverage priority analyzer that identifies where to focus testing efforts.

## What is Brennpunkt?

Brennpunkt parses `lcov.info` coverage reports and ranks files by testing priority. It answers the question: **"Where should I focus my testing efforts to have the biggest impact on coverage?"**

**Core Problem Solved**: When a CI build fails with "Coverage: 85.2% < 90%", traditional reports show raw percentages but don't tell you which files will have the most impact. Brennpunkt calculates a priority score that weighs coverage gaps against file importance.

## Guide Contents

### Getting Started
- [**Quick Start**](./quickstart.md): Get brennpunkt working in 2 minutes
- [**Configuration**](./configuration.md): Config file options

### Understanding Brennpunkt
- [**Usage**](./usage.md): Complete CLI reference
- [**Scoring**](./scoring.md): How priority scores are calculated
- [**Integration**](./integration.md): CI/CD and workflow integration

### AI & Automation
- [**AI Integration**](./ai-integration.md): Using Brennpunkt with AI coding assistants and MCP

### Development
- [**API**](./api.md): Programmatic usage as a library

## Quick Reference for AI Assistants

### Essential Commands

```bash
# Basic analysis (auto-discovers coverage file)
brennpunkt

# Show top 10 priority files
brennpunkt --top 10

# JSON output for processing
brennpunkt --json

# Analyze specific coverage file
brennpunkt path/to/lcov.info
```

### Common Tasks

| Task | Command |
|------|---------|
| Find highest priority files | `brennpunkt --top 5` |
| Get JSON for automation | `brennpunkt --json --top 10` |
| Exclude tiny files | `brennpunkt --min-lines 50` |
| Prioritize branch coverage | `brennpunkt --weights 0.7,0.2,0.1` |
| Check configuration | `brennpunkt --check-config` |
| Create config file | `brennpunkt --init-config` |

### Coverage File Discovery

Brennpunkt automatically searches these locations (in order):

1. `coverage/lcov.info` - Jest, Vitest, c8 (most common)
2. `.coverage/lcov.info` - Some configurations
3. `coverage/lcov/lcov.info` - Karma
4. `lcov.info` - Project root
5. `.nyc_output/lcov.info` - NYC legacy
6. `test-results/lcov.info` - Some CI configs

### Key Options

| Option | Description | Default |
|--------|-------------|---------|
| `[coverage-path]` | Path to lcov.info | Auto-discovered |
| `-w, --weights` | Weights for branches,functions,lines | `0.5,0.3,0.2` |
| `-m, --min-lines` | Exclude files with fewer lines | `10` |
| `-t, --top` | Show only top N files | (all) |
| `-j, --json` | Output as JSON | `false` |
| `-c, --config` | Path to config file | `brennpunkt.yaml` |

### Priority Score Formula

```
score = (branchGap × 0.5 + functionGap × 0.3 + lineGap × 0.2) × log₁₀(lines + 1)
```

Where:
- `branchGap` = 100 - branch coverage %
- `functionGap` = 100 - function coverage %
- `lineGap` = 100 - line coverage %
- `lines` = total lines in file

**Higher score = Higher priority for testing**

## For AI Assistants

If you're an AI helping someone improve test coverage:

1. **Run brennpunkt first**: `brennpunkt --json --top 5` to get prioritized targets
2. **Focus on high-score files**: Files with scores > 50 need attention
3. **Check branch coverage**: It's weighted highest (50%) because untested branches hide bugs
4. **Use JSON output**: Parse the structured data for precise guidance
5. **Respect project config**: Projects may have custom `brennpunkt.yaml` with different weights

> **MCP Server**: Use `npx -p @redaksjon/brennpunkt brennpunkt-mcp` to start an MCP server that allows AI tools to query coverage data directly without running tests. See [AI Integration](./ai-integration.md) for details.

### Cursor Rule (Recommended)

Add this to your project's `.cursorrules` file for automatic coverage analysis:

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

Then just ask: "What files need test coverage?" or "Help me improve test coverage"

### Example Workflow

```bash
# Step 1: Get priority list
brennpunkt --json --top 3

# Step 2: AI receives structured data like:
{
  "files": [
    {
      "file": "src/auth/login.ts",
      "priorityScore": 156.3,
      "uncoveredBranches": 13,
      "uncoveredLines": 45
    }
  ]
}

# Step 3: Write tests for src/auth/login.ts focusing on the 13 untested branches
```

## Configuration File

Create `brennpunkt.yaml` in your project root:

```yaml
# Priority weights (branches, functions, lines)
weights: "0.5,0.3,0.2"

# Minimum lines for inclusion
minLines: 10

# Limit results
top: 20

# Output format
json: false
```

## npm Post-Test Integration

Add to `package.json` for automatic analysis:

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "posttest": "brennpunkt --top 10"
  }
}
```
