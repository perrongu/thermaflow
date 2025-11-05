/**
 * Calcule la perte de charge complète pour un écoulement en conduite.
 *
 * Cette fonction combine automatiquement:
 * 1. Calcul de Reynolds (Re = ρVD/μ)
 * 2. Calcul du facteur de friction (f selon Re et ε/D)
 * 3. Calcul de la perte de charge (ΔP = f × L/D × ρV²/2)
 *
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} V - Vitesse moyenne [m/s]
 * @param {number} D - Diamètre hydraulique [m]
 * @param {number} L - Longueur de conduite [m]
 * @param {number} mu - Viscosité dynamique [Pa·s]
 * @param {number} epsilon_D - Rugosité relative ε/D [sans dimension]
 * @param {string} [method='churchill'] - Méthode turbulente: 'colebrook' ou 'churchill'
 * @returns {Object} {dP, f, Re, regime} - Perte de charge et paramètres associés
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Eau (ρ=998, μ=1e-3) dans DN50 (D=0.0525m), ε/D=0.001, L=100m, V=1m/s
 * const result = calculatePressureDrop(998, 1.0, 0.0525, 100, 1e-3, 0.001);
 * console.log(result.dP);      // Perte de charge [Pa]
 * console.log(result.f);       // Facteur de friction
 * console.log(result.Re);      // Nombre de Reynolds
 * console.log(result.regime);  // 'laminar', 'transitional', 'turbulent'
 */
function calculatePressureDrop(rho, V, D, L, mu, epsilon_D, method = 'churchill') {
  // Chargement conditionnel des dépendances selon l'environnement (browser vs Node.js)
  let calculateReynolds, getFlowRegime, frictionFactor, pressureDropDarcy;

  if (typeof window !== 'undefined') {
    // Mode browser
    calculateReynolds = window.Reynolds.calculateReynolds;
    getFlowRegime = window.Reynolds.getFlowRegime;
    frictionFactor = window.FrictionFactor.frictionFactor;
    pressureDropDarcy = window.PressureBasic.pressureDropDarcy;
  } else {
    // Mode Node.js
    const reynolds = require('../formulas/reynolds.js');
    const friction = require('../correlations/friction-factor.js');
    const pressure = require('../formulas/pressure-basic.js');

    calculateReynolds = reynolds.calculateReynolds;
    getFlowRegime = reynolds.getFlowRegime;
    frictionFactor = friction.frictionFactor;
    pressureDropDarcy = pressure.pressureDropDarcy;
  }

  // 1. Calcul de Reynolds
  const Re = calculateReynolds(rho, V, D, mu);
  const regime = getFlowRegime(Re);

  // 2. Calcul du facteur de friction
  const f = frictionFactor(Re, epsilon_D, method);

  // 3. Calcul de la perte de charge
  const dP = pressureDropDarcy(f, L, D, rho, V);

  return {
    dP, // Perte de charge [Pa]
    f, // Facteur de friction [-]
    Re, // Nombre de Reynolds [-]
    regime, // Régime d'écoulement
  };
}

/**
 * Calcule la perte de charge à partir d'un débit volumique.
 *
 * Convertit automatiquement Q → V puis calcule la perte de charge.
 *
 * @param {number} Q - Débit volumique [m³/s]
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} D - Diamètre hydraulique [m]
 * @param {number} L - Longueur de conduite [m]
 * @param {number} mu - Viscosité dynamique [Pa·s]
 * @param {number} epsilon_D - Rugosité relative ε/D [sans dimension]
 * @param {string} [method='churchill'] - Méthode turbulente
 * @returns {Object} {dP, f, Re, regime, V} - Résultats incluant la vitesse calculée
 *
 * @example
 * // Débit de 1 L/min = 1.667e-5 m³/s
 * const result = calculatePressureDropFromFlowrate(1.667e-5, 998, 0.0525, 100, 1e-3, 0.001);
 */
function calculatePressureDropFromFlowrate(Q, rho, D, L, mu, epsilon_D, method = 'churchill') {
  let velocityFromFlowrate;

  if (typeof window !== 'undefined') {
    velocityFromFlowrate = window.Geometry.velocityFromFlowrate;
  } else {
    const geometry = require('../formulas/geometry.js');
    velocityFromFlowrate = geometry.velocityFromFlowrate;
  }

  // Convertir débit en vitesse
  const V = velocityFromFlowrate(Q, D);

  // Calculer perte de charge
  const result = calculatePressureDrop(rho, V, D, L, mu, epsilon_D, method);

  // Ajouter la vitesse au résultat
  return { ...result, V };
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.PressureDrop = {
    calculatePressureDrop,
    calculatePressureDropFromFlowrate,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculatePressureDrop,
    calculatePressureDropFromFlowrate,
  };
}
