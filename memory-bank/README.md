# Memory Bank - ThermaFlow

**Version**: 1.0.0  
**Dernière mise à jour**: 29 octobre 2025

## À propos du Memory Bank

Le Memory Bank est la documentation stratégique centrale de ThermaFlow. Il contient l'ensemble des informations nécessaires pour comprendre le projet, son architecture, ses décisions techniques et son état actuel.

**Note**: Cette documentation est privée (exclue de git via .gitignore) et sert de référence de travail pour le développement.

## Structure du Memory Bank

### Documents principaux

1. **[projectbrief.md](projectbrief.md)**
   - Vision et objectifs du projet
   - Problème résolu
   - Utilisateurs cibles

2. **[productContext.md](productContext.md)**
   - Contexte d'utilisation
   - Problèmes résolus
   - Fonctionnalités principales

3. **[systemPatterns.md](systemPatterns.md)**
   - Architecture du système
   - Patterns de code établis
   - Décisions techniques

4. **[techContext.md](techContext.md)**
   - Stack technique
   - Contraintes et choix
   - Outils et dépendances

5. **[activeContext.md](activeContext.md)**
   - État actuel du projet (v1.0.0)
   - Focus de développement
   - Décisions récentes

6. **[progress.md](progress.md)**
   - Historique de développement
   - Fonctionnalités complétées
   - Prochaines étapes

### Documentation technique publique (docs/)

7. **[docs/SCIENTIFIC_DATA_FLOW.md](../docs/SCIENTIFIC_DATA_FLOW.md)** ⭐ (PUBLIC)
   - **Document technique pour ingénieurs**
   - Flow complet des données (input → output)
   - Schémas ASCII des dépendances
   - Références scientifiques détaillées (Perry's, IAPWS-97)
   - Conversions d'unités et validations
   - Points d'attention pour audits
   - **Note**: Ce document est PUBLIC (dans docs/) pour accès GitHub

8. **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** (PUBLIC)
   - Architecture par niveaux de complexité
   - Rationale de chaque niveau
   - Patterns techniques (HTML/CSS/JS pur)
   - Guide navigation du code

9. **[docs/REFERENCES.md](../docs/REFERENCES.md)** (PUBLIC)
   - Liste complète des sources scientifiques
   - Tableau par module (équation → source → section)
   - Stratégie de validation croisée

### Documents spécifiques

- **[MIGRATION_ARCHITECTURE.md](MIGRATION_ARCHITECTURE.md)** - Guide de l'architecture par niveaux de complexité

## Comment utiliser le Memory Bank

### Pour démarrer sur le projet
1. Lire `projectbrief.md` pour comprendre la vision
2. Lire `productContext.md` pour le contexte d'utilisation
3. Lire `activeContext.md` pour l'état actuel
4. Lire `docs/SCIENTIFIC_DATA_FLOW.md` pour comprendre le flow technique

### Pour comprendre l'architecture
1. `systemPatterns.md` - Patterns et décisions
2. `MIGRATION_ARCHITECTURE.md` - Organisation par niveaux
3. `docs/ARCHITECTURE.md` - Architecture détaillée (public)
4. `docs/SCIENTIFIC_DATA_FLOW.md` - Flow des données scientifiques

### Pour valider scientifiquement
1. `docs/SCIENTIFIC_DATA_FLOW.md` - Toutes les références Perry's, équations, unités
2. `docs/REFERENCES.md` - Tableau compilé des sources
3. Modules de code - JSDoc avec entêtes "Engineering Review"
4. `tests/` - Suite de tests de validation

### Pour continuer le développement
1. `activeContext.md` - État et focus actuels
2. `progress.md` - Ce qui est fait et ce qui reste
3. `docs/SCIENTIFIC_DATA_FLOW.md` - Limites et incertitudes

## Philosophie du Memory Bank

Le Memory Bank suit une philosophie simple:
- **Documentation stratégique (privée)** → Memory Bank (pourquoi, comment)
- **Documentation technique (publique)** → docs/ (ARCHITECTURE, SCIENTIFIC_DATA_FLOW, REFERENCES)
- **Documentation inline** → JSDoc dans le code (API, usage)
- **Validation scientifique** → tests/ + entêtes engineering

**Aucune duplication** entre ces niveaux.

## Maintenance

### Quand mettre à jour
- `activeContext.md` - À chaque changement de focus
- `progress.md` - À chaque fonctionnalité complétée
- `docs/SCIENTIFIC_DATA_FLOW.md` - Si ajout de module de calcul ou modification de flow
- `docs/ARCHITECTURE.md` / `docs/REFERENCES.md` - Si changements architecturaux majeurs
- Autres fichiers memory-bank/ - Si changements stratégiques majeurs

### Principes de mise à jour
- **Concision** - Aller à l'essentiel
- **Clarté** - Écrire pour un lecteur futur (ou soi-même après reset mémoire)
- **Pertinence** - Documenter les décisions, pas les détails d'implémentation
- **Traçabilité** - Dater les changements importants

---

**ThermaFlow v1.0.0** - Documentation stratégique maintenue dans le Memory Bank
