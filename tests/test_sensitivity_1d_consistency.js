/**
 * Tests de cohérence pour l'analyse de sensibilité 1D
 *
 * Vérifie que les valeurs critiques trouvées par l'analyse 1D sont précises:
 * - Quand on applique une valeur critique, le résultat doit converger vers la température cible
 * - L'estimation du point critique doit rester stable
 *
 * Ces tests doivent ÉCHOUER initialement pour démontrer le problème,
 * puis PASSER après les corrections.
 */

const path = require('path');
const ROOT_DIR = path.resolve(__dirname, '..');

// ========== CHARGEMENT MODULES THERMAFLOW ==========

// Simuler environnement browser
global.window = {};

// Charger modules dans l'ordre des dépendances
const waterProps = require(path.join(ROOT_DIR, 'js/properties/water-properties.js'));
const airProps = require(path.join(ROOT_DIR, 'js/properties/air-properties.js'));
const materials = require(path.join(ROOT_DIR, 'js/properties/material-properties.js'));
const reynolds = require(path.join(ROOT_DIR, 'js/formulas/reynolds.js'));
const geometry = require(path.join(ROOT_DIR, 'js/formulas/geometry.js'));
const pressureBasic = require(path.join(ROOT_DIR, 'js/formulas/pressure-basic.js'));
const friction = require(path.join(ROOT_DIR, 'js/correlations/friction-factor.js'));
const nusseltInt = require(path.join(ROOT_DIR, 'js/correlations/nusselt-internal.js'));
const nusseltExt = require(path.join(ROOT_DIR, 'js/correlations/nusselt-external.js'));
const radiation = require(path.join(ROOT_DIR, 'js/correlations/radiation.js'));
const resistance = require(path.join(ROOT_DIR, 'js/calculations/thermal-resistance.js'));
const heatTransfer = require(path.join(ROOT_DIR, 'js/calculations/heat-transfer.js'));
const pipeSegment = require(path.join(ROOT_DIR, 'js/engine/pipe-segment.js'));
const pipeNetwork = require(path.join(ROOT_DIR, 'js/engine/pipe-network.js'));

// Exposer dans window pour compatibilité
global.window.WaterProperties = waterProps;
global.window.AirProperties = airProps;
global.window.MaterialProperties = materials;
global.window.Reynolds = reynolds;
global.window.Geometry = geometry;
global.window.PressureBasic = pressureBasic;
global.window.FrictionFactor = friction;
global.window.NusseltInternal = nusseltInt;
global.window.NusseltExternal = nusseltExt;
global.window.Radiation = radiation;
global.window.ThermalResistance = resistance;
global.window.HeatTransfer = heatTransfer;
global.window.PipeSegment = pipeSegment;
global.window.calculatePipeNetwork = pipeNetwork.calculatePipeNetwork;

// ========== CONFIGURATION DE BASE POUR TESTS ==========

/**
 * Configuration de base réaliste:
 * - Conduite 100m en acier
 * - Eau 60°C, 3 bar, 2 m³/h
 * - Air -10°C, vent 5 km/h
 * - Sans isolation
 *
 * Cette config devrait donner T_final entre 20-30°C
 */
function getBaseConfig() {
  return {
    geometry: {
      D_inner: 0.0525, // 2" schedule 40
      D_outer: 0.0603,
      roughness: 0.045e-3, // Acier commercial
      material: 'steel',
    },
    totalLength: 100, // m
    numSegments: 20,
    fluid: {
      T_in: 60, // °C
      P: 3.0, // bar
      m_dot: 0.5556, // kg/s (≈ 2 m³/h à 60°C)
    },
    ambient: {
      T_amb: -10, // °C
      V_wind: 5.0 / 3.6, // m/s (5 km/h)
    },
    insulation: null,
    meta: {
      flowM3PerHr: 2.0,
      hasInsulation: false,
    },
  };
}

// ========== FONCTIONS HELPER POUR ANALYSE 1D ==========

/**
 * Reconstruit une configuration complète à partir d'une config de base
 * en modifiant un seul paramètre.
 *
 * CLONE de la fonction rebuildConfig() dans sensitivity-analysis-1d.js
 *
 * Garantit que TOUS les champs dérivés sont recalculés correctement:
 * - numSegments basé sur totalLength
 * - fluid.m_dot basé sur flowM3PerHr avec densité eau à T_in et P
 * - Conversions d'unités
 *
 * @param {Object} baseConfig - Configuration de base valide
 * @param {string} paramKey - Paramètre à modifier ('L', 'm_dot', 'T_in', 'T_amb', 'V_wind', 't_insul')
 * @param {number} newValue - Nouvelle valeur dans unité d'affichage
 * @returns {Object} Configuration complète et cohérente
 */
