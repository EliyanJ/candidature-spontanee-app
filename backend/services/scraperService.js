const puppeteer = require('puppeteer');
const claudeService = require('./claudeService');

class ScraperService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialiser le navigateur Puppeteer
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Fermer le navigateur
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Trouver le site web d'une entreprise avec Claude web search natif
   * @param {string} nomEntreprise
   * @param {string} ville
   * @param {string} siret - Pour affiner la recherche (non utilisé avec web search)
   * @returns {string|null} URL du site web
   */
  async findWebsite(nomEntreprise, ville, siret = null) {
    try {
      // Nettoyer le nom de l'entreprise (retirer SARL, SAS, etc.)
      const cleanedName = claudeService.cleanCompanyName(nomEntreprise);
      console.log(`🧹 Nom nettoyé: "${nomEntreprise}" -> "${cleanedName}"`);

      console.log(`🔍 Recherche web avec Claude: ${cleanedName} ${ville}`);

      // Utiliser le web search natif de Claude
      const officialWebsite = await claudeService.findWebsiteWithSearch(cleanedName, ville);

      if (officialWebsite) {
        console.log(`✅ Site officiel trouvé: ${officialWebsite}`);
        return officialWebsite;
      } else {
        console.log('⚠️  Aucun site officiel trouvé');
        return null;
      }

    } catch (error) {
      console.error('❌ Erreur recherche site web:', error.message);
      return null;
    }
  }

  /**
   * Scraper les sites web de plusieurs entreprises en parallèle
   * @param {Array} companies - Liste des entreprises [{nom, ville, siret}, ...]
   * @param {number} concurrency - Nombre d'entreprises à traiter simultanément (défaut: 5)
   * @returns {Array} Liste des résultats [{nom, ville, websiteUrl}, ...]
   */
  async findWebsitesInParallel(companies, concurrency = 5) {
    const results = [];
    const chunks = [];

    // Diviser les entreprises en groupes de {concurrency} entreprises
    for (let i = 0; i < companies.length; i += concurrency) {
      chunks.push(companies.slice(i, i + concurrency));
    }

    console.log(`🚀 Scraping de ${companies.length} entreprises par lots de ${concurrency}`);

    // Traiter chaque groupe en parallèle
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`\n📦 Lot ${i + 1}/${chunks.length} : ${chunk.length} entreprises`);

      // Lancer les recherches en parallèle pour ce groupe
      const promises = chunk.map(async (company) => {
        try {
          const websiteUrl = await this.findWebsite(company.nom, company.ville, company.siret);
          return {
            nom: company.nom,
            ville: company.ville,
            siret: company.siret,
            websiteUrl
          };
        } catch (error) {
          console.error(`❌ Erreur pour ${company.nom}:`, error.message);
          return {
            nom: company.nom,
            ville: company.ville,
            siret: company.siret,
            websiteUrl: null
          };
        }
      });

      // Attendre que tout le groupe soit terminé
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);

      console.log(`✅ Lot ${i + 1}/${chunks.length} terminé`);
    }

    const successCount = results.filter(r => r.websiteUrl).length;
    console.log(`\n🎉 Scraping terminé: ${successCount}/${companies.length} sites trouvés`);

    return results;
  }

  /**
   * Scraper les emails d'un site web avec Claude web search
   * @param {string} url
   * @param {string} companyName - Nom de l'entreprise pour contexte
   * @returns {Array} Liste d'emails avec priorité
   */
  async scrapeEmails(url, companyName = '') {
    try {
      console.log(`📧 Recherche email avec Claude pour: ${url}`);

      // Utiliser le web search natif de Claude pour trouver l'email
      const emailResult = await claudeService.findEmailWithSearch(companyName, url);

      if (emailResult && emailResult.email) {
        console.log(`✅ Email trouvé par Claude: ${emailResult.email}`);
        return [{
          email: emailResult.email,
          priority: emailResult.priority || 2,
          source_page: emailResult.source || url
        }];
      } else {
        console.log('⚠️  Aucun email pertinent trouvé par Claude');
        return [];
      }

    } catch (error) {
      console.error('❌ Erreur scraping emails:', error.message);
      return [];
    }
  }

  /**
   * Extraire les emails d'une page
   * @param {Page} page
   * @returns {Array} Liste d'emails
   */
  async extractEmailsFromPage(page) {
    const content = await page.content();
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const emails = content.match(emailRegex) || [];
    return emails;
  }

  /**
   * Filtrer et prioriser les emails
   * @param {Array} emails
   * @returns {Array} Emails filtrés et triés
   */
  filterAndPrioritizeEmails(emails) {
    // Filtrer les emails invalides
    const filtered = emails.filter(email => {
      const lower = email.toLowerCase();
      return !lower.includes('noreply') &&
             !lower.includes('example') &&
             !lower.includes('.png') &&
             !lower.includes('.jpg') &&
             !lower.includes('.jpeg') &&
             !lower.includes('wixpress') &&
             !lower.includes('sentry');
    });

    // Prioriser les emails
    const prioritized = filtered.map(email => {
      const lower = email.toLowerCase();
      let priority = 3; // Par défaut

      if (lower.includes('recrutement') || lower.includes('rh') ||
          lower.includes('jobs') || lower.includes('hr') || lower.includes('carriere')) {
        priority = 1; // Haute priorité
      } else if (lower.includes('contact') || lower.includes('info')) {
        priority = 2; // Priorité moyenne
      }

      return { email, priority };
    });

    // Trier par priorité
    prioritized.sort((a, b) => a.priority - b.priority);

    return prioritized;
  }

  /**
   * Deviner l'email d'une entreprise si aucun n'est trouvé
   * @param {string} websiteUrl
   * @returns {Array} Emails possibles
   */
  guessEmails(websiteUrl) {
    try {
      const url = new URL(websiteUrl);
      const domain = url.hostname.replace('www.', '');

      return [
        { email: `contact@${domain}`, priority: 2 },
        { email: `recrutement@${domain}`, priority: 1 },
        { email: `rh@${domain}`, priority: 1 },
        { email: `info@${domain}`, priority: 2 }
      ];
    } catch {
      return [];
    }
  }
}

module.exports = new ScraperService();
