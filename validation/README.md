# Validation Externe ThermaFlow v1.0.0

Ce dossier contient les fichiers nécessaires pour la validation croisée de ThermaFlow avec des logiciels de simulation de référence.

## Fichier d'échantillon

**`external_validation_sample_v1.0.json`** - 130 cas de test statistiquement représentatifs

### Stratégie d'échantillonnage

L'échantillon a été généré selon une approche combinée pour garantir une couverture statistique optimale:

1. **Grille systématique (30 cas critiques)**
   - Cas extrêmes de température, débit, pression
   - Conditions critiques de gel
   - Géométries limites (petits/grands diamètres)
   - Variations d'isolation
   - Conditions de vent extrêmes

2. **Latin Hypercube Sampling (100 cas)**
   - Distribution uniforme dans l'espace paramétrique
   - Focus sur plages réalistes (températures 10-90°C, débits 0.5-100 m³/h)
   - Distribution log-normale pour NPS et longueurs (plus de petites valeurs)
   - 50% des cas avec isolation, 50% sans

### Couverture des paramètres

| Paramètre | Plage couverte | Distribution |
|-----------|----------------|--------------|
| **Matériaux** | Steel (46%), Copper (18%), SS (36%) | Catégorielle |
| **NPS** | Steel 0.5-36", Copper 0.25-12", SS 0.125-24" | Log-normale |
| **Longueur** | 1-1000 m | Log-normale |
| **T_eau** | 1-100°C (focus 10-90°C) | LHS uniforme |
| **Débit** | 0.1-6000 m³/h (focus 0.5-100) | Log-normale |
| **Pression** | 100-1000 kPag | Uniforme |
| **T_air** | -50 à +30°C (focus -30 à +10°C) | LHS uniforme |
| **Vent** | 0-108 km/h (focus 0-30) | Beta (α=2, β=5) |
| **Isolation** | 50% sans, 50% avec (4 matériaux) | Catégorielle |
| **Épaisseur isolation** | 13-100 mm | Log-normale |

### Structure du fichier JSON

```json
{
  "metadata": {
    "generator": "ThermaFlow External Validation Sample Generator",
    "version": "1.0.0",
    "date": "2025-10-31",
    "total_cases": 130,
    "description": "...",
    "sampling_strategy": { ... },
    "ranges": { ... },
    "nps_ranges": { ... }
  },
  "cases": [
    {
      "case_id": 1,
      "description": "...",
      "inputs": {
        "pipe": {
          "material": "steel|copper|stainless_steel",
          "schedule": "40|80|120|160|K|L|M|5S|10S|40S|80S",
          "nps": 0.125-36,
          "length_m": 1-1000
        },
        "fluid": {
          "temp_C": 1-100,
          "flow_m3h": 0.1-6000,
          "pressure_kPag": 100-1000
        },
        "ambient": {
          "temp_C": -50 à 30,
          "wind_kmh": 0-108
        },
        "insulation": null | {
          "material": "fiberglass|mineral_wool|polyurethane_foam|elastomeric_foam",
          "thickness_mm": 13-100
        }
      },
      "outputs": {
        "aspen_hysys": {
          "status": "ok|freeze_detected|error|not_run",
          "T_out_C": null | number,
          "pressure_drop_kPa": null | number,
          "heat_loss_W": null | number,
          "notes": ""
        },
        "aft_fathom": { ... },
        "dwsim": { ... },
        "thermaflow": { ... }
      }
    }
  ]
}
```

## Procédure de validation

### 1. Préparation

- Ouvrir le fichier JSON dans un éditeur ou Excel (via import JSON)
- Préparer les 4 logiciels: Aspen Hysys, AFT Fathom, DWSIM, ThermaFlow
- Créer un tableur de suivi (ou travailler directement dans le JSON)

### 2. Récolte de données

Pour chaque cas (case_id 1 à 130):

