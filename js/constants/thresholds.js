/**
 * thresholds.js
 *
 * Constantes définissant les seuils de température pour la protection au gel.
 *
 * SOURCE DE VÉRITÉ UNIQUE pour les marges de sécurité thermiques.
 *
 * @module thresholds
 */

// ====================================================================
// SEUILS DE TEMPÉRATURE (Standards industriels)
// ====================================================================

/**
 * Marge de sécurité opérationnelle au-dessus du point de gel.
 * Température minimale acceptable pour considérer la conduite comme protégée.
 *
 * Standard industriel: 5°C au-dessus du point de gel (0°C pour l'eau pure).
 *
 * Utilisé par:
 * - app.js: classification du risque (vert/jaune/rouge)
 * - temperature-chart.js: ligne de marge sur le graphique
 * - sensitivity-analysis-1d.js: recherche du point critique sécuritaire
 */
const MARGE_SURETE_GEL = 5; // °C

// ====================================================================
// EXPORTS
// ====================================================================

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.Thresholds = {
    MARGE_SURETE_GEL,
  };
}

// Export pour Node.js (tests et modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MARGE_SURETE_GEL,
  };
}
