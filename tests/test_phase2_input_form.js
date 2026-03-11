/**
 * test_phase2_input_form.js
 *
 * Phase 2 Item 5 — Split input-form.js (786+ LOC) into three files:
 *   - js/ui/input-validation.js  (InputValidation)
 *   - js/ui/input-units.js       (InputUnits)
 *   - js/ui/input-form.js        (InputForm orchestrator, under 500 LOC)
 *
 * TDD: RED → GREEN → REFACTOR
 *
 * Run: node tests/test_phase2_input_form.js
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
 * Safely call fn() — if it throws, mark test as failed.
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

// ============================================================
// SETUP: Minimal browser environment for Node.js test
// ============================================================

if (typeof window === 'undefined') {
  global.window = {};
}

// DOM element stub factory — creates a realistic stub for inputs
function makeInputStub(opts = {}) {
  return {
    value: opts.value !== undefined ? String(opts.value) : '',
    defaultValue: opts.defaultValue !== undefined ? String(opts.defaultValue) : '',
    min: opts.min !== undefined ? String(opts.min) : '',
    max: opts.max !== undefined ? String(opts.max) : '',
    classList: {
      _classes: new Set(),
      add(cls) {
        this._classes.add(cls);
      },
      remove(cls) {
        this._classes.delete(cls);
      },
      contains(cls) {
        return this._classes.has(cls);
      },
    },
    selectionStart: 0,
    selectionEnd: 0,
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    dispatchEvent() {},
    focus() {},
    previousElementSibling: null,
  };
}

// Minimal clipboard stub
function makeClipboardEvent(text) {
  return {
    clipboardData: { getData: () => text },
    preventDefault: () => {},
    _prevented: false,
  };
}

const domStub = {
  style: {},
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  textContent: '',
  innerHTML: '',
  value: '',
  min: '',
  max: '',
  defaultValue: '',
  selectionStart: 0,
  selectionEnd: 0,
  setSelectionRange() {},
  dispatchEvent() {},
  focus() {},
  previousElementSibling: null,
};

global.document = {
  getElementById: () => domStub,
  querySelector: () => domStub,
  querySelectorAll: () => [],
  addEventListener: () => {},
};

// Minimal UIUtils stub (used by input-validation.js)
global.window.UIUtils = {
  showValidationError: () => {},
  clearValidationErrors: () => {},
  debounce: (fn, delay) => {
    const debounced = (...args) => fn(...args);
    debounced.cancel = () => {};
    return debounced;
  },
};

// Minimal UnitConverter stub (used by input-validation.js validateForm)
global.window.UnitConverter = {
  getRanges: (type) => {
    if (type === 'pressure') return { min: 100, max: 1000, decimals: 0 };
    if (type === 'flowRate') return { min: 0.06, max: 30, decimals: 2 };
    return { min: 0, max: 100, decimals: 2 };
  },
  getUnitInfo: (type) => ({ label: type === 'pressure' ? 'kPag' : 'm³/hr', decimals: 2 }),
  convert: (type, value) => value,
  setUnit: () => {},
  loadPreferences: () => {},
  toSI: (type, value) => value,
};

// Minimal Storage stub (used by input-units.js)
global.window.Storage = {
  load: () => null,
  save: () => {},
};

// ============================================================
// MODULE A: InputValidation
// ============================================================

console.log('\n=== MODULE A: InputValidation ===\n');

// Test 1: input-validation.js loads without error
let inputValidationLoaded = false;
try {
  require('../js/ui/input-validation.js');
  inputValidationLoaded = true;
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}
assert(inputValidationLoaded, 'input-validation.js loads without error');

// Test 2: window.InputValidation is defined
assert(
  typeof window.InputValidation !== 'undefined',
  'window.InputValidation is defined after loading input-validation.js'
);

// Test 3: module.exports returns InputValidation (dual export)
let InputValidation = {};
try {
  InputValidation = require('../js/ui/input-validation.js') || {};
} catch (e) {
  /* fail on function tests below */
}
assert(
  typeof InputValidation !== 'undefined' && InputValidation !== null,
  'module.exports returns an InputValidation object (dual export)'
);

// Test 4: validateForm function exists
assert(
  typeof InputValidation.validateForm === 'function',
  'InputValidation.validateForm is a function'
);

