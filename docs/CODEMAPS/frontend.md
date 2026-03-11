<!-- Generated: 2026-03-11 | Files scanned: 21 UI + 11 CSS | Token estimate: ~800 -->

# Frontend Architecture

## UI Module Map (js/ui/)

### Orchestration

- `app.js` (405 LOC) — Entry point, module wiring, event binding

### Input

- `input-form.js` (497) — Form rendering, SVG foreignObject inputs
- `input-validation.js` (292) — validateForm(), field rules
- `input-units.js` (256) — SI/imperial unit switching, localStorage persistence
- `pipe-diagram.js` (751) — SVG pipe diagram with integrated inputs

### Display

- `verdict-renderer.js` (443) — Risk card with CSS status icons
- `temperature-chart.js` (364) — Canvas temperature profile
- `calculation-details.js` (414) — Detail panel (first segment + summary)
- `calc-detail-templates.js` (687) — HTML templates for calculation steps
- `disclaimer.js` (232) — Modal with safe DOM construction

### Sensitivity Analysis

- `sensitivity-analysis.js` (498) — 1D+2D orchestration, worker coordination
- `sensitivity-analysis-1d.js` (787) — Individual parameter tornado charts
- `sensitivity-matrix.js` (387) — 2D grid calculation
- `sensitivity-heatmap-renderer.js` (315) — Canvas heatmap rendering
- `sensitivity-params.js` (134) — Shared PARAMETER_DEFINITIONS

### Infrastructure

- `utils.js` (200) — debounce, escHtml, formatNumber, showBanner
- `i18n.js` (198) — Language switching, key lookup (supports string + array values)
- `unit-converter.js` (268) — Temperature, pressure, flow, length conversions
- `calculation-manager.js` (298) — Priority queue (LOW/HIGH/IMMEDIATE)
- `storage.js` (79) — localStorage save/load
- `export.js` (102) — PDF export via html2pdf

## CSS Structure

```
css/main.css         — Variables, resets, typography
css/layout.css       — Grid, containers, flexbox
css/components.css   — Entry point (@import)
css/components/
├── buttons.css      — .btn, .btn--primary, .btn--secondary
├── cards.css        — .card, .card__title
├── forms.css        — Input fields, selects
├── header.css       — Navigation, language selector
├── results.css      — Results grid, .status-icon--*
├── sensitivity.css  — Heatmap, tornado, controls
├── calc-details.css — Collapsible detail panels
├── validation.css   — Error messages
├── disclaimer.css   — Modal overlay
└── config-summary.css — Config summary table
```

## Event Flow

```
input change → debounce(300ms) → CalculationManager.request(LOW)
input blur   → cancel debounce → CalculationManager.request(HIGH)
Enter key    → cancel debounce → CalculationManager.request(IMMEDIATE)
lang change  → I18n.setLanguage() → applyTranslations() → re-render
```

## i18n

4 languages: FR, EN, ES, PT (~507 keys each)

- `I18n.t('key')` → string
- `I18n.t('disclaimer.paragraphs')` → array (structured DOM content)
- `data-i18n` attributes → auto-translated by `applyTranslations()`
