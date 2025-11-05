/**
 * @typedef {Object} FreezeAnalysis
 * @property {boolean} freezeDetected - true si gel détecté
 * @property {number|null} freezePosition - Position du gel [m] (null si pas de gel)
 * @property {number} minTemp - Température minimale atteinte [°C]
 * @property {number} minTempPosition - Position de la température minimale [m]
 * @property {number} T_freeze - Température de gel utilisée [°C]
 * @property {number} marginToFreeze - Marge avant gel [°C] (minTemp - T_freeze)
 * @property {string} verdict - Verdict textuel: 'NO_FREEZE' ou 'FREEZE_DETECTED'
 * @property {string} severity - Niveau de sévérité: 'ok' | 'warning' | 'critical'
 * @property {number} marginToSafety - Marge avant seuil de sécurité (5°C) [°C]
 * @property {Array<string>} recommendations - Recommandations textuelles
 */

/**
 * Détecte si le gel se produit dans le profil de température.
 *
 * Analyse un profil T(x) et détermine si la température descend en-dessous
 * de la température de gel (par défaut 0°C pour l'eau pure).
 *
 * Si le gel est détecté, calcule la position exacte par interpolation linéaire
 * entre les deux points encadrant T_freeze.
 *
 * @param {Array<number>} T_profile - Profil de température [°C]
 * @param {Array<number>} x_profile - Profil de position [m]
 * @param {number} [T_freeze=0] - Température de gel [°C]
 * @returns {FreezeAnalysis} Analyse complète du risque de gel
 * @throws {Error} Si les profils sont invalides
 *
 * @example
 * const T_profile = [60, 50, 40, 30, 20, 10, 5, 2, -1, -3];
 * const x_profile = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
 *
 * const analysis = detectFreeze(T_profile, x_profile, 0);
 * console.log(`Gel détecté: ${analysis.freezeDetected}`);
 * console.log(`Position: ${analysis.freezePosition}m`);
 * console.log(`Verdict: ${analysis.verdict}`);
 */
function detectFreeze(T_profile, x_profile, T_freeze = 0) {
  // ========== VALIDATION ==========

  if (!Array.isArray(T_profile) || T_profile.length === 0) {
    throw new Error('T_profile invalide ou vide');
  }

  if (!Array.isArray(x_profile) || x_profile.length === 0) {
    throw new Error('x_profile invalide ou vide');
  }

  if (T_profile.length !== x_profile.length) {
    throw new Error(
      `Tailles incompatibles: T_profile (${T_profile.length}) ≠ x_profile (${x_profile.length})`
    );
  }

  if (typeof T_freeze !== 'number' || !isFinite(T_freeze)) {
    throw new Error(`Température de gel invalide: ${T_freeze}`);
  }

  // Valider que tous les éléments sont des nombres
  for (let i = 0; i < T_profile.length; i++) {
    if (typeof T_profile[i] !== 'number' || !isFinite(T_profile[i])) {
      throw new Error(`T_profile[${i}] invalide: ${T_profile[i]}`);
    }
    if (typeof x_profile[i] !== 'number' || !isFinite(x_profile[i])) {
      throw new Error(`x_profile[${i}] invalide: ${x_profile[i]}`);
    }
  }

  // ========== TROUVER TEMPÉRATURE MINIMALE ==========

  let minTemp = T_profile[0];
  let minTempIndex = 0;

  for (let i = 1; i < T_profile.length; i++) {
    if (T_profile[i] < minTemp) {
      minTemp = T_profile[i];
      minTempIndex = i;
    }
  }

  const minTempPosition = x_profile[minTempIndex];

  // ========== DÉTECTION DU GEL ==========

  let freezeDetected = false;
  let freezePosition = null;

  // Vérifier si la température minimale est ≤ T_freeze
  if (minTemp <= T_freeze) {
    freezeDetected = true;

    // Trouver la position exacte où T = T_freeze par interpolation
    // Chercher le premier segment où la température traverse T_freeze
    for (let i = 0; i < T_profile.length - 1; i++) {
      const T1 = T_profile[i];
      const T2 = T_profile[i + 1];
      const x1 = x_profile[i];
      const x2 = x_profile[i + 1];

      // Vérifier si T_freeze est entre T1 et T2
      if ((T1 >= T_freeze && T2 <= T_freeze) || (T1 <= T_freeze && T2 >= T_freeze)) {
        // Interpolation linéaire pour trouver x où T = T_freeze
        // T = T1 + (T2 - T1) * (x - x1) / (x2 - x1)
        // Résoudre pour x quand T = T_freeze

        if (Math.abs(T2 - T1) < 1e-10) {
          // Cas dégénéré: T constante
          freezePosition = x1;
        } else {
          const fraction = (T_freeze - T1) / (T2 - T1);
          freezePosition = x1 + fraction * (x2 - x1);
        }

        break; // Première occurrence trouvée
      }
    }

    // Si pas trouvé par interpolation, utiliser la position de minTemp
    if (freezePosition === null) {
      freezePosition = minTempPosition;
    }
  }

  // ========== CALCUL DE LA MARGE ==========

  const marginToFreeze = minTemp - T_freeze;

  // ========== CALCUL SÉVÉRITÉ ET RECOMMANDATIONS ==========

  const SAFETY_THRESHOLD = 5; // °C - Seuil de sécurité recommandé
  const marginToSafety = minTemp - SAFETY_THRESHOLD;

  let severity;
  let recommendations = [];

  if (minTemp <= T_freeze) {
    // Gel détecté - CRITIQUE
    severity = 'critical';
    recommendations = [
      "Augmenter le débit d'eau pour réduire le temps de résidence",
      "Ajouter ou renforcer l'isolation thermique",
      'Réduire la longueur exposée aux conditions froides',
      "Considérer un système de chauffage d'appoint",
      "Risque d'arrêt de production et de rupture de conduite",
    ];
  } else if (minTemp < SAFETY_THRESHOLD) {
    // Sous le seuil de sécurité - AVERTISSEMENT
    severity = 'warning';
    recommendations = [
      "Augmenter le débit d'eau",
      "Ajouter de l'isolation thermique",
      'Surveiller les conditions météorologiques',
      "Prévoir un plan d'action si la température baisse davantage",
    ];
  } else {
    // Sécuritaire - OK
    severity = 'ok';
    recommendations = [
      'Conditions actuelles sécuritaires',
      'Maintenir les paramètres opératoires',
      'Surveiller en cas de changement de conditions',
    ];
  }

  // ========== VERDICT ==========

  const verdict = freezeDetected ? 'FREEZE_DETECTED' : 'NO_FREEZE';

  // ========== RÉSULTAT ==========

  return {
    freezeDetected: freezeDetected,
    freezePosition: freezePosition,
    minTemp: minTemp,
    minTempPosition: minTempPosition,
    T_freeze: T_freeze,
    marginToFreeze: marginToFreeze,
    verdict: verdict,
    severity: severity,
    marginToSafety: marginToSafety,
    recommendations: recommendations,
  };
}

