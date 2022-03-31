module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'no-unused-vars': 'off',
    'no-void': 'off',
    'class-methods-use-this': 'off',
    'no-inner-declarations': 'off',
    'consistent-return': 'off',
    'no-shadow': 'off',
    'no-useless-return': 'off',
    'max-len': 'off',
  },
};
