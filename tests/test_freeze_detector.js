/**
 * test_freeze_detector.js
 *
 * Tests pour le module freeze-detector (Phase 2 - Engine)
 *
 * Teste la détection de gel:
 * - Détection correcte du gel
 * - Localisation précise
 * - Cas limites (juste au-dessus/en-dessous de 0°C)
 * - Fonctions utilitaires
 *
 * Exécution: node tests/test_freeze_detector.js
 */

const freezeDetector = require('../js/engine/freeze-detector.js');

// Compteur de tests
let testsTotal = 0;
let testsPassed = 0;

/**
 * Fonction helper pour assertion
 */
function assert(condition, message) {
  testsTotal++;
  if (condition) {
    testsPassed++;
  } else {
    console.error(`  ❌ ÉCHEC: ${message}`);
  }
}

/**
 * Fonction helper pour assertion approximative
 */
function assertApprox(actual, expected, tolerance, message) {
  testsTotal++;
  const diff = Math.abs(actual - expected);
  const relError = expected !== 0 ? Math.abs(diff / expected) : diff;

  if (diff <= tolerance || relError <= tolerance) {
    testsPassed++;
  } else {
    console.error(`  ❌ ÉCHEC: ${message}`);
    console.error(`     Attendu: ${expected}, Obtenu: ${actual}, Différence: ${diff}`);
  }
}

/**
 * Fonction helper pour tester les erreurs
 */
function assertThrows(fn, message) {
  testsTotal++;
  try {
    fn();
    console.error(`  ❌ ÉCHEC: ${message} (aucune erreur levée)`);
  } catch (e) {
    testsPassed++;
  }
}

console.log('\n' + '='.repeat(70));
console.log('TESTS: freeze-detector.js');
console.log('='.repeat(70) + '\n');

// ========== SUITE 1: VALIDATION DES ENTRÉES ==========
console.log('Suite 1: Validation des entrées\n');

// Test 1.1: Profils valides
const validT = [60, 50, 40, 30, 20, 10, 5];
const validX = [0, 10, 20, 30, 40, 50, 60];

try {
  const result = freezeDetector.detectFreeze(validT, validX);
  assert(result !== null, 'Profils valides devraient retourner un résultat');
  assert(typeof result.freezeDetected === 'boolean', 'freezeDetected devrait être un booléen');
  assert(typeof result.minTemp === 'number', 'minTemp devrait être un nombre');
} catch (e) {
  assert(false, `Profils valides ne devraient pas lever d'erreur: ${e.message}`);
}

// Test 1.2: Profils invalides
assertThrows(() => {
  freezeDetector.detectFreeze(null, validX);
}, 'T_profile null devrait lever une erreur');

assertThrows(() => {
  freezeDetector.detectFreeze(validT, null);
}, 'x_profile null devrait lever une erreur');

assertThrows(() => {
  freezeDetector.detectFreeze([], validX);
}, 'T_profile vide devrait lever une erreur');

assertThrows(() => {
  freezeDetector.detectFreeze(validT, []);
}, 'x_profile vide devrait lever une erreur');

// Test 1.3: Profils de tailles différentes
assertThrows(() => {
  freezeDetector.detectFreeze([60, 50, 40], [0, 10]);
}, 'Profils de tailles différentes devraient lever une erreur');

// Test 1.4: Valeurs non-numériques
assertThrows(() => {
  freezeDetector.detectFreeze([60, 'invalid', 40], validX);
}, 'Valeurs non-numériques dans T_profile devraient lever une erreur');

// ========== SUITE 2: DÉTECTION PAS DE GEL ==========
console.log('\nSuite 2: Détection - Pas de gel\n');

// Test 2.1: Température bien au-dessus du gel
const T_safe = [60, 55, 50, 45, 40, 35, 30];
const x_safe = [0, 10, 20, 30, 40, 50, 60];
const result_safe = freezeDetector.detectFreeze(T_safe, x_safe, 0);

