# AI & MCP Integration

Brennpunkt is designed to work with AI coding assistants. This guide explains how to use Brennpunkt with AI tools and how to configure it as an MCP server.

## The Problem with AI and Coverage

When you ask an AI assistant to "improve test coverage," it typically:

1. Runs `npm test -- --coverage` (slow, 30s-5min)
2. Parses text output or reads raw files
3. Tries to interpret percentage tables
4. Guesses where to focus

**This is wasteful.** Coverage data often already exists. The AI shouldn't re-run tests just to know where to focus.

## Solution 1: JSON Output (Simple)

The simplest integration is using Brennpunkt's JSON output in your prompts:

```bash
# Generate prioritized JSON
brennpunkt --json --top 5 > coverage-priority.json
```

Then tell your AI:
```
Read coverage-priority.json and write tests for the highest priority files.
Focus on the specific suggestions in each file's "suggestedFocus" field.
```

### Example Prompt

```
I need to improve test coverage. Here's the priority analysis:

$(brennpunkt --json --top 3)

Write tests for the #1 priority file. Focus on the untested branches first.
```

### JSON Structure

```json
{
  "overall": {
    "lines": { "found": 1572, "hit": 1234, "coverage": 78.5 },
    "functions": { "found": 190, "hit": 156, "coverage": 82.1 },
    "branches": { "found": 150, "hit": 98, "coverage": 65.3 }
  },
  "files": [
    {
      "file": "src/auth/login.ts",
      "priorityScore": 156.32,
      "uncoveredLines": 120,
      "uncoveredBranches": 13,
      "lines": { "coverage": 45.0 },
      "functions": { "coverage": 50.0 },
      "branches": { "coverage": 35.0 }
    }
  ]
}
```

## Solution 2: Cursor Rule (No Setup Required)

The fastest way to use Brennpunkt with Cursor—no MCP configuration needed:

### Add to `.cursorrules`

Create or edit `.cursorrules` in your project root:

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

### Usage

After adding this rule, ask Cursor:
- "What files need test coverage?"
- "Help me improve test coverage"
- "Where should I focus my testing efforts?"

The AI will automatically run brennpunkt and provide actionable recommendations.

## Solution 3: MCP Server

For deeper integration, Brennpunkt runs as an MCP (Model Context Protocol) server, allowing AI tools to query coverage data directly.

### What is MCP?

MCP is a protocol that allows AI tools (Cursor, Claude Desktop, etc.) to interact with external services. Instead of the AI parsing command output, it calls structured tools and receives structured data.

### Key Features

- **Reads existing coverage data** — Does NOT run tests
- **Universal** — Works with any test framework producing lcov format (Jest, Vitest, Mocha, c8, NYC, Karma, AVA, Playwright, etc.)
- **Project-aware** — Automatically loads each project's `brennpunkt.yaml` configuration
- **Fast** — Sub-100ms responses with intelligent caching
- **Multi-project** — Query any project path, no per-project server setup

### Available MCP Tools

All tools read EXISTING coverage data (lcov.info) — they do NOT run tests.

| Tool | Purpose |
|------|---------|
| `brennpunkt_get_priorities` | Get files ranked by testing priority with reasons and suggestions |
| `brennpunkt_coverage_summary` | Quick overview: percentages, status, quick wins, top priority |
| `brennpunkt_get_file_coverage` | Detailed coverage for a specific file |
| `brennpunkt_estimate_impact` | "If I test these files, will I hit 90%?" |

### Setting Up MCP

#### 1. Install Brennpunkt

```bash
npm install -g @redaksjon/brennpunkt
```

#### 2. Configure MCP Client (One-Time Setup)

For **Cursor**, add to your MCP configuration:

```json
{
  "mcpServers": {
    "brennpunkt": {
      "command": "brennpunkt-mcp"
    }
  }
}
```

