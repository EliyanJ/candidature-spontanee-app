const { db, getUserBlacklist, addToBlacklist } = require('../db/database');
const sireneService = require('../services/sireneService');
const scraperService = require('../services/scraperService');

class CompaniesController {
  /**
   * Rechercher des entreprises avec randomisation et blacklist
   */
  async searchCompanies(req, res) {
    try {
      const {
        codeApe,
        location, // Nouveau : ville ou code postal unifié
        codePostal, // Legacy
        tranche_effectif_salarie,
        nature_juridique,
        categorie_entreprise,
        nombre,
        scrapeWebsites,
        scrapeEmails, // Nouveau : scraper aussi les emails
        userId // ID utilisateur pour la blacklist
      } = req.query;

      // Construire les filtres
      const filters = {
        codeApe,
        location: location || codePostal, // Priorité à location
        tranche_effectif_salarie,
        nature_juridique,
        categorie_entreprise,
        nombre: nombre ? parseInt(nombre) : 20
      };

      console.log('🔍 Recherche avec filtres:', filters);
      console.log('👤 User ID:', userId || 'Aucun (blacklist désactivée)');

      // Appel au service avec blacklist
      const companies = await sireneService.searchCompanies(filters, userId);

      // Si scrapeWebsites=true, lancer le scraping en parallèle
      if (scrapeWebsites === 'true' && companies.length > 0) {
        console.log('🌐 Lancement du scraping des sites web en parallèle...');

        const scrapingResults = await scraperService.findWebsitesInParallel(
          companies.map(c => ({ nom: c.nom, ville: c.ville, siret: c.siret })),
          5 // 5 entreprises en parallèle
        );

        // Fusionner les résultats
        const enrichedCompanies = companies.map(company => {
          const scrapingResult = scrapingResults.find(r => r.siret === company.siret);
          return {
            ...company,
            website_url: scrapingResult?.websiteUrl || null
          };
        });

        // Si scrapeEmails=true, scraper aussi les emails
        if (scrapeEmails === 'true') {
          console.log('📧 Lancement du scraping des emails...');

          const emailResults = [];

          for (const company of enrichedCompanies) {
            if (company.website_url) {
              try {
                const emails = await scraperService.scrapeEmails(company.website_url, company.nom);

                if (emails.length > 0) {
                  emailResults.push({
                    siret: company.siret,
                    emails: emails
                  });
                  console.log(`✅ Email trouvé pour ${company.nom}: ${emails[0].email}`);
                } else {
                  // Deviner des emails si rien trouvé
                  const guessedEmails = scraperService.guessEmails(company.website_url);
                  if (guessedEmails.length > 0) {
                    emailResults.push({
                      siret: company.siret,
                      emails: guessedEmails,
                      guessed: true
                    });
                  }
                }
              } catch (error) {
                console.error(`❌ Erreur scraping email pour ${company.nom}:`, error.message);
              }
            }
          }

          // Fusionner les résultats avec les emails
          const finalCompanies = enrichedCompanies.map(company => {
            const emailResult = emailResults.find(r => r.siret === company.siret);
            return {
              ...company,
              emails: emailResult?.emails || [],
              emails_guessed: emailResult?.guessed || false
            };
          });

          res.json({
            success: true,
            count: finalCompanies.length,
            data: finalCompanies,
            scraping: {
              websites: {
                total: companies.length,
                found: scrapingResults.filter(r => r.websiteUrl).length
              },
              emails: {
                total: enrichedCompanies.filter(c => c.website_url).length,
                found: emailResults.filter(r => !r.guessed).length,
                guessed: emailResults.filter(r => r.guessed).length
              }
            }
          });

        } else {
          res.json({
            success: true,
            count: enrichedCompanies.length,
            data: enrichedCompanies,
            scraping: {
              total: companies.length,
              found: scrapingResults.filter(r => r.websiteUrl).length
            }
          });
        }
      } else {
        res.json({
          success: true,
          count: companies.length,
          data: companies
        });
      }

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
          code_ape, libelle_ape, effectif, effectif_code, date_creation, website_url,
          dirigeant_nom, dirigeant_prenoms, dirigeant_fonction,
          chiffre_affaires, resultat_net, categorie_entreprise,
          latitude, longitude, convention_collective, labels,
          nombre_etablissements, etat_administratif, nature_juridique, date_mise_a_jour
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        company.effectif_code || null,
        company.date_creation,
        company.website_url || null,
        company.dirigeant_nom || null,
        company.dirigeant_prenoms || null,
        company.dirigeant_fonction || null,
        company.chiffre_affaires || null,
        company.resultat_net || null,
        company.categorie_entreprise || null,
        company.latitude || null,
        company.longitude || null,
        company.convention_collective || null,
        company.labels ? JSON.stringify(company.labels) : null,
        company.nombre_etablissements || null,
        company.etat_administratif || null,
        company.nature_juridique || null,
        company.date_mise_a_jour || null
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
          websiteUrl = await scraperService.findWebsite(company.nom, company.ville, company.siret);

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

        // Scraper les emails avec Claude (passer le nom de l'entreprise)
        let emails = await scraperService.scrapeEmails(websiteUrl, company.nom);

        // Si aucun email trouvé, deviner
        if (emails.length === 0) {
          emails = scraperService.guessEmails(websiteUrl);
        }

        // Sauvegarder les emails dans la DB
        for (const emailData of emails) {
          db.run(
            'INSERT INTO company_emails (company_id, email, priority, source_page) VALUES (?, ?, ?, ?)',
            [companyId, emailData.email, emailData.priority, emailData.source_page || websiteUrl]
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

  /**
   * Scraper les sites web de plusieurs entreprises en parallèle
   */
  async scrapeWebsitesParallel(req, res) {
    try {
      const { companies } = req.body;

      if (!companies || companies.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucune entreprise fournie'
        });
      }

      console.log(`🚀 Scraping de ${companies.length} entreprises en parallèle...`);

      const results = await scraperService.findWebsitesInParallel(companies, 5);

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Erreur scraping parallèle:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CompaniesController();
