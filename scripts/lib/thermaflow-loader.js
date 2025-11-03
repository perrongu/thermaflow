/**
 * thermaflow-loader.js
 * 
 * Module partagé pour le chargement des modules ThermaFlow et la conversion des données
 * Utilisé par automated_verification.js et autres scripts de validation
 */

const fs = require('fs');
const path = require('path');

// Constantes pour validation externe
const ROUGHNESS_BY_MATERIAL = {
  steel: 0.045e-3,           // m (acier commercial)
  copper: 0.0015e-3,         // m (cuivre)
  stainless_steel: 0.015e-3   // m (inox)
};

// Seuils pour identifier les écarts significatifs
const VALIDATION_THRESHOLDS = {
  TEMP_DEVIATION_C: 3.0,        // Écart température significatif (°C)
  PRESSURE_DEVIATION_KPA: 20,   // Écart pression absolu (kPa)
  PRESSURE_DEVIATION_PCT: 30,   // Écart pression relatif (%)
  HEAT_LOSS_DEVIATION_PCT: 50   // Écart perte thermique (%)
};

/**
 * Charger les modules ThermaFlow pour calculs
 * Note: Charge tous les modules nécessaires dans l'ordre des dépendances
 */
function loadThermaFlowModules(rootDir) {
  // Charger les tables de données
  const { waterTablesData } = require(path.join(rootDir, 'data', 'fluids', 'water-tables.js'));
  const { airTablesData } = require(path.join(rootDir, 'data', 'fluids', 'air-tables.js'));
  const { materialPropertiesData } = require(path.join(rootDir, 'data', 'materials', 'properties.js'));

  // Créer contexte global pour simuler window
  global.window = {
    WaterTablesData: waterTablesData,
    AirTablesData: airTablesData,
    MaterialPropertiesData: materialPropertiesData
  };

  // Charger TOUS les modules dans l'ordre des dépendances
  // 1. Properties
  const waterProperties = require(path.join(rootDir, 'js', 'properties', 'water-properties.js'));
  const airProperties = require(path.join(rootDir, 'js', 'properties', 'air-properties.js'));
  const materialPropertiesModule = require(path.join(rootDir, 'js', 'properties', 'material-properties.js'));
  
  // 2. Formulas
  const reynolds = require(path.join(rootDir, 'js', 'formulas', 'reynolds.js'));
  const geometry = require(path.join(rootDir, 'js', 'formulas', 'geometry.js'));
  const pressureBasic = require(path.join(rootDir, 'js', 'formulas', 'pressure-basic.js'));
  
  // 3. Correlations
  const frictionFactor = require(path.join(rootDir, 'js', 'correlations', 'friction-factor.js'));
  const nusseltInternal = require(path.join(rootDir, 'js', 'correlations', 'nusselt-internal.js'));
  const nusseltExternal = require(path.join(rootDir, 'js', 'correlations', 'nusselt-external.js'));
  const radiation = require(path.join(rootDir, 'js', 'correlations', 'radiation.js'));
  
  // 4. Calculations
  const pressureDrop = require(path.join(rootDir, 'js', 'calculations', 'pressure-drop.js'));
  const thermalResistance = require(path.join(rootDir, 'js', 'calculations', 'thermal-resistance.js'));
  const heatTransfer = require(path.join(rootDir, 'js', 'calculations', 'heat-transfer.js'));
  
  // 5. Engine
  const pipeSegment = require(path.join(rootDir, 'js', 'engine', 'pipe-segment.js'));
  const pipeNetwork = require(path.join(rootDir, 'js', 'engine', 'pipe-network.js'));

  return { waterProperties, pipeNetwork };
}

/**
 * Charger les pipespecs
 */
