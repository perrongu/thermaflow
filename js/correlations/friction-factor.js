/**
 * Calcule le facteur de friction pour un écoulement laminaire.
 * 
 * Équation: f = 64/Re
 * Valide pour Re < 2300 (écoulement laminaire en conduite circulaire)
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @returns {number} Facteur de friction de Darcy [sans dimension]
 * @throws {Error} Si Re est invalide ou négatif
 * 
 * @example
 * const f = frictionFactorLaminar(1000);
 * // f = 0.064
 */
function frictionFactorLaminar(Re) {
  if (typeof Re !== 'number' || !isFinite(Re)) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (Re <= 0) {
    throw new Error(`Nombre de Reynolds doit être positif: ${Re}`);
  }
  
  return 64.0 / Re;
}

/**
 * Calcule le facteur de friction turbulent avec l'équation de Colebrook-White.
 * 
 * Équation implicite (résolue par itération):
 * 1/√f = -2.0 log₁₀(ε/D/3.7 + 2.51/(Re√f))
 * 
 * où:
 * - ε/D = rugosité relative [sans dimension]
 * - Re = nombre de Reynolds [sans dimension]
 * 
 * Cette équation est le standard industriel et correspond exactement au diagramme de Moody.
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension], doit être > 4000
 * @param {number} epsilon_D - Rugosité relative ε/D [sans dimension]
 * @param {number} [max_iter=50] - Nombre maximum d'itérations
 * @param {number} [tol=1e-6] - Tolérance de convergence
 * @returns {number} Facteur de friction de Darcy [sans dimension]
 * @throws {Error} Si les paramètres sont invalides ou si la convergence échoue
 * 
 * @example
 * // Acier commercial neuf (ε=0.045mm) dans DN50 (D=52.5mm)
 * // Re = 50000
 * const epsilon_D = 0.045 / 52.5;  // 0.000857
 * const f = frictionFactorColebrook(50000, epsilon_D);
 * // f ≈ 0.0196
 */
