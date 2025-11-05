/**
 * Calcule le nombre d'unités de transfert (NTU).
 *
 * NTU = UA / (ṁcp)
 *
 * où:
 * - U = coefficient de transfert global [W/(m²·K)]
 * - A = aire de transfert [m²]
 * - ṁ = débit massique [kg/s]
 * - cp = capacité thermique spécifique [J/(kg·K)]
 *
 * @param {number} UA - Conductance thermique globale [W/K]
 * @param {number} m_dot - Débit massique [kg/s]
 * @param {number} cp - Capacité thermique spécifique [J/(kg·K)]
 * @returns {number} Nombre d'unités de transfert [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // UA=6.25 W/K, ṁ=2.16 kg/s, cp=4184 J/(kg·K)
 * const NTU = calculateNTU(6.25, 2.16, 4184);
 * // NTU ≈ 0.00069
 */
function calculateNTU(UA, m_dot, cp) {
  // Validation
  if (typeof UA !== 'number' || !isFinite(UA) || UA < 0) {
    throw new Error(`Conductance UA invalide: ${UA}`);
  }
  if (typeof m_dot !== 'number' || !isFinite(m_dot) || m_dot <= 0) {
    throw new Error(`Débit massique invalide: ${m_dot}`);
  }
  if (typeof cp !== 'number' || !isFinite(cp) || cp <= 0) {
    throw new Error(`Capacité thermique invalide: ${cp}`);
  }

  // Capacité thermique du fluide
  const C = m_dot * cp;

  // NTU
  const NTU = UA / C;

  return NTU;
}

/**
 * Calcule l'effectiveness (efficacité) d'un échangeur.
 *
 * Pour un échangeur avec température ambiante constante (C_r = 0):
 * ε = 1 - exp(-NTU)
 *
 * Pour un échangeur avec rapport de capacités C_r > 0, la formule change.
 *
 * @param {number} NTU - Nombre d'unités de transfert [sans dimension]
 * @param {number} [C_r=0] - Rapport de capacités C_min/C_max [sans dimension]
 * @returns {number} Effectiveness [sans dimension, 0-1]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const epsilon = calculateEffectiveness(0.5);
 * // epsilon ≈ 0.393 (39.3% de la différence de température est transférée)
 */
function calculateEffectiveness(NTU, C_r = 0) {
  // Validation
  if (typeof NTU !== 'number' || !isFinite(NTU) || NTU < 0) {
    throw new Error(`NTU invalide: ${NTU}`);
  }
  if (typeof C_r !== 'number' || !isFinite(C_r) || C_r < 0 || C_r > 1) {
    throw new Error(`Rapport de capacités invalide: ${C_r} (doit être entre 0 et 1)`);
  }

  if (C_r === 0) {
    // Cas spécial: environnement infini (conduite exposée à l'air)
    return 1 - Math.exp(-NTU);
  } else {
    // Échangeur à contre-courant
    const exp_term = Math.exp(-NTU * (1 - C_r));
    return (1 - exp_term) / (1 - C_r * exp_term);
  }
}

/**
 * Calcule la température de sortie d'un fluide avec la méthode NTU.
 *
 * Pour une conduite exposée à l'environnement (C_r = 0):
 * T_out = T_∞ + (T_in - T_∞) × exp(-NTU)
 *
 * Forme alternative:
 * T_out = T_∞ + (T_in - T_∞) × (1 - ε)
 *
 * @param {number} T_in - Température d'entrée [K ou °C]
 * @param {number} T_amb - Température ambiante [K ou °C]
 * @param {number} m_dot - Débit massique [kg/s]
 * @param {number} cp - Capacité thermique spécifique [J/(kg·K)]
 * @param {number} UA - Conductance thermique globale [W/K]
 * @returns {number} Température de sortie [K ou °C, même unité que T_in]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Eau à 60°C, air à -10°C, ṁ=2.16 kg/s, cp=4184 J/(kg·K), UA=6.25 W/K
 * const T_out = calculateOutletTemperature(60, -10, 2.16, 4184, 6.25);
 * // T_out ≈ 59.95°C (perte de 0.05°C sur le segment)
 */
