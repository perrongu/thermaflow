#!/usr/bin/env node

/**
 * Test de persistance localStorage pour le système de conversion d'unités
 *
 * Vérifie que:
 * 1. ThermaStorage.save() sauvegarde correctement config ET unitPreferences
 * 2. ThermaStorage.load() retourne l'objet complet
 * 3. Les préférences d'unités survivent aux cycles save/load
 */

// Simuler localStorage pour Node.js
global.localStorage = {
  data: {},
  setItem(key, value) {
    this.data[key] = value;
  },
  getItem(key) {
    return this.data[key] || null;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
};

// Charger le module Storage
const fs = require('fs');
const vm = require('vm');

const storageCode = fs.readFileSync('js/ui/storage.js', 'utf8');
const context = {
  window: {},
  console: console,
  localStorage: global.localStorage,
};
vm.createContext(context);
vm.runInContext(storageCode, context);

const ThermaStorage = context.window.Storage;

// ========== TESTS ==========

console.log('🧪 Tests de persistance localStorage\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Erreur: ${error.message}`);
    failed++;
  }
}

// Test 1: Sauvegarder et charger une configuration simple
test('Test 1: Save/Load configuration de base', () => {
  localStorage.clear();

  const config = {
    geometry: { material: 'steel' },
    totalLength: 100,
    meta: { schedule: '40', nps: 4, flowM3PerHr: 7.2 },
  };

  ThermaStorage.save(config);
  const loaded = ThermaStorage.load();

  if (!loaded) {
    throw new Error('Load returned null');
  }
  if (!loaded.config) {
    throw new Error('Loaded object missing config property');
  }
  if (loaded.config.totalLength !== 100) {
    throw new Error('Config not saved correctly');
  }
  if (!loaded.timestamp) {
    throw new Error('Loaded object missing timestamp');
  }
  if (!loaded.version) {
    throw new Error('Loaded object missing version');
  }
});

// Test 2: Sauvegarder avec unitPreferences
test('Test 2: Save/Load avec unitPreferences', () => {
  localStorage.clear();

  const config = {
    geometry: { material: 'steel' },
    totalLength: 100,
    meta: { schedule: '40', nps: 4 },
  };

  // Simuler ce que fait input-form.js
  ThermaStorage.save(config);

  // Ajouter unitPreferences
  const savedData = ThermaStorage.load();
  savedData.unitPreferences = { flowRate: 'usgpm', pressure: 'psig' };
  localStorage.setItem('thermaflow_last_config', JSON.stringify(savedData));

  // Recharger et vérifier
  const reloaded = ThermaStorage.load();

  if (!reloaded.unitPreferences) {
    throw new Error('unitPreferences not persisted');
  }
  if (reloaded.unitPreferences.flowRate !== 'usgpm') {
    throw new Error('flowRate preference not saved');
  }
  if (reloaded.unitPreferences.pressure !== 'psig') {
    throw new Error('pressure preference not saved');
  }
});

// Test 3: Comportement avec localStorage vide
test('Test 3: Load avec localStorage vide', () => {
  localStorage.clear();

  const loaded = ThermaStorage.load();
  if (loaded !== null) {
    throw new Error('Load should return null when localStorage is empty');
  }
});

// Test 4: Structure complète de l'objet sauvegardé
test("Test 4: Structure complète de l'objet", () => {
  localStorage.clear();

  const config = {
    geometry: { D_inner: 0.05 },
    fluid: { T_in: 60, P: 3, m_dot: 2 },
  };

  ThermaStorage.save(config);
  const loaded = ThermaStorage.load();

  // Vérifier toutes les propriétés attendues
  const requiredProps = ['config', 'timestamp', 'version'];
  for (const prop of requiredProps) {
    if (!(prop in loaded)) {
      throw new Error(`Missing property: ${prop}`);
    }
  }

  // Vérifier que config est intact
  if (!loaded.config.geometry) {
    throw new Error('Config structure corrupted');
  }
  if (!loaded.config.fluid) {
    throw new Error('Config structure corrupted');
  }
});

// Test 5: Cycle multiple save/load
test('Test 5: Cycles multiples save/load', () => {
  localStorage.clear();

  for (let i = 0; i < 5; i++) {
    const config = { iteration: i, totalLength: 100 + i };
    ThermaStorage.save(config);

    const loaded = ThermaStorage.load();
    if (loaded.config.iteration !== i) {
      throw new Error(`Cycle ${i} failed`);
    }
  }
});

// Test 6: Compatibilité avec ancien format (migration)
test('Test 6: Compatibilité ancien format', () => {
  localStorage.clear();

  // Simuler ancien format (avant le fix)
  const oldFormat = {
    config: { totalLength: 100 },
    timestamp: Date.now(),
    version: '1.0.1',
  };

  localStorage.setItem('thermaflow_last_config', JSON.stringify(oldFormat));

  const loaded = ThermaStorage.load();
  if (!loaded.config) {
    throw new Error('Old format not compatible');
  }
  if (loaded.config.totalLength !== 100) {
    throw new Error('Old format data corrupted');
  }
});

// ========== RÉSUMÉ ==========
console.log('\n============================================================');
console.log(`📊 RÉSUMÉ: ${passed}/${passed + failed} tests passés`);

if (failed === 0) {
  console.log('✅ Tous les tests de persistance ont réussi!\n');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) échoué(s)\n`);
  process.exit(1);
}
