import type { Monaco } from "@monaco-editor/react";

/**
 * Define instrument-panel Monaco themes once. Editors use `beforeMount={defineMonacoThemes}`
 * then `theme="yoapi-dark" | "yoapi-light"`. Colors mirror the CSS tokens so the
 * editor reads as part of the case, not a pasted-in widget.
 */
let done = false;

export function defineMonacoThemes(monaco: Monaco) {
  if (done) return;
  done = true;

  monaco.editor.defineTheme("yoapi-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "9fb0c0" },
      { token: "string.value.json", foreground: "34d6c8" },
      { token: "number", foreground: "f2b544" },
      { token: "keyword.json", foreground: "b98cff" },
      { token: "string", foreground: "34d6c8" },
      { token: "comment", foreground: "5d6f80" },
      { token: "type", foreground: "5aa9ff" },
    ],
    colors: {
      "editor.background": "#10161d",
      "editor.foreground": "#e6edf3",
      "editorLineNumber.foreground": "#3a4854",
      "editorLineNumber.activeForeground": "#9fb0c0",
      "editor.selectionBackground": "#34d6c833",
      "editor.inactiveSelectionBackground": "#34d6c81a",
      "editorCursor.foreground": "#34d6c8",
      "editor.lineHighlightBackground": "#161d26",
      "editorGutter.background": "#10161d",
      "editorWidget.background": "#1b232d",
      "editorIndentGuide.background1": "#212b36",
    },
  });

  monaco.editor.defineTheme("yoapi-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "4a5967" },
      { token: "string.value.json", foreground: "0b7d73" },
      { token: "number", foreground: "b9760a" },
      { token: "string", foreground: "0b7d73" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#10161d",
      "editor.selectionBackground": "#0f9c9033",
      "editorCursor.foreground": "#0f9c90",
      "editor.lineHighlightBackground": "#f5f7f9",
    },
  });
}
