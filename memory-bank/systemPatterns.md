# System Patterns - ThermaFlow

## Architecture globale

### Vue d'ensemble
```
ThermaFlow
├── Solver (Phase 1) ✅ COMPLÉTÉ
│   ├── Propriétés fluides
│   ├── Hydraulique
│   ├── Transfert thermique
│   └── Matériaux
│
├── Engine (Phase 2) ⏳ PROCHAINE
│   ├── Segment de conduite
│   ├── Propagation multi-segments
│   └── Détection gel
│
└── UI (Phase 3)
    ├── Formulaire entrée
    ├── Visualisation résultats
    └── Export
```

## Décision architecturale fondamentale

### HTML/CSS/JS PUR - Aucun bundler, aucun serveur

**Règle absolue**: Les fichiers doivent s'ouvrir directement dans le navigateur (file://)

#### Structure des fichiers
```
/ (racine)
├── index.html           # Point d'entrée (double-clic → ouvre dans navigateur)
├── css/
│   └── *.css           # Styles purs (PAS de SCSS, LESS, etc.)
├── js/
│   ├── constants/      # 🔢 Constantes partagées (source unique)
│   ├── properties/     # Accès aux données (lookup, interpolation)
│   ├── formulas/       # Formules mathématiques de base
│   ├── correlations/   # Corrélations empiriques complexes
│   ├── calculations/   # Calculs composés multi-étapes
│   ├── engine/         # Moteur de simulation
│   └── ui/             # Interface utilisateur
└── data/
    ├── fluids/         # Tables propriétés fluides
    ├── materials/      # Propriétés matériaux
    ├── pipes/          # Rugosités conduites
    └── pipespecs/      # Dimensions standard
```

#### Ce qui est INTERDIT dans js/
- ❌ `require()` (Node.js)
- ❌ `module.exports` (Node.js)
- ❌ `import ... from` (nécessite bundler ou serveur)
- ❌ `fetch()` pour fichiers locaux (bloqué par CORS)
- ❌ Toute API Node.js

#### Ce qui est PERMIS dans js/
- ✅ JavaScript pur ES5/ES6 navigateur
- ✅ Fonctions globales (window.nomFonction)
- ✅ `<script src="...">` dans HTML
- ✅ Exports conditionnels pour tests:
  ```javascript
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fonctionTest }; // Pour tests Node.js uniquement
  }
  ```
- ✅ Imports conditionnels pour constantes partagées:
  ```javascript
  // Pattern pour js/constants/ (source unique de vérité)
  let RE_LAMINAR_MAX, RE_TURBULENT_MIN;
  
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js: import depuis module
    const flowRegimes = require('../constants/flow-regimes.js');
    RE_LAMINAR_MAX = flowRegimes.RE_LAMINAR_MAX;
  } else if (typeof window !== 'undefined' && window.FlowRegimes) {
    // Browser: utilise window.FlowRegimes
    RE_LAMINAR_MAX = window.FlowRegimes.RE_LAMINAR_MAX;
  } else {
    // Fallback
    RE_LAMINAR_MAX = 2300;
  }
  ```

## Patterns de code

### 1. Modules de calcul (js/properties/, js/formulas/, js/correlations/, js/calculations/)

