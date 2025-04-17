# emm

**emm** (ETL Memory Monitor)  
Advanced memory monitoring and analytics tools for ETL processes.

## Features

- Real-time memory usage monitoring for ETL jobs
- Memory data analysis and reporting
- Automated optimization suggestions
- Unified logging utility
- CLI and programmatic API

## Installation

```bash
npm install emm
# or, for local development
npm run build
```

## Usage

### Programmatic API

```js
import emm from 'emm';

// Monitor memory usage
const stats = await emm.monitor();
console.log('Memory stats:', stats);

// Analyze memory data
const analysis = emm.analyze(stats);
console.log('Analysis:', analysis);

// Get optimization suggestions
const suggestions = emm.optimize(analysis);
console.log('Suggestions:', suggestions);

// Log a custom message
emm.log.info('ETL memory monitoring complete.');
```

Or use named imports:

```js
import { memoryMonitor, memoryAnalyzer, optimizationSuggester, logger } from 'emm';

const stats = await memoryMonitor();
const analysis = memoryAnalyzer(stats);
const suggestions = optimizationSuggester(analysis);
logger.info('Done!');
```

### CLI Usage

After building, you can use the CLI tools:

```bash
etl-run         # Run memory monitoring
etl-analyze     # Analyze memory data
etl-optimize    # Get optimization suggestions
```

## Scripts

- `npm run build` – Compile TypeScript to JavaScript
- `npm run dev` – Watch mode for development
- `npm test` – Run tests (see package.json for details)

## License

MIT

---

*Advanced memory monitoring for robust ETL workflows.*


