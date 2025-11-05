/**
 * @typedef {Object} SegmentGeometry
 * @property {number} D_inner - Diamètre intérieur [m]
 * @property {number} D_outer - Diamètre extérieur [m]
 * @property {number} roughness - Rugosité absolue [m]
 * @property {number} length - Longueur du segment [m]
 * @property {string} material - Nom du matériau (ex: 'steel', 'copper')
 */

/**
 * @typedef {Object} FluidConditions
 * @property {number} T_in - Température d'entrée [°C]
 * @property {number} P - Pression [bar]
 * @property {number} m_dot - Débit massique [kg/s]
 */

/**
 * @typedef {Object} AmbientConditions
 * @property {number} T_amb - Température ambiante [°C]
 * @property {number} V_wind - Vitesse du vent [m/s]
 */

/**
 * @typedef {Object} InsulationConfig
 * @property {string} material - Matériau d'isolation (ex: 'fiberglass', 'foam')
 * @property {number} thickness - Épaisseur [m]
 */

/**
 * @typedef {Object} SegmentResult
 * @property {number} T_out - Température de sortie [°C]
 * @property {number} dP - Perte de charge [Pa]
 * @property {number} Q_loss - Perte thermique [W]
 * @property {number} h_int - Coefficient convection interne [W/(m²·K)]
 * @property {number} h_ext - Coefficient transfert externe total [W/(m²·K)]
 * @property {number} U - Coefficient transfert global [W/(m²·K)]
 * @property {number} NTU - Nombre d'unités de transfert [-]
 * @property {number} Re - Nombre de Reynolds [-]
 * @property {number} f - Facteur de friction [-]
 * @property {number} V - Vitesse d'écoulement [m/s]
 * @property {string} regime - Régime d'écoulement
 * @property {number} R_total - Résistance thermique totale [K/W]
 */

/**
 * Calcule un segment de conduite avec tous les transferts thermiques et hydrauliques.
 *
 * VERSION v1.2: Implémente itération sur T_moy pour améliorer précision des propriétés fluides.
 *
 * L'algorithme itère sur la température moyenne pour affiner les propriétés:
 * - Itération 1: Propriétés à T_in (estimation initiale)
 * - Itération 2+: Propriétés à T_moy = (T_in + T_out)/2 (amélioré)
 *
 * Impact précision (par rapport à T_in seul):
 * - ΔT < 10K: Négligeable (< 1%)
 * - ΔT = 20K: +3-5%
 * - ΔT = 40K: +8-10%
 * - ΔT > 60K: +10-15%
 *
 * Recommandation: 2 itérations suffisent (convergence < 1% supplémentaire avec plus).
 *
 * @param {SegmentGeometry} geometry - Géométrie de la conduite
 * @param {FluidConditions} fluid - Conditions du fluide (eau)
 * @param {AmbientConditions} ambient - Conditions ambiantes (air)
 * @param {InsulationConfig} [insulation=null] - Isolation optionnelle
 * @param {number} [iterations=2] - Nombre d'itérations T_moy (1-5, défaut 2)
 * @returns {SegmentResult} Résultats du calcul
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const geometry = {
 *   D_inner: 0.0525,
 *   D_outer: 0.0603,
 *   roughness: 0.045e-3,
 *   length: 10,
 *   material: 'steel'
 * };
 * const fluid = { T_in: 60, P: 3.0, m_dot: 2.0 };
 * const ambient = { T_amb: -10, V_wind: 5.0 };
 * const insulation = { material: 'fiberglass', thickness: 0.020 };
 *
 * // Défaut (2 itérations, optimal)
 * const result = calculatePipeSegment(geometry, fluid, ambient, insulation);
 *
 * // Précision maximale (5 itérations, +0.5% vs 2 itérations)
 * const resultMax = calculatePipeSegment(geometry, fluid, ambient, insulation, 5);
 *
 * // Backward compatible (1 itération = comportement v1.0-1.1)
 * const resultV1 = calculatePipeSegment(geometry, fluid, ambient, insulation, 1);
 *
 * console.log(`T_out = ${result.T_out}°C, Q_loss = ${result.Q_loss}W`);
 */
