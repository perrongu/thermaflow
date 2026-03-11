/**
 * app.js
 *
 * Point d'entrée principal de l'application ThermaFlow
 *
 * Initialise tous les modules UI et connecte les événements
 */

(function () {
  'use strict';

  // ========== DONNÉES GLOBALES ==========
  const currentResults = {
    network: null,
    freeze: null,
    config: null,
  };

  // ========== DISCLAIMER MODAL ==========
  // Delegated to DisclaimerModal module (js/ui/disclaimer.js)

  function initializeApp() {
    // Vérifier que tous les modules sont chargés
    checkModules();

    // Initialiser le gestionnaire de calcul
    initializeCalculationManager();

    // Initialiser les modules UI
    initializeUI();

    // Connecter les événements
    connectEvents();

    // Déclencher le calcul initial avec les valeurs par défaut (via CalculationManager)
    setTimeout(() => {
      if (typeof InputForm !== 'undefined' && InputForm.triggerAnalysis) {
        InputForm.triggerAnalysis();
      }
    }, 500); // Réduit de 1000ms à 500ms (plus réactif)
  }

  // ========== INITIALISATION AU CHARGEMENT DOM ==========
  document.addEventListener('DOMContentLoaded', function () {
    const versionSpan = document.querySelector('.version-number');
    if (versionSpan && window.ThermaFlowVersion && window.ThermaFlowVersion.VERSION) {
      versionSpan.textContent = `v${window.ThermaFlowVersion.VERSION}`;
      versionSpan.style.visibility = 'visible';
    }

    // AVANT tout le reste, vérifier le disclaimer
    if (!DisclaimerModal.checkDisclaimerAccepted()) {
      DisclaimerModal.showDisclaimerModal(initializeApp);
      return; // Bloquer l'initialisation jusqu'à acceptation
    }

    // Si déjà accepté, initialiser normalement
    initializeApp();
  });

  // ========== VÉRIFICATION MODULES ==========
  function checkModules() {
    const requiredModules = {
      // Phase 1 - Solver (à vérifier en mode production si nécessaire)
      // Phase 2 - Engine
      PipeSegment: typeof calculatePipeSegment !== 'undefined',
      PipeNetwork: typeof calculatePipeNetwork !== 'undefined',
      FreezeDetector: typeof detectFreeze !== 'undefined',
      // Phase 3 - UI
      InputForm: typeof InputForm !== 'undefined',
      CalculationManager: typeof CalculationManager !== 'undefined',
      UIUtils: typeof UIUtils !== 'undefined',
    };

    const missing = [];
    for (const [module, loaded] of Object.entries(requiredModules)) {
      if (!loaded) {
        missing.push(module);
      }
    }

    if (missing.length > 0) {
      console.error(`❌ Modules manquants: ${missing.join(', ')}`);
      if (typeof UIUtils !== 'undefined' && UIUtils.showBannerError) {
        UIUtils.showBannerError(
          window.I18n
            ? I18n.t('alerts.modulesMissing')
            : "Erreur: Certains modules n'ont pas pu être chargés. Rechargez la page."
        );
      }
    }
  }

  // ========== INITIALISATION GESTIONNAIRE DE CALCUL ==========
  function initializeCalculationManager() {
    CalculationManager.init({
      onStateChange: handleCalculationStateChange,
      onCalculationStart: handleCalculationStart,
      onCalculationComplete: handleCalculationComplete,
      onCalculationError: handleCalculationError,
    });
  }

  // ========== GESTION CHANGEMENTS D'ÉTAT ==========
  function handleCalculationStateChange(state, _data) {
    const statusBadge = document.getElementById('calc-status-badge');

    if (!statusBadge) {
      return;
    }

    switch (state) {
      case CalculationManager.States.PENDING:
        showBadge(
          statusBadge,
          window.I18n ? I18n.t('status.modifying') : 'Modification en cours...',
          'badge--outdated'
        );
        break;

      case CalculationManager.States.CALCULATING:
        showBadge(
          statusBadge,
          window.I18n ? I18n.t('status.recalculating') : 'Recalcul en cours...',
          'badge--calculating',
          true
        );
        break;

      case CalculationManager.States.COMPLETE:
        showBadge(
          statusBadge,
          window.I18n ? I18n.t('status.uptodate') : 'Résultats à jour',
          'badge--uptodate'
        );
        // Cacher après 2 secondes
        setTimeout(() => {
          if (statusBadge) {
            statusBadge.style.display = 'none';
          }
        }, 2000);
        break;

      case CalculationManager.States.ERROR:
        showBadge(
          statusBadge,
          window.I18n ? I18n.t('status.error') : 'Erreur de calcul',
          'badge--danger'
        );
        break;

      case CalculationManager.States.IDLE:
        if (statusBadge) {
          statusBadge.style.display = 'none';
        }
        break;
    }
  }

  // ========== AFFICHER BADGE STATUT ==========
  function showBadge(badge, text, className, withSpinner = false) {
    badge.className = `calc-status-badge ${className}`;

    if (withSpinner) {
      badge.textContent = '';
      const spinner = document.createElement('span');
      spinner.className = 'spinner-inline';
      badge.appendChild(spinner);
      badge.appendChild(document.createTextNode(text));
    } else {
      badge.textContent = text;
    }

    badge.style.display = 'inline-flex';
  }

  // ========== CALLBACK DÉBUT CALCUL ==========
  function handleCalculationStart(_config) {
    showLoader();
    markResultsAsOutdated();
  }

  // ========== CALLBACK FIN CALCUL ==========
  function handleCalculationComplete(result) {
    hideLoader();
    markResultsAsUpToDate();

    // Sauvegarder la configuration (localStorage)
    if (typeof Storage !== 'undefined') {
      // Charger les données existantes pour préserver unitPreferences
      const existingData = Storage.load();
      const dataToSave = existingData ? existingData.config : result.config;
      Storage.save(dataToSave);
    }

    // Sauvegarder les résultats pour export
    currentResults.network = result.network;
    currentResults.freeze = result.freeze;
    currentResults.config = result.config;

    // Afficher les résultats
    showResults(result.network, result.freeze, result.config);

    // Mettre à jour la config de base pour l'analyse de sensibilité
    if (typeof SensitivityAnalysis !== 'undefined') {
      SensitivityAnalysis.updateBaseConfig(result.config);
    }
  }

  // ========== CALLBACK ERREUR CALCUL ==========
  function handleCalculationError(error, config) {
    hideLoader();
    markResultsAsUpToDate();
    showError(error, config);
  }

  // ========== MARQUER RÉSULTATS OBSOLÈTES ==========
  function markResultsAsOutdated() {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer && resultsContainer.style.display !== 'none') {
      resultsContainer.classList.add('results-outdated');
    }
  }

  // ========== MARQUER RÉSULTATS À JOUR ==========
  function markResultsAsUpToDate() {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.classList.remove('results-outdated', 'results-calculating');
    }
  }

  // ========== INITIALISATION UI ==========
  function initializeUI() {
    // Initialiser le formulaire
    if (typeof InputForm !== 'undefined') {
      InputForm.init();
    }

    // Initialiser l'analyse de sensibilité
    if (typeof SensitivityAnalysis !== 'undefined') {
      SensitivityAnalysis.init();
    }

    // Initialiser autres modules UI (quand disponibles)
    // ResultsDisplay.init();
    // TemperatureChart.init();
    // Storage.init();
    // Export.init();
  }

  // ========== CONNEXION ÉVÉNEMENTS ==========
  function connectEvents() {
    // Écouter l'événement d'analyse déclenché par InputForm
    document.addEventListener('thermaflow:analyze', handleAnalysis);

    // Bouton export PDF
    const btnExportPDF = document.getElementById('btn-export-pdf');
    if (btnExportPDF) {
      btnExportPDF.addEventListener('click', handleExportPDF);
    }
  }

  // Note: La fonction connectSensitivityOutdateEvents() a été retirée
  // car l'analyse de sensibilité se recalcule automatiquement maintenant

  // ========== GESTION ANALYSE ==========
  function handleAnalysis(event) {
    const config = event.detail.config || event.detail;
    const options = event.detail.options || { priority: 'high', reason: 'user-action' };

    // Déléguer au CalculationManager
    CalculationManager.requestRecalculation(config, options);
  }

  // ========== AFFICHAGE ERREUR ==========
  // Delegated to VerdictRenderer module (js/ui/verdict-renderer.js)
  function showError(error, config) {
    VerdictRenderer.showError(error, config);
  }

  // ========== AFFICHAGE RÉSULTATS ==========
  function showResults(networkResult, freezeAnalysis, config) {
    // Cacher le formulaire
    document.getElementById('input-section').style.display = 'none';

    // Afficher le container de résultats
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'block';

    // Afficher toutes les sections
    document.getElementById('section-parameters').style.display = 'block';
    document.getElementById('section-sensitivity').style.display = 'block';
    document.getElementById('section-explanations').style.display = 'block';

    // Afficher les grilles de résultats dans Section 1
    const resultsGrids = document.querySelectorAll('#section-parameters .results-grid');
    resultsGrids.forEach((grid) => (grid.style.display = 'grid'));

    // Afficher les actions
    document.querySelector('.results-actions').style.display = 'flex';

    // Delegated to VerdictRenderer module (js/ui/verdict-renderer.js)
    VerdictRenderer.displayConfigSummary(config);
    VerdictRenderer.displayVerdict(freezeAnalysis);
    VerdictRenderer.displayDetailedResults(networkResult, freezeAnalysis, config);

    // Afficher la carte et dessiner le graphique
    const chartCard = document.getElementById('temperature-chart-card');
    if (chartCard && typeof TemperatureChart !== 'undefined') {
      const MARGE_SURETE_GEL = window.Thresholds.MARGE_SURETE_GEL;
      chartCard.style.display = 'block';
      TemperatureChart.draw(networkResult.x_profile, networkResult.T_profile, 0, MARGE_SURETE_GEL);
    }

    // Afficher l'analyse de sensibilité 1D (Section 2.1)
    if (typeof SensitivityAnalysis1D !== 'undefined') {
      displaySensitivity1D(config);
    }

    // Afficher les détails de calcul (Section 3)
    if (typeof CalculationDetails !== 'undefined') {
      CalculationDetails.display(networkResult, config);
    }
  }

  // ========== AFFICHAGE ANALYSE 1D ==========
  function displaySensitivity1D(config) {
    const summaryContainer = document.getElementById('tornado-summary-container');
    const gridContainer = document.getElementById('tornado-charts-grid');

    if (!summaryContainer || !gridContainer) {
      console.warn('Containers tornado non trouvés');
      return;
    }

    // Analyser tous les paramètres
    const results = SensitivityAnalysis1D.analyze(config);

    // Note: Warning "Configuration proche limites physiques" désactivé pour réduire la confusion utilisateur
    // Les résultats invalides sont filtrés dans l'analyse de sensibilité elle-même

    // Cacher l'avertissement (désactivé)
    const warningEl = document.getElementById('physical-limits-warning');
    if (warningEl) {
      warningEl.style.display = 'none';
    }

    // Générer le tableau récapitulatif
    summaryContainer.innerHTML = SensitivityAnalysis1D.generateSummaryTable(results);

    // Graphiques tornado supprimés - affichage tableau uniquement
    // La section HTML reste visible mais vide (pas de canvas générés)
    gridContainer.innerHTML = '';
  }

  // ========== ACTIONS UI ==========
  function showLoader() {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer && resultsContainer.style.display !== 'none') {
      resultsContainer.classList.add('results-calculating');
    }
  }

  function hideLoader() {
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
      resultsContainer.classList.remove('results-calculating');
    }
  }

  function handleExportPDF() {
    if (!currentResults.network || !currentResults.freeze || !currentResults.config) {
      if (typeof UIUtils !== 'undefined' && UIUtils.showBannerError) {
        UIUtils.showBannerError(
          window.I18n
            ? I18n.t('alerts.noResultsToExport')
            : "Aucun résultat à exporter. Effectuez d'abord une analyse."
        );
      }
      return;
    }

    if (typeof Export !== 'undefined') {
      Export.exportToPDF(currentResults.network, currentResults.freeze, currentResults.config);
    } else {
      if (typeof UIUtils !== 'undefined' && UIUtils.showBannerError) {
        UIUtils.showBannerError(
          window.I18n ? I18n.t('alerts.exportUnavailable') : "Module d'export non disponible"
        );
      }
    }
  }

  // ========== LISTENER CHANGEMENT DE LANGUE ==========
  document.addEventListener('thermaflow:language-changed', function () {
    // Note: La mise à jour du modal disclaimer se fait maintenant directement
    // dans showDisclaimerModal() via le sélecteur de langue intégré

    // Re-render les résultats si ils existent
    if (currentResults.network && currentResults.freeze && currentResults.config) {
      showResults(currentResults.network, currentResults.freeze, currentResults.config);
    }
  });
})();