// Test 5: validateInputVisual function exists
assert(
  typeof InputValidation.validateInputVisual === 'function',
  'InputValidation.validateInputVisual is a function'
);

// Test 6: clampInputValue function exists
assert(
  typeof InputValidation.clampInputValue === 'function',
  'InputValidation.clampInputValue is a function'
);

// Test 7: handleCommaKeypress function exists
assert(
  typeof InputValidation.handleCommaKeypress === 'function',
  'InputValidation.handleCommaKeypress is a function'
);

// Test 8: handleCommaPaste function exists
assert(
  typeof InputValidation.handleCommaPaste === 'function',
  'InputValidation.handleCommaPaste is a function'
);

// Test 9: window.InputValidation exposes same functions
const winIV = window.InputValidation || {};
assert(
  typeof winIV.validateForm === 'function',
  'window.InputValidation.validateForm is a function'
);
assert(
  typeof winIV.validateInputVisual === 'function',
  'window.InputValidation.validateInputVisual is a function'
);
assert(
  typeof winIV.clampInputValue === 'function',
  'window.InputValidation.clampInputValue is a function'
);
assert(
  typeof winIV.handleCommaKeypress === 'function',
  'window.InputValidation.handleCommaKeypress is a function'
);
assert(
  typeof winIV.handleCommaPaste === 'function',
  'window.InputValidation.handleCommaPaste is a function'
);

// ============================================================
// MODULE A BEHAVIOUR: validateInputVisual
// ============================================================

console.log('\n=== InputValidation.validateInputVisual behaviour ===\n');

// Test 14: valid value within range removes invalid class
{
  const input = makeInputStub({ value: '50', min: '0', max: '100' });
  input.classList._classes.add('param-input--invalid'); // pre-existing class
  safeRun(
    () => InputValidation.validateInputVisual(input),
    'validateInputVisual executes for test 14'
  );
  assert(
    !input.classList._classes.has('param-input--invalid'),
    'validateInputVisual removes param-input--invalid for valid value within range'
  );
}

// Test 15: value below min adds invalid class
{
  const input = makeInputStub({ value: '-5', min: '0', max: '100' });
  safeRun(
    () => InputValidation.validateInputVisual(input),
    'validateInputVisual executes for test 15'
  );
  assert(
    input.classList._classes.has('param-input--invalid'),
    'validateInputVisual adds param-input--invalid when value is below min'
  );
}

// Test 16: value above max adds invalid class
{
  const input = makeInputStub({ value: '200', min: '0', max: '100' });
  safeRun(
    () => InputValidation.validateInputVisual(input),
    'validateInputVisual executes for test 16'
  );
  assert(
    input.classList._classes.has('param-input--invalid'),
    'validateInputVisual adds param-input--invalid when value is above max'
  );
}

// Test 17: NaN value adds invalid class
{
  const input = makeInputStub({ value: 'abc', min: '0', max: '100' });
  safeRun(
    () => InputValidation.validateInputVisual(input),
    'validateInputVisual executes for test 17'
  );
  assert(
    input.classList._classes.has('param-input--invalid'),
    'validateInputVisual adds param-input--invalid for NaN value'
  );
}

// ============================================================
// MODULE A BEHAVIOUR: clampInputValue
// ============================================================

console.log('\n=== InputValidation.clampInputValue behaviour ===\n');

// Test 18: value within range stays unchanged
{
  const input = makeInputStub({ value: '50', min: '0', max: '100' });
  safeRun(() => InputValidation.clampInputValue(input), 'clampInputValue executes for test 18');
  assert(parseFloat(input.value) === 50, 'clampInputValue leaves valid value unchanged');
}

// Test 19: value below min is clamped to min
{
  const input = makeInputStub({ value: '-10', min: '0', max: '100' });
  safeRun(() => InputValidation.clampInputValue(input), 'clampInputValue executes for test 19');
  assert(parseFloat(input.value) === 0, 'clampInputValue clamps value below min to min');
}

// Test 20: value above max is clamped to max
{
  const input = makeInputStub({ value: '150', min: '0', max: '100' });
  safeRun(() => InputValidation.clampInputValue(input), 'clampInputValue executes for test 20');
  assert(parseFloat(input.value) === 100, 'clampInputValue clamps value above max to max');
}

