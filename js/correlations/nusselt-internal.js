// ====================================================================
// IMPORTS - Limites de régimes d'écoulement
// ====================================================================

// Import des constantes de régimes d'écoulement (Node.js uniquement)
// En navigateur, on utilise directement window.FlowRegimes
let _flowRegimes_nusselt;
if (typeof module !== 'undefined' && module.exports) {
  _flowRegimes_nusselt = require('../constants/flow-regimes.js');
}

// Fonctions helper pour accès uniforme aux constantes
function getRELaminarMax() {
  return _flowRegimes_nusselt ? _flowRegimes_nusselt.RE_LAMINAR_MAX : window.FlowRegimes.RE_LAMINAR_MAX;
}

function getRETurbulentMin() {
  return _flowRegimes_nusselt ? _flowRegimes_nusselt.RE_TURBULENT_MIN : window.FlowRegimes.RE_TURBULENT_MIN;
}

// ====================================================================
// CONSTANTES PHYSIQUES (Perry's Section 5-12)
// ====================================================================

// Nusselt laminaire pleinement développé
const NUSSELT_LAMINAR_CONSTANT_T = 3.66;  // Température de paroi constante
const NUSSELT_LAMINAR_CONSTANT_Q = 4.36;  // Flux thermique constant

// Corrélation de Hausen
const HAUSEN_CONSTANT_BASE = 3.66;        // Même que laminaire constant_T
const HAUSEN_CONSTANT_0668 = 0.0668;      // Coefficient entrée thermique
const HAUSEN_CONSTANT_004 = 0.04;         // Exposant correction entrée
const HAUSEN_EXP_CORRECTION = 2.0 / 3.0;  // Exposant puissance correction

// Corrélation de Dittus-Boelter
const DITTUS_BOELTER_CONSTANT = 0.023;    // Coefficient principal
const DITTUS_BOELTER_EXP_RE = 0.8;        // Exposant Reynolds
const DITTUS_BOELTER_EXP_PR_HEATING = 0.4;   // Exposant Prandtl (chauffage)
const DITTUS_BOELTER_EXP_PR_COOLING = 0.3;   // Exposant Prandtl (refroidissement)

// Corrélation de Gnielinski
const GNIELINSKI_CONSTANT_12_7 = 12.7;    // Coefficient dénominateur
const GNIELINSKI_CONSTANT_1000 = 1000;    // Correction Reynolds
const GNIELINSKI_CONSTANT_8 = 8.0;        // Diviseur friction factor
const GNIELINSKI_EXP_PR = 2.0 / 3.0;      // Exposant Prandtl

// Flag global pour limiter le warning Gnielinski à une fois par session (évite 27000 warnings!)
let _gnielinski_warning_shown = false;

/**
 * Nombre de Nusselt pour écoulement laminaire pleinement développé.
 * 
 * Valeurs constantes selon les conditions aux limites:
 * - Nu = 4.36: Flux thermique constant (conduite isotherme)
 * - Nu = 3.66: Température de paroi constante
 * 
 * Valide pour Re < 2300, L/D > 100 (régime établi)
 * 
 * @param {string} [bc='constant_T'] - Condition limite: 'constant_T' ou 'constant_q'
 * @returns {number} Nombre de Nusselt [sans dimension]
 * 
 * @example
 * const Nu = nusseltLaminarFullyDeveloped('constant_T');
 * // Nu = 3.66
 */
function nusseltLaminarFullyDeveloped(bc = 'constant_T') {
  if (bc === 'constant_T') {
    return NUSSELT_LAMINAR_CONSTANT_T;
  } else if (bc === 'constant_q') {
    return NUSSELT_LAMINAR_CONSTANT_Q;
  } else {
    throw new Error(`Condition limite inconnue: ${bc} (doit être 'constant_T' ou 'constant_q')`);
  }
}

