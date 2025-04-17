/**
 * ETL Memory Monitor - File Helpers
 *
 * Utilities for reading/writing files and managing the summary data
 */

import { promises as fs, existsSync, openSync, closeSync } from 'fs';
import { dirname } from 'path';
import { MemoryPoint } from '../analyzer.js';

/**
 * Summary run data structure
 */
export interface RunSummaryData {
  timestamp: string;
  duration: number;
  exit_code: number;
  avg_memory_mb: number;
  max_memory_mb: number;
  status: string;
}

/**
 * Summary file data structure
 */
export interface SummaryData {
  runs: RunSummaryData[];
}

/**
 * Update the summary file with new run data
 *
 * @param summaryFilePath - Path to the summary JSON file
 * @param newRunData - Data from the latest run to add
 * @returns - The updated summary data
 */
export async function updateSummaryFile(
  summaryFilePath: string,
  newRunData: RunSummaryData,
): Promise<SummaryData> {
  try {
    // Make sure the directory exists
    await fs.mkdir(dirname(summaryFilePath), { recursive: true });

    let summaryData: SummaryData = { runs: [] };

    // Read existing data if file exists
    if (existsSync(summaryFilePath)) {
      try {
        const fileContent = await fs.readFile(summaryFilePath, 'utf8');
        summaryData = JSON.parse(fileContent) as SummaryData;
      } catch (err) {
        // If parsing fails, we'll start with a fresh summary
        console.error(`Warning: Could not parse summary file. Starting fresh.`);
      }
    }

    // Add the new run data
    if (!summaryData.runs) {
      summaryData.runs = [];
    }

    summaryData.runs.push(newRunData);

    // Write the updated data back to the file
    await fs.writeFile(summaryFilePath, JSON.stringify(summaryData, null, 2));

    return summaryData;
  } catch (error) {
    throw new Error(`Failed to update summary file: ${(error as Error).message}`);
  }
}

/**
 * Read a log file and extract memory usage data points
 *
 * @param logFilePath - Path to the log file
 * @returns - Array of memory data points with timestamp and value
 */
export async function extractMemoryData(logFilePath: string): Promise<MemoryPoint[]> {
  try {
    const content = await fs.readFile(logFilePath, 'utf8');
    const lines = content.split('\n');
    const memoryPoints: MemoryPoint[] = [];

    // Extract memory data points using regex
    const memoryRegex = /\[(\d+)s\] Memory: (\d+)MB/;

    for (const line of lines) {
      const match = line.match(memoryRegex);
      if (match) {
        const timestamp = parseInt(match[1]);
        const memoryMB = parseInt(match[2]);
        memoryPoints.push({ timestamp, memory: memoryMB });
      }
    }

    return memoryPoints;
  } catch (error) {
    throw new Error(`Failed to extract memory data: ${(error as Error).message}`);
  }
}

/**
 * Find the latest log file in a directory
 *
 * @param logDir - Directory containing log files
 * @returns - Path to the latest log file or null if none found
 */
export async function findLatestLogFile(logDir: string): Promise<string | null> {
  try {
    // Get all files in the log directory
    const files = await fs.readdir(logDir);

    // Filter for memory log files and sort by name (which includes timestamp)
    const logFiles = files
      .filter((file) => file.startsWith('etl_memory_') && file.endsWith('.log'))
      .sort();

    if (logFiles.length === 0) {
      return null;
    }

    // Return the most recent (last in sorted array)
    return `${logDir}/${logFiles[logFiles.length - 1]}`;
  } catch (error) {
    throw new Error(`Failed to find latest log file: ${(error as Error).message}`);
  }
}

/**
 * Synchronously check if a file exists and is readable
 *
 * @param filePath - Path to check
 * @returns - True if file exists and is readable
 */
export function isFileReadable(filePath: string): boolean {
  try {
    if (existsSync(filePath)) {
      // Try to read a byte to verify it's readable
      const fd = openSync(filePath, 'r');
      closeSync(fd);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
