module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de bug
        'docs',     // Documentación
        'style',    // Formato (no afecta código)
        'refactor', // Refactorización
        'perf',     // Mejora de rendimiento
        'test',     // Tests
        'chore',    // Tareas de mantenimiento
        'revert',   // Revertir cambios
        'ci',       // CI/CD
        'build',    // Build system
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
