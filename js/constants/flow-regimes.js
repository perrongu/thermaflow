/**
 * flow-regimes.js
 *
 * Constantes définissant les limites de régimes d'écoulement.
 *
 * Ces valeurs sont utilisées de manière cohérente dans tous les modules
 * (hydrodynamique, thermique, etc.) pour garantir l'uniformité des calculs.
 *
 * SOURCE DE VÉRITÉ UNIQUE pour les transitions de régime.
 *
 * @module flow-regimes
 */

// ====================================================================
// LIMITES DE RÉGIMES D'ÉCOULEMENT (Perry's Section 6-3)
// ====================================================================

/**
 * Limite supérieure du régime laminaire.
 * Pour Re < RE_LAMINAR_MAX: écoulement laminaire garanti.
 *
 * Référence: Perry's Chemical Engineers' Handbook, Section 6-3
 * Valeur standard en ingénierie: 2300
 */
const RE_LAMINAR_MAX = 2300;

/**
 * Début de la zone de transition.
 * Identique à RE_LAMINAR_MAX par définition.
 */
const RE_TRANSITION_START = 2300;

/**
 * Fin de la zone de transition / début du régime turbulent.
 * Pour Re > RE_TURBULENT_MIN: écoulement turbulent garanti.
 *
 * Zone de transition: 2300 < Re < 4000
 * Cette zone est physiquement instable (écoulement intermittent).
 *
 * Référence: Perry's Chemical Engineers' Handbook, Section 6-3
 * Valeur standard en ingénierie: 4000
 */
const RE_TURBULENT_MIN = 4000;

/**
 * Fin de la zone de transition.
 * Identique à RE_TURBULENT_MIN par définition.
 */
const RE_TRANSITION_END = 4000;

// ====================================================================
// EXPORTS
// ====================================================================

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.FlowRegimes = {
    RE_LAMINAR_MAX,
    RE_TRANSITION_START,
    RE_TRANSITION_END,
    RE_TURBULENT_MIN,
  };
}

// Export pour Node.js (tests et modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RE_LAMINAR_MAX,
    RE_TRANSITION_START,
    RE_TRANSITION_END,
    RE_TURBULENT_MIN,
  };
}
