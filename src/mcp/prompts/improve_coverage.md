# Improve Test Coverage

## Objective

Improve test coverage for the project to reach ${targetPercentage}% ${focusMetric} coverage.

## Determining the Project Path

**IMPORTANT**: The projectPath parameter is: `${projectPath}`

If this shows `[INFER_FROM_CONTEXT]`, you need to determine the correct project path from the conversation context:

1. **Check recent messages** - Look for explicit project paths mentioned by the user
2. **Check workspace paths** - Use the workspace paths from user_info (usually provided at the start)
3. **Check open files** - Look at currently open files to identify the project root
4. **Check git repositories** - Use git_status information to identify the project directory
5. **Look for package.json** - The project root typically contains a package.json file
6. **Ask if unclear** - If you cannot confidently determine the path, ask the user

Common patterns:
- User mentions a specific directory: `/Users/username/project`
- User references a workspace: Use the workspace root from user_info
- Files are open from a specific project: Use that project's root directory
- Multiple projects in workspace: Ask which one to analyze

Once you've determined the correct path, use it consistently in all tool calls below.

## Workflow Steps

1. **Check Current Coverage**
   - Run `brennpunkt_coverage_summary` with the determined projectPath
   - Review current coverage percentages (lines, branches, functions)
   - Identify the gap between current and target coverage

2. **Identify Priority Files**
   - Run `brennpunkt_get_priorities` to get the top files for testing
   - These files are ranked by potential impact on overall coverage
   - Focus on files with high priority scores

3. **Estimate Impact**
   - Run `brennpunkt_estimate_impact` with the identified high-priority files
   - Verify that testing these files will achieve the ${targetPercentage}% target
   - If not sufficient, expand the list of files to test

4. **Write Tests**
   - For each high-priority file:
     - Use `brennpunkt_get_file_coverage` to understand specific gaps
     - Identify untested functions, branches, and edge cases
     - Write comprehensive tests focusing on the identified gaps
   - Re-run coverage checks after each batch of tests to track progress

5. **Iterate Until Target Reached**
   - Continue the cycle: identify gaps → write tests → measure progress
   - Prioritize files with the highest impact/effort ratio
   - Stop when ${targetPercentage}% ${focusMetric} coverage is achieved

## Available Resources

The following MCP resources provide coverage data:
- Coverage summary: `brennpunkt://coverage?projectPath=${projectPath}`
- Priority files: `brennpunkt://priorities?projectPath=${projectPath}&top=5`
- Quick wins: `brennpunkt://quick-wins?projectPath=${projectPath}&minLines=100`

## Important Notes

- **Focus on Impact**: Prioritize files that will have the biggest impact on overall coverage
- **Quality Over Quantity**: Write meaningful tests that catch real bugs, not just lines to hit coverage targets
- **Maintain Existing Coverage**: Ensure new code doesn't reduce existing coverage percentages
