#!/usr/bin/env node

/**
 * ETL Memory Monitor - Runner CLI
 *
 * Command-line interface for running ETL jobs with memory monitoring
 */

import { Command } from 'commander';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { memoryMonitor } from '../monitor.js';
import { logger } from '../utils/logger.js';

interface CommandOptions {
  memoryLimit: number;
  logDir: string;
  summaryFile?: string;
  silent: boolean;
  kill: boolean;
  checkInterval: number;
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
    .name('etl-run')
    .description('Run an ETL job with memory monitoring')
    .version(version)
    .argument('<command>', 'Command to execute (e.g., "node script.js")')
    .option('-m, --memory-limit <limit>', 'Memory limit in MB', parseInt, 500)
    .option('-l, --log-dir <path>', 'Directory for storing logs', './logs')
    .option('-s, --summary-file <path>', 'Path to the summary JSON file')
    .option('-k, --no-kill', 'Do not kill process when memory limit is exceeded')
    .option('--silent', 'Minimal console output', false)
    .option(
      '--check-interval <seconds>',
      'Interval between memory checks in seconds (0 = lightweight mode, only key points)',
      parseInt,
      2,
    )
    .action(async (command: string, options: CommandOptions) => {
      try {
        const config = {
          memoryLimit: options.memoryLimit,
          logDir: resolve(options.logDir),
          summaryFile: options.summaryFile ? resolve(options.summaryFile) : null,
          silent: options.silent,
          killOnLimit: options.kill,
          checkInterval: options.checkInterval,
        };

        // Display beautiful header with CLI options
        console.log('');
        logger.title(`ETL Memory Monitor v${version}`);
        logger.info(`Running command: ${logger.theme.highlight(command)}`);
        logger.info(`Memory limit: ${logger.theme.value(options.memoryLimit + ' MB')}`);

        // Add monitoring mode info
        if (options.checkInterval === 0) {
          logger.info(`Mode: ${logger.theme.value('Lightweight')} (minimal CPU usage)`);
        } else {
          logger.info(`Check interval: ${logger.theme.value(options.checkInterval + ' seconds')}`);
        }

        logger.info(`Will ${options.kill ? '' : 'NOT '}kill process if memory limit is exceeded`);
        console.log('');

        // Run the ETL job with memory monitoring
        const result = await memoryMonitor(command, config);

        if (result && result.exitCode === 0) {
          process.exit(0);
        } else {
          process.exit(result?.exitCode || 1);
        }
      } catch (error) {
        logger.error(`Error running ETL job: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main().catch((error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
});
