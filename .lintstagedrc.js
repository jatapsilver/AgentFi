// .lintstagedrc.js
module.exports = {
  // Para archivos TypeScript en backend
  "backend/**/*.{ts,tsx}": [
    "cd backend && npm run lint --fix",
    "cd backend && npm run format",
  ],

  // Para archivos JSON
  "**/*.json": ["prettier --write"],

  // Para archivos Markdown
  "**/*.md": ["prettier --write"],
};
