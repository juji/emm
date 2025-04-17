/**
 * ETL Memory Monitor - Memory Monitoring Module
 *
 * Tracks memory usage of processes and provides real-time visualization
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { logger } from './utils/logger.js';
import { updateSummaryFile, RunSummaryData } from './utils/fileHelpers.js';

/**
 * Memory monitoring configuration
 */
export interface MonitorConfig {
  /** Path to the ETL script to run */
  script?: string | null;
  /** Memory limit in MB */
  memoryLimit?: number;
  /** Directory for storing logs */
  logDir?: string;
  /** Path to summary JSON file */
  summaryFile?: string | null;
  /** If true, minimal console output is produced */
  silent?: boolean;
  /** If true, process will be killed when exceeding memory limit */
  killOnLimit?: boolean;
  /** Interval between memory checks in seconds (0 = lightweight mode) */
  checkInterval?: number;
}

/**
 * Results of memory monitoring
 */
export interface MonitorResult {
  exitCode: number;
  duration: number;
  avgMemoryMB: number;
  maxMemoryMB: number;
  status: string;
  command: string | string[];
  logFile: string;
  summaryFile: string;
}

/**
 * Memory statistics tracked during monitoring
 */
interface MemoryStats {
  maxMemoryMB: number;
  totalMemoryMB: number;
  sampleCount: number;
  startTime: number;
  endTime: number | null;
  exitCode: number | null;
  status: string | null;
}

/**
 * Default configuration for memory monitoring
 */
const DEFAULT_CONFIG: MonitorConfig = {
  script: null,
  memoryLimit: 500,
  logDir: './logs',
  summaryFile: null, // Will default to logDir/etl_summary.json
  silent: false,
  killOnLimit: true,
  checkInterval: 2, // Default: check every 2 seconds
};

/**
 * Monitor a process and track its memory usage
 *
 * @param command - Command to run or array with command and args
 * @param config - Configuration options
 * @returns - Results of the monitoring
 */