// Test 21: NaN value is replaced with defaultValue when set
{
  const input = makeInputStub({ value: 'bad', min: '0', max: '100', defaultValue: '42' });
  safeRun(() => InputValidation.clampInputValue(input), 'clampInputValue executes for test 21');
  assert(parseFloat(input.value) === 42, 'clampInputValue uses defaultValue when input is NaN');
}

// Test 22: NaN value with no defaultValue uses min
{
  const input = makeInputStub({ value: 'bad', min: '5', max: '100' });
  safeRun(() => InputValidation.clampInputValue(input), 'clampInputValue executes for test 22');
  assert(
    parseFloat(input.value) === 5,
    'clampInputValue falls back to min when NaN and no defaultValue'
  );
}

// ============================================================
// MODULE A BEHAVIOUR: handleCommaKeypress
// ============================================================

console.log('\n=== InputValidation.handleCommaKeypress behaviour ===\n');

// Test 23: comma key is replaced with dot
{
  const input = makeInputStub({ value: '3' });
  input.selectionStart = 1;
  input.selectionEnd = 1;
  let prevented = false;
  const event = {
    key: ',',
    preventDefault: () => {
      prevented = true;
    },
  };
  safeRun(
    () => InputValidation.handleCommaKeypress(event, input),
    'handleCommaKeypress executes for test 23'
  );
  assert(prevented, 'handleCommaKeypress calls preventDefault for comma key');
  assert(
    input.value === '3.',
    `handleCommaKeypress inserts dot after digit (got "${input.value}")`
  );
}

// Test 24: Decimal key is also replaced with dot
{
  const input = makeInputStub({ value: '' });
  input.selectionStart = 0;
  input.selectionEnd = 0;
  let prevented = false;
  const event = {
    key: 'Decimal',
    preventDefault: () => {
      prevented = true;
    },
  };
  safeRun(
    () => InputValidation.handleCommaKeypress(event, input),
    'handleCommaKeypress executes for test 24'
  );
  assert(prevented, 'handleCommaKeypress calls preventDefault for Decimal key');
}

// Test 25: non-comma key is not affected
{
  const input = makeInputStub({ value: '3' });
  let prevented = false;
  const event = {
    key: '5',
    preventDefault: () => {
      prevented = true;
    },
  };
  safeRun(
    () => InputValidation.handleCommaKeypress(event, input),
    'handleCommaKeypress executes for test 25'
  );
  assert(!prevented, 'handleCommaKeypress does not preventDefault for non-comma key');
}

// Test 26: second comma is ignored when dot already present
{
  const input = makeInputStub({ value: '3.1' });
  input.selectionStart = 3;
  input.selectionEnd = 3;
  const event = { key: ',', preventDefault: () => {} };
  safeRun(
    () => InputValidation.handleCommaKeypress(event, input),
    'handleCommaKeypress executes for test 26'
  );
  // Value must stay as "3.1" — no second dot should be inserted
  assert(
    input.value === '3.1' && input.value.split('.').length === 2,
    'handleCommaKeypress does not insert second dot when dot already present'
  );
}

// ============================================================
// MODULE A BEHAVIOUR: handleCommaPaste
// ============================================================

console.log('\n=== InputValidation.handleCommaPaste behaviour ===\n');

// Test 27: paste with comma replaces comma with dot
{
  const input = makeInputStub({ value: '' });
  input.selectionStart = 0;
  input.selectionEnd = 0;
  let prevented = false;
  const event = {
    clipboardData: { getData: () => '3,14' },
    preventDefault: () => {
      prevented = true;
    },
  };
  safeRun(
    () => InputValidation.handleCommaPaste(event, input),
    'handleCommaPaste executes for test 27'
  );
  assert(prevented, 'handleCommaPaste calls preventDefault when pasted text contains comma');
  assert(input.value === '3.14', `handleCommaPaste replaces comma with dot (got "${input.value}")`);
}