assert(result_safe.freezeDetected === false, 'Ne devrait pas détecter de gel');
assert(result_safe.freezePosition === null, 'freezePosition devrait être null');
assert(result_safe.minTemp === 30, 'minTemp devrait être 30°C');
assert(result_safe.minTempPosition === 60, 'minTempPosition devrait être 60m');
assert(result_safe.marginToFreeze === 30, 'Marge devrait être 30°C');
assert(result_safe.verdict === 'NO_FREEZE', 'Verdict devrait être NO_FREEZE');

console.log(
  `  ℹ️  Cas sûr: minTemp = ${result_safe.minTemp}°C, marge = ${result_safe.marginToFreeze}°C`
);

// Test 2.2: Température juste au-dessus du gel
const T_close = [10, 8, 5, 3, 1, 0.5, 0.1];
const x_close = [0, 10, 20, 30, 40, 50, 60];
const result_close = freezeDetector.detectFreeze(T_close, x_close, 0);

assert(result_close.freezeDetected === false, 'Ne devrait pas détecter de gel (juste au-dessus)');
assert(result_close.minTemp === 0.1, 'minTemp devrait être 0.1°C');
assertApprox(result_close.marginToFreeze, 0.1, 1e-9, 'Marge devrait être 0.1°C');

console.log(
  `  ℹ️  Cas limite: minTemp = ${result_close.minTemp}°C, marge = ${result_close.marginToFreeze}°C`
);

// ========== SUITE 3: DÉTECTION GEL ==========
console.log('\nSuite 3: Détection - Gel présent\n');

// Test 3.1: Gel franc
const T_freeze1 = [60, 40, 20, 10, 0, -5, -10];
const x_freeze1 = [0, 10, 20, 30, 40, 50, 60];
const result_freeze1 = freezeDetector.detectFreeze(T_freeze1, x_freeze1, 0);

assert(result_freeze1.freezeDetected === true, 'Devrait détecter le gel');
assert(result_freeze1.freezePosition !== null, 'freezePosition ne devrait pas être null');
assert(result_freeze1.minTemp === -10, 'minTemp devrait être -10°C');
assert(result_freeze1.marginToFreeze === -10, 'Marge devrait être -10°C');
assert(result_freeze1.verdict === 'FREEZE_DETECTED', 'Verdict devrait être FREEZE_DETECTED');

console.log(
  `  ℹ️  Gel franc: Position gel = ${result_freeze1.freezePosition.toFixed(1)}m, minTemp = ${result_freeze1.minTemp}°C`
);

// Test 3.2: Gel juste à 0°C
const T_freeze2 = [10, 8, 5, 3, 1, 0, -0.5];
const x_freeze2 = [0, 10, 20, 30, 40, 50, 60];
const result_freeze2 = freezeDetector.detectFreeze(T_freeze2, x_freeze2, 0);

assert(result_freeze2.freezeDetected === true, 'Devrait détecter le gel à 0°C');
assertApprox(result_freeze2.freezePosition, 50, 5, 'Position gel devrait être proche de 50m');

console.log(`  ℹ️  Gel à 0°C: Position gel = ${result_freeze2.freezePosition.toFixed(1)}m`);

// Test 3.3: Gel au début
const T_freeze3 = [-5, -3, -1, 0, 5, 10, 15];
const x_freeze3 = [0, 10, 20, 30, 40, 50, 60];
const result_freeze3 = freezeDetector.detectFreeze(T_freeze3, x_freeze3, 0);

assert(result_freeze3.freezeDetected === true, 'Devrait détecter le gel au début');
assert(result_freeze3.freezePosition <= 30, 'Position gel devrait être au début');

console.log(`  ℹ️  Gel début: Position gel = ${result_freeze3.freezePosition.toFixed(1)}m`);

// Test 3.4: Gel à la fin
const T_freeze4 = [60, 50, 40, 30, 20, 10, 0, -2];
const x_freeze4 = [0, 10, 20, 30, 40, 50, 60, 70];
const result_freeze4 = freezeDetector.detectFreeze(T_freeze4, x_freeze4, 0);

assert(result_freeze4.freezeDetected === true, 'Devrait détecter le gel à la fin');
assert(result_freeze4.freezePosition >= 50, 'Position gel devrait être à la fin');

console.log(`  ℹ️  Gel fin: Position gel = ${result_freeze4.freezePosition.toFixed(1)}m`);

