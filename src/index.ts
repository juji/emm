import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { configureYargs, showHelp } from './help';

// Configure and parse arguments
const argv = configureYargs().parseSync(); // Use parseSync for immediate parsing

// Check if help flag is present
// @ts-ignore - Access parsed arguments
if (argv.help || argv.h) {
  showHelp(); // Explicitly call our showHelp function
} else {
  // Main CLI logic
  // @ts-ignore - Access parsed arguments
  const fileToExecute = argv.file as string;
  // @ts-ignore
  const monitorInterval = argv.interval as number;

  // Check if file argument is provided (yargs might not error out if help is requested)
  if (!fileToExecute && !(argv.help || argv.h)) {
    console.error("Error: Missing required argument: file");
    configureYargs().showHelp(); // Show help if file is missing and help wasn't requested
    process.exit(1);
  }

  console.log(`Executing file: ${fileToExecute}`);
  console.log(`Monitoring interval: ${monitorInterval}ms`);

  // TODO: Implement file execution logic (e.g., using Bun.spawn)
  // TODO: Implement memory monitoring logic (e.g., using setInterval and process.memoryUsage)
}