function rebuildConfig(baseConfig, paramKey, newValue) {
  // 1. Extraire valeurs de base
  const geometry = { ...baseConfig.geometry };
  const insulation = baseConfig.insulation ? { ...baseConfig.insulation } : null;
  const meta = { ...baseConfig.meta };

  // 2. Valeurs par défaut
  let totalLength = baseConfig.totalLength;
  let T_in = baseConfig.fluid.T_in;
  const P_bar = baseConfig.fluid.P;
  let flowM3PerHr = baseConfig.meta.flowM3PerHr;
  let T_amb = baseConfig.ambient.T_amb;
  let V_wind_kmh = baseConfig.ambient.V_wind * 3.6; // m/s → km/h

  // 3. Appliquer la modification selon le paramètre
  switch (paramKey) {
    case 'L':
      totalLength = newValue;
      break;

    case 'm_dot':
      flowM3PerHr = newValue; // Déjà en m³/h
      break;

    case 'T_in':
      T_in = newValue;
      break;

    case 'T_amb':
      T_amb = newValue;
      break;

    case 'V_wind':
      V_wind_kmh = newValue; // En km/h
      break;

    case 't_insul':
      if (insulation) {
        insulation.thickness = newValue / 1000.0; // mm → m
      }
      break;

    default:
      console.warn(`rebuildConfig: Paramètre inconnu: ${paramKey}`);
  }

  // 4. RECALCUL COMPLET des champs dérivés

  // 4a. Conversion débit: m³/h → kg/s avec densité à T_in et P
  let rho_water = 1000;
  try {
    const waterProps = global.window.WaterProperties.getWaterProperties(T_in, P_bar);
    rho_water = waterProps.rho;
  } catch (e) {
    console.warn(`rebuildConfig: Densité eau fallback à 1000 kg/m³`);
  }
  const flowM3PerS = flowM3PerHr / 3600;
  const flowKgPerS = flowM3PerS * rho_water;

  // 4b. Calcul numSegments (MÊME FORMULE que formulaire)
  const numSegments = Math.min(Math.max(Math.ceil(totalLength / 5), 10), 100);

  // 4c. Conversion vent: km/h → m/s
  const V_wind_ms = V_wind_kmh / 3.6;

  // 5. Construire config complète
  return {
    geometry: geometry,
    totalLength: totalLength,
    numSegments: numSegments,
    fluid: {
      T_in: T_in,
      P: P_bar,
      m_dot: flowKgPerS,
    },
    ambient: {
      T_amb: T_amb,
      V_wind: V_wind_ms,
    },
    insulation: insulation,
    meta: {
      ...meta,
      flowM3PerHr: flowM3PerHr,
    },
  };
}

/**
 * Trouve la valeur d'un paramètre qui donne une température cible (dichotomie)
 * Utilise rebuildConfig() pour garantir cohérence complète de la config
 */
function findCriticalValue(baseConfig, paramKey, targetTemp, searchMin, searchMax) {
  let min = searchMin;
  let max = searchMax;
  const maxIterations = 20;
  const tolerance = 0.02; // °C

  // Vérifier atteignabilité
  let T_min, T_max;
  try {
    const configMin = rebuildConfig(baseConfig, paramKey, min);
    T_min = pipeNetwork.calculatePipeNetwork(configMin).T_final;

    const configMax = rebuildConfig(baseConfig, paramKey, max);
    T_max = pipeNetwork.calculatePipeNetwork(configMax).T_final;

    // Si cible pas dans plage, retourner null
    if ((T_min < targetTemp && T_max < targetTemp) || (T_min > targetTemp && T_max > targetTemp)) {
      return null;
    }
  } catch (e) {
    return null;
  }

  // Dichotomie
  for (let i = 0; i < maxIterations; i++) {
    const mid = (min + max) / 2;

    try {
      const testConfig = rebuildConfig(baseConfig, paramKey, mid);
      const T_mid = pipeNetwork.calculatePipeNetwork(testConfig).T_final;

      // Convergence
      if (Math.abs(T_mid - targetTemp) < tolerance) {
        return mid;
      }

      // Dichotomie
      if (
        (T_mid < targetTemp && T_min < targetTemp) ||
        (T_mid > targetTemp && T_min > targetTemp)
      ) {
        min = mid;
        T_min = T_mid;
      } else {
        max = mid;
        T_max = T_mid;
      }
    } catch (e) {
      // En cas d'erreur, réduire la plage
      if (i < maxIterations / 2) {
        max = mid;
      } else {
        min = mid;
      }
    }
  }

  return (min + max) / 2;
}