function loadPipeSpecsHelper(rootDir) {
  const pipespecsData = {};
  
  // Charger steel
  const steelCode = fs.readFileSync(path.join(rootDir, 'data', 'pipespecs', 'steel.js'), 'utf8');
  const steelCodeModified = steelCode.replace(/^const steelData =/m, 'pipespecsData.steelData =');
  const steelFunc = new Function('pipespecsData', steelCodeModified);
  steelFunc(pipespecsData);
  
  // Charger copper
  const copperCode = fs.readFileSync(path.join(rootDir, 'data', 'pipespecs', 'copper.js'), 'utf8');
  const copperCodeModified = copperCode.replace(/^const copperData =/m, 'pipespecsData.copperData =');
  const copperFunc = new Function('pipespecsData', copperCodeModified);
  copperFunc(pipespecsData);
  
  // Charger stainless_steel
  const stainlessCode = fs.readFileSync(path.join(rootDir, 'data', 'pipespecs', 'stainless_steel.js'), 'utf8');
  const stainlessCodeModified = stainlessCode.replace(/^const stainlessData =/m, 'pipespecsData.stainlessData =');
  const stainlessFunc = new Function('pipespecsData', stainlessCodeModified);
  stainlessFunc(pipespecsData);
  
  const steelData = pipespecsData.steelData;
  const copperData = pipespecsData.copperData;
  const stainlessData = pipespecsData.stainlessData;
  
  function getPipeSpecs(material, scheduleOrType, nps) {
    let data = null;
    let key = String(scheduleOrType);
    
    if (material === 'steel') {
      data = steelData;
    } else if (material === 'copper') {
      data = copperData;
    } else if (material === 'stainless_steel') {
      data = stainlessData;
    }
    
    if (!data) {
      throw new Error(`Matériau inconnu: ${material}`);
    }
    
    let specs = null;
    if (material === 'copper') {
      specs = data.types[key];
    } else {
      specs = data.schedules[key];
    }
    
    if (!specs) {
      throw new Error(`Schedule/Type inconnu pour ${material}: ${key}`);
    }
    
    const pipe = specs.find(p => p.NPS === nps);
    
    if (!pipe) {
      throw new Error(`NPS ${nps}" non trouvé pour ${material} ${key}`);
    }
    
    return {
      OD: pipe.OD,
      ID: pipe.ID,
      WT: pipe.WT,
      NPS: pipe.NPS
    };
  }
  
  return { getPipeSpecs };
}

/**
 * Convertir inputs JSON vers format calculatePipeNetwork
 */
function convertInputsToNetworkConfig(inputs, pipeSpecsHelper, modules) {
  const { pipe, fluid, ambient, insulation } = inputs;
  
  const specs = pipeSpecsHelper.getPipeSpecs(pipe.material, pipe.schedule, pipe.nps);
  if (!specs) {
    throw new Error(`Specs introuvables: ${pipe.material} ${pipe.schedule} ${pipe.nps}"`);
  }
  
  const D_inner = specs.ID / 1000.0;
  const D_outer = specs.OD / 1000.0;
  const roughness = ROUGHNESS_BY_MATERIAL[pipe.material];
  
  if (!roughness) {
    throw new Error(`Rugosité inconnue pour matériau: ${pipe.material}`);
  }
  
  const numSegments = Math.min(Math.max(Math.ceil(pipe.length_m / 5), 10), 100);
  
  const P_bar = fluid.pressure_kPag / 100.0;
  const waterProps = modules.waterProperties.getWaterProperties(fluid.temp_C, P_bar);
  const flow_m3_s = fluid.flow_m3h / 3600.0;
  const m_dot = flow_m3_s * waterProps.rho;
  
  const V_wind = ambient.wind_kmh / 3.6;
  
  let insulationConfig = null;
  if (insulation !== null) {
    insulationConfig = {
      material: insulation.material,
      thickness: insulation.thickness_mm / 1000.0
    };
  }
  
  return {
    geometry: {
      D_inner: D_inner,
      D_outer: D_outer,
      roughness: roughness,
      material: pipe.material
    },
    totalLength: pipe.length_m,
    numSegments: numSegments,
    fluid: {
      T_in: fluid.temp_C,
      P: P_bar,
      m_dot: m_dot
    },
    ambient: {
      T_amb: ambient.temp_C,
      V_wind: V_wind
    },
    insulation: insulationConfig
  };
}

module.exports = {
  loadThermaFlowModules,
  loadPipeSpecsHelper,
  convertInputsToNetworkConfig,
  ROUGHNESS_BY_MATERIAL,
  VALIDATION_THRESHOLDS
};