// Test 28: paste without comma is not affected
{
  const input = makeInputStub({ value: '' });
  let prevented = false;
  const event = {
    clipboardData: { getData: () => '3.14' },
    preventDefault: () => {
      prevented = true;
    },
  };
  safeRun(
    () => InputValidation.handleCommaPaste(event, input),
    'handleCommaPaste executes for test 28'
  );
  assert(!prevented, 'handleCommaPaste does not preventDefault for paste without comma');
}

// ============================================================
// MODULE A BEHAVIOUR: validateForm returns { valid, errors }
// ============================================================

console.log('\n=== InputValidation.validateForm returns { valid, errors } ===\n');

// Test 29: validateForm returns an object with valid and errors properties
{
  // Build a set of elements that are all valid
  const elements = {
    pipeMaterial: makeInputStub({ value: 'steel' }),
    pipeSchedule: makeInputStub({ value: '40' }),
    pipeNPS: makeInputStub({ value: '4' }),
    pipeLength: makeInputStub({ value: '100', min: '1', max: '2500' }),
    waterTemp: makeInputStub({ value: '60', min: '1', max: '100' }),
    waterFlow: makeInputStub({ value: '10', min: '0.06', max: '30' }),
    waterPressure: makeInputStub({ value: '500', min: '100', max: '1000' }),
    airTemp: makeInputStub({ value: '-10', min: '-50', max: '30' }),
    windSpeed: makeInputStub({ value: '20', min: '0', max: '108' }),
  };

  let result = null;
  safeRun(() => {
    result = InputValidation.validateForm(elements);
  }, 'validateForm executes for test 29');
  assert(result !== null && typeof result === 'object', 'validateForm returns an object');
  assert(
    result !== null && typeof result.valid === 'boolean',
    'validateForm result has a boolean "valid" property'
  );
  assert(
    result !== null && Array.isArray(result.errors),
    'validateForm result has an "errors" array property'
  );
}

// Test 30: validateForm returns valid=true and empty errors for valid input
{
  const elements = {
    pipeMaterial: makeInputStub({ value: 'steel' }),
    pipeSchedule: makeInputStub({ value: '40' }),
    pipeNPS: makeInputStub({ value: '4' }),
    pipeLength: makeInputStub({ value: '100', min: '1', max: '2500' }),
    waterTemp: makeInputStub({ value: '60', min: '1', max: '100' }),
    waterFlow: makeInputStub({ value: '10', min: '0.06', max: '30' }),
    waterPressure: makeInputStub({ value: '500', min: '100', max: '1000' }),
    airTemp: makeInputStub({ value: '-10', min: '-50', max: '30' }),
    windSpeed: makeInputStub({ value: '20', min: '0', max: '108' }),
  };

  let result = null;
  safeRun(() => {
    result = InputValidation.validateForm(elements);
  }, 'validateForm executes for test 30');
  assert(result && result.valid === true, 'validateForm returns valid=true for valid inputs');
  assert(
    result && result.errors.length === 0,
    'validateForm returns empty errors array for valid inputs'
  );
}

// Test 31: validateForm returns valid=false when a required field is missing
{
  const elements = {
    pipeMaterial: makeInputStub({ value: 'steel' }),
    pipeSchedule: makeInputStub({ value: '40' }),
    pipeNPS: makeInputStub({ value: '4' }),
    pipeLength: makeInputStub({ value: '', min: '1', max: '2500' }), // missing
    waterTemp: makeInputStub({ value: '60', min: '1', max: '100' }),
    waterFlow: makeInputStub({ value: '10', min: '0.06', max: '30' }),
    waterPressure: makeInputStub({ value: '500', min: '100', max: '1000' }),
    airTemp: makeInputStub({ value: '-10', min: '-50', max: '30' }),
    windSpeed: makeInputStub({ value: '20', min: '0', max: '108' }),
  };

  let result = null;
  safeRun(() => {
    result = InputValidation.validateForm(elements);
  }, 'validateForm executes for test 31');
  assert(
    result && result.valid === false,
    'validateForm returns valid=false when required field is empty'
  );
  assert(
    result && result.errors.length > 0,
    'validateForm returns non-empty errors when required field is empty'
  );
}

