const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierPlugin = require('eslint-plugin-prettier');

/**
 * Flat ESLint config for the backend to replace legacy `.eslintrc.js` behaviour.
 * This enables ESLint v9+ to work with the existing plugin/rules setup.
 */
module.exports = [
  // Ignore the legacy config file so it doesn't conflict
  { ignores: ['.eslintrc.js'] },

  {
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      'prettier': prettierPlugin,
    },

    rules: {
      // Include recommended rules from the TypeScript plugin
      ...(tsPlugin && tsPlugin.configs && tsPlugin.configs.recommended
        ? tsPlugin.configs.recommended.rules
        : {}),

      // Project-specific rule overrides from the original .eslintrc.js
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // Enforce Prettier formatting as ESLint rule
      'prettier/prettier': 'error',
    },
  },
];