function calculatePipeSegment(geometry, fluid, ambient, insulation = null, iterations = 2) {
  // ========== VALIDATION DES ENTRÉES ==========

  // Géométrie
  if (!geometry || typeof geometry !== 'object') {
    throw new Error('Géométrie invalide');
  }
  if (typeof geometry.D_inner !== 'number' || geometry.D_inner <= 0) {
    throw new Error(`Diamètre intérieur invalide: ${geometry.D_inner}`);
  }
  if (typeof geometry.D_outer !== 'number' || geometry.D_outer <= geometry.D_inner) {
    throw new Error(`Diamètre extérieur invalide: ${geometry.D_outer}`);
  }
  if (typeof geometry.roughness !== 'number' || geometry.roughness < 0) {
    throw new Error(`Rugosité invalide: ${geometry.roughness}`);
  }
  if (typeof geometry.length !== 'number' || geometry.length <= 0) {
    throw new Error(`Longueur invalide: ${geometry.length}`);
  }
  if (typeof geometry.material !== 'string' || geometry.material.length === 0) {
    throw new Error(`Matériau invalide: ${geometry.material}`);
  }

  // Fluide
  if (!fluid || typeof fluid !== 'object') {
    throw new Error('Conditions fluide invalides');
  }
  if (typeof fluid.T_in !== 'number' || !isFinite(fluid.T_in)) {
    throw new Error(`Température entrée invalide: ${fluid.T_in}`);
  }
  if (typeof fluid.P !== 'number' || fluid.P <= 0) {
    throw new Error(`Pression invalide: ${fluid.P}`);
  }
  if (typeof fluid.m_dot !== 'number' || fluid.m_dot <= 0) {
    throw new Error(`Débit massique invalide: ${fluid.m_dot}`);
  }

  // Ambiant
  if (!ambient || typeof ambient !== 'object') {
    throw new Error('Conditions ambiantes invalides');
  }
  if (typeof ambient.T_amb !== 'number' || !isFinite(ambient.T_amb)) {
    throw new Error(`Température ambiante invalide: ${ambient.T_amb}`);
  }
  if (typeof ambient.V_wind !== 'number' || ambient.V_wind < 0) {
    throw new Error(`Vitesse vent invalide: ${ambient.V_wind}`);
  }

  // Isolation (optionnelle)
  if (insulation !== null) {
    if (typeof insulation !== 'object') {
      throw new Error('Configuration isolation invalide');
    }
    if (typeof insulation.material !== 'string' || insulation.material.length === 0) {
      throw new Error(`Matériau isolation invalide: ${insulation.material}`);
    }
    if (typeof insulation.thickness !== 'number' || insulation.thickness <= 0) {
      throw new Error(`Épaisseur isolation invalide: ${insulation.thickness}`);
    }
  }

  // Iterations (validation v1.2)
  if (
    typeof iterations !== 'number' ||
    !isFinite(iterations) ||
    iterations < 1 ||
    iterations > 10
  ) {
    throw new Error(`Nombre d'itérations invalide: ${iterations} (doit être entre 1 et 10)`);
  }
  if (!Number.isInteger(iterations)) {
    throw new Error(`Nombre d'itérations doit être entier: ${iterations}`);
  }

  // ========== MODULES NÉCESSAIRES ==========
  // Note: En production browser, ces modules sont chargés via <script> tags
  // Pour les tests Node.js, ils sont chargés via require dans le wrapper

  const waterProps =
    typeof window !== 'undefined'
      ? window.WaterProperties
      : require('../properties/water-properties.js');
  const airProps =
    typeof window !== 'undefined'
      ? window.AirProperties
      : require('../properties/air-properties.js');
  const materials =
    typeof window !== 'undefined'
      ? window.MaterialProperties
      : require('../properties/material-properties.js');
  const reynolds =
    typeof window !== 'undefined' ? window.Reynolds : require('../formulas/reynolds.js');
  const geom = typeof window !== 'undefined' ? window.Geometry : require('../formulas/geometry.js');
  const pressureBasic =
    typeof window !== 'undefined' ? window.PressureBasic : require('../formulas/pressure-basic.js');
  const friction =
    typeof window !== 'undefined'
      ? window.FrictionFactor
      : require('../correlations/friction-factor.js');
  const nusseltInt =
    typeof window !== 'undefined'
      ? window.NusseltInternal
      : require('../correlations/nusselt-internal.js');
  const nusseltExt =
    typeof window !== 'undefined'
      ? window.NusseltExternal
      : require('../correlations/nusselt-external.js');
  const radiation =
    typeof window !== 'undefined' ? window.Radiation : require('../correlations/radiation.js');
  const resistance =
    typeof window !== 'undefined'
      ? window.ThermalResistance
      : require('../calculations/thermal-resistance.js');
  const heatTransfer =
    typeof window !== 'undefined'
      ? window.HeatTransfer
      : require('../calculations/heat-transfer.js');

  // ========== ITÉRATION T_moy (v1.2) ==========
  // Améliore précision en recalculant propriétés à température moyenne

  // Initialisation selon mode:
  // - iterations=1 (v1.0-1.1): T_out_guess non utilisé (T_avg = T_in toujours)
  // - iterations≥2 (v1.2): T_out_guess = estimation grossière pour démarrer itération
  // Clamp à 0°C pour éviter températures négatives (gel)
  let T_out_guess = iterations === 1 ? fluid.T_in : Math.max(0, (fluid.T_in + ambient.T_amb) / 2);
  let result; // Résultat final (dernière itération)

  for (let iter = 0; iter < iterations; iter++) {
    // Température pour évaluer les propriétés fluides
    // Si iterations=1 (backward compatible v1.0-1.1): T_avg = T_in
    // Si iterations≥2: T_avg = (T_in + T_out_guess)/2 avec itération
    let T_avg;
    if (iterations === 1) {
      T_avg = fluid.T_in; // Comportement v1.0-1.1 (pas d'itération)
    } else {
      T_avg = (fluid.T_in + T_out_guess) / 2; // Itération v1.2
    }

    // Clamp T_avg à 0°C minimum pour éviter erreur dans getWaterProperties
    // (permet à la détection de gel dans pipe-network.js de gérer le cas)
    T_avg = Math.max(0, T_avg);

    // ========== ÉTAPE 1: PROPRIÉTÉS DES FLUIDES ==========
    // v1.2: Propriétés à T_avg (itération 2+) au lieu de T_in (itération 1)
    const water = waterProps.getWaterProperties(T_avg, fluid.P);
    const air = airProps.getAirProperties(ambient.T_amb);

    // ========== ÉTAPE 2: HYDRAULIQUE ==========

    // Vitesse d'écoulement
    const Q = fluid.m_dot / water.rho; // Débit volumique [m³/s]
    const V = geom.velocityFromFlowrate(Q, geometry.D_inner);

    // Nombre de Reynolds
    const Re = reynolds.calculateReynolds(water.rho, V, geometry.D_inner, water.mu);
    const regime = reynolds.getFlowRegime(Re);

    // Facteur de friction
    const epsilon_D = geometry.roughness / geometry.D_inner;
    const f = friction.frictionFactor(Re, epsilon_D, 'churchill');

    // Perte de charge
    const dP = pressureBasic.pressureDropDarcy(f, geometry.length, geometry.D_inner, water.rho, V);

    // ========== ÉTAPE 3: TRANSFERT THERMIQUE ==========

    // Nombre de Prandtl eau
    const Pr_water = (water.mu * water.cp) / water.k;

    // Convection interne (eau → paroi)
    const Nu_int = nusseltInt.nusseltInternal(Re, Pr_water, geometry.D_inner, geometry.length);
    const h_int = nusseltInt.convectionCoefficient(Nu_int, water.k, geometry.D_inner);

    // Diamètre extérieur final (avec isolation si présente)
    const D_outer_final = insulation
      ? geometry.D_outer + 2 * insulation.thickness
      : geometry.D_outer;

    // Convection externe (paroi → air)
    let Nu_ext;
    let h_conv_ext;

    if (ambient.V_wind > 0.1) {
      // Convection forcée (vent)
      const Re_air = reynolds.calculateReynolds(air.rho, ambient.V_wind, D_outer_final, air.mu);
      Nu_ext = nusseltExt.nusseltChurchillBernstein(Re_air, air.Pr);
      h_conv_ext = nusseltInt.convectionCoefficient(Nu_ext, air.k, D_outer_final);
    } else {
      // Convection naturelle (pas de vent)
      const g = 9.81; // m/s² (gravité)
      const T_surf_estimate = (fluid.T_in + ambient.T_amb) / 2; // Estimation grossière
      const T_film = (T_surf_estimate + ambient.T_amb) / 2; // Température film pour propriétés
      const T_film_K = T_film + 273.15; // Conversion en Kelvin
      const beta = 1.0 / T_film_K; // Coefficient d'expansion pour gaz parfait [1/K]
      const delta_T = Math.abs(T_surf_estimate - ambient.T_amb);
      const nu = air.mu / air.rho; // Viscosité cinématique [m²/s]

      const Ra = nusseltExt.calculateRayleigh(g, beta, delta_T, D_outer_final, nu, air.Pr);
      Nu_ext = nusseltExt.nusseltNaturalConvectionCylinder(Ra, air.Pr);
      h_conv_ext = nusseltInt.convectionCoefficient(Nu_ext, air.k, D_outer_final);
    }

    // Rayonnement
    const pipeMat = materials.getMaterialProperties(geometry.material);
    const h_rad = radiation.radiationCoefficientSimple(
      fluid.T_in,
      ambient.T_amb,
      pipeMat.emissivity
    );
    const h_ext_total = radiation.totalHeatTransferCoefficient(h_conv_ext, h_rad);

    // ========== ÉTAPE 4: RÉSISTANCES THERMIQUES ==========

    const layers = [
      {
        type: 'convection',
        h: h_int,
        D: geometry.D_inner,
        name: 'Convection interne',
      },
      {
        type: 'conduction',
        r_inner: geometry.D_inner / 2,
        r_outer: geometry.D_outer / 2,
        k: pipeMat.k,
        name: 'Paroi',
      },
    ];

    // Ajouter isolation si présente
    if (insulation) {
      const insulMat = materials.getMaterialProperties(insulation.material);
      layers.push({
        type: 'conduction',
        r_inner: geometry.D_outer / 2,
        r_outer: D_outer_final / 2,
        k: insulMat.k,
        name: 'Isolation',
      });
    }

    // Convection externe
    layers.push({
      type: 'convection',
      h: h_ext_total,
      D: D_outer_final,
      name: 'Convection externe + rayonnement',
    });

    const thermalRes = resistance.pipeResistance(layers, geometry.length);
    const R_total = thermalRes.R_total;
    const UA = resistance.overallHeatTransferCoefficient(R_total);

    // ========== ÉTAPE 5: TEMPÉRATURE DE SORTIE (NTU) ==========

    const T_out = heatTransfer.calculateOutletTemperature(
      fluid.T_in,
      ambient.T_amb,
      fluid.m_dot,
      water.cp,
      UA
    );

    const Q_loss = heatTransfer.heatLossRate(fluid.m_dot, water.cp, fluid.T_in, T_out);

    // NTU
    const NTU = heatTransfer.calculateNTU(UA, fluid.m_dot, water.cp);

    // Coefficient U basé sur surface extérieure
    const A_outer = Math.PI * D_outer_final * geometry.length;
    const U = UA / A_outer;

    // ========== STOCKAGE RÉSULTATS ITÉRATION ==========

    result = {
      // Résultats principaux
      T_out: T_out,
      dP: dP,
      Q_loss: Q_loss,

      // Coefficients thermiques
      h_int: h_int,
      h_ext: h_ext_total,
      U: U,
      NTU: NTU,

      // Hydraulique
      Re: Re,
      f: f,
      V: V,
      regime: regime,

      // Résistance
      R_total: R_total,
    };

    // Mise à jour T_out_guess pour itération suivante
    // Clamp à 0°C pour éviter températures négatives dans itération suivante
    T_out_guess = Math.max(0, T_out);
  } // Fin boucle itération

  // ========== RETOUR RÉSULTAT FINAL ==========
  return result;
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.PipeSegment = {
    calculatePipeSegment,
  };
}

// Export conditionnel pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculatePipeSegment,
  };
}