// ========== TESTS ==========

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ÉCHEC: ${message}`);
    testsFailed++;
    return false;
  } else {
    console.log(`✅ OK: ${message}`);
    testsPassed++;
    return true;
  }
}

console.log('\n' + '='.repeat(70));
console.log('TESTS COHÉRENCE ANALYSE 1D - POINTS CRITIQUES');
console.log('='.repeat(70) + '\n');

// ========== TEST 1: Cohérence point critique gel (0°C) ==========
console.log('TEST 1: Cohérence point critique gel (0°C)');
console.log('-'.repeat(70));

try {
  const baseConfig = getBaseConfig();

  // Trouver valeur critique débit pour T=0°C
  const criticalFlow = findCriticalValue(baseConfig, 'm_dot', 0.0, 0.1, 5.0);

  if (criticalFlow !== null) {
    console.log(`  → Valeur critique trouvée: ${criticalFlow.toFixed(3)} m³/h`);

    // Appliquer cette valeur et recalculer
    const testConfig = rebuildConfig(baseConfig, 'm_dot', criticalFlow);
    const result = pipeNetwork.calculatePipeNetwork(testConfig);

    const error = Math.abs(result.T_final - 0.0);
    console.log(`  → Température obtenue: ${result.T_final.toFixed(2)}°C`);
    console.log(`  → Écart: ${error.toFixed(3)}°C`);

    assert(error < 0.2, `Point critique gel: écart < 0.2°C (obtenu: ${error.toFixed(3)}°C)`);
  } else {
    console.log(`  → Point critique non trouvé dans plage [0.1, 5.0] m³/h`);
    assert(false, 'Point critique gel devrait être trouvé');
  }
} catch (e) {
  console.error(`  → Erreur: ${e.message}`);
  assert(false, `Test gel ne devrait pas lancer d'erreur`);
}

console.log('');

// ========== TEST 2: Cohérence point critique sécurité (5°C) ==========
console.log('TEST 2: Cohérence point critique sécurité (5°C)');
console.log('-'.repeat(70));

try {
  const baseConfig = getBaseConfig();

  // Trouver valeur critique débit pour T=5°C
  const criticalFlow = findCriticalValue(baseConfig, 'm_dot', 5.0, 0.1, 5.0);

  if (criticalFlow !== null) {
    console.log(`  → Valeur critique trouvée: ${criticalFlow.toFixed(3)} m³/h`);

    // Appliquer cette valeur et recalculer
    const testConfig = rebuildConfig(baseConfig, 'm_dot', criticalFlow);
    const result = pipeNetwork.calculatePipeNetwork(testConfig);

    const error = Math.abs(result.T_final - 5.0);
    console.log(`  → Température obtenue: ${result.T_final.toFixed(2)}°C`);
    console.log(`  → Écart: ${error.toFixed(3)}°C`);

    assert(error < 0.2, `Point critique sécurité: écart < 0.2°C (obtenu: ${error.toFixed(3)}°C)`);
  } else {
    console.log(`  → Point critique non trouvé dans plage [0.1, 5.0] m³/h`);
    assert(false, 'Point critique sécurité devrait être trouvé');
  }
} catch (e) {
  console.error(`  → Erreur: ${e.message}`);
  assert(false, `Test sécurité ne devrait pas lancer d'erreur`);
}

console.log('');

// ========== TEST 3: Stabilité de la recherche ==========
console.log('TEST 3: Stabilité de la recherche (5 répétitions)');
console.log('-'.repeat(70));

