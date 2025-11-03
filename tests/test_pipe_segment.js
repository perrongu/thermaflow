/**
 * test_pipe_segment.js
 * 
 * Tests pour le module pipe-segment (Phase 2 - Engine)
 * 
 * Teste le calcul d'un segment individuel de conduite avec:
 * - Validation des entrées
 * - Calculs hydrauliques
 * - Transfert thermique
 * - Température de sortie
 * - Perte de charge
 * 
 * Exécution: node tests/test_pipe_segment.js
 */

const pipeSegment = require('../js/engine/pipe-segment.js');

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
  const relError = Math.abs(diff / expected);
  
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
console.log('TESTS: pipe-segment.js');
console.log('='.repeat(70) + '\n');

// ========== SUITE 1: VALIDATION DES ENTRÉES ==========
console.log('Suite 1: Validation des entrées\n');

// Configuration valide de base
const validGeometry = {
  D_inner: 0.0525,
  D_outer: 0.0603,
  roughness: 0.045e-3,
  length: 10,
  material: 'steel'
};

const validFluid = {
  T_in: 60,
  P: 3.0,
  m_dot: 2.0
};

const validAmbient = {
  T_amb: -10,
  V_wind: 5.0
};

const validInsulation = {
  material: 'fiberglass',
  thickness: 0.020
};

// Test 1.1: Configuration valide
try {
  const result = pipeSegment.calculatePipeSegment(validGeometry, validFluid, validAmbient, null);
  assert(result !== null, 'Configuration valide devrait retourner un résultat');
  assert(typeof result.T_out === 'number', 'T_out devrait être un nombre');
  assert(typeof result.dP === 'number', 'dP devrait être un nombre');
  assert(typeof result.Q_loss === 'number', 'Q_loss devrait être un nombre');
} catch (e) {
  assert(false, `Configuration valide ne devrait pas lever d'erreur: ${e.message}`);
}

// Test 1.2: Géométrie invalide
assertThrows(() => {
  pipeSegment.calculatePipeSegment(null, validFluid, validAmbient);
}, 'Géométrie null devrait lever une erreur');

assertThrows(() => {
  const badGeom = { ...validGeometry, D_inner: -0.05 };
  pipeSegment.calculatePipeSegment(badGeom, validFluid, validAmbient);
}, 'Diamètre intérieur négatif devrait lever une erreur');

assertThrows(() => {
  const badGeom = { ...validGeometry, D_outer: 0.01 };
  pipeSegment.calculatePipeSegment(badGeom, validFluid, validAmbient);
}, 'Diamètre extérieur < intérieur devrait lever une erreur');

assertThrows(() => {
  const badGeom = { ...validGeometry, length: 0 };
  pipeSegment.calculatePipeSegment(badGeom, validFluid, validAmbient);
}, 'Longueur zéro devrait lever une erreur');

assertThrows(() => {
  const badGeom = { ...validGeometry, material: '' };
  pipeSegment.calculatePipeSegment(badGeom, validFluid, validAmbient);
}, 'Matériau vide devrait lever une erreur');

// Test 1.3: Fluide invalide
assertThrows(() => {
  pipeSegment.calculatePipeSegment(validGeometry, null, validAmbient);
}, 'Fluide null devrait lever une erreur');

assertThrows(() => {
  const badFluid = { ...validFluid, m_dot: 0 };
  pipeSegment.calculatePipeSegment(validGeometry, badFluid, validAmbient);
}, 'Débit zéro devrait lever une erreur');

assertThrows(() => {
  const badFluid = { ...validFluid, P: -1 };
  pipeSegment.calculatePipeSegment(validGeometry, badFluid, validAmbient);
}, 'Pression négative devrait lever une erreur');

// Test 1.4: Ambiant invalide
assertThrows(() => {
  pipeSegment.calculatePipeSegment(validGeometry, validFluid, null);
}, 'Ambiant null devrait lever une erreur');

assertThrows(() => {
  const badAmbient = { ...validAmbient, V_wind: -1 };
  pipeSegment.calculatePipeSegment(validGeometry, validFluid, badAmbient);
}, 'Vitesse vent négative devrait lever une erreur');

// Test 1.5: Isolation invalide
assertThrows(() => {
  const badInsul = { ...validInsulation, thickness: 0 };
  pipeSegment.calculatePipeSegment(validGeometry, validFluid, validAmbient, badInsul);
}, 'Épaisseur isolation zéro devrait lever une erreur');

assertThrows(() => {
  const badInsul = { ...validInsulation, material: '' };
  pipeSegment.calculatePipeSegment(validGeometry, validFluid, validAmbient, badInsul);
}, 'Matériau isolation vide devrait lever une erreur');

// ========== SUITE 2: CALCULS PHYSIQUES BASIQUES ==========
console.log('\nSuite 2: Calculs physiques basiques\n');

// Test 2.1: Cohérence des résultats
const result1 = pipeSegment.calculatePipeSegment(validGeometry, validFluid, validAmbient, null);

