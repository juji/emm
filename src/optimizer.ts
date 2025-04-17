/**
 * ETL Memory Monitor - Optimization Suggester Module
 *
 * Analyzes memory usage patterns and suggests optimization strategies
 */

import { promises as fs, existsSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger.js';
import { extractMemoryData, findLatestLogFile } from './utils/fileHelpers.js';
import chalk from 'chalk';
import archy from 'archy';
import { MemoryPoint } from './analyzer.js';

/**
 * Optimization suggester configuration
 */
export interface OptimizerConfig {
  /** Directory containing log files */
  logDir?: string;
  /** Path to summary JSON file */
  summaryFile?: string | null;
  /** Specific log file to analyze (overrides logDir) */
  logFile?: string | null;
  /** Whether to show detailed explanations */
  detailed?: boolean;
}

/**
 * Memory issue severity level
 */
type Severity = 'high' | 'medium' | 'low';

/**
 * Memory jump data structure
 */
interface MemoryJump {
  timestamp: number;
  from: number;
  to: number;
  increase: number;
  percent: number;
}

/**
 * Memory issue detection result
 */
interface MemoryIssue {
  type: string;
  severity: Severity;
  evidence: string;
  suggestion: string;
  details?: MemoryJump[];
}

/**
 * Memory pattern detection result
 */
interface MemoryPatternResult {
  patterns: string[];
  detectedIssues: MemoryIssue[];
}

/**
 * Code example for optimization
 */
interface CodeExample {
  problem: string;
  solution: string;
}

/**
 * Optimization examples dictionary
 */
interface OptimizationExamples {
  [key: string]: CodeExample;
}

/**
 * Optimization strategy
 */
interface OptimizationStrategy {
  title: string;
  description: string;
  benefit: string;
}

/**
 * Optimization category
 */
interface OptimizationCategory {
  category: string;
  strategies: OptimizationStrategy[];
}

/**
 * Analysis results
 */
interface OptimizationAnalysis {
  memoryPoints: MemoryPoint[];
  patterns: string[];
  detectedIssues: MemoryIssue[];
  examples: OptimizationExamples;
}

/**
 * Default configuration for optimization suggester
 */
const DEFAULT_CONFIG: OptimizerConfig = {
  logDir: './logs',
  summaryFile: null, // Will default to logDir/etl_summary.json
  logFile: null, // If specified, analyzes this specific log file
  detailed: false,
};

/**
 * Detect memory patterns and issues
 */
function detectMemoryIssues(memoryPoints: MemoryPoint[]): MemoryPatternResult {
  if (memoryPoints.length < 3) {
    return {
      patterns: [],
      detectedIssues: [],
    };
  }

  const patterns: string[] = [];
  const issues: MemoryIssue[] = [];

  // Check for starting memory baseline
  const startMemory = memoryPoints[0].memory;
  const endMemory = memoryPoints[memoryPoints.length - 1].memory;
  const maxMemory = Math.max(...memoryPoints.map((p) => p.memory));
  const duration = memoryPoints[memoryPoints.length - 1].timestamp;

  // Check for continuous growth (potential memory leak)
  let growingCount = 0;
  for (let i = 1; i < memoryPoints.length; i++) {
    if (memoryPoints[i].memory > memoryPoints[i - 1].memory) {
      growingCount++;
    }
  }

  const growthRatio = growingCount / (memoryPoints.length - 1);
  const memoryIncrease = endMemory - startMemory;
  const growthRate = memoryIncrease / duration; // MB per second

  if (growthRatio > 0.8 && growthRate > 0.5) {
    patterns.push('continuous_growth');
    issues.push({
      type: 'memory_leak',
      severity: 'high',
      evidence: `Memory grows continuously (${(growthRatio * 100).toFixed(2)}% of samples show growth) at a rate of ${growthRate.toFixed(2)} MB/s`,
      suggestion: 'Check for objects not being garbage collected or unbounded collections',
    });
  } else if (growthRatio > 0.7) {
    patterns.push('steady_growth');
    issues.push({
      type: 'potential_leak',
      severity: 'medium',
      evidence: `Memory shows steady growth (${(growthRatio * 100).toFixed(2)}% of samples show growth)`,
      suggestion: 'Monitor for memory leaks and consider weak references for caches',
    });
  }

  // Check for sudden jumps in memory
  const jumps: MemoryJump[] = [];
  for (let i = 1; i < memoryPoints.length; i++) {
    const currentMem = memoryPoints[i].memory;
    const prevMem = memoryPoints[i - 1].memory;
    const increase = currentMem - prevMem;
    const percentIncrease = (increase / prevMem) * 100;

    if (percentIncrease > 20 && increase > 10) {
      // Only count significant jumps
      jumps.push({
        timestamp: memoryPoints[i].timestamp,
        from: prevMem,
        to: currentMem,
        increase: increase,
        percent: percentIncrease,
      });
    }
  }

  if (jumps.length > 0) {
    patterns.push('memory_spikes');
    issues.push({
      type: 'large_allocations',
      severity: jumps.length > 3 ? 'high' : 'medium',
      evidence: `Detected ${jumps.length} significant memory spikes (>20% increase)`,
      suggestion: 'Implement incremental processing or consider batch processing of large datasets',
      details: jumps,
    });
  }

  // Check for high volatility
  const changes: number[] = [];
  for (let i = 1; i < memoryPoints.length; i++) {
    changes.push(Math.abs(memoryPoints[i].memory - memoryPoints[i - 1].memory));
  }

  const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
  const volatility = (avgChange / startMemory) * 100; // Normalized volatility as percentage

  if (volatility > 15) {
    patterns.push('high_volatility');
    issues.push({
      type: 'memory_churn',
      severity: 'medium',
      evidence: `High memory volatility (${volatility.toFixed(1)}% average change)`,
      suggestion: 'Check for object churn. Consider object pooling or reuse strategies.',
    });
  }

  // Check for plateau pattern (inefficient memory usage)
  const middleIndex = Math.floor(memoryPoints.length / 2);
  const firstHalfAvg =
    memoryPoints.slice(0, middleIndex).reduce((sum, p) => sum + p.memory, 0) / middleIndex;
  const secondHalfAvg =
    memoryPoints.slice(middleIndex).reduce((sum, p) => sum + p.memory, 0) /
    (memoryPoints.length - middleIndex);

  if (Math.abs(secondHalfAvg - firstHalfAvg) < firstHalfAvg * 0.1 && maxMemory > 100) {
    patterns.push('plateau');
    issues.push({
      type: 'inefficient_memory',
      severity: 'low',
      evidence: `Memory usage plateaus at ~${secondHalfAvg.toFixed(1)}MB for extended periods`,
      suggestion:
        'Consider streaming processing or releasing memory more aggressively when possible',
    });
  }

  return {
    patterns,
    detectedIssues: issues,
  };
}

/**
 * Generate code snippets with optimization examples
 */
function generateOptimizationExamples(patterns: string[]): OptimizationExamples {
  const examples: OptimizationExamples = {};

  if (patterns.includes('continuous_growth') || patterns.includes('steady_growth')) {
    examples.memoryLeak = {
      problem: `
// Problem: Memory leak through closure retention
function processData() {
  const cache = {};
  
  return function process(records) {
    // This keeps growing without bounds
    records.forEach(record => {
      cache[record.id] = record;
    });
    
    // Work with data
    return doSomethingWith(records);
  };
}

const processor = processData();
// Each call adds more items to the cache that never get released
batch.forEach(b => processor(b));`,

      solution: `
// Solution: Use a bounded cache with LRU policy
const LRU = require('lru-cache');

function processData() {
  // Bounded cache with max size and TTL
  const cache = new LRU({
    max: 1000,      // Maximum items
    maxAge: 1000 * 60 * 5  // 5 minutes
  });
  
  return function process(records) {
    records.forEach(record => {
      cache.set(record.id, record);
    });
    
    return doSomethingWith(records);
  };
}

const processor = processData();
batch.forEach(b => processor(b));`,
    };
  }

  if (patterns.includes('memory_spikes')) {
    examples.batchProcessing = {
      problem: `
// Problem: Loading entire dataset at once
async function processAllData() {
  // Loading everything at once causes memory spikes
  const allRecords = await db.fetchAllRecords();
  
  // Process everything
  const results = allRecords.map(record => {
    // Do complex transformations
    return transform(record);
  });
  
  return results;
}`,

      solution: `
// Solution: Stream or batch process the data
async function processBatchedData() {
  const batchSize = 1000;
  let offset = 0;
  const results = [];
  
  // Process in smaller chunks
  while (true) {
    const batch = await db.fetchRecords(offset, batchSize);
    if (batch.length === 0) break;
    
    // Process this batch
    const batchResults = batch.map(record => transform(record));
    results.push(...batchResults);
    
    offset += batchSize;
    
    // Optional: Force garbage collection between batches
    if (global.gc) global.gc();
  }
  
  return results;
}`,
    };
  }

  if (patterns.includes('high_volatility')) {
    examples.objectReuse = {
      problem: `
// Problem: Creating many objects rapidly
function processMessages(messages) {
  return messages.map(msg => {
    // Creating a new object for every message
    return {
      id: msg.id,
      processed: true,
      timestamp: new Date(),
      data: transform(msg.data),
      metadata: { /* large object */ }
    };
  });
}`,

      solution: `
// Solution: Object pooling or reuse
const objectPool = [];

function getFromPool() {
  return objectPool.pop() || { data: {}, metadata: {} };
}

function processMessagesPooled(messages) {
  const results = messages.map(msg => {
    // Reuse an object from the pool
    const obj = getFromPool();
    
    // Reset and populate the object
    obj.id = msg.id;
    obj.processed = true;
    obj.timestamp = new Date();
    obj.data = transform(msg.data);
    
    // Instead of creating new objects, reset existing ones
    Object.keys(obj.metadata).forEach(key => delete obj.metadata[key]);
    
    return obj;
  });
  
  // Return objects to pool when done with them
  setTimeout(() => {
    results.forEach(obj => objectPool.push(obj));
  }, 0);
  
  return results;
}`,
    };
  }

  if (patterns.includes('plateau')) {
    examples.streaming = {
      problem: `
// Problem: Keeping all intermediate results in memory
async function processFile(filepath) {
  // Read entire file into memory
  const content = await fs.readFile(filepath, 'utf8');
  const lines = content.split('\\n');
  
  // Process all lines, keeping all results in memory
  const results = lines.map(line => processLine(line));
  
  // Write all results at once
  await fs.writeFile('output.txt', results.join('\\n'));
  
  return results.length;
}`,

      solution: `
// Solution: Use streaming to avoid keeping everything in memory
const { createReadStream, createWriteStream } = require('fs');
const { createInterface } = require('readline');

async function processFileStream(filepath) {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(filepath);
    const writeStream = createWriteStream('output.txt');
    const lineReader = createInterface({ input: readStream });
    
    let count = 0;
    
    // Process one line at a time, write immediately
    lineReader.on('line', (line) => {
      const result = processLine(line);
      writeStream.write(result + '\\n');
      count++;
    });
    
    lineReader.on('close', () => {
      writeStream.end();
      resolve(count);
    });
    
    lineReader.on('error', reject);
  });
}`,
    };
  }

  return examples;
}

/**
 * Generate general optimization strategies
 */
function generateGeneralStrategies(): OptimizationCategory[] {
  return [
    {
      category: 'Memory Management',
      strategies: [
        {
          title: 'Use streaming APIs',
          description: 'Process data as it flows rather than loading everything into memory',
          benefit: 'Keeps memory usage constant regardless of input size',
        },
        {
          title: 'Implement pagination',
          description: 'Load and process data in fixed-size chunks',
          benefit: 'Controls memory growth and prevents large spikes',
        },
        {
          title: 'Dispose of temporary objects',
          description: 'Explicitly null references to large objects when no longer needed',
          benefit: 'Helps garbage collector reclaim memory faster',
        },
      ],
    },
    {
      category: 'Data Structures',
      strategies: [
        {
          title: 'Use specialized data structures',
          description: 'Choose appropriate data structures for your use case (Maps, Sets, etc.)',
          benefit: 'More efficient memory utilization and performance',
        },
        {
          title: 'Implement LRU caches',
          description: 'Use Least Recently Used (LRU) caching strategy with size limits',
          benefit: 'Prevents unbounded growth of cached items',
        },
        {
          title: 'Consider weak references',
          description: 'Use WeakMap or WeakSet for caches to allow garbage collection',
          benefit: 'Prevents memory leaks from long-lived references',
        },
      ],
    },
    {
      category: 'Processing Patterns',
      strategies: [
        {
          title: 'Implement pipeline processing',
          description: 'Process data in stages, only passing necessary information forward',
          benefit: 'Reduces peak memory usage by releasing intermediate results',
        },
        {
          title: 'Use worker threads',
          description: 'Distribute processing across multiple workers',
          benefit: 'Limits memory usage per thread and improves parallelism',
        },
        {
          title: 'Implement backpressure',
          description: "Slow down data producers when consumers can't keep up",
          benefit: 'Prevents memory buildup from fast producers and slow consumers',
        },
      ],
    },
  ];
}

/**
 * Generate terminal report with optimization suggestions
 */
function generateTerminalReport(
  analysis: OptimizationAnalysis,
  config: Required<OptimizerConfig>,
): void {
  const { memoryPoints, detectedIssues, patterns, examples } = analysis;

  logger.header('ETL MEMORY OPTIMIZATION SUGGESTIONS');
  console.log('');

  // Display detected issues
  logger.section('DETECTED MEMORY ISSUES');

  if (detectedIssues.length === 0) {
    console.log(chalk.green('✓ No significant memory issues detected!'));
  } else {
    const issuesTree = {
      label: `${detectedIssues.length} issues detected`,
      nodes: detectedIssues.map((issue) => {
        // Color based on severity
        const colorFn =
          issue.severity === 'high'
            ? chalk.red
            : issue.severity === 'medium'
              ? chalk.yellow
              : chalk.blue;

        return {
          label: colorFn(`[${issue.severity.toUpperCase()}] ${issue.type.replace(/_/g, ' ')}`),
          nodes: [
            { label: chalk.dim('Evidence: ') + issue.evidence },
            { label: chalk.dim('Suggestion: ') + issue.suggestion },
          ],
        };
      }),
    };

    console.log(archy(issuesTree));
  }

  // Display optimization examples for detected patterns
  if (patterns.length > 0 && Object.keys(examples).length > 0) {
    logger.section('OPTIMIZATION CODE EXAMPLES');

    for (const [key, example] of Object.entries(examples)) {
      console.log(
        chalk.cyan.bold(
          `\n# ${key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}`,
        ),
      );
      console.log(chalk.yellow.bold('Problem:'));
      console.log(example.problem);
      console.log(chalk.green.bold('\nSolution:'));
      console.log(example.solution);
      console.log('\n' + chalk.dim('―'.repeat(80)));
    }
  }

  // If detailed report is requested, show general optimization strategies
  if (config.detailed) {
    logger.section('GENERAL OPTIMIZATION STRATEGIES');

    const strategies = generateGeneralStrategies();

    for (const category of strategies) {
      console.log(chalk.cyan.bold(`\n${category.category}:`));

      for (const strategy of category.strategies) {
        console.log(chalk.yellow.bold(`• ${strategy.title}`));
        console.log(`  ${strategy.description}`);
        console.log(`  ${chalk.green('Benefit:')} ${strategy.benefit}`);
        console.log('');
      }
    }
  }

  // Show next steps
  logger.section('NEXT STEPS');

  console.log(
    `1. ${chalk.cyan('Run with profiling enabled:')} NODE_OPTIONS="--inspect" node your-script.js`,
  );
  console.log(
    `2. ${chalk.cyan('Monitor memory with Chrome DevTools:')} Open chrome://inspect in Chrome browser`,
  );
  console.log(
    `3. ${chalk.cyan('Implement suggested optimizations')} for the specific issues detected`,
  );
  console.log(
    `4. ${chalk.cyan('Run comparison test')} to measure the improvement after optimization`,
  );
  console.log('');
}

/**
 * Analyze memory usage and suggest optimizations
 */
export async function optimizationSuggester(
  config: OptimizerConfig = {},
): Promise<OptimizationAnalysis | null> {
  // Merge user config with defaults
  const fullConfig = { ...DEFAULT_CONFIG, ...config } as Required<OptimizerConfig>;

  if (!fullConfig.summaryFile) {
    fullConfig.summaryFile = join(fullConfig.logDir!, 'etl_summary.json');
  }

  // Show configuration
  logger.title('ETL Memory Optimization Suggester');
  logger.pathInfo('Log directory', fullConfig.logDir!);
  logger.pathInfo('Summary file', fullConfig.summaryFile);

  if (fullConfig.logFile) {
    logger.pathInfo('Analyzing specific log file', fullConfig.logFile);
  }

  // Create spinner for analysis phase
  const spinner = logger.spinner('Analyzing memory usage patterns...');
  spinner.start();

  try {
    // Determine which log file to analyze
    const logFile = fullConfig.logFile || (await findLatestLogFile(fullConfig.logDir!));

    if (!logFile || !existsSync(logFile)) {
      spinner.fail('No suitable log file found for analysis.');
      return null;
    }

    spinner.text = `Analyzing memory patterns from ${logFile}...`;

    // Extract memory data from log file
    const memoryPoints = await extractMemoryData(logFile);

    if (memoryPoints.length === 0) {
      spinner.fail('No memory data found in log file.');
      return null;
    }

    // Detect memory issues
    const { patterns, detectedIssues } = detectMemoryIssues(memoryPoints);

    // Generate optimization examples
    const examples = generateOptimizationExamples(patterns);

    // Create analysis result object
    const analysis: OptimizationAnalysis = {
      memoryPoints,
      patterns,
      detectedIssues,
      examples,
    };

    spinner.succeed('Memory optimization analysis complete!');

    // Generate terminal report
    generateTerminalReport(analysis, fullConfig);

    return analysis;
  } catch (error) {
    spinner.fail(`Error during optimization analysis: ${(error as Error).message}`);
    logger.error(error as Error);
    return null;
  }
}
