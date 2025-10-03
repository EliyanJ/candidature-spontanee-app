# 📧 Application d'Envoi de Candidatures Spontanées - MVP

Application web complète pour automatiser l'envoi de candidatures spontanées aux entreprises françaises.

## 🎯 Fonctionnalités

### ✅ Implémenté dans ce MVP

- **🔍 Recherche d'entreprises** : Via l'API Sirene (INSEE) avec filtres (secteur, localisation, taille)
- **📧 Scraping d'emails** : Extraction automatique des emails de contact depuis les sites web
- **✉️ Envoi automatisé** : Système d'envoi avec gestion de file d'attente et délais personnalisables
- **📊 Dashboard** : Statistiques et suivi des campagnes en temps réel
- **⚙️ Configuration** : Paramétrage SMTP (Gmail, Outlook) et profil utilisateur
- **📎 Upload de CV** : Support des fichiers PDF en pièce jointe

## 🏗️ Architecture

```
candidature-spontanee-app/
├── backend/          # API Node.js + Express
│   ├── controllers/  # Logique métier
│   ├── routes/       # Routes API
│   ├── services/     # Services (Sirene, Scraping, Email)
│   ├── models/       # Modèles de données
│   └── db/          # Base SQLite
└── frontend/         # Interface React
    └── src/
        ├── components/  # Composants UI
        ├── pages/       # Pages
        └── services/    # API client
```

## 🚀 Installation et Démarrage

### Prérequis

- Node.js (v16+)
- npm ou yarn
- Compte Gmail avec mot de passe d'application

### 1. Installation Backend

```bash
cd backend
npm install
```

### 2. Configuration Backend

Créez un fichier `.env` dans le dossier `backend/` :

```env
# API Sirene (INSEE)
SIRENE_API_KEY=votre_token_api_sirene

# Configuration Email
SMTP_TYPE=gmail
SMTP_EMAIL=votre.email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_application

# Configuration serveur
PORT=3001
NODE_ENV=development
```

**Important :** Pour obtenir votre token API Sirene :
1. Allez sur https://api.insee.fr/
2. Créez un compte gratuit
3. Créez une application
4. Récupérez votre token

**Important :** Pour Gmail, créez un mot de passe d'application :
1. Allez sur https://myaccount.google.com/apppasswords
2. Créez un nouveau mot de passe d'application
3. Utilisez ce mot de passe (PAS votre mot de passe principal)

### 3. Démarrer le Backend

```bash
cd backend
npm start
```

Le serveur démarre sur `http://localhost:3001`

### 4. Installation Frontend

```bash
cd frontend
npm install
```

### 5. Démarrer le Frontend

```bash
cd frontend
npm start
```

L'application s'ouvre sur `http://localhost:3000`

## 📖 Guide d'utilisation

### Étape 1 : Configuration (onglet ⚙️ Config)

1. Configurez vos identifiants email (Gmail recommandé)
2. Testez la connexion avec le bouton "Tester la connexion"
3. Remplissez vos informations personnelles (optionnel mais recommandé)

### Étape 2 : Recherche d'entreprises (onglet 🔍 Recherche)

1. Entrez vos critères de recherche :
   - **Code APE** : 6201 pour programmation, 7022 pour conseil, etc.
   - **Ville** : PARIS, LYON, MARSEILLE...
   - **Code postal** : 75001, 69001...
   - **Taille** : 10-19 salariés, 20-49 salariés...

2. Cliquez sur "🔍 Rechercher"

3. Sélectionnez les entreprises qui vous intéressent (cliquez sur les cartes)

4. Cliquez sur "💾 Sauvegarder la sélection"

### Étape 3 : Trouver les emails (onglet 📋 Entreprises)

1. Pour chaque entreprise sauvegardée, cliquez sur "📧 Trouver emails"
2. L'application va :
   - Chercher le site web de l'entreprise sur Google
   - Scraper les pages pour trouver les emails
   - Prioriser les emails (recrutement@, rh@, contact@...)

### Étape 4 : Créer une campagne (onglet ✉️ Email)

1. Personnalisez votre email :
   - Modifiez l'objet
   - Modifiez le corps du message
   - Utilisez les variables disponibles (cliquez pour les insérer)

2. Uploadez votre CV (format PDF uniquement)

