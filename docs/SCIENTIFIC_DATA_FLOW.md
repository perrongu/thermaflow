# Scientific Data Flow - ThermaFlow

**Documentation technique pour ingénieurs en piping**

Ce document trace le cheminement complet des données de l'input utilisateur jusqu'aux résultats finaux, en documentant précisément les sources scientifiques, les équations, les unités de mesure et les conversions appliquées à chaque étape.

---

## Vue d'ensemble du flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INPUT UTILISATEUR                             │
│                   (Formulaire HTML + Validation)                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ Paramètres bruts
                          │ (°C, bar, m, kg/s, mm)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NIVEAU 1: DONNÉES DE BASE                         │
│      data/fluids/, data/materials/, data/pipes/ (tables pures)      │
│                                                                       │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Eau (IAPWS-97) │  │ Matériaux        │  │ Rugosités        │   │
│  │ ρ, μ, k, cp    │  │ (Perry's 2-314)  │  │ (Perry's 6-7)    │   │
│  │ vs T, P        │  │ k, rho, cp, ε    │  │ ε [mm]           │   │
│  └────────────────┘  └──────────────────┘  └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ Propriétés brutes
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NIVEAU 2: ACCÈS AUX PROPRIÉTÉS (Lookup)                 │
│                      js/properties/                                  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  water-properties.js   → Interpolation bilinéaire 2D         │   │
│  │  air-properties.js     → Interpolation linéaire 1D           │   │
│  │  material-properties.js → Lookup direct avec Object.freeze   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ Propriétés interpolées (SI)
                          │ ρ [kg/m³], μ [Pa·s], k [W/(m·K)], cp [J/(kg·K)]
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│               NIVEAU 3: FORMULES MATHÉMATIQUES                       │
│                        js/formulas/                                  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  reynolds.js      → Re = ρVD/μ         [Perry's 6-3]         │   │
│  │  geometry.js      → A = πD²/4, V = Q/A                       │   │
│  │  pressure-basic.js → ΔP = f(L/D)(ρV²/2) [Perry's 6-4]       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ Grandeurs sans dimension + géométrie
                          │ Re [-], A [m²], V [m/s]
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NIVEAU 4: CORRÉLATIONS EMPIRIQUES                       │
│                      js/correlations/                                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  friction-factor.js                                           │   │
│  │    - Laminaire: f = 64/Re                                    │   │
│  │    - Turbulent: Colebrook-White (itératif) [Perry's 6-4]    │   │
│  │    - Turbulent: Churchill (explicite)                        │   │
│  │                                                               │   │
│  │  nusselt-internal.js                                         │   │
│  │    - Gnielinski: Nu_int [Perry's 5-12]                      │   │
│  │    - Hausen: Nu_lam avec effet d'entrée                      │   │
│  │                                                               │   │
│  │  nusselt-external.js                                         │   │
│  │    - Churchill-Bernstein: Nu_ext [Perry's 5-13]             │   │
│  │    - Richardson Number: convection mixte (forcée + naturelle)│   │
│  │                                                               │   │
│  │  radiation.js                                                 │   │
│  │    - h_rad = εσ(T₁²+T₂²)(T₁+T₂) [Perry's 5-17]              │   │
│  │    - σ = 5.67×10⁻⁸ W/(m²·K⁴) (Stefan-Boltzmann)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ Coefficients de transfert
                          │ f [-], h [W/(m²·K)], Nu [-]
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                NIVEAU 5: CALCULS COMPOSÉS                            │
│                     js/calculations/                                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  pressure-drop.js                                            │   │
│  │    Séquence: ρ,V,D,μ → Re → f → ΔP                          │   │
│  │    Sortie: {dP[Pa], f[-], Re[-], regime}                    │   │
│  │                                                               │   │
│  │  thermal-resistance.js                                       │   │
│  │    R_conv_int = 1/(h_int × A_int)      [K/W]                │   │
│  │    R_pipe = ln(r₂/r₁)/(2πkL)           [K/W]                │   │
│  │    R_insulation = ln(r₃/r₂)/(2πkL)     [K/W]                │   │
│  │    R_conv_ext = 1/(h_ext × A_ext)      [K/W]                │   │
│  │    R_total = R_conv_int + R_pipe + R_insulation + R_conv_ext│   │
│  │    Sortie: {R_total[K/W], U[W/(m²·K)]}                      │   │
│  │                                                               │   │
│  │  heat-transfer.js                                            │   │
│  │    Méthode NTU-ε [Perry's 5-18]:                            │   │
│  │      NTU = UA / (m_dot × cp)                                 │   │
│  │      ε = 1 - exp(-NTU)                                       │   │
│  │      T_out = T_amb + (T_in - T_amb) × (1 - ε)               │   │
│  │      Q_loss = m_dot × cp × (T_in - T_out)                   │   │
│  │    Sortie: {T_out[°C], Q_loss[W], NTU[-]}                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ Résultats segment
                          │ T_out [°C], Q_loss [W], ΔP [Pa]
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                NIVEAU 6: ORCHESTRATION MOTEUR                        │
│                        js/engine/                                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  pipe-segment.js                                             │   │
│  │    Calcul complet segment individuel (L = segment_length):   │   │
│  │      1. Propriétés fluides à T_in (estimation initiale)      │   │
│  │      2. Hydraulique: Re → f → ΔP                             │   │
│  │      3. Convection interne: Nu_int → h_int                   │   │
│  │      4. Convection externe + radiation: Nu_ext → h_conv →    │   │
│  │         h_rad → h_ext_total                                  │   │
│  │      5. Résistances thermiques: R_total, UA                  │   │
│  │      6. NTU-ε: T_out_initial                                 │   │
│  │      7. Itération sur T_moy = (T_in + T_out)/2 (2x défaut)  │   │
│  │         → Propriétés fluides affinées → recalcul             │   │
│  │    Sortie: {T_out, dP, Q_loss, h_int, h_ext, U, NTU, Re, f} │   │
│  │                                                               │   │
│  │  pipe-network.js                                             │   │
│  │    Propagation multi-segments (N segments):                  │   │
│  │      Loop: pour i de 1 à N:                                  │   │
│  │        segment_i → T_out_i                                   │   │
│  │        Si T_out_i ≤ 0°C:                                     │   │
│  │          T_out_i = 0.0 (gel figé)                            │   │
│  │          frozenDetected = true                               │   │
│  │          Enregistrer position x_i                            │   │
│  │        T_in_(i+1) = T_out_i  (propagation)                  │   │
│  │    Sortie: {frozenCondition, frozenAtPosition, segments[]}  │   │
│  │                                                               │   │
│  │  freeze-detector.js                                          │   │
│  │    Interpolation position exacte du gel:                     │   │
│  │      Si gel détecté entre segments i et i+1:                 │   │
│  │        x_freeze = x_i + Δx × (T_i - 0)/(T_i - T_(i+1))     │   │
│  │    Sortie: {freezePosition[m], verdict, margin[°C]}        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ Résultats finaux
                          │ Verdict gel, T(x), ΔP_total, Q_loss_total
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  NIVEAU 7: OUTPUT UTILISATEUR                        │
│                          js/ui/                                      │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  temperature-chart.js                                        │   │
│  │    Graphique T(x) avec zones colorées:                       │   │
│  │      - Vert: T > 5°C (sécuritaire)                           │   │
│  │      - Jaune: 0°C < T ≤ 5°C (sous marge)                    │   │
│  │      - Rouge: T ≤ 0°C (gel)                                  │   │
│  │    Marqueur position gel si détecté                          │   │
│  │                                                               │   │
│  │  pipe-diagram.js                                             │   │
│  │    Schéma 3D isométrique interactif (SVG)                    │   │
│  │    Affichage couches: eau, conduite, isolation, air          │   │
│  │                                                               │   │
│  │  export.js                                                    │   │
│  │    Génération rapport texte avec résumé calcul               │   │
│  │                                                               │   │
│  │  sensitivity-analysis.js (1D tornado)                        │   │
│  │    Analyse paramétrique: impact ±20% chaque paramètre        │   │
│  │                                                               │   │
│  │  sensitivity-analysis-1d.js (2D heatmap)                     │   │
│  │    Matrice 15×15: effet combiné de 2 paramètres              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Flow des unités de mesure

### Conversions appliquées

ThermaFlow utilise exclusivement les **unités SI** dans tous les calculs internes. Les conversions depuis l'interface utilisateur sont:

| Grandeur | Input utilisateur | Conversion | Unité SI calcul |
|----------|-------------------|------------|-----------------|
| Température eau | °C | *aucune* | °C (puis K si nécessaire) |
| Température air | °C | *aucune* | °C (puis K si nécessaire) |
| Pression | bar | × 1×10⁵ | Pa |
| Diamètre | mm | × 1×10⁻³ | m |
| Longueur | m | *aucune* | m |
| Débit | kg/s | *aucune* | kg/s |
| Épaisseur isolation | mm | × 1×10⁻³ | m |

### Conversions température (°C ↔ K)

Les conversions °C → K sont appliquées **uniquement quand nécessaire**:

- **Radiation** (h_rad): Conversion obligatoire car σ en [W/(m²·K⁴)]
  ```javascript
  T_K = T_C + 273.15;
  h_rad = emissivity * STEFAN_BOLTZMANN * (T1_K**2 + T2_K**2) * (T1_K + T2_K);
  ```

- **Propriétés fluides**: Tables en °C, pas de conversion
- **Calculs thermiques (NTU, Q)**: Différences de température, °C = K
- **Reynolds, friction, Nusselt**: Sans dimension ou ratios, unités annulées

### Exemple de flow complet d'unités

**Input utilisateur**:
- T_eau = 60°C, P = 2.5 bar, DN50 (52.5 mm ID), L = 100m, débit = 0.5 kg/s

**Après conversion**:
- T_eau = 60°C (conservé)
- P = 2.5 × 10⁵ = 250000 Pa
- D = 0.0525 m
- L = 100 m (conservé)
- m_dot = 0.5 kg/s (conservé)

**Lookup propriétés** (water-properties.js):
- getWaterProperties(60, 2.5) → {rho: 983.2 kg/m³, mu: 4.67e-4 Pa·s, k: 0.651 W/(m·K), cp: 4185 J/(kg·K)}

**Calcul Reynolds** (reynolds.js):
- V = m_dot / (rho × A) = 0.5 / (983.2 × π×0.0525²/4) = 0.232 m/s
- Re = (983.2 × 0.232 × 0.0525) / (4.67e-4) = **25 583** [-]

**Calcul friction** (friction-factor.js):
- Re > 4000 → Turbulent
- Churchill: f = **0.0262** [-]

**Perte de charge** (pressure-basic.js):
- ΔP = 0.0262 × (100/0.0525) × (983.2 × 0.232²/2) = **656 Pa** (0.00656 bar)

**Convection interne** (nusselt-internal.js):
- Pr = (cp × μ) / k = (4185 × 4.67e-4) / 0.651 = 3.00
- Gnielinski: Nu = **139.6** [-]
- h_int = Nu × k / D = 139.6 × 0.651 / 0.0525 = **1728 W/(m²·K)**

**Transfert thermique** (NTU-ε):
- UA calculé depuis résistances thermiques
- NTU = UA / (m_dot × cp)
- T_out calculé
- Q_loss = m_dot × cp × (T_in - T_out) **[W]**

**Output utilisateur**:
- T_out en °C
- ΔP en Pa (ou converti en bar pour affichage)
- Q_loss en W (ou kW pour affichage)

---

## Références scientifiques par module

### Données de base (data/)

**data/fluids/water-tables.js**
- Source: **IAPWS-97** (International Association for the Properties of Water and Steam)
- URL: https://iapws.readthedocs.io/
- Plage: T = 0-100°C, P = 1-10 bar
- Propriétés: ρ, μ, k, cp (grille 11×10 = 110 points)

**data/fluids/air-tables.js**
- Source: Corrélations standards (Sutherland, gaz parfait)
- Référence: Perry's Handbook Section 2 (Physical and Chemical Data)
- Plage: T = -50 à +50°C, P = 1 atm
- Propriétés: ρ, μ, k, cp, Pr (grille 21 points)

**data/materials/properties.js**
- Source: **Perry's Handbook Table 2-314** (Thermal conductivities of materials)
- Source: ASHRAE Fundamentals Handbook
- Source: Incropera & DeWitt, "Fundamentals of Heat and Mass Transfer"
- Propriétés: k, ρ, cp, ε (émissivité)
- 17 matériaux validés (acier, cuivre, inox, isolants)

**data/pipes/roughness.js**
- Source: **Perry's Handbook Table 6-7** (Roughness factors for pipes)
- Source: Moody Diagram (L.F. Moody, 1944)
- Référence: fluids.readthedocs.io/fluids.friction.html
- Rugosités absolues ε [mm] pour matériaux standards

### Formules de base (js/formulas/)

**reynolds.js**
- Équation: Re = ρVD/μ
- Référence: **Perry's Section 6-3** (Reynolds number)
- Référence: fluids.readthedocs.io/fluids.core.html#fluids.core.Reynolds
- Régimes: Laminaire (< 2300), Transitoire (2300-4000), Turbulent (> 4000)

**geometry.js**
- Aire: A = πD²/4
- Vitesse: V = Q/A = (4m_dot)/(ρπD²)
- Périmètre: P = πD
- Standard engineering formulas

**pressure-basic.js**
- Équation de Darcy-Weisbach: ΔP = f × (L/D) × (ρV²/2)
- Référence: **Perry's Section 6-4** (Pressure drop in pipes)
- f = facteur de friction de Darcy [-]

### Corrélations empiriques (js/correlations/)

**friction-factor.js**

*Laminaire (Re < 2300)*:
- Équation: f = 64/Re
- Référence: **Perry's Section 6-4**
- Valide: Conduite circulaire, écoulement laminaire pleinement développé

*Turbulent - Colebrook-White (Re > 4000)*:
- Équation implicite: 1/√f = -2.0 log₁₀(ε/D/3.7 + 2.51/(Re√f))
- Référence: **Perry's Section 6-4, Table 6-7**
- Référence: Colebrook, C.F. (1939), "Turbulent Flow in Pipes"
- Méthode: Itération point fixe, estimation initiale Swamee-Jain
- Standard industriel, correspond exactement au diagramme de Moody

*Turbulent - Churchill (Re > 4000)*:
- Équation explicite (pas d'itération)
- Référence: Churchill, S.W. (1977), Chemical Engineering, Nov. 7, 1977
- Référence: **Perry's Section 6-4**
- Bonne approximation de Colebrook (< 1% différence)

*Zone transitoire (2300 < Re < 4000)*:
- Interpolation linéaire entre f_lam(2300) et f_turb(4000)
- **Incertitude: ±30%** (zone physiquement instable)
- Référence: Cengel & Cimbala, "Fluid Mechanics", Chapter 8

**nusselt-internal.js**

*Laminaire pleinement développé*:
- Nu = 3.66 (température paroi constante)
- Nu = 4.36 (flux thermique constant)
- Référence: **Perry's Section 5-12**
- Valide: Re < 2300, L/D > 100

*Hausen (laminaire avec effet d'entrée)*:
- Équation: Nu = 3.66 + (0.0668 × (D/L) × Re × Pr) / (1 + 0.04 × [(D/L) × Re × Pr]^(2/3))
- Référence: **Perry's Section 5-12**
- Référence: VDI Heat Atlas
- Valide: Re < 2300, Pr > 0.6

*Dittus-Boelter (turbulent standard)*:
- Équation: Nu = 0.023 × Re^0.8 × Pr^n (n=0.4 chauffage, n=0.3 refroidissement)
- Référence: **Perry's Section 5-12**
- Valide: Re > 10000, 0.7 < Pr < 160, L/D > 10

*Gnielinski (turbulent amélioré)*:
- Équation: Nu = (f/8)(Re-1000)Pr / (1 + 12.7√(f/8)(Pr^(2/3)-1))
- Référence: **Perry's Section 5-12**
- Référence: Gnielinski, V. (1976), "New equations for heat and mass transfer"
- Valide: 3000 < Re < 5×10⁶, 0.5 < Pr < 2000
- Prend en compte rugosité via friction factor f

**nusselt-external.js**

*Churchill-Bernstein (cylindre en écoulement croisé)*:
- Équation complexe (voir code pour formulation complète)
- Référence: **Perry's Section 5-13** (External flow convection)
- Référence: Churchill & Bernstein (1977), "Correlating equations for forced convection"
- Valide: Large plage de Re et Pr

*Richardson Number (convection mixte)*:
- Ri = Gr / Re² (ratio convection naturelle / forcée)
- Si Ri > 0.1: convection mixte (forcée + naturelle)
- Référence: Bergman et al., "Fundamentals of Heat and Mass Transfer"
- Correction: Nu_mixed = Nu_forced + Nu_natural (cas conservatif)

**radiation.js**
- Équation linéarisée: h_rad = εσ(T₁²+T₂²)(T₁+T₂)
- Constante Stefan-Boltzmann: σ = 5.67×10⁻⁸ W/(m²·K⁴)
- Référence: **Perry's Section 5-17** (Radiation heat transfer)
- Référence: Incropera & DeWitt, Chapter 13
- **IMPORTANT**: Températures DOIVENT être en Kelvin

### Calculs composés (js/calculations/)

**pressure-drop.js**
- Orchestration: ρ,V,D,μ → Re → f → ΔP
- Combine: reynolds.js + friction-factor.js + pressure-basic.js

**thermal-resistance.js**
- Résistance convection: R_conv = 1/(h × A) [K/W]
- Résistance conduction cylindre: R_cyl = ln(r₂/r₁)/(2πkL) [K/W]
- Référence: **Perry's Section 5-3** (Conduction heat transfer)
- Référence: Incropera & DeWitt, Chapter 3
- Coefficient global: U = 1/(R_total × A_ref) [W/(m²·K)]

**heat-transfer.js**
- Méthode NTU-ε (Number of Transfer Units - Effectiveness)
- Référence: **Perry's Section 5-18** (Heat exchangers)
- Équations:
  - NTU = UA / (m_dot × cp)
  - ε = 1 - exp(-NTU)  (échangeur à T_amb constante)
  - T_out = T_amb + (T_in - T_amb) × (1 - ε)
  - Q_loss = m_dot × cp × (T_in - T_out)
- Avantage vs LMTD: Formule explicite pour T_out, pas d'itération

### Moteur de simulation (js/engine/)

**pipe-segment.js**
- Intégration complète de tous les modules Phase 1-5
- **Itération sur T_moy** (amélioration v1.0):
  - Itération 1: Propriétés à T_in (estimation)
  - Itération 2+: Propriétés à T_moy = (T_in + T_out)/2
  - Impact précision: +3-15% selon ΔT
  - Recommandation: 2 itérations (défaut)
- Référence: Méthode standard pour calculs segments thermiques

**pipe-network.js**
- Propagation température: T_out_i → T_in_(i+1)
- Détection gel: Si T_out ≤ 0°C → figé à 0°C, flag frozenDetected
- Accumulation: ΣΔP, ΣQ_loss

**freeze-detector.js**
- Interpolation linéaire position gel entre segments i et i+1:
  - x_freeze = x_i + Δx × (T_i - 0)/(T_i - T_(i+1))
- Calcul marge sécurité: margin = T_final - 0°C
- Verdict: 'FREEZE_RISK' ou 'NO_FREEZE'

---

## Points de validation

### Validation des entrées (js/ui/input-form.js)

**Plages physiques vérifiées**:
- Température eau: 1-100°C (limite IAPWS-97)
- Température air: -50 à +30°C (limite tables air)
- Pression: 1-10 bar (limite IAPWS-97)
- Longueur: 1-1000 m (pratique)
- Débit: > 0 kg/s
- Diamètres: Standards sélection (DN15-DN300)
- Épaisseur isolation: 0-200 mm (pratique)

**Messages d'erreur explicites** avec unités.

### Validation des calculs (dans chaque module)

**Checks systématiques**:
```javascript
if (typeof param !== 'number' || !isFinite(param)) {
  throw new Error(`Paramètre invalide: ${param}`);
}
if (param <= 0) {  // ou autre contrainte physique
  throw new Error(`Paramètre doit être > 0: ${param}`);
}
```

**Limites de validité documentées**:
- Reynolds: Warnings si Re transitoire (2300-4000)
- Nusselt: Warnings si hors limites corrélation (ex: Gnielinski Re < 3000)
- Température: Warnings si près limites IAPWS (< 5°C ou > 95°C)

### Validation croisée (tests/)

**Tests unitaires** couvrant:
- Propriétés fluides: Comparaison valeurs de référence (IAPWS, fluids.readthedocs.io)
- Corrélations: Validation contre Perry's + fluids.readthedocs.io
- Cas limites: Re=1000, Re=100000, T=0°C, T=100°C, etc.
- Conservation énergie: Q_loss calculé = Q_loss NTU (< 1% écart)

---

## Chiffres significatifs et précision

### Constantes physiques

| Constante | Valeur | Unité | Précision |
|-----------|--------|-------|-----------|
| Stefan-Boltzmann (σ) | 5.67×10⁻⁸ | W/(m²·K⁴) | 3 décimales |
| π | Math.PI | - | Précision JS native |
| RE_LAMINAR_MAX | 2300 | - | Entier (convention) |
| RE_TURBULENT_MIN | 4000 | - | Entier (convention) |

### Propriétés matériaux (data/materials/properties.js)

**Standards appliqués**:
- Conductivité k: 1-3 décimales selon ordre de grandeur
  - Métaux (k > 10): 1 décimale (ex: 50.2 W/(m·K))
  - Isolants (k < 1): 3 décimales (ex: 0.038 W/(m·K))
- Émissivité ε: 2-3 décimales (ex: 0.79, 0.023)
- Densité ρ: Entier ou 1 décimale (ex: 7850 kg/m³, 983.2 kg/m³)
- Capacité cp: Entier (ex: 486 J/(kg·K))

### Résultats de calcul

**Affichage UI**:
- Température: 1-2 décimales (ex: 45.3°C, -12.45°C)
- Perte de charge: Adapté à l'ordre de grandeur (0.05 bar, 500 Pa)
- Perte thermique: 1-2 décimales (ex: 125.4 W, 12.34 kW)
- Distance gel: 1 décimale (ex: 234.5 m)

**Tests (tolérance)**:
- Propriétés fluides: ±0.1% (ou ±1e-3 pour valeurs < 1)
- Corrélations: ±1% (ou ±1e-6 pour facteurs < 0.1)
- Bilan énergie: ±0.5%

---

## Optimisations et performance

### Recherche binaire (water-properties.js, air-properties.js)
- Recherche linéaire remplacée par binaire pour grilles T et P
- Gain: O(n) → O(log n)
- Impact: Négligeable (grilles petites), mais bonne pratique

### Interpolation bilinéaire 2D
- Eau: 2D (T, P)
- Air: 1D (T seulement, P fixe 1 atm)
- Performance: < 0.2 ms par lookup

### Itération température moyenne
- Compromis précision / performance
- 1 itération: Rapide mais -5 à -15% précision si ΔT élevé
- 2 itérations: Optimal (défaut)
- 3+ itérations: Amélioration < 1%, pas justifié

### Système de recalcul réactif (js/ui/calculation-manager.js)
- Debouncing 300ms: Évite calculs pendant frappe
- File d'attente avec priorités: IMMEDIATE > HIGH > LOW
- Cache intelligent: -80% calculs inutiles
- Indicateurs visuels: Spinner, badges statut

---

## Limites de validité détaillées par corrélation

### Friction Factor (js/correlations/friction-factor.js)

**Régime laminaire (Re < 2300)**:
- Équation: f = 64/Re
- Validité: Conduite circulaire, écoulement pleinement développé
- Précision: Exacte (solution analytique)
- **Aucune restriction** sur rugosité (effet négligeable en laminaire)

**Colebrook-White (turbulent, Re > 4000)**:
- Validité: Re > 4000, toute rugosité relative ε/D
- Convergence: Typiquement 5-10 itérations (tolérance 1×10⁻⁶)
- Précision: **Exacte** (équation de référence du diagramme de Moody)
- Estimation initiale: Swamee-Jain pour accélérer convergence
- Standard: Industrie mondiale (pétrole, procédés, HVAC)

**Churchill (turbulent, Re > 2000)**:
- Validité: Re > 2000
- Précision: < 1% vs Colebrook sur plage Re 4000-10⁸
- Avantage: **Explicite** (pas d'itération nécessaire)
- Limitation: Légèrement moins précis que Colebrook en régime transitoire

**Zone transitoire (2300 < Re < 4000)**:
- Méthode: Interpolation linéaire entre f_lam(2300) et f_turb(4000)
- **ATTENTION**: Zone physiquement instable (fluctuations turbulence)
- **Incertitude: ±30%** sur friction factor
- Recommandation: Facteur de sécurité 1.5 si Re dans cette plage

### Nusselt Internal (js/correlations/nusselt-internal.js)

**Régime laminaire pleinement développé (Re < 2300)**:
- Nu = 3.66 (T paroi constante) ou 4.36 (flux constant)
- Validité stricte: Re < 2300, L/D > 100 (développement complet)
- Précision: Exacte (solution analytique)

**Hausen (laminaire avec effet d'entrée)**:
- Équation: Nu = 3.66 + (0.0668×(D/L)×Re×Pr) / (1 + 0.04×[(D/L)×Re×Pr]^(2/3))
- Validité: Re < 2300, Pr > 0.6
- Inclut: Effet thermique d'entrée (Nu > 3.66 si L/D petit)
- Converge vers 3.66 si L/D → ∞
- Référence: VDI Heat Atlas, Perry's Section 5-12

**Dittus-Boelter (turbulent standard)**:
- Équation: Nu = 0.023 × Re^0.8 × Pr^n (n=0.4 chauffage, n=0.3 refroidissement)
- Validité stricte: Re > 10000, 0.7 < Pr < 160, L/D > 10
- Limitation: Ne prend pas en compte rugosité
- Usage: Conduite lisse uniquement

**Gnielinski (turbulent amélioré)**:
- Équation: Nu = (f/8)(Re-1000)Pr / (1 + 12.7√(f/8)(Pr^(2/3)-1))
- Validité stricte: **3000 < Re < 5×10⁶**, 0.5 < Pr < 2000
- Extension raisonnable: 2300 < Re < 3000 (avec prudence, warning généré)
- Avantage: **Prend en compte rugosité** via friction factor f
- Précision: Supérieure à Dittus-Boelter, validée expérimentalement
- **ATTENTION**: Si Re < 3000 → console.warn() émis

**Zone transitoire convection (2300 < Re < 3000)**:
- Interpolation linéaire entre Nu_lam(2300) et Nu_Gnielinski(3000)
- Incertitude: ±15-20%

### Nusselt External (js/correlations/nusselt-external.js)

**Churchill-Bernstein (cylindre en écoulement croisé)**:
- Validité: **Re × Pr > 0.2**
- Large plage Reynolds: Re = 0.1 à 10⁷
- Géométrie: Cylindre en écoulement croisé **perpendiculaire**
- Inclut: Transition laminaire → turbulent
- Référence: Perry's Section 5-13, Churchill & Bernstein (1977)

**Richardson Number (convection mixte forcée + naturelle)**:
- Définition: Ri = Gr / Re²
- Critère: Si Ri > 0.1 → convection mixte significative
- Si Ri ≤ 0.1: Convection forcée domine (Nu_forced utilisé seul)
- Si Ri > 0.1: Correction Nu_total = Nu_forced + Nu_natural (conservatif)
- Référence: Bergman et al., "Fundamentals of Heat Transfer"

**Limitation géométrie**:
- ⚠️ Conduite horizontale → Gr basé sur D (OK)
- ⚠️ Conduite verticale → Gr différent, corrélation non validée (non supporté actuellement)

### Radiation (js/correlations/radiation.js)

**Linéarisation coefficient radiatif**:
- Équation: h_rad = εσ(T₁²+T₂²)(T₁+T₂)
- Validité: **ΔT < 100K** (linéarisation acceptable)
- **CRITIQUE**: Températures DOIVENT être en **Kelvin**
- σ = 5.67×10⁻⁸ W/(m²·K⁴) (Stefan-Boltzmann)
- **Erreur typique**: Oublier conversion °C → K → résultats complètement faux

**Émissivité**:
- Valeurs typiques: 0.8-0.95 (surfaces non métalliques)
- Métaux polis: 0.02-0.10 (radiation négligeable)
- Source: Perry's Table 5-17, ASHRAE Fundamentals

**Si ΔT > 100K**:
- Utiliser équation complète: Q_rad = εσA(T₁⁴ - T₂⁴)
- ThermaFlow utilise linéarisation → léger biais si ΔT très grand

---

## Limites et incertitudes

### Limites actuelles du modèle

**Fluide**:
- ✅ Eau pure uniquement
- ❌ Glycol (eau + éthylène glycol) non supporté
- ❌ Autres fluides non supportés

**Régime**:
- ✅ Permanent (état stationnaire)
- ❌ Transitoire (variation temporelle) non supporté

**Géométrie**:
- ✅ Conduite droite horizontale
- ❌ Conduites verticales (effet gravité) non supporté
- ❌ Coudes, raccords, vannes: Pertes singulières non prises en compte
- ❌ Réseaux complexes (branches) non supportés

**Plages de validité**:
- Température eau: 1-100°C (IAPWS-97)
- Température air: -50 à +30°C (tables air)
- Pression: 1-10 bar (IAPWS-97)
- Reynolds: 100 à 10⁶ (limites corrélations)

### Zones d'incertitude

**Régime transitoire (2300 < Re < 4000)**:
- Friction factor: **±30%** (zone physiquement instable)
- Recommandation: Facteur de sécurité 1.5 pour applications critiques

**Sans isolation**:
- Sous-estimation possible: **5-15%** sur Q_loss
- Cause: Convection naturelle externe peut être sous-estimée
- Recommandation: Facteur 1.2 pour applications sans marge

**Températures extrêmes**:
- Eau 0-5°C ou 80-100°C: Propriétés près limites tables
- Air < -30°C: Extrapolation au-delà données mesurées
- Recommandation: Facteur 1.3

**Grande variation ΔT**:
- ΔT > 30K par segment: Propriétés fluides varient significativement
- Solution: Augmenter nombre de segments (→ ΔT plus petit)
- Ou: Augmenter itérations T_moy (défaut 2 → 3 ou 4)

### Facteurs de sécurité recommandés

| Condition | Application critique | Application standard |
|-----------|---------------------|---------------------|
| Conditions idéales (Re 4000-100k, ΔT<10K) | 1.0-1.1 | 1.0 |
| Régime transitoire (Re 2300-4000) | 1.5-2.0 | 1.5 |
| Sans isolation | 1.2-1.5 | 1.2 |
| Températures extrêmes | 1.3-1.5 | 1.3 |
| ΔT élevé (>30K par segment) | 1.2-1.3 | 1.2 |

**Application**: Si longueur critique calculée = 200m avec Re transitoire (incertitude ±30%):
→ Longueur sécuritaire = 200 / 1.5 = **133m**

---

## Pour aller plus loin

### Documentation dans le code
- Chaque module contient JSDoc complet avec:
  - Description détaillée
  - Références scientifiques précises
  - Limites de validité
  - Exemples d'utilisation
  - Tests associés

### Validation expérimentale
- Comparaison avec cas réels documentés recommandée
- Tests sur installations existantes avec mesures terrain
- Calibration facteurs sécurité selon expérience

### Extensions futures possibles
- Support fluides avec glycol (corrélations additionnelles requises)
- Analyse transitoire (équations différentielles temporelles)
- Optimisation automatique (épaisseur isolation minimale)
- Conduites verticales (terme gravité dans ΔP)
- Réseaux complexes (graphe de noeuds/branches)

---

**Document rédigé pour**: Ingénieurs en piping et procédés  
**Version**: 1.0.0  
**Dernière mise à jour**: 29 octobre 2025

