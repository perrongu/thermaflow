/**
 * sensitivity-analysis-1d.js
 *
 * Analyse de sensibilité 1D (paramétrique) pour ThermaFlow
 *
 * Génère un tableau récapitulatif et des graphiques tornado en barres horizontales
 * montrant l'impact de chaque paramètre sur la température finale.
 * Style inspiré des graphiques tornado classiques avec valeur de base et points critiques.
 */

(function () {
  'use strict';

  // ========== CONSTANTES ==========
  // const RESOLUTION_1D = 15; // Points par paramètre (non utilisé, utilise config dynamique)
  const FREEZE_TEMP = 0; // °C - Température de gel de l'eau pure
  const SAFETY_THRESHOLD = 5; // °C - Marge de sécurité opérationnelle standard industrielle

  // Définition des paramètres analysables (même que sensitivity-analysis.js)
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
      label: 'Épaisseur isolation',
      unit: 'mm',
      path: ['insulation', 'thickness'],
      conditional: true,
      min: 5,
      max: 100,
    },
  };

  // ========== DÉTECTION PLAGE EFFECTIVE ==========
  /**
   * Détecte la plage effective d'un paramètre où les calculs convergent
   * Échantillonne 10 points et trouve les limites valides
   * @param {Object} baseConfig - Configuration de base
   * @param {string} paramKey - Clé du paramètre
   * @param {Object} paramDef - Définition du paramètre
   * @returns {Object} { min, max, samplesValid }
   */
  function detectEffectiveRange(baseConfig, paramKey, paramDef) {
    const SAMPLES = 15; // Augmenté pour meilleure résolution
    const samples = [];

    // Échantillonner uniformément sur la plage théorique
    for (let i = 0; i < SAMPLES; i++) {
      const fraction = i / (SAMPLES - 1);
      const value = paramDef.min + fraction * (paramDef.max - paramDef.min);

      try {
        const testConfig = JSON.parse(JSON.stringify(baseConfig));
        applyParameterValue(testConfig, paramKey, value);
        const result = calculatePipeNetwork(testConfig);

        samples.push({
          value: value,
          valid: true,
          T_final: result.T_final,
        });
      } catch (error) {
        samples.push({
          value: value,
          valid: false,
          error: error.message,
        });
      }
    }

    // Trouver la plage continue valide la plus large
    const validSamples = samples.filter((s) => s.valid);

    if (validSamples.length === 0) {
      // Aucun point valide - retourner plage théorique (affichera erreur)
      return {
        min: paramDef.min,
        max: paramDef.max,
        samplesValid: 0,
      };
    }

    if (validSamples.length === SAMPLES) {
      // Tous les points valides - retourner plage théorique complète
      return {
        min: paramDef.min,
        max: paramDef.max,
        samplesValid: SAMPLES,
      };
    }

    // Trouver la plage continue la plus large
    // Stratégie: chercher la séquence continue de points valides la plus longue
    let bestStart = 0;
    let bestLength = 0;
    let currentStart = -1;
    let currentLength = 0;

    for (let i = 0; i < samples.length; i++) {
      if (samples[i].valid) {
        if (currentStart === -1) {
          currentStart = i;
          currentLength = 1;
        } else {
          currentLength++;
        }
      } else {
        if (currentLength > bestLength) {
          bestStart = currentStart;
          bestLength = currentLength;
        }
        currentStart = -1;
        currentLength = 0;
      }
    }

    // Vérifier la dernière séquence
    if (currentLength > bestLength) {
      bestStart = currentStart;
      bestLength = currentLength;
    }

    if (bestLength === 0) {
      // Cas pathologique: pas de séquence continue (points valides isolés)
      // Utiliser min et max des points valides avec marge
      const validValues = validSamples.map((s) => s.value);
      const minVal = Math.min(...validValues);
      const maxVal = Math.max(...validValues);
      const sampleInterval = (paramDef.max - paramDef.min) / (SAMPLES - 1);
      const safetyMargin = sampleInterval * 0.1;

      return {
        min: Math.max(minVal + safetyMargin, paramDef.min),
        max: Math.min(maxVal - safetyMargin, maxVal), // Ne pas réduire maxVal en dessous de lui-même
        samplesValid: validSamples.length,
      };
    }

    // Utiliser la séquence continue trouvée avec marges de sécurité LARGES
    // Stratégie ultra-conservatrice: ignorer les 2-3 premiers et derniers points
    let minEffective, maxEffective;

    if (bestLength >= 8) {
      // Si ≥8 points valides: utiliser 3ème et 3ème avant la fin (ignore 2 points de chaque côté)
      minEffective = samples[bestStart + 2].value;
      maxEffective = samples[bestStart + bestLength - 3].value;
    } else if (bestLength >= 5) {
      // Si 5-7 points: utiliser 2ème et 2ème avant la fin
      minEffective = samples[bestStart + 1].value;
      maxEffective = samples[bestStart + bestLength - 2].value;
    } else if (bestLength >= 3) {
      // Si 3-4 points: utiliser 1er et avant-dernier avec marge additionnelle
      minEffective = samples[bestStart].value;
      maxEffective = samples[bestStart + bestLength - 2].value;
      const sampleInterval = (paramDef.max - paramDef.min) / (SAMPLES - 1);
      const safetyMargin = sampleInterval * 0.2;
      minEffective = Math.min(minEffective + safetyMargin, maxEffective - safetyMargin);
      maxEffective = Math.max(maxEffective - safetyMargin, minEffective + safetyMargin);
    } else if (bestLength === 2) {
      // 2 points: utiliser seulement le premier avec marge réduite
      minEffective = samples[bestStart].value;
      maxEffective = samples[bestStart].value;
      const sampleInterval = (paramDef.max - paramDef.min) / (SAMPLES - 1);
      minEffective = Math.max(minEffective, paramDef.min);
      maxEffective = Math.min(minEffective + sampleInterval * 0.5, paramDef.max);
    } else {
      // 1 seul point: créer mini-plage autour
      minEffective = samples[bestStart].value;
      maxEffective = samples[bestStart].value;
      const sampleInterval = (paramDef.max - paramDef.min) / (SAMPLES - 1);
      const margin = sampleInterval * 0.25;
      minEffective = Math.max(minEffective - margin, paramDef.min);
      maxEffective = Math.min(maxEffective + margin, paramDef.max);
    }

    // S'assurer que min < max
    if (minEffective >= maxEffective) {
      const mid = (minEffective + maxEffective) / 2;
      const delta = (paramDef.max - paramDef.min) * 0.01;
      minEffective = Math.max(mid - delta, paramDef.min);
      maxEffective = Math.min(mid + delta, paramDef.max);
    }

    // VALIDATION FINALE RENFORCÉE: Vérifier que les bornes fonctionnent vraiment
    // Réduction agressive si échec
    let finalMin = minEffective;
    let finalMax = maxEffective;

    // Test du max (le plus critique pour les débits)
    let maxValid = false;
    let consecutiveSuccesses = 0;
    const REQUIRED_SUCCESSES = 2; // Doit réussir 2 fois consécutivement

    for (let attempt = 0; attempt < 10 && consecutiveSuccesses < REQUIRED_SUCCESSES; attempt++) {
      try {
        const testConfig = JSON.parse(JSON.stringify(baseConfig));
        applyParameterValue(testConfig, paramKey, finalMax);
        const result = calculatePipeNetwork(testConfig);

        // Vérifier aussi que le résultat est raisonnable (pas de Re extrême)
        // Pour débit: vérifier que ça ne génère pas des conditions impossibles
        if (result && result.T_final !== null && result.T_final !== undefined) {
          consecutiveSuccesses++;
          if (consecutiveSuccesses >= REQUIRED_SUCCESSES) {
            maxValid = true;
            break;
          }
          // Tester légèrement au-dessus pour confirmer stabilité
          finalMax = finalMax * 0.98; // Réduction préventive de 2%
        }
      } catch (error) {
        consecutiveSuccesses = 0; // Reset si échec
        // Réduction très agressive de 40% vers le centre
        const reduction = (finalMax - finalMin) * 0.4;
        finalMax = Math.max(finalMax - reduction, finalMin + (finalMax - finalMin) * 0.05);
      }
    }

    // Test du min
    let minValid = false;
    consecutiveSuccesses = 0;

    for (let attempt = 0; attempt < 10 && consecutiveSuccesses < REQUIRED_SUCCESSES; attempt++) {
      try {
        const testConfig = JSON.parse(JSON.stringify(baseConfig));
        applyParameterValue(testConfig, paramKey, finalMin);
        const result = calculatePipeNetwork(testConfig);

        if (result && result.T_final !== null && result.T_final !== undefined) {
          consecutiveSuccesses++;
          if (consecutiveSuccesses >= REQUIRED_SUCCESSES) {
            minValid = true;
            break;
          }
          // Tester légèrement au-dessus pour confirmer stabilité
          finalMin = finalMin * 1.02; // Augmentation préventive de 2%
        }
      } catch (error) {
        consecutiveSuccesses = 0; // Reset si échec
        // Augmentation très agressive de 40% vers le centre
        const increase = (finalMax - finalMin) * 0.4;
        finalMin = Math.min(finalMin + increase, finalMax - (finalMax - finalMin) * 0.05);
      }
    }

    // Si toujours invalide après tentatives, retourner plage théorique (affichera erreur)
    if (!minValid || !maxValid || finalMin >= finalMax) {
      return {
        min: paramDef.min,
        max: paramDef.max,
        samplesValid: 0,
      };
    }

    return {
      min: finalMin,
      max: finalMax,
      samplesValid: bestLength,
    };
  }

  // ========== ANALYSE 1D ==========
  /**
   * Analyse la sensibilité 1D pour tous les paramètres
   * @param {Object} baseConfig - Configuration de base
   * @returns {Array} Résultats pour chaque paramètre
   */
  function analyzeSensitivity1D(baseConfig) {
    const results = [];

    // Calculer T_final au cas de base (une seule fois)
    let T_base = null;
    try {
      const baseResult = calculatePipeNetwork(baseConfig);
      T_base = baseResult.T_final;
      // console.log(`📊 T_base = ${T_base.toFixed(2)}°C`);
    } catch (error) {
      console.error('Erreur calcul cas de base:', error);
      return results;
    }

    for (const [paramKey, paramDef] of Object.entries(PARAMETER_DEFINITIONS)) {
      // Vérifier si le paramètre est applicable
      if (paramDef.conditional) {
        const hasInsulation = baseConfig.meta && baseConfig.meta.hasInsulation;
        if (!hasInsulation) {
          continue; // Sauter l'isolation si non active
        }
      }

      // console.log(`📊 Analyse 1D pour ${paramDef.label}...`);

      const baseValue = getDisplayValue(baseConfig, paramKey);

      // Détecter la plage effective valide (où les calculs convergent)
      const effectiveRange = detectEffectiveRange(baseConfig, paramKey, paramDef);

      // Utiliser la plage effective au lieu de min/max théoriques
      let minToUse = effectiveRange.min;
      let maxToUse = effectiveRange.max;

      // Calculer T_final au MIN effectif avec augmentation progressive si échec
      let T_atMin = null;
      let errorAtMin = null;
      let effectiveMin = minToUse;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const testConfig = JSON.parse(JSON.stringify(baseConfig));
          applyParameterValue(testConfig, paramKey, effectiveMin);
          const result = calculatePipeNetwork(testConfig);
          T_atMin = result.T_final;
          if (effectiveMin !== minToUse) {
            minToUse = effectiveMin; // Mettre à jour pour le reste
          }
          break; // Succès!
        } catch (error) {
          if (attempt === 4) {
            console.warn(`❌ MIN échoue même après 5 tentatives pour ${paramKey}`);
            errorAtMin = error.message;
          } else {
            // Augmenter de 10% et réessayer
            effectiveMin = effectiveMin * 1.1;
          }
        }
      }

      // Calculer T_final au MAX effectif avec réduction progressive si échec
      let T_atMax = null;
      let errorAtMax = null;
      let effectiveMax = maxToUse;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const testConfig = JSON.parse(JSON.stringify(baseConfig));
          applyParameterValue(testConfig, paramKey, effectiveMax);
          const result = calculatePipeNetwork(testConfig);
          T_atMax = result.T_final;
          if (effectiveMax !== maxToUse) {
            maxToUse = effectiveMax; // Mettre à jour pour le reste
          }
          break; // Succès!
        } catch (error) {
          if (attempt === 4) {
            console.warn(`❌ MAX échoue même après 5 tentatives pour ${paramKey}`);
            errorAtMax = error.message;
          } else {
            // Réduire de 10% et réessayer
            effectiveMax = effectiveMax * 0.9;
          }
        }
      }

      // Créer une définition modifiée avec plage effective
      const effectiveParamDef = {
        ...paramDef,
        min: minToUse,
        max: maxToUse,
        originalMin: paramDef.min,
        originalMax: paramDef.max,
        isEffectiveRange: minToUse !== paramDef.min || maxToUse !== paramDef.max,
      };

      // Trouver les valeurs critiques du paramètre (qui donnent T=0°C et T=5°C)
      const criticalValues = findCriticalParameterValues(
        baseConfig,
        paramKey,
        effectiveParamDef,
        T_base,
        baseValue,
        T_atMin,
        T_atMax
      );

      // Calculer l'amplitude
      const amplitude = Math.abs((T_atMax || 0) - (T_atMin || 0));

      results.push({
        paramKey: paramKey,
        paramDef: effectiveParamDef,
        baseValue: baseValue,
        T_atMin: T_atMin,
        T_atMax: T_atMax,
        errorAtMin: errorAtMin,
        errorAtMax: errorAtMax,
        criticalValueFreeze: criticalValues.freeze,
        criticalValueSafety: criticalValues.safety,
        amplitude: amplitude,
      });
    }

    return results;
  }

  /**
   * Trouve les valeurs critiques d'un paramètre qui donnent T_final = 0°C et T_final = 5°C
   *
   * LOGIQUE IMPORTANTE:
   * - Si le système gèle déjà (T_base ≤ 0°C), on cherche la valeur qui permet de SORTIR du gel
   * - Si le système ne gèle pas (T_base > 0°C), on cherche la valeur qui PROVOQUE le gel
   * - La recherche se fait toujours dans la direction pertinente (amélioration vs détérioration)
   *
   * Cherche dans la direction pertinente selon l'état actuel
   * @param {Object} baseConfig - Configuration de base
   * @param {string} paramKey - Clé du paramètre
   * @param {Object} paramDef - Définition du paramètre
   * @param {number} T_base - Température au cas de base
   * @param {number} baseValue - Valeur actuelle du paramètre
   * @param {number} T_atMin - Température à la valeur min du paramètre
   * @param {number} T_atMax - Température à la valeur max du paramètre
   * @returns {Object} { freeze: valeur pour 0°C, safety: valeur pour 5°C }
   */
  function findCriticalParameterValues(
    baseConfig,
    paramKey,
    paramDef,
    T_base,
    baseValue,
    T_atMin,
    T_atMax
  ) {
    const result = { freeze: null, safety: null };

    // Vérifier si les données sont valides
    if (T_atMin === null || T_atMax === null || T_base === null) {
      return result;
    }

    // Déterminer la direction: augmenter le paramètre augmente-t-il T_final?
    const increasingParamIncreasesTemp = T_atMax > T_atMin;

    // ========== VALEUR CRITIQUE DE GEL (0°C) ==========
    if (T_base <= FREEZE_TEMP) {
      // Cas de base gèle déjà: chercher la valeur qui permet de SORTIR du gel (atteindre 0°C)
      if (increasingParamIncreasesTemp) {
        // Augmenter le paramètre améliore → chercher entre base et max
        result.freeze = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          FREEZE_TEMP,
          baseValue,
          paramDef.max
        );
      } else {
        // Diminuer le paramètre améliore → chercher entre min et base
        result.freeze = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          FREEZE_TEMP,
          paramDef.min,
          baseValue
        );
      }
    } else {
      // Cas de base ne gèle pas: chercher la valeur qui PROVOQUE le gel (descendre à 0°C)
      if (increasingParamIncreasesTemp) {
        // Augmenter améliore → diminuer détériore → chercher entre min et base
        result.freeze = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          FREEZE_TEMP,
          paramDef.min,
          baseValue
        );
      } else {
        // Diminuer améliore → augmenter détériore → chercher entre base et max
        result.freeze = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          FREEZE_TEMP,
          baseValue,
          paramDef.max
        );
      }
    }

    // ========== VALEUR CRITIQUE DE SÉCURITÉ (5°C) ==========
    if (T_base <= SAFETY_THRESHOLD) {
      // En dessous du seuil: chercher la valeur qui permet d'ATTEINDRE la sécurité (monter à 5°C)
      if (increasingParamIncreasesTemp) {
        // Augmenter améliore → chercher entre base et max
        result.safety = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          SAFETY_THRESHOLD,
          baseValue,
          paramDef.max
        );
      } else {
        // Diminuer améliore → chercher entre min et base
        result.safety = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          SAFETY_THRESHOLD,
          paramDef.min,
          baseValue
        );
      }
    } else {
      // Au-dessus du seuil: chercher la valeur qui QUITTE la sécurité (descendre à 5°C)
      if (increasingParamIncreasesTemp) {
        // Augmenter améliore → diminuer détériore → chercher entre min et base
        result.safety = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          SAFETY_THRESHOLD,
          paramDef.min,
          baseValue
        );
      } else {
        // Diminuer améliore → augmenter détériore → chercher entre base et max
        result.safety = findParameterValueInRange(
          baseConfig,
          paramKey,
          paramDef,
          SAFETY_THRESHOLD,
          baseValue,
          paramDef.max
        );
      }
    }

    return result;
  }

  /**
   * Trouve la valeur d'un paramètre dans une plage donnée qui donne une température cible
   * @param {Object} baseConfig - Configuration de base
   * @param {string} paramKey - Clé du paramètre
   * @param {Object} paramDef - Définition du paramètre
   * @param {number} targetTemp - Température cible (0°C ou 5°C)
   * @param {number} searchMin - Borne inférieure de recherche
   * @param {number} searchMax - Borne supérieure de recherche
   * @returns {number|null} Valeur du paramètre ou null si non trouvée
   */
  function findParameterValueInRange(
    baseConfig,
    paramKey,
    paramDef,
    targetTemp,
    searchMin,
    searchMax
  ) {
    let min = searchMin;
    let max = searchMax;
    const maxIterations = 15;
    const tolerance = 0.05; // °C

    // Vérifier si la cible est atteignable dans cette plage
    let T_min, T_max;
    try {
      const configMin = JSON.parse(JSON.stringify(baseConfig));
      applyParameterValue(configMin, paramKey, min);
      T_min = calculatePipeNetwork(configMin).T_final;

      const configMax = JSON.parse(JSON.stringify(baseConfig));
      applyParameterValue(configMax, paramKey, max);
      T_max = calculatePipeNetwork(configMax).T_final;

      // Si la cible n'est pas dans la plage de températures, retourner null
      if (
        (T_min < targetTemp && T_max < targetTemp) ||
        (T_min > targetTemp && T_max > targetTemp)
      ) {
        return null;
      }
    } catch (e) {
      console.warn(`Erreur lors de la vérification de plage pour ${paramKey}:`, e);
      return null;
    }

    // Dichotomie pour trouver la valeur exacte
    for (let i = 0; i < maxIterations; i++) {
      const mid = (min + max) / 2;

      try {
        const testConfig = JSON.parse(JSON.stringify(baseConfig));
        applyParameterValue(testConfig, paramKey, mid);
        const T_mid = calculatePipeNetwork(testConfig).T_final;

        // Convergence atteinte
        if (Math.abs(T_mid - targetTemp) < tolerance) {
          return mid;
        }

        // Déterminer dans quelle moitié chercher
        // Si T_mid et T_min sont du même côté de targetTemp, déplacer min
        if (
          (T_mid < targetTemp && T_min < targetTemp) ||
          (T_mid > targetTemp && T_min > targetTemp)
        ) {
          min = mid;
          T_min = T_mid;
        } else {
          max = mid;
          T_max = T_mid;
        }
      } catch (e) {
        console.warn(`Erreur dichotomie ${paramKey} itération ${i}:`, e);
        // En cas d'erreur, réduire la plage progressivement
        if (i < maxIterations / 2) {
          max = mid;
        } else {
          min = mid;
        }
      }
    }

    // Retourner la valeur moyenne si convergence partielle
    const finalValue = (min + max) / 2;

    // Vérifier que le résultat est raisonnablement proche
    try {
      const testConfig = JSON.parse(JSON.stringify(baseConfig));
      applyParameterValue(testConfig, paramKey, finalValue);
      const T_final = calculatePipeNetwork(testConfig).T_final;

      // Si on est à moins de 1°C de la cible, on accepte
      if (Math.abs(T_final - targetTemp) < 1.0) {
        return finalValue;
      }
    } catch (e) {
      // Ignorer
    }

    return null; // Pas de convergence acceptable
  }

  // ========== UTILITAIRES POUR PARAMÈTRES ==========
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
      const windMS = getValueFromPath(config, ['ambient', 'V_wind']);
      return windMS !== null ? windMS * 3.6 : null;
    } else if (paramKey === 't_insul') {
      const thicknessM = getValueFromPath(config, paramDef.path);
      return thicknessM !== null ? thicknessM * 1000.0 : null;
    } else {
      return getValueFromPath(config, paramDef.path);
    }
  }

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

  function setValueByPath(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined || current[path[i]] === null) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  function applyParameterValue(config, paramKey, displayValue) {
    const paramDef = PARAMETER_DEFINITIONS[paramKey];
    if (!paramDef) {
      return;
    }

    if (paramKey === 'm_dot') {
      // displayValue est dans l'unité d'affichage → convertir vers m³/h (SI)
      const flowM3H = paramDef.convertToSI ? paramDef.convertToSI(displayValue) : displayValue;

      const T_water = config.fluid.T_in;
      const P_water = config.fluid.P;

      let rho_water = 1000;
      if (typeof window.WaterProperties !== 'undefined') {
        try {
          const waterProps = window.WaterProperties.getWaterProperties(T_water, P_water);
          rho_water = waterProps.rho;
        } catch (e) {
          // Utiliser valeur par défaut
        }
      }

      const flowKgPerS = (flowM3H / 3600) * rho_water;
      setValueByPath(config, ['meta', 'flowM3PerHr'], flowM3H);
      setValueByPath(config, ['fluid', 'm_dot'], flowKgPerS);
    } else if (paramKey === 'V_wind') {
      const windMS = displayValue / 3.6;
      setValueByPath(config, paramDef.path, windMS);
    } else if (paramKey === 't_insul') {
      const thicknessM = displayValue / 1000.0;
      setValueByPath(config, paramDef.path, thicknessM);
    } else {
      setValueByPath(config, paramDef.path, displayValue);
    }
  }

  // ========== TRONCATURE ADAPTATIVE POUR LISIBILITÉ ==========
  /**
   * Détermine si la plage d'un paramètre doit être tronquée pour améliorer la lisibilité
   * Centre la vue sur les valeurs importantes (base + critiques freeze/safety) avec marge de 7.5%
   * Ne tronque que si gain significatif (>20% réduction) et applicable uniquement au débit d'eau
   *
   * Cas particuliers:
   * - Si tous points identiques (range = 0), utilise marge minimale de 5% de la plage totale
   * - Si un seul point (base sans critiques), même comportement que range = 0
   * - Si critiques hors plage effective, ils sont ignorés dans le calcul
   *
   * @param {Object} result - Résultat de l'analyse pour un paramètre
   * @param {Object} baseConfig - Configuration de base (non utilisé dans nouvelle logique)
   * @returns {Object} { shouldTruncate: boolean, newMin: number, newMax: number, reason: string }
   */
  function analyzeTruncationNeed(result, _baseConfig) {
    const defaultResult = {
      shouldTruncate: false,
      newMin: result.paramDef.min,
      newMax: result.paramDef.max,
      reason: null,
    };

    // Troncature uniquement pour le débit d'eau
    if (result.paramKey !== 'm_dot') {
      return defaultResult;
    }

    // Si données invalides, pas de troncature
    if (result.T_atMin === null || result.T_atMax === null) {
      return defaultResult;
    }

    // 1. Identifier les points importants
    const importantPoints = [];

    // Valeur de base (toujours présente)
    if (result.baseValue !== null && result.baseValue !== undefined) {
      importantPoints.push(result.baseValue);
    }

    // Valeurs critiques (seulement si dans plage effective)
    if (
      result.criticalValueFreeze !== null &&
      result.criticalValueFreeze >= result.paramDef.min &&
      result.criticalValueFreeze <= result.paramDef.max
    ) {
      importantPoints.push(result.criticalValueFreeze);
    }

    if (
      result.criticalValueSafety !== null &&
      result.criticalValueSafety >= result.paramDef.min &&
      result.criticalValueSafety <= result.paramDef.max
    ) {
      importantPoints.push(result.criticalValueSafety);
    }

    // Si pas assez de points, ne pas tronquer
    if (importantPoints.length === 0) {
      return defaultResult;
    }

    // 2. Calculer plage englobante
    const minPoint = Math.min(...importantPoints);
    const maxPoint = Math.max(...importantPoints);
    const range = maxPoint - minPoint;

    // 3. Ajouter marge de 7.5% de la plage englobante (minimum 5% de la plage totale)
    // Si range = 0 (tous points identiques), utiliser marge minimale pour éviter division par zéro
    const totalRange = result.paramDef.max - result.paramDef.min;
    const minMargin = totalRange * 0.05; // Marge minimale: 5% de la plage totale
    const margin = range > 0 ? Math.max(range * 0.075, minMargin) : minMargin;
    const newMin = Math.max(minPoint - margin, result.paramDef.min);
    const newMax = Math.min(maxPoint + margin, result.paramDef.max);

    // 4. Vérifier si troncature utile (plage englobante < 80% de plage totale)
    const truncatedRange = newMax - newMin;
    const coverageRatio = truncatedRange / totalRange;

    if (coverageRatio > 0.8) {
      // Troncature ne simplifie pas assez, garder plage complète
      return defaultResult;
    }

    // 5. Tronquer
    return {
      shouldTruncate: true,
      newMin: newMin,
      newMax: newMax,
      reason: `Centrée sur valeurs importantes (${importantPoints.length} points)`,
    };
  }

  // ========== DESSIN DES GRAPHIQUES TORNADO ==========
  /**
   * Dessine un graphique tornado en barre horizontale
   * @param {string} canvasId - ID du canvas
   * @param {Object} result - Résultat de l'analyse pour un paramètre
   * @param {Object} baseConfig - Configuration de base (pour troncature adaptative)
   */
  function drawTornadoChart(canvasId, result, baseConfig) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas ${canvasId} non trouvé`);
      return;
    }

    // Analyser si troncature nécessaire
    const truncation = analyzeTruncationNeed(result, baseConfig);

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Taille du canvas - VERSION COMPACTE
    // Utiliser clientWidth au lieu de offsetWidth pour respecter les contraintes CSS
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const canvasWidth = Math.floor(containerWidth);
    const canvasHeight = 88; // Hauteur ajustée pour éviter débordement des labels

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

    ctx.scale(dpr, dpr);

    // Configuration compacte avec padding supérieur augmenté pour les labels
    const padding = { top: 18, right: 40, bottom: 22, left: 40 };
    const plotWidth = canvasWidth - padding.left - padding.right;
    const plotHeight = 32; // Hauteur de la barre réduite
    const barY = padding.top + 2;

    // Échelle pour le paramètre (utiliser plage tronquée si applicable)
    const xMin = truncation.shouldTruncate ? truncation.newMin : result.paramDef.min;
    const xMax = truncation.shouldTruncate ? truncation.newMax : result.paramDef.max;
    const xScale = (x) => padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth;

    // Ajouter badge si plage modifiée (troncature ou plage effective)
    const needsBadge = truncation.shouldTruncate || result.paramDef.isEffectiveRange;

    if (needsBadge) {
      // Créer ou mettre à jour le badge sous le canvas
      let badge = container.querySelector('.truncation-notice');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'truncation-notice';
        badge.style.cssText =
          'font-size: 10px; color: #6b7280; margin-top: 4px; text-align: center; font-style: italic;';
        container.appendChild(badge);
      }

      const unit = result.paramDef.unit;

      if (truncation.shouldTruncate) {
        // Badge troncature pour lisibilité - utiliser le reason de l'analyse
        const truncLabel = window.I18n
          ? I18n.t('sensitivity.truncatedRange')
          : 'Plage tronquée pour lisibilité';
        const truncDetail =
          truncation.reason ||
          (window.I18n ? I18n.t('sensitivity.truncatedDetail') : 'Centrée sur valeurs importantes');
        badge.textContent = `ℹ️ ${truncLabel} (${xMin.toFixed(1)}-${xMax.toFixed(1)} ${unit}) - ${truncDetail}`;
      } else if (result.paramDef.isEffectiveRange) {
        // Badge plage effective (calculs convergent)
        const origMin = result.paramDef.originalMin;
        const origMax = result.paramDef.originalMax;
        const effectiveLabel = window.I18n
          ? I18n.t('sensitivity.effectiveRange')
          : 'Plage effective';
        const theoreticalLabel = window.I18n
          ? I18n.t('sensitivity.theoreticalRange')
          : 'Plage théorique';
        const exceedsLabel = window.I18n
          ? I18n.t('sensitivity.exceedsLimits')
          : 'dépasse limites physiques';
        badge.textContent = `ℹ️ ${effectiveLabel} (${xMin.toFixed(1)}-${xMax.toFixed(1)} ${unit}) - ${theoreticalLabel} ${origMin.toFixed(1)}-${origMax.toFixed(1)} ${unit} ${exceedsLabel}`;
      }
    }

    // Dessiner la barre principale colorée (passer baseConfig pour recalcul si troncature)
    drawColoredBar(ctx, padding.left, barY, plotWidth, plotHeight, result, xMin, xMax, baseConfig);

    // Dessiner les lignes de référence (Base, 0°C, 5°C)
    drawReferenceLines(ctx, barY, plotHeight, result, xScale);

    // Dessiner les labels des valeurs
    drawValueLabels(ctx, barY, plotHeight, result, xScale, padding.bottom);

    // Dessiner les limites (barres épaisses aux extrémités)
    drawLimits(ctx, padding.left, barY, plotWidth, plotHeight);
  }

  /**
   * Dessine la barre principale avec zones colorées franches selon T_final
   * @param {number} displayMin - Limite min pour affichage (peut être tronquée)
   * @param {number} displayMax - Limite max pour affichage (peut être tronquée)
   * @param {Object} baseConfig - Configuration de base (pour recalcul si troncature)
   */
  function drawColoredBar(
    ctx,
    startX,
    barY,
    barWidth,
    barHeight,
    result,
    displayMin,
    displayMax,
    baseConfig
  ) {
    // Couleurs des zones (palette BBA)
    const COLOR_SAFE = '#d0f5f9'; // Turquoise: T ≥ 5°C
    const COLOR_WARNING = '#f5ebdf'; // Sable: 0°C < T < 5°C
    const COLOR_FREEZE = '#f5dfdf'; // Rouge doux: T ≤ 0°C
    const COLOR_UNKNOWN = '#e5e7eb'; // Gris: données manquantes

    // Si displayMin/Max diffèrent des bornes originales dans result (troncature),
    // il faut recalculer T aux nouvelles bornes
    let T_atDisplayMin = result.T_atMin;
    let T_atDisplayMax = result.T_atMax;

    const originalMin = result.paramDef.min;
    const originalMax = result.paramDef.max;

    if (displayMin !== originalMin || displayMax !== originalMax) {
      // Recalculer T aux bornes tronquées
      const paramKey = result.paramKey;

      try {
        // Calculer T à displayMin
        const configMin = JSON.parse(JSON.stringify(baseConfig));
        applyParameterValue(configMin, paramKey, displayMin);
        const resultMin = calculatePipeNetwork(configMin);
        T_atDisplayMin = resultMin.T_final;
      } catch (e) {
        console.warn(`Échec calcul T@displayMin (${displayMin}) pour ${paramKey}`);
        T_atDisplayMin = null;
      }

      try {
        // Calculer T à displayMax
        const configMax = JSON.parse(JSON.stringify(baseConfig));
        applyParameterValue(configMax, paramKey, displayMax);
        const resultMax = calculatePipeNetwork(configMax);
        T_atDisplayMax = resultMax.T_final;
      } catch (e) {
        console.warn(`Échec calcul T@displayMax (${displayMax}) pour ${paramKey}`);
        T_atDisplayMax = null;
      }
    }

    // Vérifier si données valides
    if (T_atDisplayMin === null || T_atDisplayMax === null) {
      ctx.fillStyle = COLOR_UNKNOWN;
      ctx.fillRect(startX, barY, barWidth, barHeight);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, barY, barWidth, barHeight);

      // Ajouter texte explicatif
      ctx.fillStyle = '#6b7280';
      ctx.font = 'italic 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const invalidText = window.I18n ? I18n.t('detailedCalcs.outOfRange') : 'Hors plage';
      const detailText =
        T_atDisplayMin === null && T_atDisplayMax === null
          ? ' (min et max)'
          : T_atDisplayMin === null
            ? ' (min)'
            : ' (max)';
      ctx.fillText(invalidText + detailText, startX + barWidth / 2, barY + barHeight / 2);

      return;
    }

    // Fonction pour convertir valeur paramètre → position X (utilise displayMin/Max pour troncature)
    const xScale = (paramValue) => {
      const fraction = (paramValue - displayMin) / (displayMax - displayMin);
      return startX + fraction * barWidth;
    };

    // Fonction pour déterminer la couleur selon la température
    const getColor = (T) => {
      if (T <= FREEZE_TEMP) {
        return COLOR_FREEZE;
      }
      if (T < SAFETY_THRESHOLD) {
        return COLOR_WARNING;
      }
      return COLOR_SAFE;
    };

    // Construire la liste des segments à dessiner
    // Format: [{ paramStart, paramEnd, color }]
    const segments = [];

    // Points de transition (valeurs du paramètre qui donnent T=5°C et T=0°C)
    const safetyParamValue = result.criticalValueSafety; // Valeur pour T=5°C
    const freezeParamValue = result.criticalValueFreeze; // Valeur pour T=0°C

    // Créer une liste ordonnée des points de transition
    const transitions = [
      { param: displayMin, T: T_atDisplayMin },
      { param: displayMax, T: T_atDisplayMax },
    ];

    if (
      safetyParamValue !== null &&
      safetyParamValue > displayMin &&
      safetyParamValue < displayMax
    ) {
      transitions.push({ param: safetyParamValue, T: SAFETY_THRESHOLD });
    }

    if (
      freezeParamValue !== null &&
      freezeParamValue > displayMin &&
      freezeParamValue < displayMax
    ) {
      transitions.push({ param: freezeParamValue, T: FREEZE_TEMP });
    }

    // Trier par valeur du paramètre
    transitions.sort((a, b) => a.param - b.param);

    // Créer les segments entre chaque transition
    for (let i = 0; i < transitions.length - 1; i++) {
      const start = transitions[i];
      const end = transitions[i + 1];

      // La température au milieu du segment (pour déterminer la couleur)
      const midTemp = (start.T + end.T) / 2;
      const color = getColor(midTemp);

      segments.push({
        paramStart: start.param,
        paramEnd: end.param,
        color: color,
      });
    }

    // Dessiner chaque segment
    segments.forEach((seg) => {
      const x = xScale(seg.paramStart);
      const width = xScale(seg.paramEnd) - x;

      ctx.fillStyle = seg.color;
      ctx.fillRect(x, barY, width, barHeight);
    });

    // Bordure globale
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, barY, barWidth, barHeight);

    // Bordures entre segments (transitions franches)
    segments.forEach((seg, idx) => {
      if (idx > 0) {
        const x = xScale(seg.paramStart);
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, barY);
        ctx.lineTo(x, barY + barHeight);
        ctx.stroke();
      }
    });
  }

  /**
   * Dessine les lignes de référence verticales (Base, 0°C, 5°C) - VERSION COMPACTE
   */
  function drawReferenceLines(ctx, barY, barHeight, result, xScale) {
    const lineBottom = barY + barHeight + 3;
    const lineTop = barY - 3;
    const labelY = lineTop - 4;

    // Collecter toutes les positions pour éviter les chevauchements
    const labels = [];
    const MIN_LABEL_DISTANCE = 20; // pixels minimum entre labels

    // Ligne de base (valeur actuelle) - NOIRE
    const baseX = xScale(result.baseValue);
    ctx.strokeStyle = '#002952';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(baseX, lineTop);
    ctx.lineTo(baseX, lineBottom);
    ctx.stroke();

      labels.push({
        x: baseX,
        text: 'Base',
        color: '#002952',
        font: 'bold 9px Inter, sans-serif',
        priority: 1,
      });

      // Ligne 0°C (point de gel) - ROUGE
      if (result.criticalValueFreeze !== null) {
        const freezeX = xScale(result.criticalValueFreeze);
        ctx.strokeStyle = '#cb5d5d';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(freezeX, lineTop);
        ctx.lineTo(freezeX, lineBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        labels.push({
          x: freezeX,
          text: '0°C',
          color: '#cb5d5d',
          font: '8px Inter, sans-serif',
          priority: 2,
        });
      }

    // Ligne 5°C (seuil sécurité) - ORANGE
    if (result.criticalValueSafety !== null) {
      const safetyX = xScale(result.criticalValueSafety);
      ctx.strokeStyle = '#cb9b5d';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(safetyX, lineTop);
      ctx.lineTo(safetyX, lineBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      labels.push({
        x: safetyX,
        text: '5°C',
        color: '#cb9b5d',
        font: '8px Inter, sans-serif',
        priority: 3,
      });
    }

    // Trier par position X
    labels.sort((a, b) => a.x - b.x);

    // Ajuster positions pour éviter chevauchements
    for (let i = 1; i < labels.length; i++) {
      const prev = labels[i - 1];
      const curr = labels[i];

      // Si trop proche, décaler verticalement le label de priorité plus basse
      if (curr.x - prev.x < MIN_LABEL_DISTANCE) {
        if (curr.priority > prev.priority) {
          curr.yOffset = 10; // Décaler vers le bas
        } else {
          prev.yOffset = 10;
        }
      }
    }

    // Dessiner les labels avec positions ajustées
    labels.forEach((label) => {
      ctx.fillStyle = label.color;
      ctx.font = label.font;
      ctx.textAlign = 'center';
      const y = labelY + (label.yOffset || 0);
      ctx.fillText(label.text, label.x, y);
    });
  }

  /**
   * Dessine les labels des valeurs min/max - VERSION COMPACTE
   */
  function drawValueLabels(ctx, barY, barHeight, result, xScale, _paddingBottom) {
    const labelY = barY + barHeight + 14;

    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#4b5563';

    // Valeur MIN à gauche
    ctx.textAlign = 'left';
    const minText = `${result.paramDef.min.toFixed(0)} ${result.paramDef.unit}`;
    ctx.fillText(minText, xScale(result.paramDef.min) - 2, labelY);

    // Valeur MAX à droite
    ctx.textAlign = 'right';
    const maxText = `${result.paramDef.max.toFixed(0)} ${result.paramDef.unit}`;
    ctx.fillText(maxText, xScale(result.paramDef.max) + 2, labelY);

    // Pas de flèche dans la version compacte (gain d'espace)
  }

  /**
   * Dessine les limites épaisses aux extrémités - VERSION COMPACTE
   */
  function drawLimits(ctx, startX, barY, barWidth, barHeight) {
    ctx.strokeStyle = '#002952';
    ctx.lineWidth = 3;

    // Limite gauche
    ctx.beginPath();
    ctx.moveTo(startX, barY - 3);
    ctx.lineTo(startX, barY + barHeight + 3);
    ctx.stroke();

    // Limite droite
    ctx.beginPath();
    ctx.moveTo(startX + barWidth, barY - 3);
    ctx.lineTo(startX + barWidth, barY + barHeight + 3);
    ctx.stroke();
  }

  // ========== GÉNÉRATION DU TABLEAU RÉCAPITULATIF ==========
  /**
   * Génère le tableau récapitulatif HTML pour tous les paramètres
   * @param {Array} results - Résultats de l'analyse pour tous les paramètres
   * @returns {string} HTML du tableau
   */
  function generateSummaryTable(results) {
    let html = `
      <table class="tornado-summary-table">
        <thead>
          <tr>
            <th>${window.I18n ? I18n.t('sensitivityTable.parameter') : 'Paramètre'}</th>
            <th>${window.I18n ? I18n.t('sensitivityTable.currentValue') : 'Valeur actuelle'}</th>
            <th>${window.I18n ? I18n.t('sensitivityTable.tempAtMin') : 'T°C au Min'}</th>
            <th>${window.I18n ? I18n.t('sensitivityTable.tempAtMax') : 'T°C au Max'}</th>
            <th>${window.I18n ? I18n.t('sensitivityTable.freezeCritical') : 'Point critique gel (0°C)'}</th>
            <th>${window.I18n ? I18n.t('sensitivityTable.safetyCritical') : 'Point critique sécurité (5°C)'}</th>
            <th>${window.I18n ? I18n.t('sensitivityTable.amplitude') : 'Amplitude'}</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Ne PAS filtrer - afficher tous les paramètres même si invalides
    // Cela permet de voir quels paramètres ont des problèmes de plage
    results.forEach((result) => {
      const baseValueFormatted = result.baseValue.toFixed(2);
      const T_minFormatted =
        result.T_atMin !== null
          ? (result.T_atMin >= 0 ? '+' : '') + result.T_atMin.toFixed(1) + '°C'
          : 'N/A';
      const T_maxFormatted =
        result.T_atMax !== null
          ? (result.T_atMax >= 0 ? '+' : '') + result.T_atMax.toFixed(1) + '°C'
          : 'N/A';

      const outOfRangeText = window.I18n ? I18n.t('detailedCalcs.outOfRange') : 'Hors plage';

      const freezeFormatted =
        result.criticalValueFreeze !== null
          ? result.criticalValueFreeze.toFixed(2) + ' ' + result.paramDef.unit
          : outOfRangeText;

      const safetyFormatted =
        result.criticalValueSafety !== null
          ? result.criticalValueSafety.toFixed(2) + ' ' + result.paramDef.unit
          : outOfRangeText;

      const amplitudeFormatted = result.amplitude.toFixed(1) + '°C';

      // Classe CSS selon la criticité (basée sur si les points critiques sont dans la plage)
      let rowClass = '';
      if (result.criticalValueFreeze !== null) {
        rowClass = 'critical-row'; // Risque de gel dans la plage
      } else if (result.criticalValueSafety !== null) {
        rowClass = 'warning-row'; // Seuil sécurité dans la plage
      }

      html += `
        <tr class="${rowClass}">
          <td class="param-name">${result.paramDef.label}</td>
          <td class="base-value">${baseValueFormatted} ${result.paramDef.unit}</td>
          <td class="t-min">${T_minFormatted}</td>
          <td class="t-max">${T_maxFormatted}</td>
          <td class="freeze-point">${freezeFormatted}</td>
          <td class="safety-point">${safetyFormatted}</td>
          <td class="amplitude">${amplitudeFormatted}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  // ========== EXPORT ==========
  window.SensitivityAnalysis1D = {
    analyze: analyzeSensitivity1D,
    drawChart: drawTornadoChart, // Signature: (canvasId, result, baseConfig)
    generateSummaryTable: generateSummaryTable,
  };
})();
