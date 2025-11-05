/**
 * Calcule la perte de charge par friction avec l'équation de Darcy-Weisbach.
 *
 * ΔP = f × (L/D) × (ρV²/2)
 *
 * @param {number} f - Facteur de friction de Darcy [sans dimension]
 * @param {number} L - Longueur de la conduite [m]
 * @param {number} D - Diamètre hydraulique [m]
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} V - Vitesse moyenne d'écoulement [m/s]
 * @returns {number} Perte de charge [Pa]
 * @throws {Error} Si les paramètres sont invalides
 *
 * Référence: Perry's Chemical Engineers' Handbook, Section 6-4, Eq. 6-44
 *
 * @example
 * // Eau dans DN50 sur 100m à 1 m/s avec f=0.02
 * const dP = pressureDropDarcy(0.02, 100, 0.0525, 998, 1.0);
 * // dP ≈ 19000 Pa (0.19 bar)
 */
function pressureDropDarcy(f, L, D, rho, V) {
  // Validation des types
  if (typeof f !== 'number' || !isFinite(f)) {
    throw new Error(`Facteur de friction invalide: ${f}`);
  }
  if (typeof L !== 'number' || !isFinite(L)) {
    throw new Error(`Longueur invalide: ${L}`);
  }
  if (typeof D !== 'number' || !isFinite(D)) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  if (typeof rho !== 'number' || !isFinite(rho)) {
    throw new Error(`Densité invalide: ${rho}`);
  }
  if (typeof V !== 'number' || !isFinite(V)) {
    throw new Error(`Vitesse invalide: ${V}`);
  }

  // Validation des valeurs
  if (f < 0) {
    throw new Error(`Facteur de friction doit être non-négatif: ${f}`);
  }
  if (L < 0) {
    throw new Error(`Longueur doit être non-négative: ${L}`);
  }
  if (D <= 0) {
    throw new Error(`Diamètre doit être positif: ${D}`);
  }
  if (rho <= 0) {
    throw new Error(`Densité doit être positive: ${rho}`);
  }
  if (V < 0) {
    throw new Error(`Vitesse doit être non-négative: ${V}`);
  }

  // Équation de Darcy-Weisbach: ΔP = f × (L/D) × (ρV²/2)
  const dP = f * (L / D) * ((rho * V * V) / 2.0);

  return dP;
}

/**
 * Calcule la perte de charge en hauteur de fluide (head loss).
 *
 * h_L = ΔP / (ρg)
 *
 * @param {number} dP - Perte de charge [Pa]
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} [g=9.81] - Accélération gravitationnelle [m/s²]
 * @returns {number} Perte de charge en hauteur [m]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const h_L = headLoss(19000, 998);
 * // h_L ≈ 1.94 m (hauteur de colonne d'eau)
 */
function headLoss(dP, rho, g = 9.81) {
  if (typeof dP !== 'number' || !isFinite(dP)) {
    throw new Error(`Perte de charge invalide: ${dP}`);
  }
  if (typeof rho !== 'number' || !isFinite(rho) || rho <= 0) {
    throw new Error(`Densité invalide: ${rho}`);
  }
  if (typeof g !== 'number' || !isFinite(g) || g <= 0) {
    throw new Error(`Gravité invalide: ${g}`);
  }

  return dP / (rho * g);
}

/**
 * Calcule la pression dynamique (pression de vitesse).
 *
 * P_dyn = ρV²/2
 *
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} V - Vitesse moyenne [m/s]
 * @returns {number} Pression dynamique [Pa]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const P_dyn = dynamicPressure(998, 1.0);
 * // P_dyn = 499 Pa
 */
function dynamicPressure(rho, V) {
  if (typeof rho !== 'number' || !isFinite(rho) || rho <= 0) {
    throw new Error(`Densité invalide: ${rho}`);
  }
  if (typeof V !== 'number' || !isFinite(V) || V < 0) {
    throw new Error(`Vitesse invalide: ${V}`);
  }

  return (rho * V * V) / 2.0;
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.PressureBasic = {
    pressureDropDarcy,
    headLoss,
    dynamicPressure,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    pressureDropDarcy,
    headLoss,
    dynamicPressure,
  };
}
