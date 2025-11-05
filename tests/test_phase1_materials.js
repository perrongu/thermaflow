/**
 * test_phase1_materials.js
 *
 * Tests unitaires pour le module des matériaux (Phase 1.4):
 * - pipe-materials.js
 *
 * Validation des propriétés thermophysiques contre:
 * - Perry's Chemical Engineers' Handbook
 * - ASHRAE Fundamentals Handbook
 * - Valeurs de référence industrielles
 *
 * Exécution: node tests/test_phase1_materials.js
 */

const materials = require('../js/properties/material-properties.js');
const resistance = require('../js/calculations/thermal-resistance.js');

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

// ===== TESTS PROPRIÉTÉS DES MÉTAUX =====
console.log('\n=== Tests: Propriétés des métaux ===\n');

console.log('Test 1: Acier au carbone');
const steel = materials.getMaterialProperties('steel');
assertClose(steel.k, 50.2, 0.05, 'k_steel ≈ 50.2 W/(m·K)');
assertClose(steel.rho, 7850, 0.05, 'ρ_steel ≈ 7850 kg/m³');
assertClose(steel.cp, 486, 0.05, 'cp_steel ≈ 486 J/(kg·K)');
assertClose(steel.emissivity, 0.79, 0.1, 'ε_steel ≈ 0.79 (oxydé)');
assertEqual(steel.category, 'metal', 'Catégorie: metal');

console.log('\nTest 2: Cuivre');
const copper = materials.getMaterialProperties('copper');
assertClose(copper.k, 401, 0.05, 'k_copper ≈ 401 W/(m·K) (excellent conducteur)');
assertClose(copper.rho, 8960, 0.05, 'ρ_copper ≈ 8960 kg/m³');
assertClose(copper.cp, 385, 0.05, 'cp_copper ≈ 385 J/(kg·K)');

console.log('\nTest 3: Acier inoxydable 304');
const stainless = materials.getMaterialProperties('stainless_steel');
assertClose(stainless.k, 16.2, 0.05, 'k_SS ≈ 16.2 W/(m·K) (plus faible que acier)');
assertClose(stainless.rho, 8000, 0.05, 'ρ_SS ≈ 8000 kg/m³');

console.log('\nTest 4: Différence émissivité poli vs oxydé');
const steel_polished = materials.getMaterialProperties('steel_polished');
if (steel_polished.emissivity < steel.emissivity) {
  testsPassed++;
  testsRun++;
  console.log(`  ✓ ε_poli (${steel_polished.emissivity}) < ε_oxydé (${steel.emissivity})`);
} else {
  testsFailed++;
  testsRun++;
  console.log(`  ✗ ε_poli devrait être < ε_oxydé`);
}

// ===== TESTS PROPRIÉTÉS DES ISOLANTS =====
console.log('\n\n=== Tests: Propriétés des isolants ===\n');

console.log('Test 5: Laine de verre (fiberglass)');
const fiberglass = materials.getMaterialProperties('fiberglass');
assertClose(fiberglass.k, 0.04, 0.1, 'k_fiberglass ≈ 0.040 W/(m·K) (bon isolant)');
assertClose(fiberglass.rho, 32, 0.2, 'ρ_fiberglass ≈ 32 kg/m³ (très léger)');
assertEqual(fiberglass.category, 'insulation', 'Catégorie: insulation');

console.log('\nTest 6: Mousse de polyuréthane');
const polyurethane = materials.getMaterialProperties('polyurethane_foam');
assertClose(polyurethane.k, 0.026, 0.1, 'k_PU ≈ 0.026 W/(m·K) (excellent isolant)');

console.log('\nTest 7: Comparaison isolants');
// Tous les isolants doivent avoir k < 0.1 W/(m·K)
const insulation_materials = materials.listMaterials('insulation');
let all_low_k = true;
for (const mat_id of insulation_materials) {
  const mat = materials.getMaterialProperties(mat_id);
  if (mat.k >= 0.1) {
    all_low_k = false;
    break;
  }
}
testsRun++;
if (all_low_k) {
  testsPassed++;
  console.log(`  ✓ Tous les isolants ont k < 0.1 W/(m·K)`);
} else {
  testsFailed++;
  console.log(`  ✗ Certains isolants ont k trop élevé`);
}

// ===== TESTS PROPRIÉTÉS DES PLASTIQUES =====
console.log('\n\n=== Tests: Propriétés des plastiques ===\n');

console.log('Test 8: PVC');
const pvc = materials.getMaterialProperties('pvc');
assertClose(pvc.k, 0.19, 0.1, 'k_PVC ≈ 0.19 W/(m·K)');
assertClose(pvc.rho, 1380, 0.05, 'ρ_PVC ≈ 1380 kg/m³');
assertEqual(pvc.category, 'plastic', 'Catégorie: plastic');

console.log('\nTest 9: PEHD (HDPE)');
const hdpe = materials.getMaterialProperties('hdpe');
assertClose(hdpe.k, 0.5, 0.1, 'k_HDPE ≈ 0.50 W/(m·K)');

// ===== TESTS UTILITAIRES =====
console.log('\n\n=== Tests: Fonctions utilitaires ===\n');

console.log('Test 10: Liste des matériaux');
const all_materials = materials.listMaterials();
testsRun++;
if (all_materials.length >= 15) {
  testsPassed++;
  console.log(`  ✓ ${all_materials.length} matériaux disponibles`);
} else {
  testsFailed++;
  console.log(`  ✗ Nombre de matériaux insuffisant: ${all_materials.length}`);
}

