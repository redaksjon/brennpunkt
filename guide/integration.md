# CI/CD Integration

How to integrate brennpunkt into your development workflow and CI pipelines.

## npm Post-Test Hook

The simplest integration - run brennpunkt automatically after every test:

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "posttest": "brennpunkt --top 10"
  }
}
```

Now `npm test` automatically shows coverage priorities:

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

## GitHub Actions

### Basic Integration

Add to your test workflow:

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
```

### Save JSON Artifact

Store the priority report for later analysis:

```yaml
      - name: Generate Priority Report
        run: npx @redaksjon/brennpunkt --json > coverage-priority.json
      
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-priority
          path: coverage-priority.json
```

### PR Comment

Post coverage priorities as a PR comment:

```yaml
      - name: Coverage Priority Analysis
        id: coverage
        run: |
          OUTPUT=$(npx @redaksjon/brennpunkt --top 5 2>&1)
          echo "report<<EOF" >> $GITHUB_OUTPUT
          echo "$OUTPUT" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Comment on PR
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '## Coverage Priority Analysis\n\n```\n${{ steps.coverage.outputs.report }}\n```'
            })
```

## GitLab CI

```yaml
test:
  stage: test
  script:
    - npm ci
    - npm test -- --coverage
    - npx @redaksjon/brennpunkt --top 10
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage-priority.json
    when: always
```

## Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm test -- --coverage'
                sh 'npx @redaksjon/brennpunkt --top 10'
            }
        }
        stage('Coverage Report') {
            steps {
                sh 'npx @redaksjon/brennpunkt --json > coverage-priority.json'
                archiveArtifacts artifacts: 'coverage-priority.json'
            }
        }
    }
}
```

## CircleCI

```yaml
version: 2.1
jobs:
  test:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run: npm ci
      - run: npm test -- --coverage
      - run: npx @redaksjon/brennpunkt --top 10
      - store_artifacts:
          path: coverage
          destination: coverage
```

## Quality Gates

### Fail on High-Priority Gaps

Block builds when critical files have unacceptable coverage:

```bash
#!/bin/bash
# scripts/coverage-gate.sh

# Get the highest priority score
TOP_SCORE=$(npx @redaksjon/brennpunkt --json --top 1 | jq '.files[0].priorityScore // 0')

echo "Top priority score: $TOP_SCORE"

# Fail if score exceeds threshold
if (( $(echo "$TOP_SCORE > 100" | bc -l) )); then
  echo "❌ High-priority coverage gap detected (score: $TOP_SCORE)"
  echo ""
  echo "Files needing attention:"
  npx @redaksjon/brennpunkt --top 5
  exit 1
fi

echo "✅ Coverage priorities within acceptable range"
```

### Multiple Thresholds

```bash
#!/bin/bash
# scripts/coverage-gate.sh

CRITICAL_THRESHOLD=150
WARNING_THRESHOLD=75

TOP_SCORE=$(npx @redaksjon/brennpunkt --json --top 1 | jq '.files[0].priorityScore // 0')

if (( $(echo "$TOP_SCORE > $CRITICAL_THRESHOLD" | bc -l) )); then
  echo "❌ CRITICAL: Coverage gap too high (score: $TOP_SCORE > $CRITICAL_THRESHOLD)"
  npx @redaksjon/brennpunkt --top 5
  exit 1
elif (( $(echo "$TOP_SCORE > $WARNING_THRESHOLD" | bc -l) )); then
  echo "⚠️ WARNING: Coverage gap detected (score: $TOP_SCORE > $WARNING_THRESHOLD)"
  npx @redaksjon/brennpunkt --top 5
  # Don't fail, just warn
fi

echo "✅ Coverage priorities acceptable"
```

## Pre-Commit Hook

Run brennpunkt before committing:

```bash
# .husky/pre-commit
npm test -- --coverage
npx @redaksjon/brennpunkt --top 5
```

## Scheduled Reports

Generate weekly coverage priority reports:

```yaml
# .github/workflows/weekly-coverage.yml
name: Weekly Coverage Report

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm test -- --coverage
      
      - name: Generate Report
        run: |
          echo "# Weekly Coverage Priority Report" > report.md
          echo "" >> report.md
          echo "Generated: $(date)" >> report.md
          echo "" >> report.md
          echo '```' >> report.md
          npx @redaksjon/brennpunkt --top 20 >> report.md
          echo '```' >> report.md
      
      - name: Create Issue
        uses: peter-evans/create-issue-from-file@v4
        with:
          title: Weekly Coverage Priority Report
          content-filepath: report.md
          labels: coverage,automated
```

## Makefile Integration

```makefile
.PHONY: test coverage priority

test:
	npm test -- --coverage

coverage: test
	npx @redaksjon/brennpunkt --top 10

priority:
	npx @redaksjon/brennpunkt --json > coverage-priority.json

check: test
	@./scripts/coverage-gate.sh
```
