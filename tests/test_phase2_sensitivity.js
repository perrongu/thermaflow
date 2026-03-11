/**
 * test_phase2_sensitivity.js
 *
 * Phase 2 Item 6 — Split sensitivity-analysis.js into two files:
 *   - js/ui/sensitivity-matrix.js  (SensitivityMatrix: pure calc/matrix logic)
 *   - js/ui/sensitivity-analysis.js (UI/DOM orchestrator, under 500 LOC)
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * Run: node tests/test_phase2_sensitivity.js
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

// ============================================================
// SETUP: Minimal browser environment for Node.js test
// ============================================================

if (typeof window === 'undefined') {
  global.window = {};
}

// Minimal DOM stubs (sensitivity-matrix.js has no DOM access)
const domStub = {
  style: {},
  classList: { add: () => {}, remove: () => {} },
  textContent: '',
  innerHTML: '',
};

global.document = {
  getElementById: () => domStub,
  querySelector: () => domStub,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({
    className: '',
    textContent: '',
    style: {},
    appendChild: () => {},
  }),
};

// Minimal SensitivityParams stub
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
      min: -40,
      max: 50,
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

// Minimal UIUtils stub with deepCopy
global.window.UIUtils = {
  deepCopy: (obj) => JSON.parse(JSON.stringify(obj)),
  showBannerError: () => {},
  debounce: (fn) => fn,
};

// Minimal WaterProperties stub
global.window.WaterProperties = {
  getWaterProperties: () => ({ rho: 1000 }),
};

// ============================================================
// ITEM 6a: SensitivityMatrix module loads
// ============================================================

console.log('\n=== ITEM 6a: SensitivityMatrix module loads ===\n');

// Test 1: sensitivity-matrix.js file loads without error
let sensitivityMatrixLoaded = false;
try {
  require('../js/ui/sensitivity-matrix.js');
  sensitivityMatrixLoaded = true;
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}
assert(sensitivityMatrixLoaded, 'sensitivity-matrix.js loads without error');

// Test 2: window.SensitivityMatrix is defined after loading
assert(
  typeof window.SensitivityMatrix !== 'undefined',
  'window.SensitivityMatrix is defined after loading sensitivity-matrix.js'
);

// Test 3: module.exports returns a SensitivityMatrix object (dual export)
let SensitivityMatrix = {};
try {
  SensitivityMatrix = require('../js/ui/sensitivity-matrix.js') || {};
} catch (e) {
  /* will fail on function tests below */
}
assert(
  typeof SensitivityMatrix !== 'undefined' && SensitivityMatrix !== null,
  'module.exports returns a SensitivityMatrix object (dual export)'
);

// ============================================================
// ITEM 6b: SensitivityMatrix exports expected functions
// ============================================================

console.log('\n=== ITEM 6b: SensitivityMatrix exports expected functions ===\n');

// Test 4: applyParameterValue is exported
assert(
  typeof SensitivityMatrix.applyParameterValue === 'function',
  'SensitivityMatrix.applyParameterValue is a function'
);

// Test 5: getValueFromPath is exported
assert(
  typeof SensitivityMatrix.getValueFromPath === 'function',
  'SensitivityMatrix.getValueFromPath is a function'
);

// Test 6: setValueByPath is NOT exported (private implementation detail)
assert(
  typeof SensitivityMatrix.setValueByPath === 'undefined',
  'SensitivityMatrix.setValueByPath is NOT exported (private)'
);

// Test 7: getDisplayValue is exported
assert(
  typeof SensitivityMatrix.getDisplayValue === 'function',
  'SensitivityMatrix.getDisplayValue is a function'
);

// Test 8: calculateMatrix is exported
assert(
  typeof SensitivityMatrix.calculateMatrix === 'function',
  'SensitivityMatrix.calculateMatrix is a function'
);

// Test 9: adjustConfigForStability is exported
assert(
  typeof SensitivityMatrix.adjustConfigForStability === 'function',
  'SensitivityMatrix.adjustConfigForStability is a function'
);

// Test 10: createFallbackConfig is exported
assert(
  typeof SensitivityMatrix.createFallbackConfig === 'function',
  'SensitivityMatrix.createFallbackConfig is a function'
);

