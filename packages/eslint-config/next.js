/**
 * ESLint configuration for Next.js projects
 */
module.exports = {
  extends: [
    require.resolve('./index.js'),
    'next/core-web-vitals',
  ],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: process.cwd(),
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  rules: {
    // React
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Next.js
    '@next/next/no-html-link-for-pages': 'off',

    // Allow img element (Next Image is optional in some cases)
    '@next/next/no-img-element': 'warn',
  },
};
