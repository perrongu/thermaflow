/**
 * @typedef {Object} NetworkConfig
 * @property {Object} geometry - Géométrie de la conduite
 * @property {number} geometry.D_inner - Diamètre intérieur [m]
 * @property {number} geometry.D_outer - Diamètre extérieur [m]
 * @property {number} geometry.roughness - Rugosité absolue [m]
 * @property {string} geometry.material - Matériau conduite
 * @property {number} totalLength - Longueur totale [m]
 * @property {number} numSegments - Nombre de segments
 * @property {Object} fluid - Conditions fluide initiales
 * @property {number} fluid.T_in - Température entrée [°C]
 * @property {number} fluid.P - Pression [bar]
 * @property {number} fluid.m_dot - Débit massique [kg/s]
 * @property {Object} ambient - Conditions ambiantes
 * @property {number} ambient.T_amb - Température ambiante [°C]
 * @property {number} ambient.V_wind - Vitesse vent [m/s]
 * @property {Object|null} insulation - Isolation optionnelle
 * @property {string} [insulation.material] - Matériau isolation
 * @property {number} [insulation.thickness] - Épaisseur [m]
 */

/**
 * @typedef {Object} NetworkResult
 * @property {Array<number>} T_profile - Températures [°C] (N+1 valeurs: entrée + N sorties)
 * @property {Array<number>} x_profile - Positions [m] (N+1 valeurs)
 * @property {Array<number>} P_profile - Pressions [bar] (N+1 valeurs)
 * @property {number} T_final - Température finale [°C]
 * @property {number} dP_total - Perte charge totale [Pa]
 * @property {number} Q_loss_total - Perte thermique totale [W]
 * @property {number} minTemp - Température minimale atteinte [°C]
 * @property {number} minTempPosition - Position de la température minimale [m]
 * @property {Array<Object>} segmentResults - Résultats détaillés par segment
 */

/**
 * Calcule le réseau de conduites (propagation sur N segments).
 *
 * Divise la conduite totale en N segments et calcule chaque segment séquentiellement.
 * La température de sortie d'un segment devient l'entrée du suivant.
 *
 * @param {NetworkConfig} config - Configuration du réseau
 * @returns {NetworkResult} Résultats complets
 * @throws {Error} Si la configuration est invalide
 *
 * @example
 * const config = {
 *   geometry: {
 *     D_inner: 0.0525,
 *     D_outer: 0.0603,
 *     roughness: 0.045e-3,
 *     material: 'steel'
 *   },
 *   totalLength: 100,
 *   numSegments: 20,
 *   fluid: { T_in: 60, P: 3.0, m_dot: 2.0 },
 *   ambient: { T_amb: -10, V_wind: 5.0 },
 *   insulation: { material: 'fiberglass', thickness: 0.020 }
 * };
 *
 * const result = calculatePipeNetwork(config);
 * console.log(`T_final = ${result.T_final}°C`);
 * console.log(`Min temp = ${result.minTemp}°C at ${result.minTempPosition}m`);
 */
