import { logger } from './logger.js';
import assert from 'assert';

describe('logger', () => {
  it('formatMemory should format bytes correctly', () => {
    assert.equal(logger.formatMemory(512), '512 B');
    assert.equal(logger.formatMemory(2048), '2.00 KB');
    assert.equal(logger.formatMemory(1048576), '1.00 MB');
    assert.equal(logger.formatMemory(1073741824), '1.00 GB');
  });

  it('formatDuration should format seconds correctly', () => {
    assert.equal(logger.formatDuration(30), '30.00s');
    assert.equal(logger.formatDuration(90), '1m 30s');
    assert.equal(logger.formatDuration(3661), '1h 1m 1s');
  });

  it('should log messages', () => {
    let output = '';
    const orig = console.log;
    console.log = (msg) => { output += msg; };
    logger.info('test message');
    console.log = orig;
    assert(output.includes('test message'));
  });

  it('should log errors', () => {
    let output = '';
    const orig = console.error;
    console.error = (msg) => { output += msg; };
    logger.error('test error');
    console.error = orig;
    assert(output.includes('test error'));
  });
});