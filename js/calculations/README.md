# js/calculations/ - Calculs composés

Modules qui **orchestrent** formulas + correlations pour résoudre des problèmes complets.

## Modules

### pressure-drop.js
Calcul complet de perte de charge.
```
Entrées: ρ, V, D, L, μ, ε/D
   ↓
1. Reynolds → Re, regime
2. Friction → f (selon régime)
3. Darcy → ΔP
   ↓
Sorties: { dP, f, Re, regime }
```

### thermal-resistance.js
Réseau de résistances thermiques (convection + conduction).
```
Fluide → Conv_int → Cond_paroi → Cond_isolation → Conv_ext → Air
   ↓
R_total = R₁ + R₂ + R₃ + R₄
Q = ΔT / R_total
```

### heat-transfer.js
Transfert thermique avec méthode NTU-effectiveness.
```
Entrées: T_in, m_dot, UA, L
   ↓
NTU = UA/(ṁcp)
T_out = T_amb + (T_in - T_amb) × exp(-NTU)
Q = ṁcp(T_in - T_out)
```

## Principe

Ces modules **combinent** plusieurs étapes de calcul:
1. Récupèrent propriétés (`js/properties/`)
2. Appliquent formules de base (`js/formulas/`)
3. Utilisent corrélations (`js/correlations/`)
4. Produisent résultats complets

## Pour les ingénieurs

**C'est ici que la magie opère.**  
Ces modules montrent comment assembler les pièces du puzzle pour résoudre
des problèmes réels d'ingénierie.

Niveau suivant → voir `js/engine/` pour segment et réseau complet

