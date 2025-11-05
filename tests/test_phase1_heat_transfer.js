/**
 * test_phase1_heat_transfer.js
 *
 * Tests unitaires pour les modules de transfert thermique (Phase 1.3):
 * - nusselt-internal.js
 * - nusselt-external.js
 * - radiation.js
 * - thermal-resistance.js
 * - heat-transfer.js
 *
 * Validation contre:
 * - Corrélations du Perry's Handbook
 * - fluids.readthedocs.io
 * - Solutions analytiques
 *
 * Exécution: node tests/test_phase1_heat_transfer.js
 */

const nusseltInt = require('../js/correlations/nusselt-internal.js');
const nusseltExt = require('../js/correlations/nusselt-external.js');
const radiation = require('../js/correlations/radiation.js');
const resistance = require('../js/calculations/thermal-resistance.js');
const heatTransfer = require('../js/calculations/heat-transfer.js');

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

function assertEqual(actual, expected, message = '') {
  testsRun++;
  if (actual === expected) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
    return true;
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
    console.log(`    Attendu: ${expected}, Obtenu: ${actual}`);
    return false;
  }
}

function assertThrows(fn, message = '') {
  testsRun++;
  try {
    fn();
    testsFailed++;
    console.log(`  ✗ ${message} - devrait lever une erreur`);
    return false;
  } catch (e) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
    return true;
  }
}

// ===== TESTS NUSSELT INTERNAL =====
console.log('\n=== Tests: nusselt-internal.js ===\n');

console.log('Test 1: Nusselt laminaire pleinement développé');
const Nu_lam_fd = nusseltInt.nusseltLaminarFullyDeveloped('constant_T');
assertClose(Nu_lam_fd, 3.66, 0.001, 'Nu_lam = 3.66 (T_wall constante)');

console.log('\nTest 2: Nusselt laminaire avec flux constant');
const Nu_lam_q = nusseltInt.nusseltLaminarFullyDeveloped('constant_q');
assertClose(Nu_lam_q, 4.36, 0.001, 'Nu_lam = 4.36 (q_wall constant)');

console.log("\nTest 3: Hausen laminaire avec effet d'entrée");
// Eau Pr=7, Re=1500, DN50 (D=0.0525m), L=10m
const Nu_hausen = nusseltInt.nusseltHausen(1500, 7.0, 0.0525, 10);
testsRun++;
if (Nu_hausen > 3.66) {
  testsPassed++;
  console.log(`  ✓ Nu_Hausen (${Nu_hausen.toFixed(2)}) > 3.66 (effet d'entrée)`);
} else {
  testsFailed++;
  console.log(`  ✗ Nu_Hausen devrait être > 3.66`);
}

console.log('\nTest 4: Dittus-Boelter turbulent');
// Eau Pr=7, Re=50000, chauffage
const Nu_db = nusseltInt.nusseltDittusBoelter(50000, 7.0, 'heating');
// Nu ≈ 0.023 × 50000^0.8 × 7^0.4 ≈ 288
assertClose(Nu_db, 288, 0.1, 'Nu_DB ≈ 288');

console.log('\nTest 5: Gnielinski turbulent');
// Eau Pr=7, Re=10000
const Nu_gn = nusseltInt.nusseltGnielinski(10000, 7.0);
// Nu ≈ 72
assertClose(Nu_gn, 72, 0.15, 'Nu_Gnielinski ≈ 72');

console.log('\nTest 6: Sélection automatique laminaire');
const Nu_auto_lam = nusseltInt.nusseltInternal(1500, 7.0);
assertClose(Nu_auto_lam, 3.66, 0.1, 'Auto-sélection → laminaire');

console.log('\nTest 7: Sélection automatique turbulent');
const Nu_auto_turb = nusseltInt.nusseltInternal(50000, 7.0);
testsRun++;
if (Nu_auto_turb > 100) {
  testsPassed++;
  console.log(`  ✓ Nu_turb = ${Nu_auto_turb.toFixed(0)} (turbulent détecté)`);
} else {
  testsFailed++;
  console.log(`  ✗ Nu_turb trop faible`);
}

console.log('\nTest 8: Coefficient de convection');
// Nu=72, k=0.598 W/(m·K), D=0.0525m
const h = nusseltInt.convectionCoefficient(72, 0.598, 0.0525);
// h = 72 × 0.598 / 0.0525 ≈ 820 W/(m²·K)
assertClose(h, 820, 0.05, 'h ≈ 820 W/(m²·K)');

