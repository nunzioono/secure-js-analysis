/**
 * Common log types captured during Web Worker execution.
 */

/**
 * Base structure for any log entry.
 */
export interface BaseLogEntry {
  type: string;
  payload: any;
}

/**
 * Log for a variable read operation.
 */
export interface VariableReadLog extends BaseLogEntry {
  type: "variableRead";
  payload: {
    name: string;
    value: any;
  };
}

/**
 * Log for a variable change (write) operation.
 */
export interface VariableChangeLog extends BaseLogEntry {
  type: "variableChange";
  payload: {
    name: string;
    value: any;
  };
}

/**
 * Log for an error thrown during execution.
 */
export interface ErrorLog extends BaseLogEntry {
  type: "error";
  payload: {
    message: string;
  };
}

/**
 * Union of all possible logs from execution.
 */
export type LogEntry = VariableReadLog | VariableChangeLog | ErrorLog;

