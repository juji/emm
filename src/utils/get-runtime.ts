export type Runtime = 'node' | 'bun' | 'deno' | 'unknown';

/**
 * Detects the current JavaScript runtime environment.
 * Assumes Node.js if the environment is not detected as Deno or Bun.
 * @returns The detected runtime ('node', 'bun', or 'deno').
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
  // if (typeof process !== 'undefined' && process.versions?.node) {
  //   return 'node';
  // }
  // return 'unknown';
  // Default to Node.js if not Deno or Bun
  // console.log('Assuming Node.js runtime'); 
  // it will just crash if not node
  return 'node';
}