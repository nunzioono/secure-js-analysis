import { LogEntry } from "./types";

/**
 * Props for the ExecutionLogPanel component.
 */
interface ExecutionLogPanelProps {
  logs: LogEntry[];
}

/**
 * Execution Log Panel
 *
 * Displays logs from the Web Worker.
 */
export function ExecutionLogPanel({ logs }: ExecutionLogPanelProps) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-2">Execution Logs:</h2>
      <pre className="bg-gray-100 p-2 h-48 overflow-auto">{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}

