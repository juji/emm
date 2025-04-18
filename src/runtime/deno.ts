import { RuntimeExecutor, MemoryStats } from '../types';

export class DenoExecutor implements RuntimeExecutor {
  private process: any;

  async executeFile(filePath: string): Promise<void> {
    // Using more generic child process approach for Deno
    this.process = new (globalThis as any).Deno.Command('deno', {
      args: ['run', '--allow-all', filePath],
      stdout: 'inherit',
      stderr: 'inherit',
    }).spawn();

    const status = await this.process.status;
    if (status.code !== 0) {
      throw new Error(`Process exited with code ${status.code}`);
    }
  }

  async getMemoryUsage(): Promise<MemoryStats> {
    // Use Deno.metrics() when available in the runtime
    const metrics = (globalThis as any).Deno?.metrics?.();
    return {
      heapUsed: metrics?.heapUsed ?? 0,
      heapTotal: metrics?.heapTotal ?? 0,
      rss: metrics?.rss ?? 0,
      external: 0,
    };
  }
}

export {}; // Add an empty export to make it a module
