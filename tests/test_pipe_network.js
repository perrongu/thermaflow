/**
 * test_pipe_network.js
 * 
 * Tests pour le module pipe-network (Phase 2 - Engine)
 * 
 * Teste la propagation multi-segments:
 * - Configuration valide
 * - Propagation de la température
 * - Accumulation des pertes
 * - Profils T(x), P(x)
 * 
 * Exécution: node tests/test_pipe_network.js
 */

const pipeNetwork = require('../js/engine/pipe-network.js');

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
console.log('TESTS: pipe-network.js');
console.log('='.repeat(70) + '\n');

// ========== CONFIGURATION DE BASE ==========
const baseConfig = {
  geometry: {
    D_inner: 0.0525,
    D_outer: 0.0603,
    roughness: 0.045e-3,
    material: 'steel'
  },
  totalLength: 100,
  numSegments: 10,
  fluid: {
    T_in: 60,
    P: 3.0,
    m_dot: 2.0
  },
  ambient: {
    T_amb: -10,
    V_wind: 5.0
  },
  insulation: {
    material: 'fiberglass',
    thickness: 0.020
  }
};

// ========== SUITE 1: VALIDATION DES ENTRÉES ==========
console.log('Suite 1: Validation des entrées\n');

// Test 1.1: Configuration valide
try {
  const result = pipeNetwork.calculatePipeNetwork(baseConfig);
  assert(result !== null, 'Configuration valide devrait retourner un résultat');
  assert(Array.isArray(result.T_profile), 'T_profile devrait être un tableau');
  assert(Array.isArray(result.x_profile), 'x_profile devrait être un tableau');
  assert(Array.isArray(result.P_profile), 'P_profile devrait être un tableau');
} catch (e) {
  assert(false, `Configuration valide ne devrait pas lever d'erreur: ${e.message}`);
}

// Test 1.2: Config invalide
assertThrows(() => {
  pipeNetwork.calculatePipeNetwork(null);
}, 'Config null devrait lever une erreur');

// Test 1.3: Longueur totale invalide
assertThrows(() => {
  const badConfig = { ...baseConfig, totalLength: 0 };
  pipeNetwork.calculatePipeNetwork(badConfig);
}, 'Longueur totale zéro devrait lever une erreur');

// Test 1.4: Nombre de segments invalide
assertThrows(() => {
  const badConfig = { ...baseConfig, numSegments: 0 };
  pipeNetwork.calculatePipeNetwork(badConfig);
}, 'Nombre segments zéro devrait lever une erreur');

assertThrows(() => {
  const badConfig = { ...baseConfig, numSegments: 2.5 };
  pipeNetwork.calculatePipeNetwork(badConfig);
}, 'Nombre segments non-entier devrait lever une erreur');

// ========== SUITE 2: STRUCTURE DES RÉSULTATS ==========
console.log('\nSuite 2: Structure des résultats\n');

const result1 = pipeNetwork.calculatePipeNetwork(baseConfig);

// Test 2.1: Tailles des tableaux
assert(result1.T_profile.length === baseConfig.numSegments + 1, 
  'T_profile devrait avoir N+1 valeurs');
assert(result1.x_profile.length === baseConfig.numSegments + 1, 
  'x_profile devrait avoir N+1 valeurs');
assert(result1.P_profile.length === baseConfig.numSegments + 1, 
  'P_profile devrait avoir N+1 valeurs');
assert(result1.segmentResults.length === baseConfig.numSegments, 
  'segmentResults devrait avoir N valeurs');

// Test 2.2: Cohérence des profils
assert(result1.T_profile[0] === baseConfig.fluid.T_in, 
  'Première température devrait être T_in');
assert(result1.T_profile[result1.T_profile.length - 1] === result1.T_final, 
  'Dernière température devrait être T_final');
assert(result1.x_profile[0] === 0, 
  'Position initiale devrait être 0');
assertApprox(result1.x_profile[result1.x_profile.length - 1], baseConfig.totalLength, 1e-6, 
  'Position finale devrait être totalLength');
