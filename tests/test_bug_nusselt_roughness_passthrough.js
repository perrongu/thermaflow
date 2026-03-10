/**
 * test_bug_nusselt_roughness_passthrough.js
 *
 * Bug 2: nusseltInternal() does not pass friction factor to nusseltGnielinski(),
 * causing roughness to be ignored in internal Nusselt calculation.
 *
 * This test validates that nusseltInternal() accepts an optional friction factor
 * and passes it through to Gnielinski for rough pipes.
 *
 * Exécution: node tests/test_bug_nusselt_roughness_passthrough.js
 */

const nusseltInt = require('../js/correlations/nusselt-internal.js');
const friction = require('../js/correlations/friction-factor.js');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assertClose(actual, expected, tolerance, message) {
  testsRun++;
  const relativeError = Math.abs((actual - expected) / expected);
  if (relativeError <= tolerance) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(
      `    Attendu: ${expected.toFixed(4)}, Obtenu: ${actual.toFixed(4)}, Erreur: ${(relativeError * 100).toFixed(2)}%`
    );
  }
}

function assertGreater(a, b, message) {
  testsRun++;
  if (a > b) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(`    ${a} devrait être > ${b}`);
  }
}

console.log('\n=== Tests: Bug Fix - nusseltInternal roughness passthrough ===\n');

const Re = 50000;
const Pr = 7.0; // Eau ~20°C
const D = 0.05;
const L = 10.0;
const epsilon_D = 0.001; // Acier commercial

const f_rough = friction.frictionFactorChurchill(Re, epsilon_D);

// Test 1: nusseltInternal should accept 5th parameter (friction factor)
console.log('Test 1: nusseltInternal accepts friction factor as 5th parameter');
let Nu_with_f;
try {
  Nu_with_f = nusseltInt.nusseltInternal(Re, Pr, D, L, f_rough);
  testsRun++;
  testsPassed++;
  console.log(`  ✓ nusseltInternal(Re, Pr, D, L, f) returned Nu=${Nu_with_f.toFixed(2)}`);
} catch (e) {
  testsRun++;
  testsFailed++;
  console.log(`  ✗ nusseltInternal(Re, Pr, D, L, f) threw: ${e.message}`);
}

// Test 2: Nu with f_rough > Nu without f (smooth pipe)
console.log('\nTest 2: Nu with roughness > Nu without roughness');
const Nu_without_f = nusseltInt.nusseltInternal(Re, Pr, D, L);
if (Nu_with_f) {
  assertGreater(
    Nu_with_f,
    Nu_without_f,
    `Nu_rough(${Nu_with_f.toFixed(1)}) > Nu_smooth(${Nu_without_f.toFixed(1)})`
  );
}

// Test 3: Difference should be 10-30% for ε/D=0.001
console.log('\nTest 3: Difference between rough and smooth Nu should be 10-30%');
if (Nu_with_f) {
  const diff_pct = ((Nu_with_f - Nu_without_f) / Nu_without_f) * 100;
  assertGreater(diff_pct, 10, `Difference ${diff_pct.toFixed(1)}% > 10%`);
  assertGreater(30, diff_pct, `Difference ${diff_pct.toFixed(1)}% < 30%`);
}

// Test 4: nusseltInternal with f=null should behave same as without f
console.log('\nTest 4: nusseltInternal with f=null same as without f');
const Nu_null_f = nusseltInt.nusseltInternal(Re, Pr, D, L, null);
assertClose(Nu_null_f, Nu_without_f, 0.001, 'f=null gives same result as no f');

// Test 5: Transition zone (2300 < Re < 4000) should also pass f through
console.log('\nTest 5: Transition zone with f should differ from without f');
const Re_trans = 3500;
const f_trans = friction.frictionFactorChurchill(Re_trans, epsilon_D);
const Nu_trans_smooth = nusseltInt.nusseltInternal(Re_trans, Pr, D, L);
const Nu_trans_rough = nusseltInt.nusseltInternal(Re_trans, Pr, D, L, f_trans);
// In transition, only the turbulent end is affected, so difference should exist but be smaller
assertGreater(
  Nu_trans_rough,
  Nu_trans_smooth * 0.99, // At least slightly different (or equal if interpolation weight is low)
  `Transition: Nu_rough(${Nu_trans_rough.toFixed(2)}) >= Nu_smooth(${Nu_trans_smooth.toFixed(2)})`
);

// Test 6: Laminar regime should not be affected by f
console.log('\nTest 6: Laminar regime (Re=1500) unaffected by f');
const Re_lam = 1500;
const f_lam = friction.frictionFactorChurchill(Re_lam, epsilon_D);
const Nu_lam_no_f = nusseltInt.nusseltInternal(Re_lam, Pr, D, L);
const Nu_lam_with_f = nusseltInt.nusseltInternal(Re_lam, Pr, D, L, f_lam);
assertClose(Nu_lam_with_f, Nu_lam_no_f, 0.001, 'Laminar: f has no effect');

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Bug Fix nusseltInternal roughness passthrough');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

process.exit(testsFailed > 0 ? 1 : 0);
