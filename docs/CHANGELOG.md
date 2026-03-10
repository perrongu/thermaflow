# Historique des versions - ThermaFlow

## Version 1.2.2 (10 mars 2026)

### Corrections

- Analyse 2D: recalcul `numSegments` quand la longueur (L) varie dans la heatmap — les valeurs étaient incorrectes aux longueurs extrêmes (segments sous/sur-résolus)
- Nusselt interne: propagation du facteur de friction `f` (Churchill, avec rugosité) à travers `nusseltInternal()` → `nusseltGnielinski()` — la rugosité du tuyau était ignorée, sous-estimant h_int de 10-30% pour les conduites rugueuses
- Rayonnement: utilisation de la température de surface estimée `(T_in + T_amb) / 2` au lieu de `T_in` — h_rad était surestimé de 20-40% pour les conduites isolées

### Nettoyage

- Suppression code mort: `throttle()` et `cancelablePromise()` dans utils.js (jamais appelés)
- Mise à jour JSDoc: header utils.js, paramètre `f` dans `nusseltInternal()`

### Sécurité

- Correction 3 vulnérabilités npm devDependencies (`minimatch` ReDoS, `ajv` ReDoS, `js-yaml` prototype pollution)
- Pre-commit hook: `unset THERMAFLOW_SKIP_TESTS` empêche le bypass de la gate de tests
- Nettoyage `.claude/settings.local.json`: suppression entrées malformées (`__NEW_LINE_*`, `Bash(do:*)`)

### Tests

- 3 nouveaux fichiers tests: numSegments 2D, passthrough rugosité Nusselt, température surface radiation
- Suite complète: 27 fichiers tests, toutes assertions passent (100%)

---

## Version 1.2.1 (10 mars 2026)

### Corrections

- Validation formulaire: ajout `parseFloat()+isNaN()` sur les 6 champs (longueur, températures, pression, débit, vent) — les entrées non-numériques passaient la validation
- Affichage corrélation Nusselt: toujours Gnielinski pour régime turbulent (affichait Dittus-Boelter pour Re>10000)
- Affichage h_conv/h_rad: valeurs réelles du moteur (était hardcodé 85/15% de h_ext)
- Labels i18n: suppression "Dittus-Boelter" hardcodé dans les clés `correlation` des 4 langues (FR/EN/ES/PT)

### Refactoring

- Suppression fonction dupliquée `cylinderSurfaceArea` dans radiation.js (conservée dans geometry.js)

### Tests

- 3 nouveaux fichiers tests: validation string, corrélation Nusselt, split h_conv/h_rad
- Suite complète: 24 fichiers tests, 1246+ assertions (100% passent)

---

## Version 1.2.0 (10 mars 2026)

### Refactoring

- Suppression code mort dans app.js (~128 lignes) et sensitivity-analysis.js (~47 lignes)
- Suppression console.log de production dans loader.js
- Suppression fichier orphelin data/pipes/roughness.js (non chargé, non référencé)
- Extraction module partagé sensitivity-params.js (PARAMETER_DEFINITIONS et getParameterLabel)
- Extraction module sensitivity-heatmap-renderer.js (rendu canvas heatmap 2D)
- Centralisation constante MARGE_SURETE_GEL dans js/constants/thresholds.js
- Centralisation constante MATERIAL_ROUGHNESS dans js/constants/roughness.js
- Synchronisation version storage.js avec ThermaFlowVersion.VERSION

### Sécurité

- Ajout attributs SRI (integrity + crossorigin) sur les 3 ressources CDN KaTeX
- Remplacement innerHTML par createElement/textContent pour les erreurs de validation (sensitivity-analysis.js)
- Ajout validation de schéma après JSON.parse dans storage.js

### Améliorations

- Remplacement constante magique rho_water=983 par lookup WaterProperties.getWaterProperties()
- Installation ECC (Everything Claude Code) au niveau projet

### Notes

Revue de code complète (refactor-clean, code-review, security-scan). Validation complète: 22 fichiers tests, tous passent. Zéro erreur console en navigateur.

---

## Version 1.1.7 (25 novembre 2025)

### Fixed

- Conversion débit vers SI dans rebuildConfig analyse 1D
- Conversion débit depuis SI dans getDisplayValue analyse 1D
- Conversions redondantes supprimées dans generateSummaryTable

### Notes

Corrections conversion unités débit analyse sensibilité 1D. Validation complète: 20/20 tests (100%).

---

## Version 1.1.6 (25 novembre 2025)

### Corrections

- Division par zéro dans interpolation analyse 1D
- Variable non définie dans recherche borne valide
- Points critiques instables lors changement paramètres
- Duplication code dans gestion erreurs

### Améliorations

- Stratégie interpolation analyse 1D (250 points au lieu de 75)
- Fonction rebuildConfig pour cohérence configuration complète
- Suppression graphiques tornado (affichage tableau uniquement)
- Tests cohérence points critiques ajoutés

### Notes

Corrections bugs critiques analyse sensibilité 1D. Validation complète: 20/20 tests (100%).

---

## Version 1.1.5 (Date à compléter)

### Documentation

- Restructuration complète README.md (inspirée ImPlot3D)
- Ajout screenshots (schéma 3D, graphique, verdict, sensibilité)
- Amélioration section installation (ajout option ZIP)
- Correction cas d'utilisation (scénarios réalistes)
- Réorganisation sections (suppression architecture, condensation contenu)

