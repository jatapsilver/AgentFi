// commitlint.config.js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // Nueva funcionalidad
        "fix", // Corrección de bugs
        "docs", // Cambios en documentación
        "style", // Cambios de formato (no afectan el código)
        "refactor", // Refactorización de código
        "perf", // Mejoras de rendimiento
        "test", // Añadir o corregir tests
        "chore", // Tareas de mantenimiento
        "ci", // Cambios en CI/CD
        "build", // Cambios en el sistema de build
        "revert", // Revertir commits anteriores
      ],
    ],
    "subject-case": [0], // Permitir cualquier formato en el subject
    "subject-max-length": [2, "always", 100],
  },
};