**Caractéristiques**:
- Fonctions pures (pas d'état global)
- Validation stricte des entrées
- JSDoc complet
- Unités SI explicites
- Immutabilité des données

**Organisation par complexité**:
- **constants/**: Constantes partagées (source unique de vérité)
- **properties/**: Lookup et interpolation dans tables
- **formulas/**: Équations mathématiques reconnues (Re, ΔP)
- **correlations/**: Équations empiriques (Colebrook, Gnielinski)
- **calculations/**: Assemblage multi-étapes

**Template standard**:
```javascript
/**
 * @param {number} param - Description [unité]
 * @returns {number} Résultat [unité]
 * @throws {Error} Si paramètre invalide
 */
function calculateSomething(param) {
  // 1. Validation
  if (typeof param !== 'number' || !isFinite(param)) {
    throw new Error(`Paramètre invalide: ${param}`);
  }
  if (param <= 0) {
    throw new Error(`Paramètre doit être positif: ${param}`);
  }
  
  // 2. Calcul
  const result = /* équation scientifique */;
  
  // 3. Retour
  return result;
}

// Export conditionnel pour tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateSomething };
}
```

### 2. Données immutables

**Pattern**: Object.freeze pour protéger les données
```javascript
const materialData = {
  steel: { k: 50.2, rho: 7850, cp: 486 }
};

Object.freeze(materialData);
Object.freeze(materialData.steel);
```

### 3. Gestion d'erreurs

**Principe**: Fail fast avec messages clairs
```javascript
// BON
if (T < 0 || T > 100) {
  throw new Error(`Température hors plage: ${T}°C (plage: 0-100°C)`);
}

// MAUVAIS
if (T < 0) return null; // Erreur silencieuse
```

## Relations entre composants

### Phase 1: Modules de calcul (organisation par complexité)
```
DATA (data/)
  fluids/ ──────┐
  materials/ ───┼──> PROPERTIES (js/properties/)
  pipes/ ───────┘         │
                          ├──> FORMULAS (js/formulas/)
                          │      reynolds, geometry, pressure-basic
                          │
                          ├──> CORRELATIONS (js/correlations/)
                          │      friction-factor, nusselt-*, radiation
                          │
                          └──> CALCULATIONS (js/calculations/)
                                 pressure-drop, thermal-resistance, heat-transfer
```

### Phase 2: Engine (orchestration)
```
PipeSegment {
  - Utilise js/calculations/ (pressure-drop, heat-transfer, thermal-resistance)
  - Calcule segment individuel
  - Retourne {T_out, dP, Q_loss}
}

PipeNetwork {
  - Boucle sur N segments
  - Propage T_out → T_in du segment suivant
  - Détecte gel
}
```

## Décisions techniques clés

### 1. Tables + Interpolation (vs équations directes)
**Pourquoi**: Précision maximale + performance excellente
- Eau: IAPWS-97 (tables précises)
- Air: Tables générées avec corrélations validées

### 2. Colebrook itératif (vs approximations)
**Pourquoi**: Standard industriel, précision garantie
- Converge en 5-10 itérations
- Estimation initiale Swamee-Jain

### 3. Méthode NTU (vs LMTD)
**Pourquoi**: Plus adaptée aux échangeurs à T_amb constante
- Pas besoin d'itération
- Formule explicite pour T_out

### 4. Tests unitaires systématiques
**Pourquoi**: Confiance maximale dans les calculs
- 99/99 tests (100%)
- Validation croisée (Perry's + fluids.readthedocs.io)
- Cas limites testés

## Patterns d'évolution

### Ajout d'un nouveau module de calcul
1. **Déterminer le niveau de complexité**:
   - Lookup dans tables → `js/properties/`
   - Formule mathématique simple → `js/formulas/`
   - Corrélation empirique → `js/correlations/`
   - Calcul multi-étapes → `js/calculations/`
2. Créer le fichier dans le bon dossier (ex: `js/formulas/nouveau.js`)
3. JSDoc complet avec références scientifiques
4. Validation stricte des entrées
5. Export conditionnel pour tests
6. Créer tests dans `tests/test_nouveau.js`
7. Valider contre sources multiples
8. Documenter dans `docs/`

### Modification d'un module existant
1. Lire les tests existants
2. Modifier le code
3. Vérifier que TOUS les tests passent
4. Ajouter tests pour nouveau comportement
5. Mettre à jour JSDoc
6. Documenter changement dans Memory Bank

## Pattern: Schéma SVG interactif

### Structure
```javascript
// js/ui/pipe-diagram.js
(function() {
  'use strict';
  
  // Configuration avec constantes nommées
  const SVG_WIDTH = 900;
  const PIPE_CENTER_Y = 225;
  const WATER_BLOCK_OFFSET_X = 200;
  
  // État privé
  let svgElement = null;
  
  // Fonctions avec JSDoc complet
  /**
   * Met à jour le diagramme
   * @param {Object} specs - Spécifications tuyau
   * @param {number} specs.OD - Diamètre extérieur [mm]
   * @returns {void}
   */
  function update(specs) {
    if (!specs || typeof specs.OD !== 'number') {
      console.error('Specs invalides');
      return;
    }
    // ...
  }
  
  // API publique
  window.PipeDiagram = { init, update };
  
  // Export conditionnel pour tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init, update };
  }
})();
```

### Inputs HTML dans SVG via foreignObject
```javascript
// Créer foreignObject avec dimensions calculées précisément
const contentHeight = 142; // label(13px) + input(26px) + margin(5px) × 3
const foreign = createSVGElement('foreignObject', {
  x: blockX + 10,
  y: blockY + 30,
  width: 140,
  height: contentHeight
});

