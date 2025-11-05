/**
 * generate_validation_sample.js
 *
 * Générateur d'échantillon de validation externe pour ThermaFlow v1.0.1
 *
 * Stratégie: Combinaison de grille systématique (cas critiques) + Latin Hypercube Sampling
 *
 * Usage: node scripts/generate_validation_sample.js
 * Output: validation/external_validation_sample_v1.0.1.json
 */

const fs = require('fs');
const path = require('path');

// ========== CONFIGURATION ==========

const CONFIG = {
  // Nombre de cas
  criticalCases: 30,
  lhsCases: 100,

  // Distributions matériaux (pourcentages)
  materialDistribution: {
    steel: 0.4,
    copper: 0.3,
    stainless_steel: 0.3,
  },

  // Schedules/Types par matériau (les plus courants)
  schedules: {
    steel: ['40', '80', '120', '160'],
    copper: ['K', 'L', 'M'],
    stainless_steel: ['10S', '40S', '80S'],
  },

  // Plages NPS par matériau
  npsRanges: {
    steel: { min: 0.5, max: 36 },
    copper: { min: 0.25, max: 12 },
    stainless_steel: { min: 0.125, max: 24 },
  },

  // Plages opérationnelles (validées depuis le code)
  ranges: {
    length_m: { min: 1, max: 2500 },
    temp_C: { min: 1, max: 100 },
    flow_m3h: { min: 0.1, max: 6000 }, // Capacité actuelle de l'app
    pressure_kPag: { min: 100, max: 1000 },
    ambient_temp_C: { min: -50, max: 30 },
    wind_kmh: { min: 0, max: 108 },
  },

  // Matériaux d'isolation
  insulationMaterials: ['fiberglass', 'mineral_wool', 'polyurethane_foam', 'elastomeric_foam'],
  insulationDistribution: {
    fiberglass: 0.3,
    mineral_wool: 0.25,
    polyurethane_foam: 0.25,
    elastomeric_foam: 0.2,
  },

  // Épaisseurs isolation (mm)
  insulationThickness: { min: 13, max: 100 },
};

// ========== UTILITAIRES MATHÉMATIQUES ==========

/**
 * Générateur de nombres aléatoires avec seed (pour reproductibilité)
 */
class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

const rng = new SeededRandom(42); // Seed fixe pour reproductibilité

/**
 * Échantillonnage uniforme dans [min, max]
 */
function uniformSample(min, max) {
  return min + rng.next() * (max - min);
}

/**
 * Échantillonnage log-normal (pour distributions asymétriques)
 * Plus de valeurs basses, quelques valeurs hautes
 */
function logNormalSample(min, max) {
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const logValue = logMin + rng.next() * (logMax - logMin);
  return Math.exp(logValue);
}

/**
 * Échantillonnage beta (forme de cloche asymétrique)
 * alpha=2, beta=5 donne plus de valeurs basses
 */
function betaSample(min, max, alpha = 2, beta = 5) {
  // Approximation simple de Beta via méthode de rejet
  let u1, u2, sample;
  do {
    u1 = rng.next();
    u2 = rng.next();
    sample = Math.pow(u1, 1 / alpha) * Math.pow(1 - u2, 1 / beta);
  } while (sample > 1 || sample < 0);

  return min + sample * (max - min);
}

/**
 * Sélection d'élément selon distribution de probabilité
 */
function categoricalSample(distribution) {
  const rand = rng.next();
  let cumulative = 0;

  for (const [key, prob] of Object.entries(distribution)) {
    cumulative += prob;
    if (rand <= cumulative) {
      return key;
    }
  }

  // Fallback (ne devrait jamais arriver)
  return Object.keys(distribution)[0];
}

/**
 * Sélection aléatoire dans un tableau
 */
function randomChoice(array) {
  return array[Math.floor(rng.next() * array.length)];
}

/**
 * Latin Hypercube Sampling pour n échantillons sur dimension donnée
 */
function lhsSample1D(n, min, max) {
  const samples = [];
  const intervals = [];

  // Créer n intervalles
  for (let i = 0; i < n; i++) {
    intervals.push(i);
  }

  // Mélanger les intervalles (Fisher-Yates)
  for (let i = intervals.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [intervals[i], intervals[j]] = [intervals[j], intervals[i]];
  }

  // Échantillonner dans chaque intervalle
  for (let i = 0; i < n; i++) {
    const interval = intervals[i];
    const sample = (interval + rng.next()) / n;
    samples.push(min + sample * (max - min));
  }

  return samples;
}

