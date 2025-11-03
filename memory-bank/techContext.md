# Tech Context - ThermaFlow

## Stack technologique

### Production (ce qui tourne dans le navigateur)
- **HTML5**: Structure sémantique
- **CSS3**: Styles purs (variables CSS, flexbox, grid)
- **JavaScript ES6**: Code navigateur pur
- **Aucun framework**: Pas de React, Vue, Angular
- **Aucun bundler**: Pas de Webpack, Vite, Parcel
- **Aucune dépendance runtime**: 0 npm packages en production

### Développement/Tests uniquement
- **Node.js**: Pour exécuter les tests (pas en production!)

## Contraintes techniques

### 1. Compatibilité navigateur
**Cible**: Navigateurs modernes (2020+)
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Features utilisées**:
- ES6 (const, let, arrow functions, template literals)
- Object.freeze
- Math.log10, Math.pow
- Pas de features expérimentales

### 2. Pas de serveur requis
**Contrainte fondamentale**: L'application doit fonctionner en ouvrant directement index.html

**Implications**:
- ❌ Pas de fetch() pour fichiers locaux (CORS)
- ✅ <script src="..."> pour charger modules
- ✅ Données dans fichiers .js (pas .json)
- ✅ Tout en static

### 3. Architecture pure browser
```
PRODUCTION (navigateur):
├── HTML     → Structure
├── CSS      → Présentation  
└── JS pur   → Logique

DÉVELOPPEMENT (Node.js):
├── Tests    → Validation
└── Scripts  → Génération données
```

**Séparation stricte**: Code Node.js JAMAIS dans js/

## Setup développement

### Prérequis
```bash
# Pour tests seulement
node --version   # v16+ recommandé
python3 --version # v3.8+ recommandé
```

### Installation
```bash
git clone [repo]
cd thermaflow
# Aucune installation! Prêt à utiliser.
```

### Tests
```bash
# Exécuter tests (Node.js)
node tests/test_phase1_hydraulics.js
node tests/test_phase1_heat_transfer.js
node tests/test_phase1_materials.js

# Démonstration
node examples/solver_demo.js
```

### Ouvrir l'application
```bash
# Simplement double-cliquer sur:
index.html   # (quand créé en Phase 3)

# Ou depuis terminal:
open index.html      # macOS
start index.html     # Windows
xdg-open index.html  # Linux
```

## Structure des fichiers

```
thermaflow/
├── index.html                    # Point d'entrée (Phase 3)
│
├── css/                          # Styles (Phase 3)
│   ├── main.css
│   ├── layout.css
│   └── components.css
│
├── js/                           # Code navigateur
│   ├── solver/                   # ✅ Phase 1 COMPLÈTE
│   │   ├── water-properties.js
│   │   ├── air-properties.js
│   │   ├── reynolds.js
│   │   ├── friction-factor.js
│   │   ├── pressure-drop.js
│   │   ├── nusselt-internal.js
│   │   ├── nusselt-external.js
│   │   ├── radiation.js
│   │   ├── thermal-resistance.js
│   │   ├── heat-transfer.js
│   │   └── pipe-materials.js
│   │
│   ├── engine/                   # Phase 2 (prochaine)
│   │   ├── pipe-segment.js
│   │   ├── pipe-network.js
│   │   └── freeze-detector.js
│   │
│   └── ui/                       # Phase 3
│       ├── input-form.js
│       ├── charts.js
│       └── results.js
│
├── data/                         # Données statiques
│   ├── fluids/          # Tables propriétés fluides
│   ├── materials/       # Propriétés matériaux
│   ├── pipes/           # Rugosités conduites
│   │   └── roughness.js
│   └── pipespecs/
│       ├── copper.js
│       ├── steel.js
│       └── stainless_steel.js
│
├── tests/                        # Tests Node.js
│   ├── test_phase1_hydraulics.js
│   ├── test_phase1_heat_transfer.js
│   └── test_phase1_materials.js
│
├── scripts/                     # Scripts utilitaires
│   ├── generate_validation_sample.js
│   └── lib/
│       └── thermaflow-loader.js # Module partagé (Node.js)
│
├── validation/                  # Validation externe
│   ├── external_validation_sample_v1.0.json
│   ├── README.md
│   └── PRIORITY_TEST_LIST.md
│
├── docs/                         # Documentation technique
│   ├── implementation/
│   └── modules/
│
├── memory-bank/                  # Documentation Memory Bank
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md           # ← Ce fichier
│   ├── activeContext.md
│   └── progress.md
│
└── .cursor/rules/                # Configuration Cursor
    └── memory-bank.mdc
```

## Dépendances

### Production
**Aucune dépendance** ✅

### Développement
**Node.js** (tests seulement):
- Aucun package npm! Tests utilisent require() natif

## Environnements

### Développement
- **OS**: macOS, Linux, Windows
- **Éditeur**: Cursor, VS Code, ou n'importe quel éditeur texte
- **Browser**: Dev tools pour débogage

### Test
- **Node.js**: Exécution tests unitaires
- **Validation**: Comparaison avec sources scientifiques

### Production
- **Navigateur**: N'importe quel navigateur moderne
- **Aucun serveur**: file:// ou serveur static optionnel
- **Aucun build**: Fichiers sources = fichiers production