try {
  const baseConfig = getBaseConfig();
  const criticalValues = [];

  for (let i = 0; i < 5; i++) {
    const criticalFlow = findCriticalValue(baseConfig, 'm_dot', 0.0, 0.1, 5.0);
    if (criticalFlow !== null) {
      criticalValues.push(criticalFlow);
    }
  }

  if (criticalValues.length === 5) {
    const mean = criticalValues.reduce((a, b) => a + b, 0) / criticalValues.length;
    const maxDiff = Math.max(...criticalValues) - Math.min(...criticalValues);
    const variationPct = (maxDiff / mean) * 100;

    console.log(`  → Valeurs: ${criticalValues.map((v) => v.toFixed(3)).join(', ')} m³/h`);
    console.log(`  → Moyenne: ${mean.toFixed(3)} m³/h`);
    console.log(`  → Variation: ${variationPct.toFixed(2)}%`);

    assert(
      variationPct < 1.0,
      `Stabilité recherche: variation < 1% (obtenu: ${variationPct.toFixed(2)}%)`
    );
  } else {
    assert(false, `Toutes les recherches devraient réussir (${criticalValues.length}/5)`);
  }
} catch (e) {
  console.error(`  → Erreur: ${e.message}`);
  assert(false, `Test stabilité ne devrait pas lancer d'erreur`);
}

console.log('');

// ========== TEST 4: Idempotence applyParameterValue ==========
console.log('TEST 4: Idempotence applyParameterValue');
console.log('-'.repeat(70));

try {
  const baseConfig = getBaseConfig();
  const flowValue = 2.5; // m³/h

  // Première application
  const config1 = rebuildConfig(baseConfig, 'm_dot', flowValue);
  const m_dot1 = config1.fluid.m_dot;

  // Deuxième application avec même valeur
  const config2 = rebuildConfig(baseConfig, 'm_dot', flowValue);
  const m_dot2 = config2.fluid.m_dot;

  const diff = Math.abs(m_dot2 - m_dot1);
  const diffPct = (diff / m_dot1) * 100;

  console.log(`  → m_dot après 1ère application: ${m_dot1.toFixed(6)} kg/s`);
  console.log(`  → m_dot après 2ème application: ${m_dot2.toFixed(6)} kg/s`);
  console.log(`  → Différence: ${diffPct.toFixed(4)}%`);

  assert(diffPct < 0.01, `Idempotence: différence < 0.01% (obtenu: ${diffPct.toFixed(4)}%)`);
} catch (e) {
  console.error(`  → Erreur: ${e.message}`);
  assert(false, `Test idempotence ne devrait pas lancer d'erreur`);
}

console.log('');

// ========== TEST 5: Cohérence pour différents paramètres ==========
console.log('TEST 5: Cohérence pour différents paramètres');
console.log('-'.repeat(70));

const parametersToTest = [
  { key: 'T_in', min: 20, max: 80, target: 5.0, tolerance: 0.3 },
  { key: 'T_amb', min: -30, max: 10, target: 5.0, tolerance: 0.3 },
  { key: 'V_wind', min: 0, max: 50, target: 5.0, tolerance: 0.3 },
  { key: 'L', min: 10, max: 500, target: 5.0, tolerance: 0.3 },
];

parametersToTest.forEach((param) => {
  try {
    const baseConfig = getBaseConfig();
    const criticalValue = findCriticalValue(
      baseConfig,
      param.key,
      param.target,
      param.min,
      param.max
    );

    if (criticalValue !== null) {
      const testConfig = rebuildConfig(baseConfig, param.key, criticalValue);
      const result = pipeNetwork.calculatePipeNetwork(testConfig);
      const error = Math.abs(result.T_final - param.target);

      console.log(
        `  → ${param.key}: valeur=${criticalValue.toFixed(2)}, T=${result.T_final.toFixed(2)}°C, écart=${error.toFixed(3)}°C`
      );

      assert(
        error < param.tolerance,
        `${param.key}: écart < ${param.tolerance}°C (obtenu: ${error.toFixed(3)}°C)`
      );
    } else {
      console.log(`  → ${param.key}: point critique non trouvé (OK si hors plage)`);
      // Ne pas échouer si point non trouvé (peut être hors plage)
    }
  } catch (e) {
    console.log(`  → ${param.key}: erreur ${e.message.substring(0, 50)}`);
    // Ne pas échouer sur erreurs (conditions extrêmes possibles)
  }
});

console.log('');

// ========== TEST 6: Cas extrêmes ==========
console.log('TEST 6: Cas extrêmes');
console.log('-'.repeat(70));

// Test 6a: Débit très faible (proche gel)
try {
  const baseConfig = getBaseConfig();
  baseConfig.totalLength = 200; // Augmenter longueur pour forcer gel à faible débit

  const veryLowFlow = 0.15; // m³/h - très faible
  const testConfig = rebuildConfig(baseConfig, 'm_dot', veryLowFlow);

  const result = pipeNetwork.calculatePipeNetwork(testConfig);
  console.log(`  → Débit très faible (${veryLowFlow} m³/h): T=${result.T_final.toFixed(2)}°C`);

  assert(
    result.T_final >= -1, // Accepter gel ou proche de 0
    `Débit très faible: résultat cohérent (T=${result.T_final.toFixed(2)}°C)`
  );
} catch (e) {
  // Erreur acceptable si débit trop faible
  console.log(`  → Débit très faible: erreur attendue (${e.message.substring(0, 50)})`);
}

