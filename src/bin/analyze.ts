#!/usr/bin/env node

/**
 * ETL Memory Monitor - Analyzer CLI
 *
 * Command-line interface for analyzing ETL job memory usage
 */

import { Command } from 'commander';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { memoryAnalyzer, AnalyzerConfig } from '../analyzer.js';
import { logger } from '../utils/logger.js';

interface CommandOptions extends AnalyzerConfig {
  logDir: string;
  logFile?: string;
  summaryFile?: string;
  lastRuns: number;
  output: 'terminal' | 'html';
  htmlOutput?: string;
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
    .name('etl-analyze')
    .description('Analyze ETL job memory usage')
    .version(version)
    .option('-l, --log-dir <path>', 'Directory containing log files', './logs')
    .option('-f, --log-file <path>', 'Specific log file to analyze')
    .option('-s, --summary-file <path>', 'Path to the summary JSON file')
    .option('-r, --last-runs <number>', 'Number of recent runs to analyze', parseInt, 10)
    .option('-o, --output <format>', 'Output format: "terminal" or "html"', 'terminal')
    .option('-h, --html-output <path>', 'Path to save HTML output')
    .action(async (options: CommandOptions) => {
      try {
        const config: AnalyzerConfig = {
          logDir: resolve(options.logDir),
          logFile: options.logFile ? resolve(options.logFile) : null,
          summaryFile: options.summaryFile ? resolve(options.summaryFile) : null,
          lastRuns: options.lastRuns,
          output: options.output as 'terminal' | 'html',
          htmlOutput: options.htmlOutput ? resolve(options.htmlOutput) : null,
        };

        // Display beautiful header with CLI options
        console.log('');
        logger.title(`ETL Memory Analyzer v${version}`);

        if (config.logFile) {
          logger.info(`Analyzing log file: ${logger.theme.path(config.logFile)}`);
        } else {
          logger.info(`Analyzing logs in: ${logger.theme.path(config.logDir!)}`);
        }

        logger.info(`Output format: ${logger.theme.value(config.output!)}`);

        if (config.output === 'html' && config.htmlOutput) {
          logger.info(`HTML output: ${logger.theme.path(config.htmlOutput)}`);
        }

        console.log('');

        // Run memory analysis
        await memoryAnalyzer(config);

        process.exit(0);
      } catch (error) {
        logger.error(`Error analyzing memory data: ${(error as Error).message}`);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main().catch((error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
});
