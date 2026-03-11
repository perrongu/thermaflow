/**
 * input-form.js — Form orchestrator for ThermaFlow
 * Delegates validation to InputValidation, units to InputUnits.
 */

(function () {
  'use strict';

  const MATERIAL_ROUGHNESS = window.MaterialRoughness.MATERIAL_ROUGHNESS;
  let elements = {};
  function init() {
    // Vérifier que PipeSpecsLoader et PipeDiagram sont disponibles
    if (typeof PipeSpecsLoader === 'undefined') {
      console.error('❌ PipeSpecsLoader non chargé');
      return;
    }
    if (typeof PipeDiagram === 'undefined') {
      console.error('❌ PipeDiagram non chargé');
      return;
    }
    if (typeof UnitConverter === 'undefined') {
      console.error('❌ UnitConverter non chargé');
      return;
    }

    // Charger les préférences d'unités depuis localStorage
    InputUnits.loadUnitPreferences();

    // Récupérer les éléments de contrôle (disponibles immédiatement)
    elements = {
      form: document.getElementById('analysis-form'),
      hasInsulation: document.getElementById('has-insulation'),
      insulationFieldsDiagram: document.getElementById('insulation-fields-diagram'),

      // Conduite
      pipeMaterial: document.getElementById('pipe-material'),
      pipeSchedule: document.getElementById('pipe-schedule'),
      pipeScheduleLabel: document.getElementById('pipe-schedule-label'),
      pipeNPS: document.getElementById('pipe-nps'),

      // Isolation
      insulationMaterial: document.getElementById('insulation-material'),
      insulationThickness: document.getElementById('insulation-thickness'),
    };

    // Initialiser le schéma SVG
    PipeDiagram.init();

    // Initialiser avec valeurs par défaut (crée le SVG avec les inputs)
    initializeDefaultValues();

    // Attendre que le SVG soit rendu avant de récupérer les inputs
    requestAnimationFrame(function () {
      SVG_INPUT_FIELDS.forEach(function (pair) {
        elements[pair[0]] = document.getElementById(pair[1]);
      });
    });

    // Attacher les événements
    attachEvents();

    // État initial de l'isolation
    toggleInsulationFields();
  }

  function initializeDefaultValues() {
    elements.pipeMaterial.value = 'steel';
    updateScheduleOptions('steel');
    elements.pipeSchedule.value = '40';
    updateNPSOptions('steel', '40');
    elements.pipeNPS.value = '4';
    updatePipeSpecs();
  }

  function attachEvents() {
    elements.hasInsulation.addEventListener('change', toggleInsulationFields);
    elements.pipeMaterial.addEventListener('change', handleMaterialChange);
    elements.pipeSchedule.addEventListener('change', handleScheduleChange);
    elements.pipeNPS.addEventListener('change', handleNPSChange);
    elements.insulationMaterial.addEventListener('change', function () {
      triggerAnalysis({ priority: 'high', reason: 'insulation-material-change' });
    });
    waitForSVGInputs();
    document.addEventListener('thermaflow:language-changed', function () {
      if (elements && elements.pipeMaterial) {
        updateScheduleLabel(elements.pipeMaterial.value);
      }
    });
  }

  let debouncedAnalysis = null;

  function createDebouncedAnalysis() {
    if (!debouncedAnalysis && typeof UIUtils !== 'undefined') {
      debouncedAnalysis = UIUtils.debounce(function () {
        triggerAnalysis({ priority: 'low', reason: 'input-debounced' });
      }, 300);
    }
    return debouncedAnalysis;
  }

  function attachInputEvents(input) {
    if (!input) {
      return;
    }

    // S'assurer que la fonction debouncée est créée
    const debounced = createDebouncedAnalysis();
    if (!debounced) {
      return;
    }

    // Validation visuelle inline sur input (immédiat)
    input.addEventListener('input', function () {
      InputValidation.validateInputVisual(input);
      // Déclencher recalcul debounced
      debounced();
    });

    // Intercepter virgules lors de la frappe
    input.addEventListener('keypress', function (e) {
      InputValidation.handleCommaKeypress(e, input);
    });

    // Normaliser virgules lors du collage (Ctrl+V)
    input.addEventListener('paste', function (e) {
      InputValidation.handleCommaPaste(e, input);
    });

    // Déclencher recalcul immédiat au blur
    input.addEventListener('blur', function () {
      InputValidation.clampInputValue(input);
      // Annuler le debounce en cours
      debounced.cancel();
      // Recalcul immédiat
      triggerAnalysis({ priority: 'high', reason: 'blur' });
    });

    // Déclencher recalcul immédiat sur Enter
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        InputValidation.clampInputValue(input);
        // Annuler le debounce en cours
        debounced.cancel();
        // Recalcul immédiat
        triggerAnalysis({ priority: 'immediate', reason: 'enter' });
      }
    });
  }

  function waitForSVGInputs() {
    const inputIds = [
      'pipe-length',
      'water-temp',
      'water-flow',
      'water-pressure',
      'air-temp',
      'wind-speed',
      'flow-unit',
      'pressure-unit',
    ];

    let attempts = 0;
    const maxAttempts = 120; // ~2 seconds at 60fps
    function checkAndAttach() {
      const allExist = inputIds.every(function (id) {
        return document.getElementById(id) !== null;
      });
      if (allExist) {
        attachBlurEvents();
        InputUnits.attachUnitChangeEvents(triggerAnalysis);
        InputUnits.applyUnitPreferences();
      } else if (++attempts < maxAttempts) {
        requestAnimationFrame(checkAndAttach);
      } else {
        console.warn('SVG inputs not found after', maxAttempts, 'frames');
      }
    }
    requestAnimationFrame(checkAndAttach);
  }

  function attachBlurEvents() {
    const inputIds = [
      'pipe-length',
      'water-temp',
      'water-flow',
      'water-pressure',
      'air-temp',
      'wind-speed',
    ];

    inputIds.forEach((id) => {
      const input = document.getElementById(id);
      attachInputEvents(input);
    });

    // Événements pour isolation
    if (elements.insulationThickness) {
      attachInputEvents(elements.insulationThickness);
    }
  }

  // ========== RÉATTACHER ÉVÉNEMENTS APRÈS REDESSIN SVG ==========
  const SVG_INPUT_FIELDS = [
    ['pipeLength', 'pipe-length'],
    ['waterTemp', 'water-temp'],
    ['waterFlow', 'water-flow'],
    ['waterPressure', 'water-pressure'],
    ['airTemp', 'air-temp'],
    ['windSpeed', 'wind-speed'],
  ];

  function reattachInputEvents() {
    // Save current values, re-acquire DOM refs, restore values
    const saved = {};
    SVG_INPUT_FIELDS.forEach(function (pair) {
      saved[pair[0]] = elements[pair[0]] ? elements[pair[0]].value : null;
    });
    SVG_INPUT_FIELDS.forEach(function (pair) {
      elements[pair[0]] = document.getElementById(pair[1]);
      if (saved[pair[0]] && elements[pair[0]]) {
        elements[pair[0]].value = saved[pair[0]];
      }
      attachInputEvents(elements[pair[0]]);
    });
    InputUnits.attachUnitChangeEvents(triggerAnalysis);
    InputUnits.applyUnitPreferences();
  }

  function triggerAnalysis(options = {}) {
    // Valider le formulaire (delegate to InputValidation)
    if (!InputValidation.validateForm(elements).valid) {
      console.warn('⚠️ Formulaire invalide, analyse non déclenchée');
      return;
    }

    // Récupérer les données
    const formData = getFormData();

    // Déclencher le calcul (via événement custom avec options)
    const event = new CustomEvent('thermaflow:analyze', {
      detail: {
        config: formData,
        options: options,
      },
    });
    document.dispatchEvent(event);
  }

  function handleMaterialChange() {
    const material = elements.pipeMaterial.value;

    // Mettre à jour le label Schedule/Type
    updateScheduleLabel(material);

    // Mettre à jour les options de schedule/type
    updateScheduleOptions(material);

    // Le premier schedule est sélectionné automatiquement
    const firstSchedule = elements.pipeSchedule.value;

    // Mettre à jour les NPS
    updateNPSOptions(material, firstSchedule);

    // Mettre à jour les specs
    updatePipeSpecs();

    // Déclencher le recalcul immédiat (changement majeur)
    triggerAnalysis({ priority: 'high', reason: 'material-change' });
  }

  function handleScheduleChange() {
    const material = elements.pipeMaterial.value;
    const schedule = elements.pipeSchedule.value;

    // Mettre à jour les NPS disponibles
    updateNPSOptions(material, schedule);

    // Mettre à jour les specs
    updatePipeSpecs();

    // Déclencher le recalcul immédiat (changement majeur)
    triggerAnalysis({ priority: 'high', reason: 'schedule-change' });
  }

  function handleNPSChange() {
    // Mettre à jour les specs
    updatePipeSpecs();

    // Déclencher le recalcul immédiat (changement majeur)
    triggerAnalysis({ priority: 'high', reason: 'nps-change' });
  }

  function updateScheduleLabel(material) {
    if (PipeSpecsLoader.usesTypes(material)) {
      elements.pipeScheduleLabel.textContent = window.I18n ? I18n.t('controls.type') : 'Type';
    } else {
      elements.pipeScheduleLabel.textContent = window.I18n
        ? I18n.t('controls.schedule')
        : 'Schedule';
    }
  }

  function updateScheduleOptions(material) {
    const schedules = PipeSpecsLoader.getAvailableSchedules(material);

    // Vider le select
    elements.pipeSchedule.innerHTML = '';

    // Remplir avec les options
    schedules.forEach((schedule) => {
      const option = document.createElement('option');
      option.value = schedule;
      option.textContent = schedule;
      elements.pipeSchedule.appendChild(option);
    });

    // Sélectionner explicitement la première option pour éviter les valeurs invalides
    if (schedules.length > 0) {
      elements.pipeSchedule.value = schedules[0];
    }
  }

  function updateNPSOptions(material, schedule) {
    const npsList = PipeSpecsLoader.getAvailableNPS(material, schedule);

    // Vider le select
    elements.pipeNPS.innerHTML = '';

    // Remplir avec les options
    npsList.forEach((nps) => {
      const option = document.createElement('option');
      option.value = nps;
      // Formater l'affichage: nombre entier ou fraction
      const displayText = nps < 1 ? nps : Math.floor(nps) === nps ? nps : nps.toFixed(2);
      option.textContent = `${displayText}"`;
      elements.pipeNPS.appendChild(option);
    });

    // Sélectionner explicitement la première option pour éviter les valeurs invalides
    if (npsList.length > 0) {
      elements.pipeNPS.value = npsList[0].toString();
    }
  }

  function updatePipeSpecs() {
    const material = elements.pipeMaterial.value;
    const schedule = elements.pipeSchedule.value;
    const nps = parseFloat(elements.pipeNPS.value);

    if (!material || !schedule || !nps || isNaN(nps)) {
      console.warn('Paramètres de tuyau incomplets ou invalides:', {
        material,
        schedule,
        nps,
      });
      return;
    }

    // Récupérer les specs
    const specs = PipeSpecsLoader.getPipeSpecs(material, schedule, nps);

    if (!specs) {
      console.error(`❌ Specs introuvables pour: ${material} / ${schedule} / ${nps}"`);
      console.error('Combinaison invalide détectée. Vérifiez les données pipespecs.');
      return;
    }

    // Mettre à jour le schéma (dimensions affichées dans le SVG)
    if (typeof PipeDiagram !== 'undefined') {
      PipeDiagram.update(specs);
    }

    // CRITIQUE: Réattacher les événements car le schéma a recréé les inputs
    setTimeout(() => {
      reattachInputEvents();
    }, 100);
  }

  function toggleInsulationFields() {
    const isChecked = elements.hasInsulation.checked;
    elements.insulationFieldsDiagram.style.display = isChecked ? 'flex' : 'none';

    // Désactiver/activer les champs
    elements.insulationMaterial.disabled = !isChecked;
    elements.insulationThickness.disabled = !isChecked;

    // Redessiner le schéma pour afficher/cacher l'isolation
    updatePipeSpecs();

    // Déclencher le recalcul immédiat (changement majeur)
    triggerAnalysis({ priority: 'high', reason: 'insulation-toggle' });
  }

  function getFormData() {
    // Récupérer les specs de tuyau
    const material = elements.pipeMaterial.value;
    const schedule = elements.pipeSchedule.value;
    const nps = parseFloat(elements.pipeNPS.value);

    const specs = PipeSpecsLoader.getPipeSpecs(material, schedule, nps);

    if (!specs) {
      throw new Error(`Specs introuvables pour ${material} ${schedule} ${nps}"`);
    }

    // Conversions des unités d'entrée
    // Débit: convertir depuis unité d'affichage vers m³/h (SI d'affichage)
    const flowDisplayValue = parseFloat(elements.waterFlow.value);
    const flowM3PerHr = UnitConverter.toSI('flowRate', flowDisplayValue);

    // Pression: convertir depuis unité d'affichage vers kPag (SI d'affichage)
    const pressureDisplayValue = parseFloat(elements.waterPressure.value);
    const P_water_kPag = UnitConverter.toSI('pressure', pressureDisplayValue);
    const P_water_bar = P_water_kPag / 100.0; // kPag → bar (1 bar = 100 kPa)

    // Température: reste en °C (pas de conversion)
    const T_water = parseFloat(elements.waterTemp.value);

    // Obtenir la densité de l'eau à T et P donnés (nécessaire pour conversion précise)
    let rho_water = 1000; // Valeur par défaut [kg/m³]
    if (typeof window.WaterProperties !== 'undefined') {
      try {
        const waterProps = window.WaterProperties.getWaterProperties(T_water, P_water_bar);
        rho_water = waterProps.rho;
      } catch (e) {
        console.warn("Impossible d'obtenir la densité de l'eau, utilisation valeur par défaut:", e);
      }
    }

    const flowKgPerS = (flowM3PerHr / 3600) * rho_water; // m³/hr → m³/s → kg/s

    // Géométrie (convertir mm → m)
    const geometry = {
      D_inner: specs.ID / 1000.0, // mm → m
      D_outer: specs.OD / 1000.0, // mm → m
      roughness: MATERIAL_ROUGHNESS[material],
      material: material,
    };

    // Fluide
    const fluid = {
      T_in: T_water,
      P: P_water_bar,
      m_dot: flowKgPerS,
    };

    // Ambiant
    const ambient = {
      T_amb: parseFloat(elements.airTemp.value),
      V_wind: parseFloat(elements.windSpeed.value) / 3.6, // km/h → m/s
    };

    // Isolation
    let insulation = null;
    if (elements.hasInsulation.checked) {
      const thicknessMm = parseFloat(elements.insulationThickness.value);
      insulation = {
        material: elements.insulationMaterial.value,
        thickness: thicknessMm / 1000.0, // mm → m
      };
    }

    // Configuration réseau
    const totalLength = parseFloat(elements.pipeLength.value);
    const numSegments = Math.min(Math.max(Math.ceil(totalLength / 5), 10), 100); // 10-100 segments

    return {
      geometry,
      totalLength,
      numSegments,
      fluid,
      ambient,
      insulation,

      // Métadonnées pour affichage
      meta: {
        material: material,
        schedule: schedule,
        nps: nps,
        flowM3PerHr: flowM3PerHr,
        hasInsulation: elements.hasInsulation.checked,
      },
    };
  }

  window.InputForm = {
    init,
    triggerAnalysis, // Export pour permettre le calcul initial
  };

  // Node.js dual export for tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.InputForm;
  }
})();