// Contenu HTML avec inline styles
foreign.innerHTML = `
  <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif;">
    <label style="font-size: 10px;">Température (°C):</label>
    <input type="number" id="water-temp" value="60" 
           style="width: 100%; box-sizing: border-box;">
  </div>
`;
```

### Récupération asynchrone des inputs SVG
```javascript
// Dans input-form.js
PipeDiagram.init();
initializeDefaultValues(); // Crée le SVG

// Attendre le rendu avant de récupérer les inputs
requestAnimationFrame(() => {
  elements.waterTemp = document.getElementById('water-temp');
  elements.pipeLength = document.getElementById('pipe-length');
});
```

### Principes appliqués
1. ✅ Constantes nommées (pas de magic numbers)
2. ✅ JSDoc complet avec types et unités
3. ✅ Validation des entrées
4. ✅ Exports conditionnels browser + Node.js
5. ✅ Dimensions calculées (pas de `scrollHeight` aléatoire)
6. ✅ Pas de console.log en production

## Anti-patterns à éviter

❌ **Code Node.js dans js/**
```javascript
// INTERDIT
const fs = require('fs');
module.exports = { fonction };
```

❌ **État global muable**
```javascript
// MAUVAIS
let globalConfig = {};
function setConfig(config) {
  globalConfig = config;
}
```

❌ **Validation laxiste**
```javascript
// MAUVAIS
function calc(x) {
  return x * 2; // Pas de validation!
}
```

❌ **Magic numbers**
```javascript
// MAUVAIS
const result = value * 5.67e-8; // C'est quoi?

// BON
const STEFAN_BOLTZMANN = 5.67e-8; // W/(m²·K⁴)
const result = value * STEFAN_BOLTZMANN;
```

## Pattern Analyse de Sensibilité 2D

### Architecture module
```javascript
// Pattern: Module autonome avec state interne
const SensitivityAnalysis = (function() {
  'use strict';

  let state = {
    baseConfig: null,        // Configuration de base (clonée)
    selectedParamX: 'L',     // Paramètre axe X
    selectedParamY: 'T_amb', // Paramètre axe Y
    isUpToDate: false,       // Cache invalidé?
    validationErrors: []     // Erreurs validation
  };

  function init() { /* ... */ }
  function updateBaseConfig(config) { /* ... */ }
  function markAsOutdated() { /* ... */ }

  return { init, updateBaseConfig, markAsOutdated };
})();
```

### Flux de calcul matriciel
```
1. Sélection paramètres X et Y
2. Calcul plages ±20% avec validation limites physiques
3. Génération matrice 15x15 (225 points)
4. Pour chaque point (xVal, yVal):
   a. Cloner baseConfig
   b. Modifier config[paramX] = xVal, config[paramY] = yVal
   c. Calcul avec fallback multi-niveaux:
      - Niveau 1: Calcul normal
      - Niveau 2: Ajustements préventifs (segments, pression)
      - Niveau 3: Config secours (P=5bar, segments réduits)
      - Niveau 4: Estimation NTU-ε (modèle simplifié)
   d. Enregistrer T_final (ou 0.0 si gel)
