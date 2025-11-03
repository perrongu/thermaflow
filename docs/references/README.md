# Références scientifiques

Documents de référence utilisés pour le développement de ThermaFlow.

## Perry's Chemical Engineers' Handbook (9e édition, 2016)

**Référence**: Perry, R.H., Green, D.W., Maloney, J.O. (2016). *Perry's Chemical Engineers' Handbook*, 9th Edition. McGraw-Hill.

**Sections utilisées dans ThermaFlow**:
- **Section 2** - Physical and Chemical Data
  - Propriétés de l'air (corrélations Sutherland, gaz parfait)
  - Tables de propriétés thermophysiques (Table 2-314)
  
- **Section 5** - Heat and Mass Transfer
  - Corrélations de convection (Hausen, Dittus-Boelter, Gnielinski)
  - Churchill-Bernstein pour cylindre
  - Rayonnement thermique
  - Méthode NTU-ε
  - Propriétés des isolants (Table 5-17)
  
- **Section 6** - Fluid and Particle Dynamics
  - Rugosité des conduites (Table 6-7)
  - Facteurs de friction (Colebrook-White, Churchill)
  - Équation de Darcy-Weisbach
  - Nombre de Reynolds

**Disponibilité**: Manuel disponible via bibliothèques universitaires, éditeur McGraw-Hill, ou libraires spécialisés.

## Documents disponibles localement

### Validation des Propriétés des Matériaux Isolants

**Fichier**: `INSULATION_PROPERTIES_VALIDATION.md`  
**Statut**: Inclus dans le dépôt

**Contenu**:
- Validation croisée des propriétés thermiques (k, ρ, cp, ε)
- Comparaison avec Perry's, ASHRAE, Incropera & DeWitt
- Plages de température valides
- Notes sur l'humidité et les densités optimales
- Recommandations par type d'application

## Références en ligne

### IAPWS (International Association for the Properties of Water and Steam)

**URL**: https://iapws.readthedocs.io/  
**Utilisation**: Propriétés de l'eau (IAPWS-97)

Standard international pour les propriétés thermophysiques de l'eau et de la vapeur utilisé dans l'industrie.

### Bibliothèque Python "fluids"

**URL**: https://fluids.readthedocs.io/  
**Utilisation**: Validation des calculs, génération des tables

Bibliothèque open-source contenant 100+ corrélations de mécanique des fluides, utilisée pour valider nos implémentations.

### ASHRAE Fundamentals Handbook

**Référence**: Mentionné dans le README principal  
**Utilisation**: Propriétés de l'eau et de l'air

Alternative aux tables Perry's pour certaines propriétés thermophysiques.

## Notes

- Toutes les sources scientifiques sont citées dans le code (JSDoc) et la documentation
- Les références commerciales (Perry's, ASHRAE) doivent être obtenues via les canaux officiels
- Les sources en ligne (IAPWS, fluids.readthedocs.io) sont librement accessibles

