#!/usr/bin/env node

/**
 * ETL Memory Monitor - Optimization Suggester CLI
 *
 * Command-line interface for suggesting ETL memory optimizations
 */

import { Command } from 'commander';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { optimizationSuggester, OptimizerConfig } from '../optimizer.js';
import { logger } from '../utils/logger.js';

interface CommandOptions extends OptimizerConfig {
  logDir: string;
  logFile?: string;
  summaryFile?: string;
  detailed: boolean;
}

async function main(): Promise<void> {
  // Get package version from package.json
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const packageJson = await import(resolve(__dirname, '../../package.json'), {
    assert: { type: 'json' },
  });
  const version = packageJson.default.version;

  // Create command-line program
  const program = new Command();

  program
    .name('etl-optimize')
    .description('Get ETL job memory optimization suggestions')
    .version(version)
    .option('-l, --log-dir <path>', 'Directory containing log files', './logs')
    .option('-f, --log-file <path>', 'Specific log file to analyze')
    .option('-s, --summary-file <path>', 'Path to the summary JSON file')
    .option('-d, --detailed', 'Show detailed optimization strategies', false)
    .action(async (options: CommandOptions) => {
      try {
        const config: OptimizerConfig = {
          logDir: resolve(options.logDir),
          logFile: options.logFile ? resolve(options.logFile) : null,
          summaryFile: options.summaryFile ? resolve(options.summaryFile) : null,
          detailed: options.detailed,
        };

        // Display beautiful header with CLI options
        console.log('');
        logger.title(`ETL Memory Optimization Suggester v${version}`);

        if (config.logFile) {
          logger.info(`Analyzing log file: ${logger.theme.path(config.logFile)}`);
        } else {
          logger.info(`Analyzing logs in: ${logger.theme.path(config.logDir!)}`);
        }

        if (config.detailed) {
          logger.info(`Showing detailed optimization strategies`);
        }

        console.log('');

        // Run memory optimization analysis
        await optimizationSuggester(config);

        process.exit(0);
      } catch (error) {
        logger.error(`Error generating optimization suggestions: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main().catch((error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
});