// ========== SUITE 4: INTERPOLATION POSITION GEL ==========
console.log('\nSuite 4: Interpolation position gel\n');

// Test 4.1: Interpolation linéaire simple
const T_interp = [10, 5, 0, -5];
const x_interp = [0, 50, 100, 150];
const result_interp = freezeDetector.detectFreeze(T_interp, x_interp, 0);

assert(result_interp.freezeDetected === true, 'Devrait détecter le gel');
assertApprox(
  result_interp.freezePosition,
  100,
  1,
  'Position gel devrait être à 100m (interpolation)'
);

console.log(
  `  ℹ️  Interpolation: Position gel = ${result_interp.freezePosition.toFixed(1)}m (attendu: 100m)`
);

// Test 4.2: Interpolation avec pente différente
const T_interp2 = [20, 10, -10];
const x_interp2 = [0, 50, 100];
const result_interp2 = freezeDetector.detectFreeze(T_interp2, x_interp2, 0);

// T = 10 à x=50, T = -10 à x=100
// 0°C devrait être à x = 50 + (0-10)/(-10-10) * 50 = 50 + 25 = 75m
assertApprox(result_interp2.freezePosition, 75, 1, 'Position gel devrait être à 75m');

console.log(
  `  ℹ️  Interpolation 2: Position gel = ${result_interp2.freezePosition.toFixed(1)}m (attendu: 75m)`
);

// ========== SUITE 5: TEMPÉRATURE DE GEL PERSONNALISÉE ==========
console.log('\nSuite 5: Température de gel personnalisée\n');

// Test 5.1: T_freeze = 5°C
const T_custom = [20, 15, 10, 7, 4, 2, 1];
const x_custom = [0, 10, 20, 30, 40, 50, 60];
const result_custom = freezeDetector.detectFreeze(T_custom, x_custom, 5);

assert(result_custom.freezeDetected === true, 'Devrait détecter gel à 5°C');
assert(result_custom.T_freeze === 5, 'T_freeze devrait être 5°C');
assert(result_custom.freezePosition !== null, 'freezePosition ne devrait pas être null');
assert(result_custom.freezePosition < 40, 'Position gel devrait être avant 40m');

console.log(`  ℹ️  T_freeze=5°C: Position gel = ${result_custom.freezePosition.toFixed(1)}m`);

// Test 5.2: T_freeze = -20°C (pas de gel)
const T_cold = [10, 5, 0, -5, -10, -15];
const x_cold = [0, 10, 20, 30, 40, 50];
const result_cold = freezeDetector.detectFreeze(T_cold, x_cold, -20);

assert(result_cold.freezeDetected === false, 'Ne devrait pas détecter gel à -20°C');
assert(result_cold.marginToFreeze === 5, 'Marge devrait être 5°C (-15 - (-20))');

console.log(`  ℹ️  T_freeze=-20°C: Pas de gel, marge = ${result_cold.marginToFreeze}°C`);

// ========== SUITE 6: FONCTIONS UTILITAIRES ==========
console.log('\nSuite 6: Fonctions utilitaires\n');

// Test 6.1: checkFreezeSimple
const simple_no_freeze = freezeDetector.checkFreezeSimple([10, 8, 5, 3, 1], 0);
const simple_freeze = freezeDetector.checkFreezeSimple([10, 5, 0, -2], 0);

assert(simple_no_freeze === false, 'checkFreezeSimple devrait retourner false');
assert(simple_freeze === true, 'checkFreezeSimple devrait retourner true');

// Test 6.2: freezeMargin
const margin1 = freezeDetector.freezeMargin([10, 8, 5, 3], 0);
const margin2 = freezeDetector.freezeMargin([10, 5, 0, -5], 0);

assertApprox(margin1, 3, 1e-9, 'Marge devrait être 3°C');
assertApprox(margin2, -5, 1e-9, 'Marge devrait être -5°C');

console.log(`  ℹ️  freezeMargin: +3°C (pas gel), -5°C (gel)`);

