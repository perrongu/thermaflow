/**
 * test_unit_conversions.js
 *
 * Tests de validation des conversions d'unités
 *
 * Vérifie que les facteurs de conversion sont compatibles avec PINT (Python)
 * et que les calculs donnent des résultats identiques peu importe les unités d'affichage
 */

// ========== FACTEURS DE CONVERSION ATTENDUS (PINT) ==========
// Validés avec: from pint import UnitRegistry; ureg = UnitRegistry()

const EXPECTED_CONVERSIONS = {
  // Débit volumique
  // (1 * ureg.m3/ureg.hour).to('gallon/minute')
  M3H_TO_USGPM: 4.40286745,
  USGPM_TO_M3H: 0.227124707,

  // Pression gauge
  // (1 * ureg.kPa).to('psi')
  KPAG_TO_PSIG: 0.145037738,
  PSIG_TO_KPAG: 6.89475729,
};

const TOLERANCE = 2e-4; // Tolérance pour comparaison des nombres flottants (0.0002)

// ========== CHARGER LE MODULE ==========
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Créer un contexte simulant le navigateur
const sandbox = {
  window: {},
  console: console,
  Object: Object,
  Math: Math,
  module: { exports: {} },
};

// Charger unit-converter.js
const unitConverterPath = path.join(__dirname, '../js/ui/unit-converter.js');
const unitConverterCode = fs.readFileSync(unitConverterPath, 'utf8');
vm.runInNewContext(unitConverterCode, sandbox);

const UnitConverter = sandbox.window.UnitConverter;

// ========== TESTS ==========
console.log("🧪 Tests de validation des conversions d'unités\n");

let testsTotal = 0;
let testsPassed = 0;

function test(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
  }
}

function assertClose(actual, expected, name) {
  const diff = Math.abs(actual - expected);
  if (diff > TOLERANCE) {
    throw new Error(`${name}: attendu ${expected}, obtenu ${actual} (écart: ${diff})`);
  }
}

function assertEqual(actual, expected, name) {
  if (actual !== expected) {
    throw new Error(`${name}: attendu ${expected}, obtenu ${actual}`);
  }
}

// ========== TEST 1: FACTEURS DE CONVERSION ==========
console.log('📐 Test 1: Validation des facteurs de conversion vs PINT\n');

test('Facteur m³/h → USGPM', () => {
  const factor = UnitConverter.CONVERSION_FACTORS.M3H_TO_USGPM;
  assertClose(factor, EXPECTED_CONVERSIONS.M3H_TO_USGPM, 'M3H_TO_USGPM');
});

test('Facteur USGPM → m³/h', () => {
  const factor = UnitConverter.CONVERSION_FACTORS.USGPM_TO_M3H;
  assertClose(factor, EXPECTED_CONVERSIONS.USGPM_TO_M3H, 'USGPM_TO_M3H');
});

test('Facteur kPag → psig', () => {
  const factor = UnitConverter.CONVERSION_FACTORS.KPAG_TO_PSIG;
  assertClose(factor, EXPECTED_CONVERSIONS.KPAG_TO_PSIG, 'KPAG_TO_PSIG');
});

test('Facteur psig → kPag', () => {
  const factor = UnitConverter.CONVERSION_FACTORS.PSIG_TO_KPAG;
  assertClose(factor, EXPECTED_CONVERSIONS.PSIG_TO_KPAG, 'PSIG_TO_KPAG');
});

// ========== TEST 2: CONVERSIONS BIDIRECTIONNELLES ==========
console.log('\n🔄 Test 2: Conversions bidirectionnelles (round-trip)\n');

test('Débit: m³/h → USGPM → m³/h', () => {
  const original = 10.0; // m³/h
  const converted = UnitConverter.convert('flowRate', original, 'm3_h', 'usgpm');
  const backConverted = UnitConverter.convert('flowRate', converted, 'usgpm', 'm3_h');
  assertClose(backConverted, original, 'Round-trip débit');
});

test('Pression: kPag → psig → kPag', () => {
  const original = 200.0; // kPag
  const converted = UnitConverter.convert('pressure', original, 'kPag', 'psig');
  const backConverted = UnitConverter.convert('pressure', converted, 'psig', 'kPag');
  assertClose(backConverted, original, 'Round-trip pression');
});

