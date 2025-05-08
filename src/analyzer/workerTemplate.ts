import { MEMORY_LIMIT_BYTES } from "./memory";

/**
 * Creates a full Web Worker script string that will execute
 * user code inside a protected proxy, enforce memory limits,
 * and report variable reads/writes.
 *
 * @param instrumentedUserCode - User JavaScript code, pre-instrumented.
 * @returns Full JavaScript source string for Web Worker.
 */
export function createWorkerScript(instrumentedUserCode: string): string {
  return `
    self.__startTime = Date.now();
    const send = (type, payload) => {
      self.postMessage({ type, payload });
    };

    const MEMORY_LIMIT_BYTES = ${MEMORY_LIMIT_BYTES};

    const estimateSize = ${inlineEstimateSize.toString()};

    const variableTracker = new Proxy({}, {
      get(target, prop) {
        send('variableRead', { name: prop, value: target[prop] });
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value;
        send('variableChange', { name: prop, value: value });
        const memoryUsed = estimateSize(target);
        if (memoryUsed > MEMORY_LIMIT_BYTES) {
          throw new Error("Memory limit exceeded: " + (memoryUsed / (1024 * 1024)).toFixed(2) + " MB used");
        }
        return true;
      }
    });

    with (variableTracker) {
      try {
        ${instrumentedUserCode}
      } catch (e) {
        send('error', { message: e.message });
      }
    }
    self.close();
  `;
}

/**
 * Inline version of memory size estimation function,
 * embedded inside the worker source string.
 *
 * @param obj - Object or value to estimate.
 * @returns Estimated memory size in bytes.
 */
function inlineEstimateSize(obj: any): number {
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