5. Rendu heatmap Canvas avec couleurs/valeurs
```

### Validation stricte entrées
```javascript
// Limites physiques par paramètre
const PARAMETER_DEFINITIONS = {
  'T_amb': {
    label: 'Température air',
    unit: '°C',
    path: ['ambient', 'T_amb'],
    min: -40,  // Limite physique
    max: 50    // Limite physique
  },
  // ... autres paramètres
};

// Validation temps réel
function validateRanges() {
  // Vérifier min/max dans limites
  // Vérifier min < max
  // Afficher erreurs visuellement
  // Désactiver bouton si erreur
}
```

### Gestion physique du gel
```javascript
// Dans pipe-network.js
if (segmentResult.T_out <= 0) {
  segmentResult.T_out = 0.0;      // Figer à point de congélation
  frozenDetected = true;           // Marquer condition
}

// Résultat réseau
return {
  frozenCondition: frozenConditionReached,  // Flag gel
  frozenAtPosition: x_end,                  // Position gel
  // ... autres résultats
};
```

### Estimation thermodynamique (fallback niveau 4)
```javascript
// Modèle NTU-ε simplifié pour valeurs extrêmes
function estimateTemperature(config) {
  const { totalLength, fluid, ambient, insulation } = config;
  
  // Paramètres simplifiés
  const U = 5; // W/(m²·K) - Coefficient global estimé
  const A = Math.PI * 0.05 * totalLength; // Surface externe
  const m_dot = fluid.m_dot;
  const cp = 4186; // J/(kg·K) - Eau
  
  // Méthode NTU-ε
  const NTU = (U * A) / (m_dot * cp);
  const T_final = ambient.T_amb + 
                  (fluid.T_in - ambient.T_amb) * Math.exp(-NTU);
  
  return T_final <= 0 ? 0.0 : T_final;
}
```

### Visualisation heatmap
```javascript
// Couleurs selon température
function getTemperatureColor(T) {
  if (T <= 0) {
    return 'rgb(139, 0, 0)';  // Rouge foncé (gel)
  } else if (T < 5) {
    return '#ffd700';          // Jaune (sous marge)
  } else {
    return '#22c55e';          // Vert (sécuritaire)
  }
}

// Axes avec valeurs numériques précises
function drawAxisLabels(ctx, values, orientation) {
  values.forEach((val, index) => {
    const label = formatValue(val, unit);  // 0, 1 ou 2 décimales
    // Positionner selon orientation (top pour X, left pour Y)
    ctx.fillText(label, x, y);
  });
}

// Légende simplifiée (3 zones)
const legendItems = [
  { color: 'rgb(139, 0, 0)', label: 'Gel (≤ 0°C)' },
  { color: '#ffd700', label: 'Sous marge (0-5°C)' },
  { color: '#22c55e', label: 'Sécuritaire (≥ 5°C)' }
];
```

### Invalidation cache ("Pas à jour")
```javascript
// Listener sur événement global
document.addEventListener('thermaflow:analyze', (e) => {
  const config = e.detail.config;
  SensitivityAnalysis.updateBaseConfig(config);  // Clone + invalide
});

function markAsOutdated() {
  state.isUpToDate = false;
  elements.status.style.display = 'inline-block';  // Badge "Pas à jour"
}

