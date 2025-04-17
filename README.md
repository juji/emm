# ETL Memory Monitor 🪁

      /\
     /  \
    /    \

/ \
 / \=======
/ \ ||
/****\_\_\_\_****\ ||
|| ||
|| /\
 || / \
 || / \

A lightweight toolkit for monitoring, analyzing, and optimizing memory usage in ETL (Extract, Transform, Load) jobs. This package provides tools to track memory usage with minimal resource overhead, generate visual insights, and suggest optimizations based on observed memory patterns.

## Features

- **Real-time Memory Monitoring**: Track memory usage of any ETL process with visual feedback
- **Lightweight Mode**: Ultra-low CPU usage monitoring ideal for resource-constrained environments
- **Memory Analysis**: Comprehensive analysis of memory usage patterns and potential issues
- **Optimization Suggestions**: Get actionable recommendations to improve memory efficiency
- **Visual Reports**: Generate terminal and HTML reports with memory charts and insights
- **Historical Tracking**: Maintain a summary of previous ETL runs for comparison

## Installation

```bash
# Using npm
npm install

# Using Yarn
yarn

# Using Bun
bun install
```

## Quick Usage with Command-line Entrypoints

For simpler usage, you can use the provided command-line entrypoints:

```bash
# Using the main entrypoint for all commands
./bin/emm run "node your-etl-script.js"
./bin/emm analyze
./bin/emm optimize

# Using the analyze shortcut
./bin/emma
```

For global access, you can add the bin directory to your PATH or create symlinks:

```bash
# Add symlinks to a directory in your PATH
ln -s "$(pwd)/bin/emm" /usr/local/bin/emm
ln -s "$(pwd)/bin/emma" /usr/local/bin/emma

# Now you can use them from anywhere
emm run "node your-etl-script.js"
emma  # shortcut for emm analyze
```

### Available Commands

- `emm run` (or `emm r`) - Run an ETL job with memory monitoring
- `emm analyze` (or `emm a`) - Analyze memory usage data
- `emm optimize` (or `emm o`) - Get optimization suggestions
- `emm help` - Show help information
- `emma` - Shortcut for `emm analyze`

## Detailed Usage

This package is now fully implemented in TypeScript, providing better type safety, developer experience, and maintainability.

### Monitoring ETL Jobs

Monitor memory usage of any command or script:

```bash
# Using npx to run the TypeScript version directly
npx ts-node src/bin/run.ts "node your-etl-script.js"

# Or after building, run the compiled JavaScript version
node dist/bin/run.js "node your-etl-script.js"

# Or using the entrypoint
emm run "node your-etl-script.js"

# Using lightweight mode (minimal CPU usage)
emm run --light "node your-etl-script.js"
```

#### Options

- `-m, --memory-limit <limit>`: Memory limit in MB (default: 500)
- `-l, --log-dir <path>`: Directory for storing logs (default: ./logs)
- `-s, --summary-file <path>`: Path to the summary JSON file
- `-k, --no-kill`: Do not kill process when memory limit is exceeded
- `--silent`: Minimal console output
- `--light`: Use lightweight monitoring mode (minimal CPU usage)
- `--check-interval <seconds>`: Interval between memory checks (default: 2, 0 for lightweight mode)

### Lightweight Monitoring Mode

The lightweight monitoring mode is designed for environments where CPU usage needs to be minimized:

```bash
# Enable lightweight mode with the --light flag
emm run --light "node your-etl-script.js"

# Or set a custom check interval manually
emm run --check-interval 10 "node your-etl-script.js"
```

#### How Lightweight Mode Works

Instead of continuously polling memory usage (which can consume CPU resources), lightweight mode:

1. Checks memory at strategic points only:

   - At process start
   - 5 seconds after start (early phase)
   - 60 seconds after start (if still running)
   - At process completion

2. Benefits:
   - Reduces CPU overhead by ~90% compared to regular monitoring
   - Still catches memory issues at critical phases
   - Perfect for resource-constrained environments
   - No additional cost (free alternative to paid APM solutions)

### Analyzing Memory Usage

Analyze memory usage patterns from logs:

```bash
# Using TypeScript version
npx ts-node src/bin/analyze.ts

# Or after building
node dist/bin/analyze.js

# Or using the entrypoints
emm analyze
emma  # shortcut for analyze
```

#### Options

- `-l, --log-dir <path>`: Directory containing log files (default: ./logs)
- `-f, --log-file <path>`: Specific log file to analyze
- `-s, --summary-file <path>`: Path to the summary JSON file
- `-r, --last-runs <number>`: Number of recent runs to analyze (default: 10)
- `-o, --output <format>`: Output format: "terminal" or "html" (default: terminal)
- `-h, --html-output <path>`: Path to save HTML output

### Getting Optimization Suggestions

Get suggestions to optimize memory usage:

```bash
# Using TypeScript version
npx ts-node src/bin/optimize.ts

# Or after building
node dist/bin/optimize.js

# Or using the entrypoint
emm optimize
```

#### Options

- `-l, --log-dir <path>`: Directory containing log files (default: ./logs)
- `-f, --log-file <path>`: Specific log file to analyze
- `-s, --summary-file <path>`: Path to the summary JSON file
- `-d, --detailed`: Show detailed optimization strategies

### Programmatic Usage

You can also use the API programmatically in your TypeScript/JavaScript code:

```typescript
import { memoryMonitor, memoryAnalyzer, optimizationSuggester } from './src/index.js';

// Monitor a process (with lightweight mode)
const result = await memoryMonitor('node your-script.js', {
  memoryLimit: 1000,
  logDir: './custom-logs',
  killOnLimit: true,
  checkInterval: 0, // Use 0 for lightweight mode
});

// Analyze memory patterns
const analysis = await memoryAnalyzer({
  logDir: './logs',
  output: 'html',
  htmlOutput: './memory-report.html',
});

// Get optimization suggestions
const suggestions = await optimizationSuggester({
  logDir: './logs',
  detailed: true,
});
```

## Building from Source

To build the TypeScript code into JavaScript:

```bash
npm run build
```

This will generate compiled JavaScript files in the `dist` directory.

## System Requirements

- Node.js 16 or higher
- For memory monitoring: Unix-like OS (uses `ps` command)
- TypeScript 5.0 or higher (for development)

## Project Structure

```
etl-memory-monitor/
├── bin/                  # Command-line entrypoints
│   ├── emm              # Main entrypoint for all commands
│   └── emma             # Quick shortcut for analyze command
├── src/                  # TypeScript source files
│   ├── analyzer.ts       # Memory analysis module
│   ├── monitor.ts        # Memory monitoring module
│   ├── optimizer.ts      # Optimization suggestion module
│   ├── index.ts          # Main API exports
│   ├── bin/              # CLI implementation
│   │   ├── run.ts        # Runner CLI
│   │   ├── analyze.ts    # Analyzer CLI
│   │   └── optimize.ts   # Optimizer CLI
│   ├── types/            # TypeScript type declarations
│   └── utils/            # Utility modules
│       ├── fileHelpers.ts # File operation utilities
│       └── logger.ts     # Logging utilities
├── dist/                 # Compiled JavaScript files
├── logs/                 # Default directory for logs
└── node_modules/         # Dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

This project was created with the help of GitHub Copilot and Claude AI.

- Created by GitHub Copilot with Claude 3.7 Sonnet (April 17, 2025)
- Updated to TypeScript by GitHub Copilot (April 17, 2025)
- Kite-themed monitoring mode added by GitHub Copilot (April 17, 2025)
