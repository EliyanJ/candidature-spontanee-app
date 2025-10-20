# 🚀 Améliorations Version 2.0 - Application Candidatures Spontanées

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Nouvelles fonctionnalités](#nouvelles-fonctionnalités)
3. [Architecture Backend](#architecture-backend)
4. [Nouvelles routes API](#nouvelles-routes-api)
5. [Guide de migration Frontend](#guide-de-migration-frontend)
6. [Tests et validation](#tests-et-validation)

---

## 🎯 Vue d'ensemble

Cette version 2.0 apporte des améliorations majeures pour :
- ✅ **Éviter la saturation** des entreprises avec un système de randomisation intelligent
- ✅ **Éliminer les doublons** avec une blacklist par utilisateur
- ✅ **Améliorer l'UX** avec des filtres avancés et intuitifs
- ✅ **Respecter l'API** avec gestion du rate limit et pagination

---

## 🆕 Nouvelles fonctionnalités

### 1. 🎲 Randomisation intelligente (×6)

**Problème résolu :** Sans randomisation, tous les utilisateurs ciblent les 25 mêmes entreprises.

**Solution :**
- L'utilisateur demande 20 entreprises
- Le système récupère **120 entreprises** (×6)
- Randomisation Fisher-Yates pour distribution équitable
- Retour de 20 entreprises aléatoires

**Impact :**
- Avant : 10 000 candidatures sur 25 entreprises (400/entreprise)
- Après : 10 000 candidatures sur 120 entreprises (~83/entreprise)

### 2. 🚫 Blacklist par utilisateur

**Fonctionnement :**
- Chaque entreprise contactée est ajoutée à la blacklist de l'utilisateur
- Lors des recherches suivantes, ces entreprises sont automatiquement exclues
- Aucun doublon possible pour un même utilisateur

**Avantages :**
- Pas de recontact d'entreprises déjà sollicitées
- Exploration progressive de nouvelles opportunités
- Respect des entreprises

### 3. 🏙️ Gestion des arrondissements

**Villes supportées :**
- **Paris** : 20 arrondissements (75001 → 75020)
- **Lyon** : 9 arrondissements (69001 → 69009)
- **Marseille** : 16 arrondissements (13001 → 13016)

**Fonctionnement :**
```javascript
Input: "Paris"
→ API: code_postal=75001,75002,...,75020

Input: "75008"
→ API: code_postal=75008
```

**Correction orthographique :**
- "pari" → Suggestion : "paris"
- Distance de Levenshtein (max 3 caractères)

### 4. 📊 Secteurs d'activité organisés

**14 secteurs disponibles :**

| Secteur | Codes APE | Exemples |
|---------|-----------|----------|
| 💻 Tech & Digital | 62.01Z, 62.02A, 63.11Z... | Programmation, Conseil IT |
| 🏢 Conseil & Services | 70.22Z, 71.12B, 78.10Z... | Conseil affaires, Recrutement |
| 📊 Marketing & Com | 73.11Z, 73.20Z... | Publicité, Études de marché |
| 🏪 Commerce | 47.91A, 46.90Z... | E-commerce, Gros |
| 🏦 Banque & Finance | 64.19Z, 66.12Z... | Banques, Courtage |
| 🎓 Education | 85.42Z, 85.59A... | Enseignement, Formation |
| 🏗️ BTP | 41.10A, 43.21A... | Construction, Installation |
| 🏠 Immobilier | 68.31Z, 68.32A... | Agences, Administration |
| ... | ... | ... |

### 5. 👥 Filtrage par taille d'entreprise

**4 catégories :**

| Catégorie | Effectifs | Codes API |
|-----------|-----------|-----------|
| TPE | 1-9 salariés | 01, 02, 03 |
| Petite entreprise | 10-49 salariés | 11, 12 |
| Moyenne entreprise | 50-249 salariés | 21, 22, 31 |
| Grande entreprise | 250+ salariés | 32, 41, 42, 51, 52, 53 |

**Exclusion automatique :**
- Entrepreneurs individuels (0 salarié) exclus par défaut
- Paramètre `est_entrepreneur_individuel=false`

---

## 🏗️ Architecture Backend

### Nouveaux fichiers créés

```
backend/
├── constants/
│   ├── apeSectors.js        # 14 secteurs avec codes APE
│   ├── cities.js            # Gestion arrondissements + villes
│   └── effectifs.js         # Tranches d'effectifs salariés
├── controllers/
│   └── constantsController.js  # API pour exposer les constantes
├── routes/
│   └── constants.js         # Routes /api/constants/*
└── db/
    └── database.js          # + table blacklist + fonctions helper
```

### Fichiers modifiés

```
backend/
├── services/
│   └── sireneService.js     # Refactorisation complète ⭐
├── controllers/
│   ├── companiesController.js   # Support blacklist + nouveaux filtres
│   └── campaignsController.js   # Ajout auto à blacklist
└── server.js                # + route constants
```

### Table SQL ajoutée

```sql
CREATE TABLE user_company_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  company_siren TEXT NOT NULL,
  contacted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, company_siren)
);

CREATE INDEX idx_blacklist_user ON user_company_blacklist(user_id);
```

---

## 🔌 Nouvelles routes API

### 1. `/api/constants/all` (GET)

Récupère toutes les constantes en une seule requête.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "apeSectors": [...],
    "effectifs": [...],
    "citiesWithArrondissements": {...},
    "mainCities": [...]
  }
}
```

### 2. `/api/constants/ape-sectors` (GET)

Liste des secteurs APE organisés.

**Réponse :**
```json
{
  "success": true,
  "sectors": [
    {
      "id": "tech_digital",
      "label": "💻 Tech & Digital",
      "icon": "💻",
      "codes": [
        { "value": "62.01Z", "label": "Programmation informatique" },
        ...
      ]
    },
    ...
  ]
}
```

### 3. `/api/constants/effectifs` (GET)

Tranches d'effectifs disponibles.

**Réponse :**
```json
{
  "success": true,
  "tranches": [
    {
      "id": "tpe",
      "label": "TPE (1-9 salariés)",
      "codes": ["01", "02", "03"],
      "min": 1,
      "max": 9
    },
    ...
  ]
}
```

### 4. `/api/constants/resolve-location` (GET)

Résoudre une ville ou code postal.

**Paramètres :**
- `location` (string) : Ville ou code postal

**Exemples :**

```bash
GET /api/constants/resolve-location?location=Paris

{
  "success": true,
  "type": "ville_arrondissements",
  "ville": "Paris",
  "codePostaux": ["75001", "75002", ..., "75020"],
  "count": 20
}
```

```bash
GET /api/constants/resolve-location?location=75008

{
  "success": true,
  "type": "code_postal",
  "codePostaux": ["75008"],
  "count": 1
}
```

```bash
GET /api/constants/resolve-location?location=pari

{
  "success": false,
  "type": "ville_inconnue",
  "error": "Ville 'pari' non trouvée",
  "suggestions": ["paris"],
  "codePostaux": []
}
```

### 5. `/api/companies/search` (GET) - Mis à jour

**Nouveaux paramètres :**

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `location` | string | Ville ou code postal unifié | `Paris`, `75008` |
| `tranche_effectif_salarie` | string | Codes effectifs (CSV) | `11,12,21` |
| `nature_juridique` | string | Code nature juridique | `5710` (SAS) |
| `categorie_entreprise` | string | PME, ETI, GE | `PME` |
| `userId` | string | ID utilisateur (blacklist) | `user123` |
| `nombre` | number | Nombre souhaité | `20` |

**Exemple complet :**
```bash
GET /api/companies/search?
  location=Paris&
  codeApe=62.01Z&
  tranche_effectif_salarie=11,12,21&
  nombre=20&
  userId=user123
```

**Réponse :**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "siret": "12345678901234",
      "siren": "123456789",
      "nom": "ENTREPRISE EXEMPLE SAS",
      "adresse": "1 RUE DE LA PAIX",
      "code_postal": "75008",
      "ville": "PARIS",
      "code_ape": "62.01Z",
      "libelle_ape": "Programmation informatique",
      "effectif": "10 à 19 salariés",
      "effectif_code": "11",
      "nature_juridique": "5710",
      ...
    },
    ...
  ]
}
```

### 6. `/api/campaigns/:id/start` (POST) - Mis à jour

**Nouveau paramètre body :**
```json
{
  "companyIds": [1, 2, 3, ...],
  "userId": "user123"  // ← Nouveau !
}
```

**Fonctionnement :**
1. Envoi des emails
2. Pour chaque entreprise contactée avec succès :
   - Récupération du SIREN
   - Ajout automatique à la blacklist de l'utilisateur

---

## 🎨 Guide de migration Frontend

### Étape 1 : Récupérer les constantes au chargement

```javascript
// Dans App.js ou SearchCompanies.js
import { useEffect, useState } from 'react';
import api from './services/api';

function SearchCompanies() {
  const [constants, setConstants] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConstants() {
      try {
        const response = await api.get('/constants/all');
        setConstants(response.data.data);
      } catch (error) {
        console.error('Erreur chargement constantes:', error);
      } finally {
        setLoading(false);
      }
    }

    loadConstants();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      {/* Formulaire de recherche */}
    </div>
  );
}
```

### Étape 2 : Créer le select pour les secteurs APE

```javascript
function SectorSelect({ value, onChange, sectors }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Tous les secteurs</option>
      {sectors.map(sector => (
        <optgroup key={sector.id} label={sector.label}>
          {sector.codes.map(code => (
            <option key={code.value} value={code.value}>
              {code.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// Utilisation
<SectorSelect
  value={filters.codeApe}
  onChange={(val) => setFilters({...filters, codeApe: val})}
  sectors={constants.apeSectors}
/>
```

### Étape 3 : Input de localisation avec validation

```javascript
function LocationInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [validationError, setValidationError] = useState('');

  const handleBlur = async () => {
    if (!value) return;

    try {
      const response = await api.get(`/constants/resolve-location?location=${value}`);

      if (!response.data.success) {
        setValidationError(response.data.error);
        setSuggestions(response.data.suggestions || []);
      } else {
        setValidationError('');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erreur validation localisation:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Ville ou code postal (ex: Paris, 75008)"
      />

      {validationError && (
        <div style={{ color: 'red' }}>
          {validationError}
          {suggestions.length > 0 && (
            <div>
              Suggestions : {suggestions.map(s => (
                <button key={s} onClick={() => onChange(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Étape 4 : Select pour les effectifs

```javascript
function EffectifSelect({ value, onChange, tranches }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Toutes les tailles</option>
      {tranches.map(tranche => (
        <option key={tranche.id} value={tranche.codes.join(',')}>
          {tranche.label}
        </option>
      ))}
    </select>
  );
}

// Utilisation
<EffectifSelect
  value={filters.tranche_effectif_salarie}
  onChange={(val) => setFilters({...filters, tranche_effectif_salarie: val})}
  tranches={constants.effectifs}
/>
```

### Étape 5 : Appel API de recherche avec userId

```javascript
async function searchCompanies() {
  const userId = localStorage.getItem('userId') || generateUserId();

  try {
    const params = {
      location: filters.location,
      codeApe: filters.codeApe,
      tranche_effectif_salarie: filters.tranche_effectif_salarie,
      nombre: 20,
      userId: userId  // ← Important !
    };

    const response = await api.get('/companies/search', { params });

    setCompanies(response.data.data);
  } catch (error) {
    console.error('Erreur recherche:', error);
  }
}

// Générer un userId unique pour l'utilisateur
function generateUserId() {
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('userId', id);
  return id;
}
```

### Étape 6 : Lancer une campagne avec userId

```javascript
async function startCampaign(campaignId, companyIds) {
  const userId = localStorage.getItem('userId');

  try {
    await api.post(`/campaigns/${campaignId}/start`, {
      companyIds: companyIds,
      userId: userId  // ← Important !
    });

    console.log('Campagne lancée avec succès');
    // Les entreprises seront automatiquement ajoutées à la blacklist
  } catch (error) {
    console.error('Erreur lancement campagne:', error);
  }
}
```

---

## ✅ Tests et validation

### Test 1 : Vérifier la randomisation

```bash
# Terminal 1 (User A)
curl "http://localhost:3001/api/companies/search?location=Paris&codeApe=62.01Z&nombre=5&userId=userA"

# Terminal 2 (User B)
curl "http://localhost:3001/api/companies/search?location=Paris&codeApe=62.01Z&nombre=5&userId=userB"

# Résultat attendu : Les 2 listes doivent être DIFFÉRENTES
```

### Test 2 : Vérifier la blacklist

```bash
# 1. Recherche initiale
curl "http://localhost:3001/api/companies/search?location=Paris&codeApe=62.01Z&nombre=5&userId=test_user"
# Note: SIREN des entreprises retournées

# 2. Simuler l'envoi d'emails
curl -X POST "http://localhost:3001/api/campaigns/1/start" \
  -H "Content-Type: application/json" \
  -d '{"companyIds": [1,2,3], "userId": "test_user"}'

# 3. Nouvelle recherche
curl "http://localhost:3001/api/companies/search?location=Paris&codeApe=62.01Z&nombre=5&userId=test_user"

# Résultat attendu : Les entreprises de l'étape 1 ne doivent PAS apparaître
```

### Test 3 : Vérifier la résolution de localisation

```bash
# Ville avec arrondissements
curl "http://localhost:3001/api/constants/resolve-location?location=Paris"
# → 20 codes postaux

# Code postal unique
curl "http://localhost:3001/api/constants/resolve-location?location=75008"
# → 1 code postal

# Ville inconnue
curl "http://localhost:3001/api/constants/resolve-location?location=pari"
# → Suggestions: ["paris"]
```

### Test 4 : Vérifier le rate limit

```bash
# Lancer une recherche qui nécessite 10 pages (250 entreprises)
time curl "http://localhost:3001/api/companies/search?location=Paris&codeApe=62.01Z&nombre=250&userId=test"

# Temps attendu : ~5-6 secondes (10 pages × 500ms + 9 délais × 150ms)
# Vérifier les logs : Aucun code 429
```

### Test 5 : Vérifier les constantes

```bash
# Récupérer toutes les constantes
curl "http://localhost:3001/api/constants/all" | json_pp

# Vérifier les secteurs APE
curl "http://localhost:3001/api/constants/ape-sectors" | json_pp

# Vérifier les effectifs
curl "http://localhost:3001/api/constants/effectifs" | json_pp
```

---

## 📊 Logs de débogage

Le système affiche des logs détaillés pour suivre l'exécution :

```
╔════════════════════════════════════════════════╗
║   🎲 RANDOMISATION INTELLIGENTE ACTIVÉE      ║
╚════════════════════════════════════════════════╝
📊 User demande      : 20 entreprises
📦 Pool à récupérer : 120 entreprises (×6)
⏱️  Temps estimé     : ~4.2s
👤 User ID          : user123 (blacklist activée)

📄 Récupération de 5 pages (25 entreprises/page)...
  ✓ Page 1/5 : 25 entreprises récupérées
  ✓ Page 2/5 : 25 entreprises récupérées
  ✓ Page 3/5 : 25 entreprises récupérées
  ✓ Page 4/5 : 25 entreprises récupérées
  ✓ Page 5/5 : 20 entreprises récupérées
  ℹ️  120 entreprises récupérées (objectif atteint)
✅ 120 entreprises récupérées en 4.1s
🚫 15 entreprises déjà contactées exclues
   Reste : 105 entreprises disponibles
🎲 Pool randomisé avec Fisher-Yates
🎯 Retour de 20 entreprises aléatoires
⏱️  Temps total : 4.1s
```

---

## 🚀 Prochaines étapes

### Pour le frontend (TODO)

1. **Créer le nouveau formulaire de recherche**
   - Select secteurs APE organisés
   - Input localisation avec validation
   - Select taille d'entreprise
   - Système de génération/stockage userId

2. **Afficher les entreprises**
   - Indicateur "Randomisées" dans l'UI
   - Badge "Nouvelle entreprise" vs "Déjà vue"
   - Temps de recherche affiché

3. **Dashboard blacklist**
   - Nombre d'entreprises contactées
   - Liste des entreprises blacklistées
   - Option "Retirer de la blacklist"

### Améliorations futures (optionnel)

- 🔍 Recherche avancée multi-critères (AND/OR)
- 📈 Statistiques de distribution des candidatures
- 🗺️ Carte interactive des entreprises
- 📧 Détection automatique de réponses positives
- 🤖 Suggestion IA de secteurs pertinents

---

## 📞 Support

Pour toute question sur ces améliorations :
1. Consulter les logs du backend (terminal)
2. Tester les routes API avec curl/Postman
3. Vérifier la table `user_company_blacklist` dans SQLite

**Bon courage pour l'intégration frontend ! 🚀**
