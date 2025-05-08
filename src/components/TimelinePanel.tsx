import { LogEntry } from "./types";

/**
 * Props for the TimelinePanel component.
 */
interface TimelinePanelProps {
  logs: LogEntry[];
}

/**
 * Timeline Panel
 *
 * Displays a timeline of variable read/write operations.
 */
export function TimelinePanel({ logs }: TimelinePanelProps) {
  const timelineEntries = logs.filter(
    (log): log is { type: "variableChange" | "variableRead"; payload: any } =>
      log.type === "variableChange" || log.type === "variableRead"
  );

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-2">Variable Timeline:</h2>
      <div className="border p-2 bg-white h-48 overflow-auto">
        {timelineEntries.map((log, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div className="font-bold">{log.type === "variableChange" ? "WRITE" : "READ"}:</div>
            <div>
              {log.payload.name} = {JSON.stringify(log.payload.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

