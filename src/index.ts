import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { configureYargs } from './help'; // Removed showHelp import

// Configure and parse arguments
const argv = configureYargs().parseSync(); // Use parseSync for immediate parsing

// Main CLI logic
// @ts-ignore - Access parsed arguments
const fileToExecute = argv.file as string;
// @ts-ignore
const monitorInterval = argv.interval as number;

// Yargs' demandOption handles the missing file check automatically
// The explicit check for help is removed as yargs handles it

console.log(`Executing file: ${fileToExecute}`);
console.log(`Monitoring interval: ${monitorInterval}ms`);

// TODO: Implement file execution logic (e.g., using Bun.spawn)
// TODO: Implement memory monitoring logic (e.g., using setInterval and process.memoryUsage)