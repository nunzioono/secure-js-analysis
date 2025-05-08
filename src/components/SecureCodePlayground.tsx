import { useState, useRef } from "react";

import { ExecutionLogPanel } from "./ExecutionLogPanel";
import { TimelinePanel } from "./TimelinePanel";
import { EditorContainer } from "./EditorContainer";
import { LogEntry } from "./types";

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker: function (_moduleId, label) {
    if (label === "typescript" || label === "javascript") {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

export function SecureCodePlayground() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleEditorMount(editor: monaco.editor.IStandaloneCodeEditor) {
    const model = editor.getModel();

    if (!model) return;

    const uri = model.uri;

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      jsx: monaco.languages.typescript.JsxEmit.React,
      noEmit: true,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    (monaco.languages.typescript as any).getTypeScriptWorker().then((workerFactory: any) => {
      workerFactory(uri.toString()).then((client: any) => {
        const originalGetScriptFileNames = client.getScriptFileNames.bind(client);

        client.getScriptFileNames = async () => {
          const base = await originalGetScriptFileNames();
          return [...base, uri.toString()];
        };

        const originalGetScriptSnapshot = client.getScriptSnapshot.bind(client);

        client.getScriptSnapshot = async (fileName: string) => {
          if (fileName === uri.toString()) {
            return {
              getText: (start: number, end: number) => model.getValue().substring(start, end),
              getLength: () => model.getValue().length,
              getChangeRange: () => undefined,
            };
          }
          return originalGetScriptSnapshot(fileName);
        };

        // ✅ Now AFTER patching the worker, switch to JavaScript safely
        monaco.editor.setModelLanguage(model, "javascript");

        console.log("Model language finally set to:", model.getLanguageId());

        // 🛠️ Optionally force validation (some setups need it)
        monaco.languages.typescript.getTypeScriptWorker().then((factory: any) => {
          factory(uri.toString()).then((worker: any) => {
            worker.getSemanticDiagnostics(uri.toString()).then(console.log);
          });
        });
      });
    });
  }




  return (
    <div className="p-4 space-y-4">
      <EditorContainer
        onEditorMount={handleEditorMount}
        initialCode={`function greet(name) {\n  return 'Hello, ' + name;\n}`}
      />
      <ExecutionLogPanel logs={logs} />
      <TimelinePanel logs={logs} />
    </div>
  );
}
