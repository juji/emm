import { spawn } from 'child_process';
import { RuntimeExecutor, MemoryStats } from '../types';

// Node.js specific implementations

export class NodeExecutor implements RuntimeExecutor {
  private childProcess: any;

  async executeFile(filePath: string): Promise<void> {
    this.childProcess = spawn('node', [filePath], {
      stdio: 'inherit',
    });

    return new Promise((resolve, reject) => {
      this.childProcess.on('exit', (code: number) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      this.childProcess.on('error', reject);
    });
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
