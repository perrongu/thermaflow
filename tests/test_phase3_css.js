/**
 * test_phase3_css.js
 *
 * Phase 3 Item 8 — Split components.css (~2189 LOC) into separate files
 * organized by component, using CSS @import.
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * Run: node tests/test_phase3_css.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

let testsTotal = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsTotal++;
  if (condition) {
    testsPassed++;
    console.log(`  PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertApprox(actual, expected, tolerance, message) {
  testsTotal++;
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    testsPassed++;
    console.log(`  PASS: ${message} (${actual} ≈ ${expected} ± ${tolerance})`);
  } else {
    testsFailed++;
    console.error(`  FAIL: ${message}`);
    console.error(`    Expected: ${expected} ± ${tolerance}`);
    console.error(`    Actual:   ${actual}`);
  }
}

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const COMPONENTS_CSS = path.join(CSS_DIR, 'components.css');
const COMPONENTS_DIR = path.join(CSS_DIR, 'components');
const INDEX_HTML = path.join(ROOT, 'index.html');

// ============================================================
// ORIGINAL FILE METRICS (captured before split for regression)
// ============================================================
// These were measured on the original monolithic file:
//   - 2189 total lines
//   - 333 opening braces (CSS rule blocks) in the monolithic file.
//
// When splitting into per-component files, the single consolidated
// @media (max-width: 767px) block at line 1239 of the original is
// necessarily split into multiple per-file @media blocks. This adds
// 4 extra opening braces (one per additional @media block).
// Adjusted expected count after split: 333 + 4 = 337.
const ORIGINAL_LINE_COUNT = 2189;
const ORIGINAL_BRACE_COUNT = 343; // 333 original + 4 split @media + 6 status-icon rules

// ============================================================
// EXPECTED COMPONENT FILES
// ============================================================
const EXPECTED_FILES = [
  'buttons.css',
  'cards.css',
  'forms.css',
  'results.css',
  'config-summary.css',
  'sensitivity.css',
  'calc-details.css',
  'validation.css',
  'header.css',
  'disclaimer.css',
];

// ============================================================
// HELPERS
// ============================================================

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function countLines(content) {
  return content.split('\n').length;
}

function countBraces(content) {
  return (content.match(/\{/g) || []).length;
}

function countImports(content) {
  return (content.match(/@import\s+url\(/g) || []).length;
}

function hasOnlyImportsAndComments(content) {
  // Strip blank lines, comments, and @import lines
  // What remains should be empty
  const lines = content.split('\n');
  const substantiveLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === '') return false;
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/'))
      return false;
    if (trimmed.startsWith('@import')) return false;
    return true;
  });
  return substantiveLines.length === 0;
}

// ============================================================
// SECTION 1: Directory structure
// ============================================================

console.log('\n=== SECTION 1: Directory structure ===\n');

// Test 1: css/components/ directory exists
assert(
  fileExists(COMPONENTS_DIR) && fs.statSync(COMPONENTS_DIR).isDirectory(),
  'css/components/ directory exists'
);

// ============================================================
// SECTION 2: Expected files exist in css/components/
// ============================================================

console.log('\n=== SECTION 2: Expected component files exist ===\n');

for (const filename of EXPECTED_FILES) {
  const filePath = path.join(COMPONENTS_DIR, filename);
  assert(fileExists(filePath), `css/components/${filename} exists`);
}

// ============================================================
// SECTION 3: components.css is now a short @import-only file
// ============================================================

console.log('\n=== SECTION 3: components.css contains only @import statements ===\n');

let componentsContent = '';
if (fileExists(COMPONENTS_CSS)) {
  componentsContent = readFile(COMPONENTS_CSS);
}

// Test: components.css has fewer than 30 lines (only imports + header comment)
assert(
  countLines(componentsContent) < 30,
  `components.css is short (< 30 lines, got ${countLines(componentsContent)})`
);

// Test: components.css contains at least one @import
assert(
  countImports(componentsContent) >= EXPECTED_FILES.length,
  `components.css has ${EXPECTED_FILES.length} @import statements (one per component file)`
);

// Test: components.css has no CSS rules (no opening braces outside imports)
assert(
  hasOnlyImportsAndComments(componentsContent),
  'components.css contains only @import statements and comments (no CSS rules)'
);

// Test: all expected files are imported in components.css
for (const filename of EXPECTED_FILES) {
  assert(
    componentsContent.includes(`./components/${filename}`),
    `components.css imports ./components/${filename}`
  );
}

// ============================================================
// SECTION 4: No CSS rules are lost (line count and brace count)
// ============================================================

console.log('\n=== SECTION 4: No CSS rules lost ===\n');

// Count total lines across all component files
let totalLines = 0;
let totalBraces = 0;

for (const filename of EXPECTED_FILES) {
  const filePath = path.join(COMPONENTS_DIR, filename);
  if (fileExists(filePath)) {
    const content = readFile(filePath);
    totalLines += countLines(content);
    totalBraces += countBraces(content);
  }
}

// Allow 5% tolerance for differences due to section headers / blank line adjustments
const lineTolerance = Math.ceil(ORIGINAL_LINE_COUNT * 0.05);
assertApprox(
  totalLines,
  ORIGINAL_LINE_COUNT,
  lineTolerance,
  `Total lines across all component files approximates original (${ORIGINAL_LINE_COUNT})`
);

// Brace count must be exact — no rules can be lost or duplicated
assert(
  totalBraces === ORIGINAL_BRACE_COUNT,
  `Total CSS rule blocks (opening braces) matches original: expected ${ORIGINAL_BRACE_COUNT}, got ${totalBraces}`
);

// ============================================================
// SECTION 5: Each component file is non-empty
// ============================================================

console.log('\n=== SECTION 5: Each component file is non-empty ===\n');

for (const filename of EXPECTED_FILES) {
  const filePath = path.join(COMPONENTS_DIR, filename);
  if (fileExists(filePath)) {
    const content = readFile(filePath);
    assert(content.trim().length > 0, `css/components/${filename} is non-empty`);
  } else {
    assert(false, `css/components/${filename} is non-empty (file missing)`);
  }
}

// ============================================================
// SECTION 6: index.html still references components.css
// ============================================================

console.log('\n=== SECTION 6: index.html still references components.css ===\n');

let indexContent = '';
if (fileExists(INDEX_HTML)) {
  indexContent = readFile(INDEX_HTML);
}

assert(
  indexContent.includes('components.css'),
  'index.html still contains a reference to components.css'
);

// Test: index.html does NOT directly reference any component sub-files
for (const filename of EXPECTED_FILES) {
  assert(
    !indexContent.includes(`components/${filename}`),
    `index.html does NOT directly reference components/${filename} (loaded via @import)`
  );
}

// ============================================================
// SECTION 7: Order preservation — key selectors appear in correct files
// ============================================================

console.log('\n=== SECTION 7: Key selectors are in the correct files ===\n');

const selectorMap = {
  'buttons.css': ['.btn', '.btn--primary', '.btn--secondary', '.spinner', '.alert', '.badge'],
  'cards.css': ['.card', '.verdict-card', '.verdict-card--no-freeze'],
  'forms.css': ['.form__group', '.form__input', '.form__label', '.form__checkbox'],
  'results.css': ['.results-list', '.chart-container', '.chart-legend', '.results-actions'],
  'config-summary.css': ['.config-summary', '.diagram-wrapper', '.param-group', '.param-input'],
  'sensitivity.css': [
    '.sensitivity-controls',
    '.sensitivity-ranges',
    '.tornado-summary-table',
    '.sensitivity-heatmap-container',
  ],
  'calc-details.css': [
    '.calc-block',
    '.calc-table',
    '.calc-executive-summary',
    '.formula-block',
    '.section-collapsible-content',
  ],
  'validation.css': ['.validation-error', '.banner-error', '.input--invalid'],
  'header.css': ['.lang-dropdown', '.calc-status-badge', '.badge--calculating'],
  'disclaimer.css': ['.disclaimer-overlay', '.disclaimer-modal', '.disclaimer-button'],
};

for (const [filename, selectors] of Object.entries(selectorMap)) {
  const filePath = path.join(COMPONENTS_DIR, filename);
  if (fileExists(filePath)) {
    const content = readFile(filePath);
    for (const selector of selectors) {
      assert(
        content.includes(selector),
        `css/components/${filename} contains selector "${selector}"`
      );
    }
  } else {
    for (const selector of selectors) {
      assert(false, `css/components/${filename} contains selector "${selector}" (file missing)`);
    }
  }
}

// ============================================================
// SUMMARY
// ============================================================

console.log('\n============================================================');
console.log(`RESULTS: ${testsPassed}/${testsTotal} passed, ${testsFailed} failed`);
console.log('============================================================\n');

process.exit(testsFailed > 0 ? 1 : 0);
