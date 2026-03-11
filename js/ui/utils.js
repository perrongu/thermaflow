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

  // ========== DEEP COPY ==========
  /**
   * Deep copy using structuredClone with JSON fallback.
   * @param {*} obj - Object to copy
   * @returns {*} Deep copy of the object
   */
  function deepCopy(obj) {
    if (typeof structuredClone === 'function') {
      return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
  }

  // ========== VALIDATION INLINE ==========
  /**
   * Shows a validation error message next to an input field.
   * @param {HTMLElement} inputElement - The input element
   * @param {string} message - Error message to display
   * @returns {{ clear: Function }} Object with clear() method
   */
  function showValidationError(inputElement, message) {
    if (!inputElement || typeof document === 'undefined') {
      return { clear: function () {} };
    }
    inputElement.classList.add('param-input--invalid');
    let errorDiv = inputElement.parentNode
      ? inputElement.parentNode.querySelector('.validation-error')
      : null;
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error';
      if (inputElement.parentNode) {
        inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
      }
    }
    errorDiv.textContent = message;
    return {
      clear: function () {
        inputElement.classList.remove('param-input--invalid');
        if (errorDiv && errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      },
    };
  }

  /**
   * Clears all validation errors on the page.
   */
  function clearValidationErrors() {
    if (typeof document === 'undefined') {
      return;
    }
    const errors = document.querySelectorAll('.validation-error');
    errors.forEach(function (el) {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    const invalids = document.querySelectorAll('.param-input--invalid');
    invalids.forEach(function (el) {
      el.classList.remove('param-input--invalid');
    });
  }

  /**
   * Shows a dismissible error banner at the top of the page.
   * @param {string} message - Error message to display
   */
  function showBannerError(message) {
    if (typeof document === 'undefined') {
      return;
    }
    // Remove existing banner if any
    const existing = document.querySelector('.banner-error');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const banner = document.createElement('div');
    banner.className = 'banner-error';
    banner.textContent = message;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'banner-error__close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', function () {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    });
    banner.appendChild(closeBtn);
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ========== HTML ESCAPING ==========
  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ========== EXPORT ==========
  window.UIUtils = {
    debounce,
    getInsulationI18nKey,
    deepCopy,
    escHtml,
    showValidationError,
    clearValidationErrors,
    showBannerError,
  };
})();

// Node.js dual export for tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.UIUtils;
}
