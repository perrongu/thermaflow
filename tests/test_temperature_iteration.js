/**
 * test_temperature_iteration.js
 *
 * Tests unitaires pour l'itération T_moy dans pipe-segment.js (v1.2).
 *
 * Valide:
 * - Impact de l'itération sur précision selon ΔT
 * - Convergence en 2 itérations vs 5 itérations
 * - Conservation de l'énergie
 * - Performance
 * - Backward compatibility
 *
 * Exécution: node tests/test_temperature_iteration.js
 */

const pipeSegment = require('../js/engine/pipe-segment.js');

// Compteurs de tests
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assertClose(actual, expected, tolerance = 0.01, message = '') {
  testsRun++;
  const relativeError = Math.abs((actual - expected) / expected);

  if (relativeError <= tolerance) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
    return true;
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(
      `    Attendu: ${expected}, Obtenu: ${actual}, Erreur: ${(relativeError * 100).toFixed(2)}%`
    );
    return false;
  }
}

function assertGreater(actual, threshold, message = '') {
  testsRun++;
  if (actual > threshold) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
    return true;
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(`    ${actual} devrait être > ${threshold}`);
    return false;
  }
}

function assertLess(actual, threshold, message = '') {
  testsRun++;
  if (actual < threshold) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
    return true;
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(`    ${actual} devrait être < ${threshold}`);
    return false;
  }
}

// ===== TESTS ITÉRATION T_MOY =====
console.log('\n=== Tests: Itération T_moy pour Propriétés Fluides (v1.2) ===\n');

// Configuration de base
const geometry = {
  D_inner: 0.0525,
  D_outer: 0.0603,
  roughness: 0.045e-3,
  length: 10,
  material: 'steel',
};

const ambient = {
  T_amb: -10,
  V_wind: 5.0,
};

const insulation = {
  material: 'fiberglass',
  thickness: 0.02,
};

console.log('Test 1: ΔT faible (< 10K) - itération vs direct négligeable');
// T_in = 20°C, T_amb = -10°C → ΔT attendu ~ 5-8K
const fluid_low = { T_in: 20, P: 3.0, m_dot: 2.0 };
const result_1iter_low = pipeSegment.calculatePipeSegment(
  geometry,
  fluid_low,
  ambient,
  insulation,
  1
);
const result_2iter_low = pipeSegment.calculatePipeSegment(
  geometry,
  fluid_low,
  ambient,
  insulation,
  2
);

const diff_low = Math.abs(result_2iter_low.T_out - result_1iter_low.T_out);
const rel_diff_low = diff_low / Math.abs(result_1iter_low.T_out - ambient.T_amb);

assertLess(
  rel_diff_low,
  0.02,
  `ΔT faible: différence < 2% (obtenu ${(rel_diff_low * 100).toFixed(2)}%)`
);

console.log('\nTest 2: ΔT moyen (20K) - amélioration mesurable');
// T_in = 40°C, T_amb = -10°C, SANS isolation, longueur 50m → pertes élevées
const geometry_long = { ...geometry, length: 50 };
const fluid_med = { T_in: 40, P: 3.0, m_dot: 0.5 }; // Débit réduit pour plus de pertes
const result_1iter_med = pipeSegment.calculatePipeSegment(
  geometry_long,
  fluid_med,
  ambient,
  null,
  1
); // Sans isolation
const result_2iter_med = pipeSegment.calculatePipeSegment(
  geometry_long,
  fluid_med,
  ambient,
  null,
  2
);

const diff_med = Math.abs(result_2iter_med.T_out - result_1iter_med.T_out);
const rel_diff_med = diff_med / Math.abs(result_1iter_med.T_out - ambient.T_amb);

assertGreater(
  rel_diff_med,
  0.0001,
  `ΔT moyen: amélioration > 0.01% (obtenu ${(rel_diff_med * 100).toFixed(3)}%)`
);
assertLess(
  rel_diff_med,
  0.08,
  `ΔT moyen: amélioration < 8% (obtenu ${(rel_diff_med * 100).toFixed(3)}%)`
);

console.log('\nTest 3: ΔT élevé (40K) - amélioration significative');
// T_in = 60°C, T_amb = -10°C, SANS isolation, longueur 100m → pertes très élevées
const geometry_verylong = { ...geometry, length: 100 };
const fluid_high = { T_in: 60, P: 3.0, m_dot: 0.3 }; // Débit très réduit
const result_1iter_high = pipeSegment.calculatePipeSegment(
  geometry_verylong,
  fluid_high,
  ambient,
  null,
  1
);
const result_2iter_high = pipeSegment.calculatePipeSegment(
  geometry_verylong,
  fluid_high,
  ambient,
  null,
  2
);

const diff_high = Math.abs(result_2iter_high.T_out - result_1iter_high.T_out);
const rel_diff_high = diff_high / Math.abs(result_1iter_high.T_out - ambient.T_amb);

assertGreater(
  rel_diff_high,
  0.001,
  `ΔT élevé: amélioration > 0.1% (obtenu ${(rel_diff_high * 100).toFixed(3)}%)`
);
assertLess(
  rel_diff_high,
  0.15,
  `ΔT élevé: amélioration < 15% (obtenu ${(rel_diff_high * 100).toFixed(3)}%)`
);

