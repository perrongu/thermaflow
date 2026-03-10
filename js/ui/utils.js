/**
 * utils.js
 *
 * Utilitaires réutilisables pour l'interface utilisateur
 *
 * Fonctionnalités:
 * - Debouncing: Retarder l'exécution jusqu'à ce que les appels cessent
 * - Utilitaires i18n: Conversion d'identifiants matériaux d'isolation
 */

(function () {
  'use strict';

  /**
   * Debounce: Retarde l'exécution d'une fonction jusqu'à ce qu'un certain temps
   * se soit écoulé depuis le dernier appel
   *
   * @param {Function} func - Fonction à debouncer
   * @param {number} delay - Délai en millisecondes
   * @returns {Function} Fonction debouncée avec méthode cancel()
   *
   * @example
   * const searchDebounced = debounce((query) => {
   *   performSearch(query);
   * }, 300);
   *
   * input.addEventListener('input', (e) => searchDebounced(e.target.value));
   */
  function debounce(func, delay) {
    let timeoutId = null;

    const debouncedFunction = function (...args) {
      // Annuler le timeout précédent s'il existe
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      // Créer un nouveau timeout
      timeoutId = setTimeout(() => {
        timeoutId = null;
        func.apply(this, args);
      }, delay);
    };

    // Méthode pour annuler le debounce en cours
    debouncedFunction.cancel = function () {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // Méthode pour exécuter immédiatement (bypass le delay)
    debouncedFunction.flush = function (...args) {
      debouncedFunction.cancel();
      func.apply(this, args);
    };

    return debouncedFunction;
  }

  /**
   * Convertit un identifiant technique de matériau d'isolation vers sa clé i18n courte
   *
   * @param {string} technicalId - ID technique (ex: 'polyurethane_foam')
   * @returns {string} Clé i18n courte (ex: 'foam')
   *
   * @example
   * const i18nKey = getInsulationI18nKey('polyurethane_foam');
   * const label = I18n.t(`insulation.materials.${i18nKey}`); // 'Mousse polyuréthane'
   */
  function getInsulationI18nKey(technicalId) {
    const mapping = {
      fiberglass: 'fiberglass',
      mineral_wool: 'rockwool',
      polyurethane_foam: 'foam',
      polystyrene_extruded: 'polystyrene',
      elastomeric_foam: 'elastomeric',
    };
    return mapping[technicalId] || technicalId;
  }

  // ========== EXPORT ==========
  window.UIUtils = {
    debounce,
    getInsulationI18nKey,
  };
})();
