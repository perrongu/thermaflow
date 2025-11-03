# Product Context - ThermaFlow

## Pourquoi ce projet existe

### Le problème
Les conduites d'eau exposées au froid hivernal peuvent geler, causant:
- Rupture de conduites (dégâts d'eau majeurs)
- Interruption de service
- Coûts de réparation élevés
- Risques de sécurité

**Difficulté actuelle**: Pas d'outil simple pour évaluer le risque réel. Les ingénieurs utilisent:
- Règles empiriques imprécises ("20mm d'isolation suffit")
- Calculs manuels complexes (plusieurs heures)
- Logiciels généraux surdimensionnés (ANSYS, COMSOL)
- Ou... ne calculent rien et espèrent

### La solution
ThermaFlow résout ce problème avec:
1. **Calcul scientifique rigoureux** (équations validées)
2. **Interface ultra-simple** (résultat OUI/NON clair)
3. **Gratuit et immédiat** (pas d'installation, pas de serveur)
4. **Résultats rapides** (< 1 seconde)

## Comment ça fonctionne

### Workflow utilisateur
```
1. Entrer les paramètres
   ├─ Conduite (DN, matériau, longueur)
   ├─ Eau (température, débit)
   ├─ Air (température, vent)
   └─ Isolation (optionnel)

2. Cliquer "Calculer"

3. Obtenir le résultat
   ├─ OUI/NON: Risque de gel?
   ├─ Graphique température T(x)
   ├─ Point de gel (si applicable)
   └─ Recommandations
```

### Calculs sous le capot
```
Pour chaque segment de conduite:
1. Propriétés fluides (ρ, μ, k, cp) ← IAPWS-97
2. Hydraulique (Re, f, ΔP) ← Colebrook, Darcy-Weisbach
3. Transfert thermique
   ├─ Convection interne (Nu) ← Gnielinski
   ├─ Conduction (paroi + isolation)
   ├─ Convection externe + rayonnement
   └─ Méthode NTU → T_sortie
4. Vérifier T_sortie ≤ 0°C?
```

## Expérience utilisateur visée

### Interface principale
- **Formulaire simple**: 3 sections (Conduite, Fluide, Environnement)
- **Sélecteurs intelligents**: DN standard, matériaux prédéfinis
- **Validation en temps réel**: Empêche erreurs de saisie
- **Bouton unique**: "Calculer le risque de gel"

### Résultats
- **Alerte visuelle**: 🔴 DANGER DE GEL ou ✅ PAS DE GEL
- **Graphique T(x)**: Courbe température sur longueur
- **Zone de gel**: Affichée si applicable
- **Détails**: Tableau complet (opt-in)
- **Actions**: Exporter PDF, modifier paramètres

### Principes UX
1. **Clarté avant tout**: Réponse OUI/NON immédiate
2. **Progressive disclosure**: Détails cachés par défaut
3. **Guidage**: Tooltips, valeurs suggérées
4. **Feedback immédiat**: Validation, erreurs, progress
5. **Pas de jargon**: Termes simples (sauf détails)

## Différenciation

### vs Logiciels généraux (ANSYS, COMSOL)
- ✅ **ThermaFlow**: Spécialisé, simple, gratuit, instant
- ❌ **Généraux**: Complexes, chers, longs à configurer

### vs Calculs manuels
- ✅ **ThermaFlow**: Précis, rapide, reproductible
- ❌ **Manuels**: Lents, erreurs fréquentes, difficiles

### vs Règles empiriques
- ✅ **ThermaFlow**: Scientifique, adapté au cas réel
- ❌ **Empiriques**: Imprécises, conservatrices, coûteuses

## Évolution future possible

### v1.0 (Actuel)
- Eau pure, conduite simple
- Résultat gel OUI/NON
- Interface web de base

### v2.0 (Futur potentiel)
- Fluides avec glycol
- Analyse transitoire (régime non permanent)
- Optimisation automatique (épaisseur isolation optimale)
- Export PDF professionnel
- Mode batch (plusieurs scénarios)

### v3.0 (Vision long terme)
- API pour intégration BIM
- Application mobile
- Base de données de cas réels
- IA pour recommandations

**Note**: Focus actuel sur v1.0 - faire une chose et la faire parfaitement.

