# RAPPORT DE VÉRIFICATION AUTOMATIQUE - THERMAFLOW

**Date**: 2025-11-03 12:17:53  
**Version**: 1.0.1  
**Durée**: 0.0 minutes  
**Statut global**: ÉCHECS DÉTECTÉS ✗

---

## RÉSUMÉ EXÉCUTIF

| Catégorie | Total | Pass | Fail | Taux |
|-----------|-------|------|------|------|
| **Constantes physiques** | 14 | 14 | 0 | 100.0% |
| **Conversions d'unités** | 25 | 25 | 0 | 100.0% |
| **Tests unitaires** | 14 | 13 | 1 | 92.9% |


---

## 1. CONSTANTES PHYSIQUES

| Constante | Status | Valeur code | Valeur référence | Source |
|-----------|--------|-------------|------------------|--------|
| STEFAN_BOLTZMANN | ✓ | 5.6704e-8 | 5.6704e-8 | radiation.js |
| GRAVITY | ✓ | 9.8100e+0 | 9.8100e+0 | pressure-basic.js |
| RE_LAMINAR_MAX | ✓ | 2.3000e+3 | 2.3000e+3 | flow-regimes.js |
| RE_TURBULENT_MIN | ✓ | 4.0000e+3 | 4.0000e+3 | flow-regimes.js |
| FRICTION_LAMINAR_CONSTANT | ✓ | 6.4000e+1 | 6.4000e+1 | friction-factor.js |
| COLEBROOK_CONSTANT_3_7 | ✓ | 3.7000e+0 | 3.7000e+0 | friction-factor.js |
| COLEBROOK_CONSTANT_2_51 | ✓ | 2.5100e+0 | 2.5100e+0 | friction-factor.js |
| GNIELINSKI_CONSTANT_12_7 | ✓ | 1.2700e+1 | 1.2700e+1 | nusselt-internal.js |
| GNIELINSKI_CONSTANT_1000 | ✓ | 1.0000e+3 | 1.0000e+3 | nusselt-internal.js |
| DITTUS_BOELTER_CONSTANT | ✓ | 2.3000e-2 | 2.3000e-2 | nusselt-internal.js |
| NUSSELT_LAMINAR_CONSTANT_T | ✓ | 3.6600e+0 | 3.6600e+0 | nusselt-internal.js |
| NUSSELT_LAMINAR_CONSTANT_Q | ✓ | 4.3600e+0 | 4.3600e+0 | nusselt-internal.js |
| CHURCHILL_BERNSTEIN_282000 | ✓ | 2.8200e+5 | 2.8200e+5 | nusselt-external.js |
| TEMP_CONVERSION_CONSTANT | ✓ | 2.7315e+2 | 2.7315e+2 | radiation.js |

---

## 2. CONVERSIONS D'UNITÉS


### ✓ BAR_TO_PA

- ✓ 1 → 1.0000e+5 (attendu: 1.0000e+5)
- ✓ 5 → 5.0000e+5 (attendu: 5.0000e+5)
- ✓ 2.5 → 2.5000e+5 (attendu: 2.5000e+5)

### ✓ CELSIUS_TO_KELVIN

- ✓ 0 → 2.7315e+2 (attendu: 2.7315e+2)
- ✓ 20 → 2.9315e+2 (attendu: 2.9315e+2)
- ✓ -10 → 2.6315e+2 (attendu: 2.6315e+2)
- ✓ 100 → 3.7315e+2 (attendu: 3.7315e+2)

### ✓ LMIN_TO_M3S

- ✓ 1 → 1.6667e-5 (attendu: 1.6667e-5)
- ✓ 60 → 1.0000e-3 (attendu: 1.0000e-3)
- ✓ 100 → 1.6667e-3 (attendu: 1.6667e-3)

### ✓ MM_TO_M

- ✓ 1 → 1.0000e-3 (attendu: 1.0000e-3)
- ✓ 0.045 → 4.5000e-5 (attendu: 4.5000e-5)
- ✓ 50 → 5.0000e-2 (attendu: 5.0000e-2)

### ✓ M3H_TO_USGPM

- ✓ 1 → 4.4029e+0 (attendu: 4.4029e+0)
- ✓ 10 → 4.4029e+1 (attendu: 4.4029e+1)
- ✓ 7.2 → 3.1701e+1 (attendu: 3.1701e+1)

### ✓ USGPM_TO_M3H

- ✓ 1 → 2.2712e-1 (attendu: 2.2712e-1)
- ✓ 20 → 4.5425e+0 (attendu: 4.5425e+0)
- ✓ 44.0286745 → 1.0000e+1 (attendu: 1.0000e+1)

### ✓ KPAG_TO_PSIG

- ✓ 1 → 1.4504e-1 (attendu: 1.4504e-1)
- ✓ 100 → 1.4504e+1 (attendu: 1.4504e+1)
- ✓ 300 → 4.3511e+1 (attendu: 4.3511e+1)

### ✓ PSIG_TO_KPAG

- ✓ 1 → 6.8948e+0 (attendu: 6.8948e+0)
- ✓ 50 → 3.4474e+2 (attendu: 3.4474e+2)
- ✓ 14.5037738 → 1.0000e+2 (attendu: 1.0000e+2)

---

## 3. TESTS UNITAIRES

| Test | Status |
|------|--------|
| test_boundary_conditions.js | ✓ PASS |
| test_fluid_properties.js | ✓ PASS |
| test_freeze_detector.js | ✓ PASS |
| test_gnielinski_roughness.js | ✓ PASS |
| test_integration.js | ✓ PASS |
| test_phase1_heat_transfer.js | ✓ PASS |
| test_phase1_hydraulics.js | ✓ PASS |
| test_phase1_materials.js | ✓ PASS |
| test_pipe_network.js | ✓ PASS |
| test_pipe_segment.js | ✓ PASS |
| test_richardson_convection.js | ✓ PASS |
| test_storage_persistence.js | ✓ PASS |
| test_temperature_iteration.js | ✓ PASS |
| test_unit_conversions.js | ✗ FAIL |

### Tests en échec

**test_unit_conversions.js**:
```
Command failed: node tests/test_unit_conversions.js
❌ Plages débit cohérentes entre unités
   Max débit: attendu 6000, obtenu 5999.999877246522 (écart: 0.00012275347762624733)
❌ Format débit m³/h
   Format m³/h: attendu 12.35 m³/h, obtenu 12.3 m³/h
❌ Format débit USGPM
   Format USGPM: attendu 54.32 USGPM, obtenu 54 USGPM

```


---

## CERTIFICATION

✗ **VÉRIFICATION NON VALIDÉE**

Des échecs ont été détectés. Corriger les problèmes ci-dessus avant de signer.

**NE PAS CERTIFIER tant que des échecs persistent.**

**Nom**: ________________________________

**Titre/Position**: ________________________________

**Signature**: ________________________________

**Date**: ________________________________

---

*Rapport généré automatiquement le 2025-11-03 12:17:53*  
*Durée d'exécution: 0.0 minutes*  
*ThermaFlow v1.0.1 - Automated Verification System*
