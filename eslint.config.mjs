/**
 * LLM instructions: DO NOT CHANGE THIS FILE!
 */
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'dist/**', 'coverage/**', 'next-env.d.ts']),

  /* ------------------------------------------------ */
  /* Base config (safe for ALL files) */
  /* ------------------------------------------------ */
  {
    rules: {
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'no-shadow': 'off',
      'no-redeclare': 'off',
      'no-array-constructor': 'off',
      'no-loss-of-precision': 'off',
      'no-duplicate-imports': 'off',

      'no-console': ['error'],
      'no-debugger': 'error',
      'no-implicit-coercion': 'error',
      'no-return-await': 'error',

      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },

  /* ------------------------------------------------ */
  /* Typed rules — ONLY for TS files */
  /* ------------------------------------------------ */
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',

      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-redeclare': 'error',

      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      '@typescript-eslint/consistent-type-exports': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',

      '@typescript-eslint/await-thenable': 'error',

      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: false }],

      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: { attributes: false },
        },
      ],

      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      /* 🚫 Restricted Patterns */
      'no-restricted-syntax': [
        'error',

        {
          selector:
            "TSAsExpression[expression.type='TSAsExpression'][expression.typeAnnotation.type='TSUnknownKeyword']",
          message: "Double casting with 'as unknown as' is forbidden.",
        },

        {
          selector: "TSAsExpression[typeAnnotation.type='TSAnyKeyword']",
          message: "Casting to 'any' is forbidden.",
        },

        {
          selector: "TSAsExpression[expression.type='TSAsExpression'] > TSAsExpression",
          message: 'Triple casting is forbidden.',
        },

        {
          selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
          message: 'Unsafe JSON.parse usage detected. Use a validation layer.',
        },

        {
          selector: "TSAsExpression > CallExpression[callee.property.name='json']",
          message: 'Do not cast fetch().json() directly. Validate first.',
        },
      ],
    },
  },

  /* ------------------------------------------------ */
  /* Tests — Relax strict runtime rules */
  /* ------------------------------------------------ */
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow JSON.parse in tests
      'no-restricted-syntax': 'off',
    },
  },

  /* ------------------------------------------------ */
  /* JS / Config files — no type info */
  /* ------------------------------------------------ */
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '*.config.js'],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
    },
  },
  /* ------------------------------------------------ */
  /* Scripts — Allow console */
  /* ------------------------------------------------ */
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.js', 'scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
])