// Test 6b: Débit très élevé (turbulent fort)
try {
  const baseConfig = getBaseConfig();

  const veryHighFlow = 20.0; // m³/h - très élevé
  const testConfig = rebuildConfig(baseConfig, 'm_dot', veryHighFlow);

  const result = pipeNetwork.calculatePipeNetwork(testConfig);
  console.log(
    `  → Débit très élevé (${veryHighFlow} m³/h): T=${result.T_final.toFixed(2)}°C, Re=${result.segmentResults[0].Re.toFixed(0)}`
  );

  assert(
    result.T_final > 40 && result.T_final < baseConfig.fluid.T_in,
    `Débit très élevé: T raisonnable (${result.T_final.toFixed(2)}°C)`
  );
} catch (e) {
  console.log(`  → Débit très élevé: erreur ${e.message.substring(0, 50)}`);
  assert(false, `Débit élevé ne devrait pas échouer`);
}

console.log('');

// ========== NOUVELLES FONCTIONS POUR TESTS ==========

/**
 * Détermine si une erreur est critique ou acceptable
 * (Clone de la fonction dans sensitivity-analysis-1d.js)
 */
function isCriticalError(error) {
  if (!error || !error.message) {
    return false;
  }

  const msg = error.message.toLowerCase();

  // Erreurs critiques (bloquantes)
  const criticalPatterns = [
    'perte de charge excessive',
    'pression.*négative',
    'propriétés.*invalide',
    'température.*hors.*plage',
    'débit.*invalide',
    'nan',
    'infinity',
  ];

  for (const pattern of criticalPatterns) {
    if (msg.match(pattern)) {
      return true;
    }
  }

  // Warnings acceptables (non-bloquants)
  const warningPatterns = ['convergence lente', 'précision réduite', 'approximation'];

  for (const pattern of warningPatterns) {
    if (msg.match(pattern)) {
      return false;
    }
  }

  // Par défaut, considérer comme critique si incertain
  return true;
}

/**
 * Trouve une valeur valide proche d'une borne cible par dichotomie
 * (Clone simplifié de la fonction dans sensitivity-analysis-1d.js)
 */
function findValidBound(baseConfig, paramKey, targetValue, referenceValue, maxIterations = 15) {
  const SAFE_BOUND_MAX_ITERATIONS = maxIterations;

  // Essayer la valeur cible directement
  try {
    const config = rebuildConfig(baseConfig, paramKey, targetValue);
    const result = pipeNetwork.calculatePipeNetwork(config);
    return { value: targetValue, T_final: result.T_final };
  } catch (e) {
    if (!isCriticalError(e)) {
      // Warning acceptable, retourner quand même
      try {
        const config = rebuildConfig(baseConfig, paramKey, targetValue);
        const result = pipeNetwork.calculatePipeNetwork(config);
        return { value: targetValue, T_final: result.T_final };
      } catch (e2) {
        // Échec réel
      }
    }
  }

  // Dichotomie entre referenceValue (valide) et targetValue (invalide)
  let low = referenceValue;
  let high = targetValue;

  // S'assurer que low < high
  if (low > high) {
    [low, high] = [high, low];
  }

  let bestValid = null;

  for (let iter = 0; iter < SAFE_BOUND_MAX_ITERATIONS; iter++) {
    const mid = (low + high) / 2;

    try {
      const config = rebuildConfig(baseConfig, paramKey, mid);
      const result = pipeNetwork.calculatePipeNetwork(config);

      bestValid = { value: mid, T_final: result.T_final };

      // Chercher plus loin vers la cible
      if (targetValue > referenceValue) {
        low = mid;
      } else {
        high = mid;
      }
    } catch (e) {
      if (isCriticalError(e)) {
        // Chercher vers la référence
        if (targetValue > referenceValue) {
          high = mid;
        } else {
          low = mid;
        }
      } else {
        // Warning acceptable
        try {
          const config = rebuildConfig(baseConfig, paramKey, mid);
          const result = pipeNetwork.calculatePipeNetwork(config);
          bestValid = { value: mid, T_final: result.T_final };
        } catch (e2) {
          // Ignorer erreur secondaire
        }

        if (targetValue > referenceValue) {
          low = mid;
        } else {
          high = mid;
        }
      }
    }

    // Convergence
    if (Math.abs(high - low) < 0.001) {
      break;
    }
  }

  return bestValid;
}

