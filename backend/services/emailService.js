const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.config = {
      email: process.env.SMTP_EMAIL,
      password: process.env.SMTP_PASSWORD,
      type: process.env.SMTP_TYPE || 'gmail'
    };
  }

  /**
   * Configurer le transporteur d'emails
   */
  setupTransporter(config) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    const transportConfig = this.getTransportConfig();

    this.transporter = nodemailer.createTransporter(transportConfig);

    console.log('✅ Transporteur email configuré');
  }

  /**
   * Obtenir la configuration de transport selon le type
   */
  getTransportConfig() {
    switch (this.config.type) {
      case 'gmail':
        return {
          service: 'gmail',
          auth: {
            user: this.config.email,
            pass: this.config.password
          }
        };

      case 'outlook':
        return {
          service: 'hotmail',
          auth: {
            user: this.config.email,
            pass: this.config.password
          }
        };

      case 'custom':
        return {
          host: this.config.host,
          port: this.config.port || 587,
          secure: this.config.secure || false,
          auth: {
            user: this.config.email,
            pass: this.config.password
          }
        };

      default:
        throw new Error('Type de SMTP non supporté');
    }
  }

  /**
   * Tester la connexion email
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        this.setupTransporter();
      }

      await this.transporter.verify();
      console.log('✅ Connexion email réussie');
      return { success: true, message: 'Connexion réussie' };

    } catch (error) {
      console.error('❌ Erreur connexion email:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Envoyer un email
   * @param {Object} options - Options d'envoi
   */
  async sendEmail(options) {
    try {
      if (!this.transporter) {
        this.setupTransporter();
      }

      const { to, subject, body, attachments = [] } = options;

      const mailOptions = {
        from: `"${options.fromName || 'Candidature'}" <${this.config.email}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: attachments
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email envoyé à ${to}`);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };

    } catch (error) {
      console.error(`❌ Erreur envoi email à ${options.to}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remplacer les variables dans le template
   * @param {string} template - Template avec variables
   * @param {Object} variables - Valeurs des variables
   */
  replaceVariables(template, variables) {
    let result = template;

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    return result;
  }

  /**
   * Envoyer une campagne d'emails avec délais
   * @param {Array} emails - Liste des envois
   * @param {Object} config - Configuration de la campagne
   */
  async sendCampaign(emails, config, onProgress) {
    const {
      delayBetweenEmails = 45000, // 45 secondes par défaut
      maxEmailsPerDay = 40
    } = config;

    const results = [];
    let sentToday = 0;

    for (let i = 0; i < emails.length; i++) {
      // Vérifier la limite quotidienne
      if (sentToday >= maxEmailsPerDay) {
        console.log('⏸️  Limite quotidienne atteinte, pause...');
        break;
      }

      const emailData = emails[i];

      // Envoyer l'email
      const result = await this.sendEmail(emailData);

      results.push({
        ...emailData,
        ...result,
        sentAt: new Date()
      });

      sentToday++;

      // Notifier la progression
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: emails.length,
          success: result.success
        });
      }

      // Attendre avant le prochain envoi (sauf pour le dernier)
      if (i < emails.length - 1) {
        // Délai aléatoire entre 30-60 sec pour éviter le spam
        const randomDelay = delayBetweenEmails + Math.random() * 15000;
        console.log(`⏳ Attente ${Math.round(randomDelay / 1000)}s avant prochain envoi...`);
        await this.sleep(randomDelay);
      }
    }

    return results;
  }

  /**
   * Fonction sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new EmailService();
