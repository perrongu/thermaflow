# Références scientifiques - ThermaFlow

**Liste complète des sources utilisées dans le projet**

Toutes les équations, corrélations et données de ThermaFlow sont tirées de sources scientifiques reconnues. Ce document compile l'ensemble des références par module.

---

## Sources principales

### 1. Perry's Chemical Engineers' Handbook (9th Edition, 2016)

**Référence complète**: Perry, R.H., Green, D.W., Maloney, J.O. (2016). _Perry's Chemical Engineers' Handbook_, 9th Edition. McGraw-Hill.

**Sections utilisées**:

- **Section 2**: Physical and Chemical Data (propriétés matériaux)
- **Section 5**: Heat and Mass Transfer (transfert thermique)
- **Section 6**: Fluid and Particle Dynamics (hydraulique)

**Note**: Manuel de référence standard de l'industrie chimique, disponible via bibliothèques universitaires ou achat

### 2. IAPWS-97 (International Association for the Properties of Water and Steam)

**Référence**: Wagner, W., Kretzschmar, H.J. (2008). _International Steam Tables - Properties of Water and Steam based on the Industrial Formulation IAPWS-IF97_. Springer.

**Utilisation**: Propriétés thermodynamiques de l'eau pure

**Documentation**: https://iapws.readthedocs.io/

### 3. fluids.readthedocs.io

**Référence**: Bell, C. (2016-2024). _fluids: Fluid dynamics component of Chemical Engineering Design Library_. Open-source Python library.

**Utilisation**: Validation croisée des corrélations hydrauliques et thermiques

**Documentation**: https://fluids.readthedocs.io/

### 4. ASHRAE Fundamentals Handbook

**Référence**: ASHRAE (2021). _ASHRAE Handbook - Fundamentals_. American Society of Heating, Refrigerating and Air-Conditioning Engineers.

**Utilisation**: Propriétés thermiques matériaux isolants

### 5. Incropera & DeWitt - Fundamentals of Heat and Mass Transfer

**Référence**: Bergman, T.L., Lavine, A.S., Incropera, F.P., DeWitt, D.P. (2017). _Fundamentals of Heat and Mass Transfer_, 8th Edition. Wiley.

**Utilisation**: Corrélations convection, radiation

---

## Références par module

### data/ - Données de base

| Fichier                        | Donnée             | Source      | Section/Page       | Validation                |
| ------------------------------ | ------------------ | ----------- | ------------------ | ------------------------- |
| `data/fluids/water-tables.js`  | ρ, μ, k, cp eau    | IAPWS-97    | Tables régions 1-2 | fluids.readthedocs.io     |
| `data/fluids/air-tables.js`    | ρ, μ, k, cp air    | Perry's 9th | Section 2          | fluids.readthedocs.io     |
| `data/materials/properties.js` | k, ρ, cp matériaux | Perry's 9th | Table 2-314        | ASHRAE Fundamentals       |
| `data/materials/properties.js` | Émissivité ε       | Perry's 9th | Table 5-17         | Incropera & DeWitt Ch. 13 |
| `data/pipes/roughness.js`      | Rugosité absolue ε | Perry's 9th | Table 6-7          | Moody (1944)              |

### js/properties/ - Lookup et interpolation

| Fichier                  | Fonction                  | Méthode                     | Source              | Validation            |
| ------------------------ | ------------------------- | --------------------------- | ------------------- | --------------------- |
| `water-properties.js`    | `getWaterProperties()`    | Interpolation bilinéaire 2D | IAPWS-97            | fluids.readthedocs.io |
| `air-properties.js`      | `getAirProperties()`      | Interpolation linéaire 1D   | Perry's Section 2   | fluids.readthedocs.io |
| `material-properties.js` | `getMaterialProperties()` | Lookup direct               | Perry's Table 2-314 | -                     |

### js/formulas/ - Formules de base

| Fichier             | Équation           | Source      | Section/Page | Validation            |
| ------------------- | ------------------ | ----------- | ------------ | --------------------- |
| `reynolds.js`       | Re = ρVD/μ         | Perry's 9th | Section 6-3  | fluids.readthedocs.io |
| `geometry.js`       | A = πD²/4          | Standard    | -            | -                     |
| `geometry.js`       | V = Q/A            | Standard    | -            | -                     |
| `pressure-basic.js` | ΔP = f(L/D)(ρV²/2) | Perry's 9th | Section 6-4  | Darcy-Weisbach        |

### js/correlations/ - Corrélations empiriques

