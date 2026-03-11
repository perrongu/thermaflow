# UI

Modules d'interface utilisateur pour interaction et visualisation.

## Structure

### Orchestration

- `app.js` — Point d'entrée principal, coordination des modules

### Composants d'entrée

- `input-form.js` — Formulaire de paramètres (SVG foreignObject inputs)
- `input-validation.js` — Validation des saisies utilisateur
- `input-units.js` — Gestion des unités SI/impériales avec persistance localStorage

### Visualisation

- `temperature-chart.js` — Graphique du profil de température
- `pipe-diagram.js` — Diagramme 3D animé de la conduite
- `verdict-renderer.js` — Carte verdict avec icônes CSS (safe/warning/danger/freeze)
- `calculation-details.js` — Section 3: calculs détaillés étape par étape
- `calc-detail-templates.js` — Templates HTML pour les détails de calcul
- `disclaimer.js` — Modal disclaimer avec construction DOM sécurisée

### Analyse de sensibilité

- `sensitivity-analysis.js` — Orchestration analyse de sensibilité (1D + 2D)
- `sensitivity-analysis-1d.js` — Analyse de sensibilité 1D (graphiques individuels)
- `sensitivity-matrix.js` — Analyse de sensibilité 2D (heatmap)
- `sensitivity-params.js` — Définitions partagées des paramètres (PARAMETER_DEFINITIONS)
- `sensitivity-heatmap-renderer.js` — Rendu canvas heatmap 2D

### Utilitaires

- `utils.js` — Fonctions utilitaires (debounce, escHtml, formatNumber)
- `calculation-manager.js` — Gestionnaire centralisé des recalculs avec file d'attente
- `storage.js` — Sauvegarde/chargement de scénarios
- `export.js` — Export des résultats (PDF)
- `unit-converter.js` — Conversions d'unités SI ↔ impériales
- `i18n.js` — Runtime d'internationalisation (FR/EN/ES/PT)

## Principes

- Vanilla JavaScript (IIFE + `window.ModuleName`)
- Pas d'innerHTML avec contenu utilisateur (XSS prevention)
- Icônes CSS au lieu d'emoji (rendu cross-platform fiable)
- Responsive design
- Accessibilité (ARIA labels, focus trap modal)
- Performance (debouncing, Web Workers pour sensibilité)

## Système de recalcul

### Architecture

Le système de recalcul utilise une architecture à 3 niveaux:

1. **UIUtils** (`utils.js`) - Fonctions de base
   - `debounce(func, delay)` - Retarde l'exécution après le dernier appel

2. **CalculationManager** (`calculation-manager.js`) - Orchestration
   - Gère la file d'attente des calculs
   - 3 niveaux de priorité: IMMEDIATE, HIGH, LOW
   - États: idle, pending, calculating, complete, error
   - Callbacks pour indicateurs visuels

3. **InputForm** (`input-form.js`) - Interface
   - Validation inline progressive
   - Debouncing sur événement `input` (300ms)
   - Recalcul immédiat sur `blur` et `Enter`
   - `triggerAnalysis()` comme point d'entrée recalcul

### Priorités

- **IMMEDIATE** (3): Bypass tout, exécute maintenant (Enter)
- **HIGH** (2): Cancel les requêtes LOW en attente (blur, change, toggle)
- **LOW** (1): Peut être remplacée par HIGH (input debounced)
