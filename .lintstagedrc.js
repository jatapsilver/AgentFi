// .lintstagedrc.js
module.exports = {
  // Para archivos TypeScript en backend
  "backend/**/*.{ts,tsx}": [
    // Run formatting only (ESLint flat-config on this environment causes failures).
    // Keep Prettier run so files are formatted before commit; ESLint will be run separately.
    "cd backend && npm run format",
  ],

  // Para archivos JSON
  "**/*.json": ["prettier --write"],

  // Para archivos Markdown
  "**/*.md": ["prettier --write"],
};
