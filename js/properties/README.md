# js/properties/ - Accès aux tables de données

Fonctions de **lookup et interpolation** dans les tables de `data/`.

## Modules

### air-properties.js
Interpolation linéaire 1D dans les tables air.
```javascript
const props = getAirProperties(20); // T en °C
// → { rho, mu, k, cp, Pr }
```

### water-properties.js
Interpolation bilinéaire 2D dans les tables eau (IAPWS-97).
```javascript
const props = getWaterProperties(20, 1.0); // T[°C], P[bar]
// → { rho, mu, k, cp }
```

### material-properties.js
Lookup simple dans catalogue matériaux.
```javascript
const steel = getMaterialProperties('steel');
// → { name, k, rho, cp, emissivity, ... }
```

## Principe

- Séparation **données** (data/) vs **logique** (properties/)
- Interpolation efficace (< 0.2 ms)
- Validation stricte des plages
- Exports browser + Node.js

## Pour les ingénieurs

**Commence ici** pour récupérer les propriétés de fluides ou matériaux.
Ces fonctions font le pont entre les tables brutes et le code de calcul.