// Test 32: validateForm returns valid=false when pipeLength is out of range
{
  const elements = {
    pipeMaterial: makeInputStub({ value: 'steel' }),
    pipeSchedule: makeInputStub({ value: '40' }),
    pipeNPS: makeInputStub({ value: '4' }),
    pipeLength: makeInputStub({ value: '9999', min: '1', max: '2500' }), // too big
    waterTemp: makeInputStub({ value: '60', min: '1', max: '100' }),
    waterFlow: makeInputStub({ value: '10', min: '0.06', max: '30' }),
    waterPressure: makeInputStub({ value: '500', min: '100', max: '1000' }),
    airTemp: makeInputStub({ value: '-10', min: '-50', max: '30' }),
    windSpeed: makeInputStub({ value: '20', min: '0', max: '108' }),
  };

  let result = null;
  safeRun(() => {
    result = InputValidation.validateForm(elements);
  }, 'validateForm executes for test 32');
  assert(
    result && result.valid === false,
    'validateForm returns valid=false when pipeLength is out of range'
  );
}

// Test 33: validateForm returns valid=false when element is null (not yet in DOM)
{
  const elements = {
    pipeMaterial: makeInputStub({ value: 'steel' }),
    pipeSchedule: makeInputStub({ value: '40' }),
    pipeNPS: makeInputStub({ value: '4' }),
    pipeLength: null, // not yet created (SVG inputs)
    waterTemp: makeInputStub({ value: '60' }),
    waterFlow: makeInputStub({ value: '10' }),
    waterPressure: makeInputStub({ value: '500' }),
    airTemp: makeInputStub({ value: '-10' }),
    windSpeed: makeInputStub({ value: '20' }),
  };

  let result = null;
  safeRun(() => {
    result = InputValidation.validateForm(elements);
  }, 'validateForm executes for test 33');
  assert(
    result && result.valid === false,
    'validateForm returns valid=false when a required element is null (not yet in DOM)'
  );
}

// Test 34: validateForm collects multiple errors (does not stop at first)
{
  const elements = {
    pipeMaterial: makeInputStub({ value: 'steel' }),
    pipeSchedule: makeInputStub({ value: '40' }),
    pipeNPS: makeInputStub({ value: '4' }),
    pipeLength: makeInputStub({ value: '9999', min: '1', max: '2500' }), // out of range
    waterTemp: makeInputStub({ value: '999', min: '1', max: '100' }), // out of range
    waterFlow: makeInputStub({ value: '10', min: '0.06', max: '30' }),
    waterPressure: makeInputStub({ value: '500', min: '100', max: '1000' }),
    airTemp: makeInputStub({ value: '-10', min: '-50', max: '30' }),
    windSpeed: makeInputStub({ value: '20', min: '0', max: '108' }),
  };

  let result = null;
  safeRun(() => {
    result = InputValidation.validateForm(elements);
  }, 'validateForm executes for test 34');
  assert(
    result && result.errors.length >= 2,
    'validateForm collects multiple errors without stopping at first'
  );
}

// ============================================================
// MODULE B: InputUnits
// ============================================================

console.log('\n=== MODULE B: InputUnits ===\n');

// Test 35: input-units.js loads without error
let inputUnitsLoaded = false;
try {
  require('../js/ui/input-units.js');
  inputUnitsLoaded = true;
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}
assert(inputUnitsLoaded, 'input-units.js loads without error');

// Test 36: window.InputUnits is defined
assert(
  typeof window.InputUnits !== 'undefined',
  'window.InputUnits is defined after loading input-units.js'
);

// Test 37: module.exports returns InputUnits (dual export)
let InputUnits = {};
try {
  InputUnits = require('../js/ui/input-units.js') || {};
} catch (e) {
  /* fail on function tests below */
}
assert(
  typeof InputUnits !== 'undefined' && InputUnits !== null,
  'module.exports returns an InputUnits object (dual export)'
);

// Test 38: loadUnitPreferences function exists
assert(
  typeof InputUnits.loadUnitPreferences === 'function',
  'InputUnits.loadUnitPreferences is a function'
);

// Test 39: applyUnitPreferences function exists
assert(
  typeof InputUnits.applyUnitPreferences === 'function',
  'InputUnits.applyUnitPreferences is a function'
);

// Test 40: attachUnitChangeEvents function exists
assert(
  typeof InputUnits.attachUnitChangeEvents === 'function',
  'InputUnits.attachUnitChangeEvents is a function'
);

