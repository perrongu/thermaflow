# js/formulas/ - Formules mathématiques de base

Équations **fondamentales** de mécanique des fluides et thermique.

## Modules

### reynolds.js
Nombre de Reynolds et régimes d'écoulement.
```javascript
Re = ρVD/μ
const Re = calculateReynolds(rho, V, D, mu);
const regime = getFlowRegime(Re); // 'laminar', 'transitional', 'turbulent'
```

### geometry.js
Relations géométriques conduite circulaire.
```javascript
A = πD²/4
Q = VA
ṁ = ρQ
```

### pressure-basic.js
Équation de Darcy-Weisbach et pression dynamique.
```javascript
ΔP = f × (L/D) × (ρV²/2)
h_L = ΔP/(ρg)
P_dyn = ρV²/2
```

## Caractéristiques

- ✅ Formules **directes** (pas d'itération)
- ✅ Validation stricte des entrées
- ✅ Références Perry's Handbook
- ✅ 100% testées

## Pour les ingénieurs

Ces formules sont les **équations classiques** que tu reconnais.
Elles sont isolées ici pour faciliter la compréhension et les tests.

Pour des calculs plus complexes → voir `js/correlations/` et `js/calculations/`

