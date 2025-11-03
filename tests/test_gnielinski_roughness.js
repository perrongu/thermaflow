/**
 * test_gnielinski_roughness.js
 * 
 * Tests validant l'amélioration v1.1: paramètre friction factor optionnel 
 * dans nusseltGnielinski pour conduite rugueuse.
 * 
 * Valide:
 * - Différence Nu avec f lisse (Petukhov) vs f rugueux (Churchill)
 * - Impact sur h_conv et Q_loss
 * - Warning émis si f non fourni
 * 
 * Exécution: node tests/test_gnielinski_roughness.js
 */

const nusseltInt = require('../js/correlations/nusselt-internal.js');
const friction = require('../js/correlations/friction-factor.js');

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
    console.log(`    Attendu: ${expected}, Obtenu: ${actual}, Erreur: ${(relativeError * 100).toFixed(2)}%`);
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

// ===== TESTS GNIELINSKI ROUGHNESS =====
console.log('\n=== Tests: Gnielinski Friction Factor (Lisse vs Rugueux) ===\n');

console.log('Test 1: Conduite lisse (ε/D = 0) - f Petukhov vs Churchill < 2% écart');
const Re_smooth = 50000;
const epsilon_D_smooth = 0.0;
const f_churchill_smooth = friction.frictionFactorChurchill(Re_smooth, epsilon_D_smooth);
const f_petukhov = Math.pow(0.79 * Math.log(Re_smooth) - 1.64, -2);  // Formule Petukhov

assertClose(f_churchill_smooth, f_petukhov, 0.02, `f Churchill (${f_churchill_smooth.toFixed(6)}) ≈ f Petukhov (${f_petukhov.toFixed(6)})`);

console.log('\nTest 2: Conduite rugueuse (ε/D = 0.001) - f Churchill avec rugosité');
const Re_rough = 50000;
const epsilon_D_rough = 0.001;  // Acier commercial
const f_churchill_rough = friction.frictionFactorChurchill(Re_rough, epsilon_D_rough);

// f rugueux devrait être significativement > f lisse
assertGreater(f_churchill_rough, f_churchill_smooth, `f rugueux (${f_churchill_rough.toFixed(6)}) > f lisse (${f_churchill_smooth.toFixed(6)})`);

console.log('\nTest 3: Gnielinski avec f lisse vs f rugueux - Nu différence 15-25%');
const Pr = 7.0;  // Eau à 20°C

// Gnielinski sans f (Petukhov par défaut)
let warningEmitted = false;
const originalWarn = console.warn;
console.warn = function(...args) {
  if (args[0] && args[0].includes('friction factor lisse')) {
    warningEmitted = true;
  }
};
const Nu_smooth_default = nusseltInt.nusseltGnielinski(Re_rough, Pr);  // Sans f → Petukhov
console.warn = originalWarn;

// Gnielinski avec f rugueux explicite
const Nu_rough = nusseltInt.nusseltGnielinski(Re_rough, Pr, f_churchill_rough);

const diff_pct = ((Nu_rough - Nu_smooth_default) / Nu_smooth_default) * 100;

assertGreater(diff_pct, 10, `Différence Nu lisse→rugueux: ${diff_pct.toFixed(1)}% > 10%`);
assertGreater(30, diff_pct, `Différence Nu lisse→rugueux: ${diff_pct.toFixed(1)}% < 30%`);

console.log('\nTest 4: Re = 10000, ε/D = 0.001 - Validation valeur Nu');
const Re_mid = 10000;
const f_mid = friction.frictionFactorChurchill(Re_mid, epsilon_D_rough);
const Nu_mid = nusseltInt.nusseltGnielinski(Re_mid, Pr, f_mid);

// Valeur attendue: Nu ≈ 70-80 pour Re=10000, Pr=7
assertGreater(Nu_mid, 65, `Nu(Re=10000, Pr=7, rugeux) = ${Nu_mid.toFixed(1)} > 65`);
assertGreater(85, Nu_mid, `Nu(Re=10000, Pr=7, rugeux) = ${Nu_mid.toFixed(1)} < 85`);