// ===== TESTS NUSSELT EXTERNAL =====
console.log('\n\n=== Tests: nusselt-external.js ===\n');

console.log('Test 9: Churchill-Bernstein cylindre');
// Air Pr=0.715, Re=20000
const Nu_cb = nusseltExt.nusseltChurchillBernstein(20000, 0.715);
// Nu ≈ 90
assertClose(Nu_cb, 90, 0.15, 'Nu_Churchill-Bernstein ≈ 90');

console.log('\nTest 10: Hilpert cylindre');
const Nu_hilp = nusseltExt.nusseltHilpert(20000, 0.715);
// Devrait être proche de Churchill-Bernstein
assertClose(Nu_hilp, Nu_cb, 0.15, 'Hilpert ≈ Churchill-Bernstein');

console.log('\nTest 11: Convection naturelle cylindre');
// Ra = 10^6, Pr = 0.715
const Nu_nat = nusseltExt.nusseltNaturalConvectionCylinder(1e6, 0.715);
// Nu ≈ 12-13 (corrélation Churchill & Chu)
assertClose(Nu_nat, 12.8, 0.15, 'Nu_naturelle ≈ 12.8');

console.log('\nTest 12: Calcul Rayleigh');
// g=9.81, β=0.00353 (1/283K), ΔT=50K, L=0.06m, ν=1.4e-5, Pr=0.715
const Ra = nusseltExt.calculateRayleigh(9.81, 0.00353, 50, 0.06, 1.4e-5, 0.715);
// Ra ≈ 1.36e6 (sensible aux propriétés de l'air)
assertClose(Ra, 1.36e6, 0.15, 'Ra ≈ 1.36e6');

console.log('\nTest 13: Sélection convection forcée vs naturelle');
// Re élevé → forcée
const Nu_forced = nusseltExt.nusseltExternal(20000, 0.715, 1e5);
assertClose(Nu_forced, Nu_cb, 0.01, 'Re² >> Gr → convection forcée');

// ===== TESTS RADIATION =====
console.log('\n\n=== Tests: radiation.js ===\n');

console.log('Test 14: Constante Stefan-Boltzmann');
assertClose(radiation.STEFAN_BOLTZMANN, 5.67e-8, 0.001, 'σ = 5.67e-8 W/(m²·K⁴)');

console.log('\nTest 15: Conversions Celsius ↔ Kelvin');
const T_K = radiation.celsiusToKelvin(20);
assertClose(T_K, 293.15, 0.001, '20°C = 293.15 K');
const T_C = radiation.kelvinToCelsius(293.15);
assertClose(T_C, 20, 0.001, '293.15 K = 20°C');

console.log('\nTest 16: Aire cylindre');
const A_cyl = radiation.cylinderSurfaceArea(0.06, 10);
// A = π × 0.06 × 10 = 1.885 m²
assertClose(A_cyl, 1.885, 0.01, 'A ≈ 1.885 m²');

console.log('\nTest 17: Coefficient radiatif linéarisé');
// T_surf=60°C=333.15K, T_amb=-10°C=263.15K, ε=0.79
const h_rad = radiation.radiationCoefficient(333.15, 263.15, 0.79);
// h_rad ≈ 5.2 W/(m²·K)
assertClose(h_rad, 5.2, 0.15, 'h_rad ≈ 5.2 W/(m²·K)');

console.log('\nTest 18: Flux radiatif total');
const Q_rad = radiation.radiativeHeatTransfer(0.79, 1.0, 333.15, 263.15);
// Q ≈ h_rad × A × ΔT = 5.2 × 1 × 70 ≈ 364 W
assertClose(Q_rad, 364, 0.2, 'Q_rad ≈ 364 W');

console.log('\nTest 19: h_total = h_conv + h_rad');
const h_total = radiation.totalHeatTransferCoefficient(20, 5.2);
assertClose(h_total, 25.2, 0.001, 'h_total = 25.2 W/(m²·K)');

console.log('\nTest 20: Émissivité élevée → h_rad élevé');
const h_rad_high = radiation.radiationCoefficient(333.15, 263.15, 0.95);
const h_rad_low = radiation.radiationCoefficient(333.15, 263.15, 0.1);
testsRun++;
if (h_rad_high > 9 * h_rad_low) {
  testsPassed++;
  console.log(
    `  ✓ h_rad(ε=0.95) = ${h_rad_high.toFixed(1)} >> h_rad(ε=0.1) = ${h_rad_low.toFixed(2)}`
  );
} else {
  testsFailed++;
  console.log(`  ✗ Effet émissivité insuffisant`);
}

