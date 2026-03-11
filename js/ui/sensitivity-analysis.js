/**
 * sensitivity-analysis.js
 *
 * Analyse de sensibilité 2D pour ThermaFlow — couche UI/DOM uniquement.
 *
 * Orchestre l'interface : sélecteurs de paramètres, sliders, validation des
 * plages et déclenchement du calcul. Délègue toute la logique de calcul à
 * window.SensitivityMatrix (sensitivity-matrix.js).
 */

(function () {
  'use strict';

  // En environnement Node.js (tests), charger sensitivity-matrix.js si nécessaire
  if (
    typeof module !== 'undefined' &&
    (typeof window === 'undefined' || typeof window.SensitivityMatrix === 'undefined')
  ) {
    require('./sensitivity-matrix.js');
  }

  const FIXED_RESOLUTION = 15;

  // Web Worker pour le calcul 2D (off-main-thread).
  // Fallback automatique vers calcul synchrone si Worker non supporté.
  let _worker = null;
  let _workerSupported = typeof Worker !== 'undefined';

  function getWorker() {
    if (!_workerSupported || _worker !== null) {
      return _worker;
    }
    try {
      _worker = new Worker('js/workers/sensitivity-worker.js');
      _worker.onerror = function (event) {
        console.error('Erreur Worker sensibilité:', event.message || event);
        _worker = null;
        _workerSupported = false;
      };
    } catch (err) {
      console.warn('Worker sensibilité indisponible, fallback synchrone:', err.message);
      _worker = null;
      _workerSupported = false;
    }
    return _worker;
  }

  const state = {
    baseConfig: null,
    selectedParamX: 'L',
    selectedParamY: 'T_amb',
    resolution: FIXED_RESOLUTION,
    rangeX: { min: 0, max: 0 },
    rangeY: { min: 0, max: 0 },
    isUpToDate: false,
    lastResults: null,
    validationErrors: [],
  };

  let elements = {};

  function getParamDefs() {
    return window.SensitivityParams.PARAMETER_DEFINITIONS;
  }

  const getDisplayValue = (config, key) => window.SensitivityMatrix.getDisplayValue(config, key);
  const applyParameterValue = (config, key, val) =>
    window.SensitivityMatrix.applyParameterValue(config, key, val);

  function init() {
    elements = {
      paramX: document.getElementById('sensitivity-param-x'),
      paramY: document.getElementById('sensitivity-param-y'),
      rangeXMin: document.getElementById('range-x-min'),
      rangeXMax: document.getElementById('range-x-max'),
      rangeYMin: document.getElementById('range-y-min'),
      rangeYMax: document.getElementById('range-y-max'),
      rangeXMinSlider: document.getElementById('range-x-min-slider'),
      rangeXMaxSlider: document.getElementById('range-x-max-slider'),
      rangeYMinSlider: document.getElementById('range-y-min-slider'),
      rangeYMaxSlider: document.getElementById('range-y-max-slider'),
      status: document.getElementById('sensitivity-status'),
      canvas: document.getElementById('sensitivity-heatmap'),
      errors: document.getElementById('sensitivity-errors'),
    };

    const missingElements = Object.entries(elements)
      .filter(([key, el]) => !el && key !== 'status')
      .map(([key]) => key);

    if (missingElements.length > 0) {
      console.error('Éléments DOM manquants:', missingElements);
      return;
    }

    attachEvents();
  }

  /**
   * Attache les événements input/change sur un axe (X ou Y).
   *
   * @param {'X'|'Y'} axis
   */
  function attachAxisRangeEvents(axis) {
    const inputMin = axis === 'X' ? elements.rangeXMin : elements.rangeYMin;
    const inputMax = axis === 'X' ? elements.rangeXMax : elements.rangeYMax;
    const sliderMin = axis === 'X' ? elements.rangeXMinSlider : elements.rangeYMinSlider;
    const sliderMax = axis === 'X' ? elements.rangeXMaxSlider : elements.rangeYMaxSlider;

    inputMin.addEventListener('input', function () {
      syncInputToSlider(this);
      validateRanges();
    });
    inputMin.addEventListener('change', function () {
      preventCrossingInInputs(axis, 'min');
      validateRanges();
      runSensitivityAnalysis();
    });

    inputMax.addEventListener('input', function () {
      syncInputToSlider(this);
      validateRanges();
    });
    inputMax.addEventListener('change', function () {
      preventCrossingInInputs(axis, 'max');
      validateRanges();
      runSensitivityAnalysis();
    });

    sliderMin.addEventListener('input', function () {
      const minVal = parseFloat(this.value);
      const maxVal = parseFloat(sliderMax.value);
      if (minVal >= maxVal) {
        this.value = maxVal - parseFloat(this.step);
      }
      inputMin.value = this.value;
      validateRanges();
    });
    sliderMin.addEventListener('change', function () {
      runSensitivityAnalysis();
    });

    sliderMax.addEventListener('input', function () {
      const maxVal = parseFloat(this.value);
      const minVal = parseFloat(sliderMin.value);
      if (maxVal <= minVal) {
        this.value = minVal + parseFloat(this.step);
      }
      inputMax.value = this.value;
      validateRanges();
    });
    sliderMax.addEventListener('change', function () {
      runSensitivityAnalysis();
    });
  }

  function attachEvents() {
    elements.paramX.addEventListener('change', function () {
      state.selectedParamX = this.value;
      updateParameterOptions();
      updateRanges('X');
      runSensitivityAnalysis();
    });

    elements.paramY.addEventListener('change', function () {
      state.selectedParamY = this.value;
      updateParameterOptions();
      updateRanges('Y');
      runSensitivityAnalysis();
    });

    attachAxisRangeEvents('X');
    attachAxisRangeEvents('Y');
  }

  function syncInputToSlider(input) {
    const value = parseFloat(input.value);
    if (isNaN(value)) {
      return;
    }
    const idMap = {
      'range-x-min': elements.rangeXMinSlider,
      'range-x-max': elements.rangeXMaxSlider,
      'range-y-min': elements.rangeYMinSlider,
      'range-y-max': elements.rangeYMaxSlider,
    };
    if (idMap[input.id]) {
      idMap[input.id].value = value;
    }
  }

  function preventCrossingInInputs(axis, type) {
    const inputMin = axis === 'X' ? elements.rangeXMin : elements.rangeYMin;
    const inputMax = axis === 'X' ? elements.rangeXMax : elements.rangeYMax;
    const sliderMin = axis === 'X' ? elements.rangeXMinSlider : elements.rangeYMinSlider;
    const sliderMax = axis === 'X' ? elements.rangeXMaxSlider : elements.rangeYMaxSlider;

    const min = parseFloat(inputMin.value);
    const max = parseFloat(inputMax.value);
    const step = parseFloat((type === 'min' ? sliderMin : sliderMax).step);

    if (type === 'min' && min >= max) {
      inputMin.value = (max - step).toFixed(4);
      sliderMin.value = inputMin.value;
    } else if (type === 'max' && max <= min) {
      inputMax.value = (min + step).toFixed(4);
      sliderMax.value = inputMax.value;
    }
  }

  function updateBaseConfig(config) {
    state.baseConfig = window.UIUtils.deepCopy(config);
    populateParameterSelectors();
    updateRanges('X');
    updateRanges('Y');
    setTimeout(() => {
      runSensitivityAnalysis();
    }, 300);
  }

  function populateParameterSelectors() {
    if (!state.baseConfig) {
      return;
    }

    const availableParams = getAvailableParameters();

    elements.paramX.innerHTML = '';
    elements.paramY.innerHTML = '';

    availableParams.forEach((param) => {
      const optionX = document.createElement('option');
      optionX.value = param.key;
      optionX.textContent = param.label;
      elements.paramX.appendChild(optionX);

      const optionY = document.createElement('option');
      optionY.value = param.key;
      optionY.textContent = param.label;
      elements.paramY.appendChild(optionY);
    });

    elements.paramX.value = state.selectedParamX;
    elements.paramY.value = state.selectedParamY;

    updateParameterOptions();
  }

  function getAvailableParameters() {
    const params = [];

    for (const [key, def] of Object.entries(getParamDefs())) {
      if (def.conditional) {
        const hasInsulation = state.baseConfig.meta && state.baseConfig.meta.hasInsulation;
        if (!hasInsulation) {
          continue;
        }
      }

      const value = getDisplayValue(state.baseConfig, key);
      if (value === null || value === undefined) {
        continue;
      }

      params.push({ key, label: def.label, unit: def.unit, value, path: def.path });
    }

    return params;
  }

  function updateParameterOptions() {
    Array.from(elements.paramY.options).forEach((o) => {
      o.disabled = o.value === state.selectedParamX;
    });
    Array.from(elements.paramX.options).forEach((o) => {
      o.disabled = o.value === state.selectedParamY;
    });
  }

  function updateRanges(axis) {
    if (!state.baseConfig) {
      return;
    }

    const paramKey = axis === 'X' ? state.selectedParamX : state.selectedParamY;
    const paramDef = getParamDefs()[paramKey];
    if (!paramDef) {
      return;
    }

    const currentValue = getDisplayValue(state.baseConfig, paramKey);
    if (currentValue === null || currentValue === undefined) {
      console.warn(`Valeur non trouvée pour ${paramKey}`);
      return;
    }

    const { min, max } = paramDef;

    if (axis === 'X') {
      elements.rangeXMin.value = min.toFixed(4);
      elements.rangeXMax.value = max.toFixed(4);
      initializeSlider(elements.rangeXMinSlider, min, max, min);
      initializeSlider(elements.rangeXMaxSlider, min, max, max);
      state.rangeX = { min, max };
    } else {
      elements.rangeYMin.value = min.toFixed(4);
      elements.rangeYMax.value = max.toFixed(4);
      initializeSlider(elements.rangeYMinSlider, min, max, min);
      initializeSlider(elements.rangeYMaxSlider, min, max, max);
      state.rangeY = { min, max };
    }

    validateRanges();
  }

  function initializeSlider(slider, min, max, value) {
    slider.min = min;
    slider.max = max;
    slider.value = value;
    const range = max - min;
    slider.step = range > 2500 ? 10 : range > 100 ? 1 : range > 10 ? 0.1 : 0.01;
  }

  function validateRangeField(value, paramDef, label, element) {
    if (isNaN(value)) {
      state.validationErrors.push(`${label}: valeur requise`);
      element.classList.add('error');
    } else if (value < paramDef.min || value > paramDef.max) {
      state.validationErrors.push(
        `${label}: doit être entre ${paramDef.min} et ${paramDef.max} ${paramDef.unit}`
      );
      element.classList.add('error');
    } else {
      element.classList.remove('error');
    }
  }

  function validateRanges() {
    state.validationErrors = [];

    const xMin = parseFloat(elements.rangeXMin.value);
    const xMax = parseFloat(elements.rangeXMax.value);
    const yMin = parseFloat(elements.rangeYMin.value);
    const yMax = parseFloat(elements.rangeYMax.value);

    const paramDefX = getParamDefs()[state.selectedParamX];
    const paramDefY = getParamDefs()[state.selectedParamY];

    validateRangeField(xMin, paramDefX, `${paramDefX.label} (X) min`, elements.rangeXMin);
    validateRangeField(xMax, paramDefX, `${paramDefX.label} (X) max`, elements.rangeXMax);
    validateRangeField(yMin, paramDefY, `${paramDefY.label} (Y) min`, elements.rangeYMin);
    validateRangeField(yMax, paramDefY, `${paramDefY.label} (Y) max`, elements.rangeYMax);

    if (state.validationErrors.length > 0) {
      elements.errors.innerHTML = '';
      state.validationErrors.forEach((err) => {
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = err;
        elements.errors.appendChild(div);
      });
      elements.errors.style.display = 'block';
    } else {
      elements.errors.style.display = 'none';
    }

    return state.validationErrors.length === 0;
  }

  function markAsOutdated() {
    state.isUpToDate = false;
    if (elements.status) {
      elements.status.style.display = 'inline-flex';
      elements.status.textContent = window.I18n ? I18n.t('status.outdated') : 'Pas à jour';
    }
  }

  function markAsUpToDate() {
    state.isUpToDate = true;
    if (elements.status) {
      elements.status.style.display = 'none';
    }
  }

  function applyMatrixResults(results) {
    state.lastResults = results;
    window.SensitivityHeatmapRenderer.drawHeatmap(elements.canvas, results);
    markAsUpToDate();
  }

  function handleCalculationError(error) {
    const raw = error && error.message ? error.message : String(error);
    console.error("Erreur lors de l'analyse:", raw);
    if (typeof window.UIUtils !== 'undefined') {
      const userMsg = window.I18n
        ? window.I18n.t('errors.sensitivityFailed')
        : "Erreur lors de l'analyse de sensibilité";
      window.UIUtils.showBannerError(userMsg);
    }
  }

  function runSyncCalculation(baseConfig, paramX, paramY, rangeX, rangeY, resolution) {
    try {
      const results = window.SensitivityMatrix.calculateMatrix(
        baseConfig,
        paramX,
        paramY,
        rangeX,
        rangeY,
        resolution
      );
      applyMatrixResults(results);
    } catch (error) {
      handleCalculationError(error);
    }
  }

  function runSensitivityAnalysis() {
    if (!state.baseConfig) {
      console.warn("Aucune configuration de base pour l'analyse de sensibilité");
      return;
    }

    if (!validateRanges()) {
      console.warn('Validation des plages échouée. Calcul annulé.');
      return;
    }

    const rangeX = {
      min: parseFloat(elements.rangeXMin.value),
      max: parseFloat(elements.rangeXMax.value),
    };
    const rangeY = {
      min: parseFloat(elements.rangeYMin.value),
      max: parseFloat(elements.rangeYMax.value),
    };

    const baseConfig = state.baseConfig;
    const paramX = state.selectedParamX;
    const paramY = state.selectedParamY;
    const resolution = state.resolution;

    const worker = getWorker();

    if (worker !== null) {
      // --- Path A: Web Worker (off-main-thread) ---
      // Use a request ID to discard stale responses from previous calls
      const requestId = Date.now() + Math.random();
      worker._pendingRequestId = requestId;

      function handleWorkerMessage(e) {
        // Ignore stale responses from previous requests
        if (worker._pendingRequestId !== requestId) {
          return;
        }
        worker.removeEventListener('message', handleWorkerMessage);

        const type = e.data.type;
        const payload = e.data.payload;
        if (type === 'result') {
          applyMatrixResults(payload);
        } else if (type === 'error') {
          console.warn('Worker retourné une erreur, fallback synchrone:', payload);
          runSyncCalculation(baseConfig, paramX, paramY, rangeX, rangeY, resolution);
        }
      }

      worker.addEventListener('message', handleWorkerMessage);

      worker.postMessage({
        type: 'calculate',
        payload: { baseConfig, paramX, paramY, rangeX, rangeY, resolution },
      });
    } else {
      // --- Path B: Synchronous fallback (Worker not supported or failed) ---
      setTimeout(function () {
        runSyncCalculation(baseConfig, paramX, paramY, rangeX, rangeY, resolution);
      }, 100);
    }
  }

  window.SensitivityAnalysis = {
    init: init,
    updateBaseConfig: updateBaseConfig,
    markAsOutdated: markAsOutdated,
    // Backward compatibility (Phase 1 immutability fix preserved via delegation)
    applyParameterValue: applyParameterValue,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      init: init,
      updateBaseConfig: updateBaseConfig,
      markAsOutdated: markAsOutdated,
      applyParameterValue: applyParameterValue,
    };
  }
})();
