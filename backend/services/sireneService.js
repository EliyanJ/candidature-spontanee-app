const axios = require('axios');
const { resolveLocation } = require('../constants/cities');
const { getLibelleEffectif } = require('../constants/effectifs');
require('dotenv').config();

class SireneService {
  constructor() {
    this.baseUrl = 'https://recherche-entreprises.api.gouv.fr';

    // ⚙️ CONFIGURATION OPTIMALE pour la randomisation
    this.DELAY_BETWEEN_REQUESTS = 150; // ms - 6.6 req/sec (sous la limite de 7)
    this.MULTIPLIER = 6; // Récupérer 6× plus pour bonne randomisation
    this.MAX_PER_PAGE = 25; // Limite API
  }

  /**
   * 🎯 RECHERCHE PRINCIPALE avec randomisation intelligente
   *
   * @param {Object} filters - Filtres de recherche
   * @param {String} userId - ID de l'utilisateur (pour blacklist)
   * @returns {Promise<Array>} Liste d'entreprises randomisées
   */
  async searchCompanies(filters = {}, userId = null) {
    try {
      const { nombre = 20 } = filters;

      // Calculer combien d'entreprises récupérer (×6 pour randomisation)
      const fetchSize = nombre * this.MULTIPLIER;

      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║   🎲 RANDOMISATION INTELLIGENTE ACTIVÉE      ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`📊 User demande      : ${nombre} entreprises`);
      console.log(`📦 Pool à récupérer : ${fetchSize} entreprises (×${this.MULTIPLIER})`);
      console.log(`⏱️  Temps estimé     : ~${this.estimateTime(fetchSize)}s`);

      if (userId) {
        console.log(`👤 User ID          : ${userId} (blacklist activée)`);
      }

      const startTime = Date.now();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ÉTAPE 1 : Récupération du pool élargi (pagination séquentielle)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let companies = await this.fetchMultiplePagesSequential(filters, fetchSize);

      if (companies.length === 0) {
        console.log('⚠️  Aucune entreprise trouvée');
        return [];
      }

      console.log(`✅ ${companies.length} entreprises récupérées en ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ÉTAPE 2 : Exclusion de la blacklist utilisateur (optionnel)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (userId) {
        const { getUserBlacklist } = require('../db/database');
        const blacklist = await getUserBlacklist(userId);

        if (blacklist.length > 0) {
          const beforeFilter = companies.length;
          companies = companies.filter(c => !blacklist.includes(c.siren));

          const excluded = beforeFilter - companies.length;
          console.log(`🚫 ${excluded} entreprises déjà contactées exclues`);
          console.log(`   Reste : ${companies.length} entreprises disponibles`);
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ÉTAPE 3 : Randomisation Fisher-Yates
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      companies = this.shuffleArray(companies);
      console.log(`🎲 Pool randomisé avec Fisher-Yates`);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ÉTAPE 4 : Retour des N entreprises demandées
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const result = companies.slice(0, nombre);

      console.log(`🎯 Retour de ${result.length} entreprises aléatoires`);
      console.log(`⏱️  Temps total : ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);

      return result;

    } catch (error) {
      console.error('❌ Erreur searchCompanies:', error.message);
      throw new Error('Erreur lors de la recherche d\'entreprises');
    }
  }

  /**
   * 📄 RÉCUPÉRATION SÉQUENTIELLE avec délais de sécurité
   *
   * Récupère plusieurs pages de l'API en respectant le rate limit
   * Stratégie conservatrice : 150ms entre chaque requête = 6.6 req/sec
   *
   * @param {Object} filters - Filtres de recherche
   * @param {Number} totalNeeded - Nombre total d'entreprises à récupérer
   * @returns {Promise<Array>} Liste complète des entreprises
   */
  async fetchMultiplePagesSequential(filters, totalNeeded) {
    const pagesNeeded = Math.ceil(totalNeeded / this.MAX_PER_PAGE);
    let allResults = [];

    console.log(`\n📄 Récupération de ${pagesNeeded} pages (${this.MAX_PER_PAGE} entreprises/page)...`);

    for (let page = 1; page <= pagesNeeded; page++) {
      try {
        // Construire les paramètres de la requête
        const params = {
          ...this.buildParams(filters),
          per_page: this.MAX_PER_PAGE,
          page: page
        };

        // Appel API
        const response = await axios.get(`${this.baseUrl}/search`, { params });
        const results = response.data.results || [];

        // Formater les résultats
        const formatted = results.map(company => this.formatCompany(company));
        allResults = [...allResults, ...formatted];

        console.log(`  ✓ Page ${page}/${pagesNeeded} : ${formatted.length} entreprises récupérées`);

        // ⚠️ CRITIQUE : Délai entre requêtes (sauf dernière page)
        if (page < pagesNeeded) {
          await this.sleep(this.DELAY_BETWEEN_REQUESTS);
        }

      } catch (error) {
        // Gestion du rate limit (code 429)
        if (error.response?.status === 429) {
          console.error(`⚠️  Rate limit 429 atteint à la page ${page}`);
          console.error(`   → Augmentation du délai à 1 seconde`);

          // Attendre 1 seconde et réessayer
          await this.sleep(1000);
          page--; // Réessayer cette page
        } else {
          console.error(`❌ Erreur page ${page}:`, error.message);
          // Continuer malgré l'erreur
        }
      }

      // Arrêter si on a déjà assez de résultats
      if (allResults.length >= totalNeeded) {
        console.log(`  ℹ️  ${allResults.length} entreprises récupérées (objectif atteint)`);
        break;
      }
    }

    return allResults;
  }

  /**
   * 🔧 CONSTRUCTION DES PARAMÈTRES API
   *
   * @param {Object} filters - Filtres utilisateur
   * @returns {Object} Paramètres formatés pour l'API
   */
  buildParams(filters) {
    const params = {};

    // Code APE (activité)
    if (filters.codeApe) {
      params.activite_principale = this.formatCodeApe(filters.codeApe);
    }

    // Localisation (ville ou code postal)
    if (filters.location) {
      const resolved = resolveLocation(filters.location);

      if (resolved.success && resolved.codePostaux.length > 0) {
        // L'API accepte plusieurs codes postaux séparés par des virgules
        params.code_postal = resolved.codePostaux.join(',');
        console.log(`📍 Localisation: ${resolved.codePostaux.length} codes postaux (${resolved.type})`);
      } else {
        console.warn(`⚠️  Localisation "${filters.location}" non résolue`);
      }
    }

    // Code postal direct (legacy, si location n'est pas utilisé)
    if (filters.codePostal && !filters.location) {
      params.code_postal = filters.codePostal;
    }

    // Tranche d'effectifs
    if (filters.tranche_effectif_salarie) {
      params.tranche_effectif_salarie = filters.tranche_effectif_salarie;
    }

    // Nature juridique
    if (filters.nature_juridique) {
      params.nature_juridique = filters.nature_juridique;
    }

    // Catégorie entreprise (PME, ETI, GE)
    if (filters.categorie_entreprise) {
      params.categorie_entreprise = filters.categorie_entreprise;
    }

    // ⚠️ FILTRES OBLIGATOIRES PAR DÉFAUT

    // ✅ TOUJOURS exclure les entrepreneurs individuels
    params.est_entrepreneur_individuel = false;

    // ✅ TOUJOURS filtrer pour avoir minimum 20 employés
    // Codes INSEE : 12 (20-49), 21 (50-99), 22 (100-199), 31 (200-249), 32 (250-499), 41 (500-999), 42 (1000-1999), 51 (2000-4999), 52 (5000-9999), 53 (10000+)
    const codesMin20Employes = '12,21,22,31,32,41,42,51,52,53';

    // Si l'utilisateur a déjà spécifié une tranche, on la garde (elle doit être >= 20 employés)
    if (!filters.tranche_effectif_salarie) {
      params.tranche_effectif_salarie = codesMin20Employes;
    }

    // Seulement les entreprises actives (sauf si explicitement demandé)
    if (filters.etat_administratif !== 'all') {
      params.etat_administratif = filters.etat_administratif || 'A';
    }

    return params;
  }

  /**
   * 📦 FORMATER UNE ENTREPRISE depuis l'API
   *
   * @param {Object} company - Données brutes de l'API
   * @returns {Object} Entreprise formatée
   */
  formatCompany(company) {
    // Prendre l'établissement qui correspond à la recherche (ou le siège par défaut)
    const etablissement = company.matching_etablissements?.[0] || company.siege;

    return {
      siret: etablissement?.siret || '',
      siren: company.siren,
      nom: company.nom_complet || company.nom_raison_sociale || 'N/A',
      nom_commercial: etablissement?.nom_commercial || company.sigle || '',
      adresse: etablissement?.adresse || '',
      code_postal: etablissement?.code_postal || '',
      ville: etablissement?.libelle_commune || '',
      code_ape: company.activite_principale || '',
      libelle_ape: this.getLibelleApe(company.activite_principale),
      effectif: getLibelleEffectif(etablissement?.tranche_effectif_salarie),
      effectif_code: etablissement?.tranche_effectif_salarie,
      date_creation: company.date_creation || '',
      etat_administratif: etablissement?.etat_administratif || company.etat_administratif || '',
      nature_juridique: company.nature_juridique?.code || '',
      categorie_entreprise: company.categorie_entreprise || '',
      nombre_etablissements: company.nombre_etablissements || 1,

      // Informations complémentaires
      dirigeant_nom: company.dirigeants?.[0]?.nom || null,
      dirigeant_prenoms: company.dirigeants?.[0]?.prenoms || null,
      dirigeant_fonction: company.dirigeants?.[0]?.qualite || null,

      // Géolocalisation
      latitude: etablissement?.latitude || null,
      longitude: etablissement?.longitude || null,

      // Date de mise à jour
      date_mise_a_jour: company.date_mise_a_jour || new Date().toISOString()
    };
  }

  /**
   * 🎲 RANDOMISATION FISHER-YATES
   *
   * Algorithme qui garantit une distribution uniformément aléatoire
   * Complexité : O(n) - très rapide
   *
   * @param {Array} array - Tableau à mélanger
   * @returns {Array} Tableau mélangé (nouvelle instance)
   */
  shuffleArray(array) {
    // Créer une copie pour ne pas modifier l'original
    const shuffled = [...array];

    // Algorithme Fisher-Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Choisir un index aléatoire entre 0 et i
      const j = Math.floor(Math.random() * (i + 1));

      // Échanger les éléments i et j
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * ⏱️ ESTIMATION DU TEMPS DE RECHERCHE
   *
   * @param {Number} fetchSize - Nombre d'entreprises à récupérer
   * @returns {String} Temps estimé en secondes (ex: "4.2")
   */
  estimateTime(fetchSize) {
    const pages = Math.ceil(fetchSize / this.MAX_PER_PAGE);
    const requestTime = pages * 0.5; // 500ms par requête API
    const delayTime = (pages - 1) * (this.DELAY_BETWEEN_REQUESTS / 1000);
    return (requestTime + delayTime).toFixed(1);
  }

  /**
   * ⏸️ FONCTION SLEEP
   *
   * @param {Number} ms - Millisecondes à attendre
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🔄 FORMATAGE CODE APE
   *
   * Convertit différents formats en format API (ex: 62.01Z)
   *
   * @param {String} codeApe - Code APE (ex: "6201", "62.01", "6201Z")
   * @returns {String} Code formaté (ex: "62.01Z")
   */
  formatCodeApe(codeApe) {
    if (!codeApe) return null;

    // Supprimer espaces et points
    let code = codeApe.replace(/[\s.]/g, '');

    // Si 4 chiffres (ex: 6201) → 62.01Z
    if (code.length === 4 && /^\d{4}$/.test(code)) {
      return `${code.substring(0, 2)}.${code.substring(2)}Z`;
    }

    // Si déjà au bon format
    if (/^\d{2}\.\d{2}[A-Z]$/.test(codeApe)) {
      return codeApe;
    }

    // Par défaut, ajouter Z à la fin
    return code + 'Z';
  }

  /**
   * 📚 OBTENIR LE LIBELLÉ D'UN CODE APE
   *
   * @param {String} codeApe - Code APE
   * @returns {String} Libellé
   */
  getLibelleApe(codeApe) {
    const apeMap = {
      '62': 'Programmation, conseil et autres activités informatiques',
      '63': 'Services d\'information',
      '70': 'Activités des sièges sociaux ; conseil de gestion',
      '71': 'Activités d\'architecture et d\'ingénierie',
      '72': 'Recherche-développement scientifique',
      '73': 'Publicité et études de marché',
      '74': 'Autres activités spécialisées',
      '46': 'Commerce de gros',
      '47': 'Commerce de détail',
      '41': 'Construction de bâtiments',
      '43': 'Travaux de construction spécialisés',
      '56': 'Restauration',
      '68': 'Activités immobilières',
      '58': 'Édition',
      '59': 'Production audiovisuelle',
      '60': 'Programmation et diffusion',
      '61': 'Télécommunications',
      '64': 'Activités des services financiers',
      '66': 'Activités auxiliaires de services financiers',
      '69': 'Activités juridiques et comptables',
      '78': 'Activités liées à l\'emploi',
      '79': 'Activités des agences de voyage',
      '85': 'Enseignement',
      '86': 'Activités pour la santé humaine',
      '87': 'Hébergement médico-social',
      '88': 'Action sociale sans hébergement'
    };

    if (!codeApe) return 'Non renseigné';

    const prefix = codeApe.substring(0, 2);
    return apeMap[prefix] || 'Autres activités';
  }
}

module.exports = new SireneService();
