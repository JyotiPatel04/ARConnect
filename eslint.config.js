import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // functions/ and functions-match/ are separate Node.js (Cloud Functions)
  // packages, each with its own runtime globals (process, etc.) and its
  // own verification (node --test) — neither is part of the
  // browser-targeted React app this config is written for.
  globalIgnores(['dist', 'functions', 'functions-match']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Config files and the test suites run under Node, not the browser --
  // they need `process`/`__dirname`-style globals, not window/document.
  {
    files: ['*.config.js', 'tests/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
