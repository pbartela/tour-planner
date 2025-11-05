module.exports = {
  // Locale codes to generate
  locales: ["en-US", "pl-PL"],

  // Default locale (used as reference)
  defaultValue: "__NOT_TRANSLATED__",

  // Output directory for translation files
  output: "public/locales/$LOCALE/$NAMESPACE.json",

  // Input paths - where to look for translation keys
  input: ["src/**/*.{js,jsx,ts,tsx,astro}"],

  // Keep the structure and sorting of keys
  sort: true,
  createOldCatalogs: false,
  keepRemoved: false,

  // Default namespace (if no namespace is specified)
  defaultNamespace: "common",

  // Separators
  useKeySeparator: true,
  keySeparator: ".",
  namespaceSeparator: ":",
  contextSeparator: "_",
  pluralSeparator: "_",

  // Indentation for JSON files
  indentation: 2,

  // Line ending
  lineEnding: "auto",

  // Fail on warnings
  failOnWarnings: false,
  failOnUpdate: false,

  // Functions to look for when extracting keys
  lexers: {
    js: ["JsxLexer"],
    jsx: ["JsxLexer"],
    ts: ["JsxLexer"],
    tsx: ["JsxLexer"],
    astro: ["JsxLexer"],
  },

  // i18next options
  i18nextOptions: {
    compatibilityJSON: "v3",
  },
};
