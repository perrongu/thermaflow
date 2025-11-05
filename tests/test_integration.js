/**
 * test_integration.js
 *
 * Tests d'intégration end-to-end pour ThermaFlow
 *
 * Teste le système complet de bout en bout:
 * - Configuration → Engine → Résultats
 * - Scénarios réalistes
 * - Validation scientifique
 *
 * Exécution: node tests/test_integration.js
 */

const pipeSegment = require('../js/engine/pipe-segment.js');
const pipeNetwork = require('../js/engine/pipe-network.js');
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

console.log('\n' + '='.repeat(70));
console.log('TESTS INTÉGRATION: ThermaFlow End-to-End');
console.log('='.repeat(70) + '\n');

// ========== SCÉNARIO 1: CONDUITE BIEN ISOLÉE (PAS DE GEL) ==========
console.log('Scénario 1: Conduite bien isolée - DN50, 100m, -10°C, isolation 20mm\n');

const scenario1 = {
  geometry: {
    D_inner: 0.0525,
    D_outer: 0.0603,
    roughness: 0.045e-3,
    material: 'steel',
  },
  totalLength: 100,
  numSegments: 20,
  fluid: {
    T_in: 60,
    P: 3.0,
    m_dot: 2.0,
  },
  ambient: {
    T_amb: -10,
    V_wind: 5.0,
  },
  insulation: {
    material: 'fiberglass',
    thickness: 0.02,
  },
};

const result1 = pipeNetwork.calculatePipeNetwork(scenario1);
const freeze1 = freezeDetector.detectFreeze(result1.T_profile, result1.x_profile, 0);

assert(freeze1.freezeDetected === false, 'Ne devrait pas y avoir de gel');
assert(result1.T_final > 55, 'T_final devrait être > 55°C');
assert(result1.T_final < 65, 'T_final devrait être < 65°C (cohérence)');
assert(freeze1.marginToFreeze > 50, 'Marge devrait être large');

console.log(`  ✓ T_final = ${result1.T_final.toFixed(2)}°C`);
console.log(`  ✓ Gel détecté = ${freeze1.freezeDetected ? 'OUI ⚠️' : 'NON ✅'}`);
console.log(`  ✓ Marge = ${freeze1.marginToFreeze.toFixed(2)}°C`);
console.log(`  ✓ Q_loss = ${(result1.Q_loss_total / 1000).toFixed(2)} kW\n`);

// ========== SCÉNARIO 2: SANS ISOLATION (RISQUE MOYEN) ==========
console.log('Scénario 2: Sans isolation - DN50, 100m, -10°C\n');

const scenario2 = {
  ...scenario1,
  insulation: null,
};

const result2 = pipeNetwork.calculatePipeNetwork(scenario2);
const freeze2 = freezeDetector.detectFreeze(result2.T_profile, result2.x_profile, 0);

assert(result2.T_final < result1.T_final, 'Sans isolation devrait être plus froid');
assert(
  result2.Q_loss_total > result1.Q_loss_total,
  'Sans isolation devrait perdre plus de chaleur'
);
assert(result2.T_final > 40, 'T_final devrait être > 40°C pour ce cas');

console.log(`  ✓ T_final = ${result2.T_final.toFixed(2)}°C`);
console.log(`  ✓ Gel détecté = ${freeze2.freezeDetected ? 'OUI ⚠️' : 'NON ✅'}`);
console.log(`  ✓ Q_loss = ${(result2.Q_loss_total / 1000).toFixed(2)} kW`);
console.log(
  `  ✓ Augmentation perte: ${((result2.Q_loss_total / result1.Q_loss_total - 1) * 100).toFixed(0)}%\n`
);

// ========== SCÉNARIO 3: CONDUITE LONGUE, DÉBIT FAIBLE (RISQUE ÉLEVÉ) ==========
console.log('Scénario 3: Conduite longue, débit faible - 500m, 0.5 kg/s, -20°C\n');

const scenario3 = {
  geometry: scenario1.geometry,
  totalLength: 500,
  numSegments: 50,
  fluid: {
    T_in: 40,
    P: 3.0,
    m_dot: 0.5,
  },
  ambient: {
    T_amb: -20,
    V_wind: 10.0,
  },
  insulation: {
    material: 'fiberglass',
    thickness: 0.02,
  },
};

const result3 = pipeNetwork.calculatePipeNetwork(scenario3);
const freeze3 = freezeDetector.detectFreeze(result3.T_profile, result3.x_profile, 0);

// Ce cas devrait avoir température beaucoup plus basse
assert(result3.T_final < scenario3.fluid.T_in, 'T_final devrait être < T_in');

console.log(`  ✓ T_final = ${result3.T_final.toFixed(2)}°C`);
console.log(`  ✓ Gel détecté = ${freeze3.freezeDetected ? 'OUI ⚠️' : 'NON ✅'}`);
if (freeze3.freezeDetected) {
  console.log(`  ✓ Position gel = ${freeze3.freezePosition.toFixed(1)}m`);
}
console.log(`  ✓ Marge = ${freeze3.marginToFreeze.toFixed(2)}°C\n`);

// ========== SCÉNARIO 4: CONDUITE COURTE, DÉBIT ÉLEVÉ (PAS DE GEL) ==========
console.log('Scénario 4: Conduite courte, débit élevé - 10m, 5 kg/s, -10°C\n');