/**
 * Corrélation de Hausen pour écoulement laminaire avec effet d'entrée.
 * 
 * Équation:
 * Nu = 3.66 + (0.0668 × (D/L) × Re × Pr) / (1 + 0.04 × [(D/L) × Re × Pr]^(2/3))
 * 
 * Valide pour:
 * - Re < 2300 (laminaire)
 * - Pr > 0.6
 * - Prend en compte l'effet d'entrée thermique
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @param {number} D - Diamètre hydraulique [m]
 * @param {number} L - Longueur de la conduite [m]
 * @returns {number} Nombre de Nusselt [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Eau à 20°C (Pr=7.0) en laminaire, DN50, L=10m
 * const Nu = nusseltHausen(1500, 7.0, 0.0525, 10);
 * // Nu ≈ 4.2 (supérieur à 3.66 grâce à l'effet d'entrée)
 */
function nusseltHausen(Re, Pr, D, L) {
  // Validation
  if (typeof Re !== 'number' || !isFinite(Re) || Re <= 0) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (typeof Pr !== 'number' || !isFinite(Pr) || Pr <= 0) {
    throw new Error(`Nombre de Prandtl invalide: ${Pr}`);
  }
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  if (typeof L !== 'number' || !isFinite(L) || L <= 0) {
    throw new Error(`Longueur invalide: ${L}`);
  }
  
  // Vérification limites de validité
  if (Re >= 2300) {
    console.warn(`Hausen: Re=${Re} ≥ 2300 (hors régime laminaire), utiliser corrélation turbulente`);
  }
  if (Pr < 0.6) {
    console.warn(`Hausen: Pr=${Pr} < 0.6, précision réduite (métaux liquides)`);
  }
  
  // Paramètre combiné
  const param = (D / L) * Re * Pr;
  
  // Corrélation de Hausen
  const Nu = HAUSEN_CONSTANT_BASE 
    + (HAUSEN_CONSTANT_0668 * param) / (1 + HAUSEN_CONSTANT_004 * Math.pow(param, HAUSEN_EXP_CORRECTION));
  
  return Nu;
}

/**
 * Corrélation de Dittus-Boelter pour écoulement turbulent.
 * 
 * Équation:
 * Nu = 0.023 × Re^0.8 × Pr^n
 * 
 * où n = 0.4 pour chauffage (T_wall > T_fluid)
 *     n = 0.3 pour refroidissement (T_wall < T_fluid)
 * 
 * Valide pour:
 * - 10000 < Re < 120000
 * - 0.7 < Pr < 120
 * - L/D > 10
 * 
 * Note: Simple mais moins précis que Gnielinski pour Re modérés.
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @param {string} [mode='heating'] - Mode: 'heating' ou 'cooling'
 * @returns {number} Nombre de Nusselt [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Eau à 20°C (Pr=7.0) en turbulent, chauffage
 * const Nu = nusseltDittusBoelter(50000, 7.0, 'heating');
 * // Nu ≈ 340
 */
function nusseltDittusBoelter(Re, Pr, mode = 'heating') {
  // Validation
  if (typeof Re !== 'number' || !isFinite(Re) || Re <= 0) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (typeof Pr !== 'number' || !isFinite(Pr) || Pr <= 0) {
    throw new Error(`Nombre de Prandtl invalide: ${Pr}`);
  }
  
  // Vérification limites de validité
  if (Re < 10000 || Re > 120000) {
    console.warn(`Dittus-Boelter: Re=${Re} hors limites [10000, 120000], considérer Gnielinski`);
  }
  if (Pr < 0.7 || Pr > 120) {
    console.warn(`Dittus-Boelter: Pr=${Pr} hors limites [0.7, 120], précision réduite`);
  }
  
  // Exposant selon le mode
  let n;
  if (mode === 'heating') {
    n = DITTUS_BOELTER_EXP_PR_HEATING;
  } else if (mode === 'cooling') {
    n = DITTUS_BOELTER_EXP_PR_COOLING;
  } else {
    throw new Error(`Mode inconnu: ${mode} (doit être 'heating' ou 'cooling')`);
  }
  
  // Corrélation de Dittus-Boelter
  const Nu = DITTUS_BOELTER_CONSTANT * Math.pow(Re, DITTUS_BOELTER_EXP_RE) * Math.pow(Pr, n);
  
  return Nu;
}

