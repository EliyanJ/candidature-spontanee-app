const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class ClaudeService {
  constructor() {
    console.log('🔑 ANTHROPIC_API_KEY loaded:', process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...` : 'NOT FOUND');
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    // Utiliser claude-3-5-sonnet ou claude-3-5-haiku qui supportent web search
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Trouver le site web officiel d'une entreprise avec web search natif
   * @param {string} companyName - Nom de l'entreprise
   * @param {string} city - Ville
   * @returns {string|null} URL du site officiel
   */
  async findWebsiteWithSearch(companyName, city) {
    try {
      const prompt = `Trouve le site web officiel de l'entreprise "${companyName}" située à ${city}, France.

Instructions :
- Cherche le site web OFFICIEL de cette entreprise (pas un annuaire)
- IGNORE les sites comme : societe.com, verif.com, linkedin.com, facebook.com, pagesjaunes.fr, infogreffe, pappers.fr
- Réponds UNIQUEMENT avec l'URL complète du site officiel
- Si aucun site officiel n'est trouvé, réponds "AUCUN"

Ne donne AUCUNE explication, juste l'URL ou "AUCUN".`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 200,
        tools: [{
          type: "web_search_20250305",
          name: "web_search"
        }],
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Extraire la réponse
      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent) {
        console.log('🤖 Claude: Aucune réponse texte');
        return null;
      }

      const response = textContent.text.trim();

      if (response === 'AUCUN' || response.toLowerCase() === 'aucun') {
        console.log('🤖 Claude: Aucun site officiel trouvé');
        return null;
      }

      // Vérifier que c'est une URL valide
      if (response.startsWith('http://') || response.startsWith('https://')) {
        console.log(`🤖 Claude a trouvé le site: ${response}`);
        return response;
      }

      console.log('🤖 Claude: Réponse invalide:', response);
      return null;

    } catch (error) {
      console.error('❌ Erreur Claude (recherche site):', error.message);
      return null;
    }
  }

  /**
   * Extraire l'email de contact d'un site web avec web search + crawling
   * @param {string} companyName - Nom de l'entreprise
   * @param {string} websiteUrl - URL du site web
   * @returns {Object|null} {email, priority, source}
   */
  async findEmailWithSearch(companyName, websiteUrl) {
    try {
      const prompt = `Trouve l'email de contact le plus pertinent pour envoyer une CANDIDATURE SPONTANÉE à l'entreprise "${companyName}".

Site web: ${websiteUrl}

Instructions :
- Cherche sur le site web (pages contact, recrutement, RH, carrières)
- Priorité: recrutement@, rh@, candidature@, carriere@, jobs@
- Sinon: contact@, info@, hello@
- IGNORE: noreply@, no-reply@, support@, billing@, abuse@
- IGNORE les emails qui contiennent: .png, .jpg, exemple, example, test, wixpress, sentry

Réponds au format JSON strict (sans markdown, sans backticks):
{"email": "adresse@email.com", "priority": 1, "source": "url_de_la_page"}

Si aucun email pertinent n'est trouvé, réponds:
{"email": null, "priority": null, "source": null}

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 300,
        tools: [{
          type: "web_search_20250305",
          name: "web_search"
        }],
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Extraire la réponse
      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent) {
        console.log('🤖 Claude: Aucune réponse texte');
        return null;
      }

      const response = textContent.text.trim();

      // Parser la réponse JSON
      try {
        const result = JSON.parse(response);

        if (result.email) {
          console.log(`🤖 Claude a trouvé l'email: ${result.email} (priorité: ${result.priority})`);
          return result;
        } else {
          console.log('🤖 Claude: Aucun email pertinent trouvé');
          return null;
        }
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError.message);
        console.log('Réponse brute:', response);
        return null;
      }

    } catch (error) {
      console.error('❌ Erreur Claude (recherche email):', error.message);
      return null;
    }
  }

  /**
   * Analyser et nettoyer le nom commercial pour la recherche
   * Retire les mentions légales (SARL, SAS, etc.)
   * @param {string} companyName - Nom complet de l'entreprise
   * @returns {string} Nom commercial nettoyé
   */
  cleanCompanyName(companyName) {
    // Retirer les mentions légales courantes
    const legalMentions = [
      'SARL',
      'SAS',
      'SA',
      'EURL',
      'SCI',
      'SASU',
      'SELARL',
      'SNC',
      'SCP',
      'SCM',
      'EARL',
      'GAEC',
      'GIE',
      'Association',
      'Société',
      'Entreprise',
      'Etablissement',
      'ETS'
    ];

    let cleanedName = companyName;

    // Retirer les mentions légales (case-insensitive)
    legalMentions.forEach(mention => {
      const regex = new RegExp(`\\b${mention}\\b`, 'gi');
      cleanedName = cleanedName.replace(regex, '').trim();
    });

    // Nettoyer les espaces multiples
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

    return cleanedName;
  }
}

module.exports = new ClaudeService();
