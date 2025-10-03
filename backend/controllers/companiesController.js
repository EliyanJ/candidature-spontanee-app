const db = require('../db/database');
const sireneService = require('../services/sireneService');
const scraperService = require('../services/scraperService');

class CompaniesController {
  /**
   * Rechercher des entreprises
   */
  async searchCompanies(req, res) {
    try {
      const { codeApe, ville, codePostal, effectif, nombre } = req.query;

      const companies = await sireneService.searchCompanies({
        codeApe,
        ville,
        codePostal,
        effectif,
        nombre: nombre ? parseInt(nombre) : 20
      });

      res.json({
        success: true,
        count: companies.length,
        data: companies
      });

    } catch (error) {
      console.error('Erreur recherche entreprises:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Sauvegarder une entreprise dans la DB
   */
  async saveCompany(req, res) {
    try {
      const company = req.body;

      const query = `
        INSERT OR REPLACE INTO companies (
          siret, siren, nom, nom_commercial, adresse, code_postal, ville,
          code_ape, libelle_ape, effectif, date_creation, website_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(query, [
        company.siret,
        company.siren,
        company.nom,
        company.nom_commercial,
        company.adresse,
        company.code_postal,
        company.ville,
        company.code_ape,
        company.libelle_ape,
        company.effectif,
        company.date_creation,
        company.website_url || null
      ], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        res.json({
          success: true,
          companyId: this.lastID
        });
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir toutes les entreprises sauvegardées
   */
  async getSavedCompanies(req, res) {
    try {
      const query = 'SELECT * FROM companies ORDER BY created_at DESC';

      db.all(query, [], (err, rows) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        res.json({
          success: true,
          count: rows.length,
          data: rows
        });
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Trouver et scraper les emails d'une entreprise
   */
  async scrapeCompanyEmails(req, res) {
    try {
      const { companyId } = req.params;

      // Récupérer l'entreprise
      db.get('SELECT * FROM companies WHERE id = ?', [companyId], async (err, company) => {
        if (err || !company) {
          return res.status(404).json({
            success: false,
            message: 'Entreprise non trouvée'
          });
        }

        // Trouver le site web si pas déjà fait
        let websiteUrl = company.website_url;

        if (!websiteUrl) {
          websiteUrl = await scraperService.findWebsite(company.nom, company.ville);

          if (websiteUrl) {
            // Sauvegarder l'URL
            db.run('UPDATE companies SET website_url = ? WHERE id = ?', [websiteUrl, companyId]);
          }
        }

        if (!websiteUrl) {
          return res.json({
            success: false,
            message: 'Site web non trouvé',
            guessedEmails: scraperService.guessEmails(`https://${company.nom.toLowerCase().replace(/\s/g, '')}.fr`)
          });
        }

        // Scraper les emails
        let emails = await scraperService.scrapeEmails(websiteUrl);

        // Si aucun email trouvé, deviner
        if (emails.length === 0) {
          emails = scraperService.guessEmails(websiteUrl);
        }

        // Sauvegarder les emails dans la DB
        for (const emailData of emails) {
          db.run(
            'INSERT INTO company_emails (company_id, email, priority, source_page) VALUES (?, ?, ?, ?)',
            [companyId, emailData.email, emailData.priority, websiteUrl]
          );
        }

        res.json({
          success: true,
          websiteUrl,
          emails
        });
      });

    } catch (error) {
      console.error('Erreur scraping:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir les emails d'une entreprise
   */
  async getCompanyEmails(req, res) {
    try {
      const { companyId } = req.params;

      db.all(
        'SELECT * FROM company_emails WHERE company_id = ? ORDER BY priority ASC',
        [companyId],
        (err, emails) => {
          if (err) {
            return res.status(500).json({ success: false, message: err.message });
          }

          res.json({
            success: true,
            emails
          });
        }
      );

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CompaniesController();
