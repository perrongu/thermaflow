/**
 * Calcule la résistance de convection pour une surface cylindrique.
 *
 * R_conv = 1 / (h × A)
 *
 * où A = π × D × L pour un cylindre
 *
 * @param {number} h - Coefficient de convection [W/(m²·K)]
 * @param {number} D - Diamètre [m]
 * @param {number} L - Longueur [m]
 * @returns {number} Résistance thermique de convection [K/W]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Convection interne eau, h=800 W/(m²·K), D=0.05m, L=1m
 * const R = convectionResistanceCylinder(800, 0.05, 1.0);
 * // R ≈ 0.0080 K/W
 */
function convectionResistanceCylinder(h, D, L) {
  // Validation
  if (typeof h !== 'number' || !isFinite(h) || h <= 0) {
    throw new Error(`Coefficient de convection invalide: ${h}`);
  }
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  if (typeof L !== 'number' || !isFinite(L) || L <= 0) {
    throw new Error(`Longueur invalide: ${L}`);
  }

  // Aire de la surface cylindrique
  const A = Math.PI * D * L;

  // Résistance de convection
  const R = 1.0 / (h * A);

  return R;
}

/**
 * Calcule la résistance de conduction pour une couche cylindrique.
 *
 * Pour un cylindre creux (conduite avec épaisseur de paroi):
 * R_cond = ln(r_outer / r_inner) / (2π × k × L)
 *
 * @param {number} r_inner - Rayon intérieur [m]
 * @param {number} r_outer - Rayon extérieur [m]
 * @param {number} k - Conductivité thermique [W/(m·K)]
 * @param {number} L - Longueur [m]
 * @returns {number} Résistance thermique de conduction [K/W]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Paroi acier: r_i=25mm, r_o=27mm, k=50.2 W/(m·K), L=1m
 * const R = conductionResistanceCylinder(0.025, 0.027, 50.2, 1.0);
 * // R ≈ 0.00025 K/W (très faible - bon conducteur)
 */
function conductionResistanceCylinder(r_inner, r_outer, k, L) {
  // Validation
  if (typeof r_inner !== 'number' || !isFinite(r_inner) || r_inner <= 0) {
    throw new Error(`Rayon intérieur invalide: ${r_inner}`);
  }
  if (typeof r_outer !== 'number' || !isFinite(r_outer) || r_outer <= r_inner) {
    throw new Error(`Rayon extérieur invalide: ${r_outer} (doit être > ${r_inner})`);
  }
  if (typeof k !== 'number' || !isFinite(k) || k <= 0) {
    throw new Error(`Conductivité thermique invalide: ${k}`);
  }
  if (typeof L !== 'number' || !isFinite(L) || L <= 0) {
    throw new Error(`Longueur invalide: ${L}`);
  }

  // Résistance de conduction cylindrique
  const R = Math.log(r_outer / r_inner) / (2 * Math.PI * k * L);

  return R;
}

/**
 * Calcule la résistance thermique totale pour résistances en série.
 *
 * R_total = R1 + R2 + R3 + ...
 *
 * @param {Array<number>} resistances - Tableau de résistances [K/W]
 * @returns {number} Résistance totale [K/W]
 * @throws {Error} Si les résistances sont invalides
 *
 * @example
 * const R_total = totalResistanceSeries([0.008, 0.0003, 0.1, 0.05]);
 * // R_total = 0.1583 K/W
 */
function totalResistanceSeries(resistances) {
  if (!Array.isArray(resistances)) {
    throw new Error('Les résistances doivent être un tableau');
  }
  if (resistances.length === 0) {
    throw new Error('Le tableau de résistances est vide');
  }

  let R_total = 0;
  for (let i = 0; i < resistances.length; i++) {
    const R = resistances[i];
    if (typeof R !== 'number' || !isFinite(R) || R < 0) {
      throw new Error(`Résistance invalide à l'index ${i}: ${R}`);
    }
    R_total += R;
  }

  return R_total;
}

/**
 * Calcule le flux thermique à travers une résistance thermique.
 *
 * Q = ΔT / R = (T_hot - T_cold) / R
 *
 * @param {number} T_hot - Température côté chaud [K ou °C]
 * @param {number} T_cold - Température côté froid [K ou °C]
 * @param {number} R - Résistance thermique [K/W]
 * @returns {number} Flux thermique [W]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // T_int=60°C, T_ext=-10°C, R_total=0.16 K/W
 * const Q = heatFlux(60, -10, 0.16);
 * // Q ≈ 438 W (perte de chaleur)
 */
function heatFlux(T_hot, T_cold, R) {
  if (typeof T_hot !== 'number' || !isFinite(T_hot)) {
    throw new Error(`Température chaude invalide: ${T_hot}`);
  }
  if (typeof T_cold !== 'number' || !isFinite(T_cold)) {
    throw new Error(`Température froide invalide: ${T_cold}`);
  }
  if (typeof R !== 'number' || !isFinite(R) || R <= 0) {
    throw new Error(`Résistance thermique invalide: ${R}`);
  }

  const delta_T = T_hot - T_cold;
  const Q = delta_T / R;

  return Q;
}

/**
 * Calcule le coefficient de transfert thermique global (UA).
 *
 * UA = 1 / R_total
 *
 * où U est le coefficient global [W/(m²·K)] et A l'aire [m²]
 *
 * @param {number} R_total - Résistance thermique totale [K/W]
 * @returns {number} Coefficient UA [W/K]
 * @throws {Error} Si la résistance est invalide
 *
 * @example
 * const UA = overallHeatTransferCoefficient(0.16);
 * // UA = 6.25 W/K
 */
