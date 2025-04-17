import { expect, vi } from 'vitest';

// Add your global setup code here

if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = require('crypto').webcrypto;
}

expect.extend({
  // Add your custom matchers here
});

vi.mock('some-module', () => {
  return {
    // Mock implementation
  };
});