// ========== GÉNÉRATION CAS CRITIQUES (GRILLE) ==========

/**
 * Génère les cas critiques via grille systématique
 * Cas extrêmes et conditions limites importantes
 */
function generateCriticalCases() {
  const cases = [];
  let caseId = 1;

  console.log('\n🔥 Génération des cas critiques (grille systématique)...');

  // 1. Cas extrêmes température (6 cas)
  const extremeTempCases = [
    { temp: 1, ambient: -50, desc: 'Température eau minimale, air très froid' },
    { temp: 1, ambient: 30, desc: 'Température eau minimale, air chaud' },
    {
      temp: 100,
      ambient: -50,
      desc: 'Température eau maximale, air très froid',
    },
    { temp: 100, ambient: 30, desc: 'Température eau maximale, air chaud' },
    { temp: 50, ambient: -50, desc: 'Température eau moyenne, air très froid' },
    { temp: 50, ambient: 30, desc: 'Température eau moyenne, air chaud' },
  ];

  for (const tc of extremeTempCases) {
    cases.push({
      case_id: caseId++,
      description: tc.desc,
      inputs: {
        pipe: {
          material: 'steel',
          schedule: '40',
          nps: 2.0,
          length_m: 100,
        },
        fluid: {
          temp_C: tc.temp,
          flow_m3h: 5.0,
          pressure_kPag: 300,
        },
        ambient: {
          temp_C: tc.ambient,
          wind_kmh: 15,
        },
        insulation: null,
      },
    });
  }

  // 2. Cas critiques gel (4 cas)
  const freezeCases = [
    {
      temp: 2,
      ambient: -30,
      wind: 0,
      insul: null,
      desc: 'Risque gel élevé sans isolation',
    },
    {
      temp: 2,
      ambient: -30,
      wind: 50,
      insul: null,
      desc: 'Risque gel élevé avec vent sans isolation',
    },
    {
      temp: 2,
      ambient: -30,
      wind: 0,
      insul: { material: 'polyurethane_foam', thickness_mm: 50 },
      desc: 'Risque gel avec isolation épaisse',
    },
    {
      temp: 5,
      ambient: -40,
      wind: 30,
      insul: { material: 'fiberglass', thickness_mm: 25 },
      desc: 'Risque gel modéré avec isolation moyenne',
    },
  ];

  for (const fc of freezeCases) {
    cases.push({
      case_id: caseId++,
      description: fc.desc,
      inputs: {
        pipe: {
          material: 'steel',
          schedule: '40',
          nps: 2.0,
          length_m: 100,
        },
        fluid: {
          temp_C: fc.temp,
          flow_m3h: 3.0,
          pressure_kPag: 300,
        },
        ambient: {
          temp_C: fc.ambient,
          wind_kmh: fc.wind,
        },
        insulation: fc.insul,
      },
    });
  }

  // 3. Cas extrêmes débit (4 cas)
  const flowCases = [
    { flow: 0.1, nps: 0.5, desc: 'Débit minimal, petit diamètre' },
    { flow: 0.1, nps: 4, desc: 'Débit minimal, diamètre moyen' },
    { flow: 6000, nps: 12, desc: 'Débit maximal, grand diamètre' },
    { flow: 1000, nps: 6, desc: 'Débit élevé, diamètre moyen' },
  ];

  for (const flc of flowCases) {
    cases.push({
      case_id: caseId++,
      description: flc.desc,
      inputs: {
        pipe: {
          material: 'steel',
          schedule: '40',
          nps: flc.nps,
          length_m: 100,
        },
        fluid: {
          temp_C: 50,
          flow_m3h: flc.flow,
          pressure_kPag: 300,
        },
        ambient: {
          temp_C: 0,
          wind_kmh: 15,
        },
        insulation: null,
      },
    });
  }

  // 4. Cas extrêmes géométrie (6 cas - 2 par matériau)
  const geomCases = [
    {
      material: 'steel',
      schedule: '40',
      nps: 0.5,
      length: 1,
      desc: 'Acier petit diamètre, longueur minimale',
    },
    {
      material: 'steel',
      schedule: '160',
      nps: 36,
      length: 2500,
      desc: 'Acier grand diamètre, longueur maximale (2500 m)',
    },
    {
      material: 'copper',
      schedule: 'K',
      nps: 0.25,
      length: 10,
      desc: 'Cuivre petit diamètre',
    },
    {
      material: 'copper',
      schedule: 'M',
      nps: 12,
      length: 500,
      desc: 'Cuivre grand diamètre',
    },
    {
      material: 'stainless_steel',
      schedule: '10S',
      nps: 0.125,
      length: 5,
      desc: 'Inox petit diamètre',
    },
    {
      material: 'stainless_steel',
      schedule: '80S',
      nps: 24,
      length: 800,
      desc: 'Inox grand diamètre',
    },
  ];

  for (const gc of geomCases) {
    cases.push({
      case_id: caseId++,
      description: gc.desc,
      inputs: {
        pipe: {
          material: gc.material,
          schedule: gc.schedule,
          nps: gc.nps,
          length_m: gc.length,
        },
        fluid: {
          temp_C: 50,
          flow_m3h: 5.0,
          pressure_kPag: 300,
        },
        ambient: {
          temp_C: 0,
          wind_kmh: 15,
        },
        insulation: null,
      },
    });
  }

  // 5. Cas extrêmes isolation (4 cas)
  const insulCases = [
    {
      material: 'fiberglass',
      thickness: 13,
      desc: 'Isolation minimale fibre de verre',
    },
    {
      material: 'polyurethane_foam',
      thickness: 100,
      desc: 'Isolation maximale polyuréthane',
    },
    {
      material: 'mineral_wool',
      thickness: 50,
      desc: 'Isolation moyenne laine minérale',
    },
    {
      material: 'elastomeric_foam',
      thickness: 25,
      desc: 'Isolation élastomère',
    },
  ];

  for (const ic of insulCases) {
    cases.push({
      case_id: caseId++,
      description: ic.desc,
      inputs: {
        pipe: {
          material: 'steel',
          schedule: '40',
          nps: 2.0,
          length_m: 100,
        },
        fluid: {
          temp_C: 50,
          flow_m3h: 5.0,
          pressure_kPag: 300,
        },
        ambient: {
          temp_C: -20,
          wind_kmh: 30,
        },
        insulation: {
          material: ic.material,
          thickness_mm: ic.thickness,
        },
      },
    });
  }

  // 6. Cas extrêmes pression (2 cas)
  const pressureCases = [
    { pressure: 100, desc: 'Pression minimale' },
    { pressure: 1000, desc: 'Pression maximale' },
  ];

  for (const pc of pressureCases) {
    cases.push({
      case_id: caseId++,
      description: pc.desc,
      inputs: {
        pipe: {
          material: 'steel',
          schedule: '40',
          nps: 2.0,
          length_m: 100,
        },
        fluid: {
          temp_C: 50,
          flow_m3h: 5.0,
          pressure_kPag: pc.pressure,
        },
        ambient: {
          temp_C: 0,
          wind_kmh: 15,
        },
        insulation: null,
      },
    });
  }

  // 7. Cas extrêmes vent (4 cas)
  const windCases = [
    { wind: 0, desc: 'Vent nul' },
    { wind: 108, desc: 'Vent maximal' },
    { wind: 30, desc: 'Vent modéré' },
    { wind: 70, desc: 'Vent élevé' },
  ];

  for (const wc of windCases) {
    cases.push({
      case_id: caseId++,
      description: wc.desc,
      inputs: {
        pipe: {
          material: 'steel',
          schedule: '40',
          nps: 2.0,
          length_m: 100,
        },
        fluid: {
          temp_C: 50,
          flow_m3h: 5.0,
          pressure_kPag: 300,
        },
        ambient: {
          temp_C: 0,
          wind_kmh: wc.wind,
        },
        insulation: null,
      },
    });
  }

  console.log(`✅ ${cases.length} cas critiques générés`);
  return cases;
}

