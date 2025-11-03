/**
 * Tests unitaires pour les propriétés des fluides
 * 
 * Teste:
 * - water-properties.js: Propriétés de l'eau vs T et P
 * - air-properties.js: Propriétés de l'air vs T
 * 
 * Exécuter avec: node test_fluid_properties.js
 */

// Charger les données de tables
const { waterTablesData } = require('../data/fluids/water-tables.js');
const { airTablesData } = require('../data/fluids/air-tables.js');

// Charger les fonctions d'accès
const { getWaterProperties } = require('../js/properties/water-properties.js');
const { getAirProperties } = require('../js/properties/air-properties.js');

// Couleurs pour la sortie console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Assertion simple avec rapport
 */
function assert(condition, testName, details = '') {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (details) {
      console.log(`  ${colors.yellow}${details}${colors.reset}`);
    }
  }
}

/**
 * Vérifie qu'une valeur est proche d'une valeur attendue
 */
function assertClose(actual, expected, tolerance, testName) {
  const diff = Math.abs(actual - expected);
  const relError = Math.abs(diff / expected);
  const passed = relError <= tolerance;
  assert(
    passed,
    testName,
    passed ? '' : `Attendu: ${expected}, Obtenu: ${actual}, Erreur relative: ${(relError * 100).toFixed(2)}%`
  );
}

console.log('\n' + '='.repeat(60));
console.log('TESTS DES PROPRIÉTÉS DES FLUIDES');
console.log('='.repeat(60) + '\n');

// ===== TESTS EAU =====
console.log(`${colors.blue}>>> Tests des propriétés de l'eau${colors.reset}\n`);

// Test 1: Valeurs aux points de grille (match exact attendu)
console.log('Test 1: Valeurs aux points de grille');
const water_0C_1bar = getWaterProperties(0, 1.0);
assertClose(water_0C_1bar.rho, 999.84, 0.001, '  ρ(0°C, 1 bar)');
assertClose(water_0C_1bar.mu, 1.791754e-03, 0.001, '  μ(0°C, 1 bar)');
assertClose(water_0C_1bar.k, 0.5557, 0.001, '  k(0°C, 1 bar)');
assertClose(water_0C_1bar.cp, 4219.4, 0.001, '  cp(0°C, 1 bar)');

const water_20C_1bar = getWaterProperties(20, 1.0);
assertClose(water_20C_1bar.rho, 998.21, 0.001, '  ρ(20°C, 1 bar)');
assertClose(water_20C_1bar.mu, 1.001597e-03, 0.001, '  μ(20°C, 1 bar)');

const water_100C_10bar = getWaterProperties(100, 10.0);
assertClose(water_100C_10bar.rho, 958.77, 0.001, '  ρ(100°C, 10 bar)');

// Test 2: Interpolation entre points de grille
console.log('\nTest 2: Interpolation');
const water_10C_1bar = getWaterProperties(10, 1.0);
assert(
  water_10C_1bar.rho > 999.1 && water_10C_1bar.rho < 1000.0,
  '  ρ(10°C, 1 bar) dans la plage attendue',
  `Obtenu: ${water_10C_1bar.rho} kg/m³`
);

const water_22_5C_1_5bar = getWaterProperties(22.5, 1.5);
assert(
  water_22_5C_1_5bar.rho > 995 && water_22_5C_1_5bar.rho < 1000,
  '  ρ(22.5°C, 1.5 bar) interpolée',
  `Obtenu: ${water_22_5C_1_5bar.rho} kg/m³`
);

// Test 3: Propriétés physiques correctes
console.log('\nTest 3: Propriétés physiques cohérentes');
const water_cold = getWaterProperties(5, 1.0);
const water_warm = getWaterProperties(50, 1.0);

assert(
  water_cold.rho > water_warm.rho,
  '  Densité diminue avec T',
  `ρ(5°C) = ${water_cold.rho}, ρ(50°C) = ${water_warm.rho}`
);

assert(
  water_cold.mu > water_warm.mu,
  '  Viscosité diminue avec T',
  `μ(5°C) = ${water_cold.mu}, μ(50°C) = ${water_warm.mu}`
);

assert(
  water_cold.k < water_warm.k,
  '  Conductivité augmente avec T',
  `k(5°C) = ${water_cold.k}, k(50°C) = ${water_warm.k}`
);

// Test 4: Gestion des erreurs
console.log('\nTest 4: Gestion des erreurs');
try {
  getWaterProperties(-10, 1.0); // Hors plage
  assert(false, '  Devrait rejeter T < 0°C');
} catch (e) {
  assert(true, '  Rejette T < 0°C', e.message);
}

try {
  getWaterProperties(20, 0.5); // Hors plage
  assert(false, '  Devrait rejeter P < 1 bar');
} catch (e) {
  assert(true, '  Rejette P < 1 bar', e.message);
}

try {
  getWaterProperties('vingt', 1.0); // Type invalide
  assert(false, '  Devrait rejeter type non-numérique');
} catch (e) {
  assert(true, '  Rejette type non-numérique', e.message);
}

try {
  getWaterProperties(Infinity, 1.0); // Infinity
  assert(false, '  Devrait rejeter Infinity');
} catch (e) {
  assert(true, '  Rejette Infinity', e.message);
}

try {
  getWaterProperties(20, -Infinity); // -Infinity
  assert(false, '  Devrait rejeter -Infinity');
} catch (e) {
  assert(true, '  Rejette -Infinity', e.message);
}

// ===== TESTS AIR =====
console.log(`\n${colors.blue}>>> Tests des propriétés de l'air${colors.reset}\n`);