#### friction-factor.js

| Corrélation     | Équation                                 | Source           | Section/Page | Validité  | Validation    |
| --------------- | ---------------------------------------- | ---------------- | ------------ | --------- | ------------- |
| Laminaire       | f = 64/Re                                | Perry's 9th      | Section 6-4  | Re < 2300 | Analytique    |
| Colebrook-White | 1/√f = -2.0 log₁₀(ε/D/3.7 + 2.51/(Re√f)) | Perry's 9th      | Section 6-4  | Re > 4000 | Moody diagram |
| Churchill       | Formule explicite complexe               | Churchill (1977) | Perry's 6-4  | Re > 2000 | Colebrook     |

**Références additionnelles**:

- Colebrook, C.F. (1939). "Turbulent Flow in Pipes, with Particular Reference to the Transition Region Between the Smooth and Rough Pipe Laws". _Journal of the Institution of Civil Engineers_, 11(4), 133-156.
- Churchill, S.W. (1977). "Friction-Factor Equation Spans All Fluid-Flow Regimes". _Chemical Engineering_, Nov. 7, 1977, pp. 91-92.
- Moody, L.F. (1944). "Friction Factors for Pipe Flow". _Transactions of the ASME_, 66(8), 671-684.

#### nusselt-internal.js

| Corrélation        | Équation                                                | Source      | Section/Page | Validité                         | Validation            |
| ------------------ | ------------------------------------------------------- | ----------- | ------------ | -------------------------------- | --------------------- |
| Laminaire constant | Nu = 3.66 (T const)                                     | Perry's 9th | Section 5-12 | Re < 2300                        | Analytique            |
| Laminaire constant | Nu = 4.36 (q const)                                     | Perry's 9th | Section 5-12 | Re < 2300                        | Analytique            |
| Hausen             | Nu = 3.66 + (0.0668(D/L)RePr)/(1+0.04[(D/L)RePr]^(2/3)) | Perry's 9th | Section 5-12 | Re < 2300, Pr > 0.6              | VDI Heat Atlas        |
| Dittus-Boelter     | Nu = 0.023 Re^0.8 Pr^n                                  | Perry's 9th | Section 5-12 | Re > 10000, 0.7 < Pr < 160       | fluids.readthedocs.io |
| Gnielinski         | Nu = (f/8)(Re-1000)Pr / (1+12.7√(f/8)(Pr^(2/3)-1))      | Perry's 9th | Section 5-12 | 3000 < Re < 5e6, 0.5 < Pr < 2000 | fluids.readthedocs.io |

**Références additionnelles**:

- Gnielinski, V. (1976). "New Equations for Heat and Mass Transfer in Turbulent Pipe and Channel Flow". _International Chemical Engineering_, 16(2), 359-368.
- Dittus, F.W., Boelter, L.M.K. (1930). _University of California Publications in Engineering_, Vol. 2, p. 443. University of California Press.
- VDI Heat Atlas (2010). 2nd Edition, Springer.

#### nusselt-external.js

| Corrélation         | Équation         | Source         | Section/Page | Validité         | Validation            |
| ------------------- | ---------------- | -------------- | ------------ | ---------------- | --------------------- |
| Churchill-Bernstein | Formule complexe | Perry's 9th    | Section 5-13 | Re×Pr > 0.2      | fluids.readthedocs.io |
| Richardson Number   | Ri = Gr/Re²      | Bergman et al. | Ch. 9        | Convection mixte | -                     |

**Références additionnelles**:

- Churchill, S.W., Bernstein, M. (1977). "A Correlating Equation for Forced Convection from Gases and Liquids to a Circular Cylinder in Crossflow". _Journal of Heat Transfer_, 99(2), 300-306.

#### radiation.js

| Équation                   | Source      | Section/Page | Constantes              | Validation       |
| -------------------------- | ----------- | ------------ | ----------------------- | ---------------- |
| h_rad = εσ(T₁²+T₂²)(T₁+T₂) | Perry's 9th | Section 5-17 | σ = 5.67×10⁻⁸ W/(m²·K⁴) | Incropera Ch. 13 |

**Références additionnelles**:

- Stefan, J. (1879). "Über die Beziehung zwischen der Wärmestrahlung und der Temperatur". _Sitzungsberichte der mathematisch-naturwissenschaftlichen Classe der kaiserlichen Akademie der Wissenschaften_, 79, 391-428.
- Boltzmann, L. (1884). "Ableitung des Stefan'schen Gesetzes, betreffend die Abhängigkeit der Wärmestrahlung von der Temperatur aus der electromagnetischen Lichttheorie". _Annalen der Physik_, 258(6), 291-294.

