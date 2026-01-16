# Quick Start Guide

Get brennpunkt working in 2 minutes.

## Prerequisites

- Node.js 20+
- A project with lcov.info coverage output

## Installation

```bash
npm install -g @redaksjon/brennpunkt
```

Or use directly with npx:

```bash
npx @redaksjon/brennpunkt
```

## First Analysis

### 1. Generate Coverage

Run your tests with coverage enabled:

```bash
# Vitest
npm test -- --coverage

# Jest  
npm test -- --coverage

# c8/NYC
npx c8 npm test
```

### 2. Run Brennpunkt

```bash
# Auto-discovers coverage file
brennpunkt

# Or specify path explicitly
brennpunkt coverage/lcov.info
```

### 3. View Results

```
📊 Coverage Priority Report

┌─────────────────────────────────────────────────────────────────┐
│                      OVERALL COVERAGE                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Lines: 85.20%  │  Functions: 90.00%  │  Branches: 72.50%       │
└─────────────────┴─────────────────┴─────────────────────────────┘

Priority  File                          Lines    Funcs    Branch   Score
────────────────────────────────────────────────────────────────────────
#1        src/auth/login.ts            45.2%    50.0%    35.0%    156.3
#2        src/api/handler.ts           62.5%    70.0%    55.0%    98.7
#3        src/utils/parser.ts          78.3%    85.0%    68.2%    67.2

🎯 Recommended Focus (Top 3):
  1. src/auth/login.ts - 13 untested branches, 5 untested functions
```

## Common Options

```bash
# Show only top 10 priority files
brennpunkt --top 10

# JSON output for automation
brennpunkt --json

# Custom weights (prioritize branch coverage)
brennpunkt --weights 0.7,0.2,0.1

# Exclude small files
brennpunkt --min-lines 50

# Verbose output
brennpunkt --verbose
```

## Automatic Post-Test Analysis

Add to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "posttest": "brennpunkt --top 10"
  }
}
```

Now every `npm test` automatically shows coverage priorities.

## Create Configuration File

```bash
# Generate default config
brennpunkt --init-config

# View resolved config
brennpunkt --check-config
```

## Next Steps

- [Usage Reference](./usage.md): All CLI options
- [Scoring](./scoring.md): Understand priority scores
- [Integration](./integration.md): CI/CD setup
- [Configuration](./configuration.md): Config file options
