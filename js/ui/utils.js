/**
 * utils.js
 * 
 * Utilitaires réutilisables pour l'interface utilisateur
 * 
 * Fonctionnalités:
 * - Debouncing: Retarder l'exécution jusqu'à ce que les appels cessent
 * - Throttling: Limiter la fréquence d'exécution
 * - Promesses annulables pour gérer les calculs asynchrones
 */

(function() {
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
    
    const debouncedFunction = function(...args) {
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
    debouncedFunction.cancel = function() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    // Méthode pour exécuter immédiatement (bypass le delay)
    debouncedFunction.flush = function(...args) {
      debouncedFunction.cancel();
      func.apply(this, args);
    };
    
    return debouncedFunction;
  }

  /**
   * Throttle: Limite l'exécution d'une fonction à une fois par intervalle
   * 
   * @param {Function} func - Fonction à throttler
   * @param {number} interval - Intervalle minimum entre exécutions (ms)
   * @returns {Function} Fonction throttlée
   * 
   * @example
   * const handleScrollThrottled = throttle(() => {
   *   updateScrollPosition();
   * }, 100);
   * 
   * window.addEventListener('scroll', handleScrollThrottled);
   */
  function throttle(func, interval) {
    let lastExecution = 0;
    let timeoutId = null;
    
    return function(...args) {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecution;
      
      // Annuler tout timeout en attente
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (timeSinceLastExecution >= interval) {
        // Exécuter immédiatement si l'intervalle est écoulé
        lastExecution = now;
        func.apply(this, args);
      } else {
        // Planifier l'exécution à la fin de l'intervalle
        const remainingTime = interval - timeSinceLastExecution;
        timeoutId = setTimeout(() => {
          lastExecution = Date.now();
          timeoutId = null;
          func.apply(this, args);
        }, remainingTime);
      }
    };
  }

  /**
   * Crée une promesse annulable
   * 
   * @param {Promise} promise - Promesse à rendre annulable
   * @returns {Object} Objet avec propriétés { promise, cancel }
   * 
   * @example
   * const { promise, cancel } = cancelablePromise(fetchData());
   * 
   * promise
   *   .then(data => console.log(data))
   *   .catch(err => {
   *     if (err.isCanceled) {
   *       console.log('Calcul annulé');
   *     }
   *   });
   * 
   * // Plus tard, si nécessaire
   * cancel();
   */
  function cancelablePromise(promise) {
    let isCanceled = false;
    
    const wrappedPromise = new Promise((resolve, reject) => {
      promise
        .then(value => {
          if (isCanceled) {
            reject({ isCanceled: true, message: 'Promise was canceled' });
          } else {
            resolve(value);
          }
        })
        .catch(error => {
          if (isCanceled) {
            reject({ isCanceled: true, message: 'Promise was canceled' });
          } else {
            reject(error);
          }
        });
    });
    
    return {
      promise: wrappedPromise,
      cancel: () => {
        isCanceled = true;
      }
    };
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
      'fiberglass': 'fiberglass',
      'mineral_wool': 'rockwool',
      'polyurethane_foam': 'foam',
      'polystyrene_extruded': 'polystyrene',
      'elastomeric_foam': 'elastomeric'
    };
    return mapping[technicalId] || technicalId;
  }

  // ========== EXPORT ==========
  window.UIUtils = {
    debounce,
    throttle,
    cancelablePromise,
    getInsulationI18nKey
  };

})();

