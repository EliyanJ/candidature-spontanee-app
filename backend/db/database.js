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

    console.log('✅ Tables créées/vérifiées');
  });
}

module.exports = db;
