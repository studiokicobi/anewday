const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const sveltePlugin = require('eslint-plugin-svelte');
const svelteParser = require('svelte-eslint-parser');
const globals = require('globals');

module.exports = [
  {
    ignores: ['dist', '.lighthouseci', 'node_modules'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      'no-undef': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: {
          ts: tsParser,
        },
        extraFileExtensions: ['.svelte'],
      },
      globals: globals.browser,
    },
    plugins: {
      svelte: sveltePlugin,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    },
  },
];