### Notes

Aucun changement fonctionnel. Amélioration présentation et accessibilité documentation.

---

## Version 1.1.4 (5 novembre 2025)

### Infrastructure tests

- Refactorisation système vérification automatisée
- Extraction utilitaires tests dans helpers/automated_verification_test_utils.js
- Rapport AUTOMATED_VERIFICATION_LATEST.md toujours à jour
- Ajout 4 tests validation système rapport

### Notes

Aucun changement fonctionnel. Amélioration qualité infrastructure tests.

---

## Version 1.1.3 (5 novembre 2025)

### Corrections

- Fonction displayConfigSummary réactivée (était commentée par erreur)

### Notes

Bug fix critique: ReferenceError bloquait affichage des résultats. Validation complète: 15/15 tests (100%).

---

## Version 1.1.2 (5 novembre 2025)

### Infrastructure

- Centralisation version dans js/constants/version.js
- Suppression console.log non conformes ESLint
- Test cohérence version automatisé
- Injection dynamique version dans footer

### Notes

Aucun changement fonctionnel. Validation complète: 15/15 tests (100%), 0 warning ESLint.

---

## Version 1.1.1 (5 novembre 2025)

### Infrastructure développement

- Configuration hook pre-commit automatique (format, lint, tests)
- Installation ESLint et Prettier avec règles strictes
- Documentation setup développeurs (.git/hooks/README.md)
- Ajout scripts npm (lint, format:check, verify)

### Nettoyage

- Suppression fichier backup validation
- Déplacement CHANGELOG.md vers docs/
- Ajout pattern rapports auto-générés à .prettierignore

### Notes

Aucun changement fonctionnel. Validation complète: 14/14 constantes, 25/25 conversions, 14/14 tests (100%).

---

## Version 1.1.0 (4 novembre 2025)

### Nouvelles fonctionnalités

- Extension longueur maximale conduite: 1000m → 2500m (demande client)
- Amélioration détection plage effective analyse sensibilité 1D
- Amélioration visualisation points critiques (freeze/safety)
- Amélioration rendu heatmap analyse sensibilité 2D

### Améliorations

- Test cas critique ajouté: L=2500m, NPS 2", débit faible, T_amb=-30°C
- Validation convergence numérique pour ratio L/D ≈ 47,600
- Mise à jour cohérente documentation, i18n (FR/EN/ES/PT), validation

### Corrections

- Chemin fichier validation externe dans automated_verification.js

### Tests

- 304/304 tests principaux passent (100%)
- Nouveau test 9.4 dans test_pipe_network.js (67/67)
- Rapport vérification automatique complet: AUTOMATED_VERIFICATION_2025-11-04.md

---

## Version 1.0.1 (3 novembre 2025)

### Modifications

- Configuration Git mise à jour
  - Exclusion de `.cursor/` du dépôt
  - Exclusion de `memory-bank/` du dépôt
  - Exclusion de `docs/references/` du dépôt
- Mise à jour des numéros de version dans tous les fichiers
- CHANGELOG déplacé à la racine (standard GitHub)

### Notes

Pas de changement fonctionnel. Version 1.0.1 identique à 1.0.0 en termes de calculs et fonctionnalités.

---

## Version 1.0.0 (2 novembre 2025)

### Version initiale complète

- Architecture par niveaux de complexité
  - `data/` : Tables scientifiques (eau, air, matériaux, conduites)
  - `js/properties/` : Lookup et interpolation
  - `js/formulas/` : Formules de base (Reynolds, géométrie, pression)
  - `js/correlations/` : Corrélations empiriques (Colebrook, Gnielinski, Churchill)
  - `js/calculations/` : Calculs composés (perte de charge, transfert thermique)
  - `js/engine/` : Orchestration (segment, réseau, détecteur)
  - `js/ui/` : Interface utilisateur complète

### Fonctionnalités principales

- Analyse hydraulique complète
  - Pertes de charge (Darcy-Weisbach + Colebrook-White)
  - Support rugosité et accessoires
  - Écoulement laminaire et turbulent
- Transfert thermique rigoureux
  - Convection interne (Gnielinski, Sieder-Tate)
  - Convection externe (Churchill-Chu, corrélations vent)
  - Conduction multi-couches (tube + isolation)
  - Radiation
- Détection du risque de gel
  - Analyse point par point
  - Identification position critique
  - Température minimale
- Interface utilisateur
  - Formulaire multi-onglets intuitif
  - Graphiques température et vitesse
  - Diagramme 3D animé
  - Analyse de sensibilité 1D et 2D
  - Export PDF professionnel
  - Support multilingue (FR/EN/ES/PT)
  - Système d'unités impériales/SI

### Validation scientifique

- 142 tests unitaires (100% succès)
- Validation contre Perry's Handbook 9th Ed.
- Validation contre IAPWS-97
- Validation croisée avec fluids.readthedocs.io
- Données matériaux standards industriels
- Échantillon de validation externe (130 cas)

### Documentation

- Memory Bank complet (projectbrief, productContext, systemPatterns, techContext, activeContext, progress)
- Guide de démarrage rapide
- Références scientifiques complètes
- Architecture et flux de données documentés
- Système de vérification automatisé

### Technologies

- HTML/CSS/JS pur (pas de framework)
- Pas de serveur requis (file://)
- Pas de bundler
- Compatible tous navigateurs modernes
- Open source (Licence MIT)
