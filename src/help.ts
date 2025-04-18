import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk'; // Import chalk for potential coloring

// Configure yargs for command structure, but disable default help
export function configureYargs() {
  return yargs(hideBin(process.argv))
    .scriptName("emm")
    .usage('Usage: $0 <file> [options]')
    .command('$0 <file>', 'Execute a file and monitor its memory usage', (yargs) => {
      yargs.positional('file', {
        describe: 'The file to execute',
        type: 'string',
        demandOption: true, // Keep file argument required
      });
    })
    .option('interval', {
      alias: 'i',
      describe: 'Memory monitoring interval in milliseconds',
      type: 'number',
      default: 1000,
    })
    .option('help', { // Define the help option manually
      alias: 'h',
      describe: 'Show help',
      type: 'boolean'
    })
    .version() // Keep version handling
    .alias('version', 'v') // Add alias for version
    .help(false) // Disable default yargs help behavior
    .fail((msg, err, yargs) => { // Custom failure handler
      if (msg && !err) { // If it's just a validation message (like missing arg)
        console.error(chalk.red(`Error: ${msg}\n`));
        showHelp(); // Show our custom help format on error
      } else if (err) {
        console.error(chalk.red('An unexpected error occurred:'), err);
      }
      console.log(`
        
        `)
      process.exit(1);
    });
}

// Custom help function
export function showHelp() {
  const header = `
${chalk.bold('emm')} - ETL Memory Monitor

${chalk.blueBright(`
 ______ ______ ______
|      |      |      |
|  ----|  ----|  ----|
|______|______|______|
`)}
`;
  console.log(header);
  // Manually print the help generated by yargs configuration
  configureYargs().showHelp(console.log);
}
