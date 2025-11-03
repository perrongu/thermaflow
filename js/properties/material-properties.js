/**
 * @typedef {Object} MaterialProperties
 * @property {string} name - Nom du matériau
 * @property {string} category - Catégorie: 'metal', 'insulation', 'plastic'
 * @property {number} k - Conductivité thermique [W/(m·K)]
 * @property {number} rho - Densité [kg/m³]
 * @property {number} cp - Capacité thermique spécifique [J/(kg·K)]
 * @property {number} [emissivity] - Émissivité pour rayonnement [sans dimension, 0-1]
 * @property {string} notes - Notes additionnelles
 */

/**
 * Récupère les propriétés d'un matériau par son identifiant.
 * 
 * @param {string} material_id - Identifiant du matériau (ex: 'steel', 'copper', 'fiberglass')
 * @returns {MaterialProperties} Propriétés du matériau
 * @throws {Error} Si le matériau n'existe pas
 * 
 * @example
 * const steel = getMaterialProperties('steel');
 * console.log(steel.k);   // 50.2 W/(m·K)
 * console.log(steel.rho); // 7850 kg/m³
 */
function getMaterialProperties(material_id) {
  if (typeof material_id !== 'string') {
    throw new Error(`ID de matériau doit être une chaîne: ${material_id}`);
  }
  
  // Récupérer les tables (depuis window ou module)
  let materialData;
  if (typeof window !== 'undefined' && window.MaterialPropertiesData) {
    materialData = window.MaterialPropertiesData;
  } else if (typeof require !== 'undefined') {
    materialData = require('../../data/materials/properties.js').materialPropertiesData;
  } else {
    throw new Error('Tables de données matériaux non disponibles');
  }
  
  const props = materialData[material_id];
  
  if (!props) {
    const available = Object.keys(materialData).join(', ');
    throw new Error(
      `Matériau inconnu: '${material_id}'. Matériaux disponibles: ${available}`
    );
  }
  
  return { ...props };  // Retourne une copie pour éviter modifications
}

/**
 * Liste tous les matériaux disponibles par catégorie.
 * 
 * @param {string} [category] - Catégorie optionnelle: 'metal', 'insulation', 'plastic'
 * @returns {Array<string>} Liste des identifiants de matériaux
 * 
 * @example
 * const metals = listMaterials('metal');
 * // ['steel', 'steel_polished', 'stainless_steel', ...]
 * 
 * @example
 * const all = listMaterials();
 * // Tous les matériaux
 */
function listMaterials(category = null) {
  // Récupérer les tables
  let materialData;
  if (typeof window !== 'undefined' && window.MaterialPropertiesData) {
    materialData = window.MaterialPropertiesData;
  } else if (typeof require !== 'undefined') {
    materialData = require('../../data/materials/properties.js').materialPropertiesData;
  } else {
    throw new Error('Tables de données matériaux non disponibles');
  }
  
  const materials = Object.keys(materialData);
  
  if (category === null) {
    return materials;
  }
  
  return materials.filter(id => {
    return materialData[id].category === category;
  });
}

// Export pour navigateur (window global)
if (typeof window !== 'undefined') {
  window.MaterialProperties = {
    getMaterialProperties,
    listMaterials
  };
}

// Export pour Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMaterialProperties,
    listMaterials
  };
}

