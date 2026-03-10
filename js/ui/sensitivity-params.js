/**
 * sensitivity-params.js
 *
 * Définitions partagées des paramètres pour les analyses de sensibilité 1D et 2D.
 *
 * Fournit PARAMETER_DEFINITIONS et getParameterLabel() utilisés par
 * sensitivity-analysis.js et sensitivity-analysis-1d.js.
 *
 * @module sensitivity-params
 */

(function () {
  'use strict';

  /**
   * Retourne le libellé traduit d'un paramètre de sensibilité
   *
   * @param {string} key - Clé du paramètre (L, m_dot, T_in, T_amb, V_wind)
   * @returns {string} Libellé traduit ou la clé brute si I18n indisponible
   */
  function getParameterLabel(key) {
    if (!window.I18n) {
      return key;
    }
    const labels = {
      L: 'sensitivityTable.pipeLength',
      m_dot: 'sensitivityTable.waterFlow',
      T_in: 'sensitivityTable.waterTempIn',
      T_amb: 'sensitivityTable.airTemp',
      V_wind: 'sensitivityTable.windSpeed',
    };
    return I18n.t(labels[key] || key);
  }

  /**
   * Définitions des paramètres analysables en sensibilité
   *
   * Chaque paramètre contient:
   * - label: libellé traduit (getter dynamique)
   * - unit: unité d'affichage
   * - path: chemin dans l'objet config pour accéder à la valeur
   * - min/max: bornes de la plage autorisée
   * - convertToSI/convertFromSI: fonctions de conversion (optionnel)
   * - conditional: true si le paramètre n'est pas toujours disponible (optionnel)
   */
  const PARAMETER_DEFINITIONS = {
    L: {
      get label() {
        return getParameterLabel('L');
      },
      unit: 'm',
      path: ['totalLength'],
      min: 1,
      max: 2500,
    },
    m_dot: {
      get label() {
        return getParameterLabel('m_dot');
      },
      get unit() {
        return window.UnitConverter ? UnitConverter.getUnitInfo('flowRate').label : 'm³/h';
      },
      path: ['meta', 'flowM3PerHr'],
      get min() {
        return window.UnitConverter ? UnitConverter.getRanges('flowRate').min : 0.06;
      },
      get max() {
        return window.UnitConverter ? UnitConverter.getRanges('flowRate').max : 30;
      },
      convertToSI: (value) =>
        window.UnitConverter ? UnitConverter.toSI('flowRate', value) : value,
      convertFromSI: (value) =>
        window.UnitConverter ? UnitConverter.fromSI('flowRate', value) : value,
    },
    T_in: {
      get label() {
        return getParameterLabel('T_in');
      },
      unit: '°C',
      path: ['fluid', 'T_in'],
      min: 1,
      max: 100,
    },
    T_amb: {
      get label() {
        return getParameterLabel('T_amb');
      },
      unit: '°C',
      path: ['ambient', 'T_amb'],
      min: -40,
      max: 50,
    },
    V_wind: {
      get label() {
        return getParameterLabel('V_wind');
      },
      unit: 'km/h',
      path: ['ambient', 'V_wind'],
      min: 0,
      max: 108,
    },
    t_insul: {
      label: 'Épaisseur isolation', // Pas traduit pour l'instant
      unit: 'mm',
      path: ['insulation', 'thickness'],
      conditional: true, // Seulement si isolation active
      min: 5,
      max: 100,
    },
  };

  // ====================================================================
  // EXPORTS
  // ====================================================================

  // Export pour navigateur (window global)
  if (typeof window !== 'undefined') {
    window.SensitivityParams = {
      PARAMETER_DEFINITIONS,
      getParameterLabel,
    };
  }

  // Export pour Node.js (tests et modules)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PARAMETER_DEFINITIONS,
      getParameterLabel,
    };
  }
})();
