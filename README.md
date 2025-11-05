# ❄️ ThermaFlow

**Analyse du risque de gel dans les conduites d'eau**

[![Version](https://img.shields.io/badge/version-1.1.2-blue.svg)](https://github.com/perrongu/thermaflow)
[![Licence](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)

> **Déterminez en quelques secondes si votre conduite d'eau risque de geler**

ThermaFlow calcule scientifiquement l'évolution de la température de l'eau le long d'une conduite exposée au froid et vous indique immédiatement:

✅ **PAS DE RISQUE DE GEL** - La conduite est protégée  
🔴 **RISQUE DE GEL** - Mesures de protection nécessaires

## 🎯 Pour qui?

- **Ingénieurs** - Dimensionnement d'installations
- **Techniciens** - Vérification systèmes existants
- **Gestionnaires** - Évaluation risques hivernaux
- **Étudiants** - Apprentissage transfert thermique

## ✨ Fonctionnalités

### Interface visuelle

- ⚖️ **Disclaimer légal**: Avertissement conditions d'utilisation (multilingue, accessible)
- 🎨 **Schéma 3D interactif**: Vue isométrique de la tuyauterie
- 📊 **Graphique T(x)**: Visualisation du profil de température
- 🔴 **Verdict immédiat**: Résultat clair et sans ambiguïté
- 📈 **Analyse de sensibilité**: Graphiques tornado (1D) + heatmap (2D)
- 📄 **Export rapport**: Sauvegarde des résultats
- 🌐 **Interface multilingue**: FR (par défaut), EN, ES, PT
- 🔄 **Unités flexibles**: Métrique (m³/h, kPag) ou Impérial (USGPM, psig)
- ♿ **Accessibilité**: Conforme WCAG 2.1, navigation clavier, focus trap

### Calculs scientifiques

- **Hydraulique**: Reynolds, friction (Colebrook), perte de charge
- **Thermique**: Convection, conduction, rayonnement
- **Matériaux**: Acier, cuivre, inox + isolants
- **Fluides**: Eau (IAPWS-97) et air (-50 à +30°C)

### Avantages

- ⚡ **Instantané**: Résultats en < 1 seconde
- 🌐 **Sans installation**: Fonctionne dans le navigateur
- 🔒 **100% local**: Aucune donnée envoyée en ligne
- 📖 **Scientifiquement validé**: Perry's Handbook, IAPWS-97
- ♿ **Accessible**: Navigation clavier, lecteurs d'écran, WCAG 2.1

## 🚀 Démarrage rapide

### En ligne

Visitez: **[https://perrongu.github.io/thermaflow](https://perrongu.github.io/thermaflow)**

### Local

1. Téléchargez le dépôt
2. Ouvrez `index.html` dans votre navigateur
3. Entrez les paramètres de votre installation
4. Obtenez le verdict instantanément

**Aucune installation requise** - Fonctionne directement dans le navigateur

### Changer la langue

- Sélecteur en haut à droite (initiales): `FR` `EN` `ES` `PT`
- La préférence est mémorisée. Le contenu dynamique (diagramme SVG, graphiques, sections repliables) se met à jour instantanément.

### Changer les unités

- Dropdowns dans le schéma **EAU**: m³/h ↔ USGPM (débit), kPag ↔ psig (pression)
- La conversion est automatique et maintient les conditions identiques
- Préférence mémorisée entre sessions
- Toutes les valeurs (résultats, graphiques, analyses, export PDF) utilisent l'unité sélectionnée

## 📖 Exemples d'utilisation

### Vérification conduite extérieure

**Situation**: Tuyau acier DN50, 50m exposé, eau 60°C, air -10°C  
**Question**: Va-t-elle geler?  
**Réponse**: ✅ PAS DE GEL (marge 59°C)

### Évaluation d'isolation

**Test**: Comparer avec/sans isolation 20mm  
**Résultat**: Économie de 93% sur pertes thermiques

### Dimensionnement installation

**Objectif**: Déterminer isolation minimale requise  
**Méthode**: Tester différentes épaisseurs jusqu'à sécurité

### Étude de sensibilité

**Analyse 1D (Tornado charts)**: Impact individuel de chaque paramètre

- Identification rapide des paramètres critiques
- Valeurs limites de gel et sécurité

**Analyse 2D (Heatmap)**: Effet combiné de deux paramètres

- Température air (-10 à -40°C)
- Débit d'eau (faible → élevé)
- Longueur exposée
- Type d'isolation

## 🔬 Validation scientifique

ThermaFlow est basé sur des standards industriels reconnus:

- **Perry's Chemical Engineers' Handbook** (9th Ed.) - Corrélations thermiques et hydrauliques
- **IAPWS-97** - Propriétés de l'eau (standard international)
- **PINT** - Conversions d'unités (compatibilité bibliothèque Python standard)
- **Suite de tests complète** - Validation de tous les modules de calcul (25/25 conversions, 14/14 fichiers tests)
- **Validation externe** - 130 cas comparés avec Aspen Hysys, AFT Fathom et DWSIM (excellent accord température ±1.5°C)
- **Conservation d'énergie** - Vérifiée sur tous les calculs

## 🏗️ Architecture du code

ThermaFlow est organisé par **niveaux de complexité** pour faciliter la compréhension par les ingénieurs de procédé:

```
data/                  # 📊 TABLES PURES - Données scientifiques
├── fluids/           # Propriétés air/eau (IAPWS-97, ASHRAE)
├── materials/        # Matériaux (Perry's Table 2-314)
└── pipes/            # Rugosités (Diagramme de Moody)

js/
├── constants/        # 🔢 CONSTANTES PARTAGÉES
│                     # (source unique de vérité, ex: RE_LAMINAR_MAX)
│
├── properties/       # 🔍 LOOKUP - Accès aux données
│                     # (interpolation, recherche dans tables)
│
├── formulas/         # 📐 FORMULES DE BASE
│                     # (Re = ρVD/μ, ΔP = fLD·ρV²/2)
│
├── correlations/     # 🔬 CORRÉLATIONS EMPIRIQUES
│                     # (Colebrook, Gnielinski, Churchill-Bernstein)
│
├── calculations/     # ⚙️ CALCULS COMPOSÉS
│                     # (assemblages multi-étapes)
│
├── engine/           # 🚀 ORCHESTRATION
│                     # (segment → network → détection gel)
│
└── ui/               # 🎨 INTERFACE
                      # (formulaire, graphiques, export)
```

**Cette structure est intentionnelle** - Elle permet aux ingénieurs de:

1. **Valider les données** (`data/`) - Tables scientifiques pures
2. **Identifier les constantes** (`constants/`) - Source unique de vérité
3. **Comprendre l'accès** (`properties/`) - Comment récupérer une valeur
4. **Reconnaître les équations** (`formulas/`) - Formules classiques
5. **Utiliser les corrélations** (`correlations/`) - "Boîtes noires" empiriques
6. **Voir l'assemblage** (`calculations/`) - Comment tout s'intègre

📖 **[Voir memory-bank/systemPatterns.md](memory-bank/systemPatterns.md)** pour l'organisation complète du code  
📖 **[Voir docs/SCIENTIFIC_DATA_FLOW.md](docs/SCIENTIFIC_DATA_FLOW.md)** pour le flow technique détaillé

## 📚 Documentation

### Pour utilisateurs

- **README.md** (ce fichier) - Guide d'utilisation complet
- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Historique des versions et modifications

### Pour développeurs/ingénieurs

- **JSDoc dans le code** - Documentation technique inline avec références scientifiques
- **[docs/SCIENTIFIC_DATA_FLOW.md](docs/SCIENTIFIC_DATA_FLOW.md)** - Flow complet des données et références scientifiques
- **[memory-bank/systemPatterns.md](memory-bank/systemPatterns.md)** - Organisation du code par niveaux
- **[docs/REFERENCES.md](docs/REFERENCES.md)** - Liste compilée des sources scientifiques
- **[docs/references/](docs/references/)** - Informations sur les sources et validations
- **Tests unitaires** - Validation par l'exemple (voir tests/)

### Outils qualité

- **Hook pre-commit** - Validation automatique (format + lint + tests) avant chaque commit
- **ESLint + Prettier** - Standards de code maintenus automatiquement
- **Suite de tests** - 14 fichiers tests, validation complète en ~15s

## ⚠️ Conditions d'utilisation

**Important**: À l'ouverture de l'application, un avertissement détaillé s'affiche. Vous devez l'accepter pour continuer. Ce disclaimer rappelle que les résultats sont indicatifs et ne remplacent pas l'analyse d'un professionnel qualifié.

### Plages de validité

- **Température eau**: 1 à 100°C
- **Température air**: -50 à +30°C
- **Pression**: 1 à 10 bar
- **Longueur**: 1 à 2500 m

### Hypothèses

- Fluide: Eau pure (sans glycol ni additifs)
- Régime: Permanent (état stationnaire)
- Environnement: Air ambiant
- Géométrie: Conduite droite horizontale

_Pour des configurations plus complexes, consultez la documentation technique._

## 📏 Limitations et Facteurs de Sécurité

### Quand faire confiance aux résultats

#### ✅ Conditions idéales (Confiance > 95%, Facteur 1.0)

- **Température**: Eau 5-80°C, Air -30 à +40°C
- **Hydraulique**: 4000 < Re < 100000 (turbulent modéré)
- **Configuration**: Matériaux standards, isolation ≥ 10 mm
- **Variation**: ΔT < 10K par segment

**Exemple**: DN50 acier isolé 20mm, eau 60°C, 2 kg/s, air -10°C, 300m → Résultats fiables à ±5%

#### ⚠️ Conditions limites (Confiance 80-95%, Facteur 1.2-1.5)

- **Zone transitoire** (Re 2300-4000): Incertitude ±30% → Facteur **1.5**
- **Sans isolation**: Sous-estimation 5-15% pertes → Facteur **1.2**
- **ΔT élevé** (> 30K par segment): Propriétés à T_in vs T_moy → Facteur **1.2**
- **Températures extrêmes**: Eau 0-5°C ou 80-100°C, Air < -30°C → Facteur **1.3**

#### ❌ Hors limites (Non fiable - NE PAS UTILISER)

- Eau < 0°C ou > 100°C (changement de phase)
- Pression > 10 bar
- Fluides autres que eau pure
- Régimes non-permanents

### Facteurs de sécurité recommandés

| Condition | Application critique | Application standard |
| --------- | -------------------- | -------------------- |
| Idéale    | 1.0-1.1              | 1.0                  |
| Limite    | 1.5-2.0              | 1.2-1.5              |

**Application**: Si longueur critique calculée = 200m avec Re transitoire → Longueur sécuritaire = 200 / 1.5 = **133m**

**Documentation complète**: Voir le JSDoc dans chaque module de calcul pour les limites détaillées des corrélations.

## 🤝 Contribution

Les contributions sont bienvenues! Le code suit des standards rigoureux avec JSDoc complet, validation stricte des entrées, et tests unitaires systématiques. Voir les modules existants pour les patterns à suivre.

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour détails.

---

**ThermaFlow v1.1.2** | Calculs scientifiques rigoureux | 100% open source

Pour questions ou support: [Ouvrez une issue sur GitHub](https://github.com/perrongu/thermaflow/issues)
