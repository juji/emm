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
  if (typeof Bun !== 'undefined' || (typeof process !== 'undefined' && process.versions?.bun)) {
    return 'bun';
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }
  return 'unknown';
}