// ========== GÉNÉRATION CAS LHS ==========

/**
 * Génère des cas via Latin Hypercube Sampling
 * Distribution uniforme dans l'espace paramétrique avec contraintes réalistes
 */
function generateLHSCases(n, startId) {
  const cases = [];

  console.log(`\n📊 Génération de ${n} cas via Latin Hypercube Sampling...`);

  // Générer échantillons LHS pour chaque dimension continue
  const tempSamples = lhsSample1D(n, 10, 90); // Focus 10-90°C
  const flowSamples = lhsSample1D(n, Math.log(0.5), Math.log(100)).map(Math.exp); // Log-normal 0.5-100 m³/h
  const pressureSamples = lhsSample1D(n, 100, 1000);
  const ambientTempSamples = lhsSample1D(n, -30, 10); // Focus températures froides
  const windSamples = lhsSample1D(n, 0, 30); // Focus vents modérés (beta approximé)
  const lengthSamples = lhsSample1D(n, Math.log(10), Math.log(500)).map(Math.exp); // Log-normal
  const insulThicknessSamples = lhsSample1D(n, Math.log(15), Math.log(80)).map(Math.exp); // Log-normal

  for (let i = 0; i < n; i++) {
    // Sélectionner matériau selon distribution
    const material = categoricalSample(CONFIG.materialDistribution);

    // Sélectionner schedule/type aléatoire pour ce matériau
    const schedule = randomChoice(CONFIG.schedules[material]);

    // Sélectionner NPS via distribution log-normale dans la plage du matériau
    const npsRange = CONFIG.npsRanges[material];
    const npsLogMin = Math.log(npsRange.min);
    const npsLogMax = Math.log(npsRange.max);
    const npsRaw = Math.exp(npsLogMin + rng.next() * (npsLogMax - npsLogMin));

    // Arrondir NPS à des valeurs réalistes (0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36)
    const commonNPS = [
      0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24,
      30, 36,
    ];
    const validNPS = commonNPS.filter((n) => n >= npsRange.min && n <= npsRange.max);
    const nps = validNPS.reduce((prev, curr) =>
      Math.abs(curr - npsRaw) < Math.abs(prev - npsRaw) ? curr : prev
    );

    // Isolation: 50% des cas
    let insulation = null;
    if (rng.next() < 0.5) {
      const insulMaterial = categoricalSample(CONFIG.insulationDistribution);
      insulation = {
        material: insulMaterial,
        thickness_mm: Math.round(insulThicknessSamples[i]),
      };
    }

    cases.push({
      case_id: startId + i,
      description: `Cas LHS ${i + 1}: ${material} ${schedule} ${nps}"`,
      inputs: {
        pipe: {
          material: material,
          schedule: schedule,
          nps: nps,
          length_m: Math.round(lengthSamples[i]),
        },
        fluid: {
          temp_C: Math.round(tempSamples[i] * 10) / 10, // 1 décimale
          flow_m3h: Math.round(flowSamples[i] * 10) / 10, // 1 décimale
          pressure_kPag: Math.round(pressureSamples[i]),
        },
        ambient: {
          temp_C: Math.round(ambientTempSamples[i]),
          wind_kmh: Math.round(windSamples[i]),
        },
        insulation: insulation,
      },
    });
  }

  console.log(`✅ ${cases.length} cas LHS générés`);
  return cases;
}