// Test 11: window.SensitivityMatrix exposes the same functions
const winSM = window.SensitivityMatrix || {};
assert(
  typeof winSM.applyParameterValue === 'function',
  'window.SensitivityMatrix.applyParameterValue is a function'
);
assert(
  typeof winSM.calculateMatrix === 'function',
  'window.SensitivityMatrix.calculateMatrix is a function'
);
assert(
  typeof winSM.getValueFromPath === 'function',
  'window.SensitivityMatrix.getValueFromPath is a function'
);
assert(
  typeof winSM.getDisplayValue === 'function',
  'window.SensitivityMatrix.getDisplayValue is a function'
);

// ============================================================
// ITEM 6c: applyParameterValue — immutability (Phase 1 fix preserved)
// ============================================================

console.log('\n=== ITEM 6c: applyParameterValue immutability ===\n');

const baseConfig = {
  totalLength: 100,
  numSegments: 20,
  fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
  ambient: { T_amb: -10, V_wind: 5.0 },
  geometry: { D_inner: 0.0525, D_outer: 0.0603 },
  insulation: null,
  meta: { hasInsulation: false, flowM3PerHr: 7.2 },
};

// Test 12: returns a new object (not same reference)
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(baseConfig, 'L', 200);
  }, 'applyParameterValue executes for test 12');
  if (result !== null) {
    assert(result !== null, 'applyParameterValue returns a non-null value');
    assert(result !== baseConfig, 'applyParameterValue returns a NEW object (not same reference)');
  }
}

// Test 13: original is NOT mutated when applying L
{
  const original = JSON.parse(JSON.stringify(baseConfig));
  safeRun(() => {
    SensitivityMatrix.applyParameterValue(original, 'L', 500);
  }, 'applyParameterValue executes for test 13');
  assert(
    original.totalLength === 100,
    'original.totalLength not mutated after applyParameterValue(L, 500)'
  );
}

// Test 14: returned config has the updated L value
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(baseConfig, 'L', 300);
  }, 'applyParameterValue executes for test 14');
  if (result) assert(result.totalLength === 300, 'returned config has updated totalLength = 300');
}

// Test 15: original is NOT mutated when applying T_amb
{
  const original = JSON.parse(JSON.stringify(baseConfig));
  safeRun(() => {
    SensitivityMatrix.applyParameterValue(original, 'T_amb', -25);
  }, 'applyParameterValue executes for test 15');
  assert(original.ambient.T_amb === -10, 'original.ambient.T_amb not mutated');
}

// Test 16: returned config has updated T_amb
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(baseConfig, 'T_amb', -25);
  }, 'applyParameterValue executes for test 16');
  if (result) assert(result.ambient.T_amb === -25, 'returned config has updated T_amb = -25');
}

// Test 17: V_wind conversion km/h → m/s, original untouched
{
  const original = JSON.parse(JSON.stringify(baseConfig));
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(original, 'V_wind', 36);
  }, 'applyParameterValue executes for test 17');
  assert(original.ambient.V_wind === 5.0, 'original V_wind not mutated (still 5.0 m/s)');
  if (result) {
    assert(
      Math.abs(result.ambient.V_wind - 10.0) < 0.001,
      'returned config V_wind = 10 m/s (36 km/h / 3.6)'
    );
  }
}

// Test 18: numSegments recalculated when L changes
{
  const original = JSON.parse(JSON.stringify(baseConfig));
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(original, 'L', 1000);
  }, 'applyParameterValue executes for test 18');
  // numSegments = min(max(ceil(1000/5), 10), 100) = 100
  if (result) assert(result.numSegments === 100, 'numSegments recalculated correctly for L=1000');
  assert(original.numSegments === 20, 'original.numSegments not mutated');
}

// Test 19: unknown param returns deep copy without mutation
{
  const original = JSON.parse(JSON.stringify(baseConfig));
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(original, 'UNKNOWN_PARAM', 42);
  }, 'applyParameterValue executes for test 19');
  if (result) assert(result !== original, 'unknown param: returns new object (not same reference)');
  assert(original.totalLength === 100, 'unknown param: original not mutated');
}

