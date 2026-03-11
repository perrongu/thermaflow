<!-- Generated: 2026-03-11 | Files scanned: 65+ | Token estimate: ~900 -->

# ThermaFlow Architecture

Static HTML/CSS/JS app (no server, file:// protocol). IIFE + `window.ModuleName` exports.

## Module Hierarchy

```
Constants → Properties → Formulas → Correlations → Calculations → Engine → UI
```

## Data Flow

```
User Input (SVG foreignObject)
    ↓
InputForm.rebuildConfig()         → NetworkConfig object
    ↓
PipeNetwork.calculatePipeNetwork() → { T_profile, P_profile, segmentResults[] }
    ↓
FreezeDetector.assessFreezeRisk()  → { verdict, minTemp, safetyMargin }
    ↓
UI Render Phase:
├── VerdictRenderer.render()       → Risk card (CSS status icons)
├── TemperatureChart.draw()        → Canvas temperature profile
├── CalculationDetails.render()    → First segment breakdown
├── SensitivityAnalysis1D.render() → Tornado charts (sync)
└── SensitivityWorker → SensitivityHeatmapRenderer.render() (async Web Worker)
```

## Key Interfaces

```javascript
// Engine entry
PipeNetwork.calculatePipeNetwork(config) → result

// Config shape
{ geometry: { D_inner, D_outer, roughness, material },
  totalLength, numSegments,
  fluid: { T_in, P, m_dot },
  ambient: { T_amb, V_wind },
  insulation: { material?, thickness? } }

// UI trigger
InputForm.triggerAnalysis()
```

## File Counts

| Layer        | Files   | ~Lines      |
| ------------ | ------- | ----------- |
| Constants    | 4       | 160         |
| Properties   | 3       | 455         |
| Formulas     | 3       | 488         |
| Correlations | 4       | 1,238       |
| Calculations | 3       | 768         |
| Engine       | 3       | 1,072       |
| UI           | 21      | 6,500       |
| Data         | 9       | 3,500       |
| Workers      | 1       | 135         |
| Tests        | 39      | 10,000      |
| **Total**    | **~90** | **~24,300** |

## Key Decisions

- IIFE + window globals (file:// protocol, no bundler)
- Dual export: browser (`window.X`) + Node.js (`module.exports`)
- Debounced calculation queue (CalculationManager)
- Web Worker for 2D sensitivity (avoid UI blocking)
- CSS status icons (no emoji — cross-platform reliability)
- SRI on CDN resources (KaTeX)
- localStorage persistence + sessionStorage for disclaimer