console.log('\nTest 5: Re = 50000, ε/D = 0.001 - Validation valeur Nu');
const Nu_high = nusseltInt.nusseltGnielinski(Re_rough, Pr, f_churchill_rough);

// Valeur attendue: Nu ≈ 280-370 pour Re=50000, Pr=7, rugueux
assertGreater(Nu_high, 270, `Nu(Re=50000, Pr=7, rugeux) = ${Nu_high.toFixed(1)} > 270`);
assertGreater(380, Nu_high, `Nu(Re=50000, Pr=7, rugeux) = ${Nu_high.toFixed(1)} < 380`);

console.log('\nTest 6: Re = 100000, lisse vs rugueux');
const Re_veryhigh = 100000;
const f_smooth_vh = friction.frictionFactorChurchill(Re_veryhigh, 0.0);
const f_rough_vh = friction.frictionFactorChurchill(Re_veryhigh, epsilon_D_rough);

const Nu_smooth_vh = nusseltInt.nusseltGnielinski(Re_veryhigh, Pr, f_smooth_vh);
const Nu_rough_vh = nusseltInt.nusseltGnielinski(Re_veryhigh, Pr, f_rough_vh);

const diff_vh = ((Nu_rough_vh - Nu_smooth_vh) / Nu_smooth_vh) * 100;

assertGreater(diff_vh, 10, `Différence Nu Re=100k: ${diff_vh.toFixed(1)}% > 10%`);

console.log('\nTest 7: Gnielinski avec f=null - warning émis');
testsRun++;
if (warningEmitted) {
  testsPassed++;
  console.log(`  ✓ Warning "friction factor lisse" émis quand f=null`);
} else {
  testsFailed++;
  console.log(`  ✗ Warning devrait être émis quand f=null`);
}

console.log('\nTest 8: Gnielinski avec f fourni - pas de warning');
let warningEmitted2 = false;
console.warn = function(...args) {
  if (args[0] && args[0].includes('friction factor lisse')) {
    warningEmitted2 = true;
  }
};
nusseltInt.nusseltGnielinski(Re_rough, Pr, f_churchill_rough);  // Avec f
console.warn = originalWarn;

testsRun++;
if (!warningEmitted2) {
  testsPassed++;
  console.log(`  ✓ Pas de warning quand f fourni`);
} else {
  testsFailed++;
  console.log(`  ✗ Warning ne devrait pas être émis quand f fourni`);
}

console.log('\nTest 9: Impact sur h_conv (proportionnel à Nu)');
// h = Nu × k / D
const k_water = 0.6;  // W/(m·K) pour eau à 20°C
const D = 0.05;  // m

const h_smooth = (Nu_smooth_default * k_water) / D;
const h_rough = (Nu_rough * k_water) / D;

const diff_h = ((h_rough - h_smooth) / h_smooth) * 100;

assertClose(diff_h, diff_pct, 0.01, `Différence h_conv = différence Nu: ${diff_h.toFixed(1)}% ≈ ${diff_pct.toFixed(1)}%`);

console.log('\nTest 10: Impact sur Q_loss segment complet (cascade)');
// Q = h × A × ΔT, donc différence h → différence Q

// Si h augmente de 15-25%, Q_loss augmente aussi de 15-25%
// (pour même ΔT, même géométrie)

const A = Math.PI * D * 10;  // Surface 10m de conduite
const DT_log_mean = 50;  // K (exemple)

const Q_smooth = h_smooth * A * DT_log_mean;
const Q_rough = h_rough * A * DT_log_mean;

const diff_Q = ((Q_rough - Q_smooth) / Q_smooth) * 100;

assertClose(diff_Q, diff_pct, 0.01, `Différence Q_loss = différence Nu/h: ${diff_Q.toFixed(1)}% ≈ ${diff_pct.toFixed(1)}%`);

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Gnielinski Roughness v1.1');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

// Code de sortie
process.exit(testsFailed > 0 ? 1 : 0);

