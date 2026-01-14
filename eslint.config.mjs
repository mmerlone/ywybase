import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    languageOptions: {
      globals: {
        JSX: 'readonly',
        React: 'readonly',
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // Catch unused imports and variables - this helps catch removed imports
      '@typescript-eslint/no-unused-vars': 'error',
      // Catch variables used before declaration
      '@typescript-eslint/no-use-before-define': 'error',
      // Require explicit return types for functions
      '@typescript-eslint/explicit-function-return-type': 'error',
      // Disallow usage of the any type
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.mjs'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
])

export default eslintConfig