// Test 20: t_insul conversion mm → m
{
  const withInsulation = {
    totalLength: 100,
    numSegments: 20,
    fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
    ambient: { T_amb: -10, V_wind: 5.0 },
    geometry: { D_inner: 0.0525, D_outer: 0.0603 },
    insulation: { material: 'fiberglass', thickness: 0.02 },
    meta: { hasInsulation: true, flowM3PerHr: 7.2 },
  };
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(withInsulation, 't_insul', 50);
  }, 'applyParameterValue executes for test 20');
  assert(withInsulation.insulation.thickness === 0.02, 'original insulation.thickness not mutated');
  if (result) {
    assert(
      Math.abs(result.insulation.thickness - 0.05) < 0.0001,
      'returned config insulation.thickness = 0.05m (50mm / 1000)'
    );
  }
}

// ============================================================
// ITEM 6d: getValueFromPath
// ============================================================

console.log('\n=== ITEM 6d: getValueFromPath ===\n');

// Test 21: retrieves top-level value
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.getValueFromPath({ totalLength: 150 }, ['totalLength']);
  }, 'getValueFromPath executes for test 21');
  if (result !== null) assert(result === 150, 'getValueFromPath retrieves top-level value');
}

// Test 22: retrieves nested value
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.getValueFromPath({ fluid: { T_in: 60, P: 3.0 } }, ['fluid', 'T_in']);
  }, 'getValueFromPath executes for test 22');
  if (result !== null) assert(result === 60, 'getValueFromPath retrieves nested value');
}

// Test 23: returns null for missing path
{
  let result = 'SENTINEL';
  safeRun(() => {
    result = SensitivityMatrix.getValueFromPath({ fluid: { T_in: 60 } }, ['ambient', 'T_amb']);
  }, 'getValueFromPath executes for test 23');
  if (result !== 'SENTINEL') {
    assert(
      result === null || result === undefined,
      'getValueFromPath returns null/undefined for missing path'
    );
  }
}

// Test 24: returns null when object is null
{
  let result = 'SENTINEL';
  safeRun(() => {
    result = SensitivityMatrix.getValueFromPath(null, ['totalLength']);
  }, 'getValueFromPath executes for test 24');
  if (result !== 'SENTINEL') {
    assert(
      result === null || result === undefined,
      'getValueFromPath returns null/undefined for null obj'
    );
  }
}

// Test 25: retrieves 3-level nested value
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.getValueFromPath({ a: { b: { c: 42 } } }, ['a', 'b', 'c']);
  }, 'getValueFromPath executes for test 25');
  if (result !== null) assert(result === 42, 'getValueFromPath retrieves 3-level nested value');
}

// ============================================================
// ITEM 6e: applyParameterValue with nested paths (tests setValueByPath indirectly)
// ============================================================

console.log(
  '\n=== ITEM 6e: applyParameterValue nested path tests (setValueByPath is private) ===\n'
);

// Test 26: applyParameterValue correctly sets a top-level path (L → totalLength)
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(baseConfig, 'L', 250);
  }, 'applyParameterValue executes for test 26 (top-level path)');
  if (result !== null) {
    assert(
      result.totalLength === 250,
      'applyParameterValue sets top-level path (L → totalLength = 250)'
    );
    assert(baseConfig.totalLength === 100, 'original not mutated (top-level path test)');
  }
}

// Test 27: applyParameterValue correctly sets a 2-level nested path (T_in → fluid.T_in)
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(baseConfig, 'T_in', 80);
  }, 'applyParameterValue executes for test 27 (nested path fluid.T_in)');
  if (result !== null) {
    assert(
      result.fluid.T_in === 80,
      'applyParameterValue sets nested path (T_in → fluid.T_in = 80)'
    );
    assert(baseConfig.fluid.T_in === 60, 'original fluid.T_in not mutated');
  }
}

