/**
 * test_phase2_app_split.js
 *
 * Phase 2 Item 7 — Split app.js into three focused files:
 *   - js/ui/verdict-renderer.js  (VerdictRenderer)
 *   - js/ui/disclaimer.js        (DisclaimerModal)
 *   - js/ui/app.js               (App orchestrator, under 500 LOC)
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * Run: node tests/test_phase2_app_split.js
 */

'use strict';

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

/**
 * Safely call fn() — if it throws (e.g. not a function), mark test as failed.
 * Returns true if fn ran without error, false if it threw.
 */
function safeRun(fn, failMessage) {
  try {
    fn();
    return true;
  } catch (e) {
    testsFailed++;
    testsTotal++;
    console.error(`  FAIL: ${failMessage} (threw: ${e.message})`);
    return false;
  }
}

function assertDeepEqual(actual, expected, message) {
  testsTotal++;
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    testsPassed++;
    console.log(`  PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`  FAIL: ${message}`);
    console.error(`    Expected: ${expectedStr}`);
    console.error(`    Actual:   ${actualStr}`);
  }
}

// ============================================================
// SETUP: Minimal browser environment for Node.js test
// ============================================================

if (typeof window === 'undefined') {
  global.window = {};
}

// Minimal DOM stubs (verdict-renderer operates on DOM elements it receives
// as arguments, so we only need stubs for functions that query the DOM)
const domStub = {
  style: {},
  classList: { add: () => {}, remove: () => {} },
  textContent: '',
  innerHTML: '',
};

// Minimal createElement stub for disclaimer DOM construction tests
function makeElement(tag) {
  return {
    tagName: tag.toUpperCase(),
    textContent: '',
    children: [],
    childNodes: [],
    appendChild(child) {
      this.children.push(child);
      this.childNodes.push(child);
    },
  };
}

global.document = {
  getElementById: () => domStub,
  querySelector: () => domStub,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (tag) => makeElement(tag),
  createTextNode: (text) => ({ nodeType: 3, textContent: text }),
};

// Stub sessionStorage for disclaimer tests
global.sessionStorage = {
  _store: {},
  getItem(key) {
    return this._store[key] !== undefined ? this._store[key] : null;
  },
  setItem(key, value) {
    this._store[key] = String(value);
  },
  removeItem(key) {
    delete this._store[key];
  },
};

// ============================================================
// ITEM 7a: VerdictRenderer module
// ============================================================

console.log('\n=== ITEM 7a: VerdictRenderer module ===\n');

// Test 1: verdict-renderer.js file loads without error
let verdictRendererLoaded = false;
try {
  require('../js/ui/verdict-renderer.js');
  verdictRendererLoaded = true;
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}
assert(verdictRendererLoaded, 'verdict-renderer.js loads without error');

// Test 2: window.VerdictRenderer is defined after loading
assert(
  typeof window.VerdictRenderer !== 'undefined',
  'window.VerdictRenderer is defined after loading verdict-renderer.js'
);

// Test 3: module.exports exports VerdictRenderer (dual export)
let VerdictRenderer = {};
try {
  VerdictRenderer = require('../js/ui/verdict-renderer.js') || {};
} catch (e) {
  /* will fail on function tests below */
}
assert(
  typeof VerdictRenderer !== 'undefined' && VerdictRenderer !== null,
  'module.exports returns a VerdictRenderer object (dual export)'
);

// Test 4: displayVerdict function exists and is callable
assert(
  typeof VerdictRenderer.displayVerdict === 'function',
  'VerdictRenderer.displayVerdict is a function'
);

// Test 5: displayDetailedResults function exists and is callable
assert(
  typeof VerdictRenderer.displayDetailedResults === 'function',
  'VerdictRenderer.displayDetailedResults is a function'
);

// Test 6: displayConfigSummary function exists and is callable
assert(
  typeof VerdictRenderer.displayConfigSummary === 'function',
  'VerdictRenderer.displayConfigSummary is a function'
);

// Test 7: displayErrorCard function exists and is callable
assert(
  typeof VerdictRenderer.displayErrorCard === 'function',
  'VerdictRenderer.displayErrorCard is a function'
);

// Test 8: showError function exists and is callable
assert(typeof VerdictRenderer.showError === 'function', 'VerdictRenderer.showError is a function');

// Test 9: window.VerdictRenderer exposes the same functions as module.exports
const winVR = window.VerdictRenderer || {};
assert(
  typeof winVR.displayVerdict === 'function',
  'window.VerdictRenderer.displayVerdict is a function'
);
assert(
  typeof winVR.displayDetailedResults === 'function',
  'window.VerdictRenderer.displayDetailedResults is a function'
);
assert(
  typeof winVR.displayConfigSummary === 'function',
  'window.VerdictRenderer.displayConfigSummary is a function'
);
assert(
  typeof winVR.displayErrorCard === 'function',
  'window.VerdictRenderer.displayErrorCard is a function'
);
assert(typeof winVR.showError === 'function', 'window.VerdictRenderer.showError is a function');

// ============================================================
// ITEM 7b: VerdictRenderer — displayErrorCard behaviour
// ============================================================

console.log('\n=== ITEM 7b: VerdictRenderer.displayErrorCard behaviour ===\n');

// Test 10: displayErrorCard accepts (errorMsg, suggestions) signature
{
  // Provide real DOM stubs with writable properties
  const card = { className: '', style: {} };
  const icon = { textContent: '', innerHTML: '' };
  const title = { textContent: '' };
  const message = { textContent: '', style: {} };

  // Override getElementById to return the right stub per element id
  const elements = {
    'verdict-card': card,
    'verdict-icon': icon,
    'verdict-title': title,
    'verdict-message': message,
  };
  global.document.getElementById = (id) => elements[id] || domStub;

  let noThrow = true;
  try {
    VerdictRenderer.displayErrorCard('Test error message', ['Suggestion 1', 'Suggestion 2']);
  } catch (e) {
    noThrow = false;
    console.error(`  Error in displayErrorCard: ${e.message}`);
  }
  assert(noThrow, 'displayErrorCard executes without error');
}

// Test 11: displayErrorCard sets verdict-card--error class
{
  const card = { className: '', style: {} };
  const icon = { textContent: '', innerHTML: '' };
  const title = { textContent: '' };
  const message = { textContent: '', style: {} };
  const elements = {
    'verdict-card': card,
    'verdict-icon': icon,
    'verdict-title': title,
    'verdict-message': message,
  };
  global.document.getElementById = (id) => elements[id] || domStub;

  safeRun(
    () => VerdictRenderer.displayErrorCard('Error occurred', []),
    'displayErrorCard executes for test 11'
  );
  assert(
    card.className.includes('verdict-card--error'),
    'displayErrorCard sets verdict-card--error CSS class on card'
  );
}

// Test 12: displayErrorCard sets error icon
{
  const card = { className: '', style: {} };
  const icon = { textContent: '', innerHTML: '' };
  const title = { textContent: '' };
  const message = { textContent: '', style: {} };
  const elements = {
    'verdict-card': card,
    'verdict-icon': icon,
    'verdict-title': title,
    'verdict-message': message,
  };
  global.document.getElementById = (id) => elements[id] || domStub;

  safeRun(
    () => VerdictRenderer.displayErrorCard('Error occurred', []),
    'displayErrorCard executes for test 12'
  );
  assert(
    icon.innerHTML.includes('status-icon--warning'),
    'displayErrorCard sets warning icon on verdict-icon'
  );
}

// Test 13: displayErrorCard includes errorMsg text in message
{
  const card = { className: '', style: {} };
  const icon = { textContent: '', innerHTML: '' };
  const title = { textContent: '' };
  const message = { textContent: '', style: {} };
  const elements = {
    'verdict-card': card,
    'verdict-icon': icon,
    'verdict-title': title,
    'verdict-message': message,
  };
  global.document.getElementById = (id) => elements[id] || domStub;

  safeRun(
    () => VerdictRenderer.displayErrorCard('UNIQUE_ERROR_XYZ', ['fix it']),
    'displayErrorCard executes for test 13'
  );
  assert(
    message.textContent.includes('UNIQUE_ERROR_XYZ'),
    'displayErrorCard includes errorMsg in message textContent'
  );
}

// Test 14: displayErrorCard includes suggestions in message
{
  const card = { className: '', style: {} };
  const icon = { textContent: '', innerHTML: '' };
  const title = { textContent: '' };
  const message = { textContent: '', style: {} };
  const elements = {
    'verdict-card': card,
    'verdict-icon': icon,
    'verdict-title': title,
    'verdict-message': message,
  };
  global.document.getElementById = (id) => elements[id] || domStub;

  safeRun(
    () => VerdictRenderer.displayErrorCard('Some error', ['suggestion_alpha', 'suggestion_beta']),
    'displayErrorCard executes for test 14'
  );
  assert(
    message.textContent.includes('suggestion_alpha'),
    'displayErrorCard includes first suggestion in message'
  );
  assert(
    message.textContent.includes('suggestion_beta'),
    'displayErrorCard includes second suggestion in message'
  );
}

// ============================================================
// ITEM 7c: VerdictRenderer — displayVerdict behaviour
// ============================================================

console.log('\n=== ITEM 7c: VerdictRenderer.displayVerdict behaviour ===\n');

// Helper: build fresh DOM stubs and patch getElementById
function buildVerdictDom() {
  const card = {
    className: 'verdict-card',
    classList: {
      add: (cls) => {
        card.className += ' ' + cls;
      },
      remove: () => {},
    },
    style: {},
  };
  const icon = { textContent: '', innerHTML: '' };
  const title = { textContent: '' };
  const message = { textContent: '', style: {} };

  const elements = {
    'verdict-card': card,
    'verdict-icon': icon,
    'verdict-title': title,
    'verdict-message': message,
  };
  global.document.getElementById = (id) => elements[id] || domStub;
  return { card, icon, title, message };
}

// Test 15: displayVerdict sets freeze class for GELÉ status
{
  const { card } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'GELÉ',
        distance_gel: 42.5,
        severity: 'critical',
        minTemp: 0,
        minTempPosition: 42.5,
        marginToFreeze: 0,
        marginToSafety: -5,
      }),
    'displayVerdict executes for test 15'
  );
  assert(
    card.className.includes('verdict-card--freeze'),
    'displayVerdict sets verdict-card--freeze for GELÉ status'
  );
}

// Test 16: displayVerdict sets freeze class for critical severity
{
  const { card } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'OK',
        severity: 'critical',
        minTemp: -1.5,
        minTempPosition: 80,
        freezePosition: 75,
        marginToFreeze: -1.5,
        marginToSafety: -6.5,
      }),
    'displayVerdict executes for test 16'
  );
  assert(
    card.className.includes('verdict-card--freeze'),
    'displayVerdict sets verdict-card--freeze for critical severity'
  );
}

// Test 17: displayVerdict sets warning class for warning severity
{
  const { card } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'OK',
        severity: 'warning',
        minTemp: 2.0,
        minTempPosition: 90,
        marginToFreeze: 2.0,
        marginToSafety: -3.0,
      }),
    'displayVerdict executes for test 17'
  );
  assert(
    card.className.includes('verdict-card--warning'),
    'displayVerdict sets verdict-card--warning for warning severity'
  );
}

// Test 18: displayVerdict sets no-freeze class for safe case
{
  const { card } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'OK',
        severity: 'ok',
        minTemp: 15.0,
        minTempPosition: 100,
        marginToFreeze: 15.0,
        marginToSafety: 10.0,
      }),
    'displayVerdict executes for test 18'
  );
  assert(
    card.className.includes('verdict-card--no-freeze'),
    'displayVerdict sets verdict-card--no-freeze for safe case'
  );
}

// Test 19: displayVerdict sets icon for GELÉ status
{
  const { icon } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'GELÉ',
        distance_gel: 10,
        severity: 'critical',
        minTemp: 0,
        minTempPosition: 10,
        marginToFreeze: 0,
        marginToSafety: -5,
      }),
    'displayVerdict executes for test 19'
  );
  assert(
    icon.innerHTML.includes('status-icon--freeze'),
    'displayVerdict sets freeze icon for GELÉ status'
  );
}

// Test 20: displayVerdict sets icon for critical severity
{
  const { icon } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'OK',
        severity: 'critical',
        minTemp: -1,
        minTempPosition: 80,
        freezePosition: 75,
        marginToFreeze: -1,
        marginToSafety: -6,
      }),
    'displayVerdict executes for test 20'
  );
  assert(
    icon.innerHTML.includes('status-icon--danger'),
    'displayVerdict sets danger icon for critical severity'
  );
}

// Test 21: displayVerdict sets icon for warning severity
{
  const { icon } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'OK',
        severity: 'warning',
        minTemp: 2,
        minTempPosition: 90,
        marginToFreeze: 2,
        marginToSafety: -3,
      }),
    'displayVerdict executes for test 21'
  );
  assert(
    icon.innerHTML.includes('status-icon--warning'),
    'displayVerdict sets warning icon for warning severity'
  );
}

// Test 22: displayVerdict sets icon for safe case
{
  const { icon } = buildVerdictDom();
  safeRun(
    () =>
      VerdictRenderer.displayVerdict({
        status: 'OK',
        severity: 'ok',
        minTemp: 20,
        minTempPosition: 100,
        marginToFreeze: 20,
        marginToSafety: 15,
      }),
    'displayVerdict executes for test 22'
  );
  assert(
    icon.innerHTML.includes('status-icon--safe'),
    'displayVerdict sets safe icon for safe case'
  );
}

// ============================================================
// ITEM 7d: DisclaimerModal module
// ============================================================

console.log('\n=== ITEM 7d: DisclaimerModal module ===\n');

// Reset getElementById to safe stub
global.document.getElementById = () => domStub;

// Test 23: disclaimer.js file loads without error
let disclaimerLoaded = false;
try {
  require('../js/ui/disclaimer.js');
  disclaimerLoaded = true;
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}
assert(disclaimerLoaded, 'disclaimer.js loads without error');

// Test 24: window.DisclaimerModal is defined after loading
assert(
  typeof window.DisclaimerModal !== 'undefined',
  'window.DisclaimerModal is defined after loading disclaimer.js'
);

// Test 25: module.exports returns a DisclaimerModal object (dual export)
let DisclaimerModal = {};
try {
  DisclaimerModal = require('../js/ui/disclaimer.js') || {};
} catch (e) {
  /* will fail on function tests below */
}
assert(
  typeof DisclaimerModal !== 'undefined' && DisclaimerModal !== null,
  'module.exports returns a DisclaimerModal object (dual export)'
);

// Test 26: checkDisclaimerAccepted function exists and is callable
assert(
  typeof DisclaimerModal.checkDisclaimerAccepted === 'function',
  'DisclaimerModal.checkDisclaimerAccepted is a function'
);

// Test 27: showDisclaimerModal function exists and is callable
assert(
  typeof DisclaimerModal.showDisclaimerModal === 'function',
  'DisclaimerModal.showDisclaimerModal is a function'
);

// Test 28: handleDisclaimerAccept function exists and is callable
assert(
  typeof DisclaimerModal.handleDisclaimerAccept === 'function',
  'DisclaimerModal.handleDisclaimerAccept is a function'
);

// Test 29: updateDisclaimerContent function exists and is callable
assert(
  typeof DisclaimerModal.updateDisclaimerContent === 'function',
  'DisclaimerModal.updateDisclaimerContent is a function'
);

// Test 30: setupFocusTrap function exists and is callable
assert(
  typeof DisclaimerModal.setupFocusTrap === 'function',
  'DisclaimerModal.setupFocusTrap is a function'
);

// Test 31: window.DisclaimerModal exposes same functions as module.exports
const winDM = window.DisclaimerModal || {};
assert(
  typeof winDM.checkDisclaimerAccepted === 'function',
  'window.DisclaimerModal.checkDisclaimerAccepted is a function'
);
assert(
  typeof winDM.showDisclaimerModal === 'function',
  'window.DisclaimerModal.showDisclaimerModal is a function'
);
assert(
  typeof winDM.handleDisclaimerAccept === 'function',
  'window.DisclaimerModal.handleDisclaimerAccept is a function'
);
assert(
  typeof winDM.updateDisclaimerContent === 'function',
  'window.DisclaimerModal.updateDisclaimerContent is a function'
);
assert(
  typeof winDM.setupFocusTrap === 'function',
  'window.DisclaimerModal.setupFocusTrap is a function'
);

// ============================================================
// ITEM 7e: DisclaimerModal — checkDisclaimerAccepted behaviour
// ============================================================

console.log('\n=== ITEM 7e: DisclaimerModal.checkDisclaimerAccepted behaviour ===\n');

// Test 32: returns false when sessionStorage has no entry
{
  sessionStorage.removeItem('thermaflow_disclaimer_accepted');
  let result = null;
  safeRun(() => {
    result = DisclaimerModal.checkDisclaimerAccepted();
  }, 'checkDisclaimerAccepted executes for test 32');
  assert(result === false, 'checkDisclaimerAccepted returns false when not yet accepted');
}

// Test 33: returns true when sessionStorage has 'true'
{
  sessionStorage.setItem('thermaflow_disclaimer_accepted', 'true');
  let result = null;
  safeRun(() => {
    result = DisclaimerModal.checkDisclaimerAccepted();
  }, 'checkDisclaimerAccepted executes for test 33');
  assert(result === true, 'checkDisclaimerAccepted returns true after acceptance');
  sessionStorage.removeItem('thermaflow_disclaimer_accepted');
}

// Test 34: returns false when sessionStorage has 'false'
{
  sessionStorage.setItem('thermaflow_disclaimer_accepted', 'false');
  let result = null;
  safeRun(() => {
    result = DisclaimerModal.checkDisclaimerAccepted();
  }, 'checkDisclaimerAccepted executes for test 34');
  assert(result === false, 'checkDisclaimerAccepted returns false when value is "false"');
  sessionStorage.removeItem('thermaflow_disclaimer_accepted');
}

// ============================================================
// ITEM 7f: DisclaimerModal — updateDisclaimerContent behaviour
// ============================================================

console.log('\n=== ITEM 7f: DisclaimerModal.updateDisclaimerContent behaviour ===\n');

// Helper: minimal content element stub that supports appendChild (used by DOM-based builder)
function makeContentStub() {
  return {
    textContent: '',
    children: [],
    appendChild(child) {
      this.children.push(child);
    },
  };
}

// Test 35: updateDisclaimerContent accepts (title, content, button) signature without throwing
{
  const title = { textContent: '' };
  const content = makeContentStub();
  const button = { textContent: '' };

  let noThrow = true;
  try {
    // No I18n: should use fallback strings
    delete global.window.I18n;
    DisclaimerModal.updateDisclaimerContent(title, content, button);
  } catch (e) {
    noThrow = false;
    console.error(`  Error: ${e.message}`);
  }
  assert(noThrow, 'updateDisclaimerContent executes without error (no I18n fallback)');
}

// Test 36: updateDisclaimerContent sets non-empty title.textContent (fallback)
{
  const title = { textContent: '' };
  const content = makeContentStub();
  const button = { textContent: '' };

  delete global.window.I18n;
  safeRun(
    () => DisclaimerModal.updateDisclaimerContent(title, content, button),
    'updateDisclaimerContent executes for test 36'
  );
  assert(
    typeof title.textContent === 'string' && title.textContent.length > 0,
    'updateDisclaimerContent sets non-empty title (fallback)'
  );
}

// Test 37: updateDisclaimerContent appends paragraph elements to content (fallback)
{
  const title = { textContent: '' };
  const content = makeContentStub();
  const button = { textContent: '' };

  delete global.window.I18n;
  safeRun(
    () => DisclaimerModal.updateDisclaimerContent(title, content, button),
    'updateDisclaimerContent executes for test 37'
  );
  assert(
    content.children.length > 0,
    'updateDisclaimerContent appends paragraph elements to content (fallback)'
  );
}

// Test 38: updateDisclaimerContent uses I18n when available
{
  const title = { textContent: '' };
  const content = makeContentStub();
  const button = { textContent: '' };

  // Return structured paragraph data for the paragraphs key; plain strings for others
  global.window.I18n = {
    t: (key) => {
      if (key === 'disclaimer.paragraphs') {
        return [[{ text: 'Test paragraph.' }]];
      }
      return `[${key}]`;
    },
  };
  safeRun(
    () => DisclaimerModal.updateDisclaimerContent(title, content, button),
    'updateDisclaimerContent executes for test 38'
  );
  assert(
    title.textContent === '[disclaimer.title]',
    'updateDisclaimerContent uses I18n.t for title when I18n is available'
  );
  assert(
    content.children.length > 0,
    'updateDisclaimerContent uses I18n.t for content when I18n is available'
  );
  assert(
    button.textContent === '[disclaimer.accept]',
    'updateDisclaimerContent uses I18n.t for button when I18n is available'
  );
  delete global.window.I18n;
}

// ============================================================
// ITEM 7g: File size constraints (under 500 LOC each)
// ============================================================

console.log('\n=== ITEM 7g: File size constraints ===\n');

const fs = require('fs');
const path = require('path');

// Test 39: verdict-renderer.js is under 500 LOC
{
  const filePath = path.join(__dirname, '../js/ui/verdict-renderer.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // File does not exist yet — will fail
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `verdict-renderer.js is under 500 LOC (actual: ${lineCount})`
  );
}

// Test 40: disclaimer.js is under 500 LOC
{
  const filePath = path.join(__dirname, '../js/ui/disclaimer.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // File does not exist yet — will fail
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `disclaimer.js is under 500 LOC (actual: ${lineCount})`
  );
}

// Test 41: app.js is under 500 LOC after extraction
{
  const filePath = path.join(__dirname, '../js/ui/app.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // Should exist
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `app.js is under 500 LOC after extraction (actual: ${lineCount})`
  );
}

// ============================================================
// ITEM 7h: index.html script loading order
// ============================================================

console.log('\n=== ITEM 7h: index.html script loading order ===\n');

const indexHtmlPath = path.join(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Test 42: verdict-renderer.js script tag exists in index.html
assert(
  indexHtml.includes('verdict-renderer.js'),
  'index.html contains <script src="...verdict-renderer.js">'
);

// Test 43: disclaimer.js script tag exists in index.html
assert(
  indexHtml.includes('disclaimer.js') && !indexHtml.includes('disclaimer.js">') === false,
  'index.html contains <script src="...disclaimer.js">'
);

// Test 44: verdict-renderer.js loads before app.js in index.html
{
  const verdictPos = indexHtml.indexOf('verdict-renderer.js');
  const appPos = indexHtml.indexOf('app.js');
  assert(
    verdictPos !== -1 && appPos !== -1 && verdictPos < appPos,
    'verdict-renderer.js script tag appears before app.js in index.html'
  );
}

// Test 45: disclaimer.js loads before app.js in index.html
{
  const disclaimerPos = indexHtml.indexOf('disclaimer.js');
  const appPos = indexHtml.indexOf('app.js');
  assert(
    disclaimerPos !== -1 && appPos !== -1 && disclaimerPos < appPos,
    'disclaimer.js script tag appears before app.js in index.html'
  );
}

// ============================================================
// ITEM 7i: Non-regression — app.js still loads
// ============================================================

console.log('\n=== ITEM 7i: Non-regression ===\n');

// Test 46: app.js still loads without error
{
  // We need stubs for all globals that app.js references at parse/IIFE time
  global.window.Thresholds = { MARGE_SURETE_GEL: 5 };
  global.window.CalculationManager = {
    States: {
      PENDING: 'PENDING',
      CALCULATING: 'CALCULATING',
      COMPLETE: 'COMPLETE',
      ERROR: 'ERROR',
      IDLE: 'IDLE',
    },
    init: () => {},
    requestRecalculation: () => {},
  };

  let appLoaded = false;
  try {
    require('../js/ui/app.js');
    appLoaded = true;
  } catch (e) {
    console.error(`  Load error: ${e.message}`);
  }
  assert(appLoaded, 'app.js still loads without error after extraction');
}

// ============================================================
// SUMMARY
// ============================================================

console.log('\n=== SUMMARY ===\n');
console.log(`Total:  ${testsTotal}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
  console.log('\nSome tests FAILED — implementation needed.');
  process.exit(1);
} else {
  console.log('\nAll tests PASSED.');
  process.exit(0);
}
