/**
 * test_version_consistency.js
 *
 * Vérifie la cohérence de la version centrale à travers le projet.
 */

const fs = require('fs');
const path = require('path');

const { VERSION } = require('../js/constants/version.js');
const pkg = require('../package.json');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function logPass(message) {
  testsPassed += 1;
  console.log(`✓ ${message}`);
}

function logFail(message, details = '') {
  testsFailed += 1;
  console.log(`✗ ${message}`);
  if (details) {
    console.log(`  ${details}`);
  }
}

function assert(condition, message, details = '') {
  testsRun += 1;
  if (condition) {
    logPass(message);
  } else {
    logFail(message, details);
  }
}

function assertEqual(actual, expected, message) {
  const details = `Attendu: ${expected} | Obtenu: ${actual}`;
  assert(actual === expected, message, details);
}

function runTests() {
  console.log('\n=== Tests cohérence version ===');

  // Test 1: export VERSION
  assert(typeof VERSION === 'string', 'VERSION est exportée en tant que chaîne');

  // Test 2: package.json aligné
  assertEqual(VERSION, pkg.version, 'VERSION synchronisée avec package.json');

  // Test 3: index.html référence la version dynamique
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(
    indexHtml.includes('class="version-number"'),
    "index.html expose un span .version-number pour l'injection UI"
  );
  assert(
    indexHtml.includes('js/constants/version.js'),
    'index.html charge js/constants/version.js avant les autres scripts'
  );
  assert(
    !/ThermaFlow v\d+\.\d+\.\d+/.test(indexHtml),
    "index.html n'hardcode pas la version dans le footer"
  );

  // Test 4: tests/automated_verification.js consomme la version centralisée
  const autoVerification = fs.readFileSync(
    path.join(__dirname, 'automated_verification.js'),
    'utf8'
  );
  assert(
    autoVerification.includes("require('../js/constants/version.js')"),
    'tests/automated_verification.js importe la version centralisée'
  );
  assert(
    autoVerification.includes('ThermaFlow v${VERSION}') ||
      autoVerification.includes('ThermaFlow v' + '${VERSION}'),
    'tests/automated_verification.js utilise VERSION dans les métadonnées'
  );
  assert(
    !autoVerification.includes('1.1.1'),
    "tests/automated_verification.js n'embarque plus de version en dur"
  );

  console.log('\nRésumé:');
  console.log(`  Tests exécutés: ${testsRun}`);
  console.log(`  Réussites: ${testsPassed}`);
  console.log(`  Échecs: ${testsFailed}`);

  if (testsFailed > 0) {
    process.exitCode = 1;
  }
}

runTests();