assert(result1.P_profile[0] === baseConfig.fluid.P, 
  'Pression initiale devrait être P');

// ========== SUITE 3: COHÉRENCE PHYSIQUE ==========
console.log('\nSuite 3: Cohérence physique\n');

// Test 3.1: Température décroissante (refroidissement)
let temperatureMonotonic = true;
for (let i = 1; i < result1.T_profile.length; i++) {
  if (result1.T_profile[i] > result1.T_profile[i - 1]) {
    temperatureMonotonic = false;
    break;
  }
}
assert(temperatureMonotonic, 'Température devrait être décroissante (refroidissement)');

// Test 3.2: Pression décroissante (perte de charge)
let pressureMonotonic = true;
for (let i = 1; i < result1.P_profile.length; i++) {
  if (result1.P_profile[i] > result1.P_profile[i - 1]) {
    pressureMonotonic = false;
    break;
  }
}
assert(pressureMonotonic, 'Pression devrait être décroissante (perte de charge)');

// Test 3.3: Position croissante
let positionMonotonic = true;
for (let i = 1; i < result1.x_profile.length; i++) {
  if (result1.x_profile[i] <= result1.x_profile[i - 1]) {
    positionMonotonic = false;
    break;
  }
}
assert(positionMonotonic, 'Position devrait être strictement croissante');

// Test 3.4: Valeurs positives
assert(result1.dP_total > 0, 'Perte de charge totale devrait être positive');
assert(result1.Q_loss_total > 0, 'Perte thermique totale devrait être positive');

// Test 3.5: Température minimale
assert(result1.minTemp <= baseConfig.fluid.T_in, 
  'Température minimale devrait être ≤ T_in');
assert(result1.minTemp >= baseConfig.ambient.T_amb, 
  'Température minimale devrait être ≥ T_amb');
assert(result1.minTempPosition >= 0 && result1.minTempPosition <= baseConfig.totalLength, 
  'Position température minimale devrait être dans [0, L]');

console.log(`  ℹ️  T_in = ${baseConfig.fluid.T_in}°C → T_final = ${result1.T_final.toFixed(2)}°C`);
console.log(`  ℹ️  Température min = ${result1.minTemp.toFixed(2)}°C à ${result1.minTempPosition}m`);
console.log(`  ℹ️  Q_loss_total = ${(result1.Q_loss_total / 1000).toFixed(2)} kW`);
console.log(`  ℹ️  dP_total = ${(result1.dP_total / 1000).toFixed(1)} kPa`);

// ========== SUITE 4: VARIATION DU NOMBRE DE SEGMENTS ==========
console.log('\nSuite 4: Variation du nombre de segments\n');

// Test 4.1: 1 segment
const config1seg = { ...baseConfig, numSegments: 1 };
const result1seg = pipeNetwork.calculatePipeNetwork(config1seg);

// Test 4.2: 10 segments
const config10seg = { ...baseConfig, numSegments: 10 };
const result10seg = pipeNetwork.calculatePipeNetwork(config10seg);

// Test 4.3: 100 segments
const config100seg = { ...baseConfig, numSegments: 100 };
const result100seg = pipeNetwork.calculatePipeNetwork(config100seg);

// Plus de segments = résolution plus fine, mais résultat similaire
assertApprox(result1seg.T_final, result10seg.T_final, 0.5, 
  'T_final devrait être similaire avec différents nombres de segments');
assertApprox(result10seg.T_final, result100seg.T_final, 0.1, 
  'T_final devrait converger avec plus de segments');

console.log(`  ℹ️  1 segment:   T_final = ${result1seg.T_final.toFixed(2)}°C`);
console.log(`  ℹ️  10 segments:  T_final = ${result10seg.T_final.toFixed(2)}°C`);
console.log(`  ℹ️  100 segments: T_final = ${result100seg.T_final.toFixed(2)}°C`);

// ========== SUITE 5: ACCUMULATION DES PERTES ==========
console.log('\nSuite 5: Accumulation des pertes\n');

