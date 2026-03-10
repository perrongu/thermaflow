/**
 * test_bug_hext_split.js
 *
 * Bug 3: calculation-details.js uses hardcoded 85/15 ratio for h_conv/h_rad
 * instead of actual computed values. This test verifies that the engine
 * can provide separate h_conv_ext and h_rad values.
 *
 * Exécution: node tests/test_bug_hext_split.js
 */

const radiation = require('../js/correlations/radiation.js');
const nusseltExternal = require('../js/correlations/nusselt-external.js');
const nusseltInternal = require('../js/correlations/nusselt-internal.js');
const AirProperties = require('../js/properties/air-properties.js');

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

console.log('=== Test Bug 3: Hardcoded h_conv/h_rad 85/15 split ===\n');

// --- Test scenarios showing the ratio varies significantly ---
console.log('--- Ratio variation across conditions ---');

const emissivity = 0.79; // Steel pipe

// Scenario 1: High wind (forced convection dominant)
const air_cold = AirProperties.getAirProperties(-20);
const V_wind_high = 20; // m/s (72 km/h)
const D_outer = 0.06; // 60mm pipe
const Re_air_high = (air_cold.rho * V_wind_high * D_outer) / air_cold.mu;
const Nu_high = nusseltExternal.nusseltChurchillBernstein(Re_air_high, air_cold.Pr);
const h_conv_high = nusseltInternal.convectionCoefficient(Nu_high, air_cold.k, D_outer);
const h_rad_cold = radiation.radiationCoefficientSimple(5, -20, emissivity);
const h_total_high = h_conv_high + h_rad_cold;
const ratio_conv_high = h_conv_high / h_total_high;

console.log(
  `  High wind: h_conv=${h_conv_high.toFixed(1)}, h_rad=${h_rad_cold.toFixed(1)}, ratio_conv=${(ratio_conv_high * 100).toFixed(1)}%`
);
assert(
  ratio_conv_high > 0.9,
  `High wind: convection ratio ${(ratio_conv_high * 100).toFixed(1)}% should be >90% (not 85%)`
);

// Scenario 2: Low wind (natural convection, radiation more significant)
const air_mild = AirProperties.getAirProperties(0);
const V_wind_low = 0.5; // m/s (nearly still)
const Re_air_low = (air_mild.rho * V_wind_low * D_outer) / air_mild.mu;
const Nu_low = nusseltExternal.nusseltChurchillBernstein(Re_air_low, air_mild.Pr);
const h_conv_low = nusseltInternal.convectionCoefficient(Nu_low, air_mild.k, D_outer);
const h_rad_mild = radiation.radiationCoefficientSimple(10, 0, emissivity);
const h_total_low = h_conv_low + h_rad_mild;
const ratio_conv_low = h_conv_low / h_total_low;

console.log(
  `  Low wind:  h_conv=${h_conv_low.toFixed(1)}, h_rad=${h_rad_mild.toFixed(1)}, ratio_conv=${(ratio_conv_low * 100).toFixed(1)}%`
);
assert(
  ratio_conv_low < 0.85,
  `Low wind: convection ratio ${(ratio_conv_low * 100).toFixed(1)}% should be <85%`
);

// --- Demonstrate the bug ---
console.log('\n--- Bug demonstration: hardcoded 85/15 vs actual ---');

// High wind scenario: 85% approximation underestimates h_conv
const displayed_conv_high = h_total_high * 0.85;
const error_conv_high = (Math.abs(displayed_conv_high - h_conv_high) / h_conv_high) * 100;
assert(
  error_conv_high > 5,
  `High wind: hardcoded h_conv error is ${error_conv_high.toFixed(1)}% (>5% threshold)`
);

// Low wind scenario: 85% approximation overestimates h_conv
const displayed_conv_low = h_total_low * 0.85;
const error_conv_low = (Math.abs(displayed_conv_low - h_conv_low) / h_conv_low) * 100;
assert(
  error_conv_low > 5,
  `Low wind: hardcoded h_conv error is ${error_conv_low.toFixed(1)}% (>5% threshold)`
);

// --- Verify SegmentResult should include h_conv_ext and h_rad ---
console.log('\n--- Verify engine can provide separate values ---');

const pipeSegment = require('../js/engine/pipe-segment.js');

// Run a typical calculation
const result = pipeSegment.calculatePipeSegment(
  { D_inner: 0.05, D_outer: 0.06, length: 100, material: 'steel', roughness: 0.000045 },
  { T_in: 5, m_dot: 0.5, P: 3 },
  { T_amb: -20, V_wind: 5 },
  null
);

assert(result.h_ext !== undefined && result.h_ext > 0, `h_ext exists: ${result.h_ext.toFixed(2)}`);

// After fix, these should exist:
const hasConvExt = result.h_conv_ext !== undefined;
const hasRad = result.h_rad !== undefined;

assert(
  hasConvExt,
  `h_conv_ext should be in SegmentResult (currently ${hasConvExt ? 'present' : 'MISSING'})`
);
assert(hasRad, `h_rad should be in SegmentResult (currently ${hasRad ? 'present' : 'MISSING'})`);

if (hasConvExt && hasRad) {
  const sum = result.h_conv_ext + result.h_rad;
  assert(
    Math.abs(sum - result.h_ext) / result.h_ext < 0.001,
    `h_conv_ext + h_rad = h_ext: ${result.h_conv_ext.toFixed(2)} + ${result.h_rad.toFixed(2)} = ${sum.toFixed(2)} ≈ ${result.h_ext.toFixed(2)}`
  );
}

// Summary
console.log(`\n=== Résultats: ${testsPassed}/${testsTotal} tests réussis ===`);
if (testsPassed === testsTotal) {
  console.log('✅ Tous les tests passent');
} else {
  console.error(`❌ ${testsTotal - testsPassed} test(s) échoué(s)`);
  process.exit(1);
}