## Outils

### Tests
```bash
# Pattern test standard
node tests/test_*.js

# Sortie:
# ✓ Test description
# ✗ Test échoué (si applicable)
# Résumé: X/Y tests (Z%)
```

### Documentation
- **Memory Bank**: Markdown dans memory-bank/
- **Technique**: Markdown dans docs/
- **Code**: JSDoc dans les fichiers .js

## Patterns d'import/export

### Dans le navigateur (production)
```html
<!-- HTML -->
<script src="js/properties/water-properties.js"></script>
<script src="js/formulas/reynolds.js"></script>
<script>
  // Fonctions disponibles globalement
  const water = getWaterProperties(20, 1.0);
  const Re = calculateReynolds(...);
</script>
```

### Dans Node.js (tests)
```javascript
// Tests
const water = require('./js/properties/water-properties.js');
const reynolds = require('./js/formulas/reynolds.js');

const props = water.getWaterProperties(20, 1.0);
const Re = reynolds.calculateReynolds(...);
```

### Export conditionnel (dans modules)
```javascript
// À la fin du fichier
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fonction1,
    fonction2,
    CONSTANTE
  };
}
```

## Performance cibles

### Temps de calcul
- Interpolation: < 0.2 ms ✅
- Segment individuel: < 5 ms ✅
- Conduite complète (100 segments): < 1 s ✅

### Taille des fichiers
- HTML: < 50 KB
- CSS: < 30 KB
- JS total: < 200 KB
- Données: < 100 KB
- **Total**: < 400 KB (excellent pour app standalone)

### Chargement
- First paint: < 500 ms
- Interactive: < 1 s
- Calcul: < 1 s
- **Total**: < 2 s de l'ouverture au résultat

## Sécurité

### Données utilisateur
- **Stockage**: localStorage uniquement (navigateur local)
- **Transmission**: Aucune (pas de serveur)
- **Privacy**: 100% privé (tout reste dans le navigateur)

### Validation
- **Entrées**: Validation stricte côté client
- **Calculs**: Vérification plages physiques
- **Sorties**: Sanitization si export HTML

## Évolutivité

### Ajout de features
1. Nouveau module → déterminer niveau (properties/formulas/correlations/calculations/)
2. Tests → tests/test_nouveau.js
3. Documentation → memory-bank/ ou docs/
4. Aucune recompilation nécessaire

### Maintenance
- Pas de breaking changes (navigateur stable)
- Pas de dependencies à mettre à jour
- Code source = prod (pas de build)

## Plages supportées

### Débits
**Étendue**: 0.1 - 6000 m³/h (0.4 - 26400 USGPM)

**Applications**:
- 0.1 - 10 m³/h: Résidentiel, petits procédés
- 10 - 100 m³/h: Industriel léger, HVAC
- 100 - 6000 m³/h: Industriel lourd, refroidissement procédés

**Validation scientifique**:
- Équations valides jusqu'à Re = 5×10⁶ (Gnielinski)
- Warning automatique > 100 m³/h (vérifier V < 5 m/s)
- Scénario max DN600 @ 6000 m³/h: Re ≈ 3.5×10⁶ ✅

### Températures
- Eau: 1 - 100°C
- Air: -50 - 30°C

### Pressions
- 100 - 1000 kPag (14.5 - 145 psig)

### Longueurs
- 1 - 1000 m

## Limitations connues

### Navigateur file://
- ❌ fetch() bloqué par CORS
- ❌ Web Workers limités
- ❌ Service Workers non disponibles

**Solution**: Utiliser <script> tags, pas fetch()

### Performance JavaScript
- Calculs limités par single-thread
- Pas de WASM (volontairement simple)

**Solution**: Optimiser algorithmes, suffisant pour notre cas

### Compatibilité anciens navigateurs
- Pas de support IE11
- ES6 requis

**Solution**: Acceptable pour app moderne (2024+)

## Scripts et automatisation

### Module partagé (Node.js)

**Fichier**: `scripts/lib/thermaflow-loader.js`

**Objectif**: Code réutilisable pour scripts de validation/test

**Pattern**: Exports CommonJS (Node.js uniquement)
```javascript
// Charger le module
const loader = require('./scripts/lib/thermaflow-loader.js');

// Utiliser les fonctions
const modules = loader.loadThermaFlowModules(__dirname);
const specs = loader.loadPipeSpecsHelper(__dirname);
const config = loader.convertInputsToNetworkConfig(inputs, specs, modules);
```

**Séparation stricte**:
- ✅ `scripts/lib/` = Node.js pur (CommonJS, require, module.exports)
- ✅ `js/` = Browser pur (exports conditionnels pour tests uniquement)
- ❌ JAMAIS mélanger les deux

### Validation externe

**Processus automatisé**:
1. Génération échantillon: `node scripts/generate_validation_sample.js`
2. Saisie données externes: Modification manuelle JSON
3. Vérification: `node tests/automated_verification.js`
4. Rapport: Génération automatique avec section validation externe

**Fichiers**:
- `validation/external_validation_sample_v1.0.json` - 130 cas
- `validation/README.md` - Guide procédure validation

