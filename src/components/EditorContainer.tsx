import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";

export interface EditorContainerProps {
  onEditorMount: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  initialCode: string;
}

export function EditorContainer({ onEditorMount, initialCode }: EditorContainerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      if (monacoEditorInstanceRef.current) {
        monacoEditorInstanceRef.current.dispose();
      }

      const modelUri = monaco.Uri.parse("inmemory://model.js");
      let model = monaco.editor.getModel(modelUri);

      if (!model) {
        model = monaco.editor.createModel(initialCode, "plaintext", modelUri); // Start as plaintext
      } else {
        model.setValue(initialCode);
      }

      modelRef.current = model;

      const instance = monaco.editor.create(editorRef.current, {
        model,
        theme: "vs-dark",
        automaticLayout: true,
      });

      monacoEditorInstanceRef.current = instance;

      onEditorMount(instance);

      return () => {
        instance.dispose();
        monacoEditorInstanceRef.current = null;
        modelRef.current = null;
      };
    }
  }, [onEditorMount, initialCode]);

  return <div ref={editorRef} style={{ height: "500px", width: "100%" }} />;
}
