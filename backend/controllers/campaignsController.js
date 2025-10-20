const { db, addToBlacklist } = require('../db/database');
const emailService = require('../services/emailService');

class CampaignsController {
  /**
   * Créer une nouvelle campagne
   */
  async createCampaign(req, res) {
    try {
      const { name, template_subject, template_body, cv_filename, emails_per_day, delay_between_emails } = req.body;

      const query = `
        INSERT INTO campaigns (name, template_subject, template_body, cv_filename, emails_per_day, delay_between_emails, status)
        VALUES (?, ?, ?, ?, ?, ?, 'draft')
      `;

      db.run(query, [name, template_subject, template_body, cv_filename, emails_per_day || 40, delay_between_emails || 45], function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        res.json({
          success: true,
          campaignId: this.lastID
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
   * Obtenir toutes les campagnes
   */
  async getCampaigns(req, res) {
    try {
      db.all('SELECT * FROM campaigns ORDER BY created_at DESC', [], (err, campaigns) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        res.json({
          success: true,
          campaigns
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
   * Lancer une campagne d'envoi
   */
  async startCampaign(req, res) {
    try {
      const { campaignId } = req.params;
      const { companyIds, userId } = req.body; // Ajouter userId

      // Récupérer la campagne
      db.get('SELECT * FROM campaigns WHERE id = ?', [campaignId], async (err, campaign) => {
        if (err || !campaign) {
          return res.status(404).json({
            success: false,
            message: 'Campagne non trouvée'
          });
        }

        // Récupérer les variables utilisateur depuis la config
        const userVariables = await new Promise((resolve, reject) => {
          db.all('SELECT key, value FROM config WHERE key LIKE "user_%"', [], (err, rows) => {
            if (err) return reject(err);
            const vars = {};
            rows.forEach(row => {
              // Transformer user_name en votre_nom
              const varName = row.key.replace('user_', 'votre_');
              vars[varName] = row.value;
            });
            resolve(vars);
          });
        });

        // Ajouter la date
        userVariables.date = new Date().toLocaleDateString('fr-FR');

        // Marquer comme active
        db.run('UPDATE campaigns SET status = ? WHERE id = ?', ['active', campaignId]);

        // Préparer les emails à envoyer
        const emailsToSend = [];

        for (const companyId of companyIds) {
          // Récupérer l'entreprise
          const company = await this.getCompanyById(companyId);
          if (!company) continue;

          // Récupérer les emails de l'entreprise
          const emails = await this.getCompanyEmailsList(companyId);
          if (emails.length === 0) continue;

          // Prendre l'email avec la meilleure priorité
          const bestEmail = emails[0];

          // COMBINER toutes les variables (entreprise + utilisateur)
          const allVariables = {
            nom_entreprise: company.nom,
            ville: company.ville,
            secteur_activite: company.libelle_ape,
            ...userVariables // Ajoute votre_nom, votre_telephone, etc.
          };

          const subject = emailService.replaceVariables(campaign.template_subject, allVariables);
          const body = emailService.replaceVariables(campaign.template_body, allVariables);

          // Ajouter à la liste d'envoi
          emailsToSend.push({
            to: bestEmail.email,
            subject,
            body,
            attachments: campaign.cv_filename ? [{
              filename: campaign.cv_filename,
              path: `./uploads/${campaign.cv_filename}`
            }] : [],
            companyId,
            campaignId
          });
        }

        // Répondre immédiatement
        res.json({
          success: true,
          message: `Campagne lancée avec ${emailsToSend.length} emails`,
          totalEmails: emailsToSend.length
        });

        // Envoyer les emails en arrière-plan avec userId pour blacklist
        this.sendCampaignEmails(campaign, emailsToSend, userId);
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Envoyer les emails d'une campagne
   */
  async sendCampaignEmails(campaign, emailsToSend, userId = null) {
    const results = await emailService.sendCampaign(
      emailsToSend,
      {
        delayBetweenEmails: campaign.delay_between_emails * 1000,
        maxEmailsPerDay: campaign.emails_per_day
      },
      (progress) => {
        console.log(`📊 Progression: ${progress.current}/${progress.total}`);
      }
    );

    // Sauvegarder les résultats
    for (const result of results) {
      db.run(
        `INSERT INTO sent_emails (campaign_id, company_id, email_to, subject, body, status, sent_at, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.campaignId,
          result.companyId,
          result.to,
          result.subject,
          result.body,
          result.success ? 'sent' : 'failed',
          new Date().toISOString(),
          result.error || null
        ]
      );
    }

    // Marquer la campagne comme terminée
    db.run('UPDATE campaigns SET status = ? WHERE id = ?', ['completed', campaign.id]);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // AJOUTER LES ENTREPRISES CONTACTÉES À LA BLACKLIST
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (userId && results.length > 0) {
      try {
        // Récupérer les SIREN des entreprises contactées avec succès
        const successCompanies = [];

        for (const result of results) {
          if (result.success && result.companyId) {
            // Récupérer le SIREN de l'entreprise
            const company = await this.getCompanyById(result.companyId);
            if (company && company.siren) {
              successCompanies.push(company.siren);
            }
          }
        }

        if (successCompanies.length > 0) {
          await addToBlacklist(userId, successCompanies);
          console.log(`✅ ${successCompanies.length} entreprises ajoutées à la blacklist de l'utilisateur ${userId}`);
        }
      } catch (error) {
        console.error('❌ Erreur ajout blacklist:', error.message);
        // Ne pas bloquer si l'ajout à la blacklist échoue
      }
    }

    console.log('✅ Campagne terminée');
  }

  /**
   * Obtenir les statistiques d'une campagne
   */
  async getCampaignStats(req, res) {
    try {
      const { campaignId } = req.params;

      db.all(
        'SELECT status, COUNT(*) as count FROM sent_emails WHERE campaign_id = ? GROUP BY status',
        [campaignId],
        (err, stats) => {
          if (err) {
            return res.status(500).json({ success: false, message: err.message });
          }

          const summary = {
            total: 0,
            sent: 0,
            failed: 0
          };

          stats.forEach(stat => {
            summary.total += stat.count;
            if (stat.status === 'sent') summary.sent = stat.count;
            if (stat.status === 'failed') summary.failed = stat.count;
          });

          res.json({
            success: true,
            stats: summary
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
   * Helper: Obtenir une entreprise par ID
   */
  getCompanyById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM companies WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Helper: Obtenir les emails d'une entreprise
   */
  getCompanyEmailsList(companyId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM company_emails WHERE company_id = ? AND is_valid = 1 ORDER BY priority ASC',
        [companyId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}

module.exports = new CampaignsController();
