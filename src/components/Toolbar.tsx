/**
 * Props for the Toolbar component.
 */
interface ToolbarProps {
  onFormat: () => void;
  onRun: () => void;
}

/**
 * Toolbar Component
 *
 * Renders action buttons for formatting and running code.
 */
export function Toolbar({ onFormat, onRun }: ToolbarProps) {
  return (
    <div className="flex space-x-2 mb-2">
      <button onClick={onFormat} className="p-2 bg-blue-600 text-white rounded">
        Format Code
      </button>
      <button onClick={onRun} className="p-2 bg-green-600 text-white rounded">
        Analyze & Run
      </button>
    </div>
  );
}