/**
 * Analyse simple: retourne uniquement si le gel se produit (booléen).
 *
 * @param {Array<number>} T_profile - Profil de température [°C]
 * @param {number} [T_freeze=0] - Température de gel [°C]
 * @returns {boolean} true si gel détecté
 *
 * @example
 * const T_profile = [60, 50, 40, 30, 20, 10];
 * const willFreeze = checkFreezeSimple(T_profile);
 * // false (température minimale = 10°C > 0°C)
 */
function checkFreezeSimple(T_profile, T_freeze = 0) {
  if (!Array.isArray(T_profile) || T_profile.length === 0) {
    throw new Error('T_profile invalide ou vide');
  }

  for (let i = 0; i < T_profile.length; i++) {
    if (T_profile[i] <= T_freeze) {
      return true;
    }
  }

  return false;
}

/**
 * Calcule la marge de sécurité par rapport au gel.
 *
 * Marge positive = pas de gel, marge négative = gel
 *
 * @param {Array<number>} T_profile - Profil de température [°C]
 * @param {number} [T_freeze=0] - Température de gel [°C]
 * @returns {number} Marge [°C] (minTemp - T_freeze)
 *
 * @example
 * const T_profile = [60, 50, 40, 30, 20, 10];
 * const margin = freezeMargin(T_profile, 0);
 * // margin = 10°C (sécurité de 10°C avant gel)
 */
function freezeMargin(T_profile, T_freeze = 0) {
  if (!Array.isArray(T_profile) || T_profile.length === 0) {
    throw new Error('T_profile invalide ou vide');
  }

  const minTemp = Math.min(...T_profile);
  return minTemp - T_freeze;
}

/**
 * Détermine si une conduite nécessite de l'isolation pour éviter le gel.
 *
 * Compare la température finale avec un seuil de sécurité.
 *
 * @param {number} T_final - Température finale de la conduite [°C]
 * @param {number} [T_freeze=0] - Température de gel [°C]
 * @param {number} [safetyMargin=5] - Marge de sécurité souhaitée [°C]
 * @returns {boolean} true si isolation recommandée
 *
 * @example
 * const needsInsulation = requiresInsulation(3, 0, 5);
 * // true (3°C < 0°C + 5°C = 5°C)
 */
function requiresInsulation(T_final, T_freeze = 0, safetyMargin = 5) {
  if (typeof T_final !== 'number' || !isFinite(T_final)) {
    throw new Error(`T_final invalide: ${T_final}`);
  }
  if (typeof T_freeze !== 'number' || !isFinite(T_freeze)) {
    throw new Error(`T_freeze invalide: ${T_freeze}`);
  }
  if (typeof safetyMargin !== 'number' || !isFinite(safetyMargin) || safetyMargin < 0) {
    throw new Error(`Marge de sécurité invalide: ${safetyMargin}`);
  }

  const threshold = T_freeze + safetyMargin;
  return T_final < threshold;
}

/**
 * Génère un message textuel expliquant le résultat de l'analyse.
 *
 * @param {FreezeAnalysis} analysis - Résultat de detectFreeze()
 * @returns {string} Message explicatif
 *
 * @example
 * const analysis = detectFreeze([60, 50, -1], [0, 50, 100]);
 * const message = generateFreezeMessage(analysis);
 * console.log(message);
 * // "⚠️ RISQUE DE GEL détecté à 66.7m. Température minimale: -1.0°C"
 */
function generateFreezeMessage(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    throw new Error('Analyse invalide');
  }

  if (analysis.freezeDetected) {
    return (
      `⚠️ RISQUE DE GEL détecté à ${analysis.freezePosition.toFixed(1)}m. ` +
      `Température minimale: ${analysis.minTemp.toFixed(1)}°C`
    );
  } else {
    return (
      `✅ PAS DE RISQUE DE GEL. ` +
      `Température minimale: ${analysis.minTemp.toFixed(1)}°C ` +
      `(marge: ${analysis.marginToFreeze.toFixed(1)}°C)`
    );
  }
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.detectFreeze = detectFreeze;
  window.checkFreezeSimple = checkFreezeSimple;
  window.freezeMargin = freezeMargin;
  window.requiresInsulation = requiresInsulation;
  window.generateFreezeMessage = generateFreezeMessage;
}

// Export conditionnel pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectFreeze,
    checkFreezeSimple,
    freezeMargin,
    requiresInsulation,
    generateFreezeMessage,
  };
}
