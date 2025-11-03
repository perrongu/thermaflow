/**
 * storage.js
 * 
 * Gestion du localStorage pour sauvegarder les paramètres utilisateur
 * 
 * Fonctionnalités:
 * - Sauvegarder derniers paramètres
 * - Restaurer au chargement (optionnel)
 * - Effacer historique
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'thermaflow_last_config';

  // ========== SAUVEGARDE ==========
  /**
   * Sauvegarde la configuration dans localStorage
   * 
   * @param {Object} config - Configuration à sauvegarder
   */
  function save(config) {
    try {
      const data = {
        config: config,
        timestamp: Date.now(),
        version: '1.0.1'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Impossible de sauvegarder la configuration:', error);
    }
  }

  // ========== CHARGEMENT ==========
  /**
   * Charge la dernière configuration depuis localStorage
   * 
   * @returns {Object|null} Objet complet {config, timestamp, version, unitPreferences} ou null si inexistant
   */
  function load() {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return null;
      
      const data = JSON.parse(json);
      return data; // Retourner l'objet complet, pas seulement data.config
    } catch (error) {
      console.warn('Impossible de charger la configuration:', error);
      return null;
    }
  }

  // ========== EFFACEMENT ==========
  /**
   * Efface la configuration sauvegardée
   */
  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Impossible d\'effacer la configuration:', error);
    }
  }

  // ========== EXPORT ==========
  window.Storage = {
    save,
    load,
    clear
  };

})();

