/**
 * ESLint configuration for NestJS projects
 */
module.exports = {
  extends: [require.resolve('./index.js')],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: process.cwd(),
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // NestJS specific
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Allow empty constructors for DI
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',

    // Allow parameter properties
    '@typescript-eslint/no-parameter-properties': 'off',
  },
};
