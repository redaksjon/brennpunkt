# Quick Wins for Coverage Improvement

## Objective

Find fast paths to improve test coverage by targeting small files with high impact.

Time constraint: ${timeConstraint}

## Determining the Project Path

The projectPath parameter is: `${projectPath}`

If this shows `[INFER_FROM_CONTEXT]`, determine the correct project path from:
- Recent messages mentioning project paths
- Workspace paths from user_info
- Currently open files
- Git repository information
- Ask the user if unclear

## Strategy

1. **Identify Quick Wins**
   - Use resource: `brennpunkt://quick-wins?projectPath=${projectPath}&minLines=100`
   - This returns small files (<100 lines) with coverage gaps
   - Files are ranked by potential impact on overall coverage

2. **Estimate Total Impact**
   - Run `brennpunkt_estimate_impact` with the identified quick-win files
   - Calculate how much overall coverage would improve if these files were fully tested
   - Verify that the effort/impact ratio is favorable

3. **Present Priority List**

   For each quick-win file, provide:
   - File path and size (lines of code)
   - Current coverage percentages
   - Estimated impact on overall coverage
   - Suggested test approach (what to focus on)

4. **Suggest Test Approaches**

   For each file, recommend:
   - What types of tests to write (unit, integration)
   - Key functions or branches to target
   - Any test utilities or mocks needed
   - Estimated number of test cases required

## Criteria for Quick Wins

- **Small size**: Files with fewer than 100 lines of code
- **High impact**: Significant contribution to overall coverage when tested
- **Low complexity**: Files that don't require extensive test infrastructure
- **Current gaps**: Files with existing coverage gaps to fill

## Time Constraints

Based on ${timeConstraint} time available:
- **quick**: Focus on 5 smallest, highest-impact files
- **moderate**: Target 10 files with good impact/effort ratio
- **thorough**: Include up to 20 files for comprehensive improvement

## Expected Outcome

After completing the quick wins:
- Noticeable improvement in overall coverage percentage
- Better coverage across many files (breadth over depth)
- Foundation for tackling more complex coverage gaps
