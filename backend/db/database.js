const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Créer ou ouvrir la base de données
const db = new sqlite3.Database(path.join(__dirname, 'candidatures.db'), (err) => {
  if (err) {
    console.error('❌ Erreur connexion DB:', err);
  } else {
    console.log('✅ Base de données SQLite connectée');
    initDatabase();
  }
});

// Fonction pour exécuter la migration
async function runMigrations() {
  try {
    const { migrateCompaniesTable } = require('./migrations');
    await migrateCompaniesTable();
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

// Initialiser les tables
function initDatabase() {
  db.serialize(() => {
    // Table des entreprises
    db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        siret TEXT UNIQUE,
        siren TEXT,
        nom TEXT,
        nom_commercial TEXT,
        adresse TEXT,
        code_postal TEXT,
        ville TEXT,
        code_ape TEXT,
        libelle_ape TEXT,
        effectif TEXT,
        date_creation TEXT,
        website_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des emails trouvés
    db.run(`
      CREATE TABLE IF NOT EXISTS company_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        email TEXT,
        priority INTEGER,
        source_page TEXT,
        is_valid BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);

    // Table des campagnes
    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        template_subject TEXT,
        template_body TEXT,
        cv_filename TEXT,
        emails_per_day INTEGER DEFAULT 40,
        delay_between_emails INTEGER DEFAULT 45,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des envois
    db.run(`
      CREATE TABLE IF NOT EXISTS sent_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER,
        company_id INTEGER,
        email_to TEXT,
        subject TEXT,
        body TEXT,
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        error_message TEXT,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);

    // Table des réponses
    db.run(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sent_email_id INTEGER,
        response_type TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sent_email_id) REFERENCES sent_emails(id)
      )
    `);

    // Table config utilisateur
    db.run(`
      CREATE TABLE IF NOT EXISTS user_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        smtp_type TEXT,
        smtp_email TEXT,
        smtp_password TEXT,
        user_name TEXT,
        user_phone TEXT,
        user_linkedin TEXT,
        user_formation TEXT,
        user_ecole TEXT,
        default_cv_path TEXT
      )
    `);

    // Table de configuration clé-valeur
    db.run(`
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table de blacklist utilisateur (pour éviter les doublons de candidatures)
    db.run(`
      CREATE TABLE IF NOT EXISTS user_company_blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        company_siren TEXT NOT NULL,
        contacted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, company_siren)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erreur création table blacklist:', err);
      } else {
        // Créer un index pour optimiser les recherches
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_blacklist_user
          ON user_company_blacklist(user_id)
        `);
      }
    });

    console.log('✅ Tables créées/vérifiées');

    // Exécuter les migrations après la création des tables
    runMigrations();
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FONCTIONS HELPER POUR LA BLACKLIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Récupérer la liste des SIREN déjà contactés par un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des SIREN
 */
function getUserBlacklist(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT company_siren FROM user_company_blacklist WHERE user_id = ?',
      [userId],
      (err, rows) => {
        if (err) {
          console.error('❌ Erreur récupération blacklist:', err);
          reject(err);
        } else {
          resolve(rows.map(r => r.company_siren));
        }
      }
    );
  });
}

/**
 * Ajouter des entreprises à la blacklist d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @param {Array<String>} sirenList - Liste des SIREN à blacklister
 * @returns {Promise<void>}
 */
function addToBlacklist(userId, sirenList) {
  return new Promise((resolve, reject) => {
    if (!sirenList || sirenList.length === 0) {
      return resolve();
    }

    const placeholders = sirenList.map(() => '(?, ?)').join(',');
    const values = sirenList.flatMap(siren => [userId, siren]);

    const query = `
      INSERT OR IGNORE INTO user_company_blacklist (user_id, company_siren)
      VALUES ${placeholders}
    `;

    db.run(query, values, function(err) {
      if (err) {
        console.error('❌ Erreur ajout blacklist:', err);
        reject(err);
      } else {
        console.log(`✅ ${this.changes} entreprises ajoutées à la blacklist de l'utilisateur ${userId}`);
        resolve();
      }
    });
  });
}

/**
 * Compter le nombre d'entreprises blacklistées par un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @returns {Promise<Number>}
 */
function countBlacklistedCompanies(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM user_company_blacklist WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      }
    );
  });
}

// Exporter la DB et les fonctions helper
module.exports = {
  db,
  getUserBlacklist,
  addToBlacklist,
  countBlacklistedCompanies
};
