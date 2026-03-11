/**
 * verdict-renderer.js
 *
 * Renders freeze/safety verdict cards and detailed results.
 *
 * Extracted from app.js (Phase 2, Item 7).
 * Contains NO orchestration logic — pure DOM rendering only.
 */

(function () {
  'use strict';

  // ========== CONSTANTE (résolvée depuis le namespace global ou require) ==========

  function getMargeSureteGel() {
    if (typeof window !== 'undefined' && window.Thresholds) {
      return window.Thresholds.MARGE_SURETE_GEL;
    }
    // Fallback for tests without Thresholds loaded
    return 5;
  }

  // ========== AFFICHAGE VERDICT ==========

  /**
   * Renders the freeze/safety verdict card.
   * @param {Object} analysis - Freeze analysis result from FreezeDetector
   */
  function displayVerdict(analysis) {
    const card = document.getElementById('verdict-card');
    const icon = document.getElementById('verdict-icon');
    const title = document.getElementById('verdict-title');
    const message = document.getElementById('verdict-message');

    const MARGE_SURETE_GEL = getMargeSureteGel();

    // Reset classes et styles
    card.className = 'verdict-card';
    message.style.whiteSpace = 'normal';

    if (analysis.status === 'GELÉ') {
      // CONDITION DE GEL ATTEINTE (cas spécial frozenCondition)
      card.classList.add('verdict-card--freeze');
      icon.innerHTML = '<span class="status-icon status-icon--freeze"></span>';
      title.textContent = window.I18n
        ? I18n.t('verdict.frozen.title')
        : 'CONDITION DE GEL ATTEINTE';
      const msg = window.I18n
        ? I18n.t('verdict.frozen.msg', { distance: analysis.distance_gel.toFixed(1) })
        : `La température de l'eau a atteint 0°C (point de congélation) à ${analysis.distance_gel.toFixed(1)} m de l'entrée. L'eau gèle dans la conduite.\n\n⚠️ Position critique: ${analysis.distance_gel.toFixed(1)} m de l'entrée\n❌ Marge de sécurité: 0.0°C (gel atteint)\n⚠️ Risque d'arrêt de production et de rupture de conduite`;

      message.style.whiteSpace = 'pre-line';
      message.textContent = msg;
    } else if (analysis.severity === 'critical') {
      // ZONE ROUGE: Gel détecté
      card.classList.add('verdict-card--freeze');
      icon.innerHTML = '<span class="status-icon status-icon--danger"></span>';
      title.textContent = window.I18n ? I18n.t('verdict.critical.title') : 'RISQUE DE GEL DÉTECTÉ';
      const msg = window.I18n
        ? I18n.t('verdict.critical.msg', {
            tmin: analysis.minTemp.toFixed(1),
            pos: analysis.minTempPosition.toFixed(1),
            freezePos: analysis.freezePosition.toFixed(1),
            marginFreeze: analysis.marginToFreeze.toFixed(1),
            marginSafety: analysis.marginToSafety.toFixed(1),
            safety: MARGE_SURETE_GEL,
          })
        : `Température minimale: ${analysis.minTemp.toFixed(1)}°C atteinte à ${analysis.minTempPosition.toFixed(1)} m de l'entrée.\n\n⚠️ Position critique: ${analysis.freezePosition.toFixed(1)} m (gel projeté)\n❌ Marge avant gel: ${analysis.marginToFreeze.toFixed(1)}°C (en-dessous de 0°C)\n❌ Écart vs seuil sécuritaire: ${analysis.marginToSafety.toFixed(1)}°C (sous ${MARGE_SURETE_GEL}°C)`;

      message.style.whiteSpace = 'pre-line';
      message.textContent = msg;
    } else if (analysis.severity === 'warning') {
      // ZONE JAUNE: Vigilance
      card.classList.add('verdict-card--warning');
      icon.innerHTML = '<span class="status-icon status-icon--warning"></span>';
      title.textContent = window.I18n
        ? I18n.t('verdict.warning.title')
        : 'VIGILANCE : SOUS LA MARGE DE SÉCURITÉ';
      const msg = window.I18n
        ? I18n.t('verdict.warning.msg', {
            tmin: analysis.minTemp.toFixed(1),
            pos: analysis.minTempPosition.toFixed(1),
            marginFreeze: analysis.marginToFreeze.toFixed(1),
            marginSafety: analysis.marginToSafety.toFixed(1),
            safety: MARGE_SURETE_GEL,
          })
        : `Température minimale: ${analysis.minTemp.toFixed(1)}°C atteinte à ${analysis.minTempPosition.toFixed(1)} m de l'entrée.\n\n⚠️ Position la plus froide: ${analysis.minTempPosition.toFixed(1)} m\n⚠️ Marge avant gel: +${analysis.marginToFreeze.toFixed(1)}°C (au-dessus de 0°C)\n⚠️ Écart vs seuil sécuritaire: ${analysis.marginToSafety.toFixed(1)}°C (sous ${MARGE_SURETE_GEL}°C)`;

      message.style.whiteSpace = 'pre-line';
      message.textContent = msg;
    } else {
      // ZONE VERTE: Sécuritaire
      card.classList.add('verdict-card--no-freeze');
      icon.innerHTML = '<span class="status-icon status-icon--safe"></span>';
      title.textContent = window.I18n ? I18n.t('verdict.ok.title') : 'PAS DE RISQUE DE GEL';
      const msg = window.I18n
        ? I18n.t('verdict.ok.msg', {
            tmin: analysis.minTemp.toFixed(1),
            pos: analysis.minTempPosition.toFixed(1),
            marginFreeze: analysis.marginToFreeze.toFixed(1),
            marginSafety: analysis.marginToSafety.toFixed(1),
            safety: MARGE_SURETE_GEL,
          })
        : `La conduite est protégée. Température minimale: ${analysis.minTemp.toFixed(1)}°C atteinte à ${analysis.minTempPosition.toFixed(1)} m.\n\n✅ Marge avant gel: +${analysis.marginToFreeze.toFixed(1)}°C (au-dessus de 0°C)\n✅ Marge de sécurité: +${analysis.marginToSafety.toFixed(1)}°C (au-dessus de ${MARGE_SURETE_GEL}°C)`;

      message.style.whiteSpace = 'pre-line';
      message.textContent = msg;
    }
  }

  // ========== AFFICHAGE RÉSULTATS DÉTAILLÉS ==========

  /**
   * Renders the detailed thermal and hydraulic results grid.
   * @param {Object} network - Network calculation result
   * @param {Object} freeze  - Freeze analysis result
   * @param {Object} config  - Calculation configuration
   */
  function displayDetailedResults(network, freeze, config) {
    const esc = window.UIUtils
      ? window.UIUtils.escHtml
      : function (s) {
          return String(s);
        };
    const MARGE_SURETE_GEL = getMargeSureteGel();

    // Résultats thermiques avec icônes et couleurs conditionnelles
    const T_final = network.T_final;
    const T_finalFormatted = (T_final >= 0 ? '+' : '') + T_final.toFixed(1) + '°C';
    const T_finalIconClass =
      T_final >= MARGE_SURETE_GEL
        ? 'status-icon--safe'
        : T_final > 0
          ? 'status-icon--warning'
          : 'status-icon--danger';
    document.getElementById('result-temp-final').innerHTML =
      `<span class="status-icon ${T_finalIconClass}"></span> ${T_finalFormatted}`;

    // Température minimale + position
    const T_min = network.minTemp;
    const T_minFormatted = (T_min >= 0 ? '+' : '') + T_min.toFixed(1) + '°C';
    const T_minIconClass =
      T_min >= MARGE_SURETE_GEL
        ? 'status-icon--safe'
        : T_min > 0
          ? 'status-icon--warning'
          : 'status-icon--danger';
    const atPos = window.I18n
      ? I18n.t('detailed.atPosition', { pos: network.minTempPosition.toFixed(1) })
      : `à ${network.minTempPosition.toFixed(1)}m`;
    document.getElementById('result-temp-min').innerHTML =
      `<span class="status-icon ${T_minIconClass}"></span> ${T_minFormatted} <span style="color: #6b7280;">${esc(atPos)}</span>`;

    // Marge avant gel avec couleur et icône
    const marginEl = document.getElementById('result-margin');
    if (freeze.status === 'GELÉ') {
      const gelAtteint = window.I18n ? I18n.t('detailed.gelAtteint') : 'Gel atteint';
      marginEl.innerHTML = `<span class="status-icon status-icon--danger"></span> <span style="color: #dc2626; font-weight: bold;">0.0°C (${esc(gelAtteint)})</span>`;
    } else {
      const margin = freeze.marginToFreeze;
      let marginColor, marginIconClass, marginLabel;
      if (margin >= MARGE_SURETE_GEL) {
        marginColor = '#16a34a'; // Vert
        marginIconClass = 'status-icon--safe';
        marginLabel = ` (${window.I18n ? I18n.t('detailed.secure') : 'sécuritaire'})`;
      } else if (margin > 0) {
        marginColor = '#f59e0b'; // Orange
        marginIconClass = 'status-icon--warning';
        marginLabel = ` (${window.I18n ? I18n.t('detailed.underMargin') : 'sous marge'})`;
      } else {
        marginColor = '#dc2626'; // Rouge
        marginIconClass = 'status-icon--danger';
        marginLabel = ` (${window.I18n ? I18n.t('detailed.gel') : 'gel'})`;
      }
      const marginFormatted = (margin >= 0 ? '+' : '') + margin.toFixed(1) + '°C';
      marginEl.innerHTML = `<span class="status-icon ${marginIconClass}"></span> <span style="color: ${marginColor}; font-weight: bold;">${marginFormatted}${esc(marginLabel)}</span>`;
    }

    document.getElementById('result-heat-loss').textContent =
      `${(network.Q_loss_total / 1000).toFixed(1)} kW`;

    // Résultats hydrauliques (utiliser le premier segment comme référence)
    const firstSegment = network.segmentResults[0];

    // Calculer vitesse à partir du débit et de la géométrie
    const T_avg_display = (network.T_final + config.fluid.T_in) / 2;
    const WaterProperties = resolveWaterProperties();
    const waterProps = WaterProperties.getWaterProperties(
      Math.max(0, T_avg_display),
      config.fluid.P
    );
    const rho_water = waterProps.rho; // kg/m³ à la température moyenne
    const Q_volumetric = config.fluid.m_dot / rho_water; // m³/s
    const A = Math.PI * Math.pow(config.geometry.D_inner / 2, 2); // m²
    const velocity = Q_volumetric / A; // m/s

    document.getElementById('result-regime').textContent = firstSegment.regime;
    document.getElementById('result-reynolds').textContent = firstSegment.Re.toFixed(0);

    // Perte de charge: afficher dans l'unité de pression courante
    // network.dP_total est en Pa, convertir vers kPa puis vers unité d'affichage
    const UnitConverter = resolveUnitConverter();
    const dP_kPa = network.dP_total / 1000; // Pa → kPa
    const dP_display = UnitConverter.fromSI('pressure', dP_kPa);
    const pressureUnit = UnitConverter.getUnitInfo('pressure').label;
    document.getElementById('result-pressure-drop').textContent =
      `${dP_display.toFixed(1)} ${pressureUnit.replace('g', '')}`;

    document.getElementById('result-velocity').textContent = `${velocity.toFixed(2)} m/s`;
  }

  // ========== AFFICHAGE RÉSUMÉ CONFIGURATION ==========

  /**
   * Renders the configuration summary section (used for PDF export).
   * @param {Object} config - Calculation configuration
   */
  function displayConfigSummary(config) {
    const UnitConverter = resolveUnitConverter();

    // Matériau
    const matKey = config.geometry.material;
    const matLabel = window.I18n ? I18n.t(`materials.${matKey}`) : matKey;
    document.getElementById('summary-material').textContent = matLabel || config.geometry.material;

    // Spécification (Schedule/Type + NPS avec diamètres)
    const scheduleLabel = config.meta.schedule || '40';
    const npsLabel = config.meta.nps || '4';
    const odMm = (config.geometry.D_outer * 1000).toFixed(1);
    const idMm = (config.geometry.D_inner * 1000).toFixed(1);
    const odText = window.I18n ? I18n.t('common.od') : 'OD';
    const idText = window.I18n ? I18n.t('common.id') : 'ID';
    document.getElementById('summary-spec').textContent =
      `${scheduleLabel} ${npsLabel}" (${odText}: ${odMm} mm, ${idText}: ${idMm} mm)`;

    // Longueur
    document.getElementById('summary-length').textContent = `${config.totalLength} m`;

    // Eau
    document.getElementById('summary-water-temp').textContent = `${config.fluid.T_in}°C`;

    // Débit: convertir m³/h (SI) vers unité d'affichage courante
    const flowDisplayValue = UnitConverter.fromSI('flowRate', config.meta.flowM3PerHr);
    document.getElementById('summary-water-flow').textContent = UnitConverter.format(
      'flowRate',
      flowDisplayValue
    );

    // Pression: convertir kPag (SI) vers unité d'affichage courante
    const pressureKPag = config.fluid.P * 100;
    const pressureDisplayValue = UnitConverter.fromSI('pressure', pressureKPag);
    document.getElementById('summary-water-pressure').textContent = UnitConverter.format(
      'pressure',
      pressureDisplayValue
    );

    // Air
    document.getElementById('summary-air-temp').textContent = `${config.ambient.T_amb}°C`;
    document.getElementById('summary-wind-speed').textContent =
      `${(config.ambient.V_wind * 3.6).toFixed(1)} km/h`;

    // Isolation
    const UIUtils = resolveUIUtils();
    if (config.insulation) {
      const materialI18nKey = UIUtils.getInsulationI18nKey(config.insulation.material);
      document.getElementById('summary-insulation-type').textContent = window.I18n
        ? I18n.t(`insulation.materials.${materialI18nKey}`)
        : config.insulation.material;
      document.getElementById('summary-insulation-thickness').textContent =
        `${(config.insulation.thickness * 1000).toFixed(0)} mm`;
    } else {
      document.getElementById('summary-insulation-type').textContent = window.I18n
        ? I18n.t('configSummary.none')
        : 'Aucune';
      document.getElementById('summary-insulation-thickness').textContent = '--';
    }
  }

  // ========== AFFICHAGE CARTE ERREUR ==========

  /**
   * Renders the error card with message and suggestions.
   * @param {string}   errorMsg    - Error message text
   * @param {string[]} suggestions - List of corrective suggestions
   */
  function displayErrorCard(errorMsg, suggestions) {
    const card = document.getElementById('verdict-card');
    const icon = document.getElementById('verdict-icon');
    const title = document.getElementById('verdict-title');
    const message = document.getElementById('verdict-message');

    // Reset classes
    card.className = 'verdict-card verdict-card--error';

    icon.innerHTML = '<span class="status-icon status-icon--warning"></span>';
    title.textContent = window.I18n ? I18n.t('status.error') : 'ERREUR DE CALCUL';

    // Message avec suggestions
    let fullMessage = `${errorMsg}\n\n`;
    if (suggestions.length > 0) {
      fullMessage +=
        (window.I18n
          ? I18n.t('errors.suggestionsTitle')
          : 'Suggestions pour résoudre le problème :') + '\n';
      suggestions.forEach((suggestion, index) => {
        fullMessage += `${index + 1}. ${suggestion}\n`;
      });
    }

    message.style.whiteSpace = 'pre-line';
    message.textContent = fullMessage;
  }

  // ========== AFFICHAGE ERREUR (orchestration UI) ==========

  /**
   * Handles display of an error state: hides form, shows error card,
   * hides secondary sections.
   * @param {Error|Object} error  - Error object or string
   * @param {Object}       config - Calculation configuration (may be null)
   */
  function showError(error, config) {
    // Cacher le formulaire
    document.getElementById('input-section').style.display = 'none';

    // Afficher le container de résultats
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'block';

    // Analyser le type d'erreur pour fournir des suggestions
    let suggestions = [];
    const errorMsg = error.message || error.toString();

    if (
      errorMsg.includes('Pression invalide') ||
      errorMsg.includes('pression négative') ||
      errorMsg.includes('Perte de charge excessive')
    ) {
      suggestions = [
        window.I18n ? I18n.t('corrective.reduceLength') : 'Réduire la longueur de la conduite',
        window.I18n ? I18n.t('corrective.incDiameter') : 'Augmenter le diamètre (NPS)',
        window.I18n ? I18n.t('corrective.reduceFlow') : 'Réduire le débit',
        window.I18n ? I18n.t('corrective.incPressure') : "Augmenter la pression d'entrée",
      ];
    } else if (errorMsg.includes('Température')) {
      suggestions = [
        window.I18n ? I18n.t('corrective.adjustTemps') : 'Ajuster les températures',
        window.I18n
          ? I18n.t('corrective.verifyAmbient')
          : 'Vérifier que les conditions ambiantes sont réalistes',
      ];
    } else if (errorMsg.includes('Débit') || errorMsg.includes('Reynolds')) {
      suggestions = [
        window.I18n ? I18n.t('corrective.reduceFlow') : 'Réduire le débit',
        window.I18n ? I18n.t('corrective.reviewInputs') : "Réviser les paramètres d'entrée",
      ];
    } else {
      suggestions = [
        window.I18n ? I18n.t('corrective.reviewInputs') : "Réviser les paramètres d'entrée",
      ];
    }

    // Afficher le résumé de configuration (pour PDF)
    if (config) {
      displayConfigSummary(config);
    }

    // Afficher la carte d'erreur
    displayErrorCard(errorMsg, suggestions);

    // Cacher les grilles de résultats dans Section 1
    const resultsGrids = document.querySelectorAll('#section-parameters .results-grid');
    resultsGrids.forEach((grid) => (grid.style.display = 'none'));

    // Cacher les sections 2 et 3 en cas d'erreur
    document.getElementById('section-sensitivity').style.display = 'none';
    document.getElementById('section-explanations').style.display = 'none';

    // Cacher le graphique de température (données obsolètes)
    const chartCard = document.getElementById('temperature-chart-card');
    if (chartCard) {
      chartCard.style.display = 'none';
    }

    // Afficher les actions
    const actionsEl = document.querySelector('.results-actions');
    if (actionsEl) {
      actionsEl.style.display = 'flex';
    }
  }

  // ========== HELPERS — résolution de dépendances ==========

  function resolveWaterProperties() {
    if (typeof window !== 'undefined' && window.WaterProperties) {
      return window.WaterProperties;
    }
    if (typeof require === 'function') {
      return require('../properties/water-properties.js');
    }
    throw new Error('WaterProperties module not available');
  }

  function resolveUnitConverter() {
    if (typeof window !== 'undefined' && window.UnitConverter) {
      return window.UnitConverter;
    }
    if (typeof require === 'function') {
      return require('./unit-converter.js');
    }
    throw new Error('UnitConverter module not available');
  }

  function resolveUIUtils() {
    if (typeof window !== 'undefined' && window.UIUtils) {
      return window.UIUtils;
    }
    if (typeof require === 'function') {
      return require('./utils.js');
    }
    throw new Error('UIUtils module not available');
  }

  // ========== EXPORTS ==========

  const VerdictRenderer = {
    displayVerdict,
    displayDetailedResults,
    displayConfigSummary,
    displayErrorCard,
    showError,
  };

  // Browser export
  if (typeof window !== 'undefined') {
    window.VerdictRenderer = VerdictRenderer;
  }

  // Node.js export (for tests)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerdictRenderer;
  }
})();
