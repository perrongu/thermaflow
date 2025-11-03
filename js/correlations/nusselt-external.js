/**
 * Corrélation de Churchill-Bernstein pour cylindre en flux croisé.
 * 
 * Équation (forme complète):
 * Nu = 0.3 + (0.62 × Re^0.5 × Pr^(1/3)) / [1 + (0.4/Pr)^(2/3)]^(1/4) × [1 + (Re/282000)^(5/8)]^(4/5)
 * 
 * Valide pour:
 * - Re × Pr > 0.2
 * - Toute la plage de Re (0.1 à 10⁷)
 * - Large plage de Pr
 * 
 * Application: Conduite exposée au vent ou à l'air ambiant
 * 
 * Référence: Churchill & Bernstein (1977)
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @returns {number} Nombre de Nusselt [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Conduite DN50 (D=0.06m) dans air à 0°C, vent 5 m/s
 * // Re ≈ 20000, Pr ≈ 0.715
 * const Nu = nusseltChurchillBernstein(20000, 0.715);
 * // Nu ≈ 90
 */
function nusseltChurchillBernstein(Re, Pr) {
  // Validation
  if (typeof Re !== 'number' || !isFinite(Re) || Re <= 0) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (typeof Pr !== 'number' || !isFinite(Pr) || Pr <= 0) {
    throw new Error(`Nombre de Prandtl invalide: ${Pr}`);
  }
  
  // Vérification du critère de validité
  if (Re * Pr < 0.2) {
    console.warn(`Churchill-Bernstein: Re×Pr = ${Re * Pr} < 0.2, résultat peu fiable`);
  }
  
  // Terme 1: Contribution de convection naturelle
  const term1 = 0.3;
  
  // Terme 2: Contribution de convection forcée
  const sqrt_Re = Math.sqrt(Re);
  const Pr_ratio = Math.pow(0.4 / Pr, 2.0 / 3.0);
  const bracket1 = Math.pow(1 + Pr_ratio, 0.25);
  const numerator = 0.62 * sqrt_Re * Math.pow(Pr, 1.0 / 3.0);
  const term2 = numerator / bracket1;
  
  // Terme 3: Correction pour Re élevés
  const Re_ratio = Math.pow(Re / 282000, 5.0 / 8.0);
  const term3 = Math.pow(1 + Re_ratio, 4.0 / 5.0);
  
  // Nusselt total
  const Nu = term1 + term2 * term3;
  
  return Nu;
}

/**
 * Corrélation de Hilpert pour cylindre en flux croisé (forme simplifiée).
 * 
 * Équation: Nu = C × Re^m × Pr^(1/3)
 * 
 * Constantes C et m selon la plage de Reynolds:
 * 
 * Re         | C       | m
 * -----------|---------|-------
 * 0.4-4      | 0.989   | 0.330
 * 4-40       | 0.911   | 0.385
 * 40-4000    | 0.683   | 0.466
 * 4000-40000 | 0.193   | 0.618
 * 40000-4e5  | 0.027   | 0.805
 * 
 * Valide pour: 0.7 < Pr < 500
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @returns {number} Nombre de Nusselt [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * const Nu = nusseltHilpert(20000, 0.715);
 * // Nu ≈ 86
 */
function nusseltHilpert(Re, Pr) {
  // Validation
  if (typeof Re !== 'number' || !isFinite(Re) || Re <= 0) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (typeof Pr !== 'number' || !isFinite(Pr) || Pr <= 0) {
    throw new Error(`Nombre de Prandtl invalide: ${Pr}`);
  }
  
  // Sélection des constantes selon Re
  let C, m;
  if (Re < 4) {
    C = 0.989;
    m = 0.330;
  } else if (Re < 40) {
    C = 0.911;
    m = 0.385;
  } else if (Re < 4000) {
    C = 0.683;
    m = 0.466;
  } else if (Re < 40000) {
    C = 0.193;
    m = 0.618;
  } else if (Re < 400000) {
    C = 0.027;
    m = 0.805;
  } else {
    // Extrapolation au-delà de la plage
    console.warn(`Hilpert: Re = ${Re} > 400000, extrapolation`);
    C = 0.027;
    m = 0.805;
  }
  
  // Corrélation de Hilpert
  const Nu = C * Math.pow(Re, m) * Math.pow(Pr, 1.0 / 3.0);
  
  return Nu;
}