// Test 28: applyParameterValue correctly sets a 2-level nested path (T_amb → ambient.T_amb)
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.applyParameterValue(baseConfig, 'T_amb', -30);
  }, 'applyParameterValue executes for test 28 (nested path ambient.T_amb)');
  if (result !== null) {
    assert(
      result.ambient.T_amb === -30,
      'applyParameterValue sets nested path (T_amb → ambient.T_amb = -30)'
    );
    assert(baseConfig.ambient.T_amb === -10, 'original ambient.T_amb not mutated');
  }
}

// ============================================================
// ITEM 6f: getDisplayValue
// ============================================================

console.log('\n=== ITEM 6f: getDisplayValue ===\n');

const configForDisplay = {
  totalLength: 150,
  numSegments: 30,
  fluid: { T_in: 55, P: 3.0, m_dot: 2.0 },
  ambient: { T_amb: -5, V_wind: 4.0 },
  geometry: { D_inner: 0.0525, D_outer: 0.0603 },
  insulation: { material: 'fiberglass', thickness: 0.03 },
  meta: { hasInsulation: true, flowM3PerHr: 6.0 },
};

// Test 29: getDisplayValue for L (no conversion needed)
{
  let result = 'SENTINEL';
  safeRun(() => {
    result = SensitivityMatrix.getDisplayValue(configForDisplay, 'L');
  }, 'getDisplayValue executes for test 29');
  if (result !== 'SENTINEL')
    assert(result === 150, 'getDisplayValue returns totalLength for L param');
}

// Test 30: getDisplayValue for T_amb (no conversion)
{
  let result = 'SENTINEL';
  safeRun(() => {
    result = SensitivityMatrix.getDisplayValue(configForDisplay, 'T_amb');
  }, 'getDisplayValue executes for test 30');
  if (result !== 'SENTINEL') assert(result === -5, 'getDisplayValue returns T_amb unchanged');
}

// Test 31: getDisplayValue for T_in (no conversion)
{
  let result = 'SENTINEL';
  safeRun(() => {
    result = SensitivityMatrix.getDisplayValue(configForDisplay, 'T_in');
  }, 'getDisplayValue executes for test 31');
  if (result !== 'SENTINEL') assert(result === 55, 'getDisplayValue returns T_in unchanged');
}

// Test 32: getDisplayValue for V_wind converts m/s → km/h
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.getDisplayValue(configForDisplay, 'V_wind');
  }, 'getDisplayValue executes for test 32');
  // V_wind internal = 4.0 m/s → display = 4.0 * 3.6 = 14.4 km/h
  if (result !== null) {
    assert(
      Math.abs(result - 14.4) < 0.001,
      'getDisplayValue converts V_wind from m/s to km/h (4.0 * 3.6 = 14.4)'
    );
  }
}

// Test 33: getDisplayValue for t_insul converts m → mm
{
  let result = null;
  safeRun(() => {
    result = SensitivityMatrix.getDisplayValue(configForDisplay, 't_insul');
  }, 'getDisplayValue executes for test 33');
  // thickness = 0.03m → display = 30mm
  if (result !== null) {
    assert(
      Math.abs(result - 30) < 0.001,
      'getDisplayValue converts t_insul from m to mm (0.03 * 1000 = 30)'
    );
  }
}

// Test 34: getDisplayValue returns null for unknown param
{
  let result = 'SENTINEL';
  safeRun(() => {
    result = SensitivityMatrix.getDisplayValue(configForDisplay, 'UNKNOWN');
  }, 'getDisplayValue executes for test 34');
  if (result !== 'SENTINEL') {
    assert(
      result === null || result === undefined,
      'getDisplayValue returns null for unknown param'
    );
  }
}

// ============================================================
// ITEM 6g: calculateMatrix — dimensions and structure
// ============================================================

console.log('\n=== ITEM 6g: calculateMatrix dimensions and structure ===\n');

// Stub calculatePipeNetwork in window (used by calculateMatrix)
global.window.calculatePipeNetwork = (config) => ({
  T_final: config.fluid.T_in - 5,
  segments: [],
});

const matrixConfig = {
  totalLength: 100,
  numSegments: 10,
  fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
  ambient: { T_amb: -10, V_wind: 5.0 },
  geometry: { D_inner: 0.0525, D_outer: 0.0603 },
  insulation: null,
  meta: { hasInsulation: false, flowM3PerHr: 7.2 },
};

