const { db } = require('../db/database');
const emailService = require('../services/emailService');

class ConfigController {
  /**
   * Sauvegarder la configuration email
   */
  async setEmailConfig(req, res) {
    try {
      const { email, password, type } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      // Configurer le service email
      emailService.setupTransporter({ email, password, type });

      // Sauvegarder en base (sauf le mot de passe en clair - utilise une solution sécurisée en prod)
      const queries = [
        ['smtp_email', email],
        ['smtp_password', password], // TODO: Chiffrer en production
        ['smtp_type', type || 'gmail']
      ];

      for (const [key, value] of queries) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [key, value],
            (err) => err ? reject(err) : resolve()
          );
        });
      }

      res.json({
        success: true,
        message: 'Configuration email sauvegardée'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Tester la connexion email
   */
  async testEmailConnection(req, res) {
    try {
      const result = await emailService.testConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Sauvegarder le profil utilisateur
   */
  async setUserProfile(req, res) {
    try {
      const { name, phone, linkedin, formation, ecole } = req.body;

      const fields = {
        user_name: name,
        user_phone: phone,
        user_linkedin: linkedin,
        user_formation: formation,
        user_ecole: ecole
      };

      for (const [key, value] of Object.entries(fields)) {
        if (value) {
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
              [key, value],
              (err) => err ? reject(err) : resolve()
            );
          });
        }
      }

      res.json({
        success: true,
        message: 'Profil utilisateur sauvegardé'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Récupérer le profil utilisateur
   */
  async getUserProfile(req, res) {
    try {
      db.all('SELECT key, value FROM config WHERE key LIKE "user_%"', [], (err, rows) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        const profile = {};
        rows.forEach(row => {
          profile[row.key] = row.value;
        });

        res.json({
          success: true,
          profile
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
   * Récupérer toutes les variables pour les templates
   */
  async getAllVariables(req, res) {
    try {
      db.all('SELECT key, value FROM config', [], (err, rows) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        const variables = {};
        rows.forEach(row => {
          variables[row.key] = row.value;
        });

        res.json({
          success: true,
          variables
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ConfigController();