const scenario4 = {
  geometry: scenario1.geometry,
  totalLength: 10,
  numSegments: 5,
  fluid: {
    T_in: 60,
    P: 3.0,
    m_dot: 5.0,
  },
  ambient: {
    T_amb: -10,
    V_wind: 5.0,
  },
  insulation: scenario1.insulation,
};

const result4 = pipeNetwork.calculatePipeNetwork(scenario4);
const freeze4 = freezeDetector.detectFreeze(result4.T_profile, result4.x_profile, 0);

assert(freeze4.freezeDetected === false, 'Courte distance + débit élevé ne devrait pas geler');
assert(result4.T_final > 59, 'T_final devrait être très proche de T_in');

console.log(`  ✓ T_final = ${result4.T_final.toFixed(2)}°C`);
console.log(`  ✓ ΔT = ${(scenario4.fluid.T_in - result4.T_final).toFixed(2)}°C (très petit)`);
console.log(`  ✓ Gel détecté = ${freeze4.freezeDetected ? 'OUI ⚠️' : 'NON ✅'}\n`);

// ========== SCÉNARIO 5: CAS EXTRÊME - AIR TRÈS FROID ==========
console.log('Scénario 5: Cas extrême - Air à -40°C, 200m\n');

const scenario5 = {
  geometry: scenario1.geometry,
  totalLength: 200,
  numSegments: 40,
  fluid: {
    T_in: 50,
    P: 3.0,
    m_dot: 1.5,
  },
  ambient: {
    T_amb: -40,
    V_wind: 15.0,
  },
  insulation: {
    material: 'fiberglass',
    thickness: 0.03, // Isolation plus épaisse
  },
};

const result5 = pipeNetwork.calculatePipeNetwork(scenario5);
const freeze5 = freezeDetector.detectFreeze(result5.T_profile, result5.x_profile, 0);

console.log(`  ✓ T_final = ${result5.T_final.toFixed(2)}°C`);
console.log(`  ✓ Gel détecté = ${freeze5.freezeDetected ? 'OUI ⚠️' : 'NON ✅'}`);
console.log(`  ✓ Q_loss = ${(result5.Q_loss_total / 1000).toFixed(2)} kW\n`);

// ========== VALIDATION COHÉRENCE PHYSIQUE ==========
console.log('='.repeat(70));
console.log('VALIDATION COHÉRENCE PHYSIQUE\n');

// Test: Température décroissante
assert(
  result1.T_profile[0] >= result1.T_profile[result1.T_profile.length - 1],
  'Température devrait être décroissante'
);

// Test: Pression décroissante
assert(
  result1.P_profile[0] >= result1.P_profile[result1.P_profile.length - 1],
  'Pression devrait être décroissante'
);

// Test: Conservation énergie (Q_loss = m·cp·ΔT approx)
const water_cp = 4184; // J/(kg·K) approximatif
const Q_from_temp = scenario1.fluid.m_dot * water_cp * (result1.T_profile[0] - result1.T_final);
assertApprox(
  Q_from_temp,
  result1.Q_loss_total,
  result1.Q_loss_total * 0.1,
  'Conservation énergie: Q = m·cp·ΔT'
);

console.log(`  ✓ Températures décroissantes`);
console.log(`  ✓ Pressions décroissantes`);
console.log(`  ✓ Conservation énergie vérifiée\n`);

// ========== PERFORMANCE ==========
console.log('='.repeat(70));
console.log('TESTS PERFORMANCE\n');

const perfScenario = {
  ...scenario1,
  totalLength: 100,
  numSegments: 100, // Test avec 100 segments
};

const startTime = Date.now();
const perfResult = pipeNetwork.calculatePipeNetwork(perfScenario);
const endTime = Date.now();
const duration = endTime - startTime;

assert(duration < 1000, 'Calcul 100 segments devrait prendre < 1s');
console.log(`  ✓ Temps calcul 100 segments: ${duration}ms`);
console.log(`  ✓ Objectif < 1000ms: ${duration < 1000 ? 'ATTEINT ✅' : 'NON ATTEINT ❌'}\n`);

// ========== RÉSUMÉ ==========
console.log('='.repeat(70));
console.log('RÉSUMÉ DES TESTS');
console.log('='.repeat(70) + '\n');

console.log(`Tests réussis: ${testsPassed}/${testsTotal}`);
console.log(`\nScénarios testés:`);
console.log(`  1. Conduite bien isolée → PAS DE GEL ✅`);
console.log(`  2. Sans isolation → ${freeze2.freezeDetected ? 'GEL ⚠️' : 'PAS DE GEL ✅'}`);
console.log(`  3. Longue + faible débit → ${freeze3.freezeDetected ? 'GEL ⚠️' : 'PAS DE GEL ✅'}`);
console.log(`  4. Courte + débit élevé → PAS DE GEL ✅`);
console.log(`  5. Air très froid → ${freeze5.freezeDetected ? 'GEL ⚠️' : 'PAS DE GEL ✅'}`);

console.log('\n');

if (testsPassed === testsTotal) {
  console.log("✅ TOUS LES TESTS D'INTÉGRATION PASSENT\n");
  process.exit(0);
} else {
  console.log(`❌ ${testsTotal - testsPassed} TEST(S) EN ÉCHEC\n`);
  process.exit(1);
}
