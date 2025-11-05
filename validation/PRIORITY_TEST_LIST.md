# 🎯 LISTE PRIORISÉE DES CAS DE TEST - VALIDATION THERMAFLOW

**Générée le:** 2025-11-02

## 📊 Vue d'ensemble

- **Cas déjà testés (DWSIM):** 32/130 (24.6%)
- **Cas non supportés (DWSIM):** 7 → à tester avec Hysys/Fathom
- **Cas restants à tester:** 91

## 🎯 Stratégie Recommandée

### Option 1: Validation Température Uniquement (RECOMMANDÉ)

**Objectif:** Valider la précision de T_out (déjà excellent avec 0.76°C d'écart moyen)

- ✅ **Tester:** 2 cas P1 + 10 cas P2
- ⏱️ **Temps:** ~120 min (2.0h)
- 💾 **Total cas validés:** ~44/130
- 📈 **Statistiquement robuste:** OUI (>40 cas couvrant les extrêmes)

### Option 2: Validation Complète (ΔP et Q)

**Objectif:** Comprendre les écarts de 5.48 kPa et 26.4% sur Q

- ✅ **Tester:** Tous P1 + tous P2 + 50% P3
- ⏱️ **Temps:** ~250 min
- 💾 **Total:** ~100 cas
- 📈 **Nécessaire pour:** Identifier divergences sur pertes thermiques

---

## 🔴 PRIORITÉ 1 - CRITIQUE (2 cas)

**À tester en PREMIER - Conditions extrêmes**

### 1. Cas #63 [Score: 6.0]

**Description:** Cas LHS 33: steel 120 24"

**Raisons:** T_eau=85.5°C (très chaud), NPS=24" (très grand)

**Configuration:**

- Pipe: steel Sch120 24"
- Longueur: 127m
- Température eau: 85.5°C
- Débit: 31.5 m³/h
- Pression: 459 kPag
- Température ambiante: 4°C
- Isolation: Non

---

### 2. Cas #45 [Score: 5.0]

**Description:** Cas LHS 15: stainless_steel 10S 24"

**Raisons:** T_eau=13.3°C (extrême), NPS=24" (très grand)

**Configuration:**

- Pipe: stainless_steel Sch10S 24"
- Longueur: 30m
- Température eau: 13.3°C
- Débit: 3.7 m³/h
- Pression: 993 kPag
- Température ambiante: -2°C
- Isolation: Non

---

## 🟠 PRIORITÉ 2 - IMPORTANT (13 cas)

**À tester si Option 2 choisie**

### 1. Cas #117 [Score: 4.0]

- **Description:** Cas LHS 87: steel 40 14"
- **Raisons:** T_eau=76.2°C (extrême), NPS=14" (grand)
- **Config:** steel 14", L=81m, T=76.2°C, Q=93.2 m³/h

### 2. Cas #54 [Score: 3.5]

- **Description:** Cas LHS 24: steel 80 1.25"
- **Raisons:** T_eau=89.7°C (très chaud), Avec isolation fiberglass
- **Config:** steel 1.25", L=46m, T=89.7°C, Q=1 m³/h

### 3. Cas #69 [Score: 3.5]

- **Description:** Cas LHS 39: steel 80 30"
- **Raisons:** NPS=24" (très grand), Avec isolation fiberglass
- **Config:** steel 24", L=244m, T=33.6°C, Q=47.2 m³/h

### 4. Cas #84 [Score: 3.5]

- **Description:** Cas LHS 54: steel 120 1.25"
- **Raisons:** T_eau=86.9°C (très chaud), Avec isolation polyurethane_foam
- **Config:** steel 3", L=10m, T=86.9°C, Q=85.8 m³/h

### 5. Cas #109 [Score: 3.5]

- **Description:** Cas LHS 79: steel 40 24"
- **Raisons:** NPS=24" (très grand), Avec isolation mineral_wool
- **Config:** steel 24", L=63m, T=37.6°C, Q=0.7 m³/h

### 6. Cas #110 [Score: 3.5]

- **Description:** Cas LHS 80: steel 160 30"
- **Raisons:** NPS=30" (très grand), Avec isolation polyurethane_foam
- **Config:** steel 30", L=204m, T=20.8°C, Q=2 m³/h

### 7. Cas #127 [Score: 3.5]

- **Description:** Cas LHS 97: steel 80 20"
- **Raisons:** NPS=20" (très grand), Avec isolation polyurethane_foam
- **Config:** steel 20", L=35m, T=70°C, Q=1.6 m³/h

### 8. Cas #55 [Score: 3.0]

- **Description:** Cas LHS 25: steel 40 36"
- **Raisons:** NPS=36" (très grand)
- **Config:** steel 36", L=29m, T=43.1°C, Q=20 m³/h

### 9. Cas #71 [Score: 3.0]

- **Description:** Cas LHS 41: stainless_steel 40S 0.125"
- **Raisons:** T_eau=89.1°C (très chaud)
- **Config:** stainless_steel 2", L=50m, T=89.1°C, Q=0.6 m³/h

### 10. Cas #72 [Score: 3.0]

- **Description:** Cas LHS 42: steel 160 24"
- **Raisons:** NPS=24" (très grand)
- **Config:** steel 24", L=34m, T=44.1°C, Q=37 m³/h

### 11. Cas #77 [Score: 3.0]

- **Description:** Cas LHS 47: steel 120 36"
- **Raisons:** NPS=24" (très grand)
- **Config:** steel 24", L=19m, T=16.1°C, Q=12.4 m³/h

### 12. Cas #83 [Score: 3.0]

- **Description:** Cas LHS 53: copper K 6"
- **Raisons:** T_eau=88.1°C (très chaud)
- **Config:** copper 6", L=54m, T=88.1°C, Q=17.8 m³/h

### 13. Cas #112 [Score: 3.0]

- **Description:** Cas LHS 82: stainless_steel 40S 3"
- **Raisons:** T_eau=86.7°C (très chaud)
- **Config:** stainless_steel 3", L=321m, T=86.7°C, Q=4.3 m³/h

## 🟡 PRIORITÉ 3 - COMPLÉMENTAIRE (20 cas)

**Optionnel - Pour validation statistique approfondie**

_Liste abrégée des 10 premiers:_

- Cas #43: Cas LHS 13: copper M 3" [Score: 2.5]
- Cas #44: Cas LHS 14: stainless_steel 10S 0.375" [Score: 2.5]
- Cas #47: Cas LHS 17: stainless_steel 80S 18" [Score: 2.5]
- Cas #52: Cas LHS 22: steel 160 14" [Score: 2.5]
- Cas #58: Cas LHS 28: steel 40 2.5" [Score: 2.5]
- Cas #61: Cas LHS 31: stainless_steel 40S 10" [Score: 2.5]
- Cas #66: Cas LHS 36: stainless_steel 40S 4" [Score: 2.5]
- Cas #97: Cas LHS 67: copper K 4" [Score: 2.5]
- Cas #105: Cas LHS 75: stainless_steel 80S 4" [Score: 2.5]
- Cas #116: Cas LHS 86: copper M 6" [Score: 2.5]

... et 10 autres cas

## ⚪ PRIORITÉ 4 - OPTIONNEL (56 cas)

**Peut être ignoré sans impact - Conditions moyennes déjà validées**

_Ces cas peuvent être ignorés car les conditions moyennes sont déjà bien validées par les 32 premiers tests._

---

## ⚠️ CAS NON SUPPORTÉS PAR DWSIM (7 cas)

**À tester avec Aspen Hysys ou AFT Fathom**

### Cas #16

- **Description:** SAFE-16 (modifié pour éviter gel)
- **Config:** steel Sch40 36"
- **Raison:** NPS not available in DWSIM

### Cas #17

- **Description:** Cuivre petit diamètre
- **Config:** copper SchK 2"
- **Raison:** NPS non disponible dans DWSIM

### Cas #18

- **Description:** Cuivre grand diamètre
- **Config:** copper SchM 12"
- **Raison:** NPS non disponible dans DWSIM

### Cas #24

- **Description:** Isolation élastomère
- **Config:** steel Sch40 2"
- **Raison:** NPS non disponible dans DWSIM

### Cas #32

- **Description:** Cas LHS 2: steel 40 30"
- **Config:** steel Sch40 30"
- **Raison:** NPS non disponible dans DWSIM

### Cas #34

- **Description:** Cas LHS 4: copper M 6"
- **Config:** copper SchM 6"
- **Raison:** NPS non disponible dans DWSIM

### Cas #40

- **Description:** Cas LHS 10: steel 40 30"
- **Config:** steel Sch40 30"
- **Raison:** NPS non disponible dans DWSIM

---

## 📋 CHECKLIST D'EXÉCUTION

### Pour Option 1 (Température uniquement):

```
☐ Phase 1: Tester les 2 cas P1 avec DWSIM
☐ Phase 2: Tester 10 cas P2 avec DWSIM
☐ Phase 3: Tester les 7 cas non supportés avec Hysys/Fathom
☐ Phase 4: Analyser les résultats (relancer analyze_validation_progress.js)
☐ Phase 5: Générer rapport final
```

**Temps total estimé:** 3.2 heures

### Pour Option 2 (Complète):

```
☐ Phase 1: Tester tous les cas P1 (2)
☐ Phase 2: Tester tous les cas P2 (13)
☐ Phase 3: Tester 50% des cas P3 (~10)
☐ Phase 4: Tester les cas non supportés avec Hysys/Fathom
☐ Phase 5: Analyse statistique approfondie
☐ Phase 6: Investigation des écarts ΔP et Q
```

**Temps total estimé:** 5.3 heures

---

## 💡 NOTES

1. **Écarts actuels (32 cas testés):**
   - T_out: ±0.76°C (excellent)
   - ΔP: ±5.48 kPa (significatif - à investiguer si option 2)
   - Q: ±26.4% (très significatif - différence de modélisation probable)

2. **Recommandation principale:**
   Si l'objectif est de valider la **température de sortie**, l'Option 1 est suffisante.
   Les écarts sur ΔP et Q nécessitent une investigation plus poussée (différences de corrélations).

3. **Gain de temps Option 1:**
   79 cas évités = 790 min économisées (13.2h)
