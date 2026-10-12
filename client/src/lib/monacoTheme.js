/* Monaco theme for the Technical Excellence System.
   Editor sits on surface-container-low; the line-number gutter is demarcated
   in the level-2 surface colour, per the design system's editor spec.
   Syntax colours reuse the semantic accents so the editor reads as part of
   the same system rather than as an embedded widget. */

export const MONACO_THEME = 'codearena-dark'

export const monacoThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '',                  foreground: 'e1e2eb' },
    { token: 'comment',           foreground: '8c909f', fontStyle: 'italic' },
    { token: 'keyword',           foreground: 'ffb786' },
    { token: 'keyword.control',   foreground: 'ffb786' },
    { token: 'string',            foreground: 'd8e2ff' },
    { token: 'number',            foreground: 'c0c1ff' },
    { token: 'type',              foreground: 'adc6ff' },
    { token: 'type.identifier',   foreground: 'adc6ff' },
    { token: 'identifier',        foreground: 'e1e2eb' },
    { token: 'function',          foreground: 'c0c1ff' },
    { token: 'variable',          foreground: 'e1e2eb' },
    { token: 'variable.predefined', foreground: 'adc6ff' },
    { token: 'constant',          foreground: 'c0c1ff' },
    { token: 'operator',          foreground: 'c2c6d6' },
    { token: 'delimiter',         foreground: 'c2c6d6' },
    { token: 'tag',               foreground: 'adc6ff' },
    { token: 'attribute.name',    foreground: 'ffb786' },
    { token: 'invalid',           foreground: 'ffb4ab' },
  ],
  colors: {
    'editor.background':                   '#191c22',
    'editor.foreground':                   '#e1e2eb',
    'editorLineNumber.foreground':         '#424754',
    'editorLineNumber.activeForeground':   '#adc6ff',
    'editorGutter.background':             '#191c22',
    'editorCursor.foreground':             '#adc6ff',
    'editor.lineHighlightBackground':      '#1d2026',
    'editor.lineHighlightBorder':          '#00000000',
    'editor.selectionBackground':          '#004395',
    'editor.inactiveSelectionBackground':  '#272a31',
    'editor.selectionHighlightBackground': '#272a3180',
    'editorIndentGuide.background':        '#272a31',
    'editorIndentGuide.activeBackground':  '#424754',
    'editorWhitespace.foreground':         '#272a31',
    'editorWidget.background':             '#272a31',
    'editorWidget.border':                 '#424754',
    'editorSuggestWidget.background':      '#272a31',
    'editorSuggestWidget.border':          '#424754',
    'editorSuggestWidget.selectedBackground': '#32353c',
    'editorHoverWidget.background':        '#272a31',
    'editorHoverWidget.border':            '#424754',
    'editorBracketMatch.background':       '#00000000',
    'editorBracketMatch.border':           '#adc6ff',
    'scrollbarSlider.background':          '#42475480',
    'scrollbarSlider.hoverBackground':     '#424754cc',
    'scrollbarSlider.activeBackground':    '#8c909f',
    'editorError.foreground':              '#ffb4ab',
    'editorWarning.foreground':            '#ffb786',
  },
}

/* Shared editor options: 14px/22px JetBrains Mono, matching `code-md`. */
export const monacoOptions = {
  fontSize: 14,
  lineHeight: 22,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  padding: { top: 16, bottom: 16 },
  lineNumbers: 'on',
  lineNumbersMinChars: 3,
  glyphMargin: false,
  renderLineHighlight: 'line',
  tabSize: 4,
  automaticLayout: true,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontLigatures: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  contextmenu: true,
  wordWrap: 'off',
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
}

/* Pass as Monaco's `beforeMount` so the theme exists before first paint. */
export function registerMonacoTheme(monaco) {
  monaco.editor.defineTheme(MONACO_THEME, monacoThemeData)
}
