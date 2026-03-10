# VÉRIFICATION RAPIDE - 30 MINUTES

## ⚡ UNE SEULE COMMANDE

```bash
node tests/automated_verification.js
```

**C'est tout!** Le système automatique fait:

✅ Validation ~15 constantes physiques critiques  
✅ Validation 25 conversions d'unités  
✅ Exécution 14 tests unitaires  
✅ Validation externe (si données disponibles)  
✅ Génération rapport concis à signer

**Temps**: 1-2 minutes d'exécution + 10-15 minutes de lecture + signature

---

## 📖 GUIDE COMPLET

Voir: **[QUICK_VERIFICATION_GUIDE.md](QUICK_VERIFICATION_GUIDE.md)** (3 pages)

---

## 📄 FICHIERS CLÉS

| Fichier                              | Description                            |
| ------------------------------------ | -------------------------------------- |
| `tests/automated_verification.js`    | Script automatique principal           |
| `tests/verification_references.json` | Valeurs de référence (Perry's, CODATA) |
| `docs/AUTOMATED_VERIFICATION_*.md`   | Rapport généré (à signer)              |

---

## 🧭 Version applicative

- Source unique: `js/constants/version.js`
- UI: `window.ThermaFlowVersion.VERSION`
- Scripts Node: `require('./js/constants/version.js').VERSION`
- `package.json`: synchroniser manuellement avec `VERSION`

**Important**: ne jamais hardcoder la version dans les UI/tests/scripts.

---

## 🎯 WORKFLOW SIMPLIFIÉ

```
1. Exécuter     → node tests/automated_verification.js (15 min)
2. Lire rapport → docs/AUTOMATED_VERIFICATION_*.md    (15 min)
3. Signer       → Section CERTIFICATION                (2 min)
```

**Total: ~30 minutes**

---

## ✅ CRITÈRES DE SUCCÈS

Pour signer le rapport:

- ✅ 100% constantes critiques validées (dont Gnielinski 12.7)
- ✅ 100% conversions d'unités correctes
- ✅ 100% tests unitaires passent

---

## 🔄 SI ÉCHECS

1. Consulter section "Avertissements" du rapport
2. Corriger le code
3. Ré-exécuter: `node tests/automated_verification.js`
4. Répéter jusqu'à 100% PASS

**⚠️ NE PAS SIGNER tant qu'il y a des échecs**

---

## 📞 AIDE

**Script ne marche pas?**  
→ Vérifier: Node.js installé, dans le bon répertoire

**Test échoue?**  
→ Voir logs: `tests/error_*.log`

**Constante non trouvée?**  
→ Vérifier pattern dans code (const NOM = valeur)

**Questions équations?**  
→ Consulter Perry's: `docs/references/*.pdf`

---

**Vérification scientifique rigoureuse en 30 minutes ⚡**

_ThermaFlow v1.2.0 - Automated Verification System_
