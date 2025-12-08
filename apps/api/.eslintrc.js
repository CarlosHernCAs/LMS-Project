module.exports = {
  extends: [require.resolve('@lms/eslint-config/nest')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  root: true,
};