function overallHeatTransferCoefficient(R_total) {
  if (typeof R_total !== 'number' || !isFinite(R_total) || R_total <= 0) {
    throw new Error(`Résistance thermique invalide: ${R_total}`);
  }

  return 1.0 / R_total;
}

/**
 * @typedef {Object} PipeLayerConfig
 * @property {string} type - Type de couche: 'convection' ou 'conduction'
 * @property {number} [h] - Coefficient de convection [W/(m²·K)] (si type='convection')
 * @property {number} [r_inner] - Rayon intérieur [m] (si type='conduction')
 * @property {number} [r_outer] - Rayon extérieur [m] (si type='conduction')
 * @property {number} [k] - Conductivité thermique [W/(m·K)] (si type='conduction')
 * @property {number} D - Diamètre [m] (si type='convection')
 * @property {string} [name] - Nom descriptif de la couche
 */

/**
 * Calcule la résistance thermique totale d'une conduite multicouche.
 *
 * Configuration typique:
 * 1. Convection interne (fluide → paroi)
 * 2. Conduction paroi métallique
 * 3. Conduction isolation (optionnel)
 * 4. Convection externe (paroi → air)
 *
 * @param {Array<PipeLayerConfig>} layers - Configuration des couches
 * @param {number} L - Longueur de la conduite [m]
 * @returns {Object} {R_total, R_layers, layer_details}
 *
 * @example
 * const config = [
 *   { type: 'convection', h: 800, D: 0.050, name: 'eau_interne' },
 *   { type: 'conduction', r_inner: 0.025, r_outer: 0.027, k: 50.2, name: 'paroi_acier' },
 *   { type: 'conduction', r_inner: 0.027, r_outer: 0.047, k: 0.04, name: 'isolation' },
 *   { type: 'convection', h: 20, D: 0.094, name: 'air_externe' }
 * ];
 * const result = pipeResistance(config, 1.0);
 * console.log(result.R_total);  // Résistance totale en K/W
 */
function pipeResistance(layers, L) {
  if (!Array.isArray(layers)) {
    throw new Error('Les couches doivent être un tableau');
  }
  if (typeof L !== 'number' || !isFinite(L) || L <= 0) {
    throw new Error(`Longueur invalide: ${L}`);
  }

  const R_layers = [];
  const layer_details = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    let R;

    if (layer.type === 'convection') {
      if (!layer.h || !layer.D) {
        throw new Error(`Couche ${i}: convection nécessite h et D`);
      }
      R = convectionResistanceCylinder(layer.h, layer.D, L);
      layer_details.push({
        index: i,
        name: layer.name || `convection_${i}`,
        type: 'convection',
        h: layer.h,
        D: layer.D,
        R: R,
      });
    } else if (layer.type === 'conduction') {
      if (!layer.r_inner || !layer.r_outer || !layer.k) {
        throw new Error(`Couche ${i}: conduction nécessite r_inner, r_outer et k`);
      }
      R = conductionResistanceCylinder(layer.r_inner, layer.r_outer, layer.k, L);
      layer_details.push({
        index: i,
        name: layer.name || `conduction_${i}`,
        type: 'conduction',
        r_inner: layer.r_inner,
        r_outer: layer.r_outer,
        k: layer.k,
        R: R,
      });
    } else {
      throw new Error(`Type de couche inconnu: ${layer.type}`);
    }

    R_layers.push(R);
  }

  const R_total = totalResistanceSeries(R_layers);

  return {
    R_total,
    R_layers,
    layer_details,
  };
}

/**
 * Calcule la distribution de température à travers les couches.
 *
 * Pour chaque interface entre couches, calcule la température
 * en utilisant le principe de division de résistance.
 *
 * @param {number} T_inner - Température interne [K ou °C]
 * @param {number} T_outer - Température externe [K ou °C]
 * @param {Array<number>} R_layers - Résistances des couches [K/W]
 * @returns {Array<number>} Températures aux interfaces [K ou °C]
 *
 * @example
 * const T_interfaces = temperatureProfile(60, -10, [0.008, 0.0003, 0.1, 0.05]);
 * // [60, 56.5, 56.4, 12.0, -10] - températures aux 5 interfaces
 */
function temperatureProfile(T_inner, T_outer, R_layers) {
  if (typeof T_inner !== 'number' || !isFinite(T_inner)) {
    throw new Error(`Température interne invalide: ${T_inner}`);
  }
  if (typeof T_outer !== 'number' || !isFinite(T_outer)) {
    throw new Error(`Température externe invalide: ${T_outer}`);
  }
  if (!Array.isArray(R_layers)) {
    throw new Error('R_layers doit être un tableau');
  }

  const R_total = totalResistanceSeries(R_layers);
  const Q = heatFlux(T_inner, T_outer, R_total);

  const temperatures = [T_inner];
  let T_current = T_inner;

  for (let i = 0; i < R_layers.length; i++) {
    const delta_T = Q * R_layers[i];
    T_current = T_current - delta_T;
    temperatures.push(T_current);
  }

  return temperatures;
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.ThermalResistance = {
    convectionResistanceCylinder,
    conductionResistanceCylinder,
    totalResistanceSeries,
    heatFlux,
    overallHeatTransferCoefficient,
    pipeResistance,
    temperatureProfile,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convectionResistanceCylinder,
    conductionResistanceCylinder,
    totalResistanceSeries,
    heatFlux,
    overallHeatTransferCoefficient,
    pipeResistance,
    temperatureProfile,
  };
}
