# Coverage Review

## Objective

Perform a detailed code review focused on coverage gaps for ${filePattern} in the project.

## Determining the Project Path

The projectPath parameter is: `${projectPath}`

If this shows `[INFER_FROM_CONTEXT]`, determine the correct project path from:
- Recent messages mentioning project paths
- Workspace paths from user_info
- Currently open files
- Git repository information
- Ask the user if unclear

## Review Process

1. **Identify Files for Review**
   - Run `brennpunkt_get_priorities` with the determined projectPath to get the top priority files
   - If a specific file pattern was provided (${filePattern}), focus on matching files
   - Rank files by their priority score (impact on overall coverage)

2. **Detailed File Analysis**

   For each file in the review:

   a. **Get Coverage Details**
      - Run `brennpunkt_get_file_coverage` with the file path
      - Review covered vs. uncovered lines, functions, and branches
      - Examine the actionable suggestions provided

   b. **Identify Untested Code**
      - List specific functions that lack test coverage
      - Identify untested branches (if/else, switch cases, error paths)
      - Note any complex logic that needs thorough testing

   c. **Suggest Test Cases**
      - Recommend specific test scenarios for each untested function
      - Suggest test cases for each untested branch
      - Identify edge cases and boundary conditions to test
      - Note any mocking or test setup required

3. **Prioritize Suggestions**

   Rank test suggestions by:
   - **Impact**: Tests that cover many lines/branches
   - **Risk**: Testing code that's likely to have bugs
   - **Complexity**: Start with simpler tests, build up to complex scenarios
   - **Dependencies**: Tests that don't require extensive mocking

4. **Create Action Plan**

   For each file, provide:
   - Current coverage: X% lines, Y% branches, Z% functions
   - Target coverage after suggested tests
   - List of specific test cases to write (in priority order)
   - Any test infrastructure needed (mocks, fixtures, utilities)

## Available Resources

- Priority files: `brennpunkt://priorities?projectPath=${projectPath}&top=5`
- File-specific coverage details via `brennpunkt_get_file_coverage`

## Review Output

The review should produce:
- A ranked list of files with coverage gaps
- Specific, actionable test cases for each file
- Estimated impact of suggested tests on overall coverage
- Any patterns or systemic issues discovered
