import { RuntimeExecutor, MemoryStats } from '../types';

export class BunExecutor implements RuntimeExecutor {
  private process: any;

  async executeFile(filePath: string): Promise<void> {
    this.process = Bun.spawn(['bun', 'run', filePath], {
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const exitCode = await this.process.exited;
    if (exitCode !== 0) {
      throw new Error(`Process exited with code ${exitCode}`);
    }
  }

  async getMemoryUsage(): Promise<MemoryStats> {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      rss: usage.rss,
      external: usage.external,
    };
  }
}

export {}; // Add an empty export to make it a module