function calculateOutletTemperature(T_in, T_amb, m_dot, cp, UA) {
  // Validation
  if (typeof T_in !== 'number' || !isFinite(T_in)) {
    throw new Error(`Température d'entrée invalide: ${T_in}`);
  }
  if (typeof T_amb !== 'number' || !isFinite(T_amb)) {
    throw new Error(`Température ambiante invalide: ${T_amb}`);
  }
  if (typeof m_dot !== 'number' || !isFinite(m_dot) || m_dot <= 0) {
    throw new Error(`Débit massique invalide: ${m_dot}`);
  }
  if (typeof cp !== 'number' || !isFinite(cp) || cp <= 0) {
    throw new Error(`Capacité thermique invalide: ${cp}`);
  }
  if (typeof UA !== 'number' || !isFinite(UA) || UA < 0) {
    throw new Error(`Conductance UA invalide: ${UA}`);
  }

  // NTU
  const NTU = calculateNTU(UA, m_dot, cp);

  // Température de sortie
  const T_out = T_amb + (T_in - T_amb) * Math.exp(-NTU);

  return T_out;
}

/**
 * Calcule la perte (ou gain) de chaleur dans une conduite.
 *
 * Q = ṁcp(T_in - T_out)
 *
 * ou de manière équivalente:
 * Q = ε × ṁcp(T_in - T_∞)
 *
 * @param {number} m_dot - Débit massique [kg/s]
 * @param {number} cp - Capacité thermique spécifique [J/(kg·K)]
 * @param {number} T_in - Température d'entrée [K ou °C]
 * @param {number} T_out - Température de sortie [K ou °C]
 * @returns {number} Flux thermique [W] (positif = perte de chaleur)
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const Q = heatLossRate(2.16, 4184, 60, 59.95);
 * // Q ≈ 452 W (perte de chaleur)
 */
function heatLossRate(m_dot, cp, T_in, T_out) {
  // Validation
  if (typeof m_dot !== 'number' || !isFinite(m_dot) || m_dot <= 0) {
    throw new Error(`Débit massique invalide: ${m_dot}`);
  }
  if (typeof cp !== 'number' || !isFinite(cp) || cp <= 0) {
    throw new Error(`Capacité thermique invalide: ${cp}`);
  }
  if (typeof T_in !== 'number' || !isFinite(T_in)) {
    throw new Error(`Température d'entrée invalide: ${T_in}`);
  }
  if (typeof T_out !== 'number' || !isFinite(T_out)) {
    throw new Error(`Température de sortie invalide: ${T_out}`);
  }

  // Flux thermique (positif si T_in > T_out)
  const Q = m_dot * cp * (T_in - T_out);

  return Q;
}

/**
 * Calcule la longueur critique où le fluide atteint une température cible.
 *
 * Pour T_out = T_target:
 * L_crit = -(ṁcp / UA_per_length) × ln((T_target - T_amb) / (T_in - T_amb))
 *
 * où UA_per_length = UA/L est la conductance par unité de longueur [W/(m·K)]
 *
 * @param {number} T_in - Température d'entrée [K ou °C]
 * @param {number} T_target - Température cible [K ou °C]
 * @param {number} T_amb - Température ambiante [K ou °C]
 * @param {number} m_dot - Débit massique [kg/s]
 * @param {number} cp - Capacité thermique spécifique [J/(kg·K)]
 * @param {number} UA_per_length - Conductance par unité de longueur [W/(m·K)]
 * @returns {number} Longueur critique [m]
 * @throws {Error} Si les paramètres sont invalides ou si T_target est inaccessible
 *
 * @example
 * // Longueur pour atteindre 0°C (gel)
 * const L_freeze = criticalLength(60, 0, -10, 2.16, 4184, 6.25);
 * // L_freeze ≈ 3300 m
 */
