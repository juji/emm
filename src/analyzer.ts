/**
 * ETL Memory Monitor - Memory Analysis Module
 *
 * Analyzes memory usage data and generates visualizations
 */

import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger.js';
import { extractMemoryData, findLatestLogFile } from './utils/fileHelpers.js';
import archy from 'archy';
import chalk from 'chalk';

/**
 * Memory analyzer configuration
 */
export interface AnalyzerConfig {
  /** Directory containing log files */
  logDir?: string;
  /** Path to summary JSON file */
  summaryFile?: string | null;
  /** Specific log file to analyze (overrides logDir) */
  logFile?: string | null;
  /** Number of recent runs to analyze */
  lastRuns?: number;
  /** Output format: 'terminal' or 'html' */
  output?: 'terminal' | 'html';
  /** Path to save HTML output */
  htmlOutput?: string | null;
}

/**
 * Memory statistics
 */
interface MemoryStats {
  min: number;
  max: number;
  avg: number;
  start: number;
  end: number;
  duration: number;
  growthRate: number;
}

/**
 * Memory point data structure
 */
export interface MemoryPoint {
  timestamp: number;
  memory: number;
}

/**
 * Memory spike data structure
 */
interface MemorySpike {
  timestamp: number;
  fromMemory: number;
  toMemory: number;
  increasePercent: number;
}

/**
 * Memory patterns detected in analysis
 */
interface MemoryPatterns {
  suddenJumps: MemorySpike[];
  steadyGrowth: boolean;
  memoryLeakLikelihood: 'low' | 'medium' | 'high';
  volatility: 'low' | 'medium' | 'high';
  spikesCount: number;
}

/**
 * Summary data for a single ETL run
 */
interface RunSummary {
  timestamp: string;
  duration: number;
  exit_code: number;
  avg_memory_mb: number;
  max_memory_mb: number;
  status: string;
}

/**
 * Summary file structure
 */
interface SummaryData {
  runs: RunSummary[];
}

/**
 * Analysis results
 */
interface AnalysisResult {
  memoryPoints: MemoryPoint[];
  stats: MemoryStats;
  patterns: MemoryPatterns;
  recommendations: string[];
  summaryData: SummaryData | null;
}

/**
 * Default configuration for memory analyzer
 */
const DEFAULT_CONFIG: AnalyzerConfig = {
  logDir: './logs',
  summaryFile: null, // Will default to logDir/etl_summary.json
  logFile: null, // If specified, analyzes this specific log file
  lastRuns: 10, // Number of recent runs to analyze
  output: 'terminal', // 'terminal' or 'html'
  htmlOutput: null, // Will default to logDir/memory_analysis.html
};

/**
 * Calculate statistics from memory data points
 */
function calculateMemoryStats(memoryPoints: MemoryPoint[]): MemoryStats {
  if (memoryPoints.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      start: 0,
      end: 0,
      duration: 0,
      growthRate: 0,
    };
  }

  const sum = memoryPoints.reduce((total, point) => total + point.memory, 0);
  const min = Math.min(...memoryPoints.map((point) => point.memory));
  const max = Math.max(...memoryPoints.map((point) => point.memory));
  const start = memoryPoints[0].memory;
  const end = memoryPoints[memoryPoints.length - 1].memory;
  const duration = memoryPoints[memoryPoints.length - 1].timestamp;

  // Calculate memory growth rate (MB per second)
  const growthRate = duration > 0 ? (end - start) / duration : 0;

  return {
    min,
    max,
    avg: sum / memoryPoints.length,
    start,
    end,
    duration,
    growthRate,
  };
}

/**
 * Detect memory patterns in the data
 */
