/**
 * Build script for JSR compatibility
 * This ensures the package works across Node.js, Bun, and Deno
 */
import * as esbuild from 'https://deno.land/x/esbuild@v0.20.1/mod.js';

async function build() {
  // Ensure dist directory exists
  await Deno.mkdir("dist", { recursive: true });

  // Bundle for ESM
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/index.js',
    platform: 'neutral',
    target: 'esnext',
    sourcemap: true,
  });

  // Initialize deno process
  await esbuild.initialize({});
  
  console.log("✓ Build complete");
  
  // Clean up esbuild
  esbuild.stop();
}

if (import.meta.main) {
  await build();
}