export async function memoryMonitor(
  command: string | string[],
  config: MonitorConfig = {},
): Promise<MonitorResult> {
  // Merge user config with defaults
  const fullConfig: Required<MonitorConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    summaryFile: config.summaryFile ?? DEFAULT_CONFIG.summaryFile,
  } as Required<MonitorConfig>;

  if (!fullConfig.summaryFile) {
    fullConfig.summaryFile = join(fullConfig.logDir, 'etl_summary.json');
  }

  // Parse command into command and args if it's a string
  let cmd: string, args: string[];
  if (typeof command === 'string') {
    const parts = command.split(' ');
    cmd = parts[0];
    args = parts.slice(1);
  } else if (Array.isArray(command)) {
    cmd = command[0];
    args = command.slice(1);
  } else {
    throw new Error('Command must be a string or an array');
  }

  // Ensure log directory exists
  if (!existsSync(fullConfig.logDir)) {
    mkdirSync(fullConfig.logDir, { recursive: true });
  }

  // Create timestamp for log file
  const startTime = new Date().toISOString();
  const timestamp = startTime.replace(/[:.]/g, '_');
  const logFilePath = join(fullConfig.logDir, `etl_memory_${timestamp}.log`);

  // Setup logging
  if (!fullConfig.silent) {
    logger.title('ETL Memory Monitor');
    logger.pathInfo('Script', fullConfig.script || 'Custom command');
    logger.pathInfo('Log file', logFilePath);
    logger.pathInfo('Summary file', fullConfig.summaryFile);
    logger.info(`Memory limit: ${logger.theme.value(fullConfig.memoryLimit + 'MB')}`);

    // Add monitoring mode info
    if (fullConfig.checkInterval === 0) {
      logger.info(`Mode: ${logger.theme.value('Lightweight')} (minimal CPU usage)`);
    } else {
      logger.info(`Check interval: ${logger.theme.value(fullConfig.checkInterval + ' seconds')}`);
    }
  }

  // Track memory stats
  const stats: MemoryStats = {
    maxMemoryMB: 0,
    totalMemoryMB: 0,
    sampleCount: 0,
    startTime: Date.now(),
    endTime: null,
    exitCode: null,
    status: null,
  };

  // Create spinner
  const spinner = !fullConfig.silent ? logger.spinner('Starting ETL process...') : null;
  spinner?.start();

  // Spawn the process
  const childProcess = spawn(cmd, args);
  const pid = childProcess.pid as number;

  // Update spinner text
  if (spinner) {
    spinner.text = `Monitoring process ${pid}...`;
  }

  // Function to get memory usage (RSS in KB)
  const getMemoryKB = (pid: number): Promise<number> => {
    return new Promise((resolve) => {
      const ps = spawn('ps', ['-o', 'rss=', '-p', String(pid)]);
      let output = '';

      ps.stdout.on('data', (data) => {
        output += data.toString();
      });

      ps.on('close', () => {
        const kb = parseInt(output.trim());
        resolve(isNaN(kb) ? 0 : kb);
      });

      ps.on('error', () => {
        resolve(0);
      });
    });
  };

  // Set up logging
  const writeLog = (message: string): void => {
    writeFileSync(logFilePath, message + '\n', { flag: 'a' });
    // Don't output to console by default to avoid cluttering
    // but we still log to the file
  };

  // Initial log entry
  writeLog(`Starting ETL job at ${startTime}`);
  writeLog(`Memory limit set to ${fullConfig.memoryLimit}MB`);

  // Lightweight mode tracking
  let isStartPhaseComplete = false;
  let isMiddlePhaseComplete = false;
  let processStartTime = Date.now();

  // Check memory immediately at start
  const checkMemoryOnce = async () => {
    try {
      const memKB = await getMemoryKB(pid);
      if (memKB > 0) {
        const memMB = Math.round(memKB / 1024);
        const elapsed = Math.round((Date.now() - stats.startTime) / 1000);

        // Update statistics
        stats.sampleCount++;
        stats.totalMemoryMB += memMB;
        stats.maxMemoryMB = Math.max(stats.maxMemoryMB, memMB);

        // Update spinner text with memory usage
        if (!fullConfig.silent && spinner) {
          spinner.text = `Running for ${logger.formatDuration(elapsed)} - Memory: ${memMB}MB`;
        }

        // Log memory usage with timestamp
        writeLog(`[${elapsed}s] Memory: ${memMB}MB`);

        // Check if memory exceeds limit and terminate if configured to do so
        if (fullConfig.killOnLimit && memMB > fullConfig.memoryLimit) {
          const message = `Memory usage exceeded ${fullConfig.memoryLimit}MB (actual: ${memMB}MB). Killing process (${pid}).`;
          writeLog(message);

          if (!fullConfig.silent && spinner) {
            spinner.fail(message);
          }

          // Kill the process
          childProcess.kill('SIGKILL');

          // Update stats for summary
          stats.endTime = Date.now();
          stats.exitCode = 137; // SIGKILL
          stats.status = 'KILLED';
        }
      }
    } catch (error) {
      if (!fullConfig.silent) {
        logger.error(`Error monitoring memory: ${(error as Error).message}`);
      }
    }
  };

  // Memory monitoring interval or one-time checks based on mode
  let interval: NodeJS.Timeout | null = null;

  if (fullConfig.checkInterval === 0) {
    // Lightweight mode: check at start, middle, and end only
    writeLog(`Using lightweight monitoring mode (minimal CPU usage)`);

    // Check at start
    await checkMemoryOnce();

    // Set up observer for middle and pre-end phases
    const observer = setInterval(async () => {
      const runTime = Date.now() - processStartTime;

      // Check after 5 seconds if we haven't done the start phase check
      if (!isStartPhaseComplete && runTime > 5000) {
        await checkMemoryOnce();
        isStartPhaseComplete = true;
      }

      // If we're still running after a minute and haven't done the middle check
      if (!isMiddlePhaseComplete && runTime > 60000) {
        await checkMemoryOnce();
        isMiddlePhaseComplete = true;
      }
    }, 5000); // Check these conditions every 5 seconds

    // Clean up the observer when we're done
    childProcess.on('close', () => {
      clearInterval(observer);
    });
  } else {
    // Normal mode: regular interval checks
    interval = setInterval(checkMemoryOnce, fullConfig.checkInterval * 1000);
  }

  // Handle process completion
  return new Promise((resolve, reject) => {
    // Listen for process output
    childProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      writeLog(`[stdout] ${output.trim()}`);
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      writeLog(`[stderr] ${output.trim()}`);
    });

    // Handle process completion
    childProcess.on('close', async (code: number | null) => {
      // In lightweight mode, do one final memory check before closing
      if (fullConfig.checkInterval === 0) {
        await checkMemoryOnce();
      }

      // Clean up interval if we have one
      if (interval) {
        clearInterval(interval);
      }

      // Ensure code is a number
      const exitCode = code === null ? 1 : code;

      // Update stats for summary
      stats.endTime = Date.now();
      stats.exitCode = exitCode;
      stats.status = exitCode === 0 ? 'SUCCESS' : 'FAILED';

      // Calculate final stats
      const durationSeconds = (stats.endTime - stats.startTime) / 1000;
      const avgMemoryMB =
        stats.sampleCount > 0 ? Math.round(stats.totalMemoryMB / stats.sampleCount) : 0;

      // Log completion
      const completionMessage = `ETL job completed with exit code ${exitCode} after ${logger.formatDuration(durationSeconds)}`;
      writeLog(completionMessage);
      writeLog(`Memory usage: avg ${avgMemoryMB}MB, max ${stats.maxMemoryMB}MB`);

      // Update spinner based on result
      if (!fullConfig.silent && spinner) {
        if (exitCode === 0) {
          spinner.succeed(completionMessage);
        } else {
          spinner.fail(completionMessage);
        }

        // Show memory usage summary in console
        logger.memoryUsage(stats.maxMemoryMB, fullConfig.memoryLimit);
        logger.metric('Average Memory', `${avgMemoryMB}MB`);
        logger.metric('Duration', logger.formatDuration(durationSeconds));
      }

      // Create result object
      const result: MonitorResult = {
        command,
        exitCode,
        duration: durationSeconds,
        avgMemoryMB,
        maxMemoryMB: stats.maxMemoryMB,
        status: stats.status as string,
        logFile: logFilePath,
        summaryFile: fullConfig.summaryFile || '',
      };

      // Save run data to summary file if requested
      if (fullConfig.summaryFile) {
        try {
          // Create summary data for this run
          const summaryData: RunSummaryData = {
            timestamp: startTime.replace(/:/g, '_'), // Format timestamp for safe filenames
            duration: durationSeconds,
            exit_code: result.exitCode,
            avg_memory_mb: avgMemoryMB,
            max_memory_mb: stats.maxMemoryMB,
            status: stats.status as string,
          };

          // Update summary file
          await updateSummaryFile(fullConfig.summaryFile, summaryData);

          if (!fullConfig.silent) {
            logger.info(`Summary updated at ${fullConfig.summaryFile}`);
          }
        } catch (error) {
          if (!fullConfig.silent) {
            logger.error(`Error updating summary file: ${(error as Error).message}`);
          }
        }
      }

      // Return the result object
      resolve(result);
    });

    // Handle process error
    childProcess.on('error', (error: Error) => {
      if (interval) {
        clearInterval(interval);
      }
      if (!fullConfig.silent && spinner) {
        spinner.fail(`Process error: ${error.message}`);
      }
      reject(error);
    });
  });
}
