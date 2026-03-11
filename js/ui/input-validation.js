/**
 * input-validation.js
 *
 * Validation logic extracted from input-form.js.
 *
 * Exported as window.InputValidation (browser) + module.exports (Node.js tests).
 *
 * Public API:
 *   validateForm(elements)         — returns { valid: boolean, errors: string[] }
 *   validateInputVisual(input)     — adds/removes param-input--invalid CSS class
 *   clampInputValue(input)         — clamps input.value to [min, max]
 *   handleCommaKeypress(event, input) — converts comma keypress to dot
 *   handleCommaPaste(event, input)    — converts comma in pasted text to dot
 */

(function () {
  'use strict';

  // ========== VALIDATION VISUELLE INLINE ==========

  /**
   * Add or remove the invalid CSS class based on whether the value is
   * within the [min, max] range declared on the input element.
   *
   * @param {HTMLInputElement} input
   */
  function validateInputVisual(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    if (isNaN(value) || value < min || value > max) {
      input.classList.add('param-input--invalid');
    } else {
      input.classList.remove('param-input--invalid');
    }
  }

  // ========== CLAMPING VALEUR INPUT ==========

  /**
   * Clamp input.value to the [min, max] bounds declared on the element.
   * Falls back to defaultValue (or min) when the current value is NaN.
   *
   * @param {HTMLInputElement} input
   */
  function clampInputValue(input) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    let value = parseFloat(input.value);

    if (isNaN(value)) {
      value = parseFloat(input.defaultValue) || min;
    }

    if (!isNaN(min) && value < min) {
      value = min;
    }
    if (!isNaN(max) && value > max) {
      value = max;
    }

    input.value = value;
  }

  // ========== GESTION VIRGULE FRAPPE ==========

  /**
   * Convert a comma or Decimal keypress into a dot insertion.
   * Does nothing when a dot is already present in the value.
   *
   * @param {KeyboardEvent} event
   * @param {HTMLInputElement} input
   */
  function handleCommaKeypress(event, input) {
    if (event.key === ',' || event.key === 'Decimal') {
      event.preventDefault();

      if (!input.value.includes('.')) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        input.value = value.substring(0, start) + '.' + value.substring(end);
        input.setSelectionRange(start + 1, start + 1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  // ========== GESTION VIRGULE COLLAGE ==========

  /**
   * Replace commas with dots in pasted text.
   *
   * @param {ClipboardEvent} event
   * @param {HTMLInputElement} input
   */
  function handleCommaPaste(event, input) {
    const pastedText = event.clipboardData.getData('text');

    if (pastedText.includes(',')) {
      event.preventDefault();

      const correctedText = pastedText.replace(/,/g, '.');
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const value = input.value;
      input.value = value.substring(0, start) + correctedText + value.substring(end);

      const newPos = start + correctedText.length;
      input.setSelectionRange(newPos, newPos);

      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // ========== VALIDATION FORMULAIRE ==========

  /**
   * Validate all required form fields and return a result object.
   *
   * Accepts an elements map so that it can be called without touching
   * the global DOM (and can therefore be tested in Node.js).
   *
   * @param {Object} elements — map of form element references
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function validateForm(elements) {
    const errors = [];

    // Clear previous visual errors
    if (typeof UIUtils !== 'undefined' && UIUtils.clearValidationErrors) {
      UIUtils.clearValidationErrors();
    } else if (
      typeof window !== 'undefined' &&
      window.UIUtils &&
      window.UIUtils.clearValidationErrors
    ) {
      window.UIUtils.clearValidationErrors();
    }

    const requiredFields = [
      elements.pipeMaterial,
      elements.pipeSchedule,
      elements.pipeNPS,
      elements.pipeLength,
      elements.waterTemp,
      elements.waterFlow,
      elements.waterPressure,
      elements.airTemp,
      elements.windSpeed,
    ];

    // All required elements must exist (SVG inputs may not be in DOM yet)
    for (const field of requiredFields) {
      if (!field) {
        errors.push('Element not yet in DOM');
        return { valid: false, errors };
      }
    }

    // Collect ALL validation errors — do not stop at first
    for (const field of requiredFields) {
      if (!field.value || field.value === '') {
        const label = field.previousElementSibling ? field.previousElementSibling.textContent : '';
        const msg =
          typeof window !== 'undefined' && window.I18n
            ? window.I18n.t('validation.requiredMissing', { label })
            : `Champ requis manquant: ${label}`;
        errors.push(msg);
        _showValidationError(field, msg);
      }
    }

    // pipeLength range: 1–2500 m
    const pipeLengthValue = parseFloat(elements.pipeLength.value);
    if (isNaN(pipeLengthValue) || pipeLengthValue < 1 || pipeLengthValue > 2500) {
      const msg =
        typeof window !== 'undefined' && window.I18n
          ? window.I18n.t('validation.lengthRange')
          : 'Longueur doit être entre 1 et 2500 m';
      errors.push(msg);
      _showValidationError(elements.pipeLength, msg);
    }

    // waterTemp range: 1–100 °C
    const waterTempValue = parseFloat(elements.waterTemp.value);
    if (isNaN(waterTempValue) || waterTempValue < 1 || waterTempValue > 100) {
      const msg =
        typeof window !== 'undefined' && window.I18n
          ? window.I18n.t('validation.waterTempRange')
          : 'Température eau doit être entre 1 et 100°C';
      errors.push(msg);
      _showValidationError(elements.waterTemp, msg);
    }

    // airTemp range: -50–30 °C
    const airTempValue = parseFloat(elements.airTemp.value);
    if (isNaN(airTempValue) || airTempValue < -50 || airTempValue > 30) {
      const msg =
        typeof window !== 'undefined' && window.I18n
          ? window.I18n.t('validation.airTempRange')
          : 'Température air doit être entre -50 et 30°C';
      errors.push(msg);
      _showValidationError(elements.airTemp, msg);
    }

    // waterPressure — dynamic range from UnitConverter
    const _UnitConverter =
      (typeof UnitConverter !== 'undefined' && UnitConverter) ||
      (typeof window !== 'undefined' && window.UnitConverter);

    if (_UnitConverter) {
      const pressureRanges = _UnitConverter.getRanges('pressure');
      const pressureValue = parseFloat(elements.waterPressure.value);
      if (
        isNaN(pressureValue) ||
        pressureValue < pressureRanges.min ||
        pressureValue > pressureRanges.max
      ) {
        const pressureUnit = _UnitConverter.getUnitInfo('pressure').label;
        const msg =
          typeof window !== 'undefined' && window.I18n
            ? window.I18n.t('validation.waterPressureRange')
                .replace('100', pressureRanges.min.toFixed(0))
                .replace('1000', pressureRanges.max.toFixed(0))
                .replace('kPag', pressureUnit)
            : `Pression eau doit être entre ${pressureRanges.min.toFixed(0)} et ${pressureRanges.max.toFixed(0)} ${pressureUnit}`;
        errors.push(msg);
        _showValidationError(elements.waterPressure, msg);
      }

      // waterFlow — dynamic range from UnitConverter
      const flowRanges = _UnitConverter.getRanges('flowRate');
      const flowValue = parseFloat(elements.waterFlow.value);
      if (isNaN(flowValue) || flowValue < flowRanges.min || flowValue > flowRanges.max) {
        const flowUnit = _UnitConverter.getUnitInfo('flowRate').label;
        const msg =
          typeof window !== 'undefined' && window.I18n
            ? window.I18n.t('validation.waterFlowRange')
                .replace('0.06', flowRanges.min.toFixed(2))
                .replace('30', flowRanges.max.toFixed(2))
                .replace('m³/hr', flowUnit)
            : `Débit eau doit être entre ${flowRanges.min.toFixed(2)} et ${flowRanges.max.toFixed(2)} ${flowUnit}`;
        errors.push(msg);
        _showValidationError(elements.waterFlow, msg);
      }
    }

    // windSpeed range: 0–108 km/h
    const windSpeedValue = parseFloat(elements.windSpeed.value);
    if (isNaN(windSpeedValue) || windSpeedValue < 0 || windSpeedValue > 108) {
      const msg =
        typeof window !== 'undefined' && window.I18n
          ? window.I18n.t('validation.windSpeedRange')
          : 'Vitesse vent doit être entre 0 et 108 km/h';
      errors.push(msg);
      _showValidationError(elements.windSpeed, msg);
    }

    const valid = errors.length === 0;
    return { valid, errors };
  }

  // ========== HELPER INTERNE ==========

  function _showValidationError(field, msg) {
    const utils =
      (typeof UIUtils !== 'undefined' && UIUtils) ||
      (typeof window !== 'undefined' && window.UIUtils);
    if (utils && utils.showValidationError) {
      utils.showValidationError(field, msg);
    }
  }

  // ========== EXPORT ==========

  const InputValidation = {
    validateForm,
    validateInputVisual,
    clampInputValue,
    handleCommaKeypress,
    handleCommaPaste,
  };

  if (typeof window !== 'undefined') {
    window.InputValidation = InputValidation;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputValidation;
  }
})();