// ========== TEST 3: VALEURS CONNUES ==========
console.log('\n📊 Test 3: Validation avec valeurs connues\n');

test('10 m³/h = 44.03 USGPM', () => {
  const result = UnitConverter.convert('flowRate', 10, 'm3_h', 'usgpm');
  assertClose(result, 44.0286745, '10 m³/h → USGPM');
});

test('20 USGPM = 4.54 m³/h', () => {
  const result = UnitConverter.convert('flowRate', 20, 'usgpm', 'm3_h');
  assertClose(result, 4.54249414, '20 USGPM → m³/h');
});

test('100 kPag = 14.5 psig', () => {
  const result = UnitConverter.convert('pressure', 100, 'kPag', 'psig');
  assertClose(result, 14.5037738, '100 kPag → psig');
});

test('50 psig = 344.74 kPag', () => {
  const result = UnitConverter.convert('pressure', 50, 'psig', 'kPag');
  assertClose(result, 344.737865, '50 psig → kPag');
});

// ========== TEST 4: PLAGES MIN/MAX ==========
console.log('\n📏 Test 4: Validation des plages min/max\n');

test('Plages débit cohérentes entre unités', () => {
  UnitConverter.setUnit('flowRate', 'm3_h');
  const rangesM3H = UnitConverter.getRanges('flowRate');

  UnitConverter.setUnit('flowRate', 'usgpm');
  const rangesUSGPM = UnitConverter.getRanges('flowRate');

  // Convertir les plages USGPM vers m³/h et comparer
  const minConverted = UnitConverter.convert('flowRate', rangesUSGPM.min, 'usgpm', 'm3_h');
  const maxConverted = UnitConverter.convert('flowRate', rangesUSGPM.max, 'usgpm', 'm3_h');

  assertClose(minConverted, rangesM3H.min, 'Min débit');
  assertClose(maxConverted, rangesM3H.max, 'Max débit');
});

test('Plages pression cohérentes entre unités', () => {
  UnitConverter.setUnit('pressure', 'kPag');
  const rangesKPag = UnitConverter.getRanges('pressure');

  UnitConverter.setUnit('pressure', 'psig');
  const rangesPsig = UnitConverter.getRanges('pressure');

  // Convertir les plages psig vers kPag et comparer
  const minConverted = UnitConverter.convert('pressure', rangesPsig.min, 'psig', 'kPag');
  const maxConverted = UnitConverter.convert('pressure', rangesPsig.max, 'psig', 'kPag');

  assertClose(minConverted, rangesKPag.min, 'Min pression');
  assertClose(maxConverted, rangesKPag.max, 'Max pression');
});

// ========== TEST 5: FORMATAGE ==========
console.log('\n📝 Test 5: Formatage des valeurs\n');

test('Format débit m³/h', () => {
  UnitConverter.setUnit('flowRate', 'm3_h');
  const formatted = UnitConverter.format('flowRate', 12.345);
  assertEqual(formatted, '12.35 m³/h', 'Format m³/h');
});

test('Format débit USGPM', () => {
  UnitConverter.setUnit('flowRate', 'usgpm');
  const formatted = UnitConverter.format('flowRate', 54.321);
  assertEqual(formatted, '54.32 USGPM', 'Format USGPM');
});

test('Format pression kPag', () => {
  UnitConverter.setUnit('pressure', 'kPag');
  const formatted = UnitConverter.format('pressure', 250.6);
  assertEqual(formatted, '251 kPag', 'Format kPag');
});

test('Format pression psig', () => {
  UnitConverter.setUnit('pressure', 'psig');
  const formatted = UnitConverter.format('pressure', 36.4);
  assertEqual(formatted, '36 psig', 'Format psig');
});

// ========== RÉSUMÉ ==========
console.log(`\n${'='.repeat(60)}`);
console.log(`📊 RÉSUMÉ: ${testsPassed}/${testsTotal} tests passés`);

if (testsPassed === testsTotal) {
  console.log('✅ Tous les tests ont réussi! Les conversions sont compatibles PINT.');
  process.exit(0);
} else {
  console.log(`❌ ${testsTotal - testsPassed} test(s) échoué(s).`);
  process.exit(1);
}
