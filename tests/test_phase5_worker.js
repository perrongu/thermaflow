/**
 * test_phase5_worker.js
 *
 * Phase 5 Item 14 — Web Worker for 2D sensitivity matrix calculation
 *
 * Tests verify:
 *   - js/workers/sensitivity-worker.js file exists
 *   - Worker file has a window=self shim at the top
 *   - Worker file contains importScripts calls for all required modules
 *   - Worker file handles 'message' events with a 'calculate' type
 *   - Worker file posts back 'result' and 'error' message types
 *   - sensitivity-analysis.js contains Worker creation logic
 *   - sensitivity-analysis.js has fallback to synchronous calculation
 *   - All required modules are present in the correct dependency order
 *
 * Run: node tests/test_phase5_worker.js
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
// Section 1: Worker file existence
// ---------------------------------------------------------------------------

console.log('\n=== Section 1: Worker file existence ===\n');

assert(
  fileExists('js/workers/sensitivity-worker.js'),
  'js/workers/sensitivity-worker.js file exists'
);

// ---------------------------------------------------------------------------
// Section 2: Worker file — window=self shim
// ---------------------------------------------------------------------------

console.log('\n=== Section 2: Worker file — window=self shim ===\n');

let workerContent = '';
if (fileExists('js/workers/sensitivity-worker.js')) {
  workerContent = readFile('js/workers/sensitivity-worker.js');
}

assert(
  workerContent.includes("typeof window === 'undefined'") ||
    workerContent.includes('typeof window === "undefined"'),
  'Worker file checks typeof window === "undefined" for the shim'
);

assert(
  workerContent.includes('self.window = self') || workerContent.includes("self['window'] = self"),
  'Worker file sets self.window = self (window shim for Worker context)'
);

// ---------------------------------------------------------------------------
// Section 3: Worker file — importScripts calls
// ---------------------------------------------------------------------------

console.log('\n=== Section 3: Worker file — importScripts calls ===\n');

assert(workerContent.includes('importScripts('), 'Worker file contains importScripts() call');

// Constants
assert(workerContent.includes('constants/version.js'), 'Worker imports constants/version.js');

assert(
  workerContent.includes('constants/flow-regimes.js'),
  'Worker imports constants/flow-regimes.js'
);

assert(workerContent.includes('constants/thresholds.js'), 'Worker imports constants/thresholds.js');

assert(workerContent.includes('constants/roughness.js'), 'Worker imports constants/roughness.js');

// Data tables
assert(workerContent.includes('air-tables.js'), 'Worker imports data/fluids/air-tables.js');

assert(workerContent.includes('water-tables.js'), 'Worker imports data/fluids/water-tables.js');

assert(
  workerContent.includes('materials/properties.js') ||
    workerContent.includes('materials/properties'),
  'Worker imports data/materials/properties.js'
);

// Properties
assert(workerContent.includes('air-properties.js'), 'Worker imports properties/air-properties.js');

assert(
  workerContent.includes('water-properties.js'),
  'Worker imports properties/water-properties.js'
);

assert(
  workerContent.includes('material-properties.js'),
  'Worker imports properties/material-properties.js'
);

// Formulas
assert(workerContent.includes('formulas/reynolds.js'), 'Worker imports formulas/reynolds.js');

assert(workerContent.includes('formulas/geometry.js'), 'Worker imports formulas/geometry.js');

assert(
  workerContent.includes('formulas/pressure-basic.js'),
  'Worker imports formulas/pressure-basic.js'
);

// Correlations
assert(
  workerContent.includes('correlations/friction-factor.js'),
  'Worker imports correlations/friction-factor.js'
);

assert(
  workerContent.includes('correlations/nusselt-internal.js'),
  'Worker imports correlations/nusselt-internal.js'
);

assert(
  workerContent.includes('correlations/nusselt-external.js'),
  'Worker imports correlations/nusselt-external.js'
);

assert(
  workerContent.includes('correlations/radiation.js'),
  'Worker imports correlations/radiation.js'
);

// Calculations
assert(
  workerContent.includes('calculations/thermal-resistance.js'),
  'Worker imports calculations/thermal-resistance.js'
);

assert(
  workerContent.includes('calculations/heat-transfer.js'),
  'Worker imports calculations/heat-transfer.js'
);

// Engine
assert(workerContent.includes('engine/pipe-segment.js'), 'Worker imports engine/pipe-segment.js');

assert(workerContent.includes('engine/pipe-network.js'), 'Worker imports engine/pipe-network.js');

// UI dependencies for sensitivity-matrix
assert(
  workerContent.includes('ui/sensitivity-params.js'),
  'Worker imports ui/sensitivity-params.js'
);

assert(workerContent.includes('ui/utils.js'), 'Worker imports ui/utils.js');

assert(
  workerContent.includes('ui/sensitivity-matrix.js'),
  'Worker imports ui/sensitivity-matrix.js'
);

// ---------------------------------------------------------------------------
// Section 4: Worker file — dependency order
// ---------------------------------------------------------------------------

console.log('\n=== Section 4: Worker file — dependency order ===\n');

// version.js must come before flow-regimes.js
{
  const versionPos = workerContent.indexOf('constants/version.js');
  const flowRegimesPos = workerContent.indexOf('constants/flow-regimes.js');
  assert(
    versionPos !== -1 && flowRegimesPos !== -1 && versionPos < flowRegimesPos,
    'constants/version.js imported before constants/flow-regimes.js'
  );
}

// Data tables before properties
{
  const airTablesPos = workerContent.indexOf('air-tables.js');
  const airPropsPos = workerContent.indexOf('air-properties.js');
  assert(
    airTablesPos !== -1 && airPropsPos !== -1 && airTablesPos < airPropsPos,
    'air-tables.js imported before air-properties.js (data before properties)'
  );
}

{
  const waterTablesPos = workerContent.indexOf('water-tables.js');
  const waterPropsPos = workerContent.indexOf('water-properties.js');
  assert(
    waterTablesPos !== -1 && waterPropsPos !== -1 && waterTablesPos < waterPropsPos,
    'water-tables.js imported before water-properties.js (data before properties)'
  );
}

// Properties before formulas
{
  const waterPropsPos = workerContent.indexOf('water-properties.js');
  const reynoldsPos = workerContent.indexOf('formulas/reynolds.js');
  assert(
    waterPropsPos !== -1 && reynoldsPos !== -1 && waterPropsPos < reynoldsPos,
    'water-properties.js imported before formulas/reynolds.js (properties before formulas)'
  );
}

// Formulas before correlations
{
  const reynoldsPos = workerContent.indexOf('formulas/reynolds.js');
  const frictionPos = workerContent.indexOf('correlations/friction-factor.js');
  assert(
    reynoldsPos !== -1 && frictionPos !== -1 && reynoldsPos < frictionPos,
    'formulas/reynolds.js imported before correlations/friction-factor.js'
  );
}

// Correlations before calculations
{
  const radiationPos = workerContent.indexOf('correlations/radiation.js');
  const thermalResPos = workerContent.indexOf('calculations/thermal-resistance.js');
  assert(
    radiationPos !== -1 && thermalResPos !== -1 && radiationPos < thermalResPos,
    'correlations/radiation.js imported before calculations/thermal-resistance.js'
  );
}

// Calculations before engine
{
  const heatTransferPos = workerContent.indexOf('calculations/heat-transfer.js');
  const pipeSegmentPos = workerContent.indexOf('engine/pipe-segment.js');
  assert(
    heatTransferPos !== -1 && pipeSegmentPos !== -1 && heatTransferPos < pipeSegmentPos,
    'calculations/heat-transfer.js imported before engine/pipe-segment.js'
  );
}

// pipe-segment.js before pipe-network.js
{
  const pipeSegmentPos = workerContent.indexOf('engine/pipe-segment.js');
  const pipeNetworkPos = workerContent.indexOf('engine/pipe-network.js');
  assert(
    pipeSegmentPos !== -1 && pipeNetworkPos !== -1 && pipeSegmentPos < pipeNetworkPos,
    'engine/pipe-segment.js imported before engine/pipe-network.js'
  );
}

// sensitivity-params.js before sensitivity-matrix.js
{
  const paramsPos = workerContent.indexOf('ui/sensitivity-params.js');
  const matrixPos = workerContent.indexOf('ui/sensitivity-matrix.js');
  assert(
    paramsPos !== -1 && matrixPos !== -1 && paramsPos < matrixPos,
    'ui/sensitivity-params.js imported before ui/sensitivity-matrix.js'
  );
}

// utils.js before sensitivity-matrix.js
{
  const utilsPos = workerContent.indexOf('ui/utils.js');
  const matrixPos = workerContent.indexOf('ui/sensitivity-matrix.js');
  assert(
    utilsPos !== -1 && matrixPos !== -1 && utilsPos < matrixPos,
    'ui/utils.js imported before ui/sensitivity-matrix.js'
  );
}

// ---------------------------------------------------------------------------
// Section 5: Worker file — message event handling
// ---------------------------------------------------------------------------

console.log('\n=== Section 5: Worker file — message event handling ===\n');

assert(
  workerContent.includes("addEventListener('message'") ||
    workerContent.includes('addEventListener("message"') ||
    workerContent.includes('onmessage'),
  'Worker file listens for message events'
);

assert(
  workerContent.includes("type === 'calculate'") ||
    workerContent.includes('type === "calculate"') ||
    workerContent.includes("=== 'calculate'") ||
    workerContent.includes('=== "calculate"'),
  "Worker file handles 'calculate' message type"
);

assert(
  workerContent.includes("type: 'result'") || workerContent.includes('type: "result"'),
  "Worker file posts back message with type: 'result'"
);

assert(
  workerContent.includes("type: 'error'") || workerContent.includes('type: "error"'),
  "Worker file posts back message with type: 'error'"
);

assert(workerContent.includes('postMessage('), 'Worker file calls postMessage() to return results');

assert(
  workerContent.includes('SensitivityMatrix.calculateMatrix'),
  'Worker file calls SensitivityMatrix.calculateMatrix()'
);

assert(
  workerContent.includes('try') && workerContent.includes('catch'),
  'Worker file has try/catch for error handling'
);

// ---------------------------------------------------------------------------
// Section 6: sensitivity-analysis.js — Worker integration
// ---------------------------------------------------------------------------

console.log('\n=== Section 6: sensitivity-analysis.js — Worker integration ===\n');

let analysisContent = '';
if (fileExists('js/ui/sensitivity-analysis.js')) {
  analysisContent = readFile('js/ui/sensitivity-analysis.js');
}

assert(
  analysisContent.includes('new Worker(') || analysisContent.includes('Worker('),
  'sensitivity-analysis.js contains Worker creation logic'
);

assert(
  analysisContent.includes('sensitivity-worker.js'),
  'sensitivity-analysis.js references sensitivity-worker.js'
);

assert(
  analysisContent.includes("typeof Worker === 'undefined'") ||
    analysisContent.includes('typeof Worker === "undefined"') ||
    analysisContent.includes('typeof Worker !==') ||
    analysisContent.includes('workerSupported') ||
    analysisContent.includes('workerAvailable') ||
    analysisContent.includes('useWorker') ||
    analysisContent.includes('_worker') ||
    analysisContent.includes('worker ===') ||
    analysisContent.includes('worker !==') ||
    analysisContent.includes('fallback') ||
    analysisContent.includes('Worker !== '),
  'sensitivity-analysis.js has Worker availability check or fallback logic'
);

assert(
  analysisContent.includes("addEventListener('message'") ||
    analysisContent.includes('addEventListener("message"') ||
    analysisContent.includes('.onmessage'),
  'sensitivity-analysis.js listens for messages from Worker'
);

assert(
  analysisContent.includes('postMessage(') || analysisContent.includes('.postMessage('),
  'sensitivity-analysis.js posts messages to Worker'
);

assert(
  analysisContent.includes('onerror') ||
    analysisContent.includes('worker.onerror') ||
    analysisContent.includes("on('error'") ||
    analysisContent.includes("addEventListener('error'"),
  'sensitivity-analysis.js handles Worker errors'
);

// ---------------------------------------------------------------------------
// Section 7: Fallback — synchronous calculation still works in Node.js
// ---------------------------------------------------------------------------

console.log('\n=== Section 7: Fallback — SensitivityMatrix still loadable in Node.js ===\n');

// Set up minimal stubs required for loading sensitivity-matrix.js
if (typeof global.window === 'undefined') {
  global.window = {};
}

global.window.SensitivityParams = {
  PARAMETER_DEFINITIONS: {
    L: { label: 'Longueur', unit: 'm', path: ['totalLength'], min: 1, max: 2500 },
    T_amb: {
      label: 'Temperature ambiante',
      unit: 'C',
      path: ['ambient', 'T_amb'],
      min: -40,
      max: 50,
    },
  },
  getParameterLabel: (key) => key,
};

global.window.UIUtils = {
  deepCopy: (obj) => JSON.parse(JSON.stringify(obj)),
  showBannerError: () => {},
};

global.window.WaterProperties = {
  getWaterProperties: () => ({ rho: 1000 }),
};

global.window.calculatePipeNetwork = (config) => ({
  T_final: config.fluid ? config.fluid.T_in - 5 : 20,
  segments: [],
});

let matrixModuleLoaded = false;
let calculateMatrixWorks = false;

try {
  // Clear module cache to ensure fresh load
  const matrixPath = path.join(ROOT, 'js/ui/sensitivity-matrix.js');
  delete require.cache[matrixPath];
  require(matrixPath);
  matrixModuleLoaded = true;

  if (
    typeof window.SensitivityMatrix !== 'undefined' &&
    typeof window.SensitivityMatrix.calculateMatrix === 'function'
  ) {
    const testConfig = {
      totalLength: 100,
      numSegments: 10,
      fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
      ambient: { T_amb: -10, V_wind: 5.0 },
      geometry: { D_inner: 0.0525, D_outer: 0.0603 },
      insulation: null,
      meta: { hasInsulation: false, flowM3PerHr: 7.2 },
    };
    const result = window.SensitivityMatrix.calculateMatrix(
      testConfig,
      'L',
      'T_amb',
      { min: 50, max: 200 },
      { min: -20, max: 0 },
      2
    );
    if (result && Array.isArray(result.matrix) && result.matrix.length === 2) {
      calculateMatrixWorks = true;
    }
  }
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}

assert(matrixModuleLoaded, 'sensitivity-matrix.js still loads in Node.js (fallback works)');
assert(
  calculateMatrixWorks,
  'SensitivityMatrix.calculateMatrix() still works synchronously (fallback)'
);

// ---------------------------------------------------------------------------
// Section 8: No modification to calculation logic
// ---------------------------------------------------------------------------

console.log('\n=== Section 8: Calculation logic untouched in sensitivity-matrix.js ===\n');

let matrixFileContent = '';
if (fileExists('js/ui/sensitivity-matrix.js')) {
  matrixFileContent = readFile('js/ui/sensitivity-matrix.js');
}

assert(
  matrixFileContent.includes('function calculateMatrix('),
  'sensitivity-matrix.js still defines calculateMatrix function'
);

assert(
  matrixFileContent.includes('function applyParameterValue('),
  'sensitivity-matrix.js still defines applyParameterValue function'
);

assert(
  matrixFileContent.includes('function adjustConfigForStability('),
  'sensitivity-matrix.js still defines adjustConfigForStability function'
);

assert(
  !workerContent.includes('function calculateMatrix(') &&
    !workerContent.includes('function applyParameterValue('),
  'Worker file does NOT redefine calculation logic (delegates to SensitivityMatrix)'
);

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
