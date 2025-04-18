export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external?: number;
}

export interface RuntimeExecutor {
  executeFile(filePath: string): Promise<void>;
  getMemoryUsage(): Promise<MemoryStats>;
}