assert(result1.T_out < validFluid.T_in, 'T_out devrait être < T_in (refroidissement)');
assert(result1.T_out > validAmbient.T_amb, 'T_out devrait être > T_amb (ne peut pas être plus froid que l\'air)');
assert(result1.dP > 0, 'Perte de charge devrait être positive');
assert(result1.Q_loss > 0, 'Perte thermique devrait être positive');
assert(result1.Re > 0, 'Reynolds devrait être positif');
assert(result1.f > 0, 'Facteur de friction devrait être positif');
assert(result1.V > 0, 'Vitesse devrait être positive');
assert(result1.h_int > 0, 'h_int devrait être positif');
assert(result1.h_ext > 0, 'h_ext devrait être positif');
assert(result1.U > 0, 'U devrait être positif');
assert(result1.NTU > 0, 'NTU devrait être positif');

// Test 2.2: Régime d'écoulement
assert(['laminar', 'transitional', 'turbulent'].includes(result1.regime), 
  'Régime devrait être laminar, transitional ou turbulent');

// Test 2.3: Énergie cohérente (Q = m·cp·ΔT)
const delta_T_calc = validFluid.T_in - result1.T_out;
// On ne peut pas valider exactement car on n'a pas cp exact ici, mais delta_T devrait être petit pour 10m
assert(delta_T_calc < 5, 'ΔT devrait être relativement petit pour 10m de conduite isolée');

// ========== SUITE 3: EFFET DE L'ISOLATION ==========
console.log('\nSuite 3: Effet de l\'isolation\n');

// Test 3.1: Sans isolation
const resultNoInsul = pipeSegment.calculatePipeSegment(validGeometry, validFluid, validAmbient, null);

// Test 3.2: Avec isolation
const resultWithInsul = pipeSegment.calculatePipeSegment(validGeometry, validFluid, validAmbient, validInsulation);

// L'isolation devrait réduire la perte thermique
assert(resultWithInsul.Q_loss < resultNoInsul.Q_loss, 
  'Isolation devrait réduire Q_loss');

// L'isolation devrait augmenter T_out (moins de refroidissement)
assert(resultWithInsul.T_out > resultNoInsul.T_out, 
  'Isolation devrait augmenter T_out');

// L'isolation devrait augmenter la résistance thermique
assert(resultWithInsul.R_total > resultNoInsul.R_total, 
  'Isolation devrait augmenter R_total');

// L'isolation ne devrait PAS affecter l'hydraulique
// Note v1.2: L'itération T_moy peut causer des différences minimes entre cas isolé/non-isolé
// car T_out diffère → T_avg diffère → propriétés fluide diffèrent légèrement
assertApprox(resultWithInsul.dP, resultNoInsul.dP, 1e-2,  // 1% tolérance pour itération T_moy
  'Isolation ne devrait pas affecter dP (hors effet itération T_moy)');
assertApprox(resultWithInsul.Re, resultNoInsul.Re, 1e-2,  // 1% tolérance pour itération T_moy
  'Isolation ne devrait pas affecter Re (hors effet itération T_moy)');

console.log(`  ℹ️  Sans isolation: Q_loss = ${resultNoInsul.Q_loss.toFixed(1)}W, T_out = ${resultNoInsul.T_out.toFixed(2)}°C`);
console.log(`  ℹ️  Avec isolation: Q_loss = ${resultWithInsul.Q_loss.toFixed(1)}W, T_out = ${resultWithInsul.T_out.toFixed(2)}°C`);
console.log(`  ℹ️  Réduction perte: ${((1 - resultWithInsul.Q_loss / resultNoInsul.Q_loss) * 100).toFixed(1)}%`);

// ========== SUITE 4: VARIATION DE LONGUEUR ==========
console.log('\nSuite 4: Variation de longueur\n');

// Test 4.1: Longueur courte (1m)
const geom1m = { ...validGeometry, length: 1 };
const result1m = pipeSegment.calculatePipeSegment(geom1m, validFluid, validAmbient, validInsulation);

// Test 4.2: Longueur moyenne (10m)
const geom10m = { ...validGeometry, length: 10 };
const result10m = pipeSegment.calculatePipeSegment(geom10m, validFluid, validAmbient, validInsulation);

// Test 4.3: Longueur longue (100m)
const geom100m = { ...validGeometry, length: 100 };
const result100m = pipeSegment.calculatePipeSegment(geom100m, validFluid, validAmbient, validInsulation);

// Plus la longueur augmente, plus la perte thermique et ΔP augmentent
assert(result100m.Q_loss > result10m.Q_loss && result10m.Q_loss > result1m.Q_loss,
  'Q_loss devrait augmenter avec la longueur');
assert(result100m.dP > result10m.dP && result10m.dP > result1m.dP,
  'dP devrait augmenter avec la longueur');
assert(result1m.T_out > result10m.T_out && result10m.T_out > result100m.T_out,
  'T_out devrait diminuer avec la longueur');