// Test 6.3: requiresInsulation
const needs1 = freezeDetector.requiresInsulation(10, 0, 5); // 10 > 5 → false
const needs2 = freezeDetector.requiresInsulation(3, 0, 5); // 3 < 5 → true
const needs3 = freezeDetector.requiresInsulation(-1, 0, 5); // -1 < 5 → true

assert(needs1 === false, 'T=10°C ne devrait pas nécessiter isolation (marge 5°C)');
assert(needs2 === true, 'T=3°C devrait nécessiter isolation (marge 5°C)');
assert(needs3 === true, 'T=-1°C devrait nécessiter isolation');

console.log(`  ℹ️  requiresInsulation: T=10°C → false, T=3°C → true, T=-1°C → true`);

// Test 6.4: generateFreezeMessage
const msg_no_freeze = freezeDetector.generateFreezeMessage(result_safe);
const msg_freeze = freezeDetector.generateFreezeMessage(result_freeze1);

assert(msg_no_freeze.includes('PAS DE RISQUE'), 'Message devrait indiquer pas de gel');
assert(msg_freeze.includes('RISQUE DE GEL'), 'Message devrait indiquer gel détecté');
assert(msg_freeze.includes('m'), 'Message devrait inclure position');

console.log(`  ℹ️  Message (pas gel): "${msg_no_freeze}"`);
console.log(`  ℹ️  Message (gel):     "${msg_freeze}"`);

// ========== SUITE 7: CAS LIMITES ==========
console.log('\nSuite 7: Cas limites\n');

// Test 7.1: Un seul point
const T_single = [5];
const x_single = [0];
const result_single = freezeDetector.detectFreeze(T_single, x_single, 0);

assert(result_single.freezeDetected === false, 'Un point au-dessus ne devrait pas geler');
assert(result_single.minTemp === 5, 'minTemp devrait être 5°C');

// Test 7.2: Deux points, pas de gel
const T_two = [10, 5];
const x_two = [0, 100];
const result_two = freezeDetector.detectFreeze(T_two, x_two, 0);

assert(result_two.freezeDetected === false, 'Deux points au-dessus ne devraient pas geler');

// Test 7.3: Deux points, gel
const T_two_freeze = [5, -5];
const x_two_freeze = [0, 100];
const result_two_freeze = freezeDetector.detectFreeze(T_two_freeze, x_two_freeze, 0);

assert(result_two_freeze.freezeDetected === true, 'Deux points avec gel devraient être détectés');
assertApprox(result_two_freeze.freezePosition, 50, 1, 'Position gel devrait être au milieu');

console.log(
  `  ℹ️  Deux points gel: Position = ${result_two_freeze.freezePosition.toFixed(1)}m (attendu: 50m)`
);

// Test 7.4: Température constante au point de gel
const T_constant = [0, 0, 0, 0];
const x_constant = [0, 10, 20, 30];
const result_constant = freezeDetector.detectFreeze(T_constant, x_constant, 0);

assert(result_constant.freezeDetected === true, 'Température constante à 0°C devrait être gel');
assert(result_constant.minTemp === 0, 'minTemp devrait être 0°C');

// Test 7.5: Profil non-monotone
const T_nonmono = [60, 40, 50, 30, 20, 40, 10];
const x_nonmono = [0, 10, 20, 30, 40, 50, 60];
const result_nonmono = freezeDetector.detectFreeze(T_nonmono, x_nonmono, 0);

assert(result_nonmono.freezeDetected === false, 'Profil non-monotone sans gel');
assert(result_nonmono.minTemp === 10, 'minTemp devrait être 10°C');

console.log(`  ℹ️  Profil non-monotone: minTemp = ${result_nonmono.minTemp}°C`);

// ========== RÉSUMÉ ==========
console.log('\n' + '='.repeat(70));
console.log('RÉSUMÉ DES TESTS');
console.log('='.repeat(70) + '\n');

console.log(`Tests réussis: ${testsPassed}/${testsTotal}`);

if (testsPassed === testsTotal) {
  console.log('✅ TOUS LES TESTS PASSENT\n');
  process.exit(0);
} else {
  console.log(`❌ ${testsTotal - testsPassed} TEST(S) EN ÉCHEC\n`);
  process.exit(1);
}
