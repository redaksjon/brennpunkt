# Priority Scoring

How brennpunkt calculates priority scores to identify where testing efforts will have the biggest impact.

## The Formula

```
priorityScore = (branchGap × branchWeight + functionGap × functionWeight + lineGap × lineWeight) × log₁₀(lines + 1)
```

Where:
- `branchGap` = 100 - branch coverage percentage
- `functionGap` = 100 - function coverage percentage
- `lineGap` = 100 - line coverage percentage
- `lines` = total lines of code in the file

## Default Weights

| Metric | Weight | Reason |
|--------|--------|--------|
| Branch Coverage | 0.5 (50%) | Untested branches hide conditional bugs |
| Function Coverage | 0.3 (30%) | Untested functions indicate dead code or missing tests |
| Line Coverage | 0.2 (20%) | Basic execution path; high coverage doesn't guarantee correctness |

## Why These Weights?

### Branch Coverage (50%)

Branches are the most important because:
- A function can execute but still have untested error paths
- Untested `if/else` and `switch` cases often hide bugs
- Edge cases and error handling live in branches

**Example**: A login function might have 100% line coverage but 50% branch coverage because the "invalid password" path was never tested.

### Function Coverage (30%)

Untested functions indicate:
- Dead code that should be removed
- Missing feature tests
- Code paths that aren't exercised

### Line Coverage (20%)

Line coverage is the baseline but:
- High line coverage doesn't mean the code is correct
- It only shows that lines executed, not that they work correctly
- Often inflated by simple getter/setter tests

## Size Scaling

The `log₁₀(lines + 1)` factor means:
- Larger files with low coverage rank higher
- A 1000-line file at 50% coverage ranks higher than a 10-line file at 50%
- The logarithmic scale prevents huge files from dominating

**Example scaling**:
| Lines | Multiplier |
|-------|------------|
| 10 | 1.04 |
| 100 | 2.00 |
| 500 | 2.70 |
| 1000 | 3.00 |
| 5000 | 3.70 |

## Example Calculations

### File A: Large file, low coverage

```
file: src/complex-module.ts
lines: 500
branchCoverage: 40%
functionCoverage: 60%
lineCoverage: 70%

branchGap = 100 - 40 = 60
functionGap = 100 - 60 = 40
lineGap = 100 - 70 = 30

weightedGap = (60 × 0.5) + (40 × 0.3) + (30 × 0.2)
            = 30 + 12 + 6 = 48

priorityScore = 48 × log₁₀(501)
              = 48 × 2.70
              = 129.6
```

### File B: Small file, very low coverage

```
file: src/tiny-util.ts
lines: 20
branchCoverage: 0%
functionCoverage: 0%
lineCoverage: 50%

branchGap = 100
functionGap = 100
lineGap = 50

weightedGap = (100 × 0.5) + (100 × 0.3) + (50 × 0.2)
            = 50 + 30 + 10 = 90

priorityScore = 90 × log₁₀(21)
              = 90 × 1.32
              = 118.8
```

Even though File B has worse coverage percentages, File A ranks higher because it's a larger file with more impact.

## Customizing Weights

### Prioritize Branch Coverage

When you want to focus on conditional logic:

```bash
brennpunkt --weights 0.7,0.2,0.1
```

Good for:
- Complex business logic
- Error handling code
- Authentication/authorization

### Equal Weights

When all coverage types matter equally:

```bash
brennpunkt --weights 0.33,0.33,0.34
```

Good for:
- General code quality
- Balanced improvement

### Prioritize Function Coverage

When you suspect dead code:

```bash
brennpunkt --weights 0.2,0.6,0.2
```

Good for:
- Legacy codebases
- Code cleanup projects
- Finding unused features

## Interpreting Scores

| Score Range | Priority | Action |
|-------------|----------|--------|
| > 100 | Critical | Focus testing efforts here immediately |
| 50-100 | High | Should be addressed in next sprint |
| 20-50 | Medium | Add to tech debt backlog |
| < 20 | Low | Acceptable for now |

## Score = 0

A score of 0 means:
- 100% coverage on all metrics, OR
- File excluded by `--min-lines` filter

## Files Not Scored

Files are excluded from scoring if:
- They have fewer lines than `--min-lines` threshold
- They have no coverage data (not instrumented)
- They're test files or config files (depending on your coverage setup)
