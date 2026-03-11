/**
 * sensitivity-matrix.js
 *
 * Logique de calcul pure pour l'analyse de sensibilité 2D.
 *
 * Contient toutes les fonctions sans accès DOM :
 * - calculateMatrix      — calcul de la matrice de résultats
 * - applyParameterValue  — applique une valeur avec conversion d'unités (immutable)
 * - getValueFromPath     — lecture d'une propriété imbriquée
 * - setValueByPath       — écriture d'une propriété imbriquée
 * - getDisplayValue      — conversion SI → unité d'affichage
 * - adjustConfigForStability — ajustements numériques de stabilité
 * - createFallbackConfig — configuration de secours
 *
 * @module sensitivity-matrix
 */

(function () {
  'use strict';

  // ========== PARAMÈTRES DISPONIBLES (module partagé) ==========
  function getParamDefs() {
    return window.SensitivityParams.PARAMETER_DEFINITIONS;
  }

  // ========== OBTENIR VALEUR PAR PATH ==========
  /**
   * Lit une valeur dans un objet via un chemin de propriétés.
   *
   * @param {Object} obj  - Objet source
   * @param {string[]} path - Chemin vers la propriété
   * @returns {*} Valeur lue, ou null si le chemin est invalide
   */
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

  // ========== DÉFINIR VALEUR PAR PATH ==========
  /**
   * Écrit une valeur dans un objet via un chemin de propriétés.
   * Crée les objets intermédiaires manquants.
   *
   * @param {Object}   obj   - Objet à modifier (mutation intentionnelle sur copie)
   * @param {string[]} path  - Chemin vers la propriété
   * @param {*}        value - Valeur à écrire
   */
  const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

  function setValueByPath(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (FORBIDDEN_KEYS.indexOf(path[i]) !== -1) {
        return;
      }
      if (current[path[i]] === undefined || current[path[i]] === null) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    const lastKey = path[path.length - 1];
    if (FORBIDDEN_KEYS.indexOf(lastKey) !== -1) {
      return;
    }
    current[lastKey] = value;
  }

  // ========== OBTENIR VALEUR D'AFFICHAGE ==========
  /**
   * Retourne la valeur d'un paramètre dans ses unités d'affichage.
   *
   * Conversions appliquées :
   * - m_dot   : m³/h  (SI) → unité d'affichage via convertFromSI
   * - V_wind  : m/s        → km/h (× 3.6)
   * - t_insul : m          → mm   (× 1000)
   *
   * @param {Object} config   - Configuration source
   * @param {string} paramKey - Clé du paramètre
   * @returns {number|null}
   */
  function getDisplayValue(config, paramKey) {
    const paramDef = getParamDefs()[paramKey];
    if (!paramDef) {
      return null;
    }

    if (paramKey === 'm_dot') {
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

  // ========== APPLIQUER VALEUR AVEC CONVERSIONS ==========
  /**
   * Applique une valeur de paramètre avec conversions d'unités nécessaires.
   *
   * Retourne un NOUVEL objet config (copie profonde) avec la valeur appliquée.
   * L'objet config original n'est JAMAIS muté.
   *
   * Conversions supportées :
   * - m_dot   : unité d'affichage → m³/h → kg/s (via densité eau à T/P)
   * - V_wind  : km/h → m/s (÷ 3.6)
   * - t_insul : mm → m (÷ 1000)
   *
   * @param {Object} config        - Configuration source (non mutée)
   * @param {string} paramKey      - Clé du paramètre
   * @param {number} displayValue  - Valeur dans les unités d'affichage
   * @returns {Object} Nouvelle configuration avec la valeur appliquée
   */
  function applyParameterValue(config, paramKey, displayValue) {
    const paramDef = getParamDefs()[paramKey];
    if (!paramDef) {
      console.warn(`Paramètre inconnu: ${paramKey}`);
      return window.UIUtils.deepCopy(config);
    }

    // Always work on a deep copy — never mutate the original
    const newConfig = window.UIUtils.deepCopy(config);

    if (paramKey === 'm_dot') {
      const flowM3H = paramDef.convertToSI ? paramDef.convertToSI(displayValue) : displayValue;

      const T_water = newConfig.fluid.T_in;
      const P_water = newConfig.fluid.P;

      let rho_water = 1000; // Valeur par défaut [kg/m³]
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

      setValueByPath(newConfig, ['meta', 'flowM3PerHr'], flowM3H);
      setValueByPath(newConfig, ['fluid', 'm_dot'], flowKgPerS);
    } else if (paramKey === 'V_wind') {
      const windMS = displayValue / 3.6;
      setValueByPath(newConfig, paramDef.path, windMS);
    } else if (paramKey === 't_insul') {
      const thicknessM = displayValue / 1000.0;
      setValueByPath(newConfig, paramDef.path, thicknessM);
    } else {
      setValueByPath(newConfig, paramDef.path, displayValue);

      // Recalculer numSegments quand L change
      if (paramKey === 'L') {
        newConfig.numSegments = Math.min(Math.max(Math.ceil(displayValue / 5), 10), 100);
      }
    }

    return newConfig;
  }

  // ========== AJUSTER CONFIG POUR STABILITÉ ==========
  /**
   * Applique des ajustements conservateurs pour éviter les erreurs numériques.
   * Ne modifie JAMAIS les paramètres X et Y analysés.
   *
   * @param {Object}   config    - Configuration (déjà copiée)
   * @param {number}   valueX    - Valeur courante du paramètre X (non utilisée, préservation)
   * @param {number}   valueY    - Valeur courante du paramètre Y (non utilisée, préservation)
   * @param {Object}   paramDefX - Définition du paramètre X
   * @param {Object}   paramDefY - Définition du paramètre Y
   * @returns {Object} Nouvelle configuration ajustée
   */
  function adjustConfigForStability(config, valueX, valueY, paramDefX, paramDefY) {
    // Immutable: deepCopy first, then mutate the copy (original untouched)
    const adjusted = window.UIUtils.deepCopy(config);

    const paramPathsToPreserve = [paramDefX.path.join('.'), paramDefY.path.join('.')];

    if (!paramPathsToPreserve.includes('totalLength')) {
      if (adjusted.totalLength > 200) {
        adjusted.numSegments = Math.min(150, Math.ceil(adjusted.totalLength / 2));
      }
    }

    if (!paramPathsToPreserve.includes('fluid.P')) {
      if (adjusted.totalLength > 150) {
        adjusted.fluid.P = Math.max(adjusted.fluid.P, 4.0);
      }
    }

    return adjusted;
  }

  // ========== CONFIG DE SECOURS ==========
  /**
   * Crée une configuration de secours plus conservatrice pour les cas limites.
   * Ne modifie JAMAIS les paramètres X et Y analysés.
   *
   * @param {Object}   config    - Configuration de base (déjà copiée)
   * @param {number}   valueX    - Valeur courante du paramètre X
   * @param {number}   valueY    - Valeur courante du paramètre Y
   * @param {Object}   paramDefX - Définition du paramètre X
   * @param {Object}   paramDefY - Définition du paramètre Y
   * @returns {Object} Configuration de secours
   */
  function createFallbackConfig(config, valueX, valueY, paramDefX, paramDefY) {
    const fallback = window.UIUtils.deepCopy(config);

    const paramPathsToPreserve = [paramDefX.path.join('.'), paramDefY.path.join('.')];

    if (!paramPathsToPreserve.includes('fluid.P')) {
      fallback.fluid.P = Math.max(fallback.fluid.P, 5.0);
    }

    fallback.numSegments = Math.min(50, fallback.numSegments);

    return fallback;
  }

  // ========== CALCULER MATRICE ==========
  /**
   * Calcule la matrice de températures finales pour toutes les combinaisons
   * (paramX × paramY) dans les plages fournies.
   *
   * Fonction pure — pas d'accès DOM, résultat déterministe.
   *
   * @param {Object}   baseConfig     - Configuration de base (non mutée)
   * @param {string}   selectedParamX - Clé du paramètre axe X
   * @param {string}   selectedParamY - Clé du paramètre axe Y
   * @param {{min:number, max:number}} rangeX - Plage de valeurs pour X
   * @param {{min:number, max:number}} rangeY - Plage de valeurs pour Y
   * @param {number}   resolution     - Nombre de points par axe
   * @returns {{
   *   matrix: Array<Array<{T_final:number|null, success:boolean}>>,
   *   valuesX: number[],
   *   valuesY: number[],
   *   paramX: string,
   *   paramY: string,
   *   labelX: string,
   *   labelY: string,
   *   unitX: string,
   *   unitY: string
   * }}
   */
  function calculateMatrix(baseConfig, selectedParamX, selectedParamY, rangeX, rangeY, resolution) {
    const matrix = [];
    const valuesX = [];
    const valuesY = [];

    // Générer les valeurs pour X et Y
    for (let i = 0; i < resolution; i++) {
      const t = i / (resolution - 1);
      valuesX.push(rangeX.min + t * (rangeX.max - rangeX.min));
      valuesY.push(rangeY.min + t * (rangeY.max - rangeY.min));
    }

    const paramDefX = getParamDefs()[selectedParamX];
    const paramDefY = getParamDefs()[selectedParamY];

    let errorCount = 0;
    const errors = [];

    for (let j = 0; j < resolution; j++) {
      const row = [];

      for (let i = 0; i < resolution; i++) {
        // applyParameterValue retourne un NOUVEL objet sans muter l'original
        const configX = applyParameterValue(baseConfig, selectedParamX, valuesX[i]);
        const config = applyParameterValue(configX, selectedParamY, valuesY[j]);

        const adjustedConfig = adjustConfigForStability(
          config,
          valuesX[i],
          valuesY[j],
          paramDefX,
          paramDefY
        );

        try {
          const result = window.calculatePipeNetwork(adjustedConfig);

          const T_final = result.T_final;
          const isFrozen = T_final <= 0;

          row.push({
            T_final: isFrozen ? 0.0 : T_final,
            success: true,
            adjusted: adjustedConfig !== config,
            frozen: isFrozen,
          });
        } catch (error) {
          try {
            const fallbackConfig = createFallbackConfig(
              config,
              valuesX[i],
              valuesY[j],
              paramDefX,
              paramDefY
            );
            const result = window.calculatePipeNetwork(fallbackConfig);

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
        `${errorCount} calculs hors plage physique (affichés en gris). Erreurs:`,
        errors.slice(0, 3)
      );
    }

    return {
      matrix: matrix,
      valuesX: valuesX,
      valuesY: valuesY,
      paramX: selectedParamX,
      paramY: selectedParamY,
      labelX: getParamDefs()[selectedParamX].label,
      labelY: getParamDefs()[selectedParamY].label,
      unitX: getParamDefs()[selectedParamX].unit,
      unitY: getParamDefs()[selectedParamY].unit,
    };
  }

  // ====================================================================
  // EXPORTS
  // ====================================================================

  window.SensitivityMatrix = {
    calculateMatrix: calculateMatrix,
    applyParameterValue: applyParameterValue,
    getValueFromPath: getValueFromPath,
    getDisplayValue: getDisplayValue,
    adjustConfigForStability: adjustConfigForStability,
    createFallbackConfig: createFallbackConfig,
  };

  // Export conditionnel pour tests Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      calculateMatrix: calculateMatrix,
      applyParameterValue: applyParameterValue,
      getValueFromPath: getValueFromPath,
      getDisplayValue: getDisplayValue,
      adjustConfigForStability: adjustConfigForStability,
      createFallbackConfig: createFallbackConfig,
    };
  }
})();