// Test 41: handleUnitChange function exists
assert(
  typeof InputUnits.handleUnitChange === 'function',
  'InputUnits.handleUnitChange is a function'
);

// Test 42: updateInputRanges function exists
assert(
  typeof InputUnits.updateInputRanges === 'function',
  'InputUnits.updateInputRanges is a function'
);

// Test 43: saveUnitPreferences function exists
assert(
  typeof InputUnits.saveUnitPreferences === 'function',
  'InputUnits.saveUnitPreferences is a function'
);

// Test 44: window.InputUnits exposes same functions
const winIU = window.InputUnits || {};
assert(
  typeof winIU.loadUnitPreferences === 'function',
  'window.InputUnits.loadUnitPreferences is a function'
);
assert(
  typeof winIU.applyUnitPreferences === 'function',
  'window.InputUnits.applyUnitPreferences is a function'
);
assert(
  typeof winIU.attachUnitChangeEvents === 'function',
  'window.InputUnits.attachUnitChangeEvents is a function'
);
assert(
  typeof winIU.handleUnitChange === 'function',
  'window.InputUnits.handleUnitChange is a function'
);
assert(
  typeof winIU.updateInputRanges === 'function',
  'window.InputUnits.updateInputRanges is a function'
);
assert(
  typeof winIU.saveUnitPreferences === 'function',
  'window.InputUnits.saveUnitPreferences is a function'
);

// ============================================================
// MODULE B BEHAVIOUR: loadUnitPreferences
// ============================================================

console.log('\n=== InputUnits.loadUnitPreferences behaviour ===\n');

// Test 50: loadUnitPreferences runs without error when Storage returns null
{
  global.window.Storage = { load: () => null, save: () => {} };
  let noThrow = true;
  try {
    InputUnits.loadUnitPreferences();
  } catch (e) {
    noThrow = false;
    console.error(`  Error: ${e.message}`);
  }
  assert(noThrow, 'loadUnitPreferences executes without error when Storage returns null');
}

// Test 51: loadUnitPreferences runs without error when Storage returns saved preferences
{
  global.window.Storage = {
    load: () => ({ unitPreferences: { flowRate: 'kg_s', pressure: 'psig' } }),
    save: () => {},
  };
  let noThrow = true;
  try {
    InputUnits.loadUnitPreferences();
  } catch (e) {
    noThrow = false;
    console.error(`  Error: ${e.message}`);
  }
  assert(noThrow, 'loadUnitPreferences executes without error with saved preferences');
  // Restore
  global.window.Storage = { load: () => null, save: () => {} };
}

// ============================================================
// MODULE B BEHAVIOUR: updateInputRanges
// ============================================================

console.log('\n=== InputUnits.updateInputRanges behaviour ===\n');

// Test 52: updateInputRanges executes without error when elements are not in DOM
{
  global.document.getElementById = () => null;
  let noThrow = true;
  try {
    InputUnits.updateInputRanges();
  } catch (e) {
    noThrow = false;
    console.error(`  Error: ${e.message}`);
  }
  assert(noThrow, 'updateInputRanges executes without error when DOM elements do not exist');
  global.document.getElementById = () => domStub;
}

// Test 53: updateInputRanges sets min/max on flow input from UnitConverter.getRanges
{
  const flowInput = makeInputStub({ value: '10' });
  const pressureInput = makeInputStub({ value: '500' });
  global.document.getElementById = (id) => {
    if (id === 'water-flow') return flowInput;
    if (id === 'water-pressure') return pressureInput;
    return null;
  };
  safeRun(() => InputUnits.updateInputRanges(), 'updateInputRanges executes for test 53');
  assert(
    parseFloat(flowInput.min) === 0.06,
    `updateInputRanges sets flowInput.min from UnitConverter (got ${flowInput.min})`
  );
  assert(
    parseFloat(flowInput.max) === 30,
    `updateInputRanges sets flowInput.max from UnitConverter (got ${flowInput.max})`
  );
  global.document.getElementById = () => domStub;
}

// ============================================================
// MODULE C: InputForm (updated orchestrator)
// ============================================================

console.log('\n=== MODULE C: InputForm ===\n');