3. Configurez les paramètres d'envoi :
   - Emails par jour (recommandé : 40)
   - Délai entre envois (recommandé : 45 secondes)

4. Cliquez sur "👁️ Aperçu" pour prévisualiser

5. Cliquez sur "💾 Créer la campagne"

6. Cliquez sur "🚀 Lancer l'envoi"

### Étape 5 : Suivre les envois (onglet 📊 Dashboard)

1. Visualisez les statistiques globales
2. Consultez l'état de chaque campagne
3. Suivez le taux de succès des envois

## 🔧 API Backend

### Endpoints disponibles

#### Entreprises

```
GET  /api/companies/search           - Rechercher des entreprises
POST /api/companies                  - Sauvegarder une entreprise
GET  /api/companies                  - Obtenir toutes les entreprises
POST /api/companies/:id/scrape-emails - Scraper les emails
GET  /api/companies/:id/emails       - Obtenir les emails
```

#### Campagnes

```
POST /api/campaigns                  - Créer une campagne
GET  /api/campaigns                  - Obtenir toutes les campagnes
POST /api/campaigns/:id/start        - Lancer une campagne
GET  /api/campaigns/:id/stats        - Obtenir les stats
```

#### Configuration

```
POST /api/config/email              - Configurer l'email
POST /api/config/email/test         - Tester la connexion
POST /api/upload-cv                 - Upload CV
```

## 📚 Variables disponibles dans les templates

- `{nom_entreprise}` : Nom de l'entreprise
- `{ville}` : Ville de l'entreprise
- `{secteur_activite}` : Secteur d'activité (libellé APE)
- `{votre_nom}` : Votre nom complet
- `{votre_telephone}` : Votre numéro de téléphone
- `{votre_linkedin}` : Votre profil LinkedIn
- `{votre_formation}` : Votre formation
- `{date}` : Date du jour

## ⚠️ Limites et bonnes pratiques

### Limites Gmail

- **500 emails maximum par jour**
- 100 destinataires maximum par email
- Recommandé : **40-50 emails/jour** pour éviter le spam

### Bonnes pratiques

✅ **À FAIRE :**
- Utiliser un délai d'au moins 30 secondes entre les envois
- Envoyer uniquement pendant les heures ouvrables (9h-18h)
- Personnaliser les emails avec les variables
- Vérifier que le CV est à jour

❌ **À ÉVITER :**
- Envoyer plus de 50 emails/jour au début
- Utiliser des templates trop génériques
- Spammer les mêmes entreprises

## 🔒 Sécurité

- Les identifiants sont stockés localement dans SQLite
- Utilisez TOUJOURS un mot de passe d'application Gmail, jamais votre mot de passe principal
- Ne partagez jamais vos identifiants
- La base de données est locale (fichier `backend/db/candidatures.db`)

## 🐛 Dépannage

### Le backend ne démarre pas

- Vérifiez que le port 3001 n'est pas déjà utilisé
- Vérifiez que le fichier `.env` existe et contient les bonnes variables
- Installez les dépendances : `npm install`

### Le frontend ne se connecte pas au backend

- Vérifiez que le backend est bien démarré
- Vérifiez l'URL dans `frontend/src/services/api.js`

### Les emails ne s'envoient pas

- Testez la connexion dans l'onglet Configuration
- Vérifiez que vous utilisez un mot de passe d'application Gmail
- Vérifiez que l'authentification 2 facteurs est activée sur Gmail

### Le scraping ne trouve pas d'emails

- Certains sites sont protégés contre le scraping
- L'application propose des emails "devinés" (contact@, rh@...)
- Vous pouvez vérifier manuellement sur le site de l'entreprise

## 🚧 Améliorations futures (hors MVP)

- ⏰ Planification d'envois (heures précises)
- 🤖 Génération d'emails par IA
- 📧 Détection automatique de réponses
- 📊 Export des statistiques en CSV
- 🔔 Notifications desktop
- 🌐 Multi-comptes email
- 📱 Version mobile

## 📄 Licence

Ce projet est un MVP à usage éducatif et personnel.

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez la section Dépannage ci-dessus
2. Consultez les logs du backend (terminal)
3. Vérifiez la console du navigateur (F12)

---

**Bon courage pour vos candidatures ! 🚀**