For **Claude Desktop**, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "brennpunkt": {
      "command": "npx",
      "args": ["@redaksjon/brennpunkt-mcp"]
    }
  }
}
```

**Important**: No `cwd` needed! The project path is passed as a parameter to each tool call, so one MCP server works for all your projects. The AI automatically uses the current workspace path.

### Project Configuration Support

When you call any MCP tool, Brennpunkt automatically checks for a `brennpunkt.yaml` in the project directory:

```yaml
# /path/to/project/brennpunkt.yaml
coveragePath: coverage/lcov.info
weights: "0.7,0.2,0.1"   # Custom weights for this project
minLines: 20              # Higher threshold
```

Every response includes a `configUsed` field showing what settings were applied:

```json
{
  "projectPath": "/path/to/project",
  "configUsed": "brennpunkt.yaml",  // or "defaults"
  ...
}
```

This means different projects can have different analysis settings without any server reconfiguration. A project that needs to prioritize branch coverage can do so, while another using defaults works just as well.

#### 3. Use in Conversations

Once configured, you can ask:

> "What files should I focus on to improve test coverage?"

The AI will call `brennpunkt_get_priorities` and receive:

```json
{
  "priorities": [
    {
      "file": "src/auth/login.ts",
      "priorityScore": 156.3,
      "reason": "35% branch coverage. 13 untested branches in authentication logic.",
      "suggestedFocus": "Focus on testing conditional logic, error handling paths."
    }
  ]
}
```

### MCP Tool Reference

All tools require `projectPath` - the AI automatically provides this from the current workspace.

#### `brennpunkt_get_priorities`

Get the highest-priority files for testing.

**Input:**
```json
{
  "projectPath": "/path/to/project",  // Required - AI provides automatically
  "top": 5,        // Number of files (default: 5)
  "minLines": 10   // Exclude small files (default: 10)
}
```

**Output:**
```json
{
  "projectPath": "/path/to/project",
  "configUsed": "brennpunkt.yaml",
  "overall": {
    "lines": 85.2,
    "functions": 90.0,
    "branches": 72.5
  },
  "priorities": [
    {
      "file": "src/auth/login.ts",
      "priorityScore": 156.3,
      "coverage": { "lines": 45.0, "functions": 50.0, "branches": 35.0 },
      "uncovered": { "lines": 120, "branches": 13, "functions": 5 },
      "reason": "35% branch coverage. 13 untested branches.",
      "suggestedFocus": "Focus on testing conditional logic."
    }
  ]
}
```

#### `brennpunkt_coverage_summary`

Quick overview of coverage status.

**Input:**
```json
{
  "projectPath": "/path/to/project"  // Required
}
```

**Output:**
```json
{
  "projectPath": "/path/to/project",
  "overall": {
    "lines": { "percentage": 85.2, "status": "warning" },
    "functions": { "percentage": 90.0, "status": "ok" },
    "branches": { "percentage": 72.5, "status": "critical" }
  },
  "filesAnalyzed": 42,
  "topPriority": "src/auth/login.ts (score: 156.3)",
  "quickWins": [
    "src/utils/validator.ts - 5 uncovered lines (~1.2% impact)"
  ]
}
```

#### `brennpunkt_get_file_coverage`

Detailed coverage for a specific file.

**Input:**
```json
{
  "projectPath": "/path/to/project",  // Required
  "file": "src/auth/login.ts"         // Required
}
```

**Output:**
```json
{
  "projectPath": "/path/to/project",
  "file": "src/auth/login.ts",
  "coverage": {
    "lines": { "covered": 98, "total": 218, "percentage": 45.0 },
    "functions": { "covered": 5, "total": 10, "percentage": 50.0 },
    "branches": { "covered": 7, "total": 20, "percentage": 35.0 }
  },
  "uncovered": {
    "lines": 120,
    "functions": 5,
    "branches": 13
  },
  "suggestedFocus": "Focus on testing conditional logic."
}
```

#### `brennpunkt_estimate_impact`

Estimate coverage improvement for specific files.

**Input:**
```json
{
  "projectPath": "/path/to/project",  // Required
  "files": ["src/auth/login.ts", "src/api/handler.ts"]  // Required
}
```

**Output:**
```json
{
  "projectPath": "/path/to/project",
  "currentCoverage": { "lines": 85.2, "functions": 90.0, "branches": 72.5 },
  "estimatedCoverage": { "lines": 91.8, "functions": 95.0, "branches": 84.3 },
  "improvement": { "lines": "+6.6%", "functions": "+5.0%", "branches": "+11.8%" }
}
```

## Example AI Workflows

### Workflow: "Get me to 90% coverage"

```
Human: I need to get to 90% line coverage. Help me prioritize.

AI: [calls brennpunkt_coverage_summary]

AI: You're at 85.2% line coverage, 4.8% below target.

AI: [calls brennpunkt_get_priorities with top=5]

AI: Here are the files with the biggest impact:

1. src/auth/login.ts (score: 156.3)
   - 45% line coverage, 35% branch coverage
   - Focus: error handling in validateCredentials()

Let me write tests for the highest priority...
```

### Workflow: "What's untested here?"

```
Human: What needs testing in src/auth/login.ts?

AI: [calls brennpunkt_get_file_coverage with file="src/auth/login.ts"]

AI: This file has 45% line coverage. Here's what's untested:

- 120 uncovered lines
- 13 untested branches (conditional logic)
- 5 untested functions

The tool suggests focusing on error handling paths.
Want me to write tests?
```

### Workflow: "Quick wins"

```
Human: What's the fastest way to improve coverage?

AI: [calls brennpunkt_coverage_summary]

AI: Quick wins:
- src/utils/validator.ts - 5 lines for ~1.2% impact
- src/config/parser.ts - 8 lines for ~0.8% impact

8 tests total for +2% coverage. Write these?
```

## Best Practices

### For AI Prompt Engineering

1. **Include priority scores** - They indicate effort-to-impact ratio
2. **Use JSON output** - Structured data is easier for AI to parse
3. **Limit results** - `--top 5` keeps context manageable
4. **Include coverage type** - Branch coverage is most important for finding bugs

### For MCP Integration

1. **Cache is automatic** - Brennpunkt caches parsed lcov.info
2. **Fast queries** - Sub-100ms responses, no test runs
3. **Actionable data** - Includes suggestions, not just numbers
4. **Graceful errors** - Clear messages when coverage data missing
5. **Project config respected** - Each project's `brennpunkt.yaml` is automatically loaded and used

## Comparison: Before and After

| Aspect | Without Brennpunkt | With Brennpunkt MCP |
|--------|-------------------|---------------------|
| Speed | 30s-5min (runs tests) | <100ms (queries cache) |
| Data | Raw percentages | Prioritized, actionable |
| Focus | AI guesses priorities | Clear ranked list |
| Context | Numbers only | Reasons + suggestions |
| Efficiency | Redundant test runs | Single data source |