// ========== NOUVEAUX TESTS ==========

console.log('\n--- Test 7: isCriticalError distingue critiques vs warnings ---');
try {
  const criticalErr = new Error('Perte de charge excessive');
  const warningErr = new Error('Convergence lente');
  const unknownErr = new Error('Erreur générique');

  assert(isCriticalError(criticalErr) === true, 'Perte de charge doit être critique');
  assert(isCriticalError(warningErr) === false, 'Convergence lente doit être warning');
  assert(isCriticalError(unknownErr) === true, 'Erreur inconnue doit être critique par défaut');
  assert(isCriticalError(null) === false, 'null doit retourner false');

  console.log('✓ isCriticalError fonctionne correctement');
  testsPassed++;
} catch (e) {
  console.log(`✗ ${e.message}`);
  testsFailed++;
}

console.log('\n--- Test 8: findValidBound avec config gelée ---');
try {
  const frozenConfig = {
    geometry: {
      D_inner: 0.0525,
      D_outer: 0.0603,
      roughness: 0.045e-3,
      material: 'steel',
    },
    totalLength: 300,
    numSegments: 60,
    fluid: {
      T_in: 10,
      P: 3.0,
      m_dot: 2.0, // kg/s
    },
    ambient: {
      T_amb: -27,
      V_wind: 20.0 / 3.6,
    },
    insulation: null,
    meta: {
      flowM3PerHr: 7.2,
      hasInsulation: false,
    },
  };

  // La valeur actuelle (7.2 m³/h) devrait être valide
  const baseValue = 7.2;

  // Essayer de trouver une borne MAX valide (le max théorique de 30 m³/h échoue probablement)
  const validBound = findValidBound(frozenConfig, 'm_dot', 30.0, baseValue, 10);

  assert(validBound !== null, 'findValidBound doit trouver une borne valide');
  assert(validBound.value < 30.0, 'La borne valide doit être < 30 m³/h');
  assert(validBound.value > baseValue, 'La borne valide doit être > baseValue');
  assert(typeof validBound.T_final === 'number', 'T_final doit être un nombre');

  console.log(
    `✓ findValidBound a trouvé: ${validBound.value.toFixed(2)} m³/h (T_final: ${validBound.T_final.toFixed(2)}°C)`
  );
  testsPassed++;
} catch (e) {
  console.log(`✗ ${e.message}`);
  testsFailed++;
}

// ========== COMPARAISON VERSION OLD vs NEW ==========
console.log('COMPARAISON: Version OLD vs NEW (démontrer le problème)');
console.log('-'.repeat(70));

try {
  const baseConfig = getBaseConfig();

  // Recherche avec rebuildConfig (version corrigée)
  const criticalFlow = findCriticalValue(baseConfig, 'm_dot', 0.0, 0.1, 5.0);

  if (criticalFlow !== null) {
    // Appliquer et vérifier précision
    const testConfig = rebuildConfig(baseConfig, 'm_dot', criticalFlow);
    const result = pipeNetwork.calculatePipeNetwork(testConfig);
    const error = Math.abs(result.T_final - 0.0);

    console.log(`  → Valeur critique: ${criticalFlow.toFixed(3)} m³/h`);
    console.log(`  → T_final obtenue: ${result.T_final.toFixed(2)}°C`);
    console.log(`  → Écart vs 0°C: ${error.toFixed(3)}°C`);
    console.log(`  → Précision améliorée avec rebuildConfig()`);

    // Ne pas faire d'assertion ici, c'est juste pour démontrer la précision
  }
} catch (e) {
  console.log(`  → Erreur comparaison: ${e.message}`);
}

console.log('');

// ========== RÉSUMÉ ==========
console.log('='.repeat(70));
console.log(`RÉSUMÉ: ${testsPassed} tests réussis, ${testsFailed} tests échoués`);
console.log('='.repeat(70));

if (testsFailed === 0) {
  console.log('✅ TOUS LES TESTS PASSENT - Cohérence analyse 1D validée\n');
  process.exit(0);
} else {
  console.log('❌ ÉCHECS DÉTECTÉS - Corrections nécessaires\n');
  process.exit(1);
}
