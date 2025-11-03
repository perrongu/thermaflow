/**
 * test_phase1_hydraulics.js
 * 
 * Tests unitaires pour les modules hydrauliques (Phase 1.2):
 * - reynolds.js
 * - friction-factor.js
 * - pressure-drop.js
 * 
 * Validation contre:
 * - Valeurs calculées manuellement
 * - Diagramme de Moody
 * - fluids.readthedocs.io
 * 
 * Exécution: node tests/test_phase1_hydraulics.js
 */

const path = require('path');

// Charger les modules en utilisant require direct (modules Node.js style)
const reynolds = require('../js/formulas/reynolds.js');
const friction = require('../js/correlations/friction-factor.js');
const geometry = require('../js/formulas/geometry.js');
const pressureBasic = require('../js/formulas/pressure-basic.js');

// Compteurs de tests
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Fonction d'assertion avec tolérance relative
 */
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
    console.log(`    Attendu: ${expected}, Obtenu: ${actual}, Erreur: ${(relativeError * 100).toFixed(2)}%`);
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

// ===== TESTS REYNOLDS =====
console.log('\n=== Tests: reynolds.js ===\n');

console.log('Test 1: Calcul Re pour eau à 20°C, DN50, V=1 m/s');
// Eau: ρ=998 kg/m³, μ=1.002e-3 Pa·s, D=0.0525m
const Re1 = reynolds.calculateReynolds(998, 1.0, 0.0525, 1.002e-3);
assertClose(Re1, 52275, 0.01, 'Re ≈ 52275 (turbulent)');

console.log('\nTest 2: Calcul Re pour air à 20°C, DN50, V=5 m/s');
// Air: ρ=1.204 kg/m³, μ=1.813e-5 Pa·s, D=0.0525m
const Re2 = reynolds.calculateReynolds(1.204, 5.0, 0.0525, 1.813e-5);
assertClose(Re2, 17400, 0.01, 'Re ≈ 17400 (turbulent)');

console.log('\nTest 3: Écoulement laminaire (Re < 2300)');
const Re3 = reynolds.calculateReynolds(998, 0.044, 0.0525, 1.002e-3);
assertClose(Re3, 2300, 0.01, 'Re ≈ 2300 (limite laminaire)');
// Re = 2300 est à la limite, peut être classé transitional
assertEqual(reynolds.getFlowRegime(2000), 'laminar', 'Régime laminaire Re=2000');

console.log('\nTest 4: Détection des régimes');
assertEqual(reynolds.getFlowRegime(1500), 'laminar', 'Re=1500 → laminaire');
assertEqual(reynolds.getFlowRegime(3000), 'transitional', 'Re=3000 → transitoire');
assertEqual(reynolds.getFlowRegime(10000), 'turbulent', 'Re=10000 → turbulent');

console.log('\nTest 5: Vitesse critique');
const V_crit = reynolds.getCriticalVelocity(998, 0.0525, 1.002e-3);
assertClose(V_crit, 0.044, 0.01, 'V_crit ≈ 0.044 m/s pour Re=2300');

console.log('\nTest 6: Validation des erreurs');
assertThrows(() => reynolds.calculateReynolds(-998, 1.0, 0.05, 1e-3), 'ρ < 0 → erreur');
assertThrows(() => reynolds.calculateReynolds(998, 1.0, -0.05, 1e-3), 'D < 0 → erreur');
assertThrows(() => reynolds.calculateReynolds(998, 1.0, 0.05, -1e-3), 'μ < 0 → erreur');

// ===== TESTS FRICTION FACTOR =====
console.log('\n\n=== Tests: friction-factor.js ===\n');

console.log('Test 7: Facteur de friction laminaire');
const f_lam = friction.frictionFactorLaminar(1000);
assertClose(f_lam, 0.064, 0.001, 'f = 64/1000 = 0.064');

console.log('\nTest 8: Churchill pour turbulent lisse');
// Re=50000, ε/D=0 (lisse) → f ≈ 0.0176-0.021 (Churchill peut différer légèrement)
const f_churchill_smooth = friction.frictionFactorChurchill(50000, 0);
assertClose(f_churchill_smooth, 0.019, 0.10, 'f ≈ 0.019 (lisse, tolérance 10%)');

console.log('\nTest 9: Churchill pour turbulent rugueux');
// Re=50000, ε/D=0.001 → f ≈ 0.0252
const f_churchill_rough = friction.frictionFactorChurchill(50000, 0.001);
assertClose(f_churchill_rough, 0.0252, 0.05, 'f ≈ 0.0252 (rugueux)');

console.log('\nTest 10: Colebrook vs Churchill (doivent être proches)');
const Re_test = 50000;
const eps_D = 0.000857; // Acier commercial DN50
const f_colebrook = friction.frictionFactorColebrook(Re_test, eps_D);
const f_churchill = friction.frictionFactorChurchill(Re_test, eps_D);
assertClose(f_churchill, f_colebrook, 0.02, 'Churchill ≈ Colebrook (< 2% diff)');

console.log('\nTest 11: Sélection automatique de corrélation');
const f_auto_lam = friction.frictionFactor(1000, 0.001);
assertClose(f_auto_lam, 0.064, 0.001, 'Auto-sélection laminaire');
const f_auto_turb = friction.frictionFactor(50000, 0.001);
assertClose(f_auto_turb, f_churchill_rough, 0.001, 'Auto-sélection turbulent');