/**
 * Convection naturelle pour cylindre horizontal.
 * 
 * Équation de Churchill & Chu pour convection naturelle:
 * Nu = 0.36 + (0.518 × Ra^(1/4)) / [1 + (0.559/Pr)^(9/16)]^(4/9)
 * 
 * où Ra = Gr × Pr (nombre de Rayleigh)
 * et Gr = g × β × ΔT × D³ / ν² (nombre de Grashof)
 * 
 * Valide pour: 10^-5 < Ra < 10^12
 * 
 * Application: Conduite en air calme (pas de vent)
 * 
 * @param {number} Ra - Nombre de Rayleigh [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @returns {number} Nombre de Nusselt [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Conduite chaude en air calme, Ra ≈ 10^6
 * const Nu = nusseltNaturalConvectionCylinder(1e6, 0.715);
 * // Nu ≈ 20
 */
function nusseltNaturalConvectionCylinder(Ra, Pr) {
  // Validation
  if (typeof Ra !== 'number' || !isFinite(Ra) || Ra <= 0) {
    throw new Error(`Nombre de Rayleigh invalide: ${Ra}`);
  }
  if (typeof Pr !== 'number' || !isFinite(Pr) || Pr <= 0) {
    throw new Error(`Nombre de Prandtl invalide: ${Pr}`);
  }
  
  // Corrélation de Churchill & Chu
  const term1 = 0.36;
  const Ra_pow = Math.pow(Ra, 0.25);
  const bracket = Math.pow(0.559 / Pr, 9.0 / 16.0);
  const denominator = Math.pow(1 + bracket, 4.0 / 9.0);
  const term2 = (0.518 * Ra_pow) / denominator;
  
  const Nu = term1 + term2;
  
  return Nu;
}

/**
 * Calcule le nombre de Rayleigh pour convection naturelle.
 * 
 * Ra = Gr × Pr = (g × β × ΔT × L³ / ν²) × Pr
 * 
 * Pour gaz parfait: β ≈ 1/T_film (coefficient d'expansion thermique)
 * 
 * @param {number} g - Accélération gravitationnelle [m/s²]
 * @param {number} beta - Coefficient d'expansion thermique [1/K]
 * @param {number} delta_T - Différence de température (T_surf - T_inf) [K ou °C]
 * @param {number} L - Longueur caractéristique [m]
 * @param {number} nu - Viscosité cinématique [m²/s]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @returns {number} Nombre de Rayleigh [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Air à 10°C (T_film), conduite D=0.06m, ΔT=50K
 * // β ≈ 1/283 = 0.00353 K⁻¹, ν ≈ 1.4e-5 m²/s, Pr ≈ 0.715
 * const Ra = calculateRayleigh(9.81, 0.00353, 50, 0.06, 1.4e-5, 0.715);
 * // Ra ≈ 2.5e6
 */
function calculateRayleigh(g, beta, delta_T, L, nu, Pr) {
  // Validation
  if (typeof g !== 'number' || !isFinite(g) || g <= 0) {
    throw new Error(`Gravité invalide: ${g}`);
  }
  if (typeof beta !== 'number' || !isFinite(beta) || beta < 0) {
    throw new Error(`Coefficient d'expansion invalide: ${beta}`);
  }
  if (typeof delta_T !== 'number' || !isFinite(delta_T)) {
    throw new Error(`Différence de température invalide: ${delta_T}`);
  }
  if (typeof L !== 'number' || !isFinite(L) || L <= 0) {
    throw new Error(`Longueur caractéristique invalide: ${L}`);
  }
  if (typeof nu !== 'number' || !isFinite(nu) || nu <= 0) {
    throw new Error(`Viscosité cinématique invalide: ${nu}`);
  }
  if (typeof Pr !== 'number' || !isFinite(Pr) || Pr <= 0) {
    throw new Error(`Nombre de Prandtl invalide: ${Pr}`);
  }
  
  // Nombre de Grashof
  const Gr = (g * beta * Math.abs(delta_T) * Math.pow(L, 3)) / (nu * nu);
  
  // Nombre de Rayleigh
  const Ra = Gr * Pr;
  
  return Ra;
}

/**
 * Calcule le nombre de Richardson pour déterminer le régime de convection.
 * 
 * Le nombre de Richardson compare l'importance relative de la convection naturelle
 * vs la convection forcée:
 * 
 * Ri = Gr / Re²
 * 
 * Interprétation:
 * - Ri < 0.1: Convection forcée dominante (naturelle négligeable)
 * - 0.1 ≤ Ri ≤ 10: Convection mixte (forcée et naturelle comparables)
 * - Ri > 10: Convection naturelle dominante (forcée négligeable)
 * 
 * Référence: Churchill, S.W. (1977), "Combined free and forced convection around 
 * immersed bodies", AIChE J. 23, 10-16
 * 
 * @param {number} Gr - Nombre de Grashof [sans dimension]
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @returns {number} Nombre de Richardson [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Vent fort: Re=20000, Gr=1e5
 * const Ri = calculateRichardsonNumber(1e5, 20000);
 * // Ri = 0.00025 << 0.1 → Forcée dominante
 * 
 * @example
 * // Air calme: Re=100, Gr=1e6
 * const Ri = calculateRichardsonNumber(1e6, 100);
 * // Ri = 100 >> 10 → Naturelle dominante
 */