1. **Aspen Hysys**
   - Configurer la conduite selon les inputs
   - Si gel détecté (message d'erreur):
     - Mettre `status: "freeze_detected"`
     - Laisser `T_out_C`, `pressure_drop_kPa`, `heat_loss_W` à `null`
     - Noter le message d'erreur dans `notes`
   - Si calcul réussi:
     - Mettre `status: "ok"`
     - Noter les valeurs dans `T_out_C`, `pressure_drop_kPa`, `heat_loss_W`
   - Si autre erreur:
     - Mettre `status: "error"`
     - Documenter dans `notes`

2. **AFT Fathom**
   - Répéter la même logique (gel → `status: "freeze_detected"`)

3. **DWSIM**
   - Répéter la même logique (gel → `status: "freeze_detected"`)

4. **ThermaFlow**
   - Ouvrir la webapp
   - Entrer les paramètres du cas
   - Si gel détecté mais calcul effectué:
     - Mettre `status: "ok"` (ou `"freeze_warning"` si distinction nécessaire)
     - Noter les valeurs calculées
     - Ajouter warning dans `notes` si applicable
   - Sinon:
     - Mettre `status: "ok"`
     - Noter les valeurs

**⚠️ IMPORTANT - Cas de gel:**

Certains logiciels (Aspen Hysys, AFT Fathom, DWSIM) arrêtent le calcul lorsque le gel est détecté et affichent un message d'erreur. Dans ce cas:
- **Ne pas** essayer de forcer un calcul
- **Mettre** `status: "freeze_detected"`
- **Laisser** les valeurs à `null` (elles n'ont pas de sens physique)
- **Documenter** le message d'erreur exact dans `notes`

Ces cas seront automatiquement exclus de l'analyse statistique finale (voir section 3).

### 3. Analyse statistique

Une fois toutes les données récoltées:

```python
# Exemple d'analyse en Python
import json
import pandas as pd
import numpy as np
from scipy import stats

# Charger les données
with open('external_validation_sample_v1.0.json') as f:
    data = json.load(f)

# Extraire résultats (en excluant les cas de gel)
results = []
freeze_cases = []

for case in data['cases']:
    hysys = case['outputs']['aspen_hysys']
    fathom = case['outputs']['aft_fathom']
    dwsim = case['outputs']['dwsim']
    thermaflow = case['outputs']['thermaflow']
    
    # Vérifier si cas de gel (au moins un logiciel a détecté le gel)
    has_freeze = (
        hysys['status'] == 'freeze_detected' or
        fathom['status'] == 'freeze_detected' or
        dwsim['status'] == 'freeze_detected'
    )
    
    if has_freeze:
        freeze_cases.append({
            'case_id': case['case_id'],
            'description': case['description'],
            'hysys_status': hysys['status'],
            'fathom_status': fathom['status'],
            'dwsim_status': dwsim['status']
        })
        continue  # Exclure de l'analyse statistique
    
    # N'inclure que les cas avec status "ok" pour tous les logiciels
    if (hysys['status'] == 'ok' and fathom['status'] == 'ok' and 
        dwsim['status'] == 'ok' and thermaflow['status'] == 'ok'):
        
        results.append({
            'case_id': case['case_id'],
            'hysys_T': hysys['T_out_C'],
            'fathom_T': fathom['T_out_C'],
            'dwsim_T': dwsim['T_out_C'],
            'thermaflow_T': thermaflow['T_out_C'],
            'hysys_dP': hysys['pressure_drop_kPa'],
            'fathom_dP': fathom['pressure_drop_kPa'],
            'dwsim_dP': dwsim['pressure_drop_kPa'],
            'thermaflow_dP': thermaflow['pressure_drop_kPa'],
            'hysys_Q': hysys['heat_loss_W'],
            'fathom_Q': fathom['heat_loss_W'],
            'dwsim_Q': dwsim['heat_loss_W'],
            'thermaflow_Q': thermaflow['heat_loss_W']
        })

df = pd.DataFrame(results)
df_freeze = pd.DataFrame(freeze_cases)

print(f"Total cas: {len(data['cases'])}")
print(f"Cas de gel exclus: {len(freeze_cases)}")
print(f"Cas analysés: {len(results)}")

# Afficher les cas de gel
if len(freeze_cases) > 0:
    print("\n📋 Cas de gel détectés:")
    print(df_freeze[['case_id', 'description']].to_string(index=False))

# Calculer écarts (seulement pour cas valides)
df['thermaflow_vs_hysys_T'] = df['thermaflow_T'] - df['hysys_T']
df['thermaflow_vs_fathom_T'] = df['thermaflow_T'] - df['fathom_T']
df['thermaflow_vs_dwsim_T'] = df['thermaflow_T'] - df['dwsim_T']

# Statistiques descriptives
print("\n📊 Statistiques température:")
print(df[['thermaflow_vs_hysys_T', 'thermaflow_vs_fathom_T', 'thermaflow_vs_dwsim_T']].describe())

# Tests statistiques
# MAE (Mean Absolute Error)
mae_hysys = np.mean(np.abs(df['thermaflow_vs_hysys_T']))
# RMSE (Root Mean Square Error)
rmse_hysys = np.sqrt(np.mean(df['thermaflow_vs_hysys_T']**2))
# Biais moyen
bias_hysys = np.mean(df['thermaflow_vs_hysys_T'])

print(f"\nMAE vs Hysys: {mae_hysys:.2f}°C")
print(f"RMSE vs Hysys: {rmse_hysys:.2f}°C")
print(f"Biais vs Hysys: {bias_hysys:.2f}°C")
```

### 4. Critères d'acceptation

ThermaFlow sera considéré validé si:

- **Température de sortie**: RMSE < 2°C, MAE < 1°C
- **Perte de charge**: Erreur relative < 10%
- **Perte de chaleur**: Erreur relative < 15%
- **Biais systématique**: < 5% sur l'ensemble

### 5. Cas problématiques

Si certains cas montrent des écarts importants:
1. Vérifier la configuration des logiciels (mêmes corrélations)
2. Documenter dans le champ "notes"
3. Investiguer les causes (limites de validité, approximations)
4. Exclure les cas invalides de l'analyse statistique finale

## Régénération de l'échantillon

Pour régénérer l'échantillon (avec seed différent):

```bash
node scripts/generate_validation_sample.js
```

Le script utilise un seed fixe (42) pour reproductibilité. Pour changer le seed, modifier la ligne dans le script:

```javascript
const rng = new SeededRandom(42); // Changer 42 pour un autre nombre
```

## Fichiers de sortie attendus

Après validation complète:
- `external_validation_sample_v1.0.json` (complété avec résultats)
- `validation_analysis.xlsx` (analyse statistique)
- `validation_report_v1.0.pdf` (rapport final)

## Gestion des cas de gel

### Statuts disponibles

Chaque output dans le JSON contient un champ `status` avec les valeurs suivantes:

- **`"ok"`**: Calcul réussi, valeurs valides
- **`"freeze_detected"`**: Gel détecté, calcul arrêté par le logiciel
- **`"error"`**: Autre erreur (convergence, limites, etc.)
- **`"not_run"`**: Cas non encore testé

### Procédure pour cas de gel

Quand un logiciel détecte un gel (T_out < 0°C ou message d'erreur):

1. **Ne pas** forcer un calcul
2. Mettre `status: "freeze_detected"`
3. Laisser `T_out_C`, `pressure_drop_kPa`, `heat_loss_W` à `null`
4. Copier le message d'erreur exact dans `notes`

**Exemple:**
```json
"aspen_hysys": {
  "status": "freeze_detected",
  "T_out_C": null,
  "pressure_drop_kPa": null,
  "heat_loss_W": null,
  "notes": "Freeze warning: T_out < 0°C. Calculation stopped."
}
```

### Cas concernés

Les cas suivants sont à risque de gel:
- Cas 7, 8, 9, 10 (explicitement "risque gel")
- Autres cas avec T_eau < 5°C et T_air < -20°C
- Cas avec isolation insuffisante et conditions très froides

Ces cas seront automatiquement exclus de l'analyse statistique principale mais peuvent être analysés séparément pour valider la détection de gel.

## Notes importantes

- Les 30 premiers cas sont critiques (grille) → analyses séparées des cas LHS
- Les cas avec isolation thermique nécessitent des modèles compatibles
- Les très grands diamètres (>12") peuvent ne pas être supportés par tous les logiciels
- Les débits très élevés (>1000 m³/h) sont industriels, vérifier validité des corrélations
- **Les cas de gel sont normaux** et attendus pour certaines conditions limites