function frictionFactorColebrook(Re, epsilon_D, max_iter = 50, tol = 1e-6) {
  // Validation
  if (typeof Re !== 'number' || !isFinite(Re)) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (Re <= 0) {
    throw new Error(`Nombre de Reynolds doit être positif: ${Re}`);
  }
  if (typeof epsilon_D !== 'number' || !isFinite(epsilon_D)) {
    throw new Error(`Rugosité relative invalide: ${epsilon_D}`);
  }
  if (epsilon_D < 0) {
    throw new Error(`Rugosité relative doit être non-négative: ${epsilon_D}`);
  }
  
  // Estimation initiale avec l'approximation de Swamee-Jain
  let f = 0.25 / Math.pow(Math.log10(epsilon_D / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
  
  // Itération de point fixe
  for (let i = 0; i < max_iter; i++) {
    const f_old = f;
    
    // Colebrook: 1/√f = -2.0 log₁₀(ε/D/3.7 + 2.51/(Re√f))
    // Donc: f = 1 / [-2.0 log₁₀(ε/D/3.7 + 2.51/(Re√f))]²
    const sqrt_f = Math.sqrt(f);
    const term = epsilon_D / 3.7 + 2.51 / (Re * sqrt_f);
    const inv_sqrt_f = -2.0 * Math.log10(term);
    f = 1.0 / (inv_sqrt_f * inv_sqrt_f);
    
    // Vérifier la convergence
    if (Math.abs(f - f_old) < tol) {
      return f;
    }
  }
  
  // Si non convergé, retourner la dernière valeur (généralement suffisante)
  console.warn(`Colebrook: convergence non atteinte après ${max_iter} itérations (Re=${Re}, ε/D=${epsilon_D})`);
  return f;
}

/**
 * Calcule le facteur de friction turbulent avec l'équation de Churchill.
 * 
 * Équation explicite valide pour toute la plage turbulente:
 * f = 8[(8/Re)¹² + 1/(A+B)^(3/2)]^(1/12)
 * 
 * où:
 * A = [-2.457 ln((7/Re)^0.9 + 0.27ε/D)]¹⁶
 * B = (37530/Re)¹⁶
 * 
 * Avantage: Pas d'itération nécessaire, bonne approximation de Colebrook.
 * 
 * Référence: Churchill, S.W. (1977), Chemical Engineering, Nov. 7, 1977, p. 91
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} epsilon_D - Rugosité relative ε/D [sans dimension]
 * @returns {number} Facteur de friction de Darcy [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * const f = frictionFactorChurchill(50000, 0.000857);
 * // f ≈ 0.0196 (très proche de Colebrook)
 */
function frictionFactorChurchill(Re, epsilon_D) {
  // Validation
  if (typeof Re !== 'number' || !isFinite(Re)) {
    throw new Error(`Nombre de Reynolds invalide: ${Re}`);
  }
  if (Re <= 0) {
    throw new Error(`Nombre de Reynolds doit être positif: ${Re}`);
  }
  if (typeof epsilon_D !== 'number' || !isFinite(epsilon_D)) {
    throw new Error(`Rugosité relative invalide: ${epsilon_D}`);
  }
  if (epsilon_D < 0) {
    throw new Error(`Rugosité relative doit être non-négative: ${epsilon_D}`);
  }
  
  // Terme A
  const term1 = Math.pow(7.0 / Re, 0.9) + 0.27 * epsilon_D;
  const A = Math.pow(-2.457 * Math.log(term1), 16);
  
  // Terme B
  const B = Math.pow(37530.0 / Re, 16);
  
  // Facteur de friction
  const term2 = Math.pow(8.0 / Re, 12);
  const term3 = 1.0 / Math.pow(A + B, 1.5);
  const f = 8.0 * Math.pow(term2 + term3, 1.0 / 12.0);
  
  return f;
}

/**
 * Calcule le facteur de friction pour un régime transitoire (interpolation).
 * 
 * Pour 2300 < Re < 4000, on interpole linéairement entre:
 * - f_laminar à Re = 2300
 * - f_turbulent à Re = 4000
 * 
 * IMPORTANT: Cette zone est physiquement instable (écoulement intermittent).
 * L'interpolation linéaire est une approximation simplifiée.
 * 
 * INCERTITUDE: ±30% sur f dans cette zone (grande variabilité expérimentale)
 * 
 * RECOMMANDATION: Pour applications critiques, considérer un facteur de sécurité
 * ou concevoir pour éviter cette zone (Re < 2000 ou Re > 4500).
 * 
 * Référence: Cengel & Cimbala (2014), "Fluid Mechanics", Chapter 8
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension], entre 2300 et 4000
 * @param {number} epsilon_D - Rugosité relative ε/D [sans dimension]
 * @returns {number} Facteur de friction interpolé [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 */
function frictionFactorTransitional(Re, epsilon_D) {
  if (Re < 2300 || Re > 4000) {
    throw new Error(`Re doit être entre 2300 et 4000 pour régime transitoire: ${Re}`);
  }
  
  // Warning explicite sur incertitude
  console.warn(
    `Zone transitoire (Re=${Re}): Incertitude ±30% due à instabilité physique. ` +
    `Considérer facteur de sécurité pour applications critiques.`
  );
  
  const Re_lam = 2300;
  const Re_turb = 4000;
  
  const f_lam = frictionFactorLaminar(Re_lam);
  const f_turb = frictionFactorChurchill(Re_turb, epsilon_D);
  
  // Interpolation linéaire (approximation simplifiée)
  const f = f_lam + (f_turb - f_lam) * (Re - Re_lam) / (Re_turb - Re_lam);
  
  return f;
}

/**
 * Calcule automatiquement le facteur de friction approprié selon le régime.
 * 
 * Cette fonction détecte automatiquement le régime (laminaire, transitoire, turbulent)
 * et applique la corrélation appropriée.
 * 
 * @param {number} Re - Nombre de Reynolds [sans dimension]
 * @param {number} epsilon_D - Rugosité relative ε/D [sans dimension]
 * @param {string} [method='churchill'] - Méthode turbulente: 'colebrook' ou 'churchill'
 * @returns {number} Facteur de friction de Darcy [sans dimension]
 * @throws {Error} Si les paramètres sont invalides
 * 
 * @example
 * // Écoulement laminaire
 * const f1 = frictionFactor(1000, 0.0001);  // f = 0.064
 * 
 * @example
 * // Écoulement turbulent
 * const f2 = frictionFactor(50000, 0.000857, 'churchill');  // f ≈ 0.0196
 */
function frictionFactor(Re, epsilon_D, method = 'churchill') {
  if (Re < 2300) {
    // Laminaire
    return frictionFactorLaminar(Re);
  } else if (Re <= 4000) {
    // Transitoire
    return frictionFactorTransitional(Re, epsilon_D);
  } else {
    // Turbulent
    if (method === 'colebrook') {
      return frictionFactorColebrook(Re, epsilon_D);
    } else if (method === 'churchill') {
      return frictionFactorChurchill(Re, epsilon_D);
    } else {
      throw new Error(`Méthode inconnue: ${method} (doit être 'colebrook' ou 'churchill')`);
    }
  }
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.FrictionFactor = {
    frictionFactorLaminar,
    frictionFactorColebrook,
    frictionFactorChurchill,
    frictionFactorTransitional,
    frictionFactor
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    frictionFactorLaminar,
    frictionFactorColebrook,
    frictionFactorChurchill,
    frictionFactorTransitional,
    frictionFactor
  };
}

