# Analyze Coverage Gaps

## Objective

Understand why test coverage is below ${targetPercentage}% and identify patterns in coverage gaps.

## Determining the Project Path

The projectPath parameter is: `${projectPath}`

If this shows `[INFER_FROM_CONTEXT]`, determine the correct project path from:
- Recent messages mentioning project paths
- Workspace paths from user_info
- Currently open files
- Git repository information
- Ask the user if unclear

## Analysis Plan

1. **Get Current Coverage Summary**
   - Run `brennpunkt_coverage_summary` with the determined projectPath
   - Review overall coverage percentages for lines, branches, and functions
   - Identify which metric (lines/branches/functions) is furthest from the target

2. **Examine High-Priority Files**
   - Run `brennpunkt_get_priorities` with top=10 to see the files with the biggest gaps
   - Look at the priority scores and suggestions for each file
   - Identify common patterns across the top files

3. **Identify Patterns**

   Look for systemic issues such as:
   - **Module Patterns**: Are gaps concentrated in specific modules or directories?
   - **Metric Patterns**: Is one metric (branches, functions, lines) consistently lower?
   - **Code Patterns**: Are certain types of code consistently untested?
     - Error handling and exception paths
     - Edge cases and boundary conditions
     - Async/promise rejection paths
     - Complex conditional logic
     - Utility functions vs. core business logic

4. **Categorize Gaps**

   Group untested code by reason:
   - **Low-hanging fruit**: Simple functions that just need basic tests
   - **Edge cases**: Boundary conditions that need special test setup
   - **Error paths**: Exception handling that requires mocking failures
   - **Complex scenarios**: Code requiring significant test infrastructure

5. **Recommend Next Steps**

   Based on the patterns, suggest:
   - Which areas to focus on first
   - What testing infrastructure might be needed
   - Whether to focus on breadth (many simple tests) or depth (complex scenarios)

## Available Resources

- Full coverage data: `brennpunkt://coverage?projectPath=${projectPath}`
- Priority analysis: `brennpunkt://priorities?projectPath=${projectPath}&top=10`

## Expected Insights

This analysis should reveal:
- The primary bottleneck preventing higher coverage
- Whether gaps are scattered or concentrated
- What types of tests would have the highest impact
- Whether current gaps indicate missing test infrastructure
