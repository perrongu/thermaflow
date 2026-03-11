/**
 * test_phase4_cleanup.js
 *
 * Phase 4 architecture cleanup tests — TDD (RED → GREEN → REFACTOR)
 *
 * Item 11: deepCopy() utility in UIUtils
 * Item 10: resolveModule() helper in pipe-segment.js
 * Item 15: t_insul i18n label in sensitivity-params.js
 *
 * Run: node tests/test_phase4_cleanup.js
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

function assertThrows(fn, message) {
  testsTotal++;
  try {
    fn();
    testsFailed++;
    console.error(`  FAIL: ${message} (no error thrown)`);
  } catch (e) {
    testsPassed++;
    console.log(`  PASS: ${message}`);
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
// ITEM 11: deepCopy() in UIUtils
// ============================================================

console.log('\n=== ITEM 11: UIUtils.deepCopy() ===\n');

// Simulate browser environment for Node.js test compatibility
if (typeof window === 'undefined') {
  global.window = {};
}

// Load the module
require('../js/ui/utils.js');

const UIUtils = window.UIUtils;

// Test 1: UIUtils.deepCopy exists
assert(typeof UIUtils !== 'undefined', 'UIUtils is defined after loading utils.js');
assert(typeof UIUtils.deepCopy === 'function', 'UIUtils.deepCopy is a function');

// Test 2: module.exports includes deepCopy (Node.js dual export)
const utils = require('../js/ui/utils.js');
assert(typeof utils.deepCopy === 'function', 'module.exports.deepCopy is a function');

// Test 3: deepCopy returns a new object (not same reference)
{
  const original = { a: 1, b: { c: 2 } };
  const copy = UIUtils.deepCopy(original);
  assert(copy !== original, 'deepCopy returns a new object reference');
}

// Test 4: deepCopy produces structurally equal object
{
  const original = { x: 10, y: { z: [1, 2, 3] } };
  const copy = UIUtils.deepCopy(original);
  assertDeepEqual(copy, original, 'deepCopy produces structurally equal object');
}

// Test 5: mutations on copy do not affect original (deep isolation)
{
  const original = { a: 1, nested: { b: 2 } };
  const copy = UIUtils.deepCopy(original);
  copy.nested.b = 99;
  assert(original.nested.b === 2, 'mutating copy does not affect original (deep isolation)');
}

// Test 6: mutations on original do not affect copy
{
  const original = { a: 1, nested: { b: 2 } };
  const copy = UIUtils.deepCopy(original);
  original.nested.b = 99;
  assert(copy.nested.b === 2, 'mutating original does not affect copy (deep isolation)');
}

// Test 7: handles arrays
{
  const original = [1, 2, { three: 3 }];
  const copy = UIUtils.deepCopy(original);
  assert(Array.isArray(copy), 'deepCopy handles arrays');
  assert(copy !== original, 'deepCopy of array returns new reference');
  copy[2].three = 99;
  assert(original[2].three === 3, 'array element mutations are isolated');
}

// Test 8: handles null
{
  const result = UIUtils.deepCopy(null);
  assert(result === null, 'deepCopy(null) returns null');
}

// Test 9: handles primitive values
{
  assert(UIUtils.deepCopy(42) === 42, 'deepCopy(42) returns 42');
  assert(UIUtils.deepCopy('hello') === 'hello', 'deepCopy("hello") returns "hello"');
  assert(UIUtils.deepCopy(true) === true, 'deepCopy(true) returns true');
}

// Test 10: handles empty object
{
  const result = UIUtils.deepCopy({});
  assertDeepEqual(result, {}, 'deepCopy({}) returns empty object');
}

// Test 11: handles deeply nested objects (typical config shape)
{
  const config = {
    totalLength: 100,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };
  const copy = UIUtils.deepCopy(config);
  assert(copy !== config, 'deepCopy of config returns new reference');
  assert(copy.fluid !== config.fluid, 'nested fluid object is a new reference');
  copy.fluid.T_in = 999;
  assert(config.fluid.T_in === 60, 'mutation on copy does not change original config');
}

// Test 12: existing functions still present (non-regression)
assert(
  typeof UIUtils.debounce === 'function',
  'UIUtils.debounce still present after adding deepCopy'
);
assert(
  typeof UIUtils.getInsulationI18nKey === 'function',
  'UIUtils.getInsulationI18nKey still present after adding deepCopy'
);

// ============================================================
// ITEM 10: resolveModule() in pipe-segment.js
// ============================================================

console.log('\n=== ITEM 10: resolveModule() in pipe-segment.js ===\n');

// Test 13: pipe-segment.js still loads and exports calculatePipeSegment
const pipeSegment = require('../js/engine/pipe-segment.js');
assert(
  typeof pipeSegment.calculatePipeSegment === 'function',
  'pipe-segment.js exports calculatePipeSegment'
);

// Test 14: resolveModule is accessible as module export (for testability)
assert(
  typeof pipeSegment.resolveModule === 'function',
  'pipe-segment.js exports resolveModule function'
);

// Test 15: resolveModule returns the required module in Node.js context
{
  const waterProps = pipeSegment.resolveModule(
    'WaterProperties',
    '../properties/water-properties.js'
  );
  assert(
    typeof waterProps !== 'undefined' && waterProps !== null,
    'resolveModule returns a valid module'
  );
  assert(
    typeof waterProps.getWaterProperties === 'function',
    'resolveModule returns the correct module (WaterProperties)'
  );
}

// Test 16: resolveModule returns window.X when window is defined
{
  // Simulate a window-defined module
  const sentinel = { testSentinel: true };
  global.window.TestMod = sentinel;
  const result = pipeSegment.resolveModule('TestMod', '../properties/water-properties.js');
  assert(result === sentinel, 'resolveModule returns window.X when window.X is defined');
  delete global.window.TestMod;
}

// Test 17: resolveModule falls back to require() when window.X is undefined
{
  // Ensure window.WaterProperties is not set (only window is set as empty object)
  delete global.window.WaterProperties;
  const waterProps = pipeSegment.resolveModule(
    'WaterProperties',
    '../properties/water-properties.js'
  );
  assert(
    typeof waterProps.getWaterProperties === 'function',
    'resolveModule falls back to require() when window.X is absent'
  );
}

// Test 18: calculatePipeSegment still works correctly (functional regression)
{
  const geometry = {
    D_inner: 0.0525,
    D_outer: 0.0603,
    roughness: 0.045e-3,
    length: 10,
    material: 'steel',
  };
  const fluid = { T_in: 60, P: 3.0, m_dot: 2.0 };
  const ambient = { T_amb: -10, V_wind: 5.0 };

  let result;
  let noThrow = true;
  try {
    result = pipeSegment.calculatePipeSegment(geometry, fluid, ambient);
  } catch (e) {
    noThrow = false;
    console.error('  Error in calculatePipeSegment:', e.message);
  }

  assert(noThrow, 'calculatePipeSegment executes without error after refactor');
  assert(typeof result === 'object' && result !== null, 'calculatePipeSegment returns an object');
  assert(typeof result.T_out === 'number', 'result has T_out number');
  assert(result.T_out < 60, 'T_out is less than T_in (heat loss occurred)');
}

// ============================================================
// ITEM 15: t_insul i18n label in sensitivity-params.js
// ============================================================

console.log('\n=== ITEM 15: t_insul i18n label in sensitivity-params.js ===\n');

// Setup: mock window.I18n for i18n key resolution
global.window.I18n = {
  t: (key) => `[${key}]`,
};

// Load the module
const sensitivityParams = require('../js/ui/sensitivity-params.js');

// Test 19: PARAMETER_DEFINITIONS is exported
assert(
  typeof sensitivityParams.PARAMETER_DEFINITIONS === 'object',
  'PARAMETER_DEFINITIONS is exported'
);

// Test 20: t_insul definition exists
assert(
  typeof sensitivityParams.PARAMETER_DEFINITIONS.t_insul === 'object',
  't_insul parameter definition exists'
);

// Test 21: t_insul label is NOT a hardcoded French string
{
  const tInsulDef = sensitivityParams.PARAMETER_DEFINITIONS.t_insul;
  const label = tInsulDef.label;
  const isHardcodedFrench = label === 'Épaisseur isolation';
  assert(!isHardcodedFrench, 't_insul label is not the old hardcoded French string');
}

// Test 22: t_insul label uses i18n translation (dynamic getter)
{
  // With our mock I18n, any translated key will produce "[key.path]"
  const tInsulDef = sensitivityParams.PARAMETER_DEFINITIONS.t_insul;
  const label = tInsulDef.label;
  // The label should either use I18n or at minimum be dynamic
  // It should contain 'sensitivityTable.insulationThickness' or similar key
  assert(
    typeof label === 'string' && label.length > 0,
    't_insul label resolves to a non-empty string'
  );
  // Verify it goes through I18n (will contain bracket notation from our mock)
  assert(
    label.includes('[') || label.includes('insul') || label.includes('Insul'),
    't_insul label is translated (via I18n or contains insulation-related text)'
  );
}

// Test 23: t_insul other properties are preserved
{
  const tInsulDef = sensitivityParams.PARAMETER_DEFINITIONS.t_insul;
  assert(tInsulDef.unit === 'mm', 't_insul unit is mm');
  assert(Array.isArray(tInsulDef.path), 't_insul path is an array');
  assertDeepEqual(tInsulDef.path, ['insulation', 'thickness'], 't_insul path is correct');
  assert(tInsulDef.conditional === true, 't_insul is conditional');
  assert(tInsulDef.min === 5, 't_insul min is 5');
  assert(tInsulDef.max === 100, 't_insul max is 100');
}

// Test 24: getParameterLabel still works for other params
{
  const label = sensitivityParams.getParameterLabel('L');
  assert(typeof label === 'string' && label.length > 0, 'getParameterLabel("L") returns a string');
}

// Test 25: i18n key exists in i18n data files (check fr.js has the key)
{
  // Load fr.js to check key exists
  // We can't easily require it (it uses window.I18N_FR), so check the file content
  const fs = require('fs');
  const frContent = fs.readFileSync(require('path').join(__dirname, '../data/i18n/fr.js'), 'utf8');
  assert(frContent.includes('insulationThickness'), 'fr.js contains insulationThickness i18n key');
}

// Test 26: i18n key exists in en.js
{
  const fs = require('fs');
  const enContent = fs.readFileSync(require('path').join(__dirname, '../data/i18n/en.js'), 'utf8');
  assert(enContent.includes('insulationThickness'), 'en.js contains insulationThickness i18n key');
}

// Test 27: i18n key exists in es.js
{
  const fs = require('fs');
  const esContent = fs.readFileSync(require('path').join(__dirname, '../data/i18n/es.js'), 'utf8');
  assert(esContent.includes('insulationThickness'), 'es.js contains insulationThickness i18n key');
}

// Test 28: i18n key exists in pt.js
{
  const fs = require('fs');
  const ptContent = fs.readFileSync(require('path').join(__dirname, '../data/i18n/pt.js'), 'utf8');
  assert(ptContent.includes('insulationThickness'), 'pt.js contains insulationThickness i18n key');
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