function criticalLength(T_in, T_target, T_amb, m_dot, cp, UA_per_length) {
  // Validation
  if (typeof T_in !== 'number' || !isFinite(T_in)) {
    throw new Error(`Température d'entrée invalide: ${T_in}`);
  }
  if (typeof T_target !== 'number' || !isFinite(T_target)) {
    throw new Error(`Température cible invalide: ${T_target}`);
  }
  if (typeof T_amb !== 'number' || !isFinite(T_amb)) {
    throw new Error(`Température ambiante invalide: ${T_amb}`);
  }
  if (typeof m_dot !== 'number' || !isFinite(m_dot) || m_dot <= 0) {
    throw new Error(`Débit massique invalide: ${m_dot}`);
  }
  if (typeof cp !== 'number' || !isFinite(cp) || cp <= 0) {
    throw new Error(`Capacité thermique invalide: ${cp}`);
  }
  if (typeof UA_per_length !== 'number' || !isFinite(UA_per_length) || UA_per_length <= 0) {
    throw new Error(`Conductance par unité de longueur invalide: ${UA_per_length}`);
  }

  // Vérifier que T_target est entre T_in et T_amb
  if ((T_target - T_amb) * (T_in - T_amb) < 0) {
    throw new Error(
      `Température cible ${T_target} n'est pas entre T_in (${T_in}) et T_amb (${T_amb})`
    );
  }

  // Vérifier que T_target != T_amb (asymptote)
  if (Math.abs(T_target - T_amb) < 1e-6) {
    return Infinity; // Distance infinie pour atteindre T_amb
  }

  // Calcul de la longueur critique
  const ratio = (T_target - T_amb) / (T_in - T_amb);

  if (ratio <= 0 || ratio >= 1) {
    throw new Error(`Ratio de température invalide: ${ratio}`);
  }

  const L_crit = -((m_dot * cp) / UA_per_length) * Math.log(ratio);

  return L_crit;
}

/**
 * Calcule la température moyenne logarithmique (LMTD).
 *
 * LMTD = (ΔT1 - ΔT2) / ln(ΔT1/ΔT2)
 *
 * où ΔT1 = T_in - T_amb et ΔT2 = T_out - T_amb
 *
 * Utilisé pour calculer Q = UA × LMTD
 *
 * @param {number} delta_T1 - Différence de température à l'entrée [K ou °C]
 * @param {number} delta_T2 - Différence de température à la sortie [K ou °C]
 * @returns {number} LMTD [K ou °C]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const LMTD = logMeanTemperatureDifference(70, 69.95);
 * // LMTD ≈ 69.975
 */
function logMeanTemperatureDifference(delta_T1, delta_T2) {
  if (typeof delta_T1 !== 'number' || !isFinite(delta_T1)) {
    throw new Error(`ΔT1 invalide: ${delta_T1}`);
  }
  if (typeof delta_T2 !== 'number' || !isFinite(delta_T2)) {
    throw new Error(`ΔT2 invalide: ${delta_T2}`);
  }

  // Cas spécial: si les deux sont identiques
  if (Math.abs(delta_T1 - delta_T2) < 1e-6) {
    return delta_T1;
  }

  // Cas spécial: si l'un est zéro
  if (Math.abs(delta_T1) < 1e-10 || Math.abs(delta_T2) < 1e-10) {
    throw new Error('ΔT ne peut pas être zéro');
  }

  // LMTD
  const LMTD = (delta_T1 - delta_T2) / Math.log(delta_T1 / delta_T2);

  return LMTD;
}

/**
 * Vérifie si un fluide gèle dans une conduite.
 *
 * @param {number} T_out - Température de sortie [°C]
 * @param {number} [T_freeze=0] - Température de gel [°C]
 * @returns {boolean} true si le fluide gèle (T_out ≤ T_freeze)
 *
 * @example
 * const will_freeze = checkFreezing(0.5);
 * // false (au-dessus du point de gel)
 */
function checkFreezing(T_out, T_freeze = 0) {
  if (typeof T_out !== 'number' || !isFinite(T_out)) {
    throw new Error(`Température de sortie invalide: ${T_out}`);
  }
  if (typeof T_freeze !== 'number' || !isFinite(T_freeze)) {
    throw new Error(`Température de gel invalide: ${T_freeze}`);
  }

  return T_out <= T_freeze;
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.HeatTransfer = {
    calculateNTU,
    calculateEffectiveness,
    calculateOutletTemperature,
    heatLossRate,
    criticalLength,
    logMeanTemperatureDifference,
    checkFreezing,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateNTU,
    calculateEffectiveness,
    calculateOutletTemperature,
    heatLossRate,
    criticalLength,
    logMeanTemperatureDifference,
    checkFreezing,
  };
}