// Test 35: calculateMatrix returns an object with expected keys
{
  let result = null;
  const ok = safeRun(() => {
    result = SensitivityMatrix.calculateMatrix(
      matrixConfig,
      'L',
      'T_amb',
      { min: 50, max: 200 },
      { min: -20, max: 0 },
      3
    );
  }, 'calculateMatrix executes for test 35');

  if (ok && result) {
    assert(typeof result === 'object', 'calculateMatrix returns an object');
    assert(Array.isArray(result.matrix), 'calculateMatrix result has matrix array');
    assert(Array.isArray(result.valuesX), 'calculateMatrix result has valuesX array');
    assert(Array.isArray(result.valuesY), 'calculateMatrix result has valuesY array');
    assert(typeof result.paramX === 'string', 'calculateMatrix result has paramX string');
    assert(typeof result.paramY === 'string', 'calculateMatrix result has paramY string');
    assert(typeof result.labelX === 'string', 'calculateMatrix result has labelX string');
    assert(typeof result.labelY === 'string', 'calculateMatrix result has labelY string');
    assert(typeof result.unitX === 'string', 'calculateMatrix result has unitX string');
    assert(typeof result.unitY === 'string', 'calculateMatrix result has unitY string');
  }
}

// Test 36: calculateMatrix matrix has correct dimensions (resolution x resolution)
{
  let result = null;
  const ok = safeRun(() => {
    result = SensitivityMatrix.calculateMatrix(
      matrixConfig,
      'L',
      'T_amb',
      { min: 50, max: 200 },
      { min: -20, max: 0 },
      4
    );
  }, 'calculateMatrix executes for test 36');

  if (ok && result) {
    assert(result.matrix.length === 4, 'calculateMatrix matrix has 4 rows (resolution=4)');
    assert(
      result.matrix[0].length === 4,
      'calculateMatrix matrix row has 4 columns (resolution=4)'
    );
    assert(result.valuesX.length === 4, 'calculateMatrix valuesX has 4 elements');
    assert(result.valuesY.length === 4, 'calculateMatrix valuesY has 4 elements');
  }
}

// Test 37: calculateMatrix paramX and paramY stored in result
{
  let result = null;
  const ok = safeRun(() => {
    result = SensitivityMatrix.calculateMatrix(
      matrixConfig,
      'L',
      'T_amb',
      { min: 50, max: 200 },
      { min: -20, max: 0 },
      3
    );
  }, 'calculateMatrix executes for test 37');

  if (ok && result) {
    assert(result.paramX === 'L', 'calculateMatrix result.paramX === "L"');
    assert(result.paramY === 'T_amb', 'calculateMatrix result.paramY === "T_amb"');
  }
}

// Test 38: calculateMatrix matrix cells have T_final and success properties
{
  let result = null;
  const ok = safeRun(() => {
    result = SensitivityMatrix.calculateMatrix(
      matrixConfig,
      'L',
      'T_amb',
      { min: 50, max: 200 },
      { min: -20, max: 0 },
      3
    );
  }, 'calculateMatrix executes for test 38');

  if (ok && result) {
    const cell = result.matrix[0][0];
    assert(typeof cell === 'object' && cell !== null, 'calculateMatrix matrix cells are objects');
    assert('success' in cell, 'calculateMatrix matrix cells have success property');
  }
}

// Test 39: calculateMatrix valuesX spans the range correctly
{
  let result = null;
  const ok = safeRun(() => {
    result = SensitivityMatrix.calculateMatrix(
      matrixConfig,
      'L',
      'T_amb',
      { min: 100, max: 200 },
      { min: -20, max: 0 },
      3
    );
  }, 'calculateMatrix executes for test 39');

  if (ok && result) {
    assert(result.valuesX[0] === 100, 'calculateMatrix valuesX starts at rangeX.min');
    assert(result.valuesX[2] === 200, 'calculateMatrix valuesX ends at rangeX.max');
  }
}

