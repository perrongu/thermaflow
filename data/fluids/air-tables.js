/**
 * air-tables.js
 * 
 * Tables de données thermophysiques pour l'air sec à pression atmosphérique.
 * 
 * DONNÉES PURES - AUCUNE FONCTION
 * 
 * Sources des formules utilisées pour générer ces tables:
 * 1. Densité: Loi des gaz parfaits ρ = P/(R×T)
 * 2. Viscosité: Corrélation de Sutherland
 * 3. Conductivité: Corrélation d'Eucken
 * 4. Chaleur spécifique: Données ASHRAE
 * 5. Prandtl: Calculé Pr = μ×cp/k
 * 
 * Références:
 * - Perry's Chemical Engineers' Handbook, 9th Ed., Section 2
 * - ASHRAE Fundamentals 2021, Chapter 1
 * - Sutherland, W. (1893), Phil. Mag. S.5, 36(223), 507-531
 * 
 * Plage: -40 à 50°C, pression atmosphérique (1.01325 bar)
 * 
 * @module air-tables
 */

const airTablesData = {
  description: "Propriétés thermophysiques de l'air sec à pression atmosphérique",
  source: "Tables générées avec corrélations validées Perry's & ASHRAE",
  pressure: "atmosphérique (1.01325 bar = 101325 Pa)",
  range: {
    temperature_C: [-40.0, 50.0]
  },
  units: {
    temperature: "°C",
    density: "kg/m³",
    viscosity: "Pa·s",
    thermal_conductivity: "W/(m·K)",
    specific_heat: "J/(kg·K)",
    prandtl: "sans dimension"
  },
  references: [
    "Perry's Chemical Engineers' Handbook, 9th Ed., Section 2, Tables 2-2 & 2-312",
    "Sutherland, W. (1893), Phil. Mag. S.5, 36(223), 507-531",
    "ASHRAE Fundamentals 2021, Chapter 1, Tables 2-3"
  ],
  
  // Grille de température [-40, -35, ..., 45, 50]°C
  temperature_grid_C: [
    -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 
    10, 15, 20, 25, 30, 35, 40, 45, 50
  ],
  
  // Densité [kg/m³]
  density_kg_m3: [
    1.514, 1.4822, 1.4517, 1.4225, 1.3944, 1.3674, 1.3414, 1.3164,
    1.2923, 1.2691, 1.2466, 1.225, 1.2041, 1.1839, 1.1644, 1.1455,
    1.1272, 1.1095, 1.0923
  ],
  
  // Viscosité dynamique [Pa·s]
  viscosity_Pa_s: [
    1.510778e-05, 1.537263e-05, 1.563501e-05, 1.589495e-05, 1.615252e-05,
    1.640776e-05, 1.666072e-05, 1.691145e-05, 1.716000e-05, 1.740641e-05,
    1.765072e-05, 1.789298e-05, 1.813322e-05, 1.837149e-05, 1.860783e-05,
    1.884228e-05, 1.907486e-05, 1.930562e-05, 1.953460e-05
  ],
  
  // Conductivité thermique [W/(m·K)]
  thermal_conductivity_W_m_K: [
    0.02123, 0.0216, 0.02196, 0.02232, 0.02268, 0.02304, 0.02339, 0.02375,
    0.0241, 0.02445, 0.0248, 0.02515, 0.0255, 0.02585, 0.0262, 0.02654,
    0.02688, 0.02723, 0.02757
  ],
  
  // Chaleur spécifique [J/(kg·K)]
  specific_heat_J_kg_K: [
    1004.3, 1004.4, 1004.5, 1004.6, 1004.7, 1004.7, 1004.8, 1004.9,
    1005.0, 1005.1, 1005.2, 1005.3, 1005.3, 1005.4, 1005.5, 1005.6,
    1005.7, 1005.8, 1005.8
  ],
  
  // Nombre de Prandtl [sans dimension]
  prandtl: [
    0.7146, 0.715, 0.7152, 0.7154, 0.7156, 0.7157, 0.7157, 0.7157,
    0.7156, 0.7155, 0.7153, 0.7151, 0.7149, 0.7146, 0.7143, 0.7139,
    0.7135, 0.7131, 0.7127
  ]
};

// Freezer pour immutabilité
Object.freeze(airTablesData);
Object.freeze(airTablesData.temperature_grid_C);
Object.freeze(airTablesData.density_kg_m3);
Object.freeze(airTablesData.viscosity_Pa_s);
Object.freeze(airTablesData.thermal_conductivity_W_m_K);
Object.freeze(airTablesData.specific_heat_J_kg_K);
Object.freeze(airTablesData.prandtl);

// Export pour navigateur
if (typeof window !== 'undefined') {
  window.AirTablesData = airTablesData;
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { airTablesData };
}

