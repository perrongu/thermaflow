/**
 * test_phase5_infra.js
 *
 * Phase 5 infrastructure tests — TDD (RED -> GREEN -> REFACTOR)
 *
 * Item 12: KaTeX CDN fallback (local vendor copy + onerror attributes)
 * Item 13: ESLint 8.x -> 9.x migration (flat config format)
 *
 * Run: node tests/test_phase5_infra.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// Item 12 — KaTeX local vendor files
// ---------------------------------------------------------------------------

console.log('\n=== Item 12: KaTeX local vendor files ===\n');

assert(fileExists('vendor/katex'), 'vendor/katex/ directory exists');

assert(fileExists('vendor/katex/katex.min.js'), 'vendor/katex/katex.min.js exists');

assert(fileExists('vendor/katex/katex.min.css'), 'vendor/katex/katex.min.css exists');

assert(
  fileExists('vendor/katex/contrib/auto-render.min.js'),
  'vendor/katex/contrib/auto-render.min.js exists'
);

assert(fileExists('vendor/katex/fonts'), 'vendor/katex/fonts/ directory exists');

// ---------------------------------------------------------------------------
// Item 12 — index.html onerror fallback attributes
// ---------------------------------------------------------------------------

console.log('\n=== Item 12: index.html CDN onerror fallbacks ===\n');

const html = readFile('index.html');

assert(
  html.includes('onerror') && html.includes('vendor/katex/katex.min.js'),
  'index.html katex.min.js script tag has onerror fallback pointing to vendor/'
);

assert(
  html.includes('onerror') && html.includes('vendor/katex/contrib/auto-render.min.js'),
  'index.html auto-render.min.js script tag has onerror fallback pointing to vendor/'
);

assert(
  html.includes('vendor/katex/katex.min.css'),
  'index.html KaTeX CSS link tag references vendor/ fallback path'
);

// Verify the CDN URLs are still present (not replaced, just augmented)
assert(
  html.includes('cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'),
  'index.html still loads katex.min.js from CDN as primary source'
);

assert(
  html.includes('cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'),
  'index.html still loads auto-render.min.js from CDN as primary source'
);

assert(
  html.includes('cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'),
  'index.html still loads katex.min.css from CDN as primary source'
);

// ---------------------------------------------------------------------------
// Item 13 — ESLint 9.x flat config
// ---------------------------------------------------------------------------

console.log('\n=== Item 13: ESLint 9.x flat config ===\n');

assert(fileExists('eslint.config.js'), 'eslint.config.js (flat config) exists');

assert(
  !fileExists('.eslintrc.json') &&
    !fileExists('.eslintrc.js') &&
    !fileExists('.eslintrc.yml') &&
    !fileExists('.eslintrc.yaml') &&
    !fileExists('.eslintrc'),
  'No legacy .eslintrc* files remain'
);

const pkgRaw = readFile('package.json');
const pkg = JSON.parse(pkgRaw);

const eslintVersion = pkg.devDependencies && pkg.devDependencies.eslint;
assert(
  eslintVersion && eslintVersion.startsWith('^9'),
  `package.json devDependencies.eslint is ^9.x (found: ${eslintVersion})`
);

const eslintJsVersion = pkg.devDependencies && pkg.devDependencies['@eslint/js'];
assert(
  eslintJsVersion && eslintJsVersion.startsWith('^9'),
  `package.json devDependencies.@eslint/js is ^9.x (found: ${eslintJsVersion})`
);

const eslintConfigExists = fileExists('eslint.config.js');
assert(eslintConfigExists, 'eslint.config.js content is readable');

if (eslintConfigExists) {
  const eslintConfig = readFile('eslint.config.js');
  assert(eslintConfig.includes('@eslint/js'), 'eslint.config.js imports @eslint/js');

  assert(
    eslintConfig.includes('eslint-config-prettier'),
    'eslint.config.js includes prettier config'
  );

  assert(
    eslintConfig.includes('ecmaVersion'),
    'eslint.config.js sets ecmaVersion in languageOptions'
  );

  assert(
    eslintConfig.includes("sourceType: 'script'") || eslintConfig.includes('sourceType: "script"'),
    'eslint.config.js sets sourceType to script'
  );
} else {
  // Count the 4 skipped sub-tests as failures
  assert(false, 'eslint.config.js imports @eslint/js (skipped: file missing)');
  assert(false, 'eslint.config.js includes prettier config (skipped: file missing)');
  assert(false, 'eslint.config.js sets ecmaVersion in languageOptions (skipped: file missing)');
  assert(false, 'eslint.config.js sets sourceType to script (skipped: file missing)');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n=== Results: ${testsPassed}/${testsTotal} passed ===`);
if (testsFailed > 0) {
  console.error(`${testsFailed} test(s) FAILED`);
  process.exit(1);
} else {
  console.log('All tests passed.');
  process.exit(0);
}
