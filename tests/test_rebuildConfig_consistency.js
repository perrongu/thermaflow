/**
 * Test de cohérence: rebuildConfig() vs getFormData()
 *
 * Vérifie que rebuildConfig(baseConfig, 'm_dot', baseConfig.meta.flowM3PerHr)
 * produit une config IDENTIQUE à baseConfig
 */

const path = require('path');
const ROOT_DIR = path.resolve(__dirname, '..');

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

const { calculatePipeNetwork } = pipeNetwork;

// Simuler rebuildConfig (copie exacte du code dans sensitivity-analysis-1d.js)
function rebuildConfig(baseConfig, paramKey, newValue) {
  const geometry = { ...baseConfig.geometry };
  const insulation = baseConfig.insulation ? { ...baseConfig.insulation } : null;
  const meta = { ...baseConfig.meta };

  let totalLength = baseConfig.totalLength;
  let T_in = baseConfig.fluid.T_in;
  const P_bar = baseConfig.fluid.P;
  let flowM3PerHr = baseConfig.meta.flowM3PerHr;
  let T_amb = baseConfig.ambient.T_amb;
  let V_wind_kmh = baseConfig.ambient.V_wind * 3.6;

  switch (paramKey) {
    case 'L':
      totalLength = newValue;
      break;
    case 'm_dot':
      flowM3PerHr = newValue;
      break;
    case 'T_in':
      T_in = newValue;
      break;
    case 'T_amb':
      T_amb = newValue;
      break;
    case 'V_wind':
      V_wind_kmh = newValue;
      break;
    case 't_insul':
      if (insulation) {
        insulation.thickness = newValue / 1000.0;
      }
      break;
  }

  let rho_water = 1000;
  if (
    typeof global.window !== 'undefined' &&
    typeof global.window.WaterProperties !== 'undefined'
  ) {
    try {
      const waterProps = global.window.WaterProperties.getWaterProperties(T_in, P_bar);
      rho_water = waterProps.rho;
    } catch (e) {
      console.warn(`rebuildConfig: Densité eau fallback à 1000 kg/m³`);
    }
  }
  const flowM3PerS = flowM3PerHr / 3600;
  const flowKgPerS = flowM3PerS * rho_water;

  const numSegments = Math.min(Math.max(Math.ceil(totalLength / 5), 10), 100);
  const V_wind_ms = V_wind_kmh / 3.6;

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

// Fonction de comparaison profonde
function deepCompare(obj1, obj2, path = '') {
  const differences = [];

  if (typeof obj1 !== typeof obj2) {
    differences.push(`${path}: type différent (${typeof obj1} vs ${typeof obj2})`);
    return differences;
  }

  if (obj1 === null || obj2 === null) {
    if (obj1 !== obj2) {
      differences.push(`${path}: ${obj1} !== ${obj2}`);
    }
    return differences;
  }

  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Vérifier les clés manquantes
    for (const key of keys1) {
      if (!keys2.includes(key)) {
        differences.push(`${path}.${key}: clé manquante dans obj2`);
      }
    }
    for (const key of keys2) {
      if (!keys1.includes(key)) {
        differences.push(`${path}.${key}: clé manquante dans obj1`);
      }
    }

    // Comparer les valeurs
    for (const key of keys1) {
      if (keys2.includes(key)) {
        differences.push(...deepCompare(obj1[key], obj2[key], `${path}.${key}`));
      }
    }
  } else if (typeof obj1 === 'number') {
    const diff = Math.abs(obj1 - obj2);
    const relDiff = diff / Math.max(Math.abs(obj1), Math.abs(obj2), 1e-10);
    if (relDiff > 1e-10) {
      differences.push(
        `${path}: ${obj1} !== ${obj2} (diff: ${diff.toExponential(3)}, rel: ${(relDiff * 100).toFixed(6)}%)`
      );
    }
  } else {
    if (obj1 !== obj2) {
      differences.push(`${path}: ${obj1} !== ${obj2}`);
    }
  }

  return differences;
}