### js/calculations/ - Calculs composés

| Fichier                 | Méthode              | Source      | Section/Page |
| ----------------------- | -------------------- | ----------- | ------------ |
| `pressure-drop.js`      | Séquence Re → f → ΔP | Perry's 9th | Section 6-4  |
| `thermal-resistance.js` | R = ln(r₂/r₁)/(2πkL) | Perry's 9th | Section 5-3  |
| `thermal-resistance.js` | R_conv = 1/(hA)      | Perry's 9th | Section 5-3  |
| `heat-transfer.js`      | Méthode NTU-ε        | Perry's 9th | Section 5-18 |

**Références additionnelles**:

- Incropera & DeWitt (2017), Chapter 3 (Conduction)
- Incropera & DeWitt (2017), Chapter 11 (Heat Exchangers)

### js/engine/ - Moteur de simulation

| Fichier              | Méthode                | Référence         | Notes             |
| -------------------- | ---------------------- | ----------------- | ----------------- |
| `pipe-segment.js`    | Itération T_moy        | Standard procédés | Amélioration v1.0 |
| `pipe-network.js`    | Propagation segments   | Standard          | -                 |
| `freeze-detector.js` | Interpolation linéaire | Standard          | -                 |

---

## Validation croisée

### Stratégie multi-sources

Pour chaque corrélation critique, **au moins 2 sources** ont été utilisées:

1. **Source primaire**: Perry's Handbook (référence industrie)
2. **Validation**: fluids.readthedocs.io OU publication scientifique originale

**Exemple - Gnielinski**:

- Perry's Section 5-12 (équation + limites)
- fluids.readthedocs.io/fluids.conv_internal.html (implémentation Python validée)
- Publication originale: Gnielinski (1976)

### Tests unitaires

**142 tests** couvrent:

- Propriétés fluides: IAPWS-97 vs fluids.readthedocs.io (< 0.1% écart)
- Friction factor: Moody diagram vs Colebrook-White (exacte)
- Nusselt: Perry's examples vs implémentation ThermaFlow (< 1% écart)
- Conservation énergie: Bilan thermique (< 0.5% écart)

**Exécuter les tests**:

```bash
node tests/test_phase1_hydraulics.js
node tests/test_phase1_heat_transfer.js
node tests/test_phase1_materials.js
node tests/test_pipe_segment.js
node tests/test_pipe_network.js
node tests/test_freeze_detector.js
```

---

## Limites de validité

Pour les **plages de validité détaillées** de chaque corrélation (Re, Pr, ΔT), voir:

➡️ **[SCIENTIFIC_DATA_FLOW.md - Section "Limites de validité détaillées par corrélation"](SCIENTIFIC_DATA_FLOW.md#limites-de-validité-détaillées-par-corrélation)**

---

## Documentation complémentaire

### Fichiers sources disponibles

| Document                        | Emplacement                                           | Description                 |
| ------------------------------- | ----------------------------------------------------- | --------------------------- |
| Validation propriétés isolation | `docs/references/INSULATION_PROPERTIES_VALIDATION.md` | Comparaison multi-sources   |
| README références               | `docs/references/README.md`                           | Guide d'utilisation sources |

### Accès en ligne

- **IAPWS**: https://iapws.readthedocs.io/
- **fluids library**: https://fluids.readthedocs.io/
- **ASHRAE**: https://www.ashrae.org/ (abonnement requis)

---

## Comment citer ThermaFlow

Si vous utilisez ThermaFlow dans un rapport d'ingénierie ou une publication:

```
Perron, G. (2025). ThermaFlow - Outil de simulation d'écoulement thermique en conduites.
Version 1.1.4. Disponible: https://github.com/perrongu/thermaflow
```

**Note importante**: ThermaFlow implémente des corrélations standards de l'industrie. Dans un rapport technique, **citez toujours les sources originales** (Perry's, IAPWS-97, etc.) et non ThermaFlow lui-même.

**Exemple de citation correcte dans un rapport**:

> "Le facteur de friction a été calculé avec la corrélation de Colebrook-White (Perry's Handbook Section 6-4) en utilisant le logiciel ThermaFlow v1.1.4."

---

**Document rédigé pour**: Ingénieurs en piping et procédés  
**Version**: 1.1.4  
**Dernière mise à jour**: 5 novembre 2025
