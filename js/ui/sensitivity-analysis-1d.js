/**
 * sensitivity-analysis-1d.js
 *
 * Analyse de sensibilité 1D (paramétrique) pour ThermaFlow
 *
 * STRATÉGIE: Interpolation par échantillonnage dense
 * - Identifier la borne SAFE (température finale la plus élevée)
 * - Échantillonner 250 points entre SAFE et l'opposé
 * - Interpoler linéairement pour trouver les points critiques (5°C et 0.01°C)
 *
 * Génère un tableau récapitulatif uniquement (graphiques tornado supprimés).
 */

(function () {
  'use strict';

  // ========== CONSTANTES ==========
  const FREEZE_TEMP_TARGET = 0.01; // °C - Cible pour point critique gel
  const SAFETY_THRESHOLD = 5; // °C - Marge de sécurité opérationnelle standard industrielle
  const CURVE_SAMPLING_POINTS = 250; // Augmenté de 75 à 250 pour haute précision
  const SAFE_BOUND_MAX_ITERATIONS = 15; // Pour dichotomie de recherche de borne valide
  const FALLBACK_RANGE_PERCENT = 0.2; // ±20% autour de baseValue si tout échoue

  // Définition des paramètres analysables
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

  // ========== GESTION D'ERREURS ==========
  /**
   * Détermine si une erreur est critique ou acceptable
   * Stratégie hybride: accepter warnings, rejeter erreurs bloquantes
   *
   * @param {Error} error - L'erreur à évaluer
   * @returns {boolean} true si critique, false si acceptable
   */
  function isCriticalError(error) {
    if (!error || !error.message) {
      return false;
    }

    const msg = error.message.toLowerCase();

    // Erreurs critiques (bloquantes)
    const criticalPatterns = [
      'perte de charge excessive',
      'pression.*négative',
      'propriétés.*invalide',
      'température.*hors.*plage',
      'débit.*invalide',
      'nan',
      'infinity',
    ];

    for (const pattern of criticalPatterns) {
      if (msg.match(pattern)) {
        return true;
      }
    }

    // Warnings acceptables (non-bloquants)
    const warningPatterns = ['convergence lente', 'précision réduite', 'approximation'];

    for (const pattern of warningPatterns) {
      if (msg.match(pattern)) {
        return false;
      }
    }

    // Par défaut, considérer comme critique si incertain
    return true;
  }

  /**
   * Trouve une valeur valide proche d'une borne cible par dichotomie
   *
   * @param {Object} baseConfig - Configuration de base
   * @param {string} paramKey - Clé du paramètre
   * @param {number} targetValue - Valeur cible (min ou max)
   * @param {number} referenceValue - Valeur de référence connue valide
   * @param {number} maxIterations - Nombre max d'itérations
   * @returns {Object|null} { value, T_final } ou null si échec
   */
  function findValidBound(
    baseConfig,
    paramKey,
    targetValue,
    referenceValue,
    maxIterations = SAFE_BOUND_MAX_ITERATIONS
  ) {
    // Essayer la valeur cible directement
    try {
      const config = rebuildConfig(baseConfig, paramKey, targetValue);
      const result = calculatePipeNetwork(config);
      return { value: targetValue, T_final: result.T_final };
    } catch (e) {
      // Si non-critique, continuer avec dichotomie (pas de retour immédiat)
      if (!isCriticalError(e)) {
        console.warn(
          `findValidBound: Warning non-critique à targetValue=${targetValue}, recherche par dichotomie`
        );
      }
    }

    // Dichotomie entre referenceValue (valide) et targetValue (invalide/warning)
    let low = referenceValue;
    let high = targetValue;

    // S'assurer que low < high
    if (low > high) {
      [low, high] = [high, low];
    }

    let bestValid = null;

    for (let iter = 0; iter < maxIterations; iter++) {
      const mid = (low + high) / 2;

      try {
        const config = rebuildConfig(baseConfig, paramKey, mid);
        const result = calculatePipeNetwork(config);

        bestValid = { value: mid, T_final: result.T_final };

        // Chercher plus loin vers la cible
        if (targetValue > referenceValue) {
          low = mid;
        } else {
          high = mid;
        }
      } catch (e) {
        // Erreur: chercher vers la référence (zone sûre)
        if (targetValue > referenceValue) {
          high = mid;
        } else {
          low = mid;
        }
      }

      // Convergence avec epsilon absolu et relatif
      const epsilon = 0.001;
      const relativeEpsilon = Math.abs(high + low) * 1e-6;
      if (Math.abs(high - low) < Math.max(epsilon, relativeEpsilon)) {
        break;
      }
    }

    return bestValid;
  }

  // ========== RECONSTRUCTION CONFIG ==========
  /**
   * Reconstruit une configuration complète à partir d'une config de base
   * en modifiant un seul paramètre.
   *
   * GARANTIT: Config identique à celle générée par getFormData() du formulaire
   *
   * Cette fonction assure que TOUS les champs dérivés sont recalculés correctement:
   * - numSegments basé sur totalLength (formule: Math.min(Math.max(Math.ceil(L/5), 10), 100))
   * - fluid.m_dot basé sur flowM3PerHr avec densité eau à T_in et P
   * - Conversions d'unités (km/h → m/s, mm → m)
   *
   * Cela garantit que calculatePipeNetwork() reçoit une config 100% cohérente,
   * identique à celle du formulaire principal.
   *
   * @param {Object} baseConfig - Configuration de base valide
   * @param {string} paramKey - Paramètre à modifier ('L', 'm_dot', 'T_in', 'T_amb', 'V_wind', 't_insul')
   * @param {number} newValue - Nouvelle valeur dans unité d'affichage
   * @returns {Object} Configuration complète et cohérente
   */
  function rebuildConfig(baseConfig, paramKey, newValue) {
    // 1. Extraire valeurs de base (shallow copy pour éviter mutations)
    const geometry = { ...baseConfig.geometry };
    const insulation = baseConfig.insulation ? { ...baseConfig.insulation } : null;
    const meta = { ...baseConfig.meta };

    // 2. Valeurs par défaut (extraites de baseConfig)
    let totalLength = baseConfig.totalLength;
    let T_in = baseConfig.fluid.T_in;
    const P_bar = baseConfig.fluid.P;
    let flowM3PerHr = baseConfig.meta.flowM3PerHr;
    let T_amb = baseConfig.ambient.T_amb;
    let V_wind_kmh = baseConfig.ambient.V_wind * 3.6; // m/s → km/h pour cohérence

    // 3. Appliquer la modification selon le paramètre
    switch (paramKey) {
      case 'L':
        totalLength = newValue;
        break;

      case 'm_dot':
        // newValue est déjà en m³/h (unité d'affichage)
        flowM3PerHr = newValue;
        break;

      case 'T_in':
        T_in = newValue;
        break;

      case 'T_amb':
        T_amb = newValue;
        break;

      case 'V_wind':
        // newValue est en km/h (unité d'affichage)
        V_wind_kmh = newValue;
        break;

      case 't_insul':
        // newValue est en mm (unité d'affichage)
        if (insulation) {
          insulation.thickness = newValue / 1000.0; // mm → m
        }
        break;

      default:
        console.warn(`rebuildConfig: Paramètre inconnu: ${paramKey}`);
    }

    // 4. RECALCUL COMPLET des champs dérivés (comme dans getFormData())

    // 4a. Conversion débit: m³/h → kg/s
    //     IMPORTANT: Densité calculée à T_in et P (comme formulaire)
    let rho_water = 1000; // Défaut sécuritaire
    if (typeof window.WaterProperties !== 'undefined') {
      try {
        const waterProps = window.WaterProperties.getWaterProperties(T_in, P_bar);
        rho_water = waterProps.rho;
      } catch (e) {
        console.warn(`rebuildConfig: Densité eau fallback à 1000 kg/m³`);
      }
    }
    const flowM3PerS = flowM3PerHr / 3600; // m³/h → m³/s
    const flowKgPerS = flowM3PerS * rho_water; // m³/s → kg/s

    // 4b. Calcul numSegments (MÊME FORMULE que formulaire - critique!)
    //     Formule: Math.min(Math.max(Math.ceil(L/5), 10), 100)
    const numSegments = Math.min(Math.max(Math.ceil(totalLength / 5), 10), 100);

    // 4c. Conversion vent: km/h → m/s
    const V_wind_ms = V_wind_kmh / 3.6;

    // 5. Construire et retourner configuration complète
    return {
      geometry: geometry,
      totalLength: totalLength,
      numSegments: numSegments, // ← CRUCIAL: recalculé correctement
      fluid: {
        T_in: T_in,
        P: P_bar,
        m_dot: flowKgPerS, // ← CRUCIAL: recalculé avec bonne densité
      },
      ambient: {
        T_amb: T_amb,
        V_wind: V_wind_ms,
      },
      insulation: insulation,
      meta: {
        ...meta,
        flowM3PerHr: flowM3PerHr,
      },
    };
  }

  // ========== ANALYSE 1D PAR INTERPOLATION ==========
  /**
   * Analyse la sensibilité 1D pour tous les paramètres
   *
   * STRATÉGIE:
   * 1. Calculer T_final aux bornes (min et max) de chaque paramètre
   * 2. Identifier la borne SAFE (T la plus élevée)
   * 3. Si SAFE >= seuil, échantillonner 250 points et interpoler le point critique
   * 4. Sinon, marquer le point critique comme "Hors plage"
   *
   * @param {Object} baseConfig - Configuration de base utilisateur
   * @returns {Array} Résultats pour chaque paramètre
   */
  function analyzeSensitivity1D(baseConfig) {
    const results = [];

    // Calculer T_final au cas de base (une seule fois)
    let T_base = null;
    try {
      const baseResult = calculatePipeNetwork(baseConfig);
      T_base = baseResult.T_final;
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

      const baseValue = getDisplayValue(baseConfig, paramKey);
      const paramResult = evaluateParameter(baseConfig, paramKey, paramDef, baseValue, T_base);

      results.push(paramResult);
    }

    return results;
  }

  /**
   * Évalue un paramètre : calcule T aux bornes, identifie SAFE,
   * échantillonne et interpole les points critiques
   */
  function evaluateParameter(baseConfig, paramKey, paramDef, baseValue, _T_base) {
    // 1. Calculer T_final aux bornes min et max
    const bounds = calculateAtBounds(baseConfig, paramKey, paramDef);

    if (!bounds.minValid || !bounds.maxValid) {
      // Échec aux bornes
      return createErrorResult(paramKey, paramDef, baseValue);
    }

    // 2. Identifier la borne SAFE (température la plus élevée)
    const safeBound = identifySafeBound(bounds, paramDef);

    // 3. Déterminer si les points critiques sont atteignables
    const criticalValues = { freeze: null, safety: null };

    if (safeBound.T_final < FREEZE_TEMP_TARGET) {
      // SAFE déjà gelé → gel et sécurité hors plage
      return createResult(
        paramKey,
        paramDef,
        baseValue,
        bounds.T_atMin,
        bounds.T_atMax,
        null,
        null, // erreurs
        null,
        null, // points critiques
        Math.abs(bounds.T_atMax - bounds.T_atMin)
      );
    }

    if (safeBound.T_final < SAFETY_THRESHOLD) {
      // SAFE < 5°C → sécurité hors plage, mais gel peut-être atteignable
      criticalValues.safety = null;
    } else {
      // Échantillonner courbe et interpoler pour 5°C
      criticalValues.safety = findCriticalByInterpolation(
        baseConfig,
        paramKey,
        paramDef,
        safeBound,
        safeBound.oppositeBound,
        SAFETY_THRESHOLD
      );
    }

    // Toujours chercher le gel si SAFE >= 0.01°C
    criticalValues.freeze = findCriticalByInterpolation(
      baseConfig,
      paramKey,
      paramDef,
      safeBound,
      safeBound.oppositeBound,
      FREEZE_TEMP_TARGET
    );

    return createResult(
      paramKey,
      paramDef,
      baseValue,
      bounds.T_atMin,
      bounds.T_atMax,
      null,
      null, // pas d'erreurs
      criticalValues.freeze,
      criticalValues.safety,
      Math.abs(bounds.T_atMax - bounds.T_atMin)
    );
  }

  /**
   * Calcule T_final aux bornes min et max du paramètre
   * Utilise dichotomie pour trouver des bornes valides si les extrêmes échouent
   * Fallback sur ±20% de baseValue si tout échoue
   */
  function calculateAtBounds(baseConfig, paramKey, paramDef) {
    const baseValue = getDisplayValue(baseConfig, paramKey);

    let T_atMin = null,
      T_atMax = null;
    let effectiveMin = paramDef.min;
    let effectiveMax = paramDef.max;
    let minValid = false,
      maxValid = false;

    // Étape 1: Essayer de calculer au BASE (référence valide)
    try {
      calculatePipeNetwork(baseConfig);
    } catch (e) {
      console.error(`Erreur calcul base pour ${paramKey}:`, e.message);
      return {
        T_atMin: null,
        T_atMax: null,
        minValid: false,
        maxValid: false,
        effectiveMin,
        effectiveMax,
      };
    }

    // Étape 2: Essayer MIN
    try {
      const configMin = rebuildConfig(baseConfig, paramKey, paramDef.min);
      const resultMin = calculatePipeNetwork(configMin);
      T_atMin = resultMin.T_final;
      effectiveMin = paramDef.min;
      minValid = true;
    } catch (e) {
      if (isCriticalError(e)) {
        console.warn(`MIN échoue pour ${paramKey}, recherche par dichotomie...`);
        // Chercher une borne MIN valide entre baseValue et paramDef.min
        const validBound = findValidBound(baseConfig, paramKey, paramDef.min, baseValue);
        if (validBound) {
          T_atMin = validBound.T_final;
          effectiveMin = validBound.value;
          minValid = true;
        }
      }
      // Si warning non-critique, on ignore (valeur reste invalide)
    }

    // Étape 3: Essayer MAX
    try {
      const configMax = rebuildConfig(baseConfig, paramKey, paramDef.max);
      const resultMax = calculatePipeNetwork(configMax);
      T_atMax = resultMax.T_final;
      effectiveMax = paramDef.max;
      maxValid = true;
    } catch (e) {
      if (isCriticalError(e)) {
        console.warn(`MAX échoue pour ${paramKey}, recherche par dichotomie...`);
        // Chercher une borne MAX valide entre baseValue et paramDef.max
        const validBound = findValidBound(baseConfig, paramKey, paramDef.max, baseValue);
        if (validBound) {
          T_atMax = validBound.T_final;
          effectiveMax = validBound.value;
          maxValid = true;
        }
      }
      // Si warning non-critique, on ignore (valeur reste invalide)
    }

    // Étape 4: Fallback si MIN et MAX échouent tous les deux
    if (!minValid && !maxValid) {
      console.warn(`MIN et MAX échouent pour ${paramKey}, fallback sur ±20% de baseValue`);

      const fallbackMin = baseValue * (1 - FALLBACK_RANGE_PERCENT);
      const fallbackMax = baseValue * (1 + FALLBACK_RANGE_PERCENT);

      // Clamp dans les bornes théoriques
      const clampedMin = Math.max(fallbackMin, paramDef.min);
      const clampedMax = Math.min(fallbackMax, paramDef.max);

      // Essayer fallback MIN
      try {
        const configMin = rebuildConfig(baseConfig, paramKey, clampedMin);
        const resultMin = calculatePipeNetwork(configMin);
        T_atMin = resultMin.T_final;
        effectiveMin = clampedMin;
        minValid = true;
      } catch (e) {
        console.warn(`Fallback MIN échoue pour ${paramKey}`);
      }

      // Essayer fallback MAX
      try {
        const configMax = rebuildConfig(baseConfig, paramKey, clampedMax);
        const resultMax = calculatePipeNetwork(configMax);
        T_atMax = resultMax.T_final;
        effectiveMax = clampedMax;
        maxValid = true;
      } catch (e) {
        console.warn(`Fallback MAX échoue pour ${paramKey}`);
      }
    }

    return {
      T_atMin,
      T_atMax,
      minValid,
      maxValid,
      effectiveMin,
      effectiveMax,
    };
  }

  /**
   * Identifie quelle borne (min ou max) est "SAFE" (T la plus élevée)
   * Utilise les bornes effectives retournées par calculateAtBounds
   */
  function identifySafeBound(bounds, paramDef) {
    const isSafeMax = bounds.T_atMax >= bounds.T_atMin;

    // Utiliser les bornes effectives si disponibles, sinon les théoriques
    const effectiveMin = bounds.effectiveMin !== undefined ? bounds.effectiveMin : paramDef.min;
    const effectiveMax = bounds.effectiveMax !== undefined ? bounds.effectiveMax : paramDef.max;

    return {
      bound: isSafeMax ? 'max' : 'min',
      value: isSafeMax ? effectiveMax : effectiveMin,
      T_final: isSafeMax ? bounds.T_atMax : bounds.T_atMin,
      oppositeBound: {
        bound: isSafeMax ? 'min' : 'max',
        value: isSafeMax ? effectiveMin : effectiveMax,
        T_final: isSafeMax ? bounds.T_atMin : bounds.T_atMax,
      },
    };
  }

  /**
   * Échantillonne une courbe de 250 points et interpole la valeur critique
   * @param {Object} safeBound - { value, T_final }
   * @param {Object} oppositeBound - { value, T_final }
   * @param {number} targetTemp - Température cible (5°C ou 0.01°C)
   */
  function findCriticalByInterpolation(
    baseConfig,
    paramKey,
    paramDef,
    safeBound,
    oppositeBound,
    targetTemp
  ) {
    // Vérifier que targetTemp est dans la plage [oppositeBound.T, safeBound.T]
    const minT = Math.min(safeBound.T_final, oppositeBound.T_final);
    const maxT = Math.max(safeBound.T_final, oppositeBound.T_final);

    if (targetTemp < minT || targetTemp > maxT) {
      return null; // Hors plage
    }

    // Échantillonner CURVE_SAMPLING_POINTS entre SAFE et opposé
    const samples = [];
    const valueStart = safeBound.value;
    const valueEnd = oppositeBound.value;

    for (let i = 0; i <= CURVE_SAMPLING_POINTS; i++) {
      const fraction = i / CURVE_SAMPLING_POINTS;
      const paramValue = valueStart + fraction * (valueEnd - valueStart);

      try {
        const testConfig = rebuildConfig(baseConfig, paramKey, paramValue);
        const result = calculatePipeNetwork(testConfig);

        samples.push({
          paramValue: paramValue,
          T_final: result.T_final,
        });
      } catch (e) {
        // Ignorer les points qui échouent
        continue;
      }
    }

    if (samples.length < 2) {
      return null; // Pas assez de points
    }

    // Interpolation linéaire par morceaux
    return interpolateLinear(samples, targetTemp);
  }

  /**
   * Interpolation linéaire par morceaux pour trouver paramValue → targetTemp
   */
  function interpolateLinear(samples, targetTemp) {
    // Trouver les deux points encadrant targetTemp
    for (let i = 0; i < samples.length - 1; i++) {
      const p1 = samples[i];
      const p2 = samples[i + 1];

      const minT = Math.min(p1.T_final, p2.T_final);
      const maxT = Math.max(p1.T_final, p2.T_final);

      if (targetTemp >= minT && targetTemp <= maxT) {
        // Segment plat (température constante) - éviter division par zéro
        const deltaT = p2.T_final - p1.T_final;
        if (Math.abs(deltaT) < 1e-6) {
          // Retourner valeur moyenne du segment plat
          return (p1.paramValue + p2.paramValue) / 2;
        }

        // Interpoler entre p1 et p2
        const fraction = (targetTemp - p1.T_final) / deltaT;
        return p1.paramValue + fraction * (p2.paramValue - p1.paramValue);
      }
    }

    return null;
  }

  /**
   * Crée un objet résultat standard
   */
  function createResult(
    paramKey,
    paramDef,
    baseValue,
    T_atMin,
    T_atMax,
    errorAtMin,
    errorAtMax,
    freezeValue,
    safetyValue,
    amplitude
  ) {
    return {
      paramKey,
      paramDef,
      baseValue,
      T_atMin,
      T_atMax,
      errorAtMin,
      errorAtMax,
      criticalValueFreeze: freezeValue,
      criticalValueSafety: safetyValue,
      amplitude,
    };
  }

  function createErrorResult(paramKey, paramDef, baseValue) {
    return createResult(
      paramKey,
      paramDef,
      baseValue,
      null,
      null,
      'Calcul échoué',
      'Calcul échoué',
      null,
      null,
      0
    );
  }

  // ========== UTILITAIRES POUR PARAMÈTRES ==========
  /**
   * Extrait la valeur d'affichage d'un paramètre depuis la config
   *
   * Version simplifiée: extraction directe sans chemins dynamiques
   * La config étant maintenant toujours cohérente (via rebuildConfig),
   * on peut extraire directement les valeurs.
   *
   * @param {Object} config - Configuration complète
   * @param {string} paramKey - Clé du paramètre
   * @returns {number|null} Valeur dans unité d'affichage
   */
  function getDisplayValue(config, paramKey) {
    switch (paramKey) {
      case 'L':
        return config.totalLength;

      case 'm_dot':
        return config.meta.flowM3PerHr; // Déjà en m³/h (unité d'affichage)

      case 'T_in':
        return config.fluid.T_in;

      case 'T_amb':
        return config.ambient.T_amb;

      case 'V_wind':
        return config.ambient.V_wind * 3.6; // m/s → km/h

      case 't_insul':
        return config.insulation ? config.insulation.thickness * 1000 : null; // m → mm

      default:
        console.warn(`getDisplayValue: Paramètre inconnu: ${paramKey}`);
        return null;
    }
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
      // Convertir les valeurs selon le type de paramètre
      let baseValueDisplay = result.baseValue;
      let freezeValueDisplay = result.criticalValueFreeze;
      let safetyValueDisplay = result.criticalValueSafety;
      let decimals = 2;

      // Si c'est le débit et que UnitConverter existe, convertir de m³/h vers l'unité d'affichage
      if (result.paramKey === 'm_dot' && window.UnitConverter) {
        baseValueDisplay = UnitConverter.fromSI('flowRate', result.baseValue);
        if (result.criticalValueFreeze !== null) {
          freezeValueDisplay = UnitConverter.fromSI('flowRate', result.criticalValueFreeze);
        }
        if (result.criticalValueSafety !== null) {
          safetyValueDisplay = UnitConverter.fromSI('flowRate', result.criticalValueSafety);
        }
        decimals = UnitConverter.getUnitInfo('flowRate').decimals;
      }

      const baseValueFormatted = baseValueDisplay.toFixed(decimals);
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
        freezeValueDisplay !== null
          ? freezeValueDisplay.toFixed(decimals) + ' ' + result.paramDef.unit
          : outOfRangeText;

      const safetyFormatted =
        safetyValueDisplay !== null
          ? safetyValueDisplay.toFixed(decimals) + ' ' + result.paramDef.unit
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
    generateSummaryTable: generateSummaryTable,
  };
})();
