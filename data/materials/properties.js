const materialPropertiesData = {
  // ========== MÉTAUX (Conduites) ==========

  steel: {
    name: 'Acier au carbone',
    category: 'metal',
    k: 50.2, // W/(m·K) - Conductivité thermique élevée
    rho: 7850, // kg/m³ - Densité typique acier doux
    cp: 486, // J/(kg·K) - Capacité thermique
    emissivity: 0.79, // Acier oxydé (surface typique en service)
    notes: 'Acier commercial ASTM A36, surface oxydée',
  },

  steel_polished: {
    name: 'Acier poli',
    category: 'metal',
    k: 50.2,
    rho: 7850,
    cp: 486,
    emissivity: 0.07, // Acier poli (surface neuve brillante)
    notes: 'Acier poli, surface neuve et propre',
  },

  stainless_steel: {
    name: 'Acier inoxydable 304',
    category: 'metal',
    k: 16.2, // W/(m·K) - Conductivité plus faible que l'acier
    rho: 8000, // kg/m³
    cp: 500, // J/(kg·K)
    emissivity: 0.28, // Acier inox oxydé
    notes: 'AISI 304, surface oxydée',
  },

  stainless_steel_polished: {
    name: 'Acier inoxydable poli',
    category: 'metal',
    k: 16.2,
    rho: 8000,
    cp: 500,
    emissivity: 0.14, // Acier inox poli
    notes: 'AISI 304, surface polie',
  },

  copper: {
    name: 'Cuivre',
    category: 'metal',
    k: 401, // W/(m·K) - Excellente conductivité
    rho: 8960, // kg/m³
    cp: 385, // J/(kg·K)
    emissivity: 0.78, // Cuivre oxydé
    notes: 'Cuivre commercial, surface oxydée',
  },

  copper_polished: {
    name: 'Cuivre poli',
    category: 'metal',
    k: 401,
    rho: 8960,
    cp: 385,
    emissivity: 0.023, // Cuivre poli (très réfléchissant)
    notes: 'Cuivre commercial, surface polie',
  },

  cast_iron: {
    name: 'Fonte',
    category: 'metal',
    k: 52, // W/(m·K)
    rho: 7200, // kg/m³
    cp: 460, // J/(kg·K)
    emissivity: 0.81, // Fonte oxydée
    notes: 'Fonte grise',
  },

  aluminum: {
    name: 'Aluminium',
    category: 'metal',
    k: 237, // W/(m·K) - Très bonne conductivité
    rho: 2700, // kg/m³ - Léger
    cp: 903, // J/(kg·K)
    emissivity: 0.09, // Aluminium poli
    notes: 'Aluminium commercial, alliage 6061',
  },

  // ========== ISOLANTS ==========

  fiberglass: {
    name: 'Laine de verre',
    category: 'insulation',
    k: 0.04, // W/(m·K) - Faible conductivité (bon isolant)
    rho: 32, // kg/m³ - Très léger
    cp: 835, // J/(kg·K)
    emissivity: 0.9, // Surface mate
    notes: 'Laine de verre standard, densité moyenne',
  },

  mineral_wool: {
    name: 'Laine minérale (roche)',
    category: 'insulation',
    k: 0.038, // W/(m·K) - Excellent isolant
    rho: 100, // kg/m³
    cp: 840, // J/(kg·K)
    emissivity: 0.9,
    notes: 'Laine de roche haute densité',
  },

  polyurethane_foam: {
    name: 'Mousse de polyuréthane',
    category: 'insulation',
    k: 0.026, // W/(m·K) - Très bon isolant
    rho: 40, // kg/m³
    cp: 1400, // J/(kg·K)
    emissivity: 0.9,
    notes: 'Mousse PU rigide, cellules fermées',
  },

  polystyrene_expanded: {
    name: 'Polystyrène expansé (EPS)',
    category: 'insulation',
    k: 0.036, // W/(m·K)
    rho: 25, // kg/m³
    cp: 1300, // J/(kg·K)
    emissivity: 0.9,
    notes: 'Polystyrène expansé (styromousse)',
  },

  polystyrene_extruded: {
    name: 'Polystyrène extrudé (XPS)',
    category: 'insulation',
    k: 0.029, // W/(m·K) - Meilleur que EPS
    rho: 35, // kg/m³
    cp: 1300, // J/(kg·K)
    emissivity: 0.9,
    notes: 'Polystyrène extrudé (plus dense que EPS)',
  },

  elastomeric_foam: {
    name: 'Mousse élastomère',
    category: 'insulation',
    k: 0.04, // W/(m·K)
    rho: 70, // kg/m³
    cp: 1500, // J/(kg·K)
    emissivity: 0.85,
    notes: 'Isolation flexible pour tuyauterie (ex: Armaflex)',
  },

  // ========== PLASTIQUES (Conduites) ==========

  pvc: {
    name: 'PVC (Polychlorure de vinyle)',
    category: 'plastic',
    k: 0.19, // W/(m·K) - Faible conductivité
    rho: 1380, // kg/m³
    cp: 900, // J/(kg·K)
    emissivity: 0.91,
    notes: 'PVC rigide pour tuyauterie',
  },

  hdpe: {
    name: 'PEHD (Polyéthylène haute densité)',
    category: 'plastic',
    k: 0.5, // W/(m·K)
    rho: 950, // kg/m³
    cp: 2300, // J/(kg·K)
    emissivity: 0.94,
    notes: 'HDPE pour tuyauterie',
  },

  pex: {
    name: 'PEX (Polyéthylène réticulé)',
    category: 'plastic',
    k: 0.4, // W/(m·K)
    rho: 940, // kg/m³
    cp: 2300, // J/(kg·K)
    emissivity: 0.94,
    notes: 'PEX pour plomberie résidentielle',
  },
};

// Freezer pour immutabilité
Object.freeze(materialPropertiesData);
for (const key in materialPropertiesData) {
  Object.freeze(materialPropertiesData[key]);
}

// Export pour navigateur
if (typeof window !== 'undefined') {
  window.MaterialPropertiesData = materialPropertiesData;
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { materialPropertiesData };
}
