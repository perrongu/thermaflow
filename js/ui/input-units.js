/**
 * input-units.js
 *
 * Unit management logic extracted from input-form.js.
 *
 * Exported as window.InputUnits (browser) + module.exports (Node.js tests).
 *
 * Public API:
 *   loadUnitPreferences()        — load unit preferences from localStorage
 *   applyUnitPreferences()       — apply current units to DOM dropdowns
 *   attachUnitChangeEvents()     — attach change listeners to unit selectors
 *   handleUnitChange(paramType, newUnit, inputId, onAnalysis)
 *                                — handle unit selector change
 *   updateInputRanges()          — update min/max on inputs based on current units
 *   saveUnitPreferences()        — save current units to localStorage
 *
 * Note: handleUnitChange accepts an optional onAnalysis callback so that
 * input-form.js can inject triggerAnalysis without creating a circular
 * dependency.
 */

(function () {
  'use strict';

  // ========== UNITÉS COURANTES (état interne du module) ==========

  let currentUnits = {
    flowRate: 'm3_h',
    pressure: 'kPag',
  };

  // ========== HELPERS: résolution des dépendances globales ==========

  function _unitConverter() {
    return (
      (typeof UnitConverter !== 'undefined' && UnitConverter) ||
      (typeof window !== 'undefined' && window.UnitConverter) ||
      null
    );
  }

  function _storage() {
    return (
      (typeof Storage !== 'undefined' &&
        Storage &&
        typeof Storage.load === 'function' &&
        Storage) ||
      (typeof window !== 'undefined' &&
        window.Storage &&
        typeof window.Storage.load === 'function' &&
        window.Storage) ||
      null
    );
  }

  // ========== CHARGEMENT PRÉFÉRENCES ==========

  const ALLOWED_FLOW_UNITS = ['m3_h', 'usgpm'];
  const ALLOWED_PRESSURE_UNITS = ['kPag', 'psig'];

  /**
   * Load unit preferences from localStorage and apply them to the
   * UnitConverter instance.
   */
  function loadUnitPreferences() {
    const storage = _storage();
    if (!storage) {
      return;
    }

    const savedData = storage.load();
    if (savedData && savedData.unitPreferences) {
      const prefs = savedData.unitPreferences;
      const validatedPrefs = {};

      if (prefs.flowRate !== undefined) {
        if (ALLOWED_FLOW_UNITS.indexOf(prefs.flowRate) !== -1) {
          validatedPrefs.flowRate = prefs.flowRate;
        }
      }

      if (prefs.pressure !== undefined) {
        if (ALLOWED_PRESSURE_UNITS.indexOf(prefs.pressure) !== -1) {
          validatedPrefs.pressure = prefs.pressure;
        }
      }

      currentUnits = { ...currentUnits, ...validatedPrefs };
      const uc = _unitConverter();
      if (uc && uc.loadPreferences) {
        uc.loadPreferences(validatedPrefs);
      }
    }
  }

  // ========== APPLICATION PRÉFÉRENCES ==========

  /**
   * Apply currentUnits to the flow-unit and pressure-unit dropdowns,
   * then refresh input ranges.
   */
  function applyUnitPreferences() {
    const flowUnitSelect = document.getElementById('flow-unit');
    const pressureUnitSelect = document.getElementById('pressure-unit');

    if (flowUnitSelect) {
      flowUnitSelect.value = currentUnits.flowRate;
    }
    if (pressureUnitSelect) {
      pressureUnitSelect.value = currentUnits.pressure;
    }

    updateInputRanges();
  }

  // ========== ATTACHER ÉVÉNEMENTS UNITÉS ==========

  /**
   * Attach change listeners to the flow-unit and pressure-unit selectors.
   *
   * @param {Function} [onAnalysis] — optional callback invoked after a unit
   *   change to trigger a recalculation (avoids circular dependency on
   *   input-form.js).
   */
  function attachUnitChangeEvents(onAnalysis) {
    const flowUnitSelect = document.getElementById('flow-unit');
    const pressureUnitSelect = document.getElementById('pressure-unit');

    if (flowUnitSelect) {
      flowUnitSelect.addEventListener('change', function () {
        handleUnitChange('flowRate', this.value, 'water-flow', onAnalysis);
      });
    }

    if (pressureUnitSelect) {
      pressureUnitSelect.addEventListener('change', function () {
        handleUnitChange('pressure', this.value, 'water-pressure', onAnalysis);
      });
    }
  }

  // ========== GÉRER CHANGEMENT D'UNITÉ ==========

  /**
   * Convert the current value of an input to the new unit and update
   * min/max ranges accordingly.
   *
   * @param {string} paramType   — 'flowRate' or 'pressure'
   * @param {string} newUnit     — newly selected unit identifier
   * @param {string} inputId     — DOM id of the associated input
   * @param {Function} [onAnalysis] — optional callback to trigger recalculation
   */
  function handleUnitChange(paramType, newUnit, inputId, onAnalysis) {
    const input = document.getElementById(inputId);
    if (!input) {
      return;
    }

    const uc = _unitConverter();
    if (!uc) {
      return;
    }

    const oldUnit = currentUnits[paramType];
    const currentValue = parseFloat(input.value);

    if (isNaN(currentValue)) {
      currentUnits = { ...currentUnits, [paramType]: newUnit };
      uc.setUnit(paramType, newUnit);
      updateInputRanges();
      saveUnitPreferences();
      return;
    }

    const convertedValue = uc.convert(paramType, currentValue, oldUnit, newUnit);
    input.value = convertedValue.toFixed(uc.getUnitInfo(paramType, newUnit).decimals);

    currentUnits = { ...currentUnits, [paramType]: newUnit };
    uc.setUnit(paramType, newUnit);

    updateInputRanges();
    saveUnitPreferences();

    if (typeof onAnalysis === 'function') {
      onAnalysis({ priority: 'high', reason: 'unit-change' });
    }
  }

  // ========== MISE À JOUR PLAGES MIN/MAX ==========

  /**
   * Update min, max, and step on the water-flow and water-pressure inputs
   * based on the ranges reported by UnitConverter for the current unit.
   */
  function updateInputRanges() {
    const uc = _unitConverter();
    if (!uc) {
      return;
    }

    const flowInput = document.getElementById('water-flow');
    if (flowInput) {
      const flowRanges = uc.getRanges('flowRate');
      flowInput.min = flowRanges.min.toFixed(flowRanges.decimals);
      flowInput.max = flowRanges.max.toFixed(flowRanges.decimals);
      flowInput.step = (flowRanges.max - flowRanges.min) / 1000;
    }

    const pressureInput = document.getElementById('water-pressure');
    if (pressureInput) {
      const pressureRanges = uc.getRanges('pressure');
      pressureInput.min = pressureRanges.min.toFixed(pressureRanges.decimals);
      pressureInput.max = pressureRanges.max.toFixed(pressureRanges.decimals);
      pressureInput.step = currentUnits.pressure === 'psig' ? '1' : '10';
    }
  }

  // ========== SAUVEGARDE PRÉFÉRENCES ==========

  /**
   * Persist currentUnits into localStorage via the Storage module.
   */
  function saveUnitPreferences() {
    const storage = _storage();
    if (!storage) {
      return;
    }

    const savedData = storage.load();
    if (savedData) {
      const updated = { ...savedData, unitPreferences: { ...currentUnits } };
      storage.save(updated);
    }
  }

  // ========== EXPORT ==========

  const InputUnits = {
    loadUnitPreferences,
    applyUnitPreferences,
    attachUnitChangeEvents,
    handleUnitChange,
    updateInputRanges,
    saveUnitPreferences,
    // Expose currentUnits accessor for input-form.js to read the state
    getCurrentUnits: () => ({ ...currentUnits }),
  };

  if (typeof window !== 'undefined') {
    window.InputUnits = InputUnits;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputUnits;
  }
})();
