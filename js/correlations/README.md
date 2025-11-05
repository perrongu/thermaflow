# js/correlations/ - Corrélations empiriques

Équations **empiriques complexes** issues de la recherche expérimentale.

## Modules

### friction-factor.js

Facteur de friction selon régime.

- **Laminaire**: f = 64/Re
- **Turbulent**: Colebrook (itératif) ou Churchill (explicite)
- **Transition**: Interpolation avec warning ±30%

### nusselt-internal.js

Convection interne (écoulement dans conduite).

- **Laminaire**: Hausen (effet d'entrée), constante pleinement développé
- **Turbulent**: Gnielinski (3000 < Re < 5×10⁶), Dittus-Boelter

### nusselt-external.js

Convection externe (flux croisé sur cylindre).

- **Forcée**: Churchill-Bernstein, Hilpert
- **Naturelle**: Churchill & Chu (cylindre horizontal)
- **Mixte**: Superposition avec Richardson Number

### radiation.js

Rayonnement thermique.

- **Loi de Stefan-Boltzmann**: Q = εσA(T₁⁴ - T₂⁴)
- **Linéarisé**: h_rad = εσ(T₁+T₂)(T₁²+T₂²)
- **Combined**: h_total = h_conv + h_rad

## Caractéristiques

- ⚙️ **Complexité élevée** (équations non-linéaires, itérations)
- 📊 Données **expérimentales** (Moody, Perry's, VDI Heat Atlas)
- ⚠️ Plages de validité documentées
- ✅ Validation croisée multi-sources

## Pour les ingénieurs

Tu n'as **pas besoin de comprendre** le détail mathématique de ces corrélations.
Elles encapsulent des décennies de recherche expérimentale.

**Utilise-les** comme des boîtes noires fiables avec leurs plages de validité.

Pour orchestrer ces corrélations → voir `js/calculations/`
