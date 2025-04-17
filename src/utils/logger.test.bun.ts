import { logger } from './logger.js';

Bun.test('should log messages', () => {
  let output = '';
  const orig = console.log;
  console.log = (msg) => { output += msg; };
  logger.info('test message');
  console.log = orig;
  if (!output.includes('test message')) throw new Error('logger did not log');
});

Bun.test('should log errors', () => {
  let output = '';
  const orig = console.error;
  console.error = (msg) => { output += msg; };
  logger.error('test error');
  console.error = orig;
  if (!output.includes('test error')) throw new Error('logger did not log');
});