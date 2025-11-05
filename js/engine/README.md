# Engine

Moteur de calcul principal qui orchestre les résolutions itératives.

## Structure prévue

- `pipe-segment.js` - Calcul d'un segment individuel de conduite
- `pipe-network.js` - Propagation des états le long de la conduite
- `convergence.js` - Algorithmes de convergence itérative
- `freeze-detector.js` - Détection du risque de gel
- `validator.js` - Validation des paramètres d'entrée

## Stratégie de calcul

1. **Discrétisation** : Division de la conduite en N segments
2. **Boucle principale** : Pour chaque segment i = 1 à N
   - Calcul pression (Darcy-Weisbach)
   - Calcul température (méthode NTU)
   - Vérification convergence locale
   - Propagation vers segment i+1
3. **Détection gel** : Surveillance T_eau ≤ 0°C
4. **Résultats** : Profils T(x) et P(x) le long de la conduite