// Test 5: Valeurs aux points de grille
console.log('Test 5: Valeurs aux points de grille');
const air_0C = getAirProperties(0);
assertClose(air_0C.rho, 1.2923, 0.001, '  ρ(0°C)');
assertClose(air_0C.mu, 1.716000e-05, 0.001, '  μ(0°C)');
assertClose(air_0C.k, 0.0241, 0.001, '  k(0°C)');
assertClose(air_0C.cp, 1005.0, 0.001, '  cp(0°C)');
assertClose(air_0C.Pr, 0.7156, 0.001, '  Pr(0°C)');

const air_20C = getAirProperties(20);
assertClose(air_20C.rho, 1.2041, 0.001, '  ρ(20°C)');

const air_minus20C = getAirProperties(-20);
assertClose(air_minus20C.rho, 1.3944, 0.001, '  ρ(-20°C)');

// Test 6: Interpolation
console.log('\nTest 6: Interpolation');
const air_10C = getAirProperties(10);
assert(
  air_10C.rho > 1.2 && air_10C.rho < 1.3,
  '  ρ(10°C) dans la plage attendue',
  `Obtenu: ${air_10C.rho} kg/m³`
);

const air_minus15C = getAirProperties(-15);
assert(
  air_minus15C.rho > 1.35 && air_minus15C.rho < 1.4,
  '  ρ(-15°C) interpolée',
  `Obtenu: ${air_minus15C.rho} kg/m³`
);

// Test 7: Propriétés physiques correctes
console.log('\nTest 7: Propriétés physiques cohérentes');
const air_cold = getAirProperties(-30);
const air_warm = getAirProperties(30);

assert(
  air_cold.rho > air_warm.rho,
  '  Densité diminue avec T',
  `ρ(-30°C) = ${air_cold.rho}, ρ(30°C) = ${air_warm.rho}`
);

assert(
  air_cold.mu < air_warm.mu,
  '  Viscosité augmente avec T',
  `μ(-30°C) = ${air_cold.mu}, μ(30°C) = ${air_warm.mu}`
);

assert(
  air_cold.k < air_warm.k,
  '  Conductivité augmente avec T',
  `k(-30°C) = ${air_cold.k}, k(30°C) = ${air_warm.k}`
);

assert(
  air_20C.Pr > 0.7 && air_20C.Pr < 0.75,
  '  Nombre de Prandtl dans la plage attendue',
  `Pr(20°C) = ${air_20C.Pr}`
);

// Test 8: Gestion des erreurs
console.log('\nTest 8: Gestion des erreurs');
try {
  getAirProperties(-50); // Hors plage
  assert(false, '  Devrait rejeter T < -40°C');
} catch (e) {
  assert(true, '  Rejette T < -40°C', e.message);
}

try {
  getAirProperties(60); // Hors plage
  assert(false, '  Devrait rejeter T > 50°C');
} catch (e) {
  assert(true, '  Rejette T > 50°C', e.message);
}

try {
  getAirProperties(NaN);
  assert(false, '  Devrait rejeter NaN');
} catch (e) {
  assert(true, '  Rejette NaN', e.message);
}

try {
  getAirProperties(Infinity); // Infinity
  assert(false, '  Devrait rejeter Infinity');
} catch (e) {
  assert(true, '  Rejette Infinity', e.message);
}

// ===== TESTS DE VALEURS PHYSIQUES CONNUES =====
console.log(`\n${colors.blue}>>> Tests contre valeurs de référence${colors.reset}\n`);

console.log('Test 9: Valeurs de référence connues');
// Eau à 20°C, pression atmosphérique (valeurs standard)
const water_ref = getWaterProperties(20, 1.0);
assertClose(water_ref.rho, 998.2, 0.01, '  ρ(eau, 20°C) ≈ 998 kg/m³');
assertClose(water_ref.mu, 1.002e-3, 0.02, '  μ(eau, 20°C) ≈ 1.0e-3 Pa·s');
assertClose(water_ref.cp, 4182, 0.01, '  cp(eau, 20°C) ≈ 4182 J/(kg·K)');

// Air à 20°C, pression atmosphérique (valeurs standard)
const air_ref = getAirProperties(20);
assertClose(air_ref.rho, 1.204, 0.01, '  ρ(air, 20°C) ≈ 1.2 kg/m³');
assertClose(air_ref.mu, 1.81e-5, 0.02, '  μ(air, 20°C) ≈ 1.8e-5 Pa·s');
assertClose(air_ref.cp, 1005, 0.01, '  cp(air, 20°C) ≈ 1005 J/(kg·K)');
assertClose(air_ref.Pr, 0.715, 0.01, '  Pr(air, 20°C) ≈ 0.71');

// ===== TEST D'IMMUTABILITÉ =====
console.log(`\n${colors.blue}>>> Test d'immutabilité des données${colors.reset}\n`);

console.log('Test 10: Immutabilité des objets de données');
assert(
  Object.isFrozen(waterTablesData),
  '  waterTablesData est frozen',
  'L\'objet devrait être immutable'
);
assert(
  Object.isFrozen(airTablesData),
  '  airTablesData est frozen',
  'L\'objet devrait être immutable'
);

// ===== RÉSUMÉ =====
console.log('\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS');
console.log('='.repeat(60));
console.log(`Tests exécutés:  ${testsRun}`);
console.log(`${colors.green}Tests réussis:   ${testsPassed}${colors.reset}`);
if (testsFailed > 0) {
  console.log(`${colors.red}Tests échoués:   ${testsFailed}${colors.reset}`);
} else {
  console.log(`Tests échoués:   ${testsFailed}`);
}
console.log(`Taux de réussite: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60) + '\n');

// Code de sortie
process.exit(testsFailed > 0 ? 1 : 0);

