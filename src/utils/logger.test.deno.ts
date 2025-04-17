import { logger } from './logger.ts';

Deno.test('formatMemory should format bytes correctly', () => {
  if (logger.formatMemory(512) !== '512 B') throw new Error('fail');
  if (logger.formatMemory(2048) !== '2.00 KB') throw new Error('fail');
  if (logger.formatMemory(1048576) !== '1.00 MB') throw new Error('fail');
  if (logger.formatMemory(1073741824) !== '1.00 GB') throw new Error('fail');
});

Deno.test('formatDuration should format seconds correctly', () => {
  if (logger.formatDuration(30) !== '30.00s') throw new Error('fail');
  if (logger.formatDuration(90) !== '1m 30s') throw new Error('fail');
  if (logger.formatDuration(3661) !== '1h 1m 1s') throw new Error('fail');
});

Deno.test('should log messages', () => {
  let output = '';
  const orig = console.log;
  console.log = (msg: string) => { output += msg; };
  logger.info('test message');
  console.log = orig;
  if (!output.includes('test message')) throw new Error('logger did not log');
});