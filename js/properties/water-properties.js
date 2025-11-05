/**
 * @typedef {Object} WaterProperties
 * @property {number} rho - Densité [kg/m³]
 * @property {number} mu - Viscosité dynamique [Pa·s]
 * @property {number} k - Conductivité thermique [W/(m·K)]
 * @property {number} cp - Capacité thermique spécifique [J/(kg·K)]
 */

// Constantes de validation
const WATER_T_MIN = 0.0; // °C
const WATER_T_MAX = 100.0; // °C
const WATER_P_MIN = 1.0; // bar
const WATER_P_MAX = 10.0; // bar

/**
 * Interpolation linéaire 1D
 * @private
 */
function lerp(x, x0, x1, y0, y1) {
  if (x1 === x0) {
    return y0;
  }
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/**
 * Interpolation bilinéaire 2D
 * @private
 */
function bilinearInterp(x, y, x0, x1, y0, y1, f00, f10, f01, f11) {
  const r1 = lerp(x, x0, x1, f00, f10);
  const r2 = lerp(x, x0, x1, f01, f11);
  return lerp(y, y0, y1, r1, r2);
}

/**
 * Trouve les indices des points de grille encadrant une valeur
 * @private
 */
function findBracketIndices(value, grid) {
  if (value <= grid[0]) {
    return { i0: 0, i1: 0 };
  }
  if (value >= grid[grid.length - 1]) {
    return { i0: grid.length - 1, i1: grid.length - 1 };
  }

  for (let i = 0; i < grid.length - 1; i++) {
    if (value >= grid[i] && value <= grid[i + 1]) {
      return { i0: i, i1: i + 1 };
    }
  }

  return { i0: 0, i1: 0 };
}

/**
 * Calcule les propriétés thermophysiques de l'eau pour une température et pression données.
 *
 * @param {number} T_C - Température en °C (plage: 0 à 100°C)
 * @param {number} P_bar - Pression en bar (plage: 1 à 10 bar)
 * @returns {WaterProperties} Objet contenant toutes les propriétés
 * @throws {Error} Si les paramètres sont invalides ou hors plage
 *
 * @example
 * // Eau à 20°C et pression atmosphérique
 * const props = getWaterProperties(20, 1.0);
 * console.log(props.rho);  // 998.21 kg/m³
 * console.log(props.mu);   // 1.002e-3 Pa·s
 * console.log(props.k);    // 0.598 W/(m·K)
 * console.log(props.cp);   // 4184.8 J/(kg·K)
 */
function getWaterProperties(T_C, P_bar) {
  // Validation du type et des valeurs spéciales
  if (typeof T_C !== 'number' || !isFinite(T_C)) {
    throw new Error(`Température invalide: ${T_C} (doit être un nombre fini)`);
  }
  if (typeof P_bar !== 'number' || !isFinite(P_bar)) {
    throw new Error(`Pression invalide: ${P_bar} (doit être un nombre fini)`);
  }

  // Validation des plages
  if (T_C < WATER_T_MIN || T_C > WATER_T_MAX) {
    throw new Error(
      `Température hors plage: ${T_C}°C (plage valide: ${WATER_T_MIN} à ${WATER_T_MAX}°C)`
    );
  }
  if (P_bar < WATER_P_MIN || P_bar > WATER_P_MAX) {
    throw new Error(
      `Pression hors plage: ${P_bar} bar (plage valide: ${WATER_P_MIN} à ${WATER_P_MAX} bar)`
    );
  }

  // Récupérer les tables (depuis window ou module)
  let waterData;
  if (typeof window !== 'undefined' && window.WaterTablesData) {
    waterData = window.WaterTablesData;
  } else if (typeof require !== 'undefined') {
    waterData = require('../../data/fluids/water-tables.js').waterTablesData;
  } else {
    throw new Error('Tables de données eau non disponibles');
  }

  // Trouver les indices de la grille
  const T_grid = waterData.temperature_grid_C;
  const P_grid = waterData.pressure_grid_bar;

  const { i0: iT0, i1: iT1 } = findBracketIndices(T_C, T_grid);
  const { i0: iP0, i1: iP1 } = findBracketIndices(P_bar, P_grid);

  // Cas spécial: valeur exactement sur un point de grille
  if (iT0 === iT1 && iP0 === iP1) {
    return {
      rho: waterData.density_kg_m3[iT0][iP0],
      mu: waterData.viscosity_Pa_s[iT0][iP0],
      k: waterData.thermal_conductivity_W_m_K[iT0][iP0],
      cp: waterData.specific_heat_J_kg_K[iT0][iP0],
    };
  }

  // Interpolation bilinéaire
  const T0 = T_grid[iT0];
  const T1 = T_grid[iT1];
  const P0 = P_grid[iP0];
  const P1 = P_grid[iP1];

  // Interpoler chaque propriété
  const rho = bilinearInterp(
    T_C,
    P_bar,
    T0,
    T1,
    P0,
    P1,
    waterData.density_kg_m3[iT0][iP0],
    waterData.density_kg_m3[iT1][iP0],
    waterData.density_kg_m3[iT0][iP1],
    waterData.density_kg_m3[iT1][iP1]
  );

  const mu = bilinearInterp(
    T_C,
    P_bar,
    T0,
    T1,
    P0,
    P1,
    waterData.viscosity_Pa_s[iT0][iP0],
    waterData.viscosity_Pa_s[iT1][iP0],
    waterData.viscosity_Pa_s[iT0][iP1],
    waterData.viscosity_Pa_s[iT1][iP1]
  );

  const k = bilinearInterp(
    T_C,
    P_bar,
    T0,
    T1,
    P0,
    P1,
    waterData.thermal_conductivity_W_m_K[iT0][iP0],
    waterData.thermal_conductivity_W_m_K[iT1][iP0],
    waterData.thermal_conductivity_W_m_K[iT0][iP1],
    waterData.thermal_conductivity_W_m_K[iT1][iP1]
  );

  const cp = bilinearInterp(
    T_C,
    P_bar,
    T0,
    T1,
    P0,
    P1,
    waterData.specific_heat_J_kg_K[iT0][iP0],
    waterData.specific_heat_J_kg_K[iT1][iP0],
    waterData.specific_heat_J_kg_K[iT0][iP1],
    waterData.specific_heat_J_kg_K[iT1][iP1]
  );

  return { rho, mu, k, cp };
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.WaterProperties = {
    getWaterProperties,
    WATER_T_MIN,
    WATER_T_MAX,
    WATER_P_MIN,
    WATER_P_MAX,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWaterProperties,
    WATER_T_MIN,
    WATER_T_MAX,
    WATER_P_MIN,
    WATER_P_MAX,
  };
}
