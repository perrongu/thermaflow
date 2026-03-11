'use strict';

const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // Global ignores
  {
    ignores: ['node_modules/**', 'vendor/**'],
  },

  // Base recommended rules for all JS files
  js.configs.recommended,

  // Prettier compatibility (disables style rules that conflict with prettier)
  prettierConfig,

  // Global language options — browser + node environments (mirrors old eslintrc env settings)
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Additional explicit globals for clarity
        structuredClone: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['warn', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'warn',
    },
  },

  // UI files — enforce no-undef with browser + app globals
  {
    files: ['js/ui/*.js'],
    rules: {
      'no-undef': 'error',
    },
    languageOptions: {
      globals: {
        I18n: 'readonly',
        UnitConverter: 'readonly',
        UIUtils: 'readonly',
        MaterialProperties: 'readonly',
        WaterProperties: 'readonly',
        AirProperties: 'readonly',
        PipeDiagram: 'readonly',
        PipeSpecsLoader: 'readonly',
        InputForm: 'readonly',
        CalculationManager: 'readonly',
        CalculationDetails: 'readonly',
        TemperatureChart: 'readonly',
        SensitivityAnalysis: 'readonly',
        SensitivityAnalysis1D: 'readonly',
        SensitivityMatrix: 'readonly',
        SensitivityHeatmapRenderer: 'readonly',
        SensitivityParams: 'readonly',
        VerdictRenderer: 'readonly',
        DisclaimerModal: 'readonly',
        InputValidation: 'readonly',
        InputUnits: 'readonly',
        CalcDetailTemplates: 'readonly',
        PipeNetwork: 'readonly',
        FreezeDetector: 'readonly',
        Storage: 'readonly',
        Export: 'readonly',
        displayConfigSummary: 'readonly',
        calculatePipeSegment: 'readonly',
        calculatePipeNetwork: 'readonly',
        detectFreeze: 'readonly',
        checkFreezeSimple: 'readonly',
        freezeMargin: 'readonly',
        requiresInsulation: 'readonly',
        generateFreezeMessage: 'readonly',
        findSegmentAtPosition: 'readonly',
        interpolateTemperature: 'readonly',
        renderMathInElement: 'readonly',
        Chart: 'readonly',
      },
    },
  },

  // Core calculation files — enforce no-undef
  {
    files: [
      'js/properties/*.js',
      'js/formulas/*.js',
      'js/correlations/*.js',
      'js/calculations/*.js',
      'js/engine/*.js',
      'js/constants/*.js',
    ],
    rules: {
      'no-undef': 'error',
    },
  },

  // Test and script files — relax console restriction, add Node.js globals
  {
    files: ['tests/**/*.js', 'scripts/**/*.js'],
    rules: {
      'no-console': 'off',
    },
    languageOptions: {
      globals: {
        global: 'readonly',
      },
    },
  },
];
