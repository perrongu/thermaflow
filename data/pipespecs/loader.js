/**
 * loader.js
 *
 * Module de chargement et d'accès aux spécifications de tuyauterie
 * Fonctionne dans le browser uniquement (pas de require/module.exports)
 */

(function () {
  'use strict';

  // ========== FONCTIONS PUBLIQUES ==========

  /**
   * Récupère les spécifications d'un tuyau
   *
   * @param {string} material - 'steel', 'copper', ou 'stainless_steel'
   * @param {string|number} scheduleOrType - Schedule (ex: '40') ou Type (ex: 'K')
   * @param {number} nps - Taille nominale en pouces
   * @returns {Object|null} {OD, ID, WT} en mm, ou null si non trouvé
   */
  function getPipeSpecs(material, scheduleOrType, nps) {
    let data = null;
    let key = String(scheduleOrType);

    // Sélectionner la source de données
    if (material === 'steel') {
      data = typeof steelData !== 'undefined' ? steelData : null;
    } else if (material === 'copper') {
      data = typeof copperData !== 'undefined' ? copperData : null;
    } else if (material === 'stainless_steel') {
      data = typeof stainlessData !== 'undefined' ? stainlessData : null;
    }

    if (!data) {
      console.error(`Matériau inconnu: ${material}`);
      return null;
    }

    // Accéder aux données selon le type
    let specs = null;
    if (material === 'copper') {
      specs = data.types[key];
    } else {
      specs = data.schedules[key];
    }

    if (!specs) {
      console.error(`Schedule/Type inconnu pour ${material}: ${key}`);
      return null;
    }

    // Trouver le NPS
    const pipe = specs.find((p) => p.NPS === nps);

    if (!pipe) {
      console.error(`NPS ${nps}" non trouvé pour ${material} ${key}`);
      return null;
    }

    return {
      OD: pipe.OD,
      ID: pipe.ID,
      WT: pipe.WT,
      NPS: pipe.NPS,
    };
  }

  /**
   * Récupère la liste des schedules/types disponibles pour un matériau
   *
   * @param {string} material - 'steel', 'copper', ou 'stainless_steel'
   * @returns {Array<string>} Liste des schedules/types
   */
  function getAvailableSchedules(material) {
    let data = null;

    if (material === 'steel') {
      data = typeof steelData !== 'undefined' ? steelData : null;
    } else if (material === 'copper') {
      data = typeof copperData !== 'undefined' ? copperData : null;
    } else if (material === 'stainless_steel') {
      data = typeof stainlessData !== 'undefined' ? stainlessData : null;
    }

    if (!data) {
      return [];
    }

    // Copper utilise "types", les autres utilisent "schedules"
    const source = material === 'copper' ? data.types : data.schedules;
    return Object.keys(source);
  }

  /**
   * Récupère la liste des NPS disponibles pour un matériau et schedule/type
   *
   * @param {string} material - 'steel', 'copper', ou 'stainless_steel'
   * @param {string|number} scheduleOrType - Schedule ou Type
   * @returns {Array<number>} Liste des NPS triés
   */
  function getAvailableNPS(material, scheduleOrType) {
    let data = null;
    let key = String(scheduleOrType);

    if (material === 'steel') {
      data = typeof steelData !== 'undefined' ? steelData : null;
    } else if (material === 'copper') {
      data = typeof copperData !== 'undefined' ? copperData : null;
    } else if (material === 'stainless_steel') {
      data = typeof stainlessData !== 'undefined' ? stainlessData : null;
    }

    if (!data) {
      return [];
    }

    const source = material === 'copper' ? data.types : data.schedules;
    const specs = source[key];

    if (!specs) {
      return [];
    }

    // Extraire et trier les NPS
    return specs.map((p) => p.NPS).sort((a, b) => a - b);
  }

  /**
   * Récupère le nom d'affichage pour un matériau
   *
   * @param {string} material - Code matériau
   * @returns {string} Nom d'affichage
   */
  function getMaterialName(material) {
    const names = {
      steel: 'Acier',
      copper: 'Cuivre',
      stainless_steel: 'Acier inoxydable',
    };
    return names[material] || material;
  }

  /**
   * Détermine si le matériau utilise des "types" plutôt que des "schedules"
   *
   * @param {string} material - Code matériau
   * @returns {boolean} True si utilise des types (copper)
   */
  function usesTypes(material) {
    return material === 'copper';
  }

  // ========== EXPORT GLOBAL ==========
  window.PipeSpecsLoader = {
    getPipeSpecs,
    getAvailableSchedules,
    getAvailableNPS,
    getMaterialName,
    usesTypes,
  };

  console.log('✅ PipeSpecsLoader chargé');
})();
