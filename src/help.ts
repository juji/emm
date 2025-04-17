import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Configure yargs for help output and command structure
export function configureYargs() {
  return yargs(hideBin(process.argv))
    .scriptName("emm")
    .usage('Usage: $0 <file> [options]')
    .command('$0 <file>', 'Execute a file and monitor its memory usage', (yargs) => {
      yargs.positional('file', {
        describe: 'The file to execute',
        type: 'string',
        demandOption: true, // Make the file argument required
      });
    })
    .option('interval', {
      alias: 'i',
      describe: 'Memory monitoring interval in milliseconds',
      type: 'number',
      default: 1000, // Default interval 1 second
    })
    // Remove automatic help handling by yargs
    // .help('help')
    // .alias('help', 'h')
    // Add the help option manually so we can detect it
    .option('help', {
      alias: 'h',
      describe: 'Show help',
      type: 'boolean'
    });
}

export function showHelp() {
  const header = `\nemm CLI (Bun Ready)\n-------------------\n`;
  console.log(header);
  // Use the configured yargs instance to show help
  configureYargs().showHelp();
}
