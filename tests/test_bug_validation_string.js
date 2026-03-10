/**
 * test_bug_validation_string.js
 *
 * Bug 1: validateForm() compares DOM string values directly against numbers.
 *
 * JS coercion: "" → 0, "abc" → NaN. NaN comparisons always return false,
 * so "abc" < 1 → false, "abc" > 2500 → false → passes validation!
 * Empty string coerces to 0, which passes if 0 is in range (airTemp, windSpeed).
 *
 * Exécution: node tests/test_bug_validation_string.js
 */

let testsTotal = 0;
let testsPassed = 0;

function assert(condition, message) {
  testsTotal++;
  if (condition) {
    testsPassed++;
  } else {
    console.error(`  ❌ ÉCHEC: ${message}`);
  }
}

/**
 * Simulate CURRENT (buggy) validation: string compared directly with < and >.
 * Returns true if value is "in range" (i.e., validation passes).
 */
function buggyRangeCheck(stringValue, min, max) {
  return !(stringValue < min || stringValue > max);
}

/**
 * Simulate CORRECT validation: parseFloat first, reject NaN.
 */
function correctRangeCheck(stringValue, min, max) {
  const numValue = parseFloat(stringValue);
  if (isNaN(numValue)) {
    return false;
  }
  return !(numValue < min || numValue > max);
}

console.log('=== Test Bug 1: String comparison in form validation ===\n');

// --- Demonstrate the bug with non-numeric input ---
console.log('--- Bug: non-numeric strings pass validation ---');

// "abc" → NaN. NaN < 1 → false, NaN > 2500 → false → passes!
assert(
  buggyRangeCheck('abc', 1, 2500) === true,
  'Bug confirmed: "abc" passes buggy pipeLength check (1-2500)'
);
assert(
  buggyRangeCheck('abc', -50, 30) === true,
  'Bug confirmed: "abc" passes buggy airTemp check (-50 to 30)'
);
assert(
  buggyRangeCheck('abc', 0, 108) === true,
  'Bug confirmed: "abc" passes buggy windSpeed check (0-108)'
);

// Empty string when 0 is in range: "" → 0, and 0 >= -50 && 0 <= 30 → passes
console.log('\n--- Bug: empty string treated as 0 (wrong for fields where 0 is in range) ---');
assert(
  buggyRangeCheck('', -50, 30) === true,
  'Bug confirmed: empty string passes airTemp check (0 is in [-50,30])'
);
assert(
  buggyRangeCheck('', 0, 108) === true,
  'Bug confirmed: empty string passes windSpeed check (0 is in [0,108])'
);

// --- Correct behavior ---
console.log('\n--- Correct behavior (after fix) ---');

// Non-numeric rejected
assert(correctRangeCheck('abc', 1, 2500) === false, '"abc" rejected for pipeLength');
assert(correctRangeCheck('abc', -50, 30) === false, '"abc" rejected for airTemp');
assert(correctRangeCheck('', -50, 30) === false, 'Empty string rejected for airTemp');
assert(correctRangeCheck('', 0, 108) === false, 'Empty string rejected for windSpeed');

// Valid numbers pass
assert(correctRangeCheck('100', 1, 2500) === true, '"100" passes pipeLength');
assert(correctRangeCheck('5', 1, 100) === true, '"5" passes waterTemp');
assert(correctRangeCheck('-20', -50, 30) === true, '"-20" passes airTemp');
assert(correctRangeCheck('50', 0, 108) === true, '"50" passes windSpeed');
assert(correctRangeCheck('0', 0, 108) === true, '"0" passes windSpeed (valid boundary)');

// Boundary values pass
assert(correctRangeCheck('1', 1, 2500) === true, 'Min boundary "1" passes');
assert(correctRangeCheck('2500', 1, 2500) === true, 'Max boundary "2500" passes');

// Out of range rejected
assert(correctRangeCheck('0', 1, 2500) === false, '"0" rejected (below min=1)');
assert(correctRangeCheck('3000', 1, 2500) === false, '"3000" rejected (above max=2500)');
assert(correctRangeCheck('-60', -50, 30) === false, '"-60" rejected (below min=-50)');
assert(correctRangeCheck('110', 0, 108) === false, '"110" rejected (above max=108)');

// Summary
console.log(`\n=== Résultats: ${testsPassed}/${testsTotal} tests réussis ===`);
if (testsPassed === testsTotal) {
  console.log('✅ Tous les tests passent');
} else {
  console.error(`❌ ${testsTotal - testsPassed} test(s) échoué(s)`);
  process.exit(1);
}