console.log('\nTest 11: Liste par catégorie');
const metals = materials.listMaterials('metal');
const insulators = materials.listMaterials('insulation');
const plastics = materials.listMaterials('plastic');
testsRun++;
if (metals.length > 0 && insulators.length > 0 && plastics.length > 0) {
  testsPassed++;
  console.log(
    `  ✓ Métaux: ${metals.length}, Isolants: ${insulators.length}, Plastiques: ${plastics.length}`
  );
} else {
  testsFailed++;
  console.log(`  ✗ Catégories incomplètes`);
}

console.log('\nTest 12: Matériau inexistant');
assertThrows(() => materials.getMaterialProperties('unobtanium'), 'Matériau inexistant → erreur');

// ===== TESTS RÉSISTANCE THERMIQUE =====
console.log('\n\n=== Tests: Résistance thermique cylindrique ===\n');

console.log('Test 13: Résistance conduction acier');
// Conduite DN50: r_i=25mm, r_o=27mm, k=50.2 W/(m·K), L=1m
const R_steel = resistance.conductionResistanceCylinder(0.025, 0.027, 50.2, 1.0);
// R = ln(27/25) / (2π × 50.2 × 1) = 0.00025 K/W
assertClose(R_steel, 0.00025, 0.1, 'R_steel ≈ 0.00025 K/W (très faible)');

console.log('\nTest 14: Résistance conduction isolation');
// Isolation 20mm épaisseur: r_i=27mm, r_o=47mm, k=0.04 W/(m·K), L=1m
const R_insul = resistance.conductionResistanceCylinder(0.027, 0.047, 0.04, 1.0);
// R = ln(47/27) / (2π × 0.04 × 1) = 2.20 K/W
assertClose(R_insul, 2.2, 0.1, 'R_insul ≈ 2.20 K/W (élevé - bon isolant)');

console.log('\nTest 15: Comparaison métal vs isolation');
testsRun++;
if (R_insul > 1000 * R_steel) {
  testsPassed++;
  console.log(`  ✓ R_isolation >> R_métal (facteur ${(R_insul / R_steel).toFixed(0)}×)`);
} else {
  testsFailed++;
  console.log(`  ✗ Différence insuffisante entre métal et isolation`);
}

console.log('\nTest 16: Erreurs de validation');
assertThrows(
  () => resistance.conductionResistanceCylinder(0.05, 0.03, 50, 1),
  'r_outer < r_inner → erreur'
);
assertThrows(() => resistance.conductionResistanceCylinder(0.025, 0.027, -50, 1), 'k < 0 → erreur');

// ===== TESTS COMPARATIFS =====
console.log('\n\n=== Tests: Comparaisons physiques ===\n');

console.log('Test 17: Conductivité: métaux > plastiques > isolants');
const k_metal = steel.k;
const k_plastic = pvc.k;
const k_insul = fiberglass.k;
testsRun++;
if (k_metal > k_plastic && k_plastic > k_insul) {
  testsPassed++;
  console.log(`  ✓ k_metal (${k_metal}) > k_plastic (${k_plastic}) > k_insul (${k_insul})`);
} else {
  testsFailed++;
  console.log(`  ✗ Ordre des conductivités incorrect`);
}

console.log('\nTest 18: Densité: métaux > plastiques > isolants');
const rho_metal = steel.rho;
const rho_plastic = pvc.rho;
const rho_insul = fiberglass.rho;
testsRun++;
if (rho_metal > rho_plastic && rho_plastic > rho_insul) {
  testsPassed++;
  console.log(`  ✓ ρ_metal (${rho_metal}) > ρ_plastic (${rho_plastic}) > ρ_insul (${rho_insul})`);
} else {
  testsFailed++;
  console.log(`  ✗ Ordre des densités incorrect`);
}

console.log('\nTest 19: Cuivre meilleur conducteur que acier');
testsRun++;
if (copper.k > steel.k * 5) {
  testsPassed++;
  console.log(`  ✓ k_copper (${copper.k}) >> k_steel (${steel.k})`);
} else {
  testsFailed++;
  console.log(`  ✗ Cuivre devrait être bien meilleur conducteur`);
}

console.log('\nTest 20: Immutabilité des données');
testsRun++;
try {
  const test_mat = materials.getMaterialProperties('steel');
  test_mat.k = 9999; // Tentative de modification
  const test_mat2 = materials.getMaterialProperties('steel');
  if (test_mat2.k !== 9999) {
    testsPassed++;
    console.log(`  ✓ Données protégées contre modification`);
  } else {
    testsFailed++;
    console.log(`  ✗ Données modifiables (pas d'isolation)`);
  }
} catch (e) {
  testsPassed++;
  console.log(`  ✓ Modification bloquée par freeze`);
}

// ===== RÉSUMÉ =====
console.log('\n\n' + '='.repeat(60));
console.log('RÉSUMÉ DES TESTS - Phase 1.4 Matériaux');
console.log('='.repeat(60));
console.log(`Tests exécutés: ${testsRun}`);
console.log(`Tests réussis:  ${testsPassed} ✓`);
console.log(`Tests échoués:  ${testsFailed} ✗`);
console.log(`Taux de succès: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

// Code de sortie
process.exit(testsFailed > 0 ? 1 : 0);