function runSensitivityAnalysis() {
  // ... calculs ...
  state.isUpToDate = true;
  elements.status.style.display = 'none';  // Masquer badge
}
```

### Performance
- Matrice 15x15 = 225 calculs
- Temps total: < 3 secondes
- Rendu Canvas: < 100ms
- Validation temps réel: < 10ms

## Performance

### Objectifs
- Interpolation: < 0.2 ms ✅
- Calcul segment: < 5 ms ✅
- Calcul complet (100 segments): < 1 s ✅

### Optimisations appliquées
1. Recherche binaire pour interpolation
2. Cache des propriétés fluides (si répétées)
3. Éviter réallocation mémoire (réutiliser objets)
4. Churchill au lieu de Colebrook quand acceptable

## Tests

### Structure
```
tests/
├── test_phase1_hydraulics.js      # 26 tests
├── test_phase1_heat_transfer.js   # 41 tests
└── test_phase1_materials.js       # 32 tests
```

### Commandes
```bash
node tests/test_*.js                # Tous les tests
node examples/solver_demo.js        # Démonstration
```

### Critères de succès
- ✅ 100% des tests passent
- ✅ Validation contre sources multiples
- ✅ Cas limites couverts
- ✅ Messages d'erreur testés

## Scripts et outils de validation

### Structure scripts/
```
scripts/
├── generate_validation_sample.js    # Générateur échantillon validation externe
└── lib/
    └── thermaflow-loader.js         # Module partagé pour scripts
```

### Module partagé: thermaflow-loader.js

**Objectif**: Éliminer duplication code entre scripts de validation/test

**Exports**:
```javascript
module.exports = {
  loadThermaFlowModules,      // Charge modules calcul ThermaFlow
  loadPipeSpecsHelper,         // Charge spécifications conduites
  convertInputsToNetworkConfig, // Convertit JSON → format calculatePipeNetwork
  ROUGHNESS_BY_MATERIAL,       // Constantes rugosité
  VALIDATION_THRESHOLDS        // Seuils écarts significatifs
};
```

**Usage typique**:
```javascript
const { 
  loadThermaFlowModules, 
  loadPipeSpecsHelper, 
  convertInputsToNetworkConfig 
} = require('./scripts/lib/thermaflow-loader.js');

const ROOT_DIR = __dirname;

// Charger modules ThermaFlow
const modules = loadThermaFlowModules(ROOT_DIR);
const pipeSpecsHelper = loadPipeSpecsHelper(ROOT_DIR);

// Convertir inputs JSON
const config = convertInputsToNetworkConfig(inputs, pipeSpecsHelper, modules);

// Calculer
const result = modules.pipeNetwork.calculatePipeNetwork(config);
```

**Constantes exportées**:
```javascript
VALIDATION_THRESHOLDS = {
  TEMP_DEVIATION_C: 3.0,        // Température (°C)
  PRESSURE_DEVIATION_KPA: 20,   // Pression absolue (kPa)
  PRESSURE_DEVIATION_PCT: 30,   // Pression relative (%)
  HEAT_LOSS_DEVIATION_PCT: 50   // Perte thermique (%)
};
```

**Chargement modules complet**:
- Charge TOUS les modules ThermaFlow dans l'ordre des dépendances
- Simule environnement browser (global.window)
- Retourne objets prêts à utiliser

### Validation externe

**Fichiers**:
- `scripts/generate_validation_sample.js` - Générateur échantillon (LHS + grille)
- `validation/external_validation_sample_v1.0.json` - 130 cas + résultats
- `validation/README.md` - Guide validation externe

**Intégration automated_verification.js**:
- Fonction `processExternalValidation()` - Traitement complet
- Backup automatique JSON
- Recalcul ThermaFlow (préserve données externes)
- Calcul statistiques comparatives
- Génération section rapport

**Workflow**:
1. Générer échantillon: `node scripts/generate_validation_sample.js`
2. Entrer données externes manuellement dans JSON
3. Lancer vérification: `node tests/automated_verification.js`
4. Consulter rapport: `docs/AUTOMATED_VERIFICATION_*.md`