// Vérifier que Q_loss est approximativement proportionnel à la longueur
// (pour des segments courts où T ne change pas beaucoup)
const ratio_Q = result10m.Q_loss / result1m.Q_loss;
assertApprox(ratio_Q, 10, 1.0, 'Q_loss devrait être ~proportionnel à L (pour petits ΔT)');

console.log(`  ℹ️  1m:   T_out = ${result1m.T_out.toFixed(2)}°C, Q_loss = ${result1m.Q_loss.toFixed(1)}W`);
console.log(`  ℹ️  10m:  T_out = ${result10m.T_out.toFixed(2)}°C, Q_loss = ${result10m.Q_loss.toFixed(1)}W`);
console.log(`  ℹ️  100m: T_out = ${result100m.T_out.toFixed(2)}°C, Q_loss = ${result100m.Q_loss.toFixed(1)}W`);

// ========== SUITE 5: VARIATION DE DÉBIT ==========
console.log('\nSuite 5: Variation de débit\n');

// Test 5.1: Débit faible
const fluidLow = { ...validFluid, m_dot: 0.5 };
const resultLow = pipeSegment.calculatePipeSegment(validGeometry, fluidLow, validAmbient, validInsulation);

// Test 5.2: Débit moyen
const fluidMed = { ...validFluid, m_dot: 2.0 };
const resultMed = pipeSegment.calculatePipeSegment(validGeometry, fluidMed, validAmbient, validInsulation);

// Test 5.3: Débit élevé
const fluidHigh = { ...validFluid, m_dot: 5.0 };
const resultHigh = pipeSegment.calculatePipeSegment(validGeometry, fluidHigh, validAmbient, validInsulation);

// Plus le débit augmente, moins l'eau se refroidit (temps de passage court)
assert(resultLow.T_out < resultMed.T_out && resultMed.T_out < resultHigh.T_out,
  'T_out devrait augmenter avec le débit (moins de temps pour se refroidir)');

// Plus le débit augmente, plus la perte de charge augmente
assert(resultHigh.dP > resultMed.dP && resultMed.dP > resultLow.dP,
  'dP devrait augmenter avec le débit');

// Plus le débit augmente, plus Re augmente
assert(resultHigh.Re > resultMed.Re && resultMed.Re > resultLow.Re,
  'Re devrait augmenter avec le débit');

console.log(`  ℹ️  0.5 kg/s: T_out = ${resultLow.T_out.toFixed(2)}°C, Re = ${resultLow.Re.toFixed(0)}`);
console.log(`  ℹ️  2.0 kg/s: T_out = ${resultMed.T_out.toFixed(2)}°C, Re = ${resultMed.Re.toFixed(0)}`);
console.log(`  ℹ️  5.0 kg/s: T_out = ${resultHigh.T_out.toFixed(2)}°C, Re = ${resultHigh.Re.toFixed(0)}`);

// ========== SUITE 6: CAS EXTRÊMES ==========
console.log('\nSuite 6: Cas extrêmes\n');

// Test 6.1: Eau très chaude
const fluidHot = { ...validFluid, T_in: 90 };
const resultHot = pipeSegment.calculatePipeSegment(validGeometry, fluidHot, validAmbient, validInsulation);
assert(resultHot.T_out > validFluid.T_in, 'Eau très chaude devrait rester > température normale');
assert(resultHot.Q_loss > result10m.Q_loss, 'Eau très chaude devrait perdre plus de chaleur');

// Test 6.2: Air très froid
const ambientCold = { ...validAmbient, T_amb: -40 };
const resultCold = pipeSegment.calculatePipeSegment(validGeometry, validFluid, ambientCold, validInsulation);
assert(resultCold.T_out < result10m.T_out, 'Air très froid devrait refroidir plus l\'eau');
assert(resultCold.Q_loss > result10m.Q_loss, 'Air très froid devrait augmenter Q_loss');

// Test 6.3: Pas de vent
const ambientNoWind = { ...validAmbient, V_wind: 0 };
const resultNoWind = pipeSegment.calculatePipeSegment(validGeometry, validFluid, ambientNoWind, validInsulation);
assert(resultNoWind.h_ext < result10m.h_ext, 'Pas de vent devrait réduire h_ext (convection naturelle)');

// Test 6.4: Vent fort
const ambientStrongWind = { ...validAmbient, V_wind: 20 };
const resultStrongWind = pipeSegment.calculatePipeSegment(validGeometry, validFluid, ambientStrongWind, validInsulation);
assert(resultStrongWind.h_ext > result10m.h_ext, 'Vent fort devrait augmenter h_ext');

console.log(`  ℹ️  T_in=90°C:    Q_loss = ${resultHot.Q_loss.toFixed(1)}W`);
console.log(`  ℹ️  T_amb=-40°C:  Q_loss = ${resultCold.Q_loss.toFixed(1)}W`);
console.log(`  ℹ️  V_wind=0 m/s: h_ext = ${resultNoWind.h_ext.toFixed(1)} W/(m²·K)`);
console.log(`  ℹ️  V_wind=20 m/s: h_ext = ${resultStrongWind.h_ext.toFixed(1)} W/(m²·K)`);

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

