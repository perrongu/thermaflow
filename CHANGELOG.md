# Historique des versions - ThermaFlow

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
