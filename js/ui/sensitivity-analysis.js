/**
 * sensitivity-analysis.js
 *
 * Analyse de sensibilité 2D pour ThermaFlow
 *
 * Permet de visualiser l'impact de deux paramètres sur la température finale
 * via une heatmap colorée avec calculs sur une matrice de valeurs.
 */

(function () {
  'use strict';

  // ========== CONSTANTES ==========
  const FIXED_RESOLUTION = 15; // Résolution fixe
  // const DEFAULT_RANGE_PERCENT = 0.2; // ±20% (non utilisé)

  // ========== ÉTAT ==========
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

  // ========== ÉLÉMENTS DOM ==========
  let elements = {};

  // ========== PARAMÈTRES DISPONIBLES ==========
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

  // ========== INITIALISATION ==========
  /**
   * Initialise le module d'analyse de sensibilité 2D
   *
   * @description Récupère les éléments DOM, attache les événements,
   * et initialise les options de paramètres disponibles
   */
  function init() {
    // Récupérer les éléments DOM
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

    // Vérifier que tous les éléments existent (sauf status qui est optionnel)
    const missingElements = Object.entries(elements)
      .filter(([key, el]) => !el && key !== 'status')
      .map(([key]) => key);

    if (missingElements.length > 0) {
      console.error('❌ Éléments DOM manquants:', missingElements);
      return;
    }

    // Attacher les événements
    attachEvents();
  }

  // ========== ÉVÉNEMENTS ==========
  function attachEvents() {
    // Changement de paramètre X
    elements.paramX.addEventListener('change', function () {
      state.selectedParamX = this.value;
      updateParameterOptions();
      updateRanges('X');
      runSensitivityAnalysis();
    });

    // Changement de paramètre Y
    elements.paramY.addEventListener('change', function () {
      state.selectedParamY = this.value;
      updateParameterOptions();
      updateRanges('Y');
      runSensitivityAnalysis();
    });

    // Changement des ranges avec validation et prévention de croisement
    elements.rangeXMin.addEventListener('input', function () {
      syncInputToSlider(this);
      validateRanges();
    });
    elements.rangeXMin.addEventListener('change', function () {
      preventCrossingInInputs('X', 'min');
      validateRanges();
      runSensitivityAnalysis();
    });

    elements.rangeXMax.addEventListener('input', function () {
      syncInputToSlider(this);
      validateRanges();
    });
    elements.rangeXMax.addEventListener('change', function () {
      preventCrossingInInputs('X', 'max');
      validateRanges();
      runSensitivityAnalysis();
    });

    elements.rangeYMin.addEventListener('input', function () {
      syncInputToSlider(this);
      validateRanges();
    });
    elements.rangeYMin.addEventListener('change', function () {
      preventCrossingInInputs('Y', 'min');
      validateRanges();
      runSensitivityAnalysis();
    });

    elements.rangeYMax.addEventListener('input', function () {
      syncInputToSlider(this);
      validateRanges();
    });
    elements.rangeYMax.addEventListener('change', function () {
      preventCrossingInInputs('Y', 'max');
      validateRanges();
      runSensitivityAnalysis();
    });

    // Synchronisation sliders → inputs avec prévention de croisement
    elements.rangeXMinSlider.addEventListener('input', function () {
      const minVal = parseFloat(this.value);
      const maxVal = parseFloat(elements.rangeXMaxSlider.value);

      // Empêcher le croisement
      if (minVal >= maxVal) {
        this.value = maxVal - parseFloat(this.step);
      }

      elements.rangeXMin.value = this.value;
      validateRanges();
    });
    elements.rangeXMinSlider.addEventListener('change', function () {
      runSensitivityAnalysis();
    });

    elements.rangeXMaxSlider.addEventListener('input', function () {
      const maxVal = parseFloat(this.value);
      const minVal = parseFloat(elements.rangeXMinSlider.value);

      // Empêcher le croisement
      if (maxVal <= minVal) {
        this.value = minVal + parseFloat(this.step);
      }

      elements.rangeXMax.value = this.value;
      validateRanges();
    });
    elements.rangeXMaxSlider.addEventListener('change', function () {
      runSensitivityAnalysis();
    });

    elements.rangeYMinSlider.addEventListener('input', function () {
      const minVal = parseFloat(this.value);
      const maxVal = parseFloat(elements.rangeYMaxSlider.value);

      // Empêcher le croisement
      if (minVal >= maxVal) {
        this.value = maxVal - parseFloat(this.step);
      }

      elements.rangeYMin.value = this.value;
      validateRanges();
    });
    elements.rangeYMinSlider.addEventListener('change', function () {
      runSensitivityAnalysis();
    });

    elements.rangeYMaxSlider.addEventListener('input', function () {
      const maxVal = parseFloat(this.value);
      const minVal = parseFloat(elements.rangeYMinSlider.value);

      // Empêcher le croisement
      if (maxVal <= minVal) {
        this.value = minVal + parseFloat(this.step);
      }

      elements.rangeYMax.value = this.value;
      validateRanges();
    });
    elements.rangeYMaxSlider.addEventListener('change', function () {
      runSensitivityAnalysis();
    });
  }

  // ========== SYNCHRONISATION INPUT → SLIDER ==========
  function syncInputToSlider(input) {
    const value = parseFloat(input.value);
    if (isNaN(value)) {
      return;
    }

    if (input.id === 'range-x-min') {
      elements.rangeXMinSlider.value = value;
    } else if (input.id === 'range-x-max') {
      elements.rangeXMaxSlider.value = value;
    } else if (input.id === 'range-y-min') {
      elements.rangeYMinSlider.value = value;
    } else if (input.id === 'range-y-max') {
      elements.rangeYMaxSlider.value = value;
    }
  }

  // ========== EMPÊCHER LE CROISEMENT DANS LES INPUTS ==========
  function preventCrossingInInputs(axis, type) {
    if (axis === 'X') {
      const min = parseFloat(elements.rangeXMin.value);
      const max = parseFloat(elements.rangeXMax.value);
      const slider = type === 'min' ? elements.rangeXMinSlider : elements.rangeXMaxSlider;
      const step = parseFloat(slider.step);

      if (type === 'min' && min >= max) {
        elements.rangeXMin.value = (max - step).toFixed(4);
        elements.rangeXMinSlider.value = elements.rangeXMin.value;
      } else if (type === 'max' && max <= min) {
        elements.rangeXMax.value = (min + step).toFixed(4);
        elements.rangeXMaxSlider.value = elements.rangeXMax.value;
      }
    } else {
      const min = parseFloat(elements.rangeYMin.value);
      const max = parseFloat(elements.rangeYMax.value);
      const slider = type === 'min' ? elements.rangeYMinSlider : elements.rangeYMaxSlider;
      const step = parseFloat(slider.step);

      if (type === 'min' && min >= max) {
        elements.rangeYMin.value = (max - step).toFixed(4);
        elements.rangeYMinSlider.value = elements.rangeYMin.value;
      } else if (type === 'max' && max <= min) {
        elements.rangeYMax.value = (min + step).toFixed(4);
        elements.rangeYMaxSlider.value = elements.rangeYMax.value;
      }
    }
  }

  // ========== MISE À JOUR CONFIG DE BASE ==========
  function updateBaseConfig(config) {
    state.baseConfig = JSON.parse(JSON.stringify(config)); // Deep copy

    // Remplir les sélecteurs de paramètres
    populateParameterSelectors();

    // Initialiser les ranges avec les valeurs par défaut
    updateRanges('X');
    updateRanges('Y');

    // Déclencher automatiquement le calcul initial
    setTimeout(() => {
      runSensitivityAnalysis();
    }, 300); // Cohérent avec le délai de debounce
  }

  // ========== REMPLIR SÉLECTEURS ==========
  function populateParameterSelectors() {
    if (!state.baseConfig) {
      return;
    }

    const availableParams = getAvailableParameters();

    // Vider les sélecteurs
    elements.paramX.innerHTML = '';
    elements.paramY.innerHTML = '';

    // Remplir avec les paramètres disponibles
    availableParams.forEach((param) => {
      const optionX = document.createElement('option');
      optionX.value = param.key;
      optionX.textContent = `${param.label}`;
      elements.paramX.appendChild(optionX);

      const optionY = document.createElement('option');
      optionY.value = param.key;
      optionY.textContent = `${param.label}`;
      elements.paramY.appendChild(optionY);
    });

    // Sélectionner les valeurs par défaut
    elements.paramX.value = state.selectedParamX;
    elements.paramY.value = state.selectedParamY;

    // Mettre à jour les options (désactiver doublons)
    updateParameterOptions();
  }

  // ========== OBTENIR PARAMÈTRES DISPONIBLES ==========
  function getAvailableParameters() {
    const params = [];

    for (const [key, def] of Object.entries(PARAMETER_DEFINITIONS)) {
      // Si conditionnel, vérifier la condition
      if (def.conditional) {
        // Vérifier si l'isolation est active (via meta.hasInsulation)
        const hasInsulation = state.baseConfig.meta && state.baseConfig.meta.hasInsulation;
        if (!hasInsulation) {
          continue;
        }
      }

      // Obtenir la valeur actuelle dans les unités d'affichage
      const value = getDisplayValue(state.baseConfig, key);

      // Si la valeur n'existe pas, ignorer ce paramètre
      if (value === null || value === undefined) {
        continue;
      }

      params.push({
        key: key,
        label: def.label,
        unit: def.unit,
        value: value,
        path: def.path,
      });
    }

    return params;
  }

  // ========== OBTENIR VALEUR PAR PATH ==========
  function getValueFromPath(obj, path) {
    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null) {
        return null;
      }
      current = current[key];
    }
    return current;
  }

  // ========== OBTENIR VALEUR D'AFFICHAGE ==========
  /**
   * Obtient la valeur d'affichage d'un paramètre avec conversion d'unités si nécessaire
   *
   * @param {Object} config - Configuration source
   * @param {string} paramKey - Clé du paramètre
   * @returns {number|null} Valeur dans les unités d'affichage
   */
  function getDisplayValue(config, paramKey) {
    const paramDef = PARAMETER_DEFINITIONS[paramKey];
    if (!paramDef) {
      return null;
    }

    if (paramKey === 'm_dot') {
      // Valeur en m³/h (SI) dans config → convertir vers unité d'affichage
      const flowM3H = getValueFromPath(config, paramDef.path);
      return paramDef.convertFromSI ? paramDef.convertFromSI(flowM3H) : flowM3H;
    } else if (paramKey === 'V_wind') {
      // Vitesse vent: m/s (interne) → km/h (affichage)
      // Note: on lit depuis ambient.V_wind (unités SI) et on convertit
      const windMS = getValueFromPath(config, ['ambient', 'V_wind']);
      return windMS !== null ? windMS * 3.6 : null;
    } else if (paramKey === 't_insul') {
      // Épaisseur isolation: m (interne) → mm (affichage)
      const thicknessM = getValueFromPath(config, paramDef.path);
      return thicknessM !== null ? thicknessM * 1000.0 : null;
    } else {
      // Pas de conversion nécessaire
      return getValueFromPath(config, paramDef.path);
    }
  }

  // ========== DÉFINIR VALEUR PAR PATH ==========
  /**
   * Définit une valeur dans un objet via un chemin de propriétés
   *
   * @param {Object} obj - Objet à modifier
   * @param {Array<string>} path - Chemin vers la propriété
   * @param {*} value - Valeur à définir
   */
  function setValueByPath(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      // Créer l'objet intermédiaire s'il n'existe pas
      if (current[path[i]] === undefined || current[path[i]] === null) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  // ========== APPLIQUER VALEUR AVEC CONVERSIONS ==========
  /**
   * Applique une valeur de paramètre avec conversions d'unités nécessaires
   *
   * Conversions supportées:
   * - m_dot: m³/hr → kg/s (via densité eau dépendante T/P)
   * - V_wind: km/h → m/s (÷ 3.6)
   * - t_insul: mm → m (÷ 1000)
   *
   * @param {Object} config - Configuration à modifier (mutée in-place)
   * @param {string} paramKey - Clé du paramètre (ex: 'm_dot', 'V_wind', 't_insul')
   * @param {number} displayValue - Valeur dans les unités d'affichage (interface utilisateur)
   */
  function applyParameterValue(config, paramKey, displayValue) {
    const paramDef = PARAMETER_DEFINITIONS[paramKey];
    if (!paramDef) {
      console.warn(`Paramètre inconnu: ${paramKey}`);
      return;
    }

    if (paramKey === 'm_dot') {
      // displayValue est dans l'unité d'affichage → convertir vers m³/h (SI)
      const flowM3H = paramDef.convertToSI ? paramDef.convertToSI(displayValue) : displayValue;

      // Débit: m³/hr (SI) → kg/s (interne)
      // Nécessite la densité de l'eau à T et P actuelles
      const T_water = config.fluid.T_in;
      const P_water = config.fluid.P;

      let rho_water = 1000; // Valeur par défaut [kg/m³] à 20°C, 1 bar
      if (typeof window.WaterProperties !== 'undefined') {
        try {
          const waterProps = window.WaterProperties.getWaterProperties(T_water, P_water);
          rho_water = waterProps.rho;
        } catch (e) {
          console.warn(
            `Impossible d'obtenir rho_water à T=${T_water}°C, P=${P_water} bar. Utilisation: ${rho_water} kg/m³`
          );
        }
      }

      // Conversion: m³/hr → m³/s → kg/s
      const flowKgPerS = (flowM3H / 3600) * rho_water;

      // Mettre à jour les deux emplacements (meta pour affichage, fluid pour calculs)
      setValueByPath(config, ['meta', 'flowM3PerHr'], flowM3H);
      setValueByPath(config, ['fluid', 'm_dot'], flowKgPerS);
    } else if (paramKey === 'V_wind') {
      // Vitesse vent: km/h (affichage) → m/s (interne)
      const windMS = displayValue / 3.6;
      setValueByPath(config, paramDef.path, windMS);
    } else if (paramKey === 't_insul') {
      // Épaisseur isolation: mm (affichage) → m (interne)
      const thicknessM = displayValue / 1000.0;
      setValueByPath(config, paramDef.path, thicknessM);
    } else {
      // Pas de conversion nécessaire (L, T_in, T_amb)
      setValueByPath(config, paramDef.path, displayValue);
    }
  }

  // ========== METTRE À JOUR OPTIONS PARAMÈTRES ==========
  function updateParameterOptions() {
    // Désactiver le paramètre X dans le sélecteur Y et vice-versa
    Array.from(elements.paramY.options).forEach((option) => {
      option.disabled = option.value === state.selectedParamX;
    });

    Array.from(elements.paramX.options).forEach((option) => {
      option.disabled = option.value === state.selectedParamY;
    });
  }

  // ========== METTRE À JOUR RANGES ==========
  function updateRanges(axis) {
    if (!state.baseConfig) {
      return;
    }

    const paramKey = axis === 'X' ? state.selectedParamX : state.selectedParamY;
    const paramDef = PARAMETER_DEFINITIONS[paramKey];

    if (!paramDef) {
      return;
    }

    // Obtenir la valeur actuelle dans les unités d'affichage
    const currentValue = getDisplayValue(state.baseConfig, paramKey);

    if (currentValue === null || currentValue === undefined) {
      console.warn(`Valeur non trouvée pour ${paramKey}`);
      return;
    }

    // Utiliser les limites min/max absolues du paramètre
    const min = paramDef.min;
    const max = paramDef.max;

    // Mettre à jour l'interface
    if (axis === 'X') {
      elements.rangeXMin.value = min.toFixed(4);
      elements.rangeXMax.value = max.toFixed(4);

      // Initialiser les sliders
      initializeSlider(elements.rangeXMinSlider, paramDef.min, paramDef.max, min);
      initializeSlider(elements.rangeXMaxSlider, paramDef.min, paramDef.max, max);

      state.rangeX = { min, max };
    } else {
      elements.rangeYMin.value = min.toFixed(4);
      elements.rangeYMax.value = max.toFixed(4);

      // Initialiser les sliders
      initializeSlider(elements.rangeYMinSlider, paramDef.min, paramDef.max, min);
      initializeSlider(elements.rangeYMaxSlider, paramDef.min, paramDef.max, max);

      state.rangeY = { min, max };
    }

    // Valider après mise à jour
    validateRanges();
  }

  // ========== INITIALISER SLIDER ==========
  function initializeSlider(slider, min, max, value) {
    slider.min = min;
    slider.max = max;
    slider.value = value;

    // Calculer un step adapté à la plage
    const range = max - min;
    let step;
    if (range > 2500) {
      step = 10;
    } else if (range > 100) {
      step = 1;
    } else if (range > 10) {
      step = 0.1;
    } else {
      step = 0.01;
    }
    slider.step = step;
  }

  // ========== VALIDER RANGES ==========
  function validateRanges() {
    state.validationErrors = [];

    // Récupérer les valeurs
    const xMin = parseFloat(elements.rangeXMin.value);
    const xMax = parseFloat(elements.rangeXMax.value);
    const yMin = parseFloat(elements.rangeYMin.value);
    const yMax = parseFloat(elements.rangeYMax.value);

    const paramDefX = PARAMETER_DEFINITIONS[state.selectedParamX];
    const paramDefY = PARAMETER_DEFINITIONS[state.selectedParamY];

    // Valider X min
    if (isNaN(xMin)) {
      state.validationErrors.push(`${paramDefX.label} (X) min: valeur requise`);
      elements.rangeXMin.classList.add('error');
    } else if (xMin < paramDefX.min || xMin > paramDefX.max) {
      state.validationErrors.push(
        `${paramDefX.label} (X) min: doit être entre ${paramDefX.min} et ${paramDefX.max} ${paramDefX.unit}`
      );
      elements.rangeXMin.classList.add('error');
    } else {
      elements.rangeXMin.classList.remove('error');
    }

    // Valider X max
    if (isNaN(xMax)) {
      state.validationErrors.push(`${paramDefX.label} (X) max: valeur requise`);
      elements.rangeXMax.classList.add('error');
    } else if (xMax < paramDefX.min || xMax > paramDefX.max) {
      state.validationErrors.push(
        `${paramDefX.label} (X) max: doit être entre ${paramDefX.min} et ${paramDefX.max} ${paramDefX.unit}`
      );
      elements.rangeXMax.classList.add('error');
    } else {
      elements.rangeXMax.classList.remove('error');
    }

    // Valider Y min
    if (isNaN(yMin)) {
      state.validationErrors.push(`${paramDefY.label} (Y) min: valeur requise`);
      elements.rangeYMin.classList.add('error');
    } else if (yMin < paramDefY.min || yMin > paramDefY.max) {
      state.validationErrors.push(
        `${paramDefY.label} (Y) min: doit être entre ${paramDefY.min} et ${paramDefY.max} ${paramDefY.unit}`
      );
      elements.rangeYMin.classList.add('error');
    } else {
      elements.rangeYMin.classList.remove('error');
    }

    // Valider Y max
    if (isNaN(yMax)) {
      state.validationErrors.push(`${paramDefY.label} (Y) max: valeur requise`);
      elements.rangeYMax.classList.add('error');
    } else if (yMax < paramDefY.min || yMax > paramDefY.max) {
      state.validationErrors.push(
        `${paramDefY.label} (Y) max: doit être entre ${paramDefY.min} et ${paramDefY.max} ${paramDefY.unit}`
      );
      elements.rangeYMax.classList.add('error');
    } else {
      elements.rangeYMax.classList.remove('error');
    }

    // Note: Le croisement min/max est maintenant empêché en temps réel,
    // donc pas besoin de le valider ici

    // Afficher les erreurs
    if (state.validationErrors.length > 0) {
      elements.errors.innerHTML = state.validationErrors
        .map((err) => `<div class="error-message">⚠️ ${err}</div>`)
        .join('');
      elements.errors.style.display = 'block';
    } else {
      elements.errors.style.display = 'none';
    }

    return state.validationErrors.length === 0;
  }

  // ========== MARQUER COMME PAS À JOUR ==========
  function markAsOutdated() {
    state.isUpToDate = false;
    if (elements.status) {
      elements.status.style.display = 'inline-flex';
      elements.status.textContent = 'Pas à jour';
    }
  }

  // ========== MARQUER COMME À JOUR ==========
  function markAsUpToDate() {
    state.isUpToDate = true;
    if (elements.status) {
      elements.status.style.display = 'none';
    }
  }

  // ========== EXÉCUTER ANALYSE DE SENSIBILITÉ ==========
  function runSensitivityAnalysis() {
    if (!state.baseConfig) {
      console.warn("⚠️ Aucune configuration de base pour l'analyse de sensibilité");
      return;
    }

    // Valider les ranges
    if (!validateRanges()) {
      console.warn('⚠️ Validation des plages échouée. Calcul annulé.');
      return;
    }

    // Obtenir les paramètres des ranges (lire depuis les inputs au cas où modifiés)
    const rangeX = {
      min: parseFloat(elements.rangeXMin.value),
      max: parseFloat(elements.rangeXMax.value),
    };

    const rangeY = {
      min: parseFloat(elements.rangeYMin.value),
      max: parseFloat(elements.rangeYMax.value),
    };

    const resolution = state.resolution;

    // Calculer la matrice
    setTimeout(() => {
      try {
        const results = calculateMatrix(rangeX, rangeY, resolution);
        state.lastResults = results;

        // Dessiner la heatmap
        drawHeatmap(results);

        // Marquer comme à jour
        markAsUpToDate();
      } catch (error) {
        console.error("❌ Erreur lors de l'analyse:", error);
        alert(`Erreur lors de l'analyse de sensibilité: ${error.message}`);
      }
    }, 100);
  }

  // ========== CALCULER MATRICE ==========
  function calculateMatrix(rangeX, rangeY, resolution) {
    const matrix = [];
    const valuesX = [];
    const valuesY = [];

    // Générer les valeurs pour X et Y
    for (let i = 0; i < resolution; i++) {
      const t = i / (resolution - 1);
      valuesX.push(rangeX.min + t * (rangeX.max - rangeX.min));
      valuesY.push(rangeY.min + t * (rangeY.max - rangeY.min));
    }

    const paramDefX = PARAMETER_DEFINITIONS[state.selectedParamX];
    const paramDefY = PARAMETER_DEFINITIONS[state.selectedParamY];

    // Pour chaque combinaison
    let errorCount = 0;
    const errors = [];

    for (let j = 0; j < resolution; j++) {
      const row = [];

      for (let i = 0; i < resolution; i++) {
        // Copier la config de base
        const config = JSON.parse(JSON.stringify(state.baseConfig));

        // Modifier les paramètres X et Y avec conversions d'unités
        applyParameterValue(config, state.selectedParamX, valuesX[i]);
        applyParameterValue(config, state.selectedParamY, valuesY[j]);

        // Ajustements pour éviter les erreurs
        const adjustedConfig = adjustConfigForStability(
          config,
          valuesX[i],
          valuesY[j],
          paramDefX,
          paramDefY
        );

        try {
          // Calculer le réseau
          const result = calculatePipeNetwork(adjustedConfig);

          // Si température atteint ou dépasse le point de gel, figer à 0°C
          const T_final = result.T_final;
          const isFrozen = T_final <= 0;

          row.push({
            T_final: isFrozen ? 0.0 : T_final,
            success: true,
            adjusted: adjustedConfig !== config,
            frozen: isFrozen,
          });
        } catch (error) {
          // Tenter un calcul de secours avec paramètres plus conservateurs
          try {
            const fallbackConfig = createFallbackConfig(
              config,
              valuesX[i],
              valuesY[j],
              paramDefX,
              paramDefY
            );
            const result = calculatePipeNetwork(fallbackConfig);

            // Si température atteint ou dépasse le point de gel, figer à 0°C
            const T_final = result.T_final;
            const isFrozen = T_final <= 0;

            row.push({
              T_final: isFrozen ? 0.0 : T_final,
              success: true,
              adjusted: true,
              fallback: true,
              frozen: isFrozen,
            });
          } catch (fallbackError) {
            // Vraiment impossible - marquer comme invalide
            // Ne pas estimer pour éviter des valeurs aberrantes dans la heatmap
            row.push({
              T_final: null,
              success: false,
              error: error.message,
            });
            errorCount++;
            if (!errors.includes(error.message)) {
              errors.push(error.message);
            }
          }
        }
      }

      matrix.push(row);
    }

    if (errors.length > 0) {
      console.warn(
        `⚠️ ${errorCount} calculs hors plage physique (affichés en gris). Erreurs:`,
        errors.slice(0, 3)
      );
    }
    return {
      matrix: matrix,
      valuesX: valuesX,
      valuesY: valuesY,
      paramX: state.selectedParamX,
      paramY: state.selectedParamY,
      labelX: PARAMETER_DEFINITIONS[state.selectedParamX].label,
      labelY: PARAMETER_DEFINITIONS[state.selectedParamY].label,
      unitX: PARAMETER_DEFINITIONS[state.selectedParamX].unit,
      unitY: PARAMETER_DEFINITIONS[state.selectedParamY].unit,
    };
  }

  // ========== AJUSTER CONFIG POUR STABILITÉ ==========
  function adjustConfigForStability(config, valueX, valueY, paramDefX, paramDefY) {
    const adjusted = JSON.parse(JSON.stringify(config));

    // NE JAMAIS modifier les paramètres X et Y - ce sont ceux qu'on analyse!
    const paramPathsToPreserve = [paramDefX.path.join('.'), paramDefY.path.join('.')];

    // Ajuster le nombre de segments si la longueur est très grande
    // SAUF si la longueur est un paramètre analysé
    if (!paramPathsToPreserve.includes('totalLength')) {
      if (adjusted.totalLength > 200) {
        adjusted.numSegments = Math.min(150, Math.ceil(adjusted.totalLength / 2));
      }
    }

    // Augmenter la pression si elle risque d'être trop basse
    // SAUF si la pression est un paramètre analysé
    if (!paramPathsToPreserve.includes('fluid.P')) {
      if (adjusted.totalLength > 150) {
        adjusted.fluid.P = Math.max(adjusted.fluid.P, 4.0);
      }
    }

    return adjusted;
  }

  // ========== CONFIG DE SECOURS ==========
  function createFallbackConfig(config, valueX, valueY, paramDefX, paramDefY) {
    const fallback = JSON.parse(JSON.stringify(config));

    // NE JAMAIS modifier les paramètres X et Y!
    const paramPathsToPreserve = [paramDefX.path.join('.'), paramDefY.path.join('.')];

    // Augmenter la pression SEULEMENT si ce n'est pas un paramètre analysé
    if (!paramPathsToPreserve.includes('fluid.P')) {
      fallback.fluid.P = Math.max(fallback.fluid.P, 5.0);
    }

    // Réduire le nombre de segments pour accélérer (pas un paramètre physique)
    fallback.numSegments = Math.min(50, fallback.numSegments);

    return fallback;
  }

  // ========== ESTIMER TEMPÉRATURE (non utilisé, commenté) ==========
  /*
    function _estimateTemperature(_config, _valueX, _valueY, _paramDefX, _paramDefY) {
    // Estimation basée sur un modèle thermique simplifié mais réaliste
    const T_in = _config.fluid.T_in;
    const T_amb = _config.ambient.T_amb;
    const length = _config.totalLength;
    const m_dot = _config.fluid.m_dot;

    // Paramètres thermiques
    const cp = 4186; // J/(kg·K) pour l'eau
    const D_outer = _config.geometry.D_outer;
    const perimeter = Math.PI * D_outer;

    // Coefficient de transfert thermique global approximatif
    let U_approx;
    if (_config.insulation && _config.insulation.thickness > 0) {
      // Avec isolation: résistance dominée par l'isolation
      const k_insul = 0.04; // W/(m·K) - conductivité typique isolation
      const t_insul = _config.insulation.thickness;
      U_approx = k_insul / (t_insul * perimeter);
    } else {
      // Sans isolation: convection externe domine
      const h_ext = 10 + 3 * _config.ambient.V_wind; // W/(m²·K) - convection forcée
      U_approx = h_ext;
    }

    // Méthode NTU-ε pour échangeur avec T_amb constant
    // NTU = (UA) / (m_dot * cp)
    const UA = U_approx * perimeter * length;
    const NTU = UA / (m_dot * cp);

    // Efficacité thermique
    const epsilon = 1 - Math.exp(-NTU);

    // Température finale
    // Pour un échangeur avec T_amb constant: T_out = T_amb + (T_in - T_amb) * exp(-NTU)
    const T_final = T_amb + (T_in - T_amb) * Math.exp(-NTU);

    // Note: Cette équation garantit que:
    // - Si T_amb baisse, T_final baisse aussi (correct)
    // - Si longueur augmente, T_final se rapproche de T_amb (correct)
    // - La température converge asymptotiquement vers T_amb

    return T_final;
  }
  */

  // ========== DESSINER HEATMAP ==========
  function drawHeatmap(results) {
    const canvas = elements.canvas;
    if (!canvas) {
      console.error('Canvas non trouvé');
      return;
    }

    const ctx = canvas.getContext('2d');

    // Redimensionner canvas - plus grand pour accueillir les valeurs
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = 500 * dpr; // Plus grand pour la légende

    canvas.style.width = rect.width + 'px';
    canvas.style.height = '500px';

    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 500;

    // Effacer
    ctx.clearRect(0, 0, width, height);

    // Configuration
    const padding = { top: 50, right: 100, bottom: 120, left: 100 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const resolution = results.matrix.length;
    const cellWidth = plotWidth / resolution;
    const cellHeight = plotHeight / resolution;

    // Dessiner les cellules
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const cell = results.matrix[j][i];

        const x = padding.left + i * cellWidth;
        const y = padding.top + (resolution - 1 - j) * cellHeight; // Inverser Y

        if (cell.success) {
          // Couleur selon température
          ctx.fillStyle = getTemperatureColor(cell.T_final);
        } else {
          // Gris pour les échecs
          ctx.fillStyle = '#cccccc';
        }

        ctx.fillRect(x, y, cellWidth, cellHeight);

        // Bordure normale
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Texte de la valeur - TOUJOURS afficher
        if (cell.success && cell.T_final !== null && cell.T_final !== undefined) {
          ctx.fillStyle = getTextColor(cell.T_final);

          // Calculer taille de police adaptative
          const fontSize = Math.max(9, Math.min(cellWidth / 5, cellHeight / 3, 11));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Formatter la valeur avec signe et unité
          let valueText;
          if (cell.frozen) {
            // Condition de gel - afficher 0.0°C
            valueText = '0.0°C';
          } else {
            const sign = cell.T_final >= 0 ? '+' : '';
            valueText = `${sign}${cell.T_final.toFixed(1)}°C`;
          }

          ctx.fillText(valueText, x + cellWidth / 2, y + cellHeight / 2);

          // Indicateur de gel
          if (cell.frozen && cellWidth > 35 && cellHeight > 35) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${Math.max(7, fontSize - 2)}px sans-serif`;
            const freezeBadge = window.I18n ? I18n.t('chart.freezeBadge') : 'GEL';
            ctx.fillText(`❄️ ${freezeBadge}`, x + cellWidth / 2, y + cellHeight / 2 + fontSize + 3);
          } else if (cell.frozen && cellWidth > 25) {
            // Version compacte pour petites cellules
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `${Math.max(8, fontSize)}px sans-serif`;
            ctx.fillText('❄️', x + cellWidth - 10, y + 10);
          }

          // Indicateur subtil pour les valeurs estimées
          if (cell.estimated && !cell.frozen && cellWidth > 30) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.font = `${Math.max(6, fontSize - 3)}px sans-serif`;
            ctx.fillText('~', x + cellWidth - 8, y + 8);
          }
        }
      }
    }

    // Dessiner les axes
    drawAxes(ctx, padding, plotWidth, plotHeight, results);

    // Dessiner la légende améliorée
    drawImprovedLegend(ctx, width, height, padding);
  }

  // ========== COULEUR SELON TEMPÉRATURE ==========
  function getTemperatureColor(T) {
    // Utiliser les mêmes couleurs que le profil de température
    if (T <= 0) {
      // Rouge pâle pour condition de gel (≤ 0°C)
      return '#FFD6D6';
    } else if (T < 5) {
      // Jaune pâle pour zone sous marge (0-5°C)
      return '#FFF4CC';
    } else {
      // Vert pâle pour sécuritaire (≥ 5°C)
      return '#DFFFD6';
    }
  }

  // ========== COULEUR TEXTE ==========
  function getTextColor(_T) {
    // Texte noir sur les couleurs pâles pour un contraste optimal
    return '#000000';
  }

  // ========== DESSINER AXES ==========
  function drawAxes(ctx, padding, plotWidth, plotHeight, results) {
    const resolution = results.valuesX.length;
    const cellWidth = plotWidth / resolution;
    const cellHeight = plotHeight / resolution;

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 10px sans-serif';

    // Titre axe X (en haut)
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(
      `${results.labelX} (${results.unitX})`,
      padding.left + plotWidth / 2,
      padding.top - 30
    );

    // Titre axe Y (à gauche, vertical)
    ctx.save();
    ctx.translate(15, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`${results.labelY} (${results.unitY})`, 0, 0);
    ctx.restore();

    // Valeurs précises pour chaque colonne (en haut)
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#374151';

    for (let i = 0; i < resolution; i++) {
      const x = padding.left + (i + 0.5) * cellWidth;
      const value = results.valuesX[i];

      // Formater selon le type de valeur
      let displayValue;
      if (Math.abs(value) >= 100) {
        displayValue = value.toFixed(0);
      } else if (Math.abs(value) >= 10) {
        displayValue = value.toFixed(1);
      } else {
        displayValue = value.toFixed(2);
      }

      ctx.fillText(displayValue, x, padding.top - 10);
    }

    // Valeurs précises pour chaque rangée (à gauche)
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#374151';

    for (let j = 0; j < resolution; j++) {
      const y = padding.top + (resolution - j - 0.5) * cellHeight;
      const value = results.valuesY[j];

      // Formater selon le type de valeur
      let displayValue;
      if (Math.abs(value) >= 100) {
        displayValue = value.toFixed(0);
      } else if (Math.abs(value) >= 10) {
        displayValue = value.toFixed(1);
      } else {
        displayValue = value.toFixed(2);
      }

      ctx.fillText(displayValue, padding.left - 10, y + 3);
    }

    // Label du bas avec le nom complet
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#374151';
    ctx.fillText(
      `${results.labelX} (${results.unitX})`,
      padding.left + plotWidth / 2,
      padding.top + plotHeight + 30
    );
  }

  // ========== DESSINER LÉGENDE AMÉLIORÉE ==========
  function drawImprovedLegend(ctx, width, height, padding) {
    const legendY = height - padding.bottom + 70;
    const legendStartX = padding.left;

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';
    const legendTitle = window.I18n ? I18n.t('chart.legendTitle') : 'Légende:';
    ctx.fillText(legendTitle, legendStartX, legendY);

    // Définir les éléments de légende avec les couleurs harmonisées
    const legendItems = [
      {
        color: '#FFD6D6',
        label: window.I18n ? I18n.t('chart.legendFreeze') : 'Gel (≤ 0°C)',
      },
      {
        color: '#FFF4CC',
        label: window.I18n ? I18n.t('chart.legendUnder') : 'Sous marge (0-5°C)',
      },
      {
        color: '#DFFFD6',
        label: window.I18n ? I18n.t('chart.legendSafe') : 'Sécuritaire (≥ 5°C)',
      },
      {
        color: '#cccccc',
        label: window.I18n ? I18n.t('chart.legendInvalid') : 'Invalide (hors plage physique)',
      },
    ];

    let offsetX = legendStartX + 80;

    legendItems.forEach((item, _index) => {
      // Carré de couleur
      ctx.fillStyle = item.color;
      ctx.fillRect(offsetX, legendY - 12, 20, 16);
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, legendY - 12, 20, 16);

      // Texte
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, offsetX + 28, legendY);

      // Espacement pour le prochain élément
      offsetX += ctx.measureText(item.label).width + 60;
    });
  }

  // ========== EXPORT ==========
  window.SensitivityAnalysis = {
    init: init,
    updateBaseConfig: updateBaseConfig,
    markAsOutdated: markAsOutdated,
  };
})();