// ========== VALIDATION ==========

/**
 * Valide qu'un cas respecte toutes les contraintes de l'application
 */
function validateCase(testCase) {
  const { pipe, fluid, ambient, insulation } = testCase.inputs;
  const errors = [];

  // Valider matériau
  if (!['steel', 'copper', 'stainless_steel'].includes(pipe.material)) {
    errors.push(`Matériau invalide: ${pipe.material}`);
  }

  // Valider plages NPS
  const npsRange = CONFIG.npsRanges[pipe.material];
  if (pipe.nps < npsRange.min || pipe.nps > npsRange.max) {
    errors.push(`NPS hors plage pour ${pipe.material}: ${pipe.nps}`);
  }

  // Valider plages opérationnelles
  if (pipe.length_m < CONFIG.ranges.length_m.min || pipe.length_m > CONFIG.ranges.length_m.max) {
    errors.push(`Longueur hors plage: ${pipe.length_m}`);
  }

  if (fluid.temp_C < CONFIG.ranges.temp_C.min || fluid.temp_C > CONFIG.ranges.temp_C.max) {
    errors.push(`Température eau hors plage: ${fluid.temp_C}`);
  }

  if (fluid.flow_m3h < CONFIG.ranges.flow_m3h.min || fluid.flow_m3h > CONFIG.ranges.flow_m3h.max) {
    errors.push(`Débit hors plage: ${fluid.flow_m3h}`);
  }

  if (
    fluid.pressure_kPag < CONFIG.ranges.pressure_kPag.min ||
    fluid.pressure_kPag > CONFIG.ranges.pressure_kPag.max
  ) {
    errors.push(`Pression hors plage: ${fluid.pressure_kPag}`);
  }

  if (
    ambient.temp_C < CONFIG.ranges.ambient_temp_C.min ||
    ambient.temp_C > CONFIG.ranges.ambient_temp_C.max
  ) {
    errors.push(`Température air hors plage: ${ambient.temp_C}`);
  }

  if (
    ambient.wind_kmh < CONFIG.ranges.wind_kmh.min ||
    ambient.wind_kmh > CONFIG.ranges.wind_kmh.max
  ) {
    errors.push(`Vent hors plage: ${ambient.wind_kmh}`);
  }

  // Valider isolation si présente
  if (insulation !== null) {
    if (!CONFIG.insulationMaterials.includes(insulation.material)) {
      errors.push(`Matériau isolation invalide: ${insulation.material}`);
    }
    if (
      insulation.thickness_mm < CONFIG.insulationThickness.min ||
      insulation.thickness_mm > CONFIG.insulationThickness.max
    ) {
      errors.push(`Épaisseur isolation hors plage: ${insulation.thickness_mm}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valide tous les cas et affiche les erreurs
 */
function validateAllCases(cases) {
  console.log('\n✔️ Validation des cas...');

  let validCount = 0;
  let invalidCount = 0;

  for (const testCase of cases) {
    const result = validateCase(testCase);
    if (result.valid) {
      validCount++;
    } else {
      invalidCount++;
      console.error(`❌ Cas ${testCase.case_id} invalide:`, result.errors);
    }
  }

  console.log(`\n📊 Résultats validation:`);
  console.log(`   ✅ Valides: ${validCount}`);
  console.log(`   ❌ Invalides: ${invalidCount}`);

  return invalidCount === 0;
}

// ========== STATISTIQUES ==========

/**
 * Calcule et affiche les statistiques de distribution
 */
function displayStatistics(cases) {
  console.log('\n📈 Statistiques de distribution:');
  console.log('═'.repeat(60));

  // Distribution matériaux
  const materialCounts = {};
  const scheduleCounts = {};
  const npsCounts = { small: 0, medium: 0, large: 0 };
  const insulationCounts = { none: 0, with: 0 };
  const insulMaterialCounts = {};

  const tempValues = [];
  const flowValues = [];
  const pressureValues = [];
  const ambientTempValues = [];
  const windValues = [];
  const lengthValues = [];
  const insulThicknessValues = [];

  for (const testCase of cases) {
    const { pipe, fluid, ambient, insulation } = testCase.inputs;

    // Compter matériaux
    materialCounts[pipe.material] = (materialCounts[pipe.material] || 0) + 1;
    scheduleCounts[pipe.schedule] = (scheduleCounts[pipe.schedule] || 0) + 1;

    // Catégories NPS
    if (pipe.nps <= 2) {
      npsCounts.small++;
    } else if (pipe.nps <= 8) {
      npsCounts.medium++;
    } else {
      npsCounts.large++;
    }

    // Isolation
    if (insulation === null) {
      insulationCounts.none++;
    } else {
      insulationCounts.with++;
      insulMaterialCounts[insulation.material] =
        (insulMaterialCounts[insulation.material] || 0) + 1;
      insulThicknessValues.push(insulation.thickness_mm);
    }

    // Collecter valeurs continues
    tempValues.push(fluid.temp_C);
    flowValues.push(fluid.flow_m3h);
    pressureValues.push(fluid.pressure_kPag);
    ambientTempValues.push(ambient.temp_C);
    windValues.push(ambient.wind_kmh);
    lengthValues.push(pipe.length_m);
  }

  // Afficher distributions catégorielles
  console.log('\n🔧 Matériaux de conduite:');
  for (const [mat, count] of Object.entries(materialCounts).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / cases.length) * 100).toFixed(1);
    console.log(`   ${mat.padEnd(20)} : ${count.toString().padStart(3)} (${pct}%)`);
  }

  console.log('\n📏 Catégories NPS:');
  console.log(
    `   Petit (≤2")          : ${npsCounts.small.toString().padStart(3)} (${((npsCounts.small / cases.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `   Moyen (2-8")         : ${npsCounts.medium.toString().padStart(3)} (${((npsCounts.medium / cases.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `   Grand (>8")          : ${npsCounts.large.toString().padStart(3)} (${((npsCounts.large / cases.length) * 100).toFixed(1)}%)`
  );

  console.log('\n🧊 Isolation:');
  console.log(
    `   Sans isolation       : ${insulationCounts.none.toString().padStart(3)} (${((insulationCounts.none / cases.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `   Avec isolation       : ${insulationCounts.with.toString().padStart(3)} (${((insulationCounts.with / cases.length) * 100).toFixed(1)}%)`
  );

  if (Object.keys(insulMaterialCounts).length > 0) {
    console.log('\n   Matériaux isolation:');
    for (const [mat, count] of Object.entries(insulMaterialCounts).sort((a, b) => b[1] - a[1])) {
      const pct = ((count / insulationCounts.with) * 100).toFixed(1);
      console.log(`     ${mat.padEnd(25)} : ${count.toString().padStart(3)} (${pct}%)`);
    }
  }

  // Afficher statistiques continues
  console.log('\n📊 Paramètres continus (min / médiane / max):');

  const stats = (values, name, unit) => {
    values.sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const median = values[Math.floor(values.length / 2)];
    console.log(
      `   ${name.padEnd(25)} : ${min.toFixed(1).padStart(7)} / ${median.toFixed(1).padStart(7)} / ${max.toFixed(1).padStart(7)} ${unit}`
    );
  };

  stats(tempValues, 'Température eau', '°C');
  stats(flowValues, 'Débit', 'm³/h');
  stats(pressureValues, 'Pression', 'kPag');
  stats(lengthValues, 'Longueur', 'm');
  stats(ambientTempValues, 'Température air', '°C');
  stats(windValues, 'Vent', 'km/h');

  if (insulThicknessValues.length > 0) {
    stats(insulThicknessValues, 'Épaisseur isolation', 'mm');
  }

  console.log('\n' + '═'.repeat(60));
}

// ========== EXPORT JSON ==========

/**
 * Exporte les cas en format JSON
 */
function exportJSON(cases, outputPath) {
  console.log('\n💾 Export JSON...');

  // Préparer structure finale
  const output = {
    metadata: {
      generator: 'ThermaFlow External Validation Sample Generator',
      version: '1.0.1',
      date: new Date().toISOString().split('T')[0],
      total_cases: cases.length,
      description: 'Échantillon pour validation croisée avec Aspen Hysys, AFT Fathom, DWSIM',
      sampling_strategy: {
        critical_cases: CONFIG.criticalCases,
        lhs_cases: CONFIG.lhsCases,
        method: 'Grille systématique + Latin Hypercube Sampling',
      },
      ranges: CONFIG.ranges,
      nps_ranges: CONFIG.npsRanges,
    },
    cases: cases.map((c) => ({
      ...c,
      outputs: {
        aspen_hysys: {
          status: 'not_run',
          T_out_C: null,
          pressure_drop_kPa: null,
          heat_loss_W: null,
          notes: '',
        },
        aft_fathom: {
          status: 'not_run',
          T_out_C: null,
          pressure_drop_kPa: null,
          heat_loss_W: null,
          notes: '',
        },
        dwsim: {
          status: 'not_run',
          T_out_C: null,
          pressure_drop_kPa: null,
          heat_loss_W: null,
          notes: '',
        },
        thermaflow: {
          status: 'not_run',
          T_out_C: null,
          pressure_drop_kPa: null,
          heat_loss_W: null,
          notes: '',
        },
      },
    })),
  };

  // Créer répertoire si nécessaire
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Répertoire créé: ${dir}`);
  }

  // Écrire fichier
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Fichier créé: ${outputPath}`);
  console.log(`   Taille: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
}

// ========== MAIN ==========

function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   ThermaFlow External Validation Sample Generator v1.0.1     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // 1. Générer cas critiques
  const criticalCases = generateCriticalCases();

  // 2. Générer cas LHS
  const lhsCases = generateLHSCases(CONFIG.lhsCases, criticalCases.length + 1);

  // 3. Combiner
  const allCases = [...criticalCases, ...lhsCases];
  console.log(`\n📦 Total: ${allCases.length} cas générés`);

  // 4. Valider
  const valid = validateAllCases(allCases);
  if (!valid) {
    console.error('\n❌ Validation échouée. Arrêt.');
    process.exit(1);
  }

  // 5. Statistiques
  displayStatistics(allCases);

  // 6. Export
  const outputPath = path.join(
    __dirname,
    '..',
    'validation',
    'external_validation_sample_v1.0.1.json'
  );
  exportJSON(allCases, outputPath);

  console.log('\n✅ Génération terminée avec succès!');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Ouvrir le fichier JSON généré');
  console.log('   2. Pour chaque cas, noter les résultats de:');
  console.log('      - Aspen Hysys');
  console.log('      - AFT Fathom');
  console.log('      - DWSIM');
  console.log('      - ThermaFlow (webapp)');
  console.log('   3. Analyser les écarts statistiques\n');
}

// Exécuter
if (require.main === module) {
  main();
}

module.exports = {
  generateCriticalCases,
  generateLHSCases,
  validateCase,
  validateAllCases,
};
