# Project Brief - ThermaFlow

**Application de détection du risque de gel dans les conduites d'eau**

## Vision

ThermaFlow est une application web spécialisée qui détermine si l'eau circulant dans une conduite exposée au froid risque de geler. L'application fournit une réponse claire: **OUI** ou **NON**, le gel va-t-il se produire?

## Objectif unique

🧊 **Déterminer si oui ou non il y a danger de gel dans une conduite d'eau**

## Scope du projet

### Dans le scope
- Conduites d'**eau** uniquement
- Environnement **air froid**
- Calcul de température le long de la conduite
- Détection du point de gel (0°C)
- Analyse avec/sans isolation
- Effet du vent (convection forcée)

### Hors scope
- Autres fluides que l'eau (glycol, huile, etc.)
- Autres environnements (sol, liquides, etc.)
- Analyse de coûts
- Dimensionnement de pompes
- Calcul structurel

## Cas d'utilisation

1. **Vérification hiver**: Conduite d'eau extérieure peut-elle geler?
2. **Évaluation isolation**: L'isolation actuelle est-elle suffisante?
3. **Température critique**: Quelle T_air minimale la conduite tolère-t-elle?
4. **Effet vent**: Impact du vent froid sur le risque de gel?
5. **Débit minimum**: Quel débit pour éviter le gel?

## Utilisateurs cibles

- Ingénieurs en mécanique du bâtiment
- Techniciens en plomberie
- Propriétaires de bâtiments en climat froid
- Étudiants en génie (apprentissage)

## Contraintes fondamentales

1. **100% gratuit et local**: Fonctionne dans le navigateur, pas de serveur
2. **Pas de dépendances**: HTML/CSS/JS pur, aucun framework
3. **Précision scientifique**: Équations validées (Perry's Handbook, IAPWS)
4. **Interface simple**: Résultat OUI/NON clair, pas d'ambiguïté

## Critères de succès

1. ✅ Calcule correctement la température de l'eau
2. ✅ Détecte le gel avec précision (< 1% erreur)
3. ✅ Fonctionne sans serveur (file://)
4. ✅ Résultats en < 1 seconde
5. ✅ Interface intuitive (non-expert peut utiliser)

## Non-objectifs

- ❌ Logiciel de simulation thermique générale
- ❌ Calcul de coûts ou ROI
- ❌ Optimisation automatique multi-paramètres
- ❌ Intégration CAD/BIM
- ❌ Application mobile native

