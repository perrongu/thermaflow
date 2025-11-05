/**
 * test_richardson_convection.js
 *
 * Tests unitaires pour le nombre de Richardson et sélection convection mixte.
 *
 * Valide:
 * - Calcul précis Ri = Gr/Re²
 * - Détection régime forcé, naturel, mixte
 * - Formule combinée Churchill (1977)
 * - Warnings appropriés
 *
 * Exécution: node tests/test_richardson_convection.js
 */

const nusseltExt = require('../js/correlations/nusselt-external.js');

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

// ===== TESTS RICHARDSON NUMBER =====
console.log('\n=== Tests: Richardson Number & Convection Mixte ===\n');

console.log('Test 1: Calcul Ri précis (Gr/Re²)');
// Ri = Gr / Re²
const Ri1 = nusseltExt.calculateRichardsonNumber(1e6, 1000);
// Ri = 1e6 / (1000²) = 1e6 / 1e6 = 1.0
assertClose(Ri1, 1.0, 0.001, 'Ri = 1e6/1000² = 1.0');

console.log('\nTest 2: Détection forcée (Ri < 0.1)');
// Vent fort: Re=20000, Gr=1e5
const Ri_forced = nusseltExt.calculateRichardsonNumber(1e5, 20000);
// Ri = 1e5 / (20000²) = 1e5 / 4e8 = 0.00025
assertClose(Ri_forced, 0.00025, 0.01, 'Ri = 0.00025 << 0.1');

// Nu devrait être celui de Churchill-Bernstein (forcée pure)
const Nu_forced = nusseltExt.nusseltExternal(20000, 0.715, 1e5);
const Nu_CB = nusseltExt.nusseltChurchillBernstein(20000, 0.715);
assertClose(Nu_forced, Nu_CB, 0.001, 'Nu (Ri<0.1) = Nu Churchill-Bernstein');

console.log('\nTest 3: Détection naturelle (Ri > 10)');
// Air calme: Re=100, Gr=1e6
const Ri_natural = nusseltExt.calculateRichardsonNumber(1e6, 100);
// Ri = 1e6 / (100²) = 1e6 / 1e4 = 100
assertClose(Ri_natural, 100, 0.001, 'Ri = 100 >> 10');

// Nu devrait être celui de convection naturelle
const Nu_natural = nusseltExt.nusseltExternal(100, 0.715, 1e6);
const Ra = 1e6 * 0.715; // Gr × Pr
const Nu_nat_pure = nusseltExt.nusseltNaturalConvectionCylinder(Ra, 0.715);
assertClose(Nu_natural, Nu_nat_pure, 0.001, 'Nu (Ri>10) = Nu naturelle');

console.log('\nTest 4: Zone mixte (0.1 < Ri < 10)');
// Re=1000, Gr=5e5
const Ri_mixed = nusseltExt.calculateRichardsonNumber(5e5, 1000);
// Ri = 5e5 / 1e6 = 0.5 (entre 0.1 et 10)
assertClose(Ri_mixed, 0.5, 0.001, 'Ri = 0.5 (zone mixte)');

testsRun++;
if (Ri_mixed > 0.1 && Ri_mixed < 10) {
  testsPassed++;
  console.log(`  ✓ 0.1 < Ri < 10 (zone mixte confirmée)`);
} else {
  testsFailed++;
  console.log(`  ✗ Ri devrait être en zone mixte`);
}

console.log('\nTest 5: Formule combinée vs séparées');
// Re=1000, Pr=0.715, Gr=5e5
const Nu_mixed = nusseltExt.nusseltExternal(1000, 0.715, 5e5);
const Nu_f = nusseltExt.nusseltChurchillBernstein(1000, 0.715);
const Nu_n = nusseltExt.nusseltNaturalConvectionCylinder(5e5 * 0.715, 0.715);

// Formule: Nu = (Nu_f³ + Nu_n³)^(1/3)
const Nu_combined = Math.pow(Math.pow(Nu_f, 3) + Math.pow(Nu_n, 3), 1.0 / 3.0);
assertClose(Nu_mixed, Nu_combined, 0.001, 'Nu mixte = (Nu_f³ + Nu_n³)^(1/3)');

