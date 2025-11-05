/**
 * calculation-manager.js
 *
 * Gestionnaire centralisé des recalculs pour ThermaFlow
 *
 * Responsabilités:
 * - Gérer la file d'attente des demandes de calcul
 * - Annuler les calculs obsolètes
 * - Coordonner les indicateurs visuels (spinner, badges)
 * - Gérer les priorités (immediate > high > low)
 * - Exposer API unifiée pour tous les modules UI
 */

(function () {
  'use strict';

  // ========== MODE DEBUG ==========
  const DEBUG = false; // Activer pour logs détaillés

  // ========== ÉTATS POSSIBLES ==========
  const States = {
    IDLE: 'idle', // Aucun calcul en cours ou en attente
    PENDING: 'pending', // Calcul en attente (debounce)
    CALCULATING: 'calculating', // Calcul en cours d'exécution
    COMPLETE: 'complete', // Calcul terminé avec succès
    ERROR: 'error', // Calcul terminé avec erreur
  };

  // ========== PRIORITÉS ==========
  const Priorities = {
    IMMEDIATE: 3, // Bypass tout, exécute maintenant (Enter, bouton)
    HIGH: 2, // Haute priorité, cancel low (blur, change)
    LOW: 1, // Basse priorité, peut être remplacée (input debounced)
  };

  // ========== ÉTAT GLOBAL ==========
  const state = {
    current: States.IDLE,
    pendingRequest: null, // Requête en attente (avec timeout)
    currentCalculation: null, // Calcul en cours (avec cancel)
    lastConfig: null, // Dernière config calculée
    lastResult: null, // Dernier résultat
  };

  // ========== CALLBACKS VISUELS ==========
  let callbacks = {
    onStateChange: null, // (state, data) => void
    onCalculationStart: null, // (config) => void
    onCalculationComplete: null, // (result) => void
    onCalculationError: null, // (error) => void
  };

  // ========== INITIALISATION ==========
  /**
   * Initialise le gestionnaire de calcul
   *
   * @param {Object} callbackHandlers - Handlers pour les événements
   */
  function init(callbackHandlers = {}) {
    callbacks = { ...callbacks, ...callbackHandlers };
    if (DEBUG) {
      console.log('✅ CalculationManager initialisé');
    }
  }

  // ========== DEMANDE DE RECALCUL ==========
  /**
   * Demande un recalcul avec priorité et raison
   *
   * @param {Object} config - Configuration de la simulation
   * @param {Object} options - Options de la requête
   * @param {string} options.priority - 'immediate', 'high', ou 'low'
   * @param {string} options.reason - Raison du recalcul (debug)
   * @param {number} options.delay - Délai personnalisé (optionnel)
   */
  function requestRecalculation(config, options = {}) {
    const { priority = 'high', reason = 'unknown', delay = getPriorityDelay(priority) } = options;

    const priorityLevel = Priorities[priority.toUpperCase()] || Priorities.HIGH;

    if (DEBUG) {
      console.log(`🔄 Recalcul demandé: priority=${priority}, reason=${reason}, delay=${delay}ms`);
    }

    // Cas 1: IMMEDIATE - Exécuter maintenant, annuler tout
    if (priorityLevel === Priorities.IMMEDIATE) {
      cancelPendingRequest();
      cancelCurrentCalculation();
      executeCalculation(config, reason);
      return;
    }

    // Cas 2: Calcul déjà en cours
    if (state.current === States.CALCULATING) {
      // Si la nouvelle priorité est plus haute, annuler et planifier
      if (state.pendingRequest && priorityLevel > state.pendingRequest.priority) {
        cancelPendingRequest();
        schedulePendingRequest(config, priorityLevel, reason, delay);
      } else if (!state.pendingRequest) {
        // Pas de requête en attente, en créer une
        schedulePendingRequest(config, priorityLevel, reason, delay);
      }
      // Sinon, ignorer (requête basse priorité, déjà une en attente)
      return;
    }

    // Cas 3: Requête déjà en attente
    if (state.pendingRequest) {
      // Si nouvelle priorité plus haute, remplacer
      if (priorityLevel > state.pendingRequest.priority) {
        cancelPendingRequest();
        schedulePendingRequest(config, priorityLevel, reason, delay);
      }
      // Sinon, ignorer (garder la plus haute priorité)
      return;
    }

    // Cas 4: IDLE ou COMPLETE - Planifier nouvelle requête
    schedulePendingRequest(config, priorityLevel, reason, delay);
  }

  // ========== PLANIFIER REQUÊTE EN ATTENTE ==========
  function schedulePendingRequest(config, priority, reason, delay) {
    setState(States.PENDING, { priority, reason });

    const timeoutId = setTimeout(() => {
      state.pendingRequest = null;
      executeCalculation(config, reason);
    }, delay);

    state.pendingRequest = {
      config,
      priority,
      reason,
      timeoutId,
    };
  }

  // ========== ANNULER REQUÊTE EN ATTENTE ==========
  function cancelPendingRequest() {
    if (state.pendingRequest) {
      clearTimeout(state.pendingRequest.timeoutId);
      if (DEBUG) {
        console.log(`❌ Requête annulée: ${state.pendingRequest.reason}`);
      }
      state.pendingRequest = null;
    }
  }

  // ========== EXÉCUTER CALCUL ==========
  function executeCalculation(config, reason) {
    if (DEBUG) {
      console.log(`🔬 Exécution calcul: reason=${reason}`);
    }

    setState(States.CALCULATING, { reason });

    if (callbacks.onCalculationStart) {
      callbacks.onCalculationStart(config);
    }

    // Stocker config pour comparaison future
    state.lastConfig = JSON.parse(JSON.stringify(config));

    // Le calcul est synchrone dans ThermaFlow, mais on wrap dans setTimeout
    // pour permettre au DOM de se mettre à jour (spinner, etc.)
    const timeoutId = setTimeout(() => {
      try {
        // Calculer le réseau
        const networkResult = calculatePipeNetwork(config);

        // Vérifier gel
        let freezeAnalysis;
        if (networkResult.frozenCondition) {
          freezeAnalysis = {
            status: 'GELÉ',
            T_min: 0.0,
            distance_gel: networkResult.frozenAtPosition,
            marge_avant_gel: 0,
            isAtRisk: true,
          };
        } else {
          freezeAnalysis = detectFreeze(networkResult.T_profile, networkResult.x_profile, 0);
        }

        // Succès
        state.lastResult = { network: networkResult, freeze: freezeAnalysis, config };
        state.currentCalculation = null;
        setState(States.COMPLETE, { network: networkResult, freeze: freezeAnalysis });

        if (callbacks.onCalculationComplete) {
          callbacks.onCalculationComplete(state.lastResult);
        }

        // Si une requête était en attente, l'exécuter maintenant
        if (state.pendingRequest) {
          const pending = state.pendingRequest;
          state.pendingRequest = null;
          executeCalculation(pending.config, pending.reason);
        }
      } catch (error) {
        console.error('❌ Erreur calcul:', error);
        state.currentCalculation = null;
        setState(States.ERROR, { error });

        if (callbacks.onCalculationError) {
          callbacks.onCalculationError(error, config);
        }

        // Si une requête était en attente, l'exécuter quand même
        if (state.pendingRequest) {
          const pending = state.pendingRequest;
          state.pendingRequest = null;
          executeCalculation(pending.config, pending.reason);
        }
      }
    }, 10); // 10ms pour laisser le DOM se mettre à jour

    state.currentCalculation = {
      timeoutId,
      config,
      reason,
    };
  }

  // ========== ANNULER CALCUL EN COURS ==========
  function cancelCurrentCalculation() {
    if (state.currentCalculation) {
      clearTimeout(state.currentCalculation.timeoutId);
      if (DEBUG) {
        console.log(`❌ Calcul annulé: ${state.currentCalculation.reason}`);
      }
      state.currentCalculation = null;
    }
  }

  // ========== ANNULER TOUS LES CALCULS ==========
  function cancelAllCalculations() {
    cancelPendingRequest();
    cancelCurrentCalculation();
    setState(States.IDLE);
    if (DEBUG) {
      console.log('🛑 Tous les calculs annulés');
    }
  }

  // ========== OBTENIR DÉLAI PAR PRIORITÉ ==========
  function getPriorityDelay(priority) {
    switch (priority.toLowerCase()) {
      case 'immediate':
        return 0;
      case 'high':
        return 50; // 50ms - presque immédiat mais laisse DOM respirer
      case 'low':
        return 300; // 300ms - debounce standard
      default:
        return 300;
    }
  }

  // ========== METTRE À JOUR ÉTAT ==========
  function setState(newState, data = {}) {
    const oldState = state.current;
    state.current = newState;

    if (DEBUG) {
      console.log(`📊 État: ${oldState} → ${newState}`, data);
    }

    if (callbacks.onStateChange) {
      callbacks.onStateChange(newState, data);
    }
  }

  // ========== OBTENIR ÉTAT ACTUEL ==========
  function getState() {
    return {
      current: state.current,
      hasPendingRequest: state.pendingRequest !== null,
      isCalculating: state.current === States.CALCULATING,
      lastConfig: state.lastConfig,
      lastResult: state.lastResult,
    };
  }

  // ========== VÉRIFIER SI CONFIG CHANGÉE ==========
  function hasConfigChanged(newConfig) {
    if (!state.lastConfig) {
      return true;
    }

    // Comparaison simplifiée des propriétés clés
    const keys = ['totalLength', 'fluid', 'ambient', 'geometry', 'insulation'];

    for (const key of keys) {
      if (JSON.stringify(state.lastConfig[key]) !== JSON.stringify(newConfig[key])) {
        return true;
      }
    }

    return false;
  }

  // ========== EXPORT ==========
  window.CalculationManager = {
    init,
    requestRecalculation,
    cancelAllCalculations,
    getState,
    hasConfigChanged,
    States,
    Priorities,
  };
})();
