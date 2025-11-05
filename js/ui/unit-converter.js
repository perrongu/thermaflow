/**
 * unit-converter.js
 *
 * Module central de conversion d'unités pour ThermaFlow
 *
 * Principe: Calculs internes toujours en SI, conversion uniquement à l'affichage
 *
 * Facteurs de conversion validés compatibles avec PINT (Python):
 * - 1 m³/h = 4.40286745 USGPM
 * - 1 kPag = 0.145037738 psig
 */

(function () {
  'use strict';

  // ========== FACTEURS DE CONVERSION ==========
  // Validés avec PINT: https://pint.readthedocs.io/en/stable/

  const CONVERSION_FACTORS = {
    // Débit volumique
    // Source: PINT (1 * ureg.meter**3 / ureg.hour).to('USGPM')
    // 1 gallon US = 3.785411784 L
    M3H_TO_USGPM: 4.40286745,
    USGPM_TO_M3H: 0.227124707, // Inverse calculé: 1 / 4.40286745

    // Pression (gauge)
    // Source: PINT (1 * ureg.kPa).to('psi')
    // 1 psi = 6894.75729 Pa
    KPAG_TO_PSIG: 0.145037738,
    PSIG_TO_KPAG: 6.89475729, // Inverse calculé: 1 / 0.145037738
  };

  // ========== DÉFINITIONS DES UNITÉS ==========

  const UNITS = {
    flowRate: {
      m3_h: {
        get label() {
          return window.I18n ? I18n.t('units.flowRate.m3_h') : 'm³/h';
        },
        toSI: (value) => value, // m³/h est l'unité SI d'affichage par défaut
        fromSI: (value) => value,
        decimals: 2, // Précision 0.01 m³/h pour plage 0.1-6000
        min: 0.1, // Ajusté pour cohérence avec decimals
        max: 6000, // Étendu pour applications industrielles (26400 USGPM)
      },
      usgpm: {
        get label() {
          return window.I18n ? I18n.t('units.flowRate.usgpm') : 'USGPM';
        },
        toSI: (value) => value * CONVERSION_FACTORS.USGPM_TO_M3H,
        fromSI: (value) => value * CONVERSION_FACTORS.M3H_TO_USGPM,
        decimals: 2, // Précision 0.01 USGPM pour meilleure lisibilité
        get min() {
          return 0.1 * CONVERSION_FACTORS.M3H_TO_USGPM; // 0.44 USGPM
        },
        get max() {
          return 6000 * CONVERSION_FACTORS.M3H_TO_USGPM; // 26417 USGPM
        },
      },
    },

    pressure: {
      kPag: {
        get label() {
          return window.I18n ? I18n.t('units.pressure.kPag') : 'kPag';
        },
        toSI: (value) => value, // kPag est l'unité SI d'affichage par défaut
        fromSI: (value) => value,
        decimals: 0,
        min: 100,
        max: 1000,
      },
      psig: {
        get label() {
          return window.I18n ? I18n.t('units.pressure.psig') : 'psig';
        },
        toSI: (value) => value * CONVERSION_FACTORS.PSIG_TO_KPAG,
        fromSI: (value) => value * CONVERSION_FACTORS.KPAG_TO_PSIG,
        decimals: 0,
        get min() {
          return 100 * CONVERSION_FACTORS.KPAG_TO_PSIG; // 14.5 psig
        },
        get max() {
          return 1000 * CONVERSION_FACTORS.KPAG_TO_PSIG; // 145.0 psig
        },
      },
    },
  };

  // ========== ÉTAT GLOBAL ==========

  const currentUnits = {
    flowRate: 'm3_h',
    pressure: 'kPag',
  };

  // ========== FONCTIONS PUBLIQUES ==========

  /**
   * Définit l'unité courante pour un paramètre
   * @param {string} paramType - Type de paramètre ('flowRate' ou 'pressure')
   * @param {string} unitKey - Clé de l'unité (ex: 'usgpm', 'psig')
   */
  function setUnit(paramType, unitKey) {
    if (!UNITS[paramType]) {
      throw new Error(`Type de paramètre invalide: ${paramType}`);
    }
    if (!UNITS[paramType][unitKey]) {
      throw new Error(`Unité invalide: ${unitKey} pour ${paramType}`);
    }

    currentUnits[paramType] = unitKey;
    console.log(`📐 Unité changée: ${paramType} → ${unitKey}`);
  }

  /**
   * Obtient l'unité courante pour un paramètre
   * @param {string} paramType - Type de paramètre
   * @returns {string} Clé de l'unité courante
   */
  function getUnit(paramType) {
    return currentUnits[paramType];
  }

  /**
   * Obtient les informations complètes d'une unité
   * @param {string} paramType - Type de paramètre
   * @param {string} unitKey - Clé de l'unité (optionnel, utilise unité courante si omis)
   * @returns {Object} Objet contenant label, toSI, fromSI, decimals, min, max
   */
  function getUnitInfo(paramType, unitKey = null) {
    const key = unitKey || currentUnits[paramType];
    if (!UNITS[paramType] || !UNITS[paramType][key]) {
      throw new Error(`Unité introuvable: ${paramType}.${key}`);
    }
    return UNITS[paramType][key];
  }

  /**
   * Obtient toutes les unités disponibles pour un paramètre
   * @param {string} paramType - Type de paramètre
   * @returns {Array<Object>} Liste des unités avec {key, label}
   */
  function getAvailableUnits(paramType) {
    if (!UNITS[paramType]) {
      throw new Error(`Type de paramètre invalide: ${paramType}`);
    }

    return Object.keys(UNITS[paramType]).map((key) => ({
      key: key,
      label: UNITS[paramType][key].label,
    }));
  }

  /**
   * Convertit une valeur d'affichage vers SI
   * @param {string} paramType - Type de paramètre
   * @param {number} value - Valeur dans l'unité d'affichage courante
   * @param {string} fromUnit - Unité source (optionnel, utilise unité courante si omis)
   * @returns {number} Valeur en unité SI
   */
  function toSI(paramType, value, fromUnit = null) {
    const unit = getUnitInfo(paramType, fromUnit);
    return unit.toSI(value);
  }

  /**
   * Convertit une valeur SI vers unité d'affichage
   * @param {string} paramType - Type de paramètre
   * @param {number} value - Valeur en unité SI
   * @param {string} toUnit - Unité cible (optionnel, utilise unité courante si omis)
   * @returns {number} Valeur dans l'unité d'affichage
   */
  function fromSI(paramType, value, toUnit = null) {
    const unit = getUnitInfo(paramType, toUnit);
    return unit.fromSI(value);
  }

  /**
   * Convertit une valeur d'une unité vers une autre
   * @param {string} paramType - Type de paramètre
   * @param {number} value - Valeur à convertir
   * @param {string} fromUnit - Unité source
   * @param {string} toUnit - Unité cible
   * @returns {number} Valeur convertie
   */
  function convert(paramType, value, fromUnit, toUnit) {
    const siValue = toSI(paramType, value, fromUnit);
    return fromSI(paramType, siValue, toUnit);
  }

  /**
   * Formate une valeur avec son unité
   * @param {string} paramType - Type de paramètre
   * @param {number} value - Valeur à formater (déjà dans l'unité d'affichage)
   * @param {string} unitKey - Unité (optionnel, utilise unité courante si omis)
   * @returns {string} Chaîne formatée (ex: "10.25 USGPM")
   */
  function format(paramType, value, unitKey = null) {
    const unit = getUnitInfo(paramType, unitKey);
    return `${value.toFixed(unit.decimals)} ${unit.label}`;
  }

  /**
   * Obtient les plages min/max pour l'unité courante
   * @param {string} paramType - Type de paramètre
   * @param {string} unitKey - Unité (optionnel, utilise unité courante si omis)
   * @returns {Object} {min, max, decimals}
   */
  function getRanges(paramType, unitKey = null) {
    const unit = getUnitInfo(paramType, unitKey);
    return {
      min: unit.min,
      max: unit.max,
      decimals: unit.decimals,
    };
  }

  /**
   * Charge les préférences d'unités
   * @param {Object} preferences - {flowRate: 'usgpm', pressure: 'psig'}
   */
  function loadPreferences(preferences) {
    if (preferences && typeof preferences === 'object') {
      if (preferences.flowRate && UNITS.flowRate[preferences.flowRate]) {
        currentUnits.flowRate = preferences.flowRate;
      }
      if (preferences.pressure && UNITS.pressure[preferences.pressure]) {
        currentUnits.pressure = preferences.pressure;
      }
      console.log('📂 Préférences unités chargées:', currentUnits);
    }
  }

  /**
   * Récupère les préférences d'unités actuelles
   * @returns {Object} Préférences courantes {flowRate, pressure}
   */
  function getPreferences() {
    return { ...currentUnits };
  }

  // ========== EXPORT ==========

  window.UnitConverter = {
    // Gestion unités
    setUnit,
    getUnit,
    getUnitInfo,
    getAvailableUnits,

    // Conversions
    toSI,
    fromSI,
    convert,

    // Formatage et plages
    format,
    getRanges,

    // Persistance
    loadPreferences,
    getPreferences,
    savePreferences: getPreferences, // Alias pour rétrocompatibilité

    // Constantes (pour tests)
    CONVERSION_FACTORS,
  };

  console.log('✅ UnitConverter initialisé');
})();