function detectMemoryPatterns(memoryPoints: MemoryPoint[]): MemoryPatterns {
  const patterns: MemoryPatterns = {
    suddenJumps: [],
    steadyGrowth: false,
    memoryLeakLikelihood: 'low',
    volatility: 'low',
    spikesCount: 0,
  };

  if (memoryPoints.length < 3) {
    return patterns;
  }

  // Detect sudden jumps (increase of more than 20% between consecutive points)
  for (let i = 1; i < memoryPoints.length; i++) {
    const prev = memoryPoints[i - 1];
    const curr = memoryPoints[i];
    const increase = curr.memory - prev.memory;
    const increasePercent = (increase / prev.memory) * 100;

    if (increasePercent > 20) {
      patterns.suddenJumps.push({
        timestamp: curr.timestamp,
        fromMemory: prev.memory,
        toMemory: curr.memory,
        increasePercent,
      });
    }
  }

  // Count significant spikes
  patterns.spikesCount = patterns.suddenJumps.length;

  // Calculate memory growth trend
  let increasingCount = 0;
  for (let i = 1; i < memoryPoints.length; i++) {
    if (memoryPoints[i].memory > memoryPoints[i - 1].memory) {
      increasingCount++;
    }
  }

  const increasingRatio = increasingCount / (memoryPoints.length - 1);
  patterns.steadyGrowth = increasingRatio > 0.7;

  // Calculate volatility (standard deviation of changes)
  const changes: number[] = [];
  for (let i = 1; i < memoryPoints.length; i++) {
    changes.push(Math.abs(memoryPoints[i].memory - memoryPoints[i - 1].memory));
  }

  const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
  const squaredDiffs = changes.map((change) => Math.pow(change - avgChange, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / changes.length;
  const stdDeviation = Math.sqrt(variance);

  // Classify volatility
  if (stdDeviation > 10) patterns.volatility = 'high';
  else if (stdDeviation > 5) patterns.volatility = 'medium';

  // Classify memory leak likelihood
  const stats = calculateMemoryStats(memoryPoints);
  if (patterns.steadyGrowth && stats.growthRate > 0.5) {
    patterns.memoryLeakLikelihood = 'high';
  } else if (patterns.steadyGrowth || stats.growthRate > 0.2) {
    patterns.memoryLeakLikelihood = 'medium';
  }

  return patterns;
}

/**
 * Generate ASCII memory chart
 */
function generateAsciiMemoryChart(memoryPoints: MemoryPoint[], width = 60, height = 20): string {
  if (memoryPoints.length === 0) {
    return 'No memory data available';
  }

  // Find min and max values
  const minMem = Math.min(...memoryPoints.map((p) => p.memory));
  const maxMem = Math.max(...memoryPoints.map((p) => p.memory));
  const range = maxMem - minMem;

  // Handle case where all values are the same
  if (range === 0) {
    return `Constant memory usage: ${minMem} MB`;
  }

  const maxTime = memoryPoints[memoryPoints.length - 1].timestamp;

  // Create empty chart grid
  const grid: string[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(' '));

  // Plot memory points
  memoryPoints.forEach((point) => {
    const x = Math.floor((point.timestamp / maxTime) * (width - 1));
    const normalizedValue = (point.memory - minMem) / range;
    const y = height - 1 - Math.floor(normalizedValue * (height - 1));

    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[y][x] = '●';
    }
  });

  // Add axis labels
  for (let i = 0; i < height; i += Math.ceil(height / 5)) {
    const memValue = Math.round(maxMem - (i / height) * range);
    const label = `${memValue}`.padStart(4);
    for (let j = 0; j < label.length; j++) {
      if (i < height) {
        grid[i][j] = label[j];
      }
    }
  }

  // Convert grid to string
  let chartStr = '';
  grid.forEach((row) => {
    chartStr += row.join('') + '\n';
  });

  // Add x-axis labels
  chartStr += '0'.padEnd(Math.floor(width / 4), ' ');
  chartStr += Math.floor(maxTime / 3)
    .toString()
    .padEnd(Math.floor(width / 4), ' ');
  chartStr += Math.floor((maxTime * 2) / 3)
    .toString()
    .padEnd(Math.floor(width / 4), ' ');
  chartStr += maxTime.toString();
  chartStr += '\n' + 'Time (seconds)'.padStart(Math.floor(width / 2) + 6);

  return chartStr;
}

/**
 * Generate recommendations based on memory analysis
 */
function generateRecommendations(
  stats: MemoryStats,
  patterns: MemoryPatterns,
  memoryLimit: number,
): string[] {
  const recommendations: string[] = [];

  // Check memory limit
  const headroom = ((memoryLimit - stats.max) / memoryLimit) * 100;
  if (headroom < 10) {
    recommendations.push(
      `⚠️  Memory usage is very close to the limit (${stats.max}MB/${memoryLimit}MB). Consider increasing the memory limit or optimizing memory usage.`,
    );
  } else if (headroom > 50) {
    recommendations.push(
      `💡 Memory usage is well below the limit (${stats.max}MB/${memoryLimit}MB). Consider reducing the memory limit to save resources.`,
    );
  }

  // Check memory growth
  if (patterns.steadyGrowth) {
    recommendations.push(
      `⚠️  Memory usage shows steady growth (${stats.growthRate.toFixed(2)}MB/s). Check for potential memory leaks or unbounded collections.`,
    );
  }

  // Check for sudden spikes
  if (patterns.spikesCount > 0) {
    recommendations.push(
      `⚠️  Detected ${patterns.spikesCount} significant memory spikes. Consider implementing incremental processing for large data sets.`,
    );
  }

  // Memory leak likelihood
  if (patterns.memoryLeakLikelihood === 'high') {
    recommendations.push(
      `🚨 High likelihood of a memory leak detected. Implement memory profiling to identify the source.`,
    );
  } else if (patterns.memoryLeakLikelihood === 'medium') {
    recommendations.push(`⚠️  Possible memory leak detected. Monitor closely in future runs.`);
  }

  // Volatility recommendations
  if (patterns.volatility === 'high') {
    recommendations.push(
      `⚠️  Memory usage is highly volatile. Consider batch processing or streaming approaches.`,
    );
  }

  // General recommendations
  recommendations.push(
    `💡 Consider using stream processing instead of loading entire datasets into memory.`,
  );
  if (stats.max > 100) {
    // Only suggest batching for substantial memory usage
    recommendations.push(
      `💡 Break large operations into smaller batches to reduce peak memory usage.`,
    );
  }

  return recommendations;
}

/**
 * Generate a terminal report for memory analysis
 */
function generateTerminalReport(analysis: AnalysisResult): void {
  const { memoryPoints, stats, patterns, recommendations } = analysis;

  logger.header('ETL MEMORY ANALYSIS REPORT');
  console.log(''); // Add some spacing

  // Display summary metrics
  logger.section('SUMMARY METRICS');
  logger.metric('Duration', logger.formatDuration(stats.duration));
  logger.metric('Starting Memory', `${stats.start.toFixed(1)} MB`);
  logger.metric('Ending Memory', `${stats.end.toFixed(1)} MB`);
  logger.metric('Peak Memory', `${stats.max.toFixed(1)} MB`);
  logger.metric('Average Memory', `${stats.avg.toFixed(1)} MB`);
  logger.metric('Memory Growth Rate', `${stats.growthRate.toFixed(3)} MB/s`);

  // Display memory chart
  logger.section('MEMORY USAGE CHART');
  console.log(chalk.cyan(generateAsciiMemoryChart(memoryPoints)));

  // Display pattern analysis
  logger.section('MEMORY PATTERN ANALYSIS');

  // Display tree structure of patterns
  const patternsTree = {
    label: 'Memory Patterns',
    nodes: [
      {
        label: `Growth Pattern: ${patterns.steadyGrowth ? chalk.yellow('Steady increase') : chalk.green('Stable')}`,
      },
      {
        label: `Memory Leak Likelihood: ${
          patterns.memoryLeakLikelihood === 'high'
            ? chalk.red('High')
            : patterns.memoryLeakLikelihood === 'medium'
              ? chalk.yellow('Medium')
              : chalk.green('Low')
        }`,
      },
      {
        label: `Memory Volatility: ${
          patterns.volatility === 'high'
            ? chalk.red('High')
            : patterns.volatility === 'medium'
              ? chalk.yellow('Medium')
              : chalk.green('Low')
        }`,
      },
      {
        label: `Memory Spikes: ${patterns.spikesCount === 0 ? chalk.green('None detected') : chalk.yellow(`${patterns.spikesCount} detected`)}`,
      },
    ],
  };

  console.log(archy(patternsTree));

  // Display memory spikes if any
  if (patterns.suddenJumps.length > 0) {
    console.log(chalk.yellow('\nSignificant Memory Spikes:'));
    patterns.suddenJumps.forEach((jump, i) => {
      if (i < 5) {
        // Show only the top 5 to avoid cluttering
        console.log(
          chalk.yellow(
            `  • At ${jump.timestamp}s: ${jump.fromMemory}MB → ${jump.toMemory}MB (+${jump.increasePercent.toFixed(1)}%)`,
          ),
        );
      }
    });
    if (patterns.suddenJumps.length > 5) {
      console.log(chalk.yellow(`  • ... and ${patterns.suddenJumps.length - 5} more`));
    }
  }

  // Display recommendations
  logger.section('RECOMMENDATIONS');
  if (recommendations.length === 0) {
    console.log(chalk.green('✓ Memory usage looks good! No specific recommendations.'));
  } else {
    recommendations.forEach((rec) => {
      console.log(rec);
    });
  }
}

/**
 * Generate HTML report for memory analysis
 */
async function generateHtmlReport(analysis: AnalysisResult, outputPath: string): Promise<void> {
  const { memoryPoints, stats, patterns, recommendations, summaryData } = analysis;
  const runs = summaryData?.runs || [];

  // Convert memory points to JSON for chart.js
  const chartData = memoryPoints.map((p) => ({ x: p.timestamp, y: p.memory }));

  // Generate HTML with embedded chart.js
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>ETL Memory Analysis</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0; 
      color: #333;
      background: #f5f7fa;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(to right, #3498db, #2c3e50);
      color: white;
      padding: 20px;
      border-radius: 10px 10px 0 0;
      margin-bottom: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-weight: 300;
      font-size: 32px;
    }
    .header p {
      margin: 5px 0 0 0;
      opacity: 0.8;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      padding: 20px;
      margin-bottom: 20px;
    }
    .card h2 {
      margin-top: 0;
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      font-weight: 500;
    }
    .metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    .metric-card {
      flex: 1;
      min-width: 180px;
      background: #f8f9fa;
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .metric-card h3 {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #6c757d;
      font-weight: 500;
    }
    .metric-card .value {
      font-size: 24px;
      font-weight: 600;
      color: #343a40;
    }
    .chart-container {
      height: 400px;
    }
    .status-good { color: #28a745; }
    .status-warning { color: #ffc107; }
    .status-danger { color: #dc3545; }
    .recommendations {
      list-style-type: none;
      padding-left: 0;
    }
    .recommendations li {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .recommendations li:last-child {
      border-bottom: none;
    }
    .recommendations i {
      margin-right: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 500;
    }
    tr:hover {
      background-color: #f1f3f5;
    }
    .badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-success {
      background: #d1e7dd;
      color: #0f5132;
    }
    .badge-warning {
      background: #fff3cd;
      color: #664d03;
    }
    .badge-danger {
      background: #f8d7da;
      color: #842029;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ETL Memory Analysis</h1>
      <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="card">
      <h2>Memory Usage Summary</h2>
      <div class="metrics">
        <div class="metric-card">
          <h3>Duration</h3>
          <div class="value">${stats.duration.toFixed(1)}s</div>
        </div>
        <div class="metric-card">
          <h3>Starting Memory</h3>
          <div class="value">${stats.start.toFixed(1)} MB</div>
        </div>
        <div class="metric-card">
          <h3>Peak Memory</h3>
          <div class="value">${stats.max.toFixed(1)} MB</div>
        </div>
        <div class="metric-card">
          <h3>Average Memory</h3>
          <div class="value">${stats.avg.toFixed(1)} MB</div>
        </div>
        <div class="metric-card">
          <h3>Growth Rate</h3>
          <div class="value ${stats.growthRate > 0.5 ? 'status-warning' : 'status-good'}">
            ${stats.growthRate.toFixed(3)} MB/s
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Memory Usage Chart</h2>
      <div class="chart-container">
        <canvas id="memoryChart"></canvas>
      </div>
    </div>

    <div class="card">
      <h2>Memory Pattern Analysis</h2>
      <div class="metrics">
        <div class="metric-card">
          <h3>Growth Pattern</h3>
          <div class="value ${patterns.steadyGrowth ? 'status-warning' : 'status-good'}">
            ${patterns.steadyGrowth ? 'Steady Increase' : 'Stable'}
          </div>
        </div>
        <div class="metric-card">
          <h3>Memory Leak Likelihood</h3>
          <div class="value ${
            patterns.memoryLeakLikelihood === 'high'
              ? 'status-danger'
              : patterns.memoryLeakLikelihood === 'medium'
                ? 'status-warning'
                : 'status-good'
          }">
            ${patterns.memoryLeakLikelihood.charAt(0).toUpperCase() + patterns.memoryLeakLikelihood.slice(1)}
          </div>
        </div>
        <div class="metric-card">
          <h3>Memory Volatility</h3>
          <div class="value ${
            patterns.volatility === 'high'
              ? 'status-danger'
              : patterns.volatility === 'medium'
                ? 'status-warning'
                : 'status-good'
          }">
            ${patterns.volatility.charAt(0).toUpperCase() + patterns.volatility.slice(1)}
          </div>
        </div>
        <div class="metric-card">
          <h3>Memory Spikes</h3>
          <div class="value ${patterns.spikesCount > 0 ? 'status-warning' : 'status-good'}">
            ${patterns.spikesCount} ${patterns.spikesCount === 1 ? 'spike' : 'spikes'}
          </div>
        </div>
      </div>

      ${
        patterns.suddenJumps.length > 0
          ? `
        <h3>Significant Memory Spikes</h3>
        <table>
          <thead>
            <tr>
              <th>Time (s)</th>
              <th>From</th>
              <th>To</th>
              <th>Increase</th>
            </tr>
          </thead>
          <tbody>
            ${patterns.suddenJumps
              .slice(0, 10)
              .map(
                (jump) => `
              <tr>
                <td>${jump.timestamp}</td>
                <td>${jump.fromMemory} MB</td>
                <td>${jump.toMemory} MB</td>
                <td class="status-warning">+${jump.increasePercent.toFixed(1)}%</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }
    </div>

    <div class="card">
      <h2>Recommendations</h2>
      <ul class="recommendations">
        ${
          recommendations.length === 0
            ? '<li><i class="status-good">✓</i> Memory usage looks good! No specific recommendations.</li>'
            : recommendations.map((rec) => `<li>${rec}</li>`).join('')
        }
      </ul>
    </div>

    ${
      runs.length > 0
        ? `
    <div class="card">
      <h2>Historical Runs</h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Duration</th>
            <th>Avg Memory</th>
            <th>Max Memory</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${runs
            .slice(-10)
            .map(
              (run) => `
            <tr>
              <td>${new Date(run.timestamp.replace(/_/g, ':')).toLocaleString()}</td>
              <td>${run.duration.toFixed(1)}s</td>
              <td>${run.avg_memory_mb.toFixed(1)} MB</td>
              <td>${run.max_memory_mb.toFixed(1)} MB</td>
              <td>
                <span class="badge ${
                  run.status === 'SUCCESS'
                    ? 'badge-success'
                    : run.status === 'KILLED'
                      ? 'badge-danger'
                      : 'badge-warning'
                }">
                  ${run.status}
                </span>
              </td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }
  </div>

  <script>
    // Initialize memory chart
    const ctx = document.getElementById('memoryChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Memory Usage (MB)',
          data: ${JSON.stringify(chartData)},
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Time (seconds)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Memory (MB)'
            },
            beginAtZero: true
          }
        }
      }
    });
  </script>
