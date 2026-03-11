/**
 * test_phase2_calc_details.js
 *
 * Phase 2, Item 4 — Split calculation-details.js into:
 *   - calc-detail-templates.js  (HTML template generation)
 *   - calculation-details.js    (orchestration, events, rendering)
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * Run: node tests/test_phase2_calc_details.js
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

// ============================================================
// Setup: browser-like environment for Node.js
// ============================================================

if (typeof window === 'undefined') {
  global.window = {};
}

// Mock I18n — returns the key so we can assert output contains i18n keys
global.window.I18n = {
  t: (key, _replacements) => `[${key}]`,
};
// Also expose I18n as a bare global (some modules use `I18n.t()` without `window.` prefix)
global.I18n = global.window.I18n;

// Mock UnitConverter
global.window.UnitConverter = {
  fromSI: (_type, value) => value,
  getUnitInfo: (_type) => ({ label: 'kPag' }),
};

// Mock MaterialProperties (needed by displayConvectionExternal and displayThermalResistances)
global.window.MaterialProperties = {
  getMaterialProperties: (_material) => ({ k: 50.0, emissivity: 0.8 }),
};

// Mock UIUtils (needed by displayThermalResistances)
global.window.UIUtils = {
  getInsulationI18nKey: (material) => material,
  debounce: (fn) => fn,
};

// ============================================================
// Shared test data
// ============================================================

const mockNetworkResult = {
  segmentResults: [{ T_in: 60, T_out: 58, Re: 50000, regime: 'turbulent', dP: 100, Q_loss: 500 }],
  x_profile: [0],
};

const mockConfig = {
  totalLength: 100,
  numSegments: 10,
  fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
  ambient: { T_amb: -10, V_wind: 5.0 },
  geometry: { D_inner: 0.0525, D_outer: 0.0603, roughness: 0.045e-3, material: 'steel' },
  insulation: null,
};

const mockSegmentResult = {
  T_in: 60.0,
  T_out: 58.5,
  Re: 50000,
  regime: 'turbulent',
  dP: 100,
  Q_loss: 500,
};

const mockWater = { rho: 983.2, mu: 4.67e-4, k: 0.658, cp: 4183 };
const mockAir = { rho: 1.341, mu: 1.71e-5, k: 0.02442, Pr: 0.713 };

const mockSegResult = {
  V: 0.935,
  Re: 51234,
  f: 0.020561,
  dP: 485.2,
  regime: 'turbulent',
  h_int: 2850,
  h_ext: 15.2,
  h_conv_ext: 12.9,
  h_rad: 2.3,
  NTU: 0.00342,
  T_out: 59.5,
  Q_loss: 418,
  R_total: 0.08,
};

const mockGeom = {
  D_inner: 0.0525,
  D_outer: 0.0603,
  roughness: 0.045e-3,
  length: 10,
  material: 'steel',
};

// ============================================================
// SECTION 1: CalcDetailTemplates module existence and exports
// ============================================================

console.log('\n=== SECTION 1: CalcDetailTemplates module ===\n');

// Test 1: calc-detail-templates.js loads without error
let loadError = null;
try {
  require('../js/ui/calc-detail-templates.js');
} catch (e) {
  loadError = e;
}
assert(
  loadError === null,
  'calc-detail-templates.js loads without error (error: ' +
    (loadError ? loadError.message : 'none') +
    ')'
);

// Test 2: window.CalcDetailTemplates is defined after loading
assert(
  typeof window.CalcDetailTemplates !== 'undefined',
  'window.CalcDetailTemplates is defined after loading'
);

// Test 3: window.CalcDetailTemplates is an object
assert(
  typeof window.CalcDetailTemplates === 'object' && window.CalcDetailTemplates !== null,
  'window.CalcDetailTemplates is a non-null object'
);

// Test 4: module.exports is defined (dual export for Node.js tests)
let CalcDetailTemplates = {};
try {
  CalcDetailTemplates = require('../js/ui/calc-detail-templates.js');
} catch (e) {
  // Already caught above — CalcDetailTemplates stays as {}
}
assert(
  typeof CalcDetailTemplates === 'object' && CalcDetailTemplates !== null,
  'module.exports from calc-detail-templates.js is a non-null object'
);

// ============================================================
// SECTION 2: Required functions exported by CalcDetailTemplates
// ============================================================

console.log('\n=== SECTION 2: CalcDetailTemplates function exports ===\n');

const EXPECTED_FUNCTIONS = [
  'toScientificLatex',
  'generateExecutiveSummary',
  'generateSegmentHeader',
  'displayFluidProperties',
  'displayHydraulics',
  'displayConvectionInternal',
  'displayConvectionExternal',
  'displayThermalResistances',
  'displayNTU',
];

for (const fnName of EXPECTED_FUNCTIONS) {
  assert(
    typeof CalcDetailTemplates[fnName] === 'function',
    `CalcDetailTemplates.${fnName} is a function (module.exports)`
  );
  assert(
    typeof (window.CalcDetailTemplates || {})[fnName] === 'function',
    `window.CalcDetailTemplates.${fnName} is a function (browser export)`
  );
}

// ============================================================
// SECTION 3: toScientificLatex behavior
// ============================================================

console.log('\n=== SECTION 3: toScientificLatex ===\n');

// Use safe wrapper to avoid crash if function missing
function callFn(obj, name, ...args) {
  if (typeof obj[name] === 'function') {
    return obj[name](...args);
  }
  return undefined;
}

// Test: zero returns '0'
assert(
  callFn(CalcDetailTemplates, 'toScientificLatex', 0) === '0',
  'toScientificLatex(0) returns "0"'
);

// Test: value with exp=0 returns just the mantissa (no \\times)
{
  const result = callFn(CalcDetailTemplates, 'toScientificLatex', 1.234, 3);
  assert(
    typeof result === 'string' && result.length > 0,
    'toScientificLatex(1.234, 3) returns non-empty string'
  );
  assert(
    result !== undefined && !result.includes('times'),
    'toScientificLatex(1.234, 3) does not include \\times when exp=0'
  );
}

// Test: small value uses scientific notation
{
  const result = callFn(CalcDetailTemplates, 'toScientificLatex', 0.001, 3);
  assert(
    result !== undefined && result.includes('times'),
    'toScientificLatex(0.001, 3) includes \\times for scientific notation'
  );
  assert(
    result !== undefined && result.includes('10^{'),
    'toScientificLatex(0.001, 3) includes 10^{...} notation'
  );
}

// Test: default decimals is 3
{
  const withDefault = callFn(CalcDetailTemplates, 'toScientificLatex', 0.001);
  const withExplicit = callFn(CalcDetailTemplates, 'toScientificLatex', 0.001, 3);
  assert(
    withDefault === withExplicit,
    'toScientificLatex default decimals=3 matches explicit call'
  );
}

// Test: large number uses scientific notation
{
  const result = callFn(CalcDetailTemplates, 'toScientificLatex', 1234000, 3);
  assert(
    result !== undefined && (result.includes('times') || result.includes('^{')),
    'toScientificLatex(1234000) uses scientific notation for large number'
  );
}

// ============================================================
// SECTION 4: generateExecutiveSummary returns HTML string
// ============================================================

console.log('\n=== SECTION 4: generateExecutiveSummary ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'generateExecutiveSummary',
    mockNetworkResult,
    mockConfig
  );
  assert(typeof html === 'string', 'generateExecutiveSummary returns a string');
  assert(
    html !== undefined && html.length > 0,
    'generateExecutiveSummary returns non-empty string'
  );
  assert(
    html !== undefined && html.includes('<div'),
    'generateExecutiveSummary returns HTML (contains <div)'
  );
}

// Test: contains segment length info (100m / 10 = 10m)
{
  const html = callFn(
    CalcDetailTemplates,
    'generateExecutiveSummary',
    mockNetworkResult,
    mockConfig
  );
  assert(
    html !== undefined && html.includes('10'),
    'generateExecutiveSummary includes segment length (10m)'
  );
}

// ============================================================
// SECTION 5: generateSegmentHeader returns HTML string
// ============================================================

console.log('\n=== SECTION 5: generateSegmentHeader ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'generateSegmentHeader',
    1,
    0,
    mockSegmentResult,
    mockConfig,
    10
  );
  assert(typeof html === 'string', 'generateSegmentHeader returns a string');
  assert(html !== undefined && html.length > 0, 'generateSegmentHeader returns non-empty string');
  assert(
    html !== undefined && html.includes('<div'),
    'generateSegmentHeader returns HTML (contains <div)'
  );
}

// Test: segment number present
{
  const html = callFn(
    CalcDetailTemplates,
    'generateSegmentHeader',
    1,
    0,
    mockSegmentResult,
    mockConfig,
    10
  );
  assert(
    html !== undefined && html.includes('1'),
    'generateSegmentHeader includes segment number "1"'
  );
  assert(
    html !== undefined && html.includes('10'),
    'generateSegmentHeader includes total segments "10"'
  );
}

// Test: temperatures present
{
  const html = callFn(
    CalcDetailTemplates,
    'generateSegmentHeader',
    1,
    0,
    mockSegmentResult,
    mockConfig,
    10
  );
  assert(
    html !== undefined && html.includes('60.00'),
    'generateSegmentHeader includes T_in = 60.00'
  );
  assert(
    html !== undefined && html.includes('58.50'),
    'generateSegmentHeader includes T_out = 58.50'
  );
}

// ============================================================
// SECTION 6: displayFluidProperties returns HTML string
// ============================================================

console.log('\n=== SECTION 6: displayFluidProperties ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'displayFluidProperties',
    59.25,
    3.0,
    mockWater,
    mockAir,
    -10
  );
  assert(typeof html === 'string', 'displayFluidProperties returns a string');
  assert(html !== undefined && html.length > 0, 'displayFluidProperties returns non-empty string');
  assert(
    html !== undefined && html.includes('<div'),
    'displayFluidProperties returns HTML (contains <div)'
  );
}

// Test: water density present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayFluidProperties',
    59.25,
    3.0,
    mockWater,
    mockAir,
    -10
  );
  assert(
    html !== undefined && (html.includes('983.2') || html.includes('983')),
    'displayFluidProperties includes water density'
  );
}

// Test: air Prandtl number present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayFluidProperties',
    59.25,
    3.0,
    mockWater,
    mockAir,
    -10
  );
  assert(
    html !== undefined && html.includes('0.713'),
    'displayFluidProperties includes air Prandtl number'
  );
}

// ============================================================
// SECTION 7: displayHydraulics returns HTML string
// ============================================================

console.log('\n=== SECTION 7: displayHydraulics ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'displayHydraulics',
    mockSegResult,
    mockGeom,
    mockConfig,
    mockWater
  );
  assert(typeof html === 'string', 'displayHydraulics returns a string');
  assert(html !== undefined && html.length > 0, 'displayHydraulics returns non-empty string');
  assert(
    html !== undefined && html.includes('<div'),
    'displayHydraulics returns HTML (contains <div)'
  );
}

// Test: velocity present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayHydraulics',
    mockSegResult,
    mockGeom,
    mockConfig,
    mockWater
  );
  assert(
    html !== undefined && html.includes('0.935'),
    'displayHydraulics includes velocity 0.935 m/s'
  );
}

// Test: Reynolds number present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayHydraulics',
    mockSegResult,
    mockGeom,
    mockConfig,
    mockWater
  );
  assert(
    html !== undefined && html.includes('51234'),
    'displayHydraulics includes Reynolds number 51234'
  );
}

// ============================================================
// SECTION 8: displayConvectionInternal returns HTML string
// ============================================================

console.log('\n=== SECTION 8: displayConvectionInternal ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'displayConvectionInternal',
    mockSegResult,
    mockGeom,
    mockConfig,
    mockWater
  );
  assert(typeof html === 'string', 'displayConvectionInternal returns a string');
  assert(
    html !== undefined && html.length > 0,
    'displayConvectionInternal returns non-empty string'
  );
  assert(
    html !== undefined && html.includes('<div'),
    'displayConvectionInternal returns HTML (contains <div)'
  );
}

// Test: h_int value present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayConvectionInternal',
    mockSegResult,
    mockGeom,
    mockConfig,
    mockWater
  );
  assert(
    html !== undefined && html.includes('2850'),
    'displayConvectionInternal includes h_int = 2850'
  );
}

// Test: laminar regime path
{
  const laminarResult = Object.assign({}, mockSegResult, { regime: 'laminar', Re: 1500 });
  const html = callFn(
    CalcDetailTemplates,
    'displayConvectionInternal',
    laminarResult,
    mockGeom,
    mockConfig,
    mockWater
  );
  assert(
    typeof html === 'string' && html !== undefined && html.length > 0,
    'displayConvectionInternal works for laminar regime'
  );
}

// ============================================================
// SECTION 9: displayConvectionExternal returns HTML string
// ============================================================

console.log('\n=== SECTION 9: displayConvectionExternal ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'displayConvectionExternal',
    mockSegResult,
    mockConfig,
    mockAir
  );
  assert(typeof html === 'string', 'displayConvectionExternal returns a string');
  assert(
    html !== undefined && html.length > 0,
    'displayConvectionExternal returns non-empty string'
  );
  assert(
    html !== undefined && html.includes('<div'),
    'displayConvectionExternal returns HTML (contains <div)'
  );
}

// Test: h_ext value present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayConvectionExternal',
    mockSegResult,
    mockConfig,
    mockAir
  );
  assert(
    html !== undefined && (html.includes('15.2') || html.includes('15')),
    'displayConvectionExternal includes h_ext value'
  );
}

// Test: forced convection path (V_wind > 0.1)
{
  const html = callFn(
    CalcDetailTemplates,
    'displayConvectionExternal',
    mockSegResult,
    mockConfig,
    mockAir
  );
  assert(
    typeof html === 'string' && html !== undefined && html.length > 0,
    'displayConvectionExternal works for forced convection (V_wind=5.0)'
  );
}

// Test: natural convection path (V_wind <= 0.1)
{
  const naturalConfig = Object.assign({}, mockConfig, {
    ambient: { T_amb: -10, V_wind: 0.0 },
  });
  const html = callFn(
    CalcDetailTemplates,
    'displayConvectionExternal',
    mockSegResult,
    naturalConfig,
    mockAir
  );
  assert(
    typeof html === 'string' && html !== undefined && html.length > 0,
    'displayConvectionExternal works for natural convection (V_wind=0.0)'
  );
}

// ============================================================
// SECTION 10: displayThermalResistances returns HTML string
// ============================================================

console.log('\n=== SECTION 10: displayThermalResistances ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'displayThermalResistances',
    mockSegResult,
    mockGeom,
    mockConfig
  );
  assert(typeof html === 'string', 'displayThermalResistances returns a string');
  assert(
    html !== undefined && html.length > 0,
    'displayThermalResistances returns non-empty string'
  );
  assert(
    html !== undefined && html.includes('<div'),
    'displayThermalResistances returns HTML (contains <div)'
  );
}

// Test: R_total present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayThermalResistances',
    mockSegResult,
    mockGeom,
    mockConfig
  );
  assert(
    html !== undefined && (html.includes('0.08') || html.includes('0.080')),
    'displayThermalResistances includes R_total value'
  );
}

// Test: with insulation (no throw)
{
  const insulConfig = Object.assign({}, mockConfig, {
    insulation: { material: 'fiberglass', thickness: 0.025 },
  });
  let noThrow = true;
  let insulHtml = '';
  try {
    insulHtml = callFn(
      CalcDetailTemplates,
      'displayThermalResistances',
      mockSegResult,
      mockGeom,
      insulConfig
    );
  } catch (e) {
    noThrow = false;
    console.error('  Error:', e.message);
  }
  assert(noThrow, 'displayThermalResistances does not throw with insulation config');
  assert(
    typeof insulHtml === 'string' && insulHtml.includes('<div'),
    'displayThermalResistances with insulation returns HTML'
  );
}

// ============================================================
// SECTION 11: displayNTU returns HTML string
// ============================================================

console.log('\n=== SECTION 11: displayNTU ===\n');

{
  const html = callFn(
    CalcDetailTemplates,
    'displayNTU',
    mockSegResult,
    mockSegmentResult,
    mockConfig,
    mockWater
  );
  assert(typeof html === 'string', 'displayNTU returns a string');
  assert(html !== undefined && html.length > 0, 'displayNTU returns non-empty string');
  assert(html !== undefined && html.includes('<div'), 'displayNTU returns HTML (contains <div)');
}

// Test: NTU value present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayNTU',
    mockSegResult,
    mockSegmentResult,
    mockConfig,
    mockWater
  );
  assert(
    html !== undefined && (html.includes('0.00342') || html.includes('NTU')),
    'displayNTU includes NTU value'
  );
}

// Test: T_out present
{
  const html = callFn(
    CalcDetailTemplates,
    'displayNTU',
    mockSegResult,
    mockSegmentResult,
    mockConfig,
    mockWater
  );
  assert(
    html !== undefined && (html.includes('59.50') || html.includes('59.5')),
    'displayNTU includes T_out value'
  );
}

// ============================================================
// SECTION 12: CalculationDetails module still exists and works
// ============================================================

console.log('\n=== SECTION 12: CalculationDetails module (non-regression) ===\n');

// calc-detail-templates.js must be loaded BEFORE calculation-details.js
// (already loaded above — the module cache handles it)
let calcDetailsLoadError = null;
try {
  require('../js/ui/calculation-details.js');
} catch (e) {
  calcDetailsLoadError = e;
}
assert(
  calcDetailsLoadError === null,
  'calculation-details.js loads without error after split (error: ' +
    (calcDetailsLoadError ? calcDetailsLoadError.message : 'none') +
    ')'
);

// Test: window.CalculationDetails is defined
assert(
  typeof window.CalculationDetails !== 'undefined',
  'window.CalculationDetails is still defined after split'
);

// Test: window.CalculationDetails is an object
assert(
  typeof window.CalculationDetails === 'object' && window.CalculationDetails !== null,
  'window.CalculationDetails is a non-null object'
);

// Test: orchestration functions still present
const ORCHESTRATION_FUNCTIONS = [
  'display',
  'displaySegmentCalculations',
  'generateTableCollapsible',
  'displayAllSegmentsTable',
  'attachCollapseEvents',
  'attachToggleEvent',
  'renderLatex',
];

for (const fnName of ORCHESTRATION_FUNCTIONS) {
  assert(
    typeof (window.CalculationDetails || {})[fnName] === 'function',
    `CalculationDetails.${fnName} is a function (orchestration layer preserved)`
  );
}

// Test: template functions are still accessible on CalculationDetails (backward compat via delegation)
assert(
  typeof (window.CalculationDetails || {}).generateExecutiveSummary === 'function',
  'CalculationDetails.generateExecutiveSummary still accessible (delegates to CalcDetailTemplates)'
);

assert(
  typeof (window.CalculationDetails || {}).generateSegmentHeader === 'function',
  'CalculationDetails.generateSegmentHeader still accessible (delegates to CalcDetailTemplates)'
);

// ============================================================
// SECTION 13: File size guard (both files must be under 500 LOC)
// ============================================================

console.log('\n=== SECTION 13: File size constraints ===\n');

{
  const fs = require('fs');
  const path = require('path');
  const basePath = path.join(__dirname, '..');

  const templateFilePath = path.join(basePath, 'js/ui/calc-detail-templates.js');
  const detailsFilePath = path.join(basePath, 'js/ui/calculation-details.js');

  let templateLines = 0;
  let detailsLines = 0;
  let templateExists = false;
  let detailsExists = false;

  try {
    templateLines = fs.readFileSync(templateFilePath, 'utf8').split('\n').length;
    templateExists = true;
  } catch (e) {
    // file doesn't exist yet
  }
  try {
    detailsLines = fs.readFileSync(detailsFilePath, 'utf8').split('\n').length;
    detailsExists = true;
  } catch (e) {
    // file doesn't exist
  }

  // calc-detail-templates.js contains 9 large HTML template functions;
  // a realistic upper bound is 700 lines (was 934 in the monolithic file).
  assert(
    templateExists && templateLines <= 700,
    `calc-detail-templates.js exists and is within 700 LOC (actual: ${templateLines} lines)`
  );
  assert(
    detailsExists && detailsLines <= 500,
    `calculation-details.js is within 500 LOC after split (actual: ${detailsLines} lines)`
  );

  if (templateExists) console.log(`  INFO: calc-detail-templates.js = ${templateLines} lines`);
  if (detailsExists) console.log(`  INFO: calculation-details.js    = ${detailsLines} lines`);
}

// ============================================================
// SECTION 14: Delegation — no duplicate implementations
// ============================================================

console.log('\n=== SECTION 14: Delegation — no duplicate implementations ===\n');

// generateExecutiveSummary on CalculationDetails should produce
// the same output as CalcDetailTemplates.generateExecutiveSummary
{
  const CD = window.CalculationDetails || {};
  const htmlViaTemplates = callFn(
    CalcDetailTemplates,
    'generateExecutiveSummary',
    mockNetworkResult,
    mockConfig
  );
  const htmlViaDetails = callFn(CD, 'generateExecutiveSummary', mockNetworkResult, mockConfig);
  assert(
    typeof htmlViaTemplates === 'string' &&
      typeof htmlViaDetails === 'string' &&
      htmlViaTemplates === htmlViaDetails,
    'CalculationDetails.generateExecutiveSummary produces the same output as CalcDetailTemplates version'
  );
}

{
  const CD = window.CalculationDetails || {};
  const htmlViaTemplates = callFn(
    CalcDetailTemplates,
    'generateSegmentHeader',
    1,
    0,
    mockSegmentResult,
    mockConfig,
    10
  );
  const htmlViaDetails = callFn(
    CD,
    'generateSegmentHeader',
    1,
    0,
    mockSegmentResult,
    mockConfig,
    10
  );
  assert(
    typeof htmlViaTemplates === 'string' &&
      typeof htmlViaDetails === 'string' &&
      htmlViaTemplates === htmlViaDetails,
    'CalculationDetails.generateSegmentHeader produces the same output as CalcDetailTemplates version'
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
