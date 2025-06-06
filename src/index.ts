import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { configureYargs } from './help'; // Removed showHelp import
import { getRuntime } from './utils/get-runtime';
import { NodeExecutor } from './runtime/node';
import { BunExecutor } from './runtime/bun';
import { DenoExecutor } from './runtime/deno';
import chalk from 'chalk';
import { RuntimeExecutor } from './types';
import fs from 'fs';
import os from 'os';

// Configure and parse arguments
const argv = configureYargs().parseSync(); // Use parseSync for immediate parsing
const fileToExecute = argv.file as string;
const monitorInterval = argv.interval as number;
const outFile = argv.out as string | undefined;

async function main() {
  // Create the appropriate executor based on runtime
  const runtime = getRuntime();
  let executor: RuntimeExecutor;

  switch (runtime) {
    case 'node':
      executor = new NodeExecutor();
      break;
    case 'bun':
      executor = new BunExecutor();
      break;
    case 'deno':
      executor = new DenoExecutor();
      break;
    default:
      console.error(chalk.red('Unsupported runtime environment'));
      process.exit(1);
  }

  console.log(chalk.blueBright(`
 ______ ______ ______
|      |      |      |
|  ----|  ----|  ----|
|______|______|______| 
`));

  console.log(chalk.cyan(`emm - ETL Memory Monitor`));
  console.log(chalk.gray(`Runtime: ${runtime}`));
  console.log(chalk.gray(`File: ${fileToExecute}`));
  console.log(chalk.gray(`Interval: ${monitorInterval}ms\n`));

  try {
    // Start memory monitoring
    const intervalId = setInterval(async () => {
      const stats = await executor.getMemoryUsage();
      const output = `Memory usage:\n  Heap used: ${(stats.heapUsed / 1024 / 1024).toFixed(2)} MB\n  Heap total: ${(stats.heapTotal / 1024 / 1024).toFixed(2)} MB\n  RSS: ${(stats.rss / 1024 / 1024).toFixed(2)} MB${stats.external !== undefined ? `\n  External: ${(stats.external / 1024 / 1024).toFixed(2)} MB` : ''}\n`;
      if (outFile) {
        fs.appendFileSync(outFile, output);
      } else {
        console.log(output);
      }
    }, monitorInterval);

    // Execute the file
    await executor.executeFile(fileToExecute);
    clearInterval(intervalId);

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});