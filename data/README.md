# data/ - Tables de données pures

Ce dossier contient **uniquement des tables de données** - aucune logique de calcul.

## Structure

```
data/
├── fluids/          # Propriétés thermophysiques des fluides
│   ├── air-tables.js    # Air: ρ, μ, k, cp, Pr (-40 à 50°C)
│   └── water-tables.js  # Eau: ρ, μ, k, cp (0-100°C, 1-10 bar)
│
├── materials/       # Propriétés des matériaux
│   └── properties.js    # Métaux, isolants, plastiques (k, ρ, cp, ε)
│
├── pipes/           # Données de rugosité
│   └── roughness.js     # Rugosités absolues par matériau
│
└── pipespecs/       # Dimensions standard de conduites
    ├── steel.js
    ├── copper.js
    ├── stainless_steel.js
    └── loader.js
```

## Principe

Les fichiers dans `data/` sont des **tables statiques pures**:
- ✅ Aucune fonction de calcul
- ✅ Données figées (Object.freeze)
- ✅ Validation croisée avec sources scientifiques
- ✅ Références documentées

## Sources

- **Fluides**: IAPWS-97 (eau), Perry's Handbook + ASHRAE (air)
- **Matériaux**: Perry's Table 2-314, ASHRAE Fundamentals
- **Rugosités**: Perry's Table 6-7, Diagramme de Moody

## Usage

Ces tables sont accédées via les modules dans `js/properties/` qui fournissent
des fonctions d'interpolation et de lookup.

Voir: `js/properties/README.md`

---

## Matériaux d'isolation disponibles

Les matériaux d'isolation suivants sont validés scientifiquement (voir `docs/references/INSULATION_PROPERTIES_VALIDATION.md`):

| ID technique | Nom français | k [W/(m·K)] | Densité [kg/m³] | Application |
|--------------|--------------|-------------|-----------------|-------------|
| `fiberglass` | Laine de verre | 0.040 | 32 | Standard, bon isolant |
| `mineral_wool` | Laine de roche | 0.038 | 100 | Excellent isolant, haute densité |
| `polyurethane_foam` | Mousse polyuréthane | 0.026 | 40 | Meilleur isolant (cellules fermées) |
| `polystyrene_extruded` | Polystyrène extrudé (XPS) | 0.029 | 35 | Très bon (cellules fermées) |
| `elastomeric_foam` | Mousse élastomère | 0.040 | 70 | Flexible (type Armaflex) |

**Références de validation**: 
- Perry's Handbook Table 5-17
- ASHRAE Fundamentals Chapter 26
- Incropera & DeWitt Appendix A
- fluids.readthedocs.io

**Note importante**: Les valeurs correspondent à des isolants **secs** à température ambiante (20-25°C). L'humidité peut réduire drastiquement la performance (facteur 2-3× sur k).

