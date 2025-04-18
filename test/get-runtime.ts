export type Runtime = 'node' | 'bun' | 'deno' | 'unknown';

/**
 * Detects the current JavaScript runtime environment.
 * @returns The detected runtime ('node', 'bun', 'deno', or 'unknown').
 */
export function getRuntime(): Runtime {
  // @ts-ignore - Deno is a global in Deno
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }
  // @ts-ignore - Bun is a global in Bun
  if (typeof Bun !== 'undefined' || typeof process !== 'undefined' && process.versions?.bun) {
    return 'bun';
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }
  return 'unknown';
}

import assert from 'assert';
describe('getRuntime', () => {
  let originalDeno: any;
  let originalBun: any;
  let originalProcess: any;

  beforeEach(() => {
    originalDeno = global.Deno;
    originalBun = global.Bun;
    originalProcess = global.process;
  });

  afterEach(() => {
    if (typeof originalDeno === 'undefined') {
      delete (global as any).Deno;
    } else {
      (global as any).Deno = originalDeno;
    }
    if (typeof originalBun === 'undefined') {
      delete (global as any).Bun;
    } else {
      (global as any).Bun = originalBun;
    }
    if (typeof originalProcess === 'undefined') {
      delete (global as any).process;
    } else {
      (global as any).process = originalProcess;
    }
  });

  it('should detect Deno', () => {
    (global as any).Deno = {};
    delete (global as any).Bun;
    delete (global as any).process;
    assert.strictEqual(getRuntime(), 'deno');
  });

  it('should detect Bun via Bun global', () => {
    delete (global as any).Deno;
    (global as any).Bun = {};
    delete (global as any).process;
    assert.strictEqual(getRuntime(), 'bun');
  });

  it('should detect Bun via process.versions.bun', () => {
    delete (global as any).Deno;
    delete (global as any).Bun;
    (global as any).process = { versions: { bun: '1.0.0' } };
    assert.strictEqual(getRuntime(), 'bun');
  });

  it('should detect Node', () => {
    delete (global as any).Deno;
    delete (global as any).Bun;
    (global as any).process = { versions: { node: '20.0.0' } };
    assert.strictEqual(getRuntime(), 'node');
  });

  it('should detect unknown', () => {
    delete (global as any).Deno;
    delete (global as any).Bun;
    delete (global as any).process;
    assert.strictEqual(getRuntime(), 'unknown');
  });
});
