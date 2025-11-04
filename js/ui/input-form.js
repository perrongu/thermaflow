/**
 * input-form.js
 *
 * Gestion du formulaire d'entrée pour ThermaFlow
 *
 * Fonctionnalités:
 * - Menus déroulants synchronisés (matériau → schedule/type → NPS)
 * - Mise à jour automatique des dimensions (OD, ID, WT)
 * - Mise à jour du schéma SVG
 * - Validation en temps réel
 * - Gestion isolation (afficher/cacher champs)
 * - Conversion unités (m³/hr → kg/s, km/h → m/s, mm → m)
 * - Récupération données formulaire
 * - Déclenchement calcul
 */

(function () {
  "use strict";

  // ========== RUGOSITÉ PAR MATÉRIAU ==========
  const MATERIAL_ROUGHNESS = {
    steel: 0.045e-3, // m (acier commercial)
    copper: 0.0015e-3, // m (cuivre)
    stainless_steel: 0.015e-3, // m (inox)
  };

  // ========== ÉLÉMENTS DOM ==========
  let elements = {};

  // ========== UNITÉS COURANTES ==========
  let currentUnits = {
    flowRate: "m3_h",
    pressure: "kPag",
  };

  // ========== INITIALISATION ==========
  function init() {
    // Vérifier que PipeSpecsLoader et PipeDiagram sont disponibles
    if (typeof PipeSpecsLoader === "undefined") {
      console.error("❌ PipeSpecsLoader non chargé");
      return;
    }
    if (typeof PipeDiagram === "undefined") {
      console.error("❌ PipeDiagram non chargé");
      return;
    }
    if (typeof UnitConverter === "undefined") {
      console.error("❌ UnitConverter non chargé");
      return;
    }

    // Charger les préférences d'unités depuis localStorage
    loadUnitPreferences();

    // Récupérer les éléments de contrôle (disponibles immédiatement)
    elements = {
      form: document.getElementById("analysis-form"),
      hasInsulation: document.getElementById("has-insulation"),
      insulationFieldsDiagram: document.getElementById(
        "insulation-fields-diagram",
      ),

      // Conduite
      pipeMaterial: document.getElementById("pipe-material"),
      pipeSchedule: document.getElementById("pipe-schedule"),
      pipeScheduleLabel: document.getElementById("pipe-schedule-label"),
      pipeNPS: document.getElementById("pipe-nps"),

      // Isolation
      insulationMaterial: document.getElementById("insulation-material"),
      insulationThickness: document.getElementById("insulation-thickness"),
    };

    // Initialiser le schéma SVG
    PipeDiagram.init();

    // Initialiser avec valeurs par défaut (crée le SVG avec les inputs)
    initializeDefaultValues();

    // Attendre que le SVG soit complètement rendu avant de récupérer les inputs
    requestAnimationFrame(() => {
      // Récupérer les inputs créés dans le SVG via foreignObject
      elements.pipeLength = document.getElementById("pipe-length");
      elements.waterTemp = document.getElementById("water-temp");
      elements.waterFlow = document.getElementById("water-flow");
      elements.waterPressure = document.getElementById("water-pressure");
      elements.airTemp = document.getElementById("air-temp");
      elements.windSpeed = document.getElementById("wind-speed");
    });

    // Attacher les événements
    attachEvents();

    // État initial de l'isolation
    toggleInsulationFields();

    console.log("✅ InputForm initialisé");
  }

  // ========== VALEURS PAR DÉFAUT ==========
  function initializeDefaultValues() {
    // Matériau par défaut: steel
    elements.pipeMaterial.value = "steel";

    // Remplir les schedules pour l'acier
    updateScheduleOptions("steel");

    // Sélectionner schedule 40
    elements.pipeSchedule.value = "40";

    // Remplir les NPS pour steel/40
    updateNPSOptions("steel", "40");

    // Sélectionner NPS 4"
    elements.pipeNPS.value = "4";

    // Mettre à jour les specs et le schéma
    updatePipeSpecs();
  }

  // ========== ÉVÉNEMENTS ==========
  function attachEvents() {
    // Checkbox isolation
    elements.hasInsulation.addEventListener("change", toggleInsulationFields);

    // Changements de spécifications de tuyau
    elements.pipeMaterial.addEventListener("change", handleMaterialChange);
    elements.pipeSchedule.addEventListener("change", handleScheduleChange);
    elements.pipeNPS.addEventListener("change", handleNPSChange);

    // Changements d'isolation
    elements.insulationMaterial.addEventListener("change", function () {
      triggerAnalysis({
        priority: "high",
        reason: "insulation-material-change",
      });
    });

    // Attendre que les inputs dans le SVG soient créés avant d'attacher les événements
    // Utiliser une approche plus fiable que setTimeout
    waitForSVGInputs();

    // Réagir au changement de langue (mise à jour du label Schedule/Type)
    document.addEventListener("thermaflow:language-changed", function () {
      if (elements && elements.pipeMaterial) {
        updateScheduleLabel(elements.pipeMaterial.value);
      }
    });
  }

  // ========== FONCTION DEBOUNCÉE GLOBALE ==========
  // Variable pour stocker la fonction debouncée (créée lors de l'initialisation)
  let debouncedAnalysis = null;

  // Créer la fonction debouncée (appelée une fois dans attachEvents)
  function createDebouncedAnalysis() {
    if (!debouncedAnalysis && typeof UIUtils !== "undefined") {
      debouncedAnalysis = UIUtils.debounce(function () {
        triggerAnalysis({ priority: "low", reason: "input-debounced" });
      }, 300);
    }
    return debouncedAnalysis;
  }

  // ========== ATTACHER ÉVÉNEMENTS À UN INPUT ==========
  function attachInputEvents(input) {
    if (!input) return;

    // S'assurer que la fonction debouncée est créée
    const debounced = createDebouncedAnalysis();
    if (!debounced) return;

    // Validation visuelle inline sur input (immédiat)
    input.addEventListener("input", function () {
      validateInputVisual(input);
      // Déclencher recalcul debounced
      debounced();
    });

    // Intercepter virgules lors de la frappe
    input.addEventListener("keypress", function (e) {
      handleCommaKeypress(e, input);
    });

    // Normaliser virgules lors du collage (Ctrl+V)
    input.addEventListener("paste", function (e) {
      handleCommaPaste(e, input);
    });

    // Déclencher recalcul immédiat au blur
    input.addEventListener("blur", function () {
      clampInputValue(input);
      // Annuler le debounce en cours
      debounced.cancel();
      // Recalcul immédiat
      triggerAnalysis({ priority: "high", reason: "blur" });
    });

    // Déclencher recalcul immédiat sur Enter
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        clampInputValue(input);
        // Annuler le debounce en cours
        debounced.cancel();
        // Recalcul immédiat
        triggerAnalysis({ priority: "immediate", reason: "enter" });
      }
    });
  }

  // ========== ATTENDRE CRÉATION INPUTS SVG ==========
  function waitForSVGInputs() {
    const inputIds = [
      "pipe-length",
      "water-temp",
      "water-flow",
      "water-pressure",
      "air-temp",
      "wind-speed",
      "flow-unit",
      "pressure-unit",
    ];

    // Vérifier si tous les inputs existent
    function checkAndAttach() {
      const allExist = inputIds.every(
        (id) => document.getElementById(id) !== null,
      );

      if (allExist) {
        attachBlurEvents();
        attachUnitChangeEvents();
        applyUnitPreferences();
      } else {
        // Réessayer au prochain frame
        requestAnimationFrame(checkAndAttach);
      }
    }

    requestAnimationFrame(checkAndAttach);
  }

  // ========== ATTACHER ÉVÉNEMENTS BLUR ==========
  function attachBlurEvents() {
    const inputIds = [
      "pipe-length",
      "water-temp",
      "water-flow",
      "water-pressure",
      "air-temp",
      "wind-speed",
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
  function reattachInputEvents() {
    // CRITIQUE: Sauvegarder les valeurs actuelles AVANT de récupérer les nouveaux inputs
    const savedValues = {
      pipeLength: elements.pipeLength ? elements.pipeLength.value : null,
      waterTemp: elements.waterTemp ? elements.waterTemp.value : null,
      waterFlow: elements.waterFlow ? elements.waterFlow.value : null,
      waterPressure: elements.waterPressure
        ? elements.waterPressure.value
        : null,
      airTemp: elements.airTemp ? elements.airTemp.value : null,
      windSpeed: elements.windSpeed ? elements.windSpeed.value : null,
    };

    // Mettre à jour les références vers les nouveaux inputs
    elements.pipeLength = document.getElementById("pipe-length");
    elements.waterTemp = document.getElementById("water-temp");
    elements.waterFlow = document.getElementById("water-flow");
    elements.waterPressure = document.getElementById("water-pressure");
    elements.airTemp = document.getElementById("air-temp");
    elements.windSpeed = document.getElementById("wind-speed");

    // CRITIQUE: Restaurer les valeurs sauvegardées dans les nouveaux inputs
    if (savedValues.pipeLength && elements.pipeLength) {
      elements.pipeLength.value = savedValues.pipeLength;
    }
    if (savedValues.waterTemp && elements.waterTemp) {
      elements.waterTemp.value = savedValues.waterTemp;
    }
    if (savedValues.waterFlow && elements.waterFlow) {
      elements.waterFlow.value = savedValues.waterFlow;
    }
    if (savedValues.waterPressure && elements.waterPressure) {
      elements.waterPressure.value = savedValues.waterPressure;
    }
    if (savedValues.airTemp && elements.airTemp) {
      elements.airTemp.value = savedValues.airTemp;
    }
    if (savedValues.windSpeed && elements.windSpeed) {
      elements.windSpeed.value = savedValues.windSpeed;
    }

    // Réattacher les événements
    const inputs = [
      elements.pipeLength,
      elements.waterTemp,
      elements.waterFlow,
      elements.waterPressure,
      elements.airTemp,
      elements.windSpeed,
    ];

    inputs.forEach((input) => {
      attachInputEvents(input);
    });

    // Réattacher aussi les événements d'unités
    attachUnitChangeEvents();
    applyUnitPreferences();
  }

  // ========== VALIDATION VISUELLE INLINE ==========
  function validateInputVisual(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    // Feedback visuel immédiat (sans recalcul)
    if (isNaN(value) || value < min || value > max) {
      input.classList.add("param-input--invalid");
    } else {
      input.classList.remove("param-input--invalid");
    }
  }

  // ========== GESTION VIRGULE FRAPPE ==========
  function handleCommaKeypress(event, input) {
    // Si l'utilisateur tape une virgule, la remplacer par un point
    if (event.key === "," || event.key === "Decimal") {
      event.preventDefault();

      // Vérifier qu'il n'y a pas déjà un point
      if (!input.value.includes(".")) {
        // Insérer un point à la position du curseur
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        input.value = value.substring(0, start) + "." + value.substring(end);

        // Repositionner le curseur
        input.setSelectionRange(start + 1, start + 1);

        // Déclencher l'événement input pour que le navigateur valide
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }

  // ========== GESTION VIRGULE COLLAGE ==========
  function handleCommaPaste(event, input) {
    // Récupérer le texte collé
    const pastedText = event.clipboardData.getData("text");

    // Si le texte contient une virgule, le corriger
    if (pastedText.includes(",")) {
      event.preventDefault();

      // Remplacer toutes les virgules par des points
      const correctedText = pastedText.replace(/,/g, ".");

      // Insérer le texte corrigé à la position du curseur
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const value = input.value;
      input.value =
        value.substring(0, start) + correctedText + value.substring(end);

      // Repositionner le curseur après le texte collé
      const newPos = start + correctedText.length;
      input.setSelectionRange(newPos, newPos);

      // Déclencher l'événement input pour que le navigateur valide
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  // ========== CLAMPING VALEUR INPUT ==========
  function clampInputValue(input) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    let value = parseFloat(input.value);

    // Gérer les valeurs invalides
    if (isNaN(value)) {
      // Utiliser la valeur par défaut ou le min
      value = parseFloat(input.defaultValue) || min;
    }

    // Clamper
    if (!isNaN(min) && value < min) {
      value = min;
    }
    if (!isNaN(max) && value > max) {
      value = max;
    }

    // Mettre à jour l'input
    input.value = value;
  }

  // ========== DÉCLENCHER ANALYSE ==========
  function triggerAnalysis(options = {}) {
    // Valider le formulaire
    if (!validateForm()) {
      console.warn("⚠️ Formulaire invalide, analyse non déclenchée");
      return;
    }

    // Récupérer les données
    const formData = getFormData();

    // Déclencher le calcul (via événement custom avec options)
    const event = new CustomEvent("thermaflow:analyze", {
      detail: {
        config: formData,
        options: options,
      },
    });
    document.dispatchEvent(event);
  }

  // ========== GESTION CHANGEMENTS TUYAU ==========
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
    triggerAnalysis({ priority: "high", reason: "material-change" });
  }

  function handleScheduleChange() {
    const material = elements.pipeMaterial.value;
    const schedule = elements.pipeSchedule.value;

    // Mettre à jour les NPS disponibles
    updateNPSOptions(material, schedule);

    // Mettre à jour les specs
    updatePipeSpecs();

    // Déclencher le recalcul immédiat (changement majeur)
    triggerAnalysis({ priority: "high", reason: "schedule-change" });
  }

  function handleNPSChange() {
    // Mettre à jour les specs
    updatePipeSpecs();

    // Déclencher le recalcul immédiat (changement majeur)
    triggerAnalysis({ priority: "high", reason: "nps-change" });
  }

  // ========== MISE À JOUR LABEL ==========
  function updateScheduleLabel(material) {
    if (PipeSpecsLoader.usesTypes(material)) {
      elements.pipeScheduleLabel.textContent = window.I18n
        ? I18n.t("controls.type")
        : "Type";
    } else {
      elements.pipeScheduleLabel.textContent = window.I18n
        ? I18n.t("controls.schedule")
        : "Schedule";
    }
  }

  // ========== MISE À JOUR OPTIONS SCHEDULE/TYPE ==========
  function updateScheduleOptions(material) {
    const schedules = PipeSpecsLoader.getAvailableSchedules(material);

    // Vider le select
    elements.pipeSchedule.innerHTML = "";

    // Remplir avec les options
    schedules.forEach((schedule) => {
      const option = document.createElement("option");
      option.value = schedule;
      option.textContent = schedule;
      elements.pipeSchedule.appendChild(option);
    });

    // Sélectionner explicitement la première option pour éviter les valeurs invalides
    if (schedules.length > 0) {
      elements.pipeSchedule.value = schedules[0];
    }
  }

  // ========== MISE À JOUR OPTIONS NPS ==========
  function updateNPSOptions(material, schedule) {
    const npsList = PipeSpecsLoader.getAvailableNPS(material, schedule);

    // Vider le select
    elements.pipeNPS.innerHTML = "";

    // Remplir avec les options
    npsList.forEach((nps) => {
      const option = document.createElement("option");
      option.value = nps;
      // Formater l'affichage: nombre entier ou fraction
      const displayText =
        nps < 1 ? nps : Math.floor(nps) === nps ? nps : nps.toFixed(2);
      option.textContent = `${displayText}"`;
      elements.pipeNPS.appendChild(option);
    });

    // Sélectionner explicitement la première option pour éviter les valeurs invalides
    if (npsList.length > 0) {
      elements.pipeNPS.value = npsList[0].toString();
    }
  }

  // ========== MISE À JOUR SPECS ==========
  function updatePipeSpecs() {
    const material = elements.pipeMaterial.value;
    const schedule = elements.pipeSchedule.value;
    const nps = parseFloat(elements.pipeNPS.value);

    if (!material || !schedule || !nps || isNaN(nps)) {
      console.warn("Paramètres de tuyau incomplets ou invalides:", {
        material,
        schedule,
        nps,
      });
      return;
    }

    // Récupérer les specs
    const specs = PipeSpecsLoader.getPipeSpecs(material, schedule, nps);

    if (!specs) {
      console.error(
        `❌ Specs introuvables pour: ${material} / ${schedule} / ${nps}"`,
      );
      console.error(
        "Combinaison invalide détectée. Vérifiez les données pipespecs.",
      );
      return;
    }

    // Mettre à jour le schéma (dimensions affichées dans le SVG)
    if (typeof PipeDiagram !== "undefined") {
      PipeDiagram.update(specs);
    }

    // CRITIQUE: Réattacher les événements car le schéma a recréé les inputs
    setTimeout(() => {
      reattachInputEvents();
    }, 100);
  }

  function toggleInsulationFields() {
    const isChecked = elements.hasInsulation.checked;
    elements.insulationFieldsDiagram.style.display = isChecked
      ? "flex"
      : "none";

    // Désactiver/activer les champs
    elements.insulationMaterial.disabled = !isChecked;
    elements.insulationThickness.disabled = !isChecked;

    // Redessiner le schéma pour afficher/cacher l'isolation
    updatePipeSpecs();

    // Déclencher le recalcul immédiat (changement majeur)
    triggerAnalysis({ priority: "high", reason: "insulation-toggle" });
  }

  // ========== VALIDATION ==========
  function validateForm() {
    // Vérifier que tous les champs requis sont remplis
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

    // Vérifier que tous les éléments existent (peuvent être créés plus tard dans le SVG)
    for (const field of requiredFields) {
      if (!field) {
        // Éléments pas encore créés, retourner false silencieusement
        return false;
      }
    }

    for (const field of requiredFields) {
      if (!field.value || field.value === "") {
        const label = field.previousElementSibling
          ? field.previousElementSibling.textContent
          : "";
        const msg = window.I18n
          ? I18n.t("validation.requiredMissing", { label })
          : `Champ requis manquant: ${label}`;
        alert(msg);
        field.focus();
        return false;
      }
    }

    // Validation des plages
    if (elements.pipeLength.value < 1 || elements.pipeLength.value > 2500) {
      alert(
        window.I18n
          ? I18n.t("validation.lengthRange")
          : "Longueur doit être entre 1 et 2500 m",
      );
      elements.pipeLength.focus();
      return false;
    }

    if (elements.waterTemp.value < 1 || elements.waterTemp.value > 100) {
      alert(
        window.I18n
          ? I18n.t("validation.waterTempRange")
          : "Température eau doit être entre 1 et 100°C",
      );
      elements.waterTemp.focus();
      return false;
    }

    if (elements.airTemp.value < -50 || elements.airTemp.value > 30) {
      alert(
        window.I18n
          ? I18n.t("validation.airTempRange")
          : "Température air doit être entre -50 et 30°C",
      );
      elements.airTemp.focus();
      return false;
    }

    // Validation pression avec plages dynamiques selon l'unité
    const pressureRanges = UnitConverter.getRanges("pressure");
    const pressureValue = parseFloat(elements.waterPressure.value);
    if (
      pressureValue < pressureRanges.min ||
      pressureValue > pressureRanges.max
    ) {
      const pressureUnit = UnitConverter.getUnitInfo("pressure").label;
      const msg = window.I18n
        ? I18n.t("validation.waterPressureRange")
            .replace("100", pressureRanges.min.toFixed(0))
            .replace("1000", pressureRanges.max.toFixed(0))
            .replace("kPag", pressureUnit)
        : `Pression eau doit être entre ${pressureRanges.min.toFixed(0)} et ${pressureRanges.max.toFixed(0)} ${pressureUnit}`;
      alert(msg);
      elements.waterPressure.focus();
      return false;
    }

    // Validation débit avec plages dynamiques selon l'unité
    const flowRanges = UnitConverter.getRanges("flowRate");
    const flowValue = parseFloat(elements.waterFlow.value);
    if (flowValue < flowRanges.min || flowValue > flowRanges.max) {
      const flowUnit = UnitConverter.getUnitInfo("flowRate").label;
      const msg = window.I18n
        ? I18n.t("validation.waterFlowRange")
            .replace("0.06", flowRanges.min.toFixed(2))
            .replace("30", flowRanges.max.toFixed(2))
            .replace("m³/hr", flowUnit)
        : `Débit eau doit être entre ${flowRanges.min.toFixed(2)} et ${flowRanges.max.toFixed(2)} ${flowUnit}`;
      alert(msg);
      elements.waterFlow.focus();
      return false;
    }

    if (elements.windSpeed.value < 0 || elements.windSpeed.value > 108) {
      alert(
        window.I18n
          ? I18n.t("validation.windSpeedRange")
          : "Vitesse vent doit être entre 0 et 108 km/h",
      );
      elements.windSpeed.focus();
      return false;
    }

    return true;
  }

  // ========== RÉCUPÉRATION DONNÉES ==========
  function getFormData() {
    // Récupérer les specs de tuyau
    const material = elements.pipeMaterial.value;
    const schedule = elements.pipeSchedule.value;
    const nps = parseFloat(elements.pipeNPS.value);

    const specs = PipeSpecsLoader.getPipeSpecs(material, schedule, nps);

    if (!specs) {
      throw new Error(
        `Specs introuvables pour ${material} ${schedule} ${nps}"`,
      );
    }

    // Conversions des unités d'entrée
    // Débit: convertir depuis unité d'affichage vers m³/h (SI d'affichage)
    const flowDisplayValue = parseFloat(elements.waterFlow.value);
    const flowM3PerHr = UnitConverter.toSI("flowRate", flowDisplayValue);

    // Pression: convertir depuis unité d'affichage vers kPag (SI d'affichage)
    const pressureDisplayValue = parseFloat(elements.waterPressure.value);
    const P_water_kPag = UnitConverter.toSI("pressure", pressureDisplayValue);
    const P_water_bar = P_water_kPag / 100.0; // kPag → bar (1 bar = 100 kPa)

    // Température: reste en °C (pas de conversion)
    const T_water = parseFloat(elements.waterTemp.value);

    // Obtenir la densité de l'eau à T et P donnés (nécessaire pour conversion précise)
    let rho_water = 1000; // Valeur par défaut [kg/m³]
    if (typeof window.WaterProperties !== "undefined") {
      try {
        const waterProps = window.WaterProperties.getWaterProperties(
          T_water,
          P_water_bar,
        );
        rho_water = waterProps.rho;
      } catch (e) {
        console.warn(
          "Impossible d'obtenir la densité de l'eau, utilisation valeur par défaut:",
          e,
        );
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

  // ========== GESTION DES UNITÉS ==========

  /**
   * Charge les préférences d'unités depuis localStorage
   */
  function loadUnitPreferences() {
    if (typeof Storage === "undefined") return;

    const savedData = Storage.load();
    if (savedData && savedData.unitPreferences) {
      currentUnits = { ...currentUnits, ...savedData.unitPreferences };
      UnitConverter.loadPreferences(savedData.unitPreferences);
      console.log("📂 Préférences unités chargées:", currentUnits);
    }
  }

  /**
   * Applique les préférences d'unités aux dropdowns
   */
  function applyUnitPreferences() {
    const flowUnitSelect = document.getElementById("flow-unit");
    const pressureUnitSelect = document.getElementById("pressure-unit");

    if (flowUnitSelect) {
      flowUnitSelect.value = currentUnits.flowRate;
    }
    if (pressureUnitSelect) {
      pressureUnitSelect.value = currentUnits.pressure;
    }

    // Ajuster les plages min/max selon l'unité
    updateInputRanges();
  }

  /**
   * Attache les événements de changement d'unité
   */
  function attachUnitChangeEvents() {
    const flowUnitSelect = document.getElementById("flow-unit");
    const pressureUnitSelect = document.getElementById("pressure-unit");

    if (flowUnitSelect) {
      flowUnitSelect.addEventListener("change", function () {
        handleUnitChange("flowRate", this.value, "water-flow");
      });
    }

    if (pressureUnitSelect) {
      pressureUnitSelect.addEventListener("change", function () {
        handleUnitChange("pressure", this.value, "water-pressure");
      });
    }
  }

  /**
   * Gère le changement d'unité pour un paramètre
   * @param {string} paramType - Type de paramètre ('flowRate' ou 'pressure')
   * @param {string} newUnit - Nouvelle unité sélectionnée
   * @param {string} inputId - ID de l'input associé
   */
  function handleUnitChange(paramType, newUnit, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const oldUnit = currentUnits[paramType];
    const currentValue = parseFloat(input.value);

    if (isNaN(currentValue)) {
      // Pas de valeur à convertir, juste changer l'unité
      currentUnits[paramType] = newUnit;
      UnitConverter.setUnit(paramType, newUnit);
      updateInputRanges();
      saveUnitPreferences();
      return;
    }

    // Convertir la valeur de l'ancienne unité vers la nouvelle
    const convertedValue = UnitConverter.convert(
      paramType,
      currentValue,
      oldUnit,
      newUnit,
    );

    // Mettre à jour l'input avec la valeur convertie
    input.value = convertedValue.toFixed(
      UnitConverter.getUnitInfo(paramType, newUnit).decimals,
    );

    // Mettre à jour l'unité courante
    currentUnits[paramType] = newUnit;
    UnitConverter.setUnit(paramType, newUnit);

    // Ajuster les plages min/max
    updateInputRanges();

    // Sauvegarder la préférence
    saveUnitPreferences();

    // Déclencher recalcul
    triggerAnalysis({ priority: "high", reason: "unit-change" });

    console.log(
      `🔄 Unité changée: ${paramType} ${oldUnit} → ${newUnit}, valeur: ${currentValue} → ${convertedValue.toFixed(2)}`,
    );
  }

  /**
   * Met à jour les plages min/max des inputs selon l'unité courante
   */
  function updateInputRanges() {
    // Débit
    const flowInput = document.getElementById("water-flow");
    if (flowInput) {
      const flowRanges = UnitConverter.getRanges("flowRate");
      flowInput.min = flowRanges.min.toFixed(flowRanges.decimals);
      flowInput.max = flowRanges.max.toFixed(flowRanges.decimals);
      flowInput.step = (flowRanges.max - flowRanges.min) / 1000; // 1000 steps
    }

    // Pression
    const pressureInput = document.getElementById("water-pressure");
    if (pressureInput) {
      const pressureRanges = UnitConverter.getRanges("pressure");
      pressureInput.min = pressureRanges.min.toFixed(pressureRanges.decimals);
      pressureInput.max = pressureRanges.max.toFixed(pressureRanges.decimals);
      pressureInput.step = currentUnits.pressure === "psig" ? "1" : "10";
    }
  }

  /**
   * Sauvegarde les préférences d'unités dans localStorage
   */
  function saveUnitPreferences() {
    if (typeof Storage === "undefined") return;

    const savedData = Storage.load();
    if (savedData) {
      // Mettre à jour unitPreferences dans l'objet existant
      savedData.unitPreferences = { ...currentUnits };
      // Sauvegarder le config existant
      Storage.save(savedData.config);
    } else {
      // Pas de données existantes, juste logger
      console.log(
        "💾 Préférences unités seront sauvegardées lors du prochain calcul",
      );
    }
  }

  // ========== EXPORT ==========
  window.InputForm = {
    init,
    triggerAnalysis, // Export pour permettre le calcul initial
  };
})();