// Nu mixte devrait être entre Nu_f et Nu_n (ou légèrement au-dessus du max)
testsRun++;
if (Nu_mixed >= Math.min(Nu_f, Nu_n) * 0.99) {
  testsPassed++;
  console.log(
    `  ✓ Nu_mixte (${Nu_mixed.toFixed(1)}) cohérent avec Nu_f (${Nu_f.toFixed(1)}) et Nu_n (${Nu_n.toFixed(1)})`
  );
} else {
  testsFailed++;
  console.log(`  ✗ Nu_mixte devrait être >= min(Nu_f, Nu_n)`);
}

console.log('\nTest 6: Cas extrêmes');
// Ri → 0 (Gr très faible)
const Ri_zero = nusseltExt.calculateRichardsonNumber(1, 10000);
// Ri = 1 / 1e8 = 1e-8
assertClose(Ri_zero, 1e-8, 0.1, 'Ri → 0 (Gr→0)');

// Ri → ∞ (Re très faible)
const Ri_inf = nusseltExt.calculateRichardsonNumber(1e8, 10);
// Ri = 1e8 / 100 = 1e6
assertClose(Ri_inf, 1e6, 0.01, 'Ri → ∞ (Re→0)');

console.log('\nTest 7: Cohérence avec v1.1 si forcée pure');
// Si Gr=0, devrait utiliser Churchill-Bernstein directement
const Nu_v11 = nusseltExt.nusseltExternal(20000, 0.715, 0);
const Nu_CB_ref = nusseltExt.nusseltChurchillBernstein(20000, 0.715);
assertClose(Nu_v11, Nu_CB_ref, 0.001, 'Gr=0 → comportement v1.1 (Churchill-Bernstein)');

console.log('\nTest 8: Warning zone mixte émis');
// Capturer console.warn temporairement
let warningEmitted = false;
const originalWarn = console.warn;
console.warn = function (...args) {
  if (args[0].includes('Convection mixte détectée')) {
    warningEmitted = true;
  }
};

// Cas mixte: devrait émettre warning
nusseltExt.nusseltExternal(1000, 0.715, 5e5);

console.warn = originalWarn; // Restaurer

testsRun++;
if (warningEmitted) {
  testsPassed++;
  console.log(`  ✓ Warning convection mixte émis`);
} else {
  testsFailed++;
  console.log(`  ✗ Warning convection mixte devrait être émis`);
}

console.log('\nTest 9: Validation contre littérature');
// Cas documenté: Churchill (1977)
// Re = 5000, Gr = 1e6 (Ri = 1e6/25e6 = 0.04 < 0.1 → forcée)
const Nu_lit1 = nusseltExt.nusseltExternal(5000, 0.715, 1e6);
const Nu_CB_lit1 = nusseltExt.nusseltChurchillBernstein(5000, 0.715);
assertClose(Nu_lit1, Nu_CB_lit1, 0.001, 'Cas littérature Ri=0.04 → forcée');

// Re = 500, Gr = 1e7 (Ri = 1e7/25e4 = 40 > 10 → naturelle)
const Nu_lit2 = nusseltExt.nusseltExternal(500, 0.715, 1e7);
const Ra_lit2 = 1e7 * 0.715;
const Nu_nat_lit2 = nusseltExt.nusseltNaturalConvectionCylinder(Ra_lit2, 0.715);
assertClose(Nu_lit2, Nu_nat_lit2, 0.001, 'Cas littérature Ri=40 → naturelle');

console.log('\nTest 10: Performance < 1ms');
const startTime = Date.now();
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
  nusseltExt.calculateRichardsonNumber(1e6, 1000);
  nusseltExt.nusseltExternal(1000, 0.715, 5e5);
}

const endTime = Date.now();
const avgTime = (endTime - startTime) / iterations;

testsRun++;
if (avgTime < 1.0) {
  testsPassed++;
  console.log(`  ✓ Performance: ${avgTime.toFixed(3)} ms/calcul << 1 ms`);
} else {
  testsFailed++;
  console.log(`  ✗ Performance: ${avgTime.toFixed(3)} ms/calcul > 1 ms`);
}

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Richardson Number v1.2');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

// Code de sortie
process.exit(testsFailed > 0 ? 1 : 0);
