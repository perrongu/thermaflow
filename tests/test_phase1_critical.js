/**
 * test_phase1_critical.js
 *
 * Phase 1 architecture fix tests — TDD (RED → GREEN → REFACTOR)
 *
 * Item 1: Replace 7x alert() with inline notifications
 *   - UIUtils.showValidationError(inputElement, message)
 *   - UIUtils.clearValidationErrors()
 *   - UIUtils.showBannerError(message)
 *
 * Item 2: Eliminate mutation in applyParameterValue (sensitivity-analysis.js)
 *   - Function must return a NEW config object
 *   - Original config must not be mutated
 *
 * Item 3: Normalize window.* exports for pipe-network.js and freeze-detector.js
 *   - window.PipeNetwork namespace with all functions
 *   - window.FreezeDetector namespace with all functions
 *
 * Run: node tests/test_phase1_critical.js
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

// ============================================================
// Setup browser-like environment for Node.js
// ============================================================

if (typeof window === 'undefined') {
  global.window = {};
}

// ============================================================
// ITEM 1: Inline notification functions in UIUtils
// ============================================================

console.log('\n=== ITEM 1: UIUtils inline notification functions ===\n');

// Load utils.js (already loaded, but re-require for clarity)
require('../js/ui/utils.js');
const UIUtils = window.UIUtils;
const utilsExports = require('../js/ui/utils.js');

// --- 1.1: showValidationError exists on UIUtils namespace ---
assert(typeof UIUtils !== 'undefined', 'UIUtils namespace is defined');

assert(
  typeof UIUtils.showValidationError === 'function',
  'UIUtils.showValidationError is a function'
);

// --- 1.2: clearValidationErrors exists on UIUtils namespace ---
assert(
  typeof UIUtils.clearValidationErrors === 'function',
  'UIUtils.clearValidationErrors is a function'
);

// --- 1.3: showBannerError exists on UIUtils namespace ---
assert(typeof UIUtils.showBannerError === 'function', 'UIUtils.showBannerError is a function');

// --- 1.4: module.exports also exports these functions (dual export) ---
assert(
  typeof utilsExports.showValidationError === 'function',
  'module.exports.showValidationError is a function (Node.js dual export)'
);

assert(
  typeof utilsExports.clearValidationErrors === 'function',
  'module.exports.clearValidationErrors is a function (Node.js dual export)'
);

assert(
  typeof utilsExports.showBannerError === 'function',
  'module.exports.showBannerError is a function (Node.js dual export)'
);

// --- 1.5: showValidationError accepts (element, message) signature ---
// In Node.js (no DOM), these functions must not throw when called with null input
// (they should gracefully handle missing DOM elements)
{
  let noThrow = true;
  try {
    UIUtils.showValidationError(null, 'Test error message');
  } catch (e) {
    noThrow = false;
  }
  assert(noThrow, 'showValidationError(null, msg) does not throw (graceful no-DOM handling)');
}

// --- 1.6: clearValidationErrors does not throw in no-DOM environment ---
{
  let noThrow = true;
  try {
    UIUtils.clearValidationErrors();
  } catch (e) {
    noThrow = false;
  }
  assert(noThrow, 'clearValidationErrors() does not throw in no-DOM environment');
}

// --- 1.7: showBannerError does not throw in no-DOM environment ---
{
  let noThrow = true;
  try {
    UIUtils.showBannerError('Something went wrong');
  } catch (e) {
    noThrow = false;
  }
  assert(noThrow, 'showBannerError(msg) does not throw in no-DOM environment');
}

// --- 1.8: showValidationError returns an object with a clear() method ---
{
  const result = UIUtils.showValidationError(null, 'Test message');
  assert(result !== null && typeof result === 'object', 'showValidationError returns an object');
  assert(
    typeof result.clear === 'function',
    'showValidationError return value has a clear() method'
  );
}

// --- 1.9: return value clear() does not throw ---
{
  const result = UIUtils.showValidationError(null, 'Test message');
  let noThrow = true;
  try {
    result.clear();
  } catch (e) {
    noThrow = false;
  }
  assert(noThrow, 'result.clear() does not throw');
}

// --- 1.10: Existing functions are still present (non-regression) ---
assert(typeof UIUtils.debounce === 'function', 'UIUtils.debounce still present');
assert(typeof UIUtils.deepCopy === 'function', 'UIUtils.deepCopy still present');
assert(
  typeof UIUtils.getInsulationI18nKey === 'function',
  'UIUtils.getInsulationI18nKey still present'
);

// ============================================================
// ITEM 2: applyParameterValue immutability in sensitivity-analysis.js
// ============================================================

console.log('\n=== ITEM 2: applyParameterValue immutability ===\n');

// We need to load the sensitivity-analysis module in a way that allows
// testing applyParameterValue in isolation. Since it's in an IIFE,
// we test via the exported applyParameterValue.

// Mock required dependencies
global.window.SensitivityParams = {
  PARAMETER_DEFINITIONS: {
    L: {
      label: 'Longueur',
      unit: 'm',
      path: ['totalLength'],
      min: 1,
      max: 2500,
    },
    T_in: {
      label: 'Température eau',
      unit: '°C',
      path: ['fluid', 'T_in'],
      min: 1,
      max: 100,
    },
    T_amb: {
      label: 'Température ambiante',
      unit: '°C',
      path: ['ambient', 'T_amb'],
      min: -50,
      max: 30,
    },
    V_wind: {
      label: 'Vitesse vent',
      unit: 'km/h',
      path: ['ambient', 'V_wind'],
      min: 0,
      max: 108,
    },
    m_dot: {
      label: 'Débit',
      unit: 'm³/hr',
      path: ['meta', 'flowM3PerHr'],
      min: 0.06,
      max: 30,
      convertToSI: (v) => v,
      convertFromSI: (v) => v,
    },
    t_insul: {
      label: 'Épaisseur isolation',
      unit: 'mm',
      path: ['insulation', 'thickness'],
      min: 5,
      max: 100,
      conditional: true,
    },
  },
  getParameterLabel: (key) => key,
};

// Load the applyParameterValue export
// Since sensitivity-analysis.js is an IIFE with no exports,
// we need to test the exported function. Per the task spec:
// "Make applyParameterValue return a NEW config object"
// and export it for testability.
const sensitivityModule = require('../js/ui/sensitivity-analysis.js');

// --- 2.1: sensitivity-analysis.js exports applyParameterValue ---
assert(typeof sensitivityModule !== 'undefined', 'sensitivity-analysis.js loads without error');

assert(
  typeof sensitivityModule.applyParameterValue === 'function',
  'sensitivity-analysis.js exports applyParameterValue function'
);

// --- 2.2: applyParameterValue returns a new object (not mutates in-place) ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };

  const returned = sensitivityModule.applyParameterValue(original, 'L', 200);

  assert(returned !== null, 'applyParameterValue returns a non-null value');
  assert(typeof returned === 'object', 'applyParameterValue returns an object');
  assert(returned !== original, 'applyParameterValue returns a NEW object (not same reference)');
}

// --- 2.3: Original config is NOT mutated when applying L ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };
  const originalLengthBefore = original.totalLength;

  sensitivityModule.applyParameterValue(original, 'L', 500);

  assert(
    original.totalLength === originalLengthBefore,
    'original.totalLength not mutated after applyParameterValue(L, 500)'
  );
}

// --- 2.4: Returned config has the new L value applied ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };

  const result = sensitivityModule.applyParameterValue(original, 'L', 300);
  assert(result.totalLength === 300, 'returned config has updated totalLength = 300');
}

// --- 2.5: Original config is NOT mutated when applying T_amb ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };

  sensitivityModule.applyParameterValue(original, 'T_amb', -25);

  assert(
    original.ambient.T_amb === -10,
    'original.ambient.T_amb not mutated after applyParameterValue(T_amb, -25)'
  );
}

// --- 2.6: Returned config has the new T_amb value applied ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };

  const result = sensitivityModule.applyParameterValue(original, 'T_amb', -25);
  assert(result.ambient.T_amb === -25, 'returned config has updated T_amb = -25');
}

// --- 2.7: Wind speed conversion (km/h → m/s) applied on returned object, original untouched ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };

  const result = sensitivityModule.applyParameterValue(original, 'V_wind', 36); // 36 km/h → 10 m/s

  assert(original.ambient.V_wind === 5.0, 'original V_wind not mutated (still 5.0 m/s)');
  assert(
    Math.abs(result.ambient.V_wind - 10.0) < 0.001,
    'returned config V_wind = 10 m/s (36 km/h ÷ 3.6)'
  );
}

// --- 2.8: numSegments recalculated when L changes ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: null,
    meta: { hasInsulation: false, flowM3PerHr: 7.2 },
  };

  const result = sensitivityModule.applyParameterValue(original, 'L', 1000);
  // numSegments = min(max(ceil(1000/5), 10), 100) = min(max(200, 10), 100) = 100
  assert(result.numSegments === 100, 'numSegments recalculated correctly for L=1000');
  assert(original.numSegments === 20, 'original.numSegments not mutated');
}

// --- 2.9: t_insul conversion (mm → m) applied correctly ---
{
  const original = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: { material: 'fiberglass', thickness: 0.02 },
    meta: { hasInsulation: true, flowM3PerHr: 7.2 },
  };

  const result = sensitivityModule.applyParameterValue(original, 't_insul', 50); // 50mm → 0.05m
  assert(original.insulation.thickness === 0.02, 'original insulation.thickness not mutated');
  assert(
    Math.abs(result.insulation.thickness - 0.05) < 0.0001,
    'returned config insulation.thickness = 0.05m (50mm ÷ 1000)'
  );
}

// ============================================================
// ITEM 3: window.PipeNetwork and window.FreezeDetector namespaces
// ============================================================

console.log('\n=== ITEM 3: Namespace exports for PipeNetwork and FreezeDetector ===\n');

// Load modules
require('../js/engine/pipe-network.js');
require('../js/engine/freeze-detector.js');

// --- 3.1: window.PipeNetwork namespace exists ---
assert(
  typeof window.PipeNetwork === 'object' && window.PipeNetwork !== null,
  'window.PipeNetwork namespace exists'
);

// --- 3.2: window.PipeNetwork.calculatePipeNetwork is a function ---
assert(
  typeof window.PipeNetwork.calculatePipeNetwork === 'function',
  'window.PipeNetwork.calculatePipeNetwork is a function'
);

// --- 3.3: window.PipeNetwork.findSegmentAtPosition is a function ---
assert(
  typeof window.PipeNetwork.findSegmentAtPosition === 'function',
  'window.PipeNetwork.findSegmentAtPosition is a function'
);

// --- 3.4: window.PipeNetwork.interpolateTemperature is a function ---
assert(
  typeof window.PipeNetwork.interpolateTemperature === 'function',
  'window.PipeNetwork.interpolateTemperature is a function'
);

// --- 3.5: Bare exports still exist (backward compatibility) ---
assert(
  typeof window.calculatePipeNetwork === 'function',
  'window.calculatePipeNetwork bare export still exists (backward compatibility)'
);

assert(
  typeof window.findSegmentAtPosition === 'function',
  'window.findSegmentAtPosition bare export still exists (backward compatibility)'
);

assert(
  typeof window.interpolateTemperature === 'function',
  'window.interpolateTemperature bare export still exists (backward compatibility)'
);

// --- 3.6: window.FreezeDetector namespace exists ---
assert(
  typeof window.FreezeDetector === 'object' && window.FreezeDetector !== null,
  'window.FreezeDetector namespace exists'
);

// --- 3.7: window.FreezeDetector.detectFreeze is a function ---
assert(
  typeof window.FreezeDetector.detectFreeze === 'function',
  'window.FreezeDetector.detectFreeze is a function'
);

// --- 3.8: window.FreezeDetector.checkFreezeSimple is a function ---
assert(
  typeof window.FreezeDetector.checkFreezeSimple === 'function',
  'window.FreezeDetector.checkFreezeSimple is a function'
);

// --- 3.9: window.FreezeDetector.freezeMargin is a function ---
assert(
  typeof window.FreezeDetector.freezeMargin === 'function',
  'window.FreezeDetector.freezeMargin is a function'
);

// --- 3.10: window.FreezeDetector.requiresInsulation is a function ---
assert(
  typeof window.FreezeDetector.requiresInsulation === 'function',
  'window.FreezeDetector.requiresInsulation is a function'
);

// --- 3.11: window.FreezeDetector.generateFreezeMessage is a function ---
assert(
  typeof window.FreezeDetector.generateFreezeMessage === 'function',
  'window.FreezeDetector.generateFreezeMessage is a function'
);

// --- 3.12: Bare exports still exist for FreezeDetector (backward compatibility) ---
assert(
  typeof window.detectFreeze === 'function',
  'window.detectFreeze bare export still exists (backward compatibility)'
);

assert(
  typeof window.checkFreezeSimple === 'function',
  'window.checkFreezeSimple bare export still exists (backward compatibility)'
);

assert(
  typeof window.freezeMargin === 'function',
  'window.freezeMargin bare export still exists (backward compatibility)'
);

assert(
  typeof window.requiresInsulation === 'function',
  'window.requiresInsulation bare export still exists (backward compatibility)'
);

assert(
  typeof window.generateFreezeMessage === 'function',
  'window.generateFreezeMessage bare export still exists (backward compatibility)'
);

// --- 3.13: Namespace functions are the SAME functions as bare exports ---
assert(
  window.PipeNetwork.calculatePipeNetwork === window.calculatePipeNetwork,
  'PipeNetwork.calculatePipeNetwork is the same function as window.calculatePipeNetwork'
);

assert(
  window.FreezeDetector.detectFreeze === window.detectFreeze,
  'FreezeDetector.detectFreeze is the same function as window.detectFreeze'
);

// --- 3.14: PipeNetwork functions work correctly via namespace ---
{
  // Setup mock for PipeSegment dependency
  global.window.PipeSegment = {
    calculatePipeSegment: require('../js/engine/pipe-segment.js').calculatePipeSegment,
  };

  const config = {
    geometry: {
      D_inner: 0.0525,
      D_outer: 0.0603,
      roughness: 0.045e-3,
      material: 'steel',
    },
    totalLength: 50,
    numSegments: 10,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    insulation: null,
  };

  let result;
  let noThrow = true;
  try {
    result = window.PipeNetwork.calculatePipeNetwork(config);
  } catch (e) {
    noThrow = false;
    console.error('  Error in PipeNetwork.calculatePipeNetwork:', e.message);
  }

  assert(noThrow, 'PipeNetwork.calculatePipeNetwork executes without error');
  assert(
    typeof result === 'object' && result !== null,
    'PipeNetwork.calculatePipeNetwork returns object'
  );
  assert(typeof result.T_final === 'number', 'PipeNetwork.calculatePipeNetwork result has T_final');
}

// --- 3.15: FreezeDetector functions work correctly via namespace ---
{
  const T_profile = [60, 50, 40, 30, 20, 10, 5, 2, -1, -3];
  const x_profile = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

  let result;
  let noThrow = true;
  try {
    result = window.FreezeDetector.detectFreeze(T_profile, x_profile, 0);
  } catch (e) {
    noThrow = false;
    console.error('  Error in FreezeDetector.detectFreeze:', e.message);
  }

  assert(noThrow, 'FreezeDetector.detectFreeze executes without error');
  assert(result.freezeDetected === true, 'FreezeDetector.detectFreeze correctly detects freeze');
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
