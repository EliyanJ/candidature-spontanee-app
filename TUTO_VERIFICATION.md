# 🔍 Guide de vérification des données

## 1️⃣ Inspecter la base de données SQLite

### Option A : Ligne de commande (rapide)

```bash
cd /home/tiliyan/Workspace/candidature-spontanee-app/backend/db

# Ouvrir la base de données
sqlite3 candidatures.db

# Commandes utiles :
.tables                    # Liste des tables
.schema companies          # Structure de la table companies
SELECT * FROM companies LIMIT 5;    # Voir 5 entreprises
SELECT nom, siret, ville FROM companies;  # Colonnes spécifiques
.quit                      # Quitter
```

### Option B : Interface graphique (plus joli)

**Installer DB Browser for SQLite :**
```bash
sudo apt install sqlitebrowser
```

**Ouvrir la base :**
```bash
sqlitebrowser /home/tiliyan/Workspace/candidature-spontanee-app/backend/db/candidatures.db
```

---

## 2️⃣ Vérifier les données d'une entreprise sur le site officiel

### URLs de vérification gouvernementales

Pour chaque entreprise, tu peux vérifier sur :

**Annuaire Entreprises (officiel) :**
```
https://annuaire-entreprises.data.gouv.fr/entreprise/[SIREN]
```

**Exemple : EURO INFORMATION**
```
https://annuaire-entreprises.data.gouv.fr/entreprise/380474494
```

Tu y trouveras :
- ✅ Tous les établissements (ouverts/fermés)
- ✅ Adresses complètes
- ✅ Dirigeants
- ✅ Finances
- ✅ Date de mise à jour

---

## 3️⃣ Vérifier la source des données dans l'API

### Chaque entreprise retournée contient un champ `_meta` :

```javascript
{
  "nom": "EURO INFORMATION DEVELOPPEMENTS",
  "_meta": {
    "source_api": "recherche-entreprises.api.gouv.fr",
    "date_extraction": "2025-10-03T18:00:00.000Z",
    "api_last_update": "2025-10-03T06:35:05",
    "insee_last_update": "2025-08-06T10:01:30",
    "rne_last_update": "2024-05-19T16:49:33",
    "etablissement_siret": "38047449400388",
    "etablissement_etat": "A",
    "is_siege": false,
    "url_verification": "https://annuaire-entreprises.data.gouv.fr/entreprise/380474494"
  }
}
```

**Explication des dates :**
- `date_extraction` : Quand TU as récupéré les données
- `api_last_update` : Dernière mise à jour de l'API
- `insee_last_update` : Dernière mise à jour INSEE (source officielle)
- `rne_last_update` : Dernière mise à jour RNE (Registre National des Entreprises)

**Fraîcheur des données :**
- L'INSEE met à jour les données **quotidiennement**
- L'API `recherche-entreprises.api.gouv.fr` synchronise **toutes les nuits**
- Les données ont généralement **moins de 24h de retard**

---

## 4️⃣ Vérifier manuellement une entreprise sur l'API

```bash
# Chercher par SIREN
curl "https://recherche-entreprises.api.gouv.fr/search?q=820334951" | python3 -m json.tool

# Chercher par nom
curl "https://recherche-entreprises.api.gouv.fr/search?q=LITTLE+WORKER" | python3 -m json.tool

# Chercher avec filtres
curl "https://recherche-entreprises.api.gouv.fr/search?activite_principale=62.01Z&code_postal=75001&per_page=5" | python3 -m json.tool
```

---

## 5️⃣ Cas particuliers détectés

### ⚠️ LITTLE WORKER - Etablissement fermé à Paris

**SIREN :** 820334951
**Siège :** Bordeaux (33000) ✅ OUVERT
**Etablissement Paris 75001 :** SIRET 82033495100036 ❌ FERMÉ

**Solution appliquée :** Le code filtre maintenant les établissements fermés.

### ⚠️ YANN LEGUILLON - Entrepreneur individuel

**SIREN :** 514688720
**Nature :** Entrepreneur individuel (nom de personne)
**Problème :** L'algorithme devinait "yann.fr" (mauvais site)

**Solution appliquée :**
- Ne plus deviner d'URL pour les entrepreneurs individuels
- Forcer l'utilisation du scraping Google pour ces cas

### ⚠️ Etablissements avec code APE différent

Certaines entreprises ont des établissements avec des codes APE différents.

**Exemple :** YANN LEGUILLON
- Siège (75010) : Code APE **62.01Z** (Informatique)
- Etablissement (75001) : Code APE **68.20A** (Immobilier)

**Comportement actuel :** L'API retourne l'entreprise car le siège match, mais l'établissement local peut avoir une activité différente.

**C'est normal ?** OUI - une entreprise peut avoir plusieurs activités selon ses établissements.

---

## 6️⃣ Vérifier les emails scrapés

### Les emails multiples : Normal ou erreur ?

**C'est NORMAL !** Une entreprise peut avoir plusieurs emails :

1. **Email recrutement** : recrutement@entreprise.fr (priorité 1)
2. **Email RH** : rh@entreprise.fr (priorité 1)
3. **Email contact général** : contact@entreprise.fr (priorité 2)
4. **Email info** : info@entreprise.fr (priorité 2)
5. **Emails de départements** : paris@entreprise.fr, dev@entreprise.fr (priorité 3)

**Recommandation :** Utilise l'email de **priorité 1** en premier.

### Vérifier un email trouvé

**Méthode 1 : Recherche manuelle**
1. Va sur le site de l'entreprise
2. Cherche "Contact" ou "Recrutement"
3. Compare avec l'email trouvé

**Méthode 2 : Outil en ligne**
```
https://hunter.io/
```
(Gratuit : 25 requêtes/mois)

---

## 7️⃣ Logs de débogage

### Activer les logs détaillés

Dans `backend/services/sireneService.js`, les logs affichent :
```
🔍 Recherche entreprises: { params }
✅ X entreprises trouvées
```

Dans `backend/services/scraperService.js` :
```
🌐 Recherche Google: [nom entreprise]
✅ Site trouvé: [url]
📧 Scraping emails sur: [url]
✅ X emails trouvés
```

**Voir les logs en temps réel :**
```bash
cd /home/tiliyan/Workspace/candidature-spontanee-app/backend
npm run dev
# Les logs s'affichent dans le terminal
```

---

## 8️⃣ Checklist de vérification

Avant d'envoyer une candidature, vérifie :

- [ ] L'entreprise existe sur annuaire-entreprises.data.gouv.fr
- [ ] L'établissement est **OUVERT** (état administratif = A)
- [ ] L'adresse correspond bien au code postal demandé
- [ ] Le site web trouvé est cohérent avec le nom de l'entreprise
- [ ] L'email a une priorité 1 ou 2
- [ ] L'email est sur le domaine de l'entreprise (pas @gmail.com)

---

## 🆘 En cas de doute

**Pose-toi ces questions :**

1. Est-ce que l'adresse existe sur Google Maps ?
2. Est-ce que le site web correspond au nom de l'entreprise ?
3. Est-ce que l'email est mentionné sur le site officiel ?

**Si tu as un doute → Ne pas envoyer de candidature !**
