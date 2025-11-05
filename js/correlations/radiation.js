/**
 * Constante de Stefan-Boltzmann [W/(m²·K⁴)]
 * σ = 5.670374419×10⁻⁸ W/(m²·K⁴)
 */
const STEFAN_BOLTZMANN = 5.670374419e-8;

/**
 * Calcule le flux radiatif selon la loi de Stefan-Boltzmann.
 *
 * Q = ε × σ × A × (T_surf⁴ - T_amb⁴)
 *
 * @param {number} epsilon - Émissivité de la surface [sans dimension, 0-1]
 * @param {number} A - Aire de la surface [m²]
 * @param {number} T_surf_K - Température de surface [K]
 * @param {number} T_amb_K - Température ambiante [K]
 * @returns {number} Flux thermique radiatif [W]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Surface acier oxydé (ε=0.79), A=1m², T_surf=60°C, T_amb=-10°C
 * const Q = radiativeHeatTransfer(0.79, 1.0, 333.15, 263.15);
 * // Q ≈ 230 W
 */
function radiativeHeatTransfer(epsilon, A, T_surf_K, T_amb_K) {
  // Validation
  if (typeof epsilon !== 'number' || !isFinite(epsilon)) {
    throw new Error(`Émissivité invalide: ${epsilon}`);
  }
  if (epsilon < 0 || epsilon > 1) {
    throw new Error(`Émissivité doit être entre 0 et 1: ${epsilon}`);
  }
  if (typeof A !== 'number' || !isFinite(A) || A <= 0) {
    throw new Error(`Aire invalide: ${A}`);
  }
  if (typeof T_surf_K !== 'number' || !isFinite(T_surf_K) || T_surf_K <= 0) {
    throw new Error(`Température de surface invalide: ${T_surf_K} K (doit être > 0 K)`);
  }
  if (typeof T_amb_K !== 'number' || !isFinite(T_amb_K) || T_amb_K <= 0) {
    throw new Error(`Température ambiante invalide: ${T_amb_K} K (doit être > 0 K)`);
  }

  // Loi de Stefan-Boltzmann
  const T_surf_4 = Math.pow(T_surf_K, 4);
  const T_amb_4 = Math.pow(T_amb_K, 4);
  const Q = epsilon * STEFAN_BOLTZMANN * A * (T_surf_4 - T_amb_4);

  return Q;
}

/**
 * Calcule le coefficient de transfert radiatif linéarisé.
 *
 * On linéarise la loi de Stefan-Boltzmann:
 * Q = ε σ A (T_s⁴ - T_∞⁴) ≈ h_rad A (T_s - T_∞)
 *
 * Donc:
 * h_rad = ε σ (T_s + T_∞)(T_s² + T_∞²)
 * h_rad = ε σ (T_s² + T_∞²)(T_s + T_∞)
 *
 * Cette linéarisation permet d'additionner h_rad et h_conv pour obtenir h_total.
 *
 * LIMITES DE VALIDITÉ (erreur de linéarisation):
 * - ΔT < 100K: Erreur < 5% (recommandé) ✓
 * - 100K < ΔT < 150K: Erreur 5-10% (acceptable avec réserve)
 * - ΔT > 150K: Erreur > 10% (utiliser formule exacte σ(T₁⁴-T₂⁴))
 *
 * Pour ThermaFlow (gel): ΔT typique 30-80K → Erreur < 3% ✓
 *
 * Référence: Incropera & DeWitt, "Heat Transfer", 7th Ed., Section 1.3
 *
 * @param {number} T_surf_K - Température de surface [K]
 * @param {number} T_amb_K - Température ambiante [K]
 * @param {number} epsilon - Émissivité de la surface [sans dimension, 0-1]
 * @returns {number} Coefficient de transfert radiatif [W/(m²·K)]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * // Acier oxydé (ε=0.79) entre 60°C et -10°C
 * const h_rad = radiationCoefficient(333.15, 263.15, 0.79);
 * // h_rad ≈ 5.2 W/(m²·K)
 */
