# Usage Reference

Complete CLI reference for brennpunkt.

## Basic Syntax

```bash
brennpunkt [coverage-path] [options]
```

## Arguments

### `[coverage-path]`

Path to the lcov.info file. Optional - if not provided, brennpunkt auto-discovers the file.

**Auto-discovery locations** (searched in order):

1. `coverage/lcov.info` - Jest, Vitest, c8
2. `.coverage/lcov.info` - Some configurations
3. `coverage/lcov/lcov.info` - Karma
4. `lcov.info` - Project root
5. `.nyc_output/lcov.info` - NYC legacy
6. `test-results/lcov.info` - Some CI configs

## Options

### `-w, --weights <weights>`

Custom weights for branches, functions, and lines coverage. Must be three comma-separated numbers.

```bash
# Default: branches=0.5, functions=0.3, lines=0.2
brennpunkt --weights 0.5,0.3,0.2

# Prioritize branch coverage heavily
brennpunkt --weights 0.7,0.2,0.1

# Equal weights
brennpunkt --weights 0.33,0.33,0.34

# Focus on function coverage
brennpunkt --weights 0.2,0.6,0.2
```

### `-m, --min-lines <number>`

Exclude files with fewer than N lines. Helps filter out tiny utility files.

```bash
# Default: 10 lines
brennpunkt --min-lines 10

# Only analyze files with 50+ lines
brennpunkt --min-lines 50

# Include all files (even 1-line files)
brennpunkt --min-lines 0
```

### `-t, --top <number>`

Show only the top N priority files.

```bash
# Show top 10
brennpunkt --top 10

# Show top 3
brennpunkt --top 3

# Show all files (default)
brennpunkt
```

### `-j, --json`

Output results as JSON instead of a formatted table.

```bash
# JSON output
brennpunkt --json

# JSON with top 5
brennpunkt --json --top 5

# Save to file
brennpunkt --json > coverage-priority.json

# Pipe to jq
brennpunkt --json | jq '.files[0].file'
```

### `-c, --config <path>`

Specify a custom configuration file path.

```bash
# Use specific config
brennpunkt --config .config/brennpunkt.yaml

# Use config in different location
brennpunkt --config ~/brennpunkt-global.yaml
```

### `--init-config`

Generate a default `brennpunkt.yaml` configuration file.

```bash
# Create in current directory
brennpunkt --init-config

# Create at specific path
brennpunkt --init-config --config .config/brennpunkt.yaml
```

### `--check-config`

Display the resolved configuration with source tracking.

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
  [default]     minLines       : 10
  [default]     json           : false
  [config file] top            : 20

================================================================================
```

### `-V, --version`

Show version number.

### `-h, --help`

Show help message.

## Examples

### Basic Usage

```bash
# Analyze current project
brennpunkt

# Analyze specific file
brennpunkt path/to/lcov.info

# Show top priorities
brennpunkt --top 10
```

### CI/CD Usage

```bash
# GitHub Actions / CI pipeline
npx @redaksjon/brennpunkt --top 10

# Save JSON artifact
npx @redaksjon/brennpunkt --json > coverage-priority.json
```

### Automation

```bash
# Get top priority file
TOP_FILE=$(brennpunkt --json --top 1 | jq -r '.files[0].file')
echo "Focus on: $TOP_FILE"

# Check if any file has score > 100
brennpunkt --json | jq '.files[] | select(.priorityScore > 100)'

# Fail if highest priority score is too high
SCORE=$(brennpunkt --json --top 1 | jq '.files[0].priorityScore')
if (( $(echo "$SCORE > 150" | bc -l) )); then
  echo "Critical coverage gap detected!"
  exit 1
fi
```

### Combining Options

```bash
# Full analysis with custom weights, filtered
brennpunkt --weights 0.6,0.2,0.2 --min-lines 50 --top 20

# JSON output for top priorities
brennpunkt --json --top 5 --min-lines 20
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (file not found, invalid arguments, etc.) |

## Output Formats

### Table Output (Default)

Human-readable formatted table with:
- Overall coverage summary
- Per-file coverage metrics
- Priority scores
- Recommended focus areas

### JSON Output

Machine-readable format:

```json
{
  "overall": {
    "lines": { "found": 1572, "hit": 1234, "coverage": 78.5 },
    "functions": { "found": 190, "hit": 156, "coverage": 82.1 },
    "branches": { "found": 150, "hit": 98, "coverage": 65.3 },
    "fileCount": 25
  },
  "files": [
    {
      "file": "src/auth/login.ts",
      "lines": { "found": 218, "hit": 98, "coverage": 45.0 },
      "functions": { "found": 10, "hit": 5, "coverage": 50.0 },
      "branches": { "found": 20, "hit": 7, "coverage": 35.0 },
      "priorityScore": 156.32,
      "uncoveredLines": 120,
      "uncoveredBranches": 13
    }
  ]
}
```
