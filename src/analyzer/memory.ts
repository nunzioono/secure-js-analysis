/**
 * Memory management utilities for tracking variable sizes at runtime.
 * 
 * Provides estimation of object memory usage in bytes,
 * to enforce sandbox limits inside Web Workers.
 */

/**
 * Maximum allowed memory usage in bytes (5 MB).
 */
export const MEMORY_LIMIT_BYTES = 5 * 1024 * 1024;

/**
 * Recursively estimates the memory size of an object.
 * 
 * Approximates based on primitive types and traverses object graphs safely
 * (handles cycles via a visited set).
 *
 * @param obj - The object or value to estimate.
 * @returns Estimated size in bytes.
 */
export function estimateSize(obj: any): number {
  const visited = new Set();
  const stack = [obj];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();
    if (value == null) continue;
    if (typeof value === 'boolean') bytes += 4;
    else if (typeof value === 'number') bytes += 8;
    else if (typeof value === 'string') bytes += value.length * 2;
    else if (typeof value === 'object') {
      if (visited.has(value)) continue;
      visited.add(value);
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          bytes += key.length * 2;
          stack.push(value[key]);
        }
      }
    }
  }

  return bytes;
}

