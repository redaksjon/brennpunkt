# Configuration

Brennpunkt can be configured via a YAML file in your project directory.

## Configuration File

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

## Generate Default Config

Create a starter configuration file:

```bash
brennpunkt --init-config
```

This creates `brennpunkt.yaml` with all options commented out.

## Custom Config Location

Specify a different config file:

```bash
# Use config in .config directory
brennpunkt --config .config/brennpunkt.yaml

# Generate config at specific path
brennpunkt --init-config --config .config/brennpunkt.yaml
```

## Configuration Options

### `coveragePath`

**Type**: `string`  
**Default**: Auto-discovered

Path to the lcov.info coverage file. If not specified, brennpunkt searches common locations.

```yaml
coveragePath: coverage/lcov.info
```

### `weights`

**Type**: `string` (comma-separated numbers)  
**Default**: `"0.5,0.3,0.2"`

Priority weights for branches, functions, and lines. Should sum to 1.0.

```yaml
# Branch-heavy (for complex conditional logic)
weights: "0.7,0.2,0.1"

# Equal weights
weights: "0.33,0.33,0.34"

# Function-heavy (for finding dead code)
weights: "0.2,0.6,0.2"
```

### `minLines`

**Type**: `number`  
**Default**: `10`

Exclude files with fewer than this many lines. Helps filter noise from tiny files.

```yaml
# Default
minLines: 10

# More aggressive filtering
minLines: 50

# Include everything
minLines: 0
```

### `json`

**Type**: `boolean`  
**Default**: `false`

Output as JSON instead of formatted table.

```yaml
json: true
```

### `top`

**Type**: `number`  
**Default**: (all files)

Limit output to top N priority files.

```yaml
top: 20
```

## Configuration Precedence

Configuration is resolved in this order (highest priority first):

1. **CLI arguments** - Always override everything
2. **Config file** - `brennpunkt.yaml` in current directory
3. **Built-in defaults** - Fallback values

**Example**:

```yaml
# brennpunkt.yaml
weights: "0.6,0.2,0.2"
top: 20
```

```bash
# CLI overrides config file
brennpunkt --top 5
# Uses: weights from config (0.6,0.2,0.2), top=5 from CLI
```

## Check Configuration

View resolved configuration with source tracking:

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

## Environment-Specific Configs

For different environments, use the `--config` flag:

```bash
# Development (verbose)
brennpunkt --config .config/brennpunkt.dev.yaml

# CI (JSON output)
brennpunkt --config .config/brennpunkt.ci.yaml
```

Example CI config:

```yaml
# .config/brennpunkt.ci.yaml
json: true
top: 10
minLines: 20
```

## MCP Server Configuration

The MCP server automatically loads each project's `brennpunkt.yaml`:

- Pass `projectPath` as a parameter to each MCP tool call
- The server reads `{projectPath}/brennpunkt.yaml` if it exists
- Responses include `configUsed: "brennpunkt.yaml"` or `configUsed: "defaults"`
- No per-project MCP server configuration needed

This means different projects can have different analysis settings (weights, minLines, etc.) without any server reconfiguration.

## Monorepo Usage

For monorepos, place config files in each package:

```
packages/
├── auth/
│   ├── brennpunkt.yaml
│   └── coverage/lcov.info
├── api/
│   ├── brennpunkt.yaml
│   └── coverage/lcov.info
└── shared/
    ├── brennpunkt.yaml
    └── coverage/lcov.info
```

Run from each package directory:

```bash
cd packages/auth && brennpunkt
cd packages/api && brennpunkt
```

Or specify paths:

```bash
brennpunkt --config packages/auth/brennpunkt.yaml packages/auth/coverage/lcov.info
```
