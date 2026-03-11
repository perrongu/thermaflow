/**
 * test_bug_numSegments_2d.js
 *
 * Bug 1: 2D sensitivity analysis does not recalculate numSegments
 * when varying pipe length (L). The applyParameterValue() function
 * updates totalLength but leaves numSegments frozen at the base value.
 *
 * Expected formula: numSegments = Math.min(Math.max(Math.ceil(L/5), 10), 100)
 *
 * Since sensitivity-analysis.js is a UI module (requires window), we test
 * the formula logic and verify consistency with the 1D analysis rebuildConfig.
 *
 * Exécution: node tests/test_bug_numSegments_2d.js
 */

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assertEqual(actual, expected, message) {
  testsRun++;
  if (actual === expected) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(`    Attendu: ${expected}, Obtenu: ${actual}`);
  }
}

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
  }
}

// The numSegments formula (must be identical in both 1D and 2D)
function calcNumSegments(L) {
  return Math.min(Math.max(Math.ceil(L / 5), 10), 100);
}

console.log('\n=== Tests: Bug Fix - numSegments recalculation in 2D sensitivity ===\n');

console.log('Test 1: L=1m → numSegments=10 (minimum clamp)');
assertEqual(calcNumSegments(1), 10, 'L=1m → numSegments=10');

console.log('\nTest 2: L=50m → numSegments=10');
assertEqual(calcNumSegments(50), 10, 'L=50m → numSegments=10');

console.log('\nTest 3: L=100m → numSegments=20');
assertEqual(calcNumSegments(100), 20, 'L=100m → numSegments=20');

console.log('\nTest 4: L=500m → numSegments=100 (maximum clamp)');
assertEqual(calcNumSegments(500), 100, 'L=500m → numSegments=100');

console.log('\nTest 5: L=2500m → numSegments=100 (maximum clamp)');
assertEqual(calcNumSegments(2500), 100, 'L=2500m → numSegments=100');

// Test 6: Verify the fix exists in the source file by reading it
// numSegments recalc lives in sensitivity-matrix.js (applyParameterValue)
console.log('\nTest 6: Verify fix exists in sensitivity-matrix.js');
const fs = require('fs');
const source = fs.readFileSync('js/ui/sensitivity-matrix.js', 'utf8');

// The fix should contain: recalculate numSegments when L changes
const hasNumSegmentsRecalc =
  source.includes("paramKey === 'L'") &&
  source.includes('numSegments') &&
  source.includes('Math.ceil(displayValue / 5)');

assert(hasNumSegmentsRecalc, 'sensitivity-matrix.js contains numSegments recalc for L parameter');

// Test 7: Verify formula matches 1D rebuildConfig
console.log('\nTest 7: Verify formula matches 1D rebuildConfig');
const source1D = fs.readFileSync('js/ui/sensitivity-analysis-1d.js', 'utf8');
const has1DFormula = source1D.includes('Math.min(Math.max(Math.ceil(totalLength / 5), 10), 100)');
assert(has1DFormula, '1D rebuildConfig uses same numSegments formula');

// Test 8: Verify 2D uses matching formula pattern (in sensitivity-matrix.js)
console.log('\nTest 8: Verify 2D uses matching formula clamp values (10, 100)');
const match2D = source.match(
  /Math\.min\(Math\.max\(Math\.ceil\(displayValue\s*\/\s*5\),\s*(\d+)\),\s*(\d+)\)/
);
if (match2D) {
  assertEqual(parseInt(match2D[1]), 10, 'Min segments = 10');
  assertEqual(parseInt(match2D[2]), 100, 'Max segments = 100');
} else {
  testsRun += 2;
  testsFailed += 2;
  console.log('  ✗ Could not find numSegments formula in sensitivity-matrix.js');
}

// Test 9: Impact analysis — segment length consistency
console.log('\nTest 9: Segment length stays reasonable across L range');
const testLengths = [1, 10, 50, 100, 200, 500, 1000, 2500];
let allReasonable = true;
for (const L of testLengths) {
  const ns = calcNumSegments(L);
  const segLen = L / ns;
  // Segment length should be between 0.01m and 50m
  if (segLen < 0.01 || segLen > 50) {
    allReasonable = false;
    console.log(`  ✗ L=${L}m → ${ns} segments → segLen=${segLen.toFixed(2)}m (hors limites)`);
  }
}
testsRun++;
if (allReasonable) {
  testsPassed++;
  console.log('  ✓ Segment length reasonable for all test lengths');
} else {
  testsFailed++;
}

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Bug Fix numSegments 2D');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

process.exit(testsFailed > 0 ? 1 : 0);