// Test 5.1: Somme des pertes de segments
let Q_sum_from_segments = 0;
for (let seg of result10seg.segmentResults) {
  Q_sum_from_segments += seg.Q_loss;
}
assertApprox(Q_sum_from_segments, result10seg.Q_loss_total, 1e-6, 
  'Q_loss_total devrait être la somme des Q_loss des segments');

// Test 5.2: Somme des dP
let dP_sum_from_segments = 0;
for (let seg of result10seg.segmentResults) {
  dP_sum_from_segments += seg.dP;
}
assertApprox(dP_sum_from_segments, result10seg.dP_total, 1e-6, 
  'dP_total devrait être la somme des dP des segments');

console.log(`  ℹ️  Somme Q_loss segments: ${(Q_sum_from_segments / 1000).toFixed(2)} kW`);
console.log(`  ℹ️  Q_loss_total:         ${(result10seg.Q_loss_total / 1000).toFixed(2)} kW`);
console.log(`  ℹ️  Somme dP segments:     ${(dP_sum_from_segments / 1000).toFixed(1)} kPa`);
console.log(`  ℹ️  dP_total:              ${(result10seg.dP_total / 1000).toFixed(1)} kPa`);

// ========== SUITE 6: PROPAGATION DE LA TEMPÉRATURE ==========
console.log('\nSuite 6: Propagation de la température\n');

// Test 6.1: T_out[i] = T_in[i+1]
let propagationCorrect = true;
for (let i = 0; i < result10seg.segmentResults.length - 1; i++) {
  const T_out_i = result10seg.segmentResults[i].T_out;
  const T_in_next = result10seg.segmentResults[i + 1].T_in;
  if (Math.abs(T_out_i - T_in_next) > 1e-9) {
    propagationCorrect = false;
    console.error(`    Segment ${i}: T_out = ${T_out_i}, T_in[i+1] = ${T_in_next}`);
    break;
  }
}
assert(propagationCorrect, 'T_out du segment i devrait égaler T_in du segment i+1');

// Test 6.2: Profil T correspond aux segments
for (let i = 0; i < result10seg.segmentResults.length; i++) {
  const seg = result10seg.segmentResults[i];
  assertApprox(seg.T_in, result10seg.T_profile[i], 1e-9, 
    `T_in du segment ${i} devrait correspondre à T_profile[${i}]`);
  assertApprox(seg.T_out, result10seg.T_profile[i + 1], 1e-9, 
    `T_out du segment ${i} devrait correspondre à T_profile[${i + 1}]`);
}

// ========== SUITE 7: FONCTIONS HELPER ==========
console.log('\nSuite 7: Fonctions helper\n');

// Test 7.1: findSegmentAtPosition
const seg0 = pipeNetwork.findSegmentAtPosition(result10seg.x_profile, 0);
const seg5 = pipeNetwork.findSegmentAtPosition(result10seg.x_profile, 50);
const seg10 = pipeNetwork.findSegmentAtPosition(result10seg.x_profile, 100);

assert(seg0 === 0, 'Position 0 devrait être dans segment 0');
assert(seg5 === 4 || seg5 === 5, 'Position 50 devrait être dans segment 4 ou 5 (à l\'interface)');
assert(seg10 === 9, 'Position 100 devrait être dans dernier segment');

// Test 7.2: interpolateTemperature
const T_at_0 = pipeNetwork.interpolateTemperature(result10seg.x_profile, result10seg.T_profile, 0);
const T_at_50 = pipeNetwork.interpolateTemperature(result10seg.x_profile, result10seg.T_profile, 50);
const T_at_100 = pipeNetwork.interpolateTemperature(result10seg.x_profile, result10seg.T_profile, 100);

assertApprox(T_at_0, result10seg.T_profile[0], 1e-9, 
  'Température interpolée à x=0 devrait être T_profile[0]');
assertApprox(T_at_100, result10seg.T_profile[result10seg.T_profile.length - 1], 1e-9, 
  'Température interpolée à x=L devrait être T_profile[N]');
