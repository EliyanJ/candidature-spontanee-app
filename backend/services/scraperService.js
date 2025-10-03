const puppeteer = require('puppeteer');

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
   * Trouver le site web d'une entreprise via Google
   * @param {string} nomEntreprise
   * @param {string} ville
   * @returns {string|null} URL du site web
   */
  async findWebsite(nomEntreprise, ville) {
    let page;
    try {
      await this.initBrowser();
      page = await this.browser.newPage();

      // Configurer le user agent pour éviter d'être bloqué
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      const searchQuery = `${nomEntreprise} ${ville} site officiel`;
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      console.log(`🌐 Recherche Google: ${searchQuery}`);

      await page.goto(googleUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Attendre et extraire le premier résultat
      await page.waitForSelector('#search', { timeout: 5000 });

      const firstLink = await page.evaluate(() => {
        const results = document.querySelectorAll('#search a');
        for (let link of results) {
          const href = link.href;
          // Ignorer les liens Google internes
          if (href && !href.includes('google.com') && !href.includes('youtube.com')) {
            return href;
          }
        }
        return null;
      });

      await page.close();

      if (firstLink) {
        console.log(`✅ Site trouvé: ${firstLink}`);
        return firstLink;
      } else {
        console.log('⚠️  Aucun site trouvé');
        return null;
      }

    } catch (error) {
      console.error('❌ Erreur recherche site web:', error.message);
      if (page) await page.close();
      return null;
    }
  }

  /**
   * Scraper les emails d'un site web
   * @param {string} url
   * @returns {Array} Liste d'emails avec priorité
   */
  async scrapeEmails(url) {
    let page;
    try {
      await this.initBrowser();
      page = await this.browser.newPage();

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      console.log(`📧 Scraping emails sur: ${url}`);

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Récupérer tous les liens de la page
      const links = await page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a'));
        return allLinks.map(link => ({
          text: link.textContent.toLowerCase().trim(),
          href: link.href
        }));
      });

      // Filtrer les liens intéressants (contact, recrutement, etc.)
      const keywords = ['contact', 'recrutement', 'carriere', 'jobs', 'emploi', 'rh', 'career', 'about', 'a-propos'];
      const interestingLinks = links.filter(link =>
        keywords.some(keyword => link.text.includes(keyword) || link.href.includes(keyword))
      ).map(link => link.href)
       .filter((href, index, self) => self.indexOf(href) === index) // Unique
       .slice(0, 5); // Max 5 pages

      console.log(`📄 ${interestingLinks.length} pages intéressantes trouvées`);

      // Collecter les emails de toutes les pages
      let allEmails = new Set();

      // Page principale
      const mainPageEmails = await this.extractEmailsFromPage(page);
      mainPageEmails.forEach(email => allEmails.add(email));

      // Pages intéressantes
      for (const link of interestingLinks) {
        try {
          await page.goto(link, { waitUntil: 'networkidle0', timeout: 15000 });
          const pageEmails = await this.extractEmailsFromPage(page);
          pageEmails.forEach(email => allEmails.add(email));
        } catch (error) {
          console.log(`⚠️  Erreur sur ${link}`);
        }
      }

      await page.close();

      // Filtrer et prioriser les emails
      const emails = Array.from(allEmails);
      const validEmails = this.filterAndPrioritizeEmails(emails);

      console.log(`✅ ${validEmails.length} emails trouvés`);
      return validEmails;

    } catch (error) {
      console.error('❌ Erreur scraping emails:', error.message);
      if (page) await page.close();
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
