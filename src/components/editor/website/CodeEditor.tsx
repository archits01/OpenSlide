"use client";

import { useEffect, useRef, useCallback } from "react";
import type { EditorView } from "@codemirror/view";

interface CodeEditorProps {
  path: string;
  content: string;
  onChange: (path: string, newContent: string) => void;
  readOnly?: boolean;
}

function getLanguageExtension(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, () => Promise<unknown>> = {
    js: () => import("@codemirror/lang-javascript").then((m) => m.javascript()),
    jsx: () => import("@codemirror/lang-javascript").then((m) => m.javascript({ jsx: true })),
    ts: () => import("@codemirror/lang-javascript").then((m) => m.javascript({ typescript: true })),
    tsx: () => import("@codemirror/lang-javascript").then((m) => m.javascript({ jsx: true, typescript: true })),
    html: () => import("@codemirror/lang-html").then((m) => m.html()),
    css: () => import("@codemirror/lang-css").then((m) => m.css()),
    scss: () => import("@codemirror/lang-css").then((m) => m.css()),
    json: () => import("@codemirror/lang-json").then((m) => m.json()),
    md: () => import("@codemirror/lang-markdown").then((m) => m.markdown()),
    py: () => import("@codemirror/lang-python").then((m) => m.python()),
  };
  return map[ext] ?? null;
}

function isBinaryContent(s: string) {
  return s.includes('\0');
}

export function CodeEditor({ path, content, onChange, readOnly = false }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const pathRef = useRef(path);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initEditor = useCallback(async () => {
    if (!containerRef.current) return;
    if (isBinaryContent(content)) return;

    const [
      { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, crosshairCursor },
      { defaultKeymap, history, historyKeymap, indentWithTab },
      { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle },
      { closeBrackets, closeBracketsKeymap },
      { oneDark },
    ] = await Promise.all([
      import("@codemirror/view"),
      import("@codemirror/commands"),
      import("@codemirror/language"),
      import("@codemirror/autocomplete"),
      import("@codemirror/theme-one-dark"),
    ]);

    const langLoader = getLanguageExtension(path);
    const langExt = langLoader ? await langLoader() : null;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !readOnly) {
        onChangeRef.current(pathRef.current, update.state.doc.toString());
      }
    });

    const baseExtensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      crosshairCursor(),
      bracketMatching(),
      closeBrackets(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        indentWithTab,
      ]),
      oneDark,
      EditorView.theme({
        "&": { height: "100%", fontSize: "12px" },
        ".cm-scroller": { fontFamily: "var(--font-mono, 'Menlo', 'Monaco', monospace)", overflow: "auto" },
        ".cm-content": { padding: "8px 0" },
      }),
      updateListener,
    ];
    if (langExt) baseExtensions.push(langExt as never);
    if (readOnly) baseExtensions.push(EditorView.editable.of(false));

    const view = new EditorView({
      doc: content,
      extensions: baseExtensions,
      parent: containerRef.current,
    });

    viewRef.current = view;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount editor once
  useEffect(() => {
    initEditor();
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When path changes (user selects different file), rebuild the editor.
  // When content changes externally (agent edit), patch the doc in place.
  useEffect(() => {
    if (isBinaryContent(content)) {
      viewRef.current?.destroy();
      viewRef.current = null;
      return;
    }
    if (pathRef.current === path && viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
        });
      }
      return;
    }
    // Different path — destroy and recreate with new language
    pathRef.current = path;
    viewRef.current?.destroy();
    viewRef.current = null;
    initEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, content]);

  if (isBinaryContent(content)) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#282c34", color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "var(--font-mono, monospace)" }}>
        Binary file — cannot display
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden", background: "#282c34" }}
    />
  );
}