function calculateRichardsonNumber(Gr, Re) {
  // Validation
  if (typeof Gr !== 'number' || !isFinite(Gr) || Gr < 0) {
    throw new Error(`Nombre de Grashof invalide: ${Gr}`);
  }
  if (typeof Re !== 'number' || !isFinite(Re) || Re <= 0) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  
  // Richardson: Ri = Gr / Re²
  const Ri = Gr / (Re * Re);
  
  return Ri;
}

/**
 * Sélectionne automatiquement entre convection forcée, naturelle et mixte.
 * 
 * Utilise le nombre de Richardson (Ri = Gr/Re²) comme critère standard:
 * - Ri < 0.1: Convection forcée dominante → Churchill-Bernstein
 * - 0.1 ≤ Ri ≤ 10: Convection mixte → Formule combinée (Churchill 1977)
 * - Ri > 10: Convection naturelle dominante → Churchill & Chu
 * 
 * Pour le régime mixte, on utilise la formule de superposition:
 * Nu = (Nu_forcée^n + Nu_naturelle^n)^(1/n) avec n=3
 * 
 * Cette approche est plus rigoureuse que le critère arbitraire Re² vs Gr.
 * 
 * Références:
 * - Churchill, S.W. (1977), AIChE J. 23, 10-16
 * - Incropera & DeWitt (2011), "Heat Transfer", 7th Ed., Section 9.6
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} Pr - Nombre de Prandtl [sans dimension]
 * @param {number} [Gr=0] - Nombre de Grashof [sans dimension] (optionnel)
 * @returns {number} Nombre de Nusselt [sans dimension]
 * 
 * @example
 * // Avec vent fort (Re élevé): Ri << 0.1
 * const Nu = nusseltExternal(20000, 0.715, 1e5);
 * // Convection forcée dominante
 * 
 * @example
 * // Air calme (Re faible): Ri >> 10
 * const Nu = nusseltExternal(100, 0.715, 1e6);
 * // Convection naturelle dominante
 * 
 * @example
 * // Vent faible (Re modéré): 0.1 < Ri < 10
 * const Nu = nusseltExternal(1000, 0.715, 5e5);
 * // Convection mixte (formule combinée)
 */
function nusseltExternal(Re, Pr, Gr = 0) {
  // Si Gr non fourni, assume forcée pure
  if (Gr === 0) {
    return nusseltChurchillBernstein(Re, Pr);
  }
  
  // Calcul Richardson Number
  const Ri = calculateRichardsonNumber(Gr, Re);
  
  // Critères standards basés sur Richardson
  if (Ri < 0.1) {
    // Convection forcée dominante
    return nusseltChurchillBernstein(Re, Pr);
    
  } else if (Ri > 10) {
    // Convection naturelle dominante
    const Ra = Gr * Pr;
    return nusseltNaturalConvectionCylinder(Ra, Pr);
    
  } else {
    // Convection mixte (0.1 ≤ Ri ≤ 10)
    console.warn(
      `Convection mixte détectée (Ri=${Ri.toFixed(3)} entre 0.1 et 10). ` +
      `Utilisation formule combinée Churchill (1977).`
    );
    
    // Formule de superposition avec n=3 (Churchill 1977)
    const Nu_forced = nusseltChurchillBernstein(Re, Pr);
    const Ra = Gr * Pr;
    const Nu_natural = nusseltNaturalConvectionCylinder(Ra, Pr);
    
    const n = 3;
    const Nu = Math.pow(Math.pow(Nu_forced, n) + Math.pow(Nu_natural, n), 1.0 / n);
    
    return Nu;
  }
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.NusseltExternal = {
    nusseltChurchillBernstein,
    nusseltHilpert,
    nusseltNaturalConvectionCylinder,
    calculateRayleigh,
    calculateRichardsonNumber,
    nusseltExternal
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    nusseltChurchillBernstein,
    nusseltHilpert,
    nusseltNaturalConvectionCylinder,
    calculateRayleigh,
    calculateRichardsonNumber,
    nusseltExternal
  };
}