// Configuration de test (manuelle)
const baseConfig = {
  geometry: {
    D_inner: 0.1023, // 4" schedule 40
    D_outer: 0.1143,
    roughness: 0.045e-3, // Acier commercial
    material: 'steel',
  },
  totalLength: 300,
  numSegments: 60, // Math.min(Math.max(Math.ceil(300/5), 10), 100)
  fluid: {
    T_in: 10,
    P: 3.0, // 300 kPag = 3 bar
    m_dot: 1.999, // Approximatif pour 7.2 m³/h
  },
  ambient: {
    T_amb: -27,
    V_wind: 18 / 3.6, // 5 m/s
  },
  insulation: null,
  meta: {
    material: 'steel',
    schedule: 'sch40',
    nps: 4,
    flowM3PerHr: 7.2,
    hasInsulation: false,
  },
};

// Recalculer m_dot précisément
const rho_water_at_10C = waterProps.getWaterProperties(10, 3.0).rho;
baseConfig.fluid.m_dot = (7.2 / 3600) * rho_water_at_10C;

console.log('='.repeat(70));
console.log('TEST: Cohérence rebuildConfig() avec même valeur de débit');
console.log('='.repeat(70));
console.log('');

// Test 1: Rebuild avec même débit
const rebuiltConfig = rebuildConfig(baseConfig, 'm_dot', baseConfig.meta.flowM3PerHr);

console.log('Config originale:');
console.log(`  - flowM3PerHr: ${baseConfig.meta.flowM3PerHr}`);
console.log(`  - m_dot: ${baseConfig.fluid.m_dot}`);
console.log(`  - numSegments: ${baseConfig.numSegments}`);
console.log('');

console.log('Config reconstruite:');
console.log(`  - flowM3PerHr: ${rebuiltConfig.meta.flowM3PerHr}`);
console.log(`  - m_dot: ${rebuiltConfig.fluid.m_dot}`);
console.log(`  - numSegments: ${rebuiltConfig.numSegments}`);
console.log('');

// Comparer
const differences = deepCompare(baseConfig, rebuiltConfig, 'config');

if (differences.length === 0) {
  console.log('✅ SUCCÈS: Les configs sont identiques!');
} else {
  console.log(`❌ ÉCHEC: ${differences.length} différence(s) trouvée(s):`);
  differences.forEach((diff) => console.log(`  - ${diff}`));
}
console.log('');

// Test 2: Calculer T_final avec les deux configs
console.log('Test calcul T_final:');
const result1 = calculatePipeNetwork(baseConfig);
const result2 = calculatePipeNetwork(rebuiltConfig);

console.log(`  - Base: T_final = ${result1.T_final.toFixed(4)}°C`);
console.log(`  - Rebuilt: T_final = ${result2.T_final.toFixed(4)}°C`);
console.log(`  - Différence: ${Math.abs(result1.T_final - result2.T_final).toExponential(3)}°C`);

if (Math.abs(result1.T_final - result2.T_final) < 1e-6) {
  console.log('✅ Les résultats sont identiques!');
} else {
  console.log('❌ Les résultats diffèrent!');
}
console.log('');

// Test 3: Rebuild avec débit différent (8.07 m³/h - point critique)
console.log('='.repeat(70));
console.log('TEST: Rebuild avec débit critique (8.07 m³/h)');
console.log('='.repeat(70));
console.log('');

const criticalConfig = rebuildConfig(baseConfig, 'm_dot', 8.07);
const result3 = calculatePipeNetwork(criticalConfig);

console.log(`Config critique:`);
console.log(`  - flowM3PerHr: ${criticalConfig.meta.flowM3PerHr}`);
console.log(`  - m_dot: ${criticalConfig.fluid.m_dot}`);
console.log(`  - numSegments: ${criticalConfig.numSegments}`);
console.log(`  - T_final: ${result3.T_final.toFixed(4)}°C`);
console.log('');

if (Math.abs(result3.T_final) < 0.3) {
  console.log(
    `✅ Température finale proche de 0°C (écart: ${Math.abs(result3.T_final).toFixed(4)}°C)`
  );
} else {
  console.log(
    `❌ Température finale éloignée de 0°C (écart: ${Math.abs(result3.T_final).toFixed(4)}°C)`
  );
}
