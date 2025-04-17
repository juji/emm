/**
 * ETL Memory Monitor
 *
 * A comprehensive toolkit for monitoring, analyzing, and optimizing memory usage in ETL jobs.
 * This package provides tools to track memory usage, generate visual insights,
 * and suggest optimizations based on observed memory patterns.
 */

import { memoryMonitor } from './monitor.js';
import { memoryAnalyzer } from './analyzer.js';
import { optimizationSuggester } from './optimizer.js';
import { logger } from './utils/logger.js';

// Create a unified API type
interface ETLMonitorAPI {
  monitor: typeof memoryMonitor;
  analyze: typeof memoryAnalyzer;
  optimize: typeof optimizationSuggester;
  log: typeof logger;
}

// Export individual components
export { memoryMonitor, memoryAnalyzer, optimizationSuggester, logger };

// For easier access to the entire API with defaults
const api: ETLMonitorAPI = {
  monitor: memoryMonitor,
  analyze: memoryAnalyzer,
  optimize: optimizationSuggester,
  log: logger,
};

export default api;
