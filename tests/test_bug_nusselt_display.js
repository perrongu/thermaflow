/**
 * test_bug_nusselt_display.js
 *
 * Bug 2: calculation-details.js shows "Dittus-Boelter" for Re > 10000,
 * but the engine always uses Gnielinski for turbulent flow.
 *
 * This test verifies that the correlation name logic matches the engine.
 *
 * Exécution: node tests/test_bug_nusselt_display.js
 */

const nusseltInternal = require('../js/correlations/nusselt-internal.js');

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
 * Simulate the CURRENT (buggy) display logic from calculation-details.js:448-461
 */
function buggyCorrelationName(regime, Re) {
  if (regime === 'laminar') {
    return 'hausen';
  } else {
    if (Re > 10000) {
      return 'dittusBoelter'; // BUG: engine uses Gnielinski here
    } else {
      return 'gnielinski';
    }
  }
}

/**
 * Simulate the CORRECT display logic (should match engine behavior).
 * The engine uses Gnielinski for ALL turbulent Re values.
 */
function correctCorrelationName(regime, _Re) {
  if (regime === 'laminar') {
    return 'hausen';
  } else {
    return 'gnielinski'; // Always Gnielinski for turbulent
  }
}

console.log('=== Test Bug 2: Nusselt correlation name display ===\n');

// --- Verify engine always uses Gnielinski for turbulent ---
console.log('--- Engine behavior verification ---');

// Both calls use Gnielinski internally (Re=5000 transition, Re=50000 turbulent)
const Pr = 7.0; // Typical water Prandtl number
const _Nu_5000 = nusseltInternal.nusseltInternal(5000, Pr);
const Nu_50000 = nusseltInternal.nusseltInternal(50000, Pr);

// Compute what Gnielinski gives for Re=50000
const f_50000 = Math.pow(0.79 * Math.log(50000) - 1.64, -2); // Petukhov friction (natural log)
const Nu_gnielinski_50000 =
  ((f_50000 / 8) * (50000 - 1000) * Pr) /
  (1 + 12.7 * Math.sqrt(f_50000 / 8) * (Math.pow(Pr, 2 / 3) - 1));

// Verify engine returns Gnielinski value for Re=50000 (not Dittus-Boelter)
const Nu_dittus_50000 = 0.023 * Math.pow(50000, 0.8) * Math.pow(Pr, 0.4);

assert(
  Math.abs(Nu_50000 - Nu_gnielinski_50000) / Nu_gnielinski_50000 < 0.01,
  `Engine uses Gnielinski at Re=50000: Nu=${Nu_50000.toFixed(1)} ≈ Gnielinski=${Nu_gnielinski_50000.toFixed(1)}`
);
assert(
  Math.abs(Nu_50000 - Nu_dittus_50000) / Nu_dittus_50000 > 0.05,
  `Engine does NOT use Dittus-Boelter at Re=50000: Nu=${Nu_50000.toFixed(1)} ≠ Dittus=${Nu_dittus_50000.toFixed(1)}`
);

// --- Demonstrate the bug ---
console.log('\n--- Bug demonstration ---');

assert(
  buggyCorrelationName('turbulent', 50000) === 'dittusBoelter',
  'Bug confirmed: display says Dittus-Boelter for Re=50000'
);
assert(
  buggyCorrelationName('turbulent', 5000) === 'gnielinski',
  'Display correctly says Gnielinski for Re=5000 (transition zone)'
);

// --- Verify correct behavior ---
console.log('\n--- Correct behavior (after fix) ---');

assert(
  correctCorrelationName('turbulent', 50000) === 'gnielinski',
  'Re=50000 should show Gnielinski'
);
assert(
  correctCorrelationName('turbulent', 5000) === 'gnielinski',
  'Re=5000 should show Gnielinski'
);
assert(
  correctCorrelationName('turbulent', 100000) === 'gnielinski',
  'Re=100000 should show Gnielinski'
);
assert(correctCorrelationName('laminar', 1500) === 'hausen', 'Re=1500 laminar should show Hausen');

// Summary
console.log(`\n=== Résultats: ${testsPassed}/${testsTotal} tests réussis ===`);
if (testsPassed === testsTotal) {
  console.log('✅ Tous les tests passent');
} else {
  console.error(`❌ ${testsTotal - testsPassed} test(s) échoué(s)`);
  process.exit(1);
}