// Provide stubs required by input-form.js at load time
global.window.MaterialRoughness = {
  MATERIAL_ROUGHNESS: { steel: 0.046e-3, copper: 0.0015e-3, stainless_steel: 0.015e-3 },
};
global.window.PipeSpecsLoader = {
  usesTypes: () => false,
  getAvailableSchedules: () => ['40'],
  getAvailableNPS: () => [4],
  getPipeSpecs: () => ({ OD: 114.3, ID: 102.26, WT: 6.02 }),
};
global.window.PipeDiagram = { init: () => {}, update: () => {} };
global.window.WaterProperties = {
  getWaterProperties: () => ({ rho: 988 }),
};

// Test 54: input-form.js loads without error after extraction
let inputFormLoaded = false;
try {
  require('../js/ui/input-form.js');
  inputFormLoaded = true;
} catch (e) {
  console.error(`  Load error: ${e.message}`);
}
assert(inputFormLoaded, 'input-form.js loads without error after extraction');

// Test 55: window.InputForm is defined
assert(
  typeof window.InputForm !== 'undefined',
  'window.InputForm is defined after loading input-form.js'
);

// Test 56: InputForm.init is a function
let InputForm = {};
try {
  InputForm = require('../js/ui/input-form.js') || {};
} catch (e) {
  /* fail on function tests */
}
assert(typeof InputForm.init === 'function', 'InputForm.init is a function');

// Test 57: InputForm.triggerAnalysis is a function
assert(typeof InputForm.triggerAnalysis === 'function', 'InputForm.triggerAnalysis is a function');

// Test 58: window.InputForm exposes init and triggerAnalysis
const winIF = window.InputForm || {};
assert(typeof winIF.init === 'function', 'window.InputForm.init is a function');
assert(
  typeof winIF.triggerAnalysis === 'function',
  'window.InputForm.triggerAnalysis is a function'
);

// ============================================================
// FILE SIZE CONSTRAINTS
// ============================================================

console.log('\n=== File size constraints (under 500 LOC each) ===\n');

const fs = require('fs');
const path = require('path');

// Test 59: input-validation.js is under 500 LOC
{
  const filePath = path.join(__dirname, '../js/ui/input-validation.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // File does not exist yet — will fail
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `input-validation.js is under 500 LOC (actual: ${lineCount})`
  );
}

// Test 60: input-units.js is under 500 LOC
{
  const filePath = path.join(__dirname, '../js/ui/input-units.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // File does not exist yet — will fail
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `input-units.js is under 500 LOC (actual: ${lineCount})`
  );
}

// Test 61: input-form.js is under 500 LOC after extraction
{
  const filePath = path.join(__dirname, '../js/ui/input-form.js');
  let lineCount = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    lineCount = content.split('\n').length;
  } catch (e) {
    // Should exist
  }
  assert(
    lineCount > 0 && lineCount <= 500,
    `input-form.js is under 500 LOC after extraction (actual: ${lineCount})`
  );
}

// ============================================================
// INDEX.HTML SCRIPT LOADING ORDER
// ============================================================

console.log('\n=== index.html script loading order ===\n');

const indexHtmlPath = path.join(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Test 62: input-validation.js script tag exists in index.html
assert(
  indexHtml.includes('input-validation.js'),
  'index.html contains <script src="...input-validation.js">'
);

// Test 63: input-units.js script tag exists in index.html
assert(
  indexHtml.includes('input-units.js'),
  'index.html contains <script src="...input-units.js">'
);

// Test 64: input-validation.js loads before input-form.js in index.html
{
  const validationPos = indexHtml.indexOf('input-validation.js');
  const formPos = indexHtml.indexOf('input-form.js');
  assert(
    validationPos !== -1 && formPos !== -1 && validationPos < formPos,
    'input-validation.js script tag appears before input-form.js in index.html'
  );
}

// Test 65: input-units.js loads before input-form.js in index.html
{
  const unitsPos = indexHtml.indexOf('input-units.js');
  const formPos = indexHtml.indexOf('input-form.js');
  assert(
    unitsPos !== -1 && formPos !== -1 && unitsPos < formPos,
    'input-units.js script tag appears before input-form.js in index.html'
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
