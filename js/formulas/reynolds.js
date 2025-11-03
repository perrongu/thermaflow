/**
 * @typedef {Object} ReynoldsResult
 * @property {number} Re - Nombre de Reynolds [sans dimension]
 * @property {string} regime - Régime d'écoulement: 'laminar', 'transitional', 'turbulent'
 */

// Import des constantes de régimes d'écoulement (Node.js uniquement)
// En navigateur, on utilise directement window.FlowRegimes.RE_LAMINAR_MAX
let _flowRegimes_reynolds;
if (typeof module !== 'undefined' && module.exports) {
  _flowRegimes_reynolds = require('../constants/flow-regimes.js');
}

// Fonctions helper pour accès uniforme aux constantes
function getRELaminarMax() {
  return _flowRegimes_reynolds ? _flowRegimes_reynolds.RE_LAMINAR_MAX : window.FlowRegimes.RE_LAMINAR_MAX;
}

function getRETurbulentMin() {
  return _flowRegimes_reynolds ? _flowRegimes_reynolds.RE_TURBULENT_MIN : window.FlowRegimes.RE_TURBULENT_MIN;
}

/**
 * Calcule le nombre de Reynolds pour un écoulement en conduite.
 * 
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} V - Vitesse moyenne d'écoulement [m/s]
 * @param {number} D - Diamètre hydraulique [m]
 * @param {number} mu - Viscosité dynamique [Pa·s]
 * @returns {number} Nombre de Reynolds [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Eau à 20°C (ρ=998 kg/m³, μ=1.002e-3 Pa·s) dans DN50 (D=0.0525m) à V=1 m/s
 * const Re = calculateReynolds(998, 1.0, 0.0525, 1.002e-3);
 * // Re = 52275 (turbulent)
 */
function calculateReynolds(rho, V, D, mu) {
  // Validation des types
  if (typeof rho !== 'number' || !isFinite(rho)) {
    throw new Error(`Densité invalide: ${rho} (doit être un nombre fini)`);
  }
  if (typeof V !== 'number' || !isFinite(V)) {
    throw new Error(`Vitesse invalide: ${V} (doit être un nombre fini)`);
  }
  if (typeof D !== 'number' || !isFinite(D)) {
    throw new Error(`Diamètre invalide: ${D} (doit être un nombre fini)`);
  }
  if (typeof mu !== 'number' || !isFinite(mu)) {
    throw new Error(`Viscosité invalide: ${mu} (doit être un nombre fini)`);
  }
  
  // Validation des valeurs positives
  if (rho <= 0) {
    throw new Error(`Densité doit être positive: ${rho} kg/m³`);
  }
  if (V < 0) {
    throw new Error(`Vitesse doit être non-négative: ${V} m/s`);
  }
  if (D <= 0) {
    throw new Error(`Diamètre doit être positif: ${D} m`);
  }
  if (mu <= 0) {
    throw new Error(`Viscosité doit être positive: ${mu} Pa·s`);
  }
  
  // Calcul du nombre de Reynolds
  const Re = (rho * V * D) / mu;
  
  return Re;
}

/**
 * Détermine le régime d'écoulement basé sur le nombre de Reynolds.
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @returns {string} Régime: 'laminar', 'transitional', ou 'turbulent'
 * @throws {Error} Si Re est invalide
 * 
 * @example
 * const regime = getFlowRegime(1500);  // 'laminar'
 * const regime = getFlowRegime(3000);  // 'transitional'
 * const regime = getFlowRegime(10000); // 'turbulent'
 */
function getFlowRegime(Re) {
  if (typeof Re !== 'number' || !isFinite(Re)) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (Re < 0) {
    throw new Error(`Nombre de Reynolds doit être non-négatif: ${Re}`);
  }
  
  const RE_LAMINAR_MAX = getRELaminarMax();
  const RE_TURBULENT_MIN = getRETurbulentMin();
  
  if (Re < RE_LAMINAR_MAX) {
    return 'laminar';
  } else if (Re <= RE_TURBULENT_MIN) {
    return 'transitional';
  } else {
    return 'turbulent';
  }
}

/**
 * Calcule le nombre de Reynolds et détermine le régime d'écoulement.
 * 
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} V - Vitesse moyenne d'écoulement [m/s]
 * @param {number} D - Diamètre hydraulique [m]
 * @param {number} mu - Viscosité dynamique [Pa·s]
 * @returns {ReynoldsResult} Objet contenant Re et le régime
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Eau à 20°C dans DN50 à 1 m/s
 * const result = calculateReynoldsWithRegime(998, 1.0, 0.0525, 1.002e-3);
 * console.log(result.Re);      // 52275
 * console.log(result.regime);  // 'turbulent'
 */
function calculateReynoldsWithRegime(rho, V, D, mu) {
  const Re = calculateReynolds(rho, V, D, mu);
  const regime = getFlowRegime(Re);
  
  return { Re, regime };
}

/**
 * Calcule la vitesse critique correspondant à la transition laminaire-turbulent.
 * 
 * @param {number} rho - Densité du fluide [kg/m³]
 * @param {number} D - Diamètre hydraulique [m]
 * @param {number} mu - Viscosité dynamique [Pa·s]
 * @param {number} [Re_crit=2300] - Nombre de Reynolds critique
 * @returns {number} Vitesse critique [m/s]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Vitesse critique pour eau à 20°C dans DN50
 * const V_crit = getCriticalVelocity(998, 0.0525, 1.002e-3);
 * // V_crit ≈ 0.044 m/s
 */
function getCriticalVelocity(rho, D, mu, Re_crit) {
  // Utiliser RE_LAMINAR_MAX par défaut si non spécifié
  if (Re_crit === undefined) {
    Re_crit = getRELaminarMax();
  }
  
  // Validation
  if (typeof rho !== 'number' || !isFinite(rho) || rho <= 0) {
    throw new Error(`Densité invalide: ${rho}`);
  }
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  if (typeof mu !== 'number' || !isFinite(mu) || mu <= 0) {
    throw new Error(`Viscosité invalide: ${mu}`);
  }
  if (typeof Re_crit !== 'number' || !isFinite(Re_crit) || Re_crit <= 0) {
    throw new Error(`Reynolds critique invalide: ${Re_crit}`);
  }
  
  // V = Re·μ / (ρ·D)
  const V_crit = (Re_crit * mu) / (rho * D);
  
  return V_crit;
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.Reynolds = {
    calculateReynolds,
    getFlowRegime,
    calculateReynoldsWithRegime,
    getCriticalVelocity,
    // Exposer les constantes via getters pour accès uniforme
    get RE_LAMINAR_MAX() { return getRELaminarMax(); },
    get RE_TURBULENT_MIN() { return getRETurbulentMin(); }
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateReynolds,
    getFlowRegime,
    calculateReynoldsWithRegime,
    getCriticalVelocity,
    RE_LAMINAR_MAX: _flowRegimes_reynolds.RE_LAMINAR_MAX,
    RE_TURBULENT_MIN: _flowRegimes_reynolds.RE_TURBULENT_MIN
  };
}

