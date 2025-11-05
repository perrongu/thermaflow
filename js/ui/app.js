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

  /**
   * Vérifie si l'utilisateur a accepté le disclaimer dans la session courante
   * @returns {boolean} true si déjà accepté
   */
  function checkDisclaimerAccepted() {
    return sessionStorage.getItem('thermaflow_disclaimer_accepted') === 'true';
  }

  /**
   * Met à jour le contenu du modal disclaimer avec les traductions
   * Note: Utilise innerHTML pour supporter les balises <br> et <strong> dans les traductions
   *
   * SÉCURITÉ: innerHTML est sûr ici car les données proviennent uniquement de:
   * - Fichiers i18n statiques contrôlés (data/i18n/*.js)
   * - Chaînes littérales définies dans le code
   * Aucune saisie utilisateur n'est injectée → Pas de risque XSS
   *
   * @param {HTMLElement} title - Élément titre du modal
   * @param {HTMLElement} content - Élément contenu du modal
   * @param {HTMLElement} button - Bouton d'acceptation
   */
  function updateDisclaimerContent(title, content, button) {
    if (!window.I18n) {
      // Fallback si I18n non disponible - Chaîne statique contrôlée
      title.textContent = "Avertissement et conditions d'utilisation";
      content.innerHTML =
        "Cette application fournit une estimation du risque de gel dans des conduites d'eau à partir de modèles thermiques et hydrauliques validés.<br><br>Les résultats ne doivent être utilisés qu'à titre <strong>indicatif</strong>.";
      button.textContent = "J'accepte";
      return;
    }

    title.textContent = I18n.t('disclaimer.title');
    // Traduction i18n statique - Source contrôlée, pas de risque XSS
    content.innerHTML = I18n.t('disclaimer.text');
    button.textContent = I18n.t('disclaimer.accept');
  }

  /**
   * Gère le focus trap dans le modal pour accessibilité
   * @param {HTMLElement} modal - Élément modal
   * @param {HTMLElement} button - Premier élément focusable (bouton accepter)
   */
  function setupFocusTrap(modal, button) {
    // Récupérer tous les éléments focusables dans le modal
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Gérer TAB pour garder le focus dans le modal
    const handleKeyDown = function (e) {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey) {
        // SHIFT + TAB
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // TAB
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeyDown);

    // Focus initial sur le bouton d'acceptation
    setTimeout(() => button.focus(), 100);
  }

  /**
   * Affiche le modal disclaimer avec gestion du focus et des traductions
   */
  function showDisclaimerModal() {
    const modal = document.getElementById('disclaimer-modal');
    const title = document.getElementById('disclaimer-title');
    const content = document.getElementById('disclaimer-content');
    const button = document.getElementById('disclaimer-accept');

    if (!modal || !title || !content || !button) {
      console.error('❌ Éléments du modal disclaimer manquants');
      // Si le modal n'existe pas, continuer quand même l'initialisation
      initializeApp();
      return;
    }

    // Remplir avec traductions i18n
    updateDisclaimerContent(title, content, button);

    // Afficher le modal
    modal.style.display = 'flex';

    // Configurer le sélecteur de langue
    const langSelect = document.getElementById('disclaimer-lang-select');
    if (langSelect && window.I18n) {
      // Sélectionner la langue courante avec validation
      const currentLang = I18n.getCurrentLanguage() || 'fr';
      const supportedLangs = ['fr', 'en', 'es', 'pt'];

      if (supportedLangs.includes(currentLang)) {
        langSelect.value = currentLang;
      } else {
        langSelect.value = 'fr'; // Fallback sûr
      }

      // Écouter les changements de langue
      langSelect.addEventListener('change', function () {
        const newLang = this.value;
        I18n.setLanguage(newLang);

        // Mettre à jour immédiatement le contenu du modal
        updateDisclaimerContent(title, content, button);
      });
    }

    // Configurer le focus trap pour accessibilité
    setupFocusTrap(modal, button);

    // Gérer l'acceptation
    button.addEventListener('click', handleDisclaimerAccept, { once: true });
  }

  /**
   * Gère l'acceptation du disclaimer et initialise l'application
   */
  function handleDisclaimerAccept() {
    sessionStorage.setItem('thermaflow_disclaimer_accepted', 'true');
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Reprendre l'initialisation normale
    initializeApp();
  }

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
    // AVANT tout le reste, vérifier le disclaimer
    if (!checkDisclaimerAccepted()) {
      showDisclaimerModal();
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
      alert(
        window.I18n
          ? I18n.t('alerts.modulesMissing')
          : "Erreur: Certains modules n'ont pas pu être chargés. Rechargez la page."
      );
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
      // innerHTML sécurisé - Template statique + texte échappé par template literal
      badge.innerHTML = `<span class="spinner-inline"></span>${text}`;
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

  // ========== CONSTANTES ==========
  const MARGE_SURETE_GEL = 5; // °C

  // ========== GESTION ANALYSE ==========
  function handleAnalysis(event) {
    const config = event.detail.config || event.detail;
    const options = event.detail.options || { priority: 'high', reason: 'user-action' };

    // Déléguer au CalculationManager
    CalculationManager.requestRecalculation(config, options);
  }

  // ========== AFFICHAGE ERREUR ==========
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
    displayConfigSummary(config);

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
    document.querySelector('.results-actions').style.display = 'flex';
  }

  // ========== AFFICHAGE CARTE ERREUR ==========
  function displayErrorCard(errorMsg, suggestions) {
    const card = document.getElementById('verdict-card');
    const icon = document.getElementById('verdict-icon');
    const title = document.getElementById('verdict-title');
    const message = document.getElementById('verdict-message');

    // Reset classes
    card.className = 'verdict-card verdict-card--error';

    icon.textContent = '⚠️';
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

    // Afficher le résumé de configuration (pour PDF)
    displayConfigSummary(config);

    // Afficher la carte verdict
    displayVerdict(freezeAnalysis);

    // Afficher les résultats détaillés
    displayDetailedResults(networkResult, freezeAnalysis, config);

    // Afficher la carte et dessiner le graphique
    const chartCard = document.getElementById('temperature-chart-card');
    if (chartCard && typeof TemperatureChart !== 'undefined') {
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

    // Créer un canvas pour chaque paramètre
    gridContainer.innerHTML = '';

    results.forEach((result, index) => {
      const container = document.createElement('div');
      container.className = 'tornado-chart-container';

      // Titre du paramètre
      const title = document.createElement('h4');
      title.style.margin = '0 0 10px 0';
      title.style.fontSize = '14px';
      title.style.fontWeight = '600';
      title.style.color = '#374151';
      title.textContent = result.paramDef.label;
      container.appendChild(title);

      const canvas = document.createElement('canvas');
      canvas.id = `tornado-chart-${result.paramKey}`;
      canvas.width = 800;
      canvas.height = 150;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute(
        'aria-label',
        `Graphique tornado pour ${result.paramDef.label}: varie de ${result.paramDef.min} à ${result.paramDef.max} ${result.paramDef.unit}, température finale de ${result.T_atMin?.toFixed(1) || 'N/A'}°C à ${result.T_atMax?.toFixed(1) || 'N/A'}°C`
      );

      container.appendChild(canvas);
      gridContainer.appendChild(container);

      // Dessiner le graphique (passer config pour troncature adaptative)
      setTimeout(() => {
        SensitivityAnalysis1D.drawChart(canvas.id, result, config);
      }, 50 * index); // Décaler légèrement pour éviter de bloquer l'UI
    });
  }

  // ========== DÉTECTION ERREURS LIMITES PHYSIQUES (non utilisé, commenté) ==========
  /*
  function _detectPhysicalLimitsErrors(results) {
    const errors = {
      hasErrors: false,
      pressureErrors: [],
      temperatureErrors: [],
      otherErrors: [],
    };

    results.forEach((result) => {
      // Vérifier erreur MIN
      if (result.errorAtMin) {
        errors.hasErrors = true;
        const errorInfo = {
          param: result.paramDef.label,
          direction: 'MIN',
          value: result.paramDef.min,
          unit: result.paramDef.unit,
          message: result.errorAtMin,
        };

        if (result.errorAtMin.includes('Pression hors plage')) {
          errors.pressureErrors.push(errorInfo);
        } else if (result.errorAtMin.includes('Température hors plage')) {
          errors.temperatureErrors.push(errorInfo);
        } else {
          errors.otherErrors.push(errorInfo);
        }
      }

      // Vérifier erreur MAX (peut être différente de MIN)
      if (result.errorAtMax) {
        errors.hasErrors = true;
        const errorInfo = {
          param: result.paramDef.label,
          direction: 'MAX',
          value: result.paramDef.max,
          unit: result.paramDef.unit,
          message: result.errorAtMax,
        };

        if (result.errorAtMax.includes('Pression hors plage')) {
          errors.pressureErrors.push(errorInfo);
        } else if (result.errorAtMax.includes('Température hors plage')) {
          errors.temperatureErrors.push(errorInfo);
        } else {
          errors.otherErrors.push(errorInfo);
        }
      }
    });

    return errors;
  }
  */

  // ========== AFFICHAGE AVERTISSEMENT LIMITES (non utilisé, commenté) ==========
  /*
  function _displayPhysicalLimitsWarning(errors) {
    const container = document.getElementById('physical-limits-warning');
    const content = document.getElementById('physical-limits-warning-content');

    if (!container || !content) {
      console.warn("Container d'avertissement non trouvé");
      return;
    }

    if (!errors.hasErrors) {
      container.style.display = 'none';
      return;
    }

    let html = '';
    html += `<p><strong>Attention:</strong> IAPWS-97 / Perry's limits reached in sensitivity extremes.</p>`;
    html += `<p style="font-size: 0.95rem; color: #6b7280; margin-bottom: 1rem;"><em>${window.I18n ? I18n.t('corrective.warningNote') : "Note: Votre configuration ACTUELLE a produit des résultats valides. Cet avertissement concerne les valeurs MIN/MAX testées dans l'analyse de sensibilité."}</em></p>`;

    // Erreurs de pression (les plus critiques)
    if (errors.pressureErrors.length > 0) {
      html += `<p><strong>${window.I18n ? I18n.t('corrective.pressureCritical') : '🚨 Erreurs de pression critiques:'}</strong></p>`;
      html += '<ul>';
      errors.pressureErrors.forEach((err) => {
        html += `<li><strong>${err.param}</strong> au ${err.direction} (${err.value} ${err.unit}): ${err.message}</li>`;
      });
      html += '</ul>';
      html +=
        '<p style="color: #d32f2f; font-weight: 600;">⚠️ Votre configuration est proche des limites. Toute variation pourrait produire des résultats invalides.</p>';
    }

    // Erreurs de température
    if (errors.temperatureErrors.length > 0) {
      html += `<p><strong>${window.I18n ? I18n.t('corrective.tempErrors') : '⚠️ Erreurs de température:'}</strong></p>`;
      html += '<ul>';
      errors.temperatureErrors.forEach((err) => {
        html += `<li><strong>${err.param}</strong> au ${err.direction} (${err.value} ${err.unit}): ${err.message}</li>`;
      });
      html += '</ul>';
    }

    // Autres erreurs
    if (errors.otherErrors.length > 0) {
      html += `<p><strong>${window.I18n ? I18n.t('corrective.otherLimits') : 'Autres limitations:'}</strong></p>`;
      html += '<ul>';
      errors.otherErrors.forEach((err) => {
        html += `<li><strong>${err.param}</strong> au ${err.direction}: ${err.message}</li>`;
      });
      html += '</ul>';
    }

    html += `<p><strong>${window.I18n ? I18n.t('corrective.recs') : 'Recommandations pour éloigner des limites:'}</strong></p>`;
    html += '<ul>';
    if (errors.pressureErrors.length > 0) {
      html += `<li><strong>${window.I18n ? I18n.t('corrective.incPressure') : "Augmenter la pression d'entrée (actuellement proche de 1 bar minimum)"}</strong></li>`;
      html += `<li>${window.I18n ? I18n.t('corrective.reduceLength') : 'Réduire la longueur de la conduite pour limiter la perte de charge'}</li>`;
      html += `<li>${window.I18n ? I18n.t('corrective.incDiameter') : 'Augmenter le diamètre (NPS) pour réduire la vitesse et les pertes'}</li>`;
      html += `<li>${window.I18n ? I18n.t('corrective.reduceFlow') : 'Réduire le débit si possible pour diminuer les pertes de charge'}</li>`;
    } else if (errors.temperatureErrors.length > 0) {
      html += `<li>${window.I18n ? I18n.t('corrective.adjustTemps') : 'Ajuster les températures pour rester dans les plages de validité'}</li>`;
      html += `<li>${window.I18n ? I18n.t('corrective.verifyAmbient') : 'Vérifier que les conditions ambiantes sont réalistes'}</li>`;
    } else {
      html += `<li>${window.I18n ? I18n.t('corrective.reviewInputs') : "Réviser les paramètres d'entrée pour rester dans les plages de validité"}</li>`;
      html += `<li>${window.I18n ? I18n.t('corrective.consultDocs') : 'Consulter la documentation technique pour les limites de chaque corrélation'}</li>`;
    }
    html += '</ul>';

    content.innerHTML = html;
    container.style.display = 'block';
  }

  // ========== AFFICHAGE RÉSUMÉ CONFIGURATION ==========
  function displayConfigSummary(config) {
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
  */

  // ========== AFFICHAGE VERDICT ==========
  function displayVerdict(analysis) {
    const card = document.getElementById('verdict-card');
    const icon = document.getElementById('verdict-icon');
    const title = document.getElementById('verdict-title');
    const message = document.getElementById('verdict-message');

    // Reset classes et styles
    card.className = 'verdict-card';
    message.style.whiteSpace = 'normal';

    if (analysis.status === 'GELÉ') {
      // CONDITION DE GEL ATTEINTE (cas spécial frozenCondition)
      card.classList.add('verdict-card--freeze');
      icon.textContent = '❄️';
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
      icon.textContent = '❌';
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
      icon.textContent = '⚠️';
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
      icon.textContent = '✅';
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
  function displayDetailedResults(network, freeze, config) {
    // Résultats thermiques avec icônes et couleurs conditionnelles
    // innerHTML sécurisé - Valeurs numériques formatées (toFixed) + traductions i18n
    const T_final = network.T_final;
    const T_finalFormatted = (T_final >= 0 ? '+' : '') + T_final.toFixed(1) + '°C';
    const T_finalIcon = T_final >= MARGE_SURETE_GEL ? '✅' : T_final > 0 ? '⚠️' : '❌';
    document.getElementById('result-temp-final').innerHTML = `${T_finalIcon} ${T_finalFormatted}`;

    // Température minimale + position
    const T_min = network.minTemp;
    const T_minFormatted = (T_min >= 0 ? '+' : '') + T_min.toFixed(1) + '°C';
    const T_minIcon = T_min >= MARGE_SURETE_GEL ? '✅' : T_min > 0 ? '⚠️' : '❌';
    const atPos = window.I18n
      ? I18n.t('detailed.atPosition', { pos: network.minTempPosition.toFixed(1) })
      : `à ${network.minTempPosition.toFixed(1)}m`;
    document.getElementById('result-temp-min').innerHTML =
      `${T_minIcon} ${T_minFormatted} <span style="color: #6b7280;">${atPos}</span>`;

    // Marge avant gel avec couleur et icône
    const marginEl = document.getElementById('result-margin');
    if (freeze.status === 'GELÉ') {
      const gelAtteint = window.I18n ? I18n.t('detailed.gelAtteint') : 'Gel atteint';
      marginEl.innerHTML = `❌ <span style="color: #dc2626; font-weight: bold;">0.0°C (${gelAtteint})</span>`;
    } else {
      const margin = freeze.marginToFreeze;
      let marginColor, marginIcon, marginLabel;
      if (margin >= MARGE_SURETE_GEL) {
        marginColor = '#16a34a'; // Vert
        marginIcon = '✅';
        marginLabel = ` (${window.I18n ? I18n.t('detailed.secure') : 'sécuritaire'})`;
      } else if (margin > 0) {
        marginColor = '#f59e0b'; // Orange
        marginIcon = '⚠️';
        marginLabel = ` (${window.I18n ? I18n.t('detailed.underMargin') : 'sous marge'})`;
      } else {
        marginColor = '#dc2626'; // Rouge
        marginIcon = '❌';
        marginLabel = ` (${window.I18n ? I18n.t('detailed.gel') : 'gel'})`;
      }
      const marginFormatted = (margin >= 0 ? '+' : '') + margin.toFixed(1) + '°C';
      // innerHTML sécurisé - Valeurs calculées formatées, pas de saisie utilisateur
      marginEl.innerHTML = `${marginIcon} <span style="color: ${marginColor}; font-weight: bold;">${marginFormatted}${marginLabel}</span>`;
    }

    document.getElementById('result-heat-loss').textContent =
      `${(network.Q_loss_total / 1000).toFixed(1)} kW`;

    // Résultats hydrauliques (utiliser le premier segment comme référence)
    const firstSegment = network.segmentResults[0];

    // Calculer vitesse à partir du débit et de la géométrie
    const rho_water = 983; // kg/m³ approximatif à 60°C
    const Q_volumetric = config.fluid.m_dot / rho_water; // m³/s
    const A = Math.PI * Math.pow(config.geometry.D_inner / 2, 2); // m²
    const velocity = Q_volumetric / A; // m/s

    document.getElementById('result-regime').textContent = firstSegment.regime;
    document.getElementById('result-reynolds').textContent = firstSegment.Re.toFixed(0);

    // Perte de charge: afficher dans l'unité de pression courante
    // network.dP_total est en Pa, convertir vers kPa puis vers unité d'affichage
    const dP_kPa = network.dP_total / 1000; // Pa → kPa
    const dP_display = UnitConverter.fromSI('pressure', dP_kPa);
    const pressureUnit = UnitConverter.getUnitInfo('pressure').label;
    document.getElementById('result-pressure-drop').textContent =
      `${dP_display.toFixed(1)} ${pressureUnit.replace('g', '')}`;

    document.getElementById('result-velocity').textContent = `${velocity.toFixed(2)} m/s`;
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
      alert(
        window.I18n
          ? I18n.t('alerts.noResultsToExport')
          : "Aucun résultat à exporter. Effectuez d'abord une analyse."
      );
      return;
    }

    if (typeof Export !== 'undefined') {
      Export.exportToPDF(currentResults.network, currentResults.freeze, currentResults.config);
    } else {
      alert(window.I18n ? I18n.t('alerts.exportUnavailable') : "Module d'export non disponible");
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
