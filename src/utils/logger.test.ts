import { describe, it, expect } from 'vitest';
import { logger } from './logger.js';

describe('logger utility', () => {
  it('formatMemory should format bytes correctly', () => {
    expect(logger.formatMemory(512)).toBe('512 B');
    expect(logger.formatMemory(2048)).toBe('2.00 KB');
    expect(logger.formatMemory(1048576)).toBe('1.00 MB');
    expect(logger.formatMemory(1073741824)).toBe('1.00 GB');
  });

  it('formatDuration should format seconds correctly', () => {
    expect(logger.formatDuration(30)).toBe('30.00s');
    expect(logger.formatDuration(90)).toBe('1m 30s');
    expect(logger.formatDuration(3661)).toBe('1h 1m 1s');
  });
});