/**
 * Corrélation de Gnielinski pour écoulement turbulent.
 * 
 * Équation:
 * Nu = ((f/8) × (Re - 1000) × Pr) / (1 + 12.7 × √(f/8) × (Pr^(2/3) - 1))
 * 
 * où f est le facteur de friction (Colebrook ou Churchill pour conduite rugueuse)
 * 
 * Valide pour:
 * - Re > 3000 (recommandé Re > 4000 pour régime turbulent établi)
 * - 0.5 < Pr < 2000
 * - Plus précis que Dittus-Boelter
 * 
 * IMPORTANT: Pour conduites rugueuses, f doit provenir de friction-factor.js
 * (Colebrook ou Churchill) pour intégrer l'effet de la rugosité. Utiliser
 * l'approximation Petukhov (conduite lisse) sous-estime Nu de 10-30%.
 * 
 * Référence: Gnielinski, V. (1976), Int. Chem. Eng. 16, 359-368
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @param {number} [f=null] - Facteur de friction [sans dimension] (optionnel, sinon Petukhov)
 * @returns {number} Nombre de Nusselt [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Eau à 20°C (Pr=7.0) en turbulent modéré, conduite lisse
 * const Nu = nusseltGnielinski(10000, 7.0);
 * // Nu ≈ 72
 * 
 * @example
 * // Avec friction factor pour conduite rugueuse (recommandé)
 * const f = frictionFactor(10000, 0.001); // ε/D = 0.001
 * const Nu = nusseltGnielinski(10000, 7.0, f);
 * // Nu ≈ 79 (plus élevé que conduite lisse)
 */
function nusseltGnielinski(Re, Pr, f = null) {
  // Validation
  if (typeof Re !== 'number' || !isFinite(Re) || Re <= 0) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (typeof Pr !== 'number' || !isFinite(Pr) || Pr <= 0) {
    throw new Error(`Nombre de Prandtl invalide: ${Pr}`);
  }
  
  // Vérification limites de validité
  if (Re < 3000 || Re > 5e6) {
    console.warn(`Gnielinski: Re=${Re} hors limites recommandées [3000, 5e6], précision réduite`);
  }
  if (Pr < 0.5 || Pr > 2000) {
    console.warn(`Gnielinski: Pr=${Pr} hors limites [0.5, 2000], précision réduite`);
  }
  
  // Facteur de friction
  let f_used;
  if (f !== null) {
    // Friction factor fourni (recommandé pour rugosité)
    if (typeof f !== 'number' || !isFinite(f) || f <= 0) {
      throw new Error(`Facteur de friction invalide: ${f}`);
    }
    f_used = f;
  } else {
    // Approximation pour conduite lisse (Petukhov)
    // f = (0.79 ln(Re) - 1.64)^(-2)
    f_used = Math.pow(0.79 * Math.log(Re) - 1.64, -2);
    
    // Warning une seule fois par session (évite 27000 warnings dans analyse sensibilité!)
    if (!_gnielinski_warning_shown) {
      console.warn(
        `Gnielinski: friction factor lisse utilisé (Petukhov). ` +
        `Pour conduite rugueuse, passer f de friction-factor.js pour précision.`
      );
      _gnielinski_warning_shown = true;
    }
  }
  
  // Corrélation de Gnielinski
  const numerator = (f_used / GNIELINSKI_CONSTANT_8) * (Re - GNIELINSKI_CONSTANT_1000) * Pr;
  const denominator = 1 + GNIELINSKI_CONSTANT_12_7 * Math.sqrt(f_used / GNIELINSKI_CONSTANT_8) * (Math.pow(Pr, GNIELINSKI_EXP_PR) - 1);
  const Nu = numerator / denominator;
  
  return Nu;
}

