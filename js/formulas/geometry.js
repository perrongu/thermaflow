/**
 * Calcule l'aire de section d'une conduite circulaire.
 *
 * A = πD²/4
 *
 * @param {number} D - Diamètre hydraulique [m]
 * @returns {number} Aire de section [m²]
 * @throws {Error} Si le diamètre est invalide
 *
 * @example
 * const A = crossSectionalArea(0.0525);
 * // A ≈ 0.002165 m²
 */
function crossSectionalArea(D) {
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }

  return (Math.PI * D * D) / 4.0;
}

/**
 * Calcule la vitesse correspondant à un débit volumique donné.
 *
 * V = Q / A = Q / (πD²/4)
 *
 * @param {number} Q - Débit volumique [m³/s]
 * @param {number} D - Diamètre hydraulique [m]
 * @returns {number} Vitesse moyenne [m/s]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Débit de 1 L/min = 1.667e-5 m³/s dans DN50 (D=0.0525m)
 * const V = velocityFromFlowrate(1.667e-5, 0.0525);
 * // V ≈ 0.0077 m/s
 */
function velocityFromFlowrate(Q, D) {
  if (typeof Q !== 'number' || !isFinite(Q)) {
    throw new Error(`Débit invalide: ${Q}`);
  }
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  if (Q < 0) {
    throw new Error(`Débit doit être non-négatif: ${Q}`);
  }

  const A = crossSectionalArea(D);
  const V = Q / A;

  return V;
}

/**
 * Calcule le débit volumique correspondant à une vitesse donnée.
 *
 * Q = V × A = V × (πD²/4)
 *
 * @param {number} V - Vitesse moyenne [m/s]
 * @param {number} D - Diamètre hydraulique [m]
 * @returns {number} Débit volumique [m³/s]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const Q = flowrateFromVelocity(1.0, 0.0525);
 * // Q ≈ 2.165e-3 m³/s (≈ 130 L/min)
 */
function flowrateFromVelocity(V, D) {
  if (typeof V !== 'number' || !isFinite(V)) {
    throw new Error(`Vitesse invalide: ${V}`);
  }
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  if (V < 0) {
    throw new Error(`Vitesse doit être non-négative: ${V}`);
  }

  const A = crossSectionalArea(D);
  const Q = V * A;

  return Q;
}

/**
 * Calcule le débit massique à partir du débit volumique.
 *
 * ṁ = ρQ
 *
 * @param {number} Q - Débit volumique [m³/s]
 * @param {number} rho - Densité du fluide [kg/m³]
 * @returns {number} Débit massique [kg/s]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const m_dot = massFlowrate(2.165e-3, 998);
 * // m_dot ≈ 2.16 kg/s
 */
function massFlowrate(Q, rho) {
  if (typeof Q !== 'number' || !isFinite(Q) || Q < 0) {
    throw new Error(`Débit volumique invalide: ${Q}`);
  }
  if (typeof rho !== 'number' || !isFinite(rho) || rho <= 0) {
    throw new Error(`Densité invalide: ${rho}`);
  }

  return Q * rho;
}

/**
 * Calcule l'aire extérieure d'un cylindre (conduite).
 *
 * A = π × D × L
 *
 * @param {number} D - Diamètre extérieur [m]
 * @param {number} L - Longueur [m]
 * @returns {number} Aire extérieure [m²]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Conduite DN50 (D_ext≈0.06m), L=10m
 * const A = cylinderSurfaceArea(0.06, 10);
 * // A ≈ 1.885 m²
 */
function cylinderSurfaceArea(D, L) {
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  if (typeof L !== 'number' || !isFinite(L) || L <= 0) {
    throw new Error(`Longueur invalide: ${L}`);
  }

  return Math.PI * D * L;
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.Geometry = {
    crossSectionalArea,
    velocityFromFlowrate,
    flowrateFromVelocity,
    massFlowrate,
    cylinderSurfaceArea,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    crossSectionalArea,
    velocityFromFlowrate,
    flowrateFromVelocity,
    massFlowrate,
    cylinderSurfaceArea,
  };
}
