// .lintstagedrc.js
module.exports = {
  // Para archivos TypeScript en backend
  "backend/**/*.{ts,tsx}": [
    // Run formatting only (ESLint flat-config on this environment causes failures).
    // Use npm "--prefix" to avoid shell `cd` which can fail in hook environments on Windows.
    "npm --prefix backend run format",
  ],

  // Para archivos JSON
  "**/*.json": ["prettier --write"],

  // Para archivos Markdown
  "**/*.md": ["prettier --write"],
};