/**
 * Sélectionne automatiquement la corrélation appropriée selon le régime.
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @param {number} [D] - Diamètre hydraulique [m] (optionnel, pour Hausen)
 * @param {number} [L] - Longueur [m] (optionnel, pour Hausen)
 * @returns {number} Nombre de Nusselt [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Détection automatique du régime
 * const Nu1 = nusseltInternal(1500, 7.0);       // → Hausen ou constant
 * const Nu2 = nusseltInternal(50000, 7.0);      // → Gnielinski
 */
function nusseltInternal(Re, Pr, D = null, L = null) {
  const RE_LAMINAR_MAX = getRELaminarMax();
  const RE_TURBULENT_MIN = getRETurbulentMin();
  
  if (Re < RE_LAMINAR_MAX) {
    // Laminaire (Re < 2300)
    if (D && L) {
      return nusseltHausen(Re, Pr, D, L);
    } else {
      // Sans géométrie, utilise valeur asymptotique
      return nusseltLaminarFullyDeveloped('constant_T');
    }
  } else if (Re <= RE_TURBULENT_MIN) {
    // Zone de transition (2300 < Re < 4000): interpolation linéaire
    // Note: Gnielinski est valide dès Re > 3000, mais on interpole jusqu'à 4000
    // pour cohérence avec la définition standard de régime turbulent établi
    const Nu_lam = (D && L) ? nusseltHausen(RE_LAMINAR_MAX, Pr, D, L) : nusseltLaminarFullyDeveloped('constant_T');
    const Nu_turb = nusseltGnielinski(RE_TURBULENT_MIN, Pr);
    const weight = (Re - RE_LAMINAR_MAX) / (RE_TURBULENT_MIN - RE_LAMINAR_MAX);
    return Nu_lam + weight * (Nu_turb - Nu_lam);
  } else if (Re <= 10000) {
    // Turbulent modéré: Gnielinski recommandé
    return nusseltGnielinski(Re, Pr);
  } else {
    // Turbulent élevé: Gnielinski ou Dittus-Boelter
    // Gnielinski est plus précis
    return nusseltGnielinski(Re, Pr);
  }
}

/**
 * Calcule le coefficient de convection à partir du nombre de Nusselt.
 * 
 * h = Nu × k / D
 * 
 * @param {number} Nu - Nombre de Nusselt [sans dimension]
 * @param {number} k - Conductivité thermique du fluide [W/(m·K)]
 * @param {number} D - Diamètre hydraulique [m]
 * @returns {number} Coefficient de convection [W/(m²·K)]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Nu=72, k=0.598 W/(m·K), D=0.0525m
 * const h = convectionCoefficient(72, 0.598, 0.0525);
 * // h ≈ 820 W/(m²·K)
 */
function convectionCoefficient(Nu, k, D) {
  if (typeof Nu !== 'number' || !isFinite(Nu) || Nu <= 0) {
    throw new Error(`Nombre de Nusselt invalide: ${Nu}`);
  }
  if (typeof k !== 'number' || !isFinite(k) || k <= 0) {
    throw new Error(`Conductivité thermique invalide: ${k}`);
  }
  if (typeof D !== 'number' || !isFinite(D) || D <= 0) {
    throw new Error(`Diamètre invalide: ${D}`);
  }
  
  return Nu * k / D;
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.NusseltInternal = {
    nusseltLaminarFullyDeveloped,
    nusseltHausen,
    nusseltDittusBoelter,
    nusseltGnielinski,
    nusseltInternal,
    convectionCoefficient
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    nusseltLaminarFullyDeveloped,
    nusseltHausen,
    nusseltDittusBoelter,
    nusseltGnielinski,
    nusseltInternal,
    convectionCoefficient
  };
}