// Test 40: calculateMatrix does not mutate baseConfig
{
  const originalConfig = JSON.parse(JSON.stringify(matrixConfig));
  safeRun(() => {
    SensitivityMatrix.calculateMatrix(
      matrixConfig,
      'L',
      'T_amb',
      { min: 50, max: 200 },
      { min: -20, max: 0 },
      3
    );
  }, 'calculateMatrix executes for test 40');
  assert(
    matrixConfig.totalLength === originalConfig.totalLength,
    'calculateMatrix does not mutate baseConfig.totalLength'
  );
  assert(
    matrixConfig.fluid.T_in === originalConfig.fluid.T_in,
    'calculateMatrix does not mutate baseConfig.fluid.T_in'
  );
}

// ============================================================
// ITEM 6h: SensitivityAnalysis module still loads (non-regression)
// ============================================================

console.log('\n=== ITEM 6h: SensitivityAnalysis non-regression ===\n');

// Test 41: sensitivity-analysis.js still loads without error
let sensitivityAnalysisLoaded = false;
try {
  require('../js/ui/sensitivity-analysis.js');
  sensitivityAnalysisLoaded = true;
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}
assert(sensitivityAnalysisLoaded, 'sensitivity-analysis.js still loads without error');

// Test 42: window.SensitivityAnalysis is defined after loading
assert(
  typeof window.SensitivityAnalysis !== 'undefined',
  'window.SensitivityAnalysis is defined after loading sensitivity-analysis.js'
);

// Test 43: SensitivityAnalysis still exports init
const winSA = window.SensitivityAnalysis || {};
assert(
  typeof winSA.init === 'function',
  'window.SensitivityAnalysis.init is a function (non-regression)'
);

// Test 44: SensitivityAnalysis still exports updateBaseConfig
assert(
  typeof winSA.updateBaseConfig === 'function',
  'window.SensitivityAnalysis.updateBaseConfig is a function (non-regression)'
);

// Test 45: SensitivityAnalysis still exports markAsOutdated
assert(
  typeof winSA.markAsOutdated === 'function',
  'window.SensitivityAnalysis.markAsOutdated is a function (non-regression)'
);

// Test 46: sensitivity-analysis.js module.exports still has applyParameterValue (backward compat)
const sensitivityAnalysisExports = require('../js/ui/sensitivity-analysis.js') || {};
assert(
  typeof sensitivityAnalysisExports.applyParameterValue === 'function',
  'sensitivity-analysis.js module.exports.applyParameterValue still exported (backward compat)'
);

// ============================================================
// ITEM 6i: File size constraints (under 500 LOC each)
// ============================================================

console.log('\n=== ITEM 6i: File size constraints ===\n');

const fs = require('fs');
const path = require('path');

// Test 47: sensitivity-matrix.js is under 500 LOC
{
  const filePath = path.join(__dirname, '../js/ui/sensitivity-matrix.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // File does not exist yet — will fail
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `sensitivity-matrix.js is under 500 LOC (actual: ${lineCount})`
  );
}

// Test 48: sensitivity-analysis.js is under 500 LOC after extraction
{
  const filePath = path.join(__dirname, '../js/ui/sensitivity-analysis.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // Should exist
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `sensitivity-analysis.js is under 500 LOC after extraction (actual: ${lineCount})`
  );
}

// ============================================================
// ITEM 6j: index.html loading order
// ============================================================

console.log('\n=== ITEM 6j: index.html script loading order ===\n');

const indexHtmlPath = path.join(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Test 49: sensitivity-matrix.js script tag exists in index.html
assert(
  indexHtml.includes('sensitivity-matrix.js'),
  'index.html contains <script src="...sensitivity-matrix.js">'
);

// Test 50: sensitivity-matrix.js loads before sensitivity-analysis.js in index.html
{
  const matrixPos = indexHtml.indexOf('sensitivity-matrix.js');
  const analysisPos = indexHtml.indexOf('sensitivity-analysis.js');
  assert(
    matrixPos !== -1 && analysisPos !== -1 && matrixPos < analysisPos,
    'sensitivity-matrix.js script tag appears before sensitivity-analysis.js in index.html'
  );
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