console.log('\nTest 12: Régime transitoire (interpolation)');
const f_trans = friction.frictionFactorTransitional(3000, 0.001);
// Doit être entre f(2300) et f(4000)
const f_2300 = friction.frictionFactorLaminar(2300);
const f_4000 = friction.frictionFactorChurchill(4000, 0.001);
// f doit être entre les deux valeurs (min et max)
const f_min = Math.min(f_2300, f_4000);
const f_max = Math.max(f_2300, f_4000);
if (f_trans >= f_min && f_trans <= f_max) {
  testsPassed++;
  testsRun++;
  console.log(`  ✓ f_trans (${f_trans.toFixed(4)}) entre ${f_min.toFixed(4)} et ${f_max.toFixed(4)}`);
} else {
  testsFailed++;
  testsRun++;
  console.log(`  ✗ f_trans (${f_trans.toFixed(4)}) hors limites [${f_min.toFixed(4)}, ${f_max.toFixed(4)}]`);
}

console.log('\nTest 13: Validation Moody - Point de référence');
// Re=10^5, ε/D=0.001 → f ≈ 0.0235 (d'après diagramme Moody)
const f_moody = friction.frictionFactorChurchill(100000, 0.001);
assertClose(f_moody, 0.0235, 0.05, 'Validation diagramme de Moody');

// ===== TESTS PRESSURE DROP =====
console.log('\n\n=== Tests: pressure-drop.js ===\n');

console.log('Test 14: Perte de charge Darcy-Weisbach');
// f=0.02, L=100m, D=0.0525m, ρ=998 kg/m³, V=1 m/s
const dP = pressureBasic.pressureDropDarcy(0.02, 100, 0.0525, 998, 1.0);
// ΔP = 0.02 × (100/0.0525) × (998×1²/2) = 19010 Pa
assertClose(dP, 19010, 0.01, 'ΔP ≈ 19010 Pa');

console.log('\nTest 15: Head loss');
const h_L = pressureBasic.headLoss(19010, 998);
// h_L = 19010 / (998 × 9.81) = 1.94 m
assertClose(h_L, 1.94, 0.01, 'h_L ≈ 1.94 m colonne d\'eau');

console.log('\nTest 16: Vitesse depuis débit');
// Q = 1 L/min = 1.667e-5 m³/s, D = 0.0525m
const V_calc = geometry.velocityFromFlowrate(1.667e-5, 0.0525);
// A = π × 0.0525² / 4 = 2.165e-3 m²
// V = 1.667e-5 / 2.165e-3 = 0.0077 m/s
assertClose(V_calc, 0.0077, 0.01, 'V ≈ 0.0077 m/s');

console.log('\nTest 17: Débit depuis vitesse');
const Q_calc = geometry.flowrateFromVelocity(1.0, 0.0525);
// Q = 1 × (π × 0.0525²/4) = 2.165e-3 m³/s ≈ 130 L/min
assertClose(Q_calc, 2.165e-3, 0.01, 'Q ≈ 2.165e-3 m³/s (130 L/min)');

console.log('\nTest 18: Débit massique');
const m_dot = geometry.massFlowrate(2.165e-3, 998);
// ṁ = 2.165e-3 × 998 = 2.16 kg/s
assertClose(m_dot, 2.16, 0.01, 'ṁ ≈ 2.16 kg/s');

console.log('\nTest 19: Pression dynamique');
const P_dyn = pressureBasic.dynamicPressure(998, 1.0);
// P_dyn = 998 × 1² / 2 = 499 Pa
assertClose(P_dyn, 499, 0.01, 'P_dyn = 499 Pa');

console.log('\nTest 20: Cas complet - Eau DN50, L=50m, V=1 m/s');
// Étape 1: Reynolds
const rho_water = 998;
const mu_water = 1.002e-3;
const D = 0.0525;
const V = 1.0;
const L = 50;
const Re_full = reynolds.calculateReynolds(rho_water, V, D, mu_water);
console.log(`  Re = ${Re_full.toFixed(0)}`);

// Étape 2: Facteur de friction (acier commercial ε=0.045mm)
const epsilon = 0.045e-3; // m
const eps_D_full = epsilon / D;
const f_full = friction.frictionFactor(Re_full, eps_D_full);
console.log(`  f = ${f_full.toFixed(4)}`);

// Étape 3: Perte de charge
const dP_full = pressureBasic.pressureDropDarcy(f_full, L, D, rho_water, V);
console.log(`  ΔP = ${dP_full.toFixed(0)} Pa (${(dP_full / 1e5).toFixed(3)} bar)`);

// Validation approximative: ΔP ≈ 9000-12000 Pa
if (dP_full > 9000 && dP_full < 12000) {
  testsPassed++;
  testsRun++;
  console.log(`  ✓ Cas complet cohérent (ΔP dans plage attendue)`);
} else {
  testsFailed++;
  testsRun++;
  console.log(`  ✗ Cas complet hors plage attendue`);
}

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Phase 1.2 Hydraulique');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

// Code de sortie
process.exit(testsFailed > 0 ? 1 : 0);