</body>
</html>`;

  // Write HTML to file
  await fs.writeFile(outputPath, html);
  logger.success(`HTML report generated at: ${logger.theme.path(outputPath)}`);
}

/**
 * Analyze memory usage data from a log file or summary file
 */
export async function memoryAnalyzer(config: AnalyzerConfig = {}): Promise<AnalysisResult | null> {
  // Merge user config with defaults
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  if (!fullConfig.summaryFile) {
    fullConfig.summaryFile = join(fullConfig.logDir!, 'etl_summary.json');
  }

  if (fullConfig.output === 'html' && !fullConfig.htmlOutput) {
    fullConfig.htmlOutput = join(fullConfig.logDir!, 'memory_analysis.html');
  }

  // Show configuration
  logger.title('ETL Memory Analyzer');
  logger.pathInfo('Log directory', fullConfig.logDir!);
  logger.pathInfo('Summary file', fullConfig.summaryFile);

  if (fullConfig.logFile) {
    logger.pathInfo('Analyzing specific log file', fullConfig.logFile);
  }

  // Create spinner for analysis phase
  const spinner = logger.spinner('Analyzing memory usage data...');
  spinner.start();

  try {
    // Determine which log file to analyze
    const logFile = fullConfig.logFile || (await findLatestLogFile(fullConfig.logDir!));

    if (!logFile || !existsSync(logFile)) {
      spinner.fail('No suitable log file found for analysis.');
      return null;
    }

    spinner.text = `Analyzing memory data from ${logFile}...`;

    // Extract memory data from log file
    const memoryPoints = await extractMemoryData(logFile);

    if (memoryPoints.length === 0) {
      spinner.fail('No memory data found in log file.');
      return null;
    }

    // Load summary data if available
    let summaryData: SummaryData | null = null;
    if (existsSync(fullConfig.summaryFile)) {
      try {
        const fileContent = await fs.readFile(fullConfig.summaryFile, 'utf8');
        summaryData = JSON.parse(fileContent) as SummaryData;
      } catch (err) {
        // Ignore errors reading summary file
      }
    }

    // Calculate statistics
    const stats = calculateMemoryStats(memoryPoints);

    // Detect memory patterns
    const patterns = detectMemoryPatterns(memoryPoints);

    // Generate recommendations
    const recommendations = generateRecommendations(stats, patterns, 500); // Assuming 500MB limit

    // Create analysis result object
    const analysis: AnalysisResult = {
      memoryPoints,
      stats,
      patterns,
      recommendations,
      summaryData,
    };

    // Generate output
    spinner.succeed('Memory analysis complete!');

    if (fullConfig.output === 'terminal') {
      generateTerminalReport(analysis);
    } else if (fullConfig.output === 'html') {
      await generateHtmlReport(analysis, fullConfig.htmlOutput!);
    }

    return analysis;
  } catch (error) {
    spinner.fail(`Error during memory analysis: ${(error as Error).message}`);
    logger.error(error as Error);
    return null;
  }
}
