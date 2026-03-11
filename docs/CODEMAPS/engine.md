<!-- Generated: 2026-03-11 | Files scanned: 17 engine/formula files | Token estimate: ~700 -->

# Engine Architecture

## Calculation Pipeline

```
Properties (lookup)
    ↓
Formulas (basic physics)
    ↓
Correlations (empirical)
    ↓
Calculations (composed)
    ↓
Engine (orchestration)
```

## Module Exports

### Constants

- `FlowRegimes` → RE_LAMINAR_MAX (2300), RE_TURBULENT_MIN (4000)
- `THRESHOLDS` → MARGE_SURETE_GEL (2.0)
- `MATERIAL_ROUGHNESS` → { steel: 0.045e-3, copper: 0.0015e-3, ... }

### Properties (table lookup + interpolation)

- `WaterProperties.getWaterProperties(T_C, P_bar)` → { rho, mu, k, cp, Pr }
- `AirProperties.getAirProperties(T_C)` → { rho, mu, k, cp, Pr }
- `MaterialProperties.getMaterialProperties(name)` → { k, ... }

### Formulas

- `Reynolds.getReynoldsNumber(rho, v, D, mu)` → Re
- `Geometry.crossSectionalArea(D)` → A_cross
- `PressureDropBasic.pressureDropDarcy(f, L, D, rho, v)` → dP

### Correlations

- `FrictionFactor.frictionFactorTurbulent(Re, eps_D)` → f (Colebrook-White)
- `NusseltInternal.nusseltGnielinski(Re, Pr, f, D, L)` → Nu
- `NusseltExternal.nusseltChurchillBernstein(Re, Pr)` → Nu
- `Radiation.radiativeHeatTransfer(T_surf, T_amb, eps, A)` → Q_rad

### Calculations (composed)

- `ThermalResistance.totalThermalResistance(...)` → R_total
- `PressureDrop.pressureDropOverSegment(...)` → dP
- `HeatTransfer.heatLossSegment(...)` → { Q_loss, T_out }

### Engine

- `PipeSegment.calculateSegment(config, T_in, P_in)` → SegmentResult
- `PipeNetwork.calculatePipeNetwork(config)` → NetworkResult
- `FreezeDetector.assessFreezeRisk(networkResult, config)` → FreezeAssessment

## Segment Iteration

```
For each segment i (1..N):
  1. Get water/air properties at T_in[i], P[i]
  2. Compute Re → select correlation (laminar/transition/turbulent)
  3. Compute f (friction) → dP (pressure drop)
  4. Compute Nu_int, Nu_ext, h_rad → R_total
  5. Compute Q_loss → T_out[i] = T_in[i+1]
  6. Check T_out <= 0 → freeze flag
```

## Sensitivity Analysis (Worker)

```
Main thread → postMessage(config, paramX, paramY, steps)
Worker      → for each (x,y) in grid: calculatePipeNetwork(modified_config)
Worker      → postMessage(matrix[x][y] = minTemp)
Main thread → SensitivityHeatmapRenderer.render(matrix)
```