console.log('\nTest 4: Convergence 2 itérations vs 5 itérations (< 1% écart)');
const result_2iter = pipeSegment.calculatePipeSegment(
  geometry_verylong,
  fluid_high,
  ambient,
  null,
  2
);
const result_5iter = pipeSegment.calculatePipeSegment(
  geometry_verylong,
  fluid_high,
  ambient,
  null,
  5
);

const diff_2_5 = Math.abs(result_5iter.T_out - result_2iter.T_out);
const rel_diff_2_5 = diff_2_5 / Math.abs(result_2iter.T_out - ambient.T_amb);

assertLess(
  rel_diff_2_5,
  0.01,
  `Convergence 2→5: < 1% écart (obtenu ${(rel_diff_2_5 * 100).toFixed(3)}%)`
);

console.log('\nTest 5: Conservation énergie avec itération');
// Q_loss = ṁ·cp·(T_in - T_out) doit être cohérent
const result_conv = pipeSegment.calculatePipeSegment(
  geometry_verylong,
  fluid_high,
  ambient,
  null,
  2
);

// Recalcul Q_loss avec propriétés à T_moy pour vérification
// Note: Q_loss déjà calculé dans le module utilise cp correct
const Q_expected = result_conv.Q_loss;
const Q_verify = fluid_high.m_dot * 4180 * (fluid_high.T_in - result_conv.T_out); // cp eau ≈ 4180 J/(kg·K)

// Tolérance élargie car cp varie avec T
assertClose(
  result_conv.Q_loss,
  Q_verify,
  0.15,
  `Conservation: Q_loss cohérent (${result_conv.Q_loss.toFixed(0)}W vs ${Q_verify.toFixed(0)}W)`
);

console.log('\nTest 6: Performance < 10ms (2 itérations)');
const startTime = Date.now();
const iterations_perf = 100;
const fluid_perf = { T_in: 40, P: 3.0, m_dot: 1.0 };

for (let i = 0; i < iterations_perf; i++) {
  pipeSegment.calculatePipeSegment(geometry, fluid_perf, ambient, insulation, 2);
}

const endTime = Date.now();
const avgTime = (endTime - startTime) / iterations_perf;

assertLess(avgTime, 10.0, `Performance: ${avgTime.toFixed(2)} ms/calcul < 10 ms`);

console.log('\nTest 7: Backward compatibility (sans itération = résultat proche)');
// Sans paramètre itération → défaut 2 itérations (v1.2)
const fluid_compat = { T_in: 40, P: 3.0, m_dot: 1.0 };
const result_default = pipeSegment.calculatePipeSegment(
  geometry,
  fluid_compat,
  ambient,
  insulation
);
const result_explicit2 = pipeSegment.calculatePipeSegment(
  geometry,
  fluid_compat,
  ambient,
  insulation,
  2
);

assertClose(
  result_default.T_out,
  result_explicit2.T_out,
  0.001,
  'Défaut = 2 itérations explicites'
);

// 1 itération vs 2 itérations avec pertes significatives
const result_v1_noinsul = pipeSegment.calculatePipeSegment(
  geometry_long,
  fluid_med,
  ambient,
  null,
  1
);
const result_v2_noinsul = pipeSegment.calculatePipeSegment(
  geometry_long,
  fluid_med,
  ambient,
  null,
  2
);
testsRun++;
if (Math.abs(result_v1_noinsul.T_out - result_v2_noinsul.T_out) > 0.001) {
  testsPassed++;
  console.log(`  ✓ 1 itération ≠ 2 itérations (différence mesurable avec pertes élevées)`);
} else {
  testsFailed++;
  console.log(`  ✗ 1 itération devrait différer de 2 itérations avec pertes élevées`);
}

console.log('\nTest 8: Cas extrême (80°C → 20°C, ΔT = 60K)');
const fluid_extreme = { T_in: 80, P: 3.0, m_dot: 0.2 }; // Débit très faible → ΔT élevé
const ambient_warm = { T_amb: 20, V_wind: 2.0 };
const geometry_extreme = { ...geometry, length: 150 }; // Très longue conduite

const result_1iter_ext = pipeSegment.calculatePipeSegment(
  geometry_extreme,
  fluid_extreme,
  ambient_warm,
  null,
  1
); // Sans isolation
const result_2iter_ext = pipeSegment.calculatePipeSegment(
  geometry_extreme,
  fluid_extreme,
  ambient_warm,
  null,
  2
);

const diff_ext = Math.abs(result_2iter_ext.T_out - result_1iter_ext.T_out);
const rel_diff_ext = diff_ext / Math.abs(result_1iter_ext.T_out - ambient_warm.T_amb);

assertGreater(
  rel_diff_ext,
  0.0001,
  `Cas extrême: amélioration > 0.01% (obtenu ${(rel_diff_ext * 100).toFixed(3)}%)`
);

// Vérifier que T_out reste physique
testsRun++;
if (result_2iter_ext.T_out > ambient_warm.T_amb && result_2iter_ext.T_out < fluid_extreme.T_in) {
  testsPassed++;
  console.log(`  ✓ T_out physique: ${result_2iter_ext.T_out.toFixed(1)}°C entre T_amb et T_in`);
} else {
  testsFailed++;
  console.log(`  ✗ T_out non physique: ${result_2iter_ext.T_out}°C`);
}

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Itération T_moy v1.2');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

// Code de sortie
process.exit(testsFailed > 0 ? 1 : 0);
