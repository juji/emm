/**
 * ETL Memory Monitor - Logger
 *
 * Beautiful and customizable logging utility using consola and chalk
 */

import consola from 'consola';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import archy from 'archy';

/**
 * Theme colors interface for consistent styling
 */
interface LoggerTheme {
  title: (text: string) => string;
  success: (text: string) => string;
  info: (text: string) => string;
  warning: (text: string) => string;
  error: (text: string) => string;
  metric: (text: string) => string;
  highlight: (text: string) => string;
  muted: (text: string) => string;
  path: (text: string) => string;
  value: (text: string) => string;
  header: (text: string) => string;
  memoryLow: (text: string) => string;
  memoryMedium: (text: string) => string;
  memoryHigh: (text: string) => string;
  sectionTitle: (text: string) => string;
}

/**
 * Enhanced logger methods extending consola
 */
interface EnhancedLoggerMethods {
  theme: LoggerTheme;
  spinner: (text: string) => Ora;
  progressBar: (percent: number, width?: number) => string;
  treeView: (structure: any) => string;
  memoryBar: (usedMB: number, limitMB: number, width?: number) => string;
  formatMemory: (bytes: number) => string;
  formatDuration: (seconds: number) => string;
  title: (text: string) => void;
  header: (text: string) => void;
  section: (text: string) => void;
  metric: (label: string, value: string | number) => void;
  pathInfo: (label: string, path: string) => void;
  memoryUsage: (used: number, limit: number) => void;
}

// Combine the types for full enhanced logger
type EnhancedLogger = typeof consola & EnhancedLoggerMethods;

// Configure consola for beautiful logging
const logger = consola.create({
  level: 5, // Default to 'debug' level
});

// Create theme colors for consistent styling
const theme: LoggerTheme = {
  title: chalk.bold.blue,
  success: chalk.bold.green,
  info: chalk.cyan,
  warning: chalk.bold.yellow,
  error: chalk.bold.red,
  metric: chalk.magenta,
  highlight: chalk.bold.white.bgBlue,
  muted: chalk.dim,
  path: chalk.underline.cyan,
  value: chalk.bold.yellow,
  header: (text) => chalk.bold.white.bgBlue(` ${text} `),
  memoryLow: chalk.green,
  memoryMedium: chalk.yellow,
  memoryHigh: chalk.red,
  sectionTitle: (text) => {
    const padding = '='.repeat(3);
    return `\n${chalk.bold.cyan(`${padding} ${text} ${padding}`)}`;
  },
};

// Create custom spinner
const createSpinner = (text: string): Ora => {
  return ora({
    text,
    spinner: 'dots',
    color: 'cyan',
  });
};

// Progress bar - ASCII based (fallback)
const progressBar = (percent: number, width = 30): string => {
  const complete = Math.round(width * (percent / 100));
  const incomplete = width - complete;
  const bar = `${chalk.bgCyan(' '.repeat(complete))}${chalk.bgGray(' '.repeat(incomplete))}`;
  return `${bar} ${chalk.bold.cyan(percent.toFixed(1))}%`;
};

// Tree visualization using archy
const treeView = (structure: any): string => {
  return archy(structure);
};

// Memory usage visualization
const memoryBar = (usedMB: number, limitMB: number, width = 30): string => {
  const percent = (usedMB / limitMB) * 100;
  const complete = Math.round(width * (percent / 100));
  const incomplete = width - complete;

  // Determine color based on usage percentage
  let barColor;
  if (percent < 50) barColor = chalk.bgGreen;
  else if (percent < 85) barColor = chalk.bgYellow;
  else barColor = chalk.bgRed;

  const bar = `${barColor(' '.repeat(complete))}${chalk.bgGray(' '.repeat(incomplete))}`;
  return `${bar} ${usedMB}MB/${limitMB}MB (${percent.toFixed(1)}%)`;
};

// Format memory size with appropriate units
const formatMemory = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  else if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  else return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

// Format duration with appropriate units
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${mins}m ${secs}s`;
  }
};

// Enhanced logger with our custom methods
const enhancedLogger = {
  ...logger,
  theme,
  spinner: createSpinner,
  progressBar,
  treeView,
  memoryBar,
  formatMemory,
  formatDuration,

  // Special styled log methods
  title: (text: string) => logger.info(theme.title(text)),
  header: (text: string) => logger.info(theme.header(text)),
  section: (text: string) => logger.info(theme.sectionTitle(text)),
  metric: (label: string, value: string | number) =>
    logger.info(`${theme.muted(label)}: ${theme.value(String(value))}`),
  pathInfo: (label: string, path: string) =>
    logger.info(`${theme.muted(label)}: ${theme.path(path)}`),

  // Memory specific logs
  memoryUsage: (used: number, limit: number) => {
    const percent = (used / limit) * 100;
    let colorFn = theme.memoryLow;
    if (percent > 75) colorFn = theme.memoryHigh;
    else if (percent > 50) colorFn = theme.memoryMedium;

    logger.info(
      `Memory: ${colorFn(`${used}MB / ${limit}MB (${percent.toFixed(1)}%)`)} ${memoryBar(used, limit)}`,
    );
  },
} as EnhancedLogger;

export { enhancedLogger as logger };