function calculatePipeNetwork(config) {
  // ========== VALIDATION ==========

  if (!config || typeof config !== 'object') {
    throw new Error('Configuration invalide');
  }

  if (!config.geometry || typeof config.geometry !== 'object') {
    throw new Error('Géométrie invalide');
  }

  if (typeof config.totalLength !== 'number' || config.totalLength <= 0) {
    throw new Error(`Longueur totale invalide: ${config.totalLength}`);
  }

  if (
    typeof config.numSegments !== 'number' ||
    config.numSegments < 1 ||
    !Number.isInteger(config.numSegments)
  ) {
    throw new Error(`Nombre de segments invalide: ${config.numSegments}`);
  }

  if (!config.fluid || typeof config.fluid !== 'object') {
    throw new Error('Conditions fluide invalides');
  }

  if (!config.ambient || typeof config.ambient !== 'object') {
    throw new Error('Conditions ambiantes invalides');
  }

  // ========== MODULE NÉCESSAIRE ==========
  const pipeSegment =
    typeof window !== 'undefined'
      ? window.PipeSegment || { calculatePipeSegment: window.calculatePipeSegment }
      : require('./pipe-segment.js');

  // ========== INITIALISATION ==========

  const segmentLength = config.totalLength / config.numSegments;

  // Géométrie du segment
  const segmentGeometry = {
    D_inner: config.geometry.D_inner,
    D_outer: config.geometry.D_outer,
    roughness: config.geometry.roughness,
    length: segmentLength,
    material: config.geometry.material,
  };

  // Profils (N+1 points: entrée + N sorties de segments)
  const T_profile = [config.fluid.T_in];
  const x_profile = [0];
  const P_profile = [config.fluid.P];

  // Accumulateurs
  let dP_total = 0;
  let Q_loss_total = 0;
  const segmentResults = [];

  // Variables de suivi
  let minTemp = config.fluid.T_in;
  let minTempPosition = 0;
  let frozenConditionReached = false;
  let frozenAtPosition = null;

  // Conditions actuelles du fluide
  let currentFluid = {
    T_in: config.fluid.T_in,
    P: config.fluid.P,
    m_dot: config.fluid.m_dot,
  };

  // ========== BOUCLE SUR LES SEGMENTS ==========

  for (let i = 0; i < config.numSegments; i++) {
    // Position du segment
    const x_start = i * segmentLength;
    const x_end = (i + 1) * segmentLength;

    // Calcul du segment avec gestion du gel
    let segmentResult;
    let frozenDetected = false;

    try {
      segmentResult = pipeSegment.calculatePipeSegment(
        segmentGeometry,
        currentFluid,
        config.ambient,
        config.insulation
      );

      // Vérifier si la température de sortie atteint le point de gel
      if (segmentResult.T_out <= 0) {
        // Condition de gel détectée - figer à 0°C
        segmentResult.T_out = 0.0;
        frozenDetected = true;
      }
    } catch (error) {
      // Si l'erreur est due à une température hors plage négative, c'est du gel
      if (
        error.message &&
        error.message.includes('Température hors plage') &&
        currentFluid.T_in <= 0
      ) {
        // Condition de gel - retourner un résultat figé à 0°C
        segmentResult = {
          T_out: 0.0,
          dP: 0,
          Q_loss: 0,
          Re: 0,
          regime: 'frozen',
        };
        frozenDetected = true;
      } else {
        // Autre type d'erreur - propager
        throw error;
      }
    }

    // Enregistrer le résultat du segment
    segmentResults.push({
      index: i,
      x_start: x_start,
      x_end: x_end,
      T_in: currentFluid.T_in,
      T_out: segmentResult.T_out,
      dP: segmentResult.dP,
      Q_loss: segmentResult.Q_loss,
      Re: segmentResult.Re,
      regime: segmentResult.regime,
      frozen: frozenDetected,
    });

    // Marquer si le gel est atteint
    if (frozenDetected && !frozenConditionReached) {
      frozenConditionReached = true;
      frozenAtPosition = x_end;
    }

    // Mettre à jour les profils
    T_profile.push(segmentResult.T_out);
    x_profile.push(x_end);

    // Pression diminue (perte de charge)
    const P_new = currentFluid.P - segmentResult.dP / 1e5; // Conversion Pa → bar
    P_profile.push(P_new);

    // Vérifier si la pression devient négative
    if (P_new <= 0) {
      const P_new_kPa = (P_new * 100).toFixed(1); // bar → kPa
      const dP_cumul_kPa = (dP_total / 1000).toFixed(1);
      const P_init_kPa = (config.fluid.P * 100).toFixed(0); // bar → kPa
      throw new Error(
        `Perte de charge excessive: la pression est tombée à ${P_new_kPa} kPa au segment ${i + 1}/${config.numSegments}. ` +
          `Perte cumulée: ${dP_cumul_kPa} kPa pour une pression initiale de ${P_init_kPa} kPa.`
      );
    }

    // Accumuler les pertes
    dP_total += segmentResult.dP;
    Q_loss_total += segmentResult.Q_loss;

    // Suivre température minimale
    if (segmentResult.T_out < minTemp) {
      minTemp = segmentResult.T_out;
      minTempPosition = x_end;
    }

    // Préparer conditions pour segment suivant
    currentFluid = {
      T_in: segmentResult.T_out, // T_out devient T_in du prochain segment
      P: P_new,
      m_dot: config.fluid.m_dot, // Débit constant (écoulement incompressible)
    };
  }

  // ========== RÉSULTATS ==========

  return {
    // Profils complets
    T_profile: T_profile,
    x_profile: x_profile,
    P_profile: P_profile,

    // Valeurs finales
    T_final: T_profile[T_profile.length - 1],
    dP_total: dP_total,
    Q_loss_total: Q_loss_total,

    // Statistiques
    minTemp: minTemp,
    minTempPosition: minTempPosition,

    // Condition de gel
    frozenCondition: frozenConditionReached,
    frozenAtPosition: frozenAtPosition,

    // Détails
    segmentResults: segmentResults,
  };
}

/**
 * Fonction helper: Trouve l'index du segment à une position donnée.
 *
 * @param {Array<number>} x_profile - Profil des positions [m]
 * @param {number} x - Position recherchée [m]
 * @returns {number} Index du segment (0 à N-1)
 */
function findSegmentAtPosition(x_profile, x) {
  for (let i = 0; i < x_profile.length - 1; i++) {
    if (x >= x_profile[i] && x <= x_profile[i + 1]) {
      return i;
    }
  }
  return x_profile.length - 2; // Dernier segment
}

/**
 * Fonction helper: Interpole la température à une position donnée.
 *
 * @param {Array<number>} x_profile - Profil des positions [m]
 * @param {Array<number>} T_profile - Profil des températures [°C]
 * @param {number} x - Position recherchée [m]
 * @returns {number} Température interpolée [°C]
 * @throws {Error} Si x est hors plage
 */
function interpolateTemperature(x_profile, T_profile, x) {
  if (x < x_profile[0] || x > x_profile[x_profile.length - 1]) {
    throw new Error(
      `Position hors plage: ${x} (plage: ${x_profile[0]}-${x_profile[x_profile.length - 1]})`
    );
  }

  // Trouver les deux points encadrant x
  for (let i = 0; i < x_profile.length - 1; i++) {
    if (x >= x_profile[i] && x <= x_profile[i + 1]) {
      // Interpolation linéaire
      const x1 = x_profile[i];
      const x2 = x_profile[i + 1];
      const T1 = T_profile[i];
      const T2 = T_profile[i + 1];

      if (x2 === x1) {
        return T1;
      } // Éviter division par zéro

      const T = T1 + ((T2 - T1) * (x - x1)) / (x2 - x1);
      return T;
    }
  }

  return T_profile[T_profile.length - 1];
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.calculatePipeNetwork = calculatePipeNetwork;
  window.findSegmentAtPosition = findSegmentAtPosition;
  window.interpolateTemperature = interpolateTemperature;
}

// Export conditionnel pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculatePipeNetwork,
    findSegmentAtPosition,
    interpolateTemperature,
  };
}