// ===== TESTS THERMAL RESISTANCE =====
console.log('\n\n=== Tests: thermal-resistance.js ===\n');

console.log('Test 21: Résistance convection');
// h=800 W/(m²·K), D=0.05m, L=1m
const R_conv = resistance.convectionResistanceCylinder(800, 0.05, 1.0);
// A = π×0.05×1 = 0.157 m², R = 1/(800×0.157) = 0.0080 K/W
assertClose(R_conv, 0.008, 0.05, 'R_conv ≈ 0.0080 K/W');

console.log('\nTest 22: Résistance conduction cylindrique');
// r_i=0.025m, r_o=0.027m, k=50.2 W/(m·K), L=1m
const R_cond = resistance.conductionResistanceCylinder(0.025, 0.027, 50.2, 1.0);
// R = ln(1.08)/(2π×50.2×1) = 0.00024 K/W
assertClose(R_cond, 0.00024, 0.1, 'R_cond ≈ 0.00024 K/W');

console.log('\nTest 23: Résistances en série');
const R_total_series = resistance.totalResistanceSeries([0.008, 0.0003, 0.1, 0.05]);
// R_total = 0.008 + 0.0003 + 0.1 + 0.05 = 0.1583 K/W
assertClose(R_total_series, 0.1583, 0.01, 'R_total = 0.1583 K/W');

console.log('\nTest 24: Flux thermique');
// ΔT = 70K, R = 0.16 K/W
const Q = resistance.heatFlux(60, -10, 0.16);
// Q = 70 / 0.16 = 437.5 W
assertClose(Q, 437.5, 0.01, 'Q ≈ 437.5 W');

console.log('\nTest 25: Coefficient UA');
const UA = resistance.overallHeatTransferCoefficient(0.16);
// UA = 1 / 0.16 = 6.25 W/K
assertClose(UA, 6.25, 0.01, 'UA = 6.25 W/K');

console.log('\nTest 26: Profil de température');
const T_profile = resistance.temperatureProfile(60, -10, [0.01, 0.0003, 0.1, 0.05]);
// 5 températures (interfaces)
assertEqual(T_profile.length, 5, '5 points de température');
// T[0] = 60°C, T[4] = -10°C
assertClose(T_profile[0], 60, 0.001, 'T_intérieur = 60°C');
assertClose(T_profile[4], -10, 0.001, 'T_extérieur = -10°C');

console.log('\nTest 27: Configuration conduite multicouche');
const pipe_config = [
  { type: 'convection', h: 800, D: 0.05, name: 'eau_int' },
  { type: 'conduction', r_inner: 0.025, r_outer: 0.027, k: 50.2, name: 'acier' },
  { type: 'conduction', r_inner: 0.027, r_outer: 0.047, k: 0.04, name: 'isolation' },
  { type: 'convection', h: 20, D: 0.094, name: 'air_ext' },
];
const result = resistance.pipeResistance(pipe_config, 1.0);
// La résistance dominante devrait être l'isolation
testsRun++;
const R_insulation = result.R_layers[2];
if (R_insulation > result.R_total * 0.8) {
  testsPassed++;
  console.log(
    `  ✓ R_isolation domine (${((R_insulation / result.R_total) * 100).toFixed(0)}% du total)`
  );
} else {
  testsFailed++;
  console.log(`  ✗ R_isolation ne domine pas assez`);
}

// ===== TESTS HEAT TRANSFER =====
console.log('\n\n=== Tests: heat-transfer.js ===\n');

console.log('Test 28: Calcul NTU');
// UA=6.25 W/K, ṁ=2.16 kg/s, cp=4184 J/(kg·K)
const NTU = heatTransfer.calculateNTU(6.25, 2.16, 4184);
// NTU = 6.25 / (2.16 × 4184) = 0.000692
assertClose(NTU, 0.000692, 0.05, 'NTU ≈ 0.000692');

console.log('\nTest 29: Effectiveness');
const epsilon = heatTransfer.calculateEffectiveness(0.5);
// ε = 1 - exp(-0.5) = 0.393
assertClose(epsilon, 0.393, 0.01, 'ε ≈ 0.393');