function radiationCoefficient(T_surf_K, T_amb_K, epsilon) {
  // Validation
  if (typeof T_surf_K !== 'number' || !isFinite(T_surf_K) || T_surf_K <= 0) {
    throw new Error(`Température de surface invalide: ${T_surf_K} K`);
  }
  if (typeof T_amb_K !== 'number' || !isFinite(T_amb_K) || T_amb_K <= 0) {
    throw new Error(`Température ambiante invalide: ${T_amb_K} K`);
  }
  if (typeof epsilon !== 'number' || !isFinite(epsilon)) {
    throw new Error(`Émissivité invalide: ${epsilon}`);
  }
  if (epsilon < 0 || epsilon > 1) {
    throw new Error(`Émissivité doit être entre 0 et 1: ${epsilon}`);
  }

  // Vérifier ΔT pour warning sur erreur de linéarisation
  // Note: Messages désactivés pour éviter la pollution de la console lors des analyses de sensibilité
  // const delta_T = Math.abs(T_surf_K - T_amb_K);
  // if (delta_T > 150) {
  //   console.warn(
  //     `Radiation linéarisée: ΔT=${delta_T.toFixed(0)}K > 150K, ` +
  //     `erreur >10%. Considérer calcul exact σ(T₁⁴-T₂⁴) pour précision.`
  //   );
  // } else if (delta_T > 100) {
  //   console.warn(
  //     `Radiation linéarisée: ΔT=${delta_T.toFixed(0)}K > 100K, ` +
  //     `erreur 5-10%. Acceptable mais vérifier si précision suffisante.`
  //   );
  // }

  // Linéarisation: h_rad = ε σ (T_s + T_∞)(T_s² + T_∞²)
  const T_sum = T_surf_K + T_amb_K;
  const T_surf_sq = T_surf_K * T_surf_K;
  const T_amb_sq = T_amb_K * T_amb_K;
  const T_sq_sum = T_surf_sq + T_amb_sq;

  const h_rad = epsilon * STEFAN_BOLTZMANN * T_sum * T_sq_sum;

  return h_rad;
}

/**
 * Calcule le coefficient de transfert total (convection + rayonnement).
 *
 * h_total = h_conv + h_rad
 *
 * Cette approximation est valide lorsque le rayonnement est linéarisé.
 *
 * @param {number} h_conv - Coefficient de convection [W/(m²·K)]
 * @param {number} h_rad - Coefficient de rayonnement [W/(m²·K)]
 * @returns {number} Coefficient de transfert total [W/(m²·K)]
 * @throws {Error} Si les paramètres sont invalides
 *
 * @example
 * const h_total = totalHeatTransferCoefficient(20, 5.2);
 * // h_total = 25.2 W/(m²·K)
 */
function totalHeatTransferCoefficient(h_conv, h_rad) {
  if (typeof h_conv !== 'number' || !isFinite(h_conv) || h_conv < 0) {
    throw new Error(`Coefficient de convection invalide: ${h_conv}`);
  }
  if (typeof h_rad !== 'number' || !isFinite(h_rad) || h_rad < 0) {
    throw new Error(`Coefficient de rayonnement invalide: ${h_rad}`);
  }

  return h_conv + h_rad;
}

/**
 * Convertit température Celsius en Kelvin.
 *
 * @param {number} T_C - Température [°C]
 * @returns {number} Température [K]
 * @throws {Error} Si la température est invalide
 *
 * @example
 * const T_K = celsiusToKelvin(20);
 * // T_K = 293.15 K
 */
function celsiusToKelvin(T_C) {
  if (typeof T_C !== 'number' || !isFinite(T_C)) {
    throw new Error(`Température invalide: ${T_C}`);
  }
  if (T_C < -273.15) {
    throw new Error(`Température en dessous du zéro absolu: ${T_C}°C`);
  }
  return T_C + 273.15;
}

/**
 * Convertit température Kelvin en Celsius.
 *
 * @param {number} T_K - Température [K]
 * @returns {number} Température [°C]
 * @throws {Error} Si la température est invalide
 *
 * @example
 * const T_C = kelvinToCelsius(293.15);
 * // T_C = 20°C
 */
function kelvinToCelsius(T_K) {
  if (typeof T_K !== 'number' || !isFinite(T_K)) {
    throw new Error(`Température invalide: ${T_K}`);
  }
  if (T_K < 0) {
    throw new Error(`Température négative en Kelvin: ${T_K} K`);
  }
  return T_K - 273.15;
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

/**
 * Calcule le coefficient de rayonnement pour une conduite cylindrique.
 *
 * Version simplifiée qui combine le calcul du coefficient radiatif
 * avec la géométrie de la conduite.
 *
 * @param {number} T_surf_C - Température de surface [°C]
 * @param {number} T_amb_C - Température ambiante [°C]
 * @param {number} epsilon - Émissivité [sans dimension, 0-1]
 * @returns {number} Coefficient de rayonnement [W/(m²·K)]
 *
 * @example
 * const h_rad = radiationCoefficientSimple(60, -10, 0.79);
 * // h_rad ≈ 5.2 W/(m²·K)
 */
function radiationCoefficientSimple(T_surf_C, T_amb_C, epsilon) {
  const T_surf_K = celsiusToKelvin(T_surf_C);
  const T_amb_K = celsiusToKelvin(T_amb_C);
  return radiationCoefficient(T_surf_K, T_amb_K, epsilon);
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.Radiation = {
    STEFAN_BOLTZMANN,
    radiativeHeatTransfer,
    radiationCoefficient,
    totalHeatTransferCoefficient,
    celsiusToKelvin,
    kelvinToCelsius,
    cylinderSurfaceArea,
    radiationCoefficientSimple,
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STEFAN_BOLTZMANN,
    radiativeHeatTransfer,
    radiationCoefficient,
    totalHeatTransferCoefficient,
    celsiusToKelvin,
    kelvinToCelsius,
    cylinderSurfaceArea,
    radiationCoefficientSimple,
  };
}