assert(T_at_50 > result10seg.T_profile[result10seg.T_profile.length - 1], 
  'Température à mi-chemin devrait être > T_final');
assert(T_at_50 < result10seg.T_profile[0], 
  'Température à mi-chemin devrait être < T_in');

console.log(`  ℹ️  T(x=0) = ${T_at_0.toFixed(2)}°C`);
console.log(`  ℹ️  T(x=50) = ${T_at_50.toFixed(2)}°C`);
console.log(`  ℹ️  T(x=100) = ${T_at_100.toFixed(2)}°C`);

// Test 7.3: interpolateTemperature hors plage
assertThrows(() => {
  pipeNetwork.interpolateTemperature(result10seg.x_profile, result10seg.T_profile, -10);
}, 'Position négative devrait lever une erreur');

assertThrows(() => {
  pipeNetwork.interpolateTemperature(result10seg.x_profile, result10seg.T_profile, 150);
}, 'Position > L devrait lever une erreur');

// ========== SUITE 8: CAS SANS ISOLATION ==========
console.log('\nSuite 8: Comparaison avec/sans isolation\n');

// Sans isolation
const configNoInsul = { ...baseConfig, insulation: null };
const resultNoInsul = pipeNetwork.calculatePipeNetwork(configNoInsul);

// Avec isolation
const resultWithInsul = result10seg;

// Sans isolation → plus de perte thermique
assert(resultNoInsul.Q_loss_total > resultWithInsul.Q_loss_total, 
  'Sans isolation devrait perdre plus de chaleur');
assert(resultNoInsul.T_final < resultWithInsul.T_final, 
  'Sans isolation devrait avoir T_final plus basse');

console.log(`  ℹ️  Sans isolation: T_final = ${resultNoInsul.T_final.toFixed(2)}°C, Q_loss = ${(resultNoInsul.Q_loss_total / 1000).toFixed(2)} kW`);
console.log(`  ℹ️  Avec isolation: T_final = ${resultWithInsul.T_final.toFixed(2)}°C, Q_loss = ${(resultWithInsul.Q_loss_total / 1000).toFixed(2)} kW`);

// ========== SUITE 9: CAS EXTRÊMES ==========
console.log('\nSuite 9: Cas extrêmes\n');

// Test 9.1: Conduite très longue
const configLong = { ...baseConfig, totalLength: 1000, numSegments: 50 };
const resultLong = pipeNetwork.calculatePipeNetwork(configLong);
assert(resultLong.T_final < result10seg.T_final, 
  'Conduite très longue devrait refroidir davantage');

// Test 9.2: Débit faible
const configLowFlow = { 
  ...baseConfig, 
  fluid: { ...baseConfig.fluid, m_dot: 0.5 },
  numSegments: 10
};
const resultLowFlow = pipeNetwork.calculatePipeNetwork(configLowFlow);
assert(resultLowFlow.T_final < result10seg.T_final, 
  'Débit faible devrait refroidir davantage');

// Test 9.3: Air très froid
const configColdAir = { 
  ...baseConfig, 
  ambient: { ...baseConfig.ambient, T_amb: -40 },
  numSegments: 10
};
const resultColdAir = pipeNetwork.calculatePipeNetwork(configColdAir);
assert(resultColdAir.T_final < result10seg.T_final, 
  'Air très froid devrait refroidir davantage');

console.log(`  ℹ️  Base (100m, 2.0 kg/s, -10°C):  T_final = ${result10seg.T_final.toFixed(2)}°C`);
console.log(`  ℹ️  Long (1000m):                  T_final = ${resultLong.T_final.toFixed(2)}°C`);
console.log(`  ℹ️  Débit faible (0.5 kg/s):       T_final = ${resultLowFlow.T_final.toFixed(2)}°C`);
console.log(`  ℹ️  Air froid (-40°C):             T_final = ${resultColdAir.T_final.toFixed(2)}°C`);

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