console.log('\nTest 30: Température de sortie');
// T_in=60°C, T_amb=-10°C, ṁ=2.16 kg/s, cp=4184 J/(kg·K), UA=6.25 W/K
const T_out = heatTransfer.calculateOutletTemperature(60, -10, 2.16, 4184, 6.25);
// Avec NTU≈0.0007, exp(-NTU)≈0.9993, T_out ≈ 59.95°C
assertClose(T_out, 59.95, 0.01, 'T_out ≈ 59.95°C');

console.log('\nTest 31: Perte de chaleur');
const Q_loss = heatTransfer.heatLossRate(2.16, 4184, 60, 59.95);
// Q = 2.16 × 4184 × (60 - 59.95) = 452 W
assertClose(Q_loss, 452, 0.1, 'Q_loss ≈ 452 W');

console.log("\nTest 32: Conservation d'énergie");
// Q_loss devrait égaler UA × ΔT_moyen
const Q_UA = UA * ((60 + 59.95) / 2 - -10);
assertClose(Q_loss, Q_UA, 0.05, 'Q_loss ≈ UA×ΔT (conservation)');

console.log('\nTest 33: LMTD');
const LMTD = heatTransfer.logMeanTemperatureDifference(70, 69.95);
// LMTD ≈ 69.975 K
assertClose(LMTD, 69.975, 0.01, 'LMTD ≈ 69.975 K');

console.log('\nTest 34: Détection gel');
const freezing = heatTransfer.checkFreezing(0.5, 0);
assertEqual(freezing, false, 'T=0.5°C → pas de gel');
const freezing2 = heatTransfer.checkFreezing(-0.1, 0);
assertEqual(freezing2, true, 'T=-0.1°C → gel');

console.log('\nTest 35: Longueur critique de gel');
// Pour atteindre 0°C depuis 60°C, air à -10°C
const L_crit = heatTransfer.criticalLength(60, 0, -10, 2.16, 4184, 6.25);
// L_crit = -(2.16 × 4184 / 6.25) × ln((0-(-10))/(60-(-10)))
// L_crit = -1454 × ln(10/70) = -1454 × (-1.946) = 2829 m
assertClose(L_crit, 2829, 0.15, 'L_critique ≈ 2829 m pour atteindre 0°C');

// ===== TESTS INTÉGRATION =====
console.log('\n\n=== Tests: Intégration complète ===\n');

console.log('Test 36: Cas complet - Conduite chauffée perdant chaleur');
// Configuration: Eau 60°C, DN50, air -10°C, L=10m
const D_ext = 0.06; // m (avec isolation)
const L_pipe = 10; // m
const m_dot_water = 2.16; // kg/s
const cp_water = 4184; // J/(kg·K)

// Résistances thermiques
const R_conv_int = resistance.convectionResistanceCylinder(800, 0.05, L_pipe);
const R_wall = resistance.conductionResistanceCylinder(0.025, 0.027, 50.2, L_pipe);
const R_insul = resistance.conductionResistanceCylinder(0.027, 0.047, 0.04, L_pipe);
const R_conv_ext = resistance.convectionResistanceCylinder(20, D_ext, L_pipe);
const R_total_pipe = resistance.totalResistanceSeries([R_conv_int, R_wall, R_insul, R_conv_ext]);

const UA_total = resistance.overallHeatTransferCoefficient(R_total_pipe);
const T_out_full = heatTransfer.calculateOutletTemperature(
  60,
  -10,
  m_dot_water,
  cp_water,
  UA_total
);
const Q_loss_full = heatTransfer.heatLossRate(m_dot_water, cp_water, 60, T_out_full);

console.log(`  R_total = ${R_total_pipe.toFixed(3)} K/W`);
console.log(`  UA = ${UA_total.toFixed(2)} W/K`);
console.log(`  T_out = ${T_out_full.toFixed(2)}°C`);
console.log(`  Q_loss = ${Q_loss_full.toFixed(0)} W`);

// Vérifications physiques
testsRun++;
if (T_out_full > -10 && T_out_full < 60) {
  testsPassed++;
  console.log(`  ✓ T_out entre T_amb et T_in`);
} else {
  testsFailed++;
  console.log(`  ✗ T_out hors limites physiques`);
}

testsRun++;
if (Q_loss_full > 0) {
  testsPassed++;
  console.log(`  ✓ Q_loss > 0 (perte de chaleur)`);
} else {
  testsFailed++;
  console.log(`  ✗ Q_loss devrait être positif`);
}

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Phase 1.3 Transfert thermique');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

// Code de sortie
process.exit(testsFailed > 0 ? 1 : 0);
