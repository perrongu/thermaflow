// Import des tables de données
// Note: En production browser, charger via <script src="data/fluids/air-tables.js">
// Ici on assume que airTablesData est disponible dans window.AirTablesData

/**
 * @typedef {Object} AirProperties
 * @property {number} rho - Densité [kg/m³]
 * @property {number} mu - Viscosité dynamique [Pa·s]
 * @property {number} k - Conductivité thermique [W/(m·K)]
 * @property {number} cp - Capacité thermique spécifique [J/(kg·K)]
 * @property {number} Pr - Nombre de Prandtl [sans dimension]
 */

// Constantes de validation
const AIR_T_MIN = -40.0; // °C
const AIR_T_MAX = 50.0; // °C

/**
 * Interpolation linéaire 1D
 * @private
 * @param {number} x - Valeur à interpoler
 * @param {number} x0 - Point connu inférieur
 * @param {number} x1 - Point connu supérieur
 * @param {number} y0 - Valeur à x0
 * @param {number} y1 - Valeur à x1
 * @returns {number} Valeur interpolée
 */
function lerp(x, x0, x1, y0, y1) {
  if (x1 === x0) {
    return y0; // Évite division par zéro
  }
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/**
 * Trouve les indices des points de grille encadrant une valeur
 * @private
 * @param {number} value - Valeur à encadrer
 * @param {Array<number>} grid - Grille de valeurs
 * @returns {{i0: number, i1: number}} Indices inférieur et supérieur
 */
function findBracketIndices(value, grid) {
  // Cas limites
  if (value <= grid[0]) {
    return { i0: 0, i1: 0 };
  }
  if (value >= grid[grid.length - 1]) {
    return { i0: grid.length - 1, i1: grid.length - 1 };
  }

  // Recherche linéaire (grille petite, pas besoin de binaire)
  for (let i = 0; i < grid.length - 1; i++) {
    if (value >= grid[i] && value <= grid[i + 1]) {
      return { i0: i, i1: i + 1 };
    }
  }

  // Ne devrait jamais arriver ici
  return { i0: 0, i1: 0 };
}

/**
 * Calcule les propriétés thermophysiques de l'air sec pour une température donnée.
 *
 * Pression: Atmosphérique (1.01325 bar / 101325 Pa)
 *
 * @param {number} T_C - Température en °C (plage: -40 à 50°C)
 * @returns {AirProperties} Objet contenant toutes les propriétés
 * @throws {Error} Si la température est invalide ou hors plage
 *
 * @example
 * // Air à 20°C
 * const props = getAirProperties(20);
 * console.log(props.rho);  // 1.204 kg/m³
 * console.log(props.mu);   // 1.813e-5 Pa·s
 * console.log(props.k);    // 0.0255 W/(m·K)
 * console.log(props.cp);   // 1005.3 J/(kg·K)
 * console.log(props.Pr);   // 0.715
 */
function getAirProperties(T_C) {
  // Validation du type et des valeurs spéciales
  if (typeof T_C !== 'number' || !isFinite(T_C)) {
    throw new Error(`Température invalide: ${T_C} (doit être un nombre fini)`);
  }

  // Validation de la plage
  if (T_C < AIR_T_MIN || T_C > AIR_T_MAX) {
    throw new Error(
      `Température hors plage: ${T_C}°C (plage valide: ${AIR_T_MIN} à ${AIR_T_MAX}°C)`
    );
  }

  // Récupérer les tables (depuis window ou module)
  let airData;
  if (typeof window !== 'undefined' && window.AirTablesData) {
    airData = window.AirTablesData;
  } else if (typeof require !== 'undefined') {
    airData = require('../../data/fluids/air-tables.js').airTablesData;
  } else {
    throw new Error('Tables de données air non disponibles');
  }

  // Trouver les indices de la grille
  const T_grid = airData.temperature_grid_C;
  const { i0, i1 } = findBracketIndices(T_C, T_grid);

  // Cas spécial: valeur exactement sur un point de grille
  if (i0 === i1) {
    return {
      rho: airData.density_kg_m3[i0],
      mu: airData.viscosity_Pa_s[i0],
      k: airData.thermal_conductivity_W_m_K[i0],
      cp: airData.specific_heat_J_kg_K[i0],
      Pr: airData.prandtl[i0],
    };
  }

  // Interpolation linéaire
  const T0 = T_grid[i0];
  const T1 = T_grid[i1];

  const rho = lerp(T_C, T0, T1, airData.density_kg_m3[i0], airData.density_kg_m3[i1]);
  const mu = lerp(T_C, T0, T1, airData.viscosity_Pa_s[i0], airData.viscosity_Pa_s[i1]);
  const k = lerp(
    T_C,
    T0,
    T1,
    airData.thermal_conductivity_W_m_K[i0],
    airData.thermal_conductivity_W_m_K[i1]
  );
  const cp = lerp(T_C, T0, T1, airData.specific_heat_J_kg_K[i0], airData.specific_heat_J_kg_K[i1]);
  const Pr = lerp(T_C, T0, T1, airData.prandtl[i0], airData.prandtl[i1]);

  return { rho, mu, k, cp, Pr };
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.AirProperties = {
    getAirProperties,
    AIR_T_MIN,
    AIR_T_MAX,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAirProperties,
    AIR_T_MIN,
    AIR_T_MAX,
  };
}
