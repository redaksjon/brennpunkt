import React from 'react'

function App() {
    return (
        <div className="site">
            {/* Hero Section */}
            <header className="hero">
                <div className="hero-glow"></div>
                <div className="hero-content">
                    <div className="badge">Test Coverage Analysis</div>
                    <h1 className="title">Brennpunkt</h1>
                    <p className="tagline">
                        Identify where to focus testing efforts next.
                        <br />
                        <span className="highlight">Stop guessing. Start prioritizing.</span>
                    </p>
                    <div className="hero-actions">
                        <a href="https://www.npmjs.com/package/@redaksjon/brennpunkt" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                            npm install -g @redaksjon/brennpunkt
                        </a>
                        <a href="https://github.com/redaksjon/brennpunkt" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                            View on GitHub
                        </a>
                    </div>
                </div>
            </header>

            {/* What is Brennpunkt - Introduction */}
            <section className="intro-section">
                <div className="container">
                    <h2 className="section-title">What is Brennpunkt?</h2>
                    <p className="intro-lead">
                        Brennpunkt analyzes test coverage reports and tells you <strong>where to focus your testing efforts for maximum impact</strong>. 
                        Instead of raw percentages, it calculates a priority score for each file.
                    </p>
                    
                    <div className="intro-subtitle">Think of it as a coverage report that actually tells you what to do next.</div>
                    
                    <div className="workflow-diagram">
                        <div className="workflow-step">
                            <div className="workflow-icon">🧪</div>
                            <div className="workflow-label">Your Tests</div>
                            <div className="workflow-detail">Jest, Vitest, Mocha...</div>
                        </div>
                        <div className="workflow-arrow">→</div>
                        <div className="workflow-step">
                            <div className="workflow-icon">📊</div>
                            <div className="workflow-label">Coverage Tool</div>
                            <div className="workflow-detail">v8, istanbul, c8</div>
                        </div>
                        <div className="workflow-arrow">→</div>
                        <div className="workflow-step">
                            <div className="workflow-icon">📄</div>
                            <div className="workflow-label">lcov.info</div>
                            <div className="workflow-detail">Raw coverage data</div>
                        </div>
                        <div className="workflow-arrow">→</div>
                        <div className="workflow-step highlighted">
                            <div className="workflow-icon">🔥</div>
                            <div className="workflow-label">Brennpunkt</div>
                            <div className="workflow-detail">Prioritizes action</div>
                        </div>
                        <div className="workflow-arrow">→</div>
                        <div className="workflow-step">
                            <div className="workflow-icon">🎯</div>
                            <div className="workflow-label">Action List</div>
                            <div className="workflow-detail">Where to test next</div>
                        </div>
                    </div>
                    
                    <div className="compatibility-section">
                        <h3>Works With Your Stack</h3>
                        <div className="compatibility-grid">
                            <div className="compat-card">
                                <div className="compat-header">Test Frameworks</div>
                                <div className="compat-list">
                                    <span className="compat-item">Vitest</span>
                                    <span className="compat-item">Jest</span>
                                    <span className="compat-item">Mocha</span>
                                    <span className="compat-item">AVA</span>
                                    <span className="compat-item">Karma</span>
                                    <span className="compat-item">Playwright</span>
                                </div>
                            </div>
                            <div className="compat-card">
                                <div className="compat-header">Coverage Providers</div>
                                <div className="compat-list">
                                    <span className="compat-item">V8 (native)</span>
                                    <span className="compat-item">c8</span>
                                    <span className="compat-item">Istanbul</span>
                                    <span className="compat-item">NYC</span>
                                </div>
                            </div>
                            <div className="compat-card">
                                <div className="compat-header">CI Systems</div>
                                <div className="compat-list">
                                    <span className="compat-item">GitHub Actions</span>
                                    <span className="compat-item">GitLab CI</span>
                                    <span className="compat-item">Jenkins</span>
                                    <span className="compat-item">CircleCI</span>
                                </div>
                            </div>
                        </div>
                        <p className="compat-note">
                            Any tool that produces <code>lcov.info</code> format works with Brennpunkt.
                        </p>
                    </div>
                </div>
            </section>

            {/* The Challenge - Story Section */}
            <section className="challenge-section">
                <div className="container">
                    <h2 className="section-title">The Challenge</h2>
                    <div className="challenge-story">
                        <div className="challenge-scenario">
                            <div className="scenario-terminal">
                                <div className="terminal-header small">
                                    <span className="terminal-dot red"></span>
                                    <span className="terminal-dot yellow"></span>
                                    <span className="terminal-dot green"></span>
                                    <span className="terminal-title">CI Build Failed</span>
                                </div>
                                <div className="terminal-body compact">
                                    <div className="terminal-line">
                                        <span className="terminal-error">✗ Coverage threshold not met: 85.2% &lt; 90%</span>
                                    </div>
                                    <div className="terminal-line">
                                        <span className="terminal-dim">Build failed. Please improve test coverage.</span>
                                    </div>
                                </div>
                            </div>
                            <p className="scenario-text">
                                <strong>Now what?</strong> You open the coverage report and see a wall of percentages. 
                                File after file—line coverage, branch coverage, function coverage. Some files at 45%, 
                                others at 98%. The "Uncovered Lines" column shows cryptic ranges like <code>23-27, 45, 89-102</code>.
                            </p>
                        </div>
                        
                        <div className="challenge-problems">
                            <h3>The Mental Math Problem</h3>
                            <p>You need to close a 5% coverage gap, but the standard coverage report doesn't tell you <em>where to focus</em>:</p>
                            <ul className="problem-list">
                                <li>Which files have the most uncovered lines?</li>
                                <li>Which gaps are in critical code vs. tiny utilities?</li>
                                <li>Should you prioritize that file with 50% line coverage or the one with 0% branch coverage?</li>
                            </ul>
                            <p className="problem-conclusion">
                                Traditional coverage tools show you <strong>what</strong> isn't covered. 
                                They don't tell you <strong>what matters most</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Cards */}
            <section className="problem-section">
                <div className="container">
                    <h2 className="section-title">Why Standard Reports Fall Short</h2>
                    <div className="problem-grid">
                        <div className="problem-card">
                            <div className="problem-icon">📊</div>
                            <h3>Numbers Without Context</h3>
                            <p>You see "78% coverage" but don't know which files matter most or where to invest your testing time.</p>
                        </div>
                        <div className="problem-card">
                            <div className="problem-icon">🎯</div>
                            <h3>Scattered Priorities</h3>
                            <p>Some files have 0% branch coverage but 100% line coverage. Which matters more? It depends.</p>
                        </div>
                        <div className="problem-card">
                            <div className="problem-icon">⏱️</div>
                            <h3>Wasted Effort</h3>
                            <p>Testing small utility files when critical business logic sits untested. Limited time, wrong focus.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Demo */}
            <section className="demo-section">
                <div className="container">
                    <h2 className="section-title">One Command. Clear Priorities.</h2>
                    <div className="terminal-demo large">
                        <div className="terminal-header">
                            <span className="terminal-dot red"></span>
                            <span className="terminal-dot yellow"></span>
                            <span className="terminal-dot green"></span>
                            <span className="terminal-title">brennpunkt --top 5</span>
                        </div>
                        <div className="terminal-body">
                            <div className="terminal-line">
                                <span className="terminal-highlight">📊 Coverage Priority Report</span>
                            </div>
                            <div className="terminal-line"></div>
                            <div className="terminal-line">
                                <span className="terminal-dim">┌─────────────────────────────────────────────────────────────────┐</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-dim">│                      OVERALL COVERAGE                           │</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-dim">├─────────────────┬─────────────────┬─────────────────────────────┤</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-dim">│  Lines: </span>
                                <span className="terminal-success">97.02%</span>
                                <span className="terminal-dim">  │  Functions: </span>
                                <span className="terminal-success">98.19%</span>
                                <span className="terminal-dim">  │  Branches: </span>
                                <span className="terminal-success">90.36%</span>
                                <span className="terminal-dim">       │</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-dim">└─────────────────┴─────────────────┴─────────────────────────────┘</span>
                            </div>
                            <div className="terminal-line"></div>
                            <div className="terminal-line">
                                <span className="terminal-dim">Priority  File                          Lines    Funcs    Branch   Score</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-dim">────────────────────────────────────────────────────────────────────────</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-prompt">#1</span>
                                <span className="terminal-text">        src/complex-module.ts          </span>
                                <span className="terminal-error">45.2%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-error">50.0%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-error">35.0%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-highlight">156.3</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-prompt">#2</span>
                                <span className="terminal-text">        src/another-module.ts          </span>
                                <span className="terminal-warning">62.5%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-warning">70.0%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-error">55.0%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-highlight">98.7</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-prompt">#3</span>
                                <span className="terminal-text">        src/routing/handler.ts         </span>
                                <span className="terminal-warning">78.3%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-success">85.0%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-warning">68.2%</span>
                                <span className="terminal-text">    </span>
                                <span className="terminal-highlight">67.2</span>
                            </div>
                            <div className="terminal-line"></div>
                            <div className="terminal-line">
                                <span className="terminal-highlight">🎯 Recommended Focus (Top 3):</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-text">  1. src/complex-module.ts</span>
                            </div>
                            <div className="terminal-line">
                                <span className="terminal-dim">     13 untested branches, 5 untested functions</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="algorithm-section">
                <div className="container">
                    <div className="algorithm-header">
                        <h2 className="section-title">Intelligent Priority Scoring</h2>
                        <p className="section-subtitle">
                            Not all coverage gaps are equal. Brennpunkt weighs what matters most.
                        </p>
                    </div>
                    
                    <div className="algorithm-demo">
                        <div className="formula-card">
                            <div className="formula-header">Priority Score Formula</div>
                            <div className="formula-content">
                                <code>
                                    score = (branchGap × 0.5 + functionGap × 0.3 + lineGap × 0.2) × log₁₀(lines)
                                </code>
                            </div>
                            <div className="formula-explanation">
                                <p><strong>Branch coverage</strong> gets 50% weight — untested branches hide bugs</p>
                                <p><strong>Function coverage</strong> gets 30% weight — dead code detection</p>
                                <p><strong>Line coverage</strong> gets 20% weight — basic execution paths</p>
                                <p><strong>File size</strong> logarithmically scales — bigger files need more attention</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="algorithm-features">
                        <div className="algorithm-feature">
                            <div className="feature-number">01</div>
                            <h3>Customizable Weights</h3>
                            <p>Adjust the balance with <code>--weights 0.6,0.2,0.2</code> to prioritize what matters to your project.</p>
                        </div>
                        <div className="algorithm-feature">
                            <div className="feature-number">02</div>
                            <h3>Size-Aware Scoring</h3>
                            <p>A 1000-line file at 50% coverage ranks higher than a 10-line file at 50%. More code = more risk.</p>
                        </div>
                        <div className="algorithm-feature">
                            <div className="feature-number">03</div>
                            <h3>Noise Filtering</h3>
                            <p>Filter out tiny files with <code>--min-lines 20</code>. Focus on files that actually matter.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Usage Section */}
            <section className="usage-section">
                <div className="container">
                    <h2 className="section-title">Simple to Use</h2>
                    <p className="section-subtitle">
                        Works with any project that generates lcov.info coverage reports.
                    </p>
                    
                    <div className="usage-grid">
                        <div className="usage-card">
                            <h4>Basic Usage</h4>
                            <div className="code-block">
                                <div className="code-line"><span className="code-comment"># Auto-discovers coverage file</span></div>
                                <div className="code-line">brennpunkt</div>
                                <div className="code-line"></div>
                                <div className="code-line"><span className="code-comment"># Or specify explicitly</span></div>
                                <div className="code-line">brennpunkt path/to/lcov.info</div>
                            </div>
                        </div>
                        <div className="usage-card">
                            <h4>Filtering & Limiting</h4>
                            <div className="code-block">
                                <div className="code-line"><span className="code-comment"># Show only top 10 priorities</span></div>
                                <div className="code-line">brennpunkt --top 10</div>
                                <div className="code-line"></div>
                                <div className="code-line"><span className="code-comment"># Exclude small files</span></div>
                                <div className="code-line">brennpunkt --min-lines 50</div>
                            </div>
                        </div>
                        <div className="usage-card">
                            <h4>Custom Weights</h4>
                            <div className="code-block">
                                <div className="code-line"><span className="code-comment"># Prioritize branch coverage</span></div>
                                <div className="code-line">brennpunkt --weights 0.7,0.2,0.1</div>
                                <div className="code-line"></div>
                                <div className="code-line"><span className="code-comment"># Equal weights</span></div>
                                <div className="code-line">brennpunkt --weights 0.33,0.33,0.34</div>
                            </div>
                        </div>
                        <div className="usage-card">
                            <h4>CI/CD Integration</h4>
                            <div className="code-block">
                                <div className="code-line"><span className="code-comment"># JSON output for automation</span></div>
                                <div className="code-line">brennpunkt --json {'>'} coverage-report.json</div>
                                <div className="code-line"></div>
                                <div className="code-line"><span className="code-comment"># Use in scripts</span></div>
                                <div className="code-line">brennpunkt --json | jq '.files[0].file'</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Auto-Discovery Section */}
            <section className="discovery-section">
                <div className="container">
                    <h2 className="section-title">Smart Coverage Discovery</h2>
                    <p className="section-subtitle">
                        No configuration needed. Brennpunkt automatically finds your coverage file.
                    </p>
                    
                    <div className="discovery-demo">
                        <div className="discovery-card">
                            <h4>Search Locations</h4>
                            <p className="discovery-desc">When run without arguments, brennpunkt searches these paths in order:</p>
                            <div className="discovery-table">
                                <div className="discovery-row header">
                                    <span className="discovery-order">#</span>
                                    <span className="discovery-path">Path</span>
                                    <span className="discovery-framework">Framework</span>
                                </div>
                                <div className="discovery-row">
                                    <span className="discovery-order">1</span>
                                    <span className="discovery-path"><code>coverage/lcov.info</code></span>
                                    <span className="discovery-framework">Jest, Vitest, c8</span>
                                </div>
                                <div className="discovery-row">
                                    <span className="discovery-order">2</span>
                                    <span className="discovery-path"><code>.coverage/lcov.info</code></span>
                                    <span className="discovery-framework">Custom configs</span>
                                </div>
                                <div className="discovery-row">
                                    <span className="discovery-order">3</span>
                                    <span className="discovery-path"><code>coverage/lcov/lcov.info</code></span>
                                    <span className="discovery-framework">Karma</span>
                                </div>
                                <div className="discovery-row">
                                    <span className="discovery-order">4</span>
                                    <span className="discovery-path"><code>lcov.info</code></span>
                                    <span className="discovery-framework">Project root</span>
                                </div>
                                <div className="discovery-row">
                                    <span className="discovery-order">5</span>
                                    <span className="discovery-path"><code>.nyc_output/lcov.info</code></span>
                                    <span className="discovery-framework">NYC legacy</span>
                                </div>
                                <div className="discovery-row">
                                    <span className="discovery-order">6</span>
                                    <span className="discovery-path"><code>test-results/lcov.info</code></span>
                                    <span className="discovery-framework">Some CI configs</span>
                                </div>
                            </div>
                            <p className="discovery-note">First file found wins. Explicit paths always override discovery.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Configuration Section */}
            <section className="config-section">
                <div className="container">
                    <h2 className="section-title">Project Configuration</h2>
                    <p className="section-subtitle">
                        Save your preferences in a brennpunkt.yaml file. Works like ESLint, Prettier, and other dev tools.
                    </p>
                    
                    <div className="config-demo">
                        <div className="config-grid">
                            <div className="config-card">
                                <div className="config-header">
                                    <span className="config-icon">⚙️</span>
                                    <span className="config-name">brennpunkt.yaml</span>
                                </div>
                                <pre className="config-content">{`# Brennpunkt Configuration

# Path to lcov.info coverage file
coveragePath: coverage/lcov.info

# Priority weights (branches, functions, lines)
# Higher branch weight = untested branches prioritized
weights: "0.5,0.3,0.2"

# Minimum lines for a file to be included
minLines: 10

# Output format (true for JSON)
json: false

# Limit results to top N files
top: 20`}</pre>
                            </div>
                            <div className="config-commands">
                                <h4>Configuration Commands</h4>
                                <div className="code-block">
                                    <div className="code-line"><span className="code-comment"># Generate brennpunkt.yaml</span></div>
                                    <div className="code-line">brennpunkt --init-config</div>
                                    <div className="code-line"></div>
                                    <div className="code-line"><span className="code-comment"># View resolved config</span></div>
                                    <div className="code-line">brennpunkt --check-config</div>
                                    <div className="code-line"></div>
                                    <div className="code-line"><span className="code-comment"># Use custom config file</span></div>
                                    <div className="code-line">brennpunkt -c .config/brennpunkt.yaml</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* JSON Output */}
            <section className="json-section">
                <div className="container">
                    <h2 className="section-title">Machine-Readable Output</h2>
                    <p className="section-subtitle">
                        Integrate into dashboards, CI pipelines, or custom tooling.
                    </p>
                    
                    <div className="json-demo">
                        <div className="json-card">
                            <div className="json-header">brennpunkt --json --top 1</div>
                            <pre className="json-content">{`{
  "overall": {
    "lines": { "found": 1572, "hit": 1234, "coverage": 78.5 },
    "functions": { "found": 190, "hit": 156, "coverage": 82.1 },
    "branches": { "found": 150, "hit": 98, "coverage": 65.3 },
    "fileCount": 25
  },
  "files": [
    {
      "file": "src/complex-module.ts",
      "lines": { "found": 218, "hit": 98, "coverage": 45.0 },
      "functions": { "found": 10, "hit": 5, "coverage": 50.0 },
      "branches": { "found": 20, "hit": 7, "coverage": 35.0 },
      "priorityScore": 156.32,
      "uncoveredLines": 120,
      "uncoveredBranches": 13
    }
  ]
}`}</pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="usecases-section">
                <div className="container">
                    <h2 className="section-title">Built For Your Workflow</h2>
                    
                    <div className="usecases-grid">
                        <div className="usecase-card">
                            <div className="usecase-icon">🚀</div>
                            <h4>Sprint Planning</h4>
                            <p>Identify which modules need test coverage before the next release. Prioritize tech debt systematically.</p>
                        </div>
                        <div className="usecase-card">
                            <div className="usecase-icon">🔄</div>
                            <h4>CI/CD Gates</h4>
                            <p>Track coverage priority in your pipeline. Alert when high-priority files have declining coverage.</p>
                        </div>
                        <div className="usecase-card">
                            <div className="usecase-icon">📈</div>
                            <h4>Coverage Campaigns</h4>
                            <p>Running a "test coverage month"? Know exactly where to focus for maximum impact.</p>
                        </div>
                        <div className="usecase-card">
                            <div className="usecase-icon">👥</div>
                            <h4>Code Review</h4>
                            <p>Reviewer reminder: "This file has the lowest coverage in the project. Consider adding tests."</p>
                        </div>
                        <div className="usecase-card featured">
                            <div className="usecase-icon">🤖</div>
                            <h4>Agentic Coding Tools</h4>
                            <p>AI assistants shouldn't wade through percentage tables. Give them a ranked list of actionable targets.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agentic Tools Section */}
            <section className="agentic-section">
                <div className="container">
                    <h2 className="section-title">Designed for AI-Assisted Development</h2>
                    <p className="section-subtitle">
                        When an AI coding assistant needs to improve test coverage, it needs clear, actionable targets—not percentage tables.
                    </p>
                    
                    <div className="agentic-demo">
                        <div className="agentic-content">
                            <div className="agentic-problem">
                                <h4>The Traditional Way</h4>
                                <p>
                                    "Improve test coverage" → AI reads coverage report → parses percentages → 
                                    calculates which files matter → hopes it got the math right.
                                </p>
                            </div>
                            <div className="agentic-solution">
                                <h4>With Brennpunkt</h4>
                                <p>
                                    <code>brennpunkt --json --top 5</code> → AI receives a ranked list of exactly 
                                    which files to test, with priority scores and specific guidance.
                                </p>
                            </div>
                        </div>
                        <div className="agentic-output">
                            <div className="code-block">
                                <div className="code-line"><span className="code-comment"># In your AI assistant prompt:</span></div>
                                <div className="code-line">"Run brennpunkt --json --top 3 and write tests</div>
                                <div className="code-line"> for the highest priority files."</div>
                                <div className="code-line"></div>
                                <div className="code-line"><span className="code-comment"># AI gets structured, actionable data:</span></div>
                                <div className="code-line">{'{'} "files": [{'{'}</div>
                                <div className="code-line">    "file": "src/auth/login.ts",</div>
                                <div className="code-line">    "priorityScore": 156.3,</div>
                                <div className="code-line">    "uncoveredBranches": 13,</div>
                                <div className="code-line">    "uncoveredLines": 45</div>
                                <div className="code-line">{'}'}] {'}'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MCP Server Section */}
            <section className="mcp-section">
                <div className="container">
                    <h2 className="section-title">MCP Server for AI Tools</h2>
                    <p className="section-subtitle">
                        Go beyond JSON output. Brennpunkt runs as an MCP server, allowing AI tools like Cursor and Claude to query coverage data directly.
                    </p>
                    
                    <div className="mcp-key-features">
                        <div className="mcp-feature-highlight">
                            <span className="feature-icon">📖</span>
                            <strong>Reads existing data</strong> — Does NOT run tests
                        </div>
                        <div className="mcp-feature-highlight">
                            <span className="feature-icon">🔧</span>
                            <strong>Universal</strong> — Works with Jest, Vitest, Mocha, c8, NYC, Karma, AVA, Playwright...
                        </div>
                        <div className="mcp-feature-highlight">
                            <span className="feature-icon">⚙️</span>
                            <strong>Config-aware</strong> — Automatically loads each project's brennpunkt.yaml
                        </div>
                        <div className="mcp-feature-highlight">
                            <span className="feature-icon">⚡</span>
                            <strong>Fast</strong> — Sub-100ms responses with intelligent caching
                        </div>
                    </div>
                    
                    <div className="mcp-comparison">
                        <div className="mcp-before">
                            <h4>Without MCP</h4>
                            <div className="mcp-flow">
                                <div className="mcp-step slow">AI runs <code>npm test</code></div>
                                <div className="mcp-arrow">→</div>
                                <div className="mcp-step slow">30s-5min wait</div>
                                <div className="mcp-arrow">→</div>
                                <div className="mcp-step slow">Parse text output</div>
                                <div className="mcp-arrow">→</div>
                                <div className="mcp-step slow">Guess priorities</div>
                            </div>
                        </div>
                        <div className="mcp-after">
                            <h4>With MCP Server</h4>
                            <div className="mcp-flow">
                                <div className="mcp-step fast">AI calls tool</div>
                                <div className="mcp-arrow">→</div>
                                <div className="mcp-step fast">&lt;100ms</div>
                                <div className="mcp-arrow">→</div>
                                <div className="mcp-step fast">Structured JSON</div>
                                <div className="mcp-arrow">→</div>
                                <div className="mcp-step fast">Clear priorities</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mcp-tools">
                        <h3>Available MCP Tools</h3>
                        <p className="mcp-tools-intro">
                            Each tool reads EXISTING coverage data (lcov.info) — it does NOT run tests.
                            Works with any test framework that produces lcov format.
                        </p>
                        <div className="mcp-tools-grid">
                            <div className="mcp-tool-card">
                                <code>brennpunkt_get_priorities</code>
                                <p>Analyze coverage and get files ranked by priority. Returns actionable suggestions, not just percentages. Use BEFORE writing tests to know where to focus.</p>
                            </div>
                            <div className="mcp-tool-card">
                                <code>brennpunkt_coverage_summary</code>
                                <p>Quick overview: overall percentages, status indicators, top priority file, and quick wins. Great for "how's coverage looking?" questions.</p>
                            </div>
                            <div className="mcp-tool-card">
                                <code>brennpunkt_get_file_coverage</code>
                                <p>Detailed coverage for a specific file: lines/functions/branches with counts and suggestions. Use when drilling into a particular file.</p>
                            </div>
                            <div className="mcp-tool-card">
                                <code>brennpunkt_estimate_impact</code>
                                <p>"If I test these files, will I hit 90%?" Estimate improvement if specific files are fully tested. Perfect for planning.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mcp-config">
                        <h3>Quick Setup (One-Time, All Projects)</h3>
                        <div className="copyable-code-block">
                            <button 
                                className="copy-button"
                                onClick={(e) => {
                                    const code = `{
  "mcpServers": {
    "brennpunkt": {
      "command": "npx",
      "args": ["-y", "-p", "@redaksjon/brennpunkt", "brennpunkt-mcp"]
    }
  }
}`;
                                    navigator.clipboard.writeText(code);
                                    e.target.textContent = 'Copied!';
                                    setTimeout(() => e.target.textContent = 'Copy', 2000);
                                }}
                            >Copy</button>
                            <pre className="code-content">{`// Add to your MCP config (Cursor, Claude Desktop, etc.)
{
  "mcpServers": {
    "brennpunkt": {
      "command": "npx",
      "args": ["-y", "-p", "@redaksjon/brennpunkt", "brennpunkt-mcp"]
    }
  }
}`}</pre>
                        </div>
                        <p className="mcp-config-note">
                            No per-project config needed! The AI passes the current workspace path as <code>projectPath</code>.
                            Each project's <code>brennpunkt.yaml</code> is automatically loaded if present.
                        </p>
                    </div>
                    
                    <div className="mcp-workflows">
                        <h3>Example Workflows</h3>
                        <div className="mcp-conversation">
                            <div className="mcp-message human">
                                <span className="mcp-role">You:</span>
                                What files should I focus on to improve test coverage?
                            </div>
                            <div className="mcp-message ai">
                                <span className="mcp-role">AI:</span>
                                <em>[calls brennpunkt_get_priorities with projectPath]</em>
                            </div>
                            <div className="mcp-message ai">
                                <span className="mcp-role">AI:</span>
                                The highest priority file is <strong>src/auth/login.ts</strong> (score: 156.3).<br/>
                                It has 35% branch coverage with 13 untested branches.<br/>
                                <strong>Suggested focus:</strong> Test error handling paths in validateCredentials().<br/><br/>
                                Would you like me to write tests for this file?
                            </div>
                        </div>
                        
                        <div className="mcp-conversation">
                            <div className="mcp-message human">
                                <span className="mcp-role">You:</span>
                                If I fully test login.ts and handler.ts, will I hit 90%?
                            </div>
                            <div className="mcp-message ai">
                                <span className="mcp-role">AI:</span>
                                <em>[calls brennpunkt_estimate_impact with those files]</em>
                            </div>
                            <div className="mcp-message ai">
                                <span className="mcp-role">AI:</span>
                                Current: 85.2% → Estimated: 91.8% (+6.6%)<br/>
                                Yes! Testing those two files should get you above 90%.
                            </div>
                        </div>
                        
                        <div className="mcp-conversation">
                            <div className="mcp-message human">
                                <span className="mcp-role">You:</span>
                                Compare coverage between my auth-service and user-service projects.
                            </div>
                            <div className="mcp-message ai">
                                <span className="mcp-role">AI:</span>
                                <em>[calls brennpunkt_coverage_summary for each project]</em>
                            </div>
                            <div className="mcp-message ai">
                                <span className="mcp-role">AI:</span>
                                <strong>auth-service:</strong> 92.1% lines, 85.3% branches ✓<br/>
                                <strong>user-service:</strong> 78.4% lines, 62.1% branches ⚠️<br/><br/>
                                user-service needs attention, especially branch coverage.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cursor Rule Section */}
            <section className="cursor-rule-section">
                <div className="container">
                    <h2 className="section-title">Quick Start: Cursor Rule</h2>
                    <p className="section-subtitle">
                        Don't want to configure MCP? Add this rule to your project for instant AI-powered coverage prioritization.
                    </p>
                    
                    <div className="cursor-rule-content">
                        <div className="cursor-rule-card">
                            <div className="cursor-rule-header">
                                <span className="cursor-rule-icon">📋</span>
                                <span className="cursor-rule-filename">.cursorrules</span>
                                <button 
                                    className="copy-button"
                                    onClick={(e) => {
                                        const code = `# Coverage Priority Analysis

When working on test coverage improvements:

1. Run \`npx @redaksjon/brennpunkt --json --top 5\` to get prioritized files
2. Focus on the highest priority file first (highest priorityScore)
3. Pay special attention to:
   - Files with low branch coverage (untested conditionals hide bugs)
   - Files with high uncoveredLines count
4. After writing tests, re-run brennpunkt to see updated priorities

When I ask about test coverage, run brennpunkt and interpret the results.
Suggest specific test cases based on the uncovered branches and functions.`;
                                        navigator.clipboard.writeText(code);
                                        e.target.textContent = 'Copied!';
                                        setTimeout(() => e.target.textContent = 'Copy', 2000);
                                    }}
                                >Copy</button>
                            </div>
                            <pre className="cursor-rule-code">{`# Coverage Priority Analysis

When working on test coverage improvements:

1. Run \`npx @redaksjon/brennpunkt --json --top 5\` to get prioritized files
2. Focus on the highest priority file first (highest priorityScore)
3. Pay special attention to:
   - Files with low branch coverage (untested conditionals hide bugs)
   - Files with high uncoveredLines count
4. After writing tests, re-run brennpunkt to see updated priorities

When I ask about test coverage, run brennpunkt and interpret the results.
Suggest specific test cases based on the uncovered branches and functions.`}</pre>
                        </div>
                        
                        <div className="cursor-rule-usage">
                            <h4>Then just ask Cursor:</h4>
                            <div className="cursor-prompts">
                                <div className="cursor-prompt">"What files need test coverage?"</div>
                                <div className="cursor-prompt">"Help me improve test coverage"</div>
                                <div className="cursor-prompt">"Where should I focus my testing efforts?"</div>
                            </div>
                            <p className="cursor-rule-note">
                                The AI will automatically run brennpunkt and provide actionable recommendations—no MCP setup required.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section className="integration-section">
                <div className="container">
                    <h2 className="section-title">Integrate Into Your Workflow</h2>
                    <p className="section-subtitle">
                        Run brennpunkt automatically after tests to surface coverage priorities.
                    </p>
                    
                    <div className="integration-grid">
                        <div className="integration-card">
                            <div className="integration-header">
                                <span className="integration-icon">📦</span>
                                <h4>npm Post-Test Hook</h4>
                            </div>
                            <p className="integration-desc">Add to package.json for automatic analysis after every test run:</p>
                            <pre className="code-pre">{`{
  "scripts": {
    "test": "vitest run --coverage",
    "posttest": "brennpunkt --top 10"
  }
}`}</pre>
                        </div>
                        
                        <div className="integration-card">
                            <div className="integration-header">
                                <span className="integration-icon">🔄</span>
                                <h4>GitHub Actions</h4>
                            </div>
                            <p className="integration-desc">Add coverage priority analysis to your CI pipeline:</p>
                            <pre className="code-pre">{`# After test step
- name: Coverage Priority
  run: npx @redaksjon/brennpunkt --top 10

# Save JSON artifact
- run: brennpunkt --json > priority.json`}</pre>
                        </div>
                        
                        <div className="integration-card wide">
                            <div className="integration-header">
                                <span className="integration-icon">🚨</span>
                                <h4>Fail on High-Priority Gaps</h4>
                            </div>
                            <p className="integration-desc">Block builds when critical files have unacceptable coverage:</p>
                            <pre className="code-pre">{`#!/bin/bash
TOP_SCORE=$(brennpunkt --json --top 1 | jq '.files[0].priorityScore')

if (( $(echo "$TOP_SCORE > 100" | bc -l) )); then
  echo "❌ High-priority coverage gap (score: $TOP_SCORE)"
  exit 1
fi`}</pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Start */}
            <section className="quickstart-section">
                <div className="container">
                    <h2 className="section-title">Get Started in 30 Seconds</h2>
                    
                    <div className="quickstart-steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h4>Install</h4>
                                <code>npm install -g @redaksjon/brennpunkt</code>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h4>Generate Coverage</h4>
                                <code>npm test -- --coverage</code>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h4>Analyze</h4>
                                <code>brennpunkt --top 10</code>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CLI Reference */}
            <section className="reference-section">
                <div className="container">
                    <h2 className="section-title">Command Reference</h2>
                    
                    <div className="reference-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Option</th>
                                    <th>Description</th>
                                    <th>Default</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><code>[coverage-path]</code></td>
                                    <td>Path to lcov.info file</td>
                                    <td>coverage/lcov.info</td>
                                </tr>
                                <tr>
                                    <td><code>-w, --weights</code></td>
                                    <td>Weights for branches, functions, lines</td>
                                    <td>0.5,0.3,0.2</td>
                                </tr>
                                <tr>
                                    <td><code>-m, --min-lines</code></td>
                                    <td>Exclude files with fewer lines</td>
                                    <td>10</td>
                                </tr>
                                <tr>
                                    <td><code>-t, --top</code></td>
                                    <td>Show only top N priority files</td>
                                    <td>all</td>
                                </tr>
                                <tr>
                                    <td><code>-j, --json</code></td>
                                    <td>Output as JSON</td>
                                    <td>false</td>
                                </tr>
                                <tr>
                                    <td><code>-c, --config</code></td>
                                    <td>Path to configuration file</td>
                                    <td>brennpunkt.yaml</td>
                                </tr>
                                <tr>
                                    <td><code>--init-config</code></td>
                                    <td>Generate initial configuration file</td>
                                    <td>—</td>
                                </tr>
                                <tr>
                                    <td><code>--check-config</code></td>
                                    <td>Display resolved configuration</td>
                                    <td>—</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <h2>Stop Guessing. Start Prioritizing.</h2>
                    <p>Know exactly where to invest your testing efforts for maximum impact.</p>
                    <div className="cta-buttons">
                        <a href="https://www.npmjs.com/package/@redaksjon/brennpunkt" className="btn btn-primary btn-large" target="_blank" rel="noopener noreferrer">
                            Install from NPM
                        </a>
                        <a href="https://github.com/redaksjon/brennpunkt" className="btn btn-secondary btn-large" target="_blank" rel="noopener noreferrer">
                            View on GitHub
                        </a>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="container">
                    <p>Apache 2.0 License | Built by <a href="https://github.com/redaksjon">Redaksjon</a></p>
                </div>
            </footer>
        </div>
    )
}

export default App
