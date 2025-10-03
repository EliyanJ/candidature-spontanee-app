const axios = require('axios');
require('dotenv').config();

class SireneService {
  constructor() {
    // Nouvelle API gratuite sans clé requise
    this.baseUrl = 'https://recherche-entreprises.api.gouv.fr';
  }

  /**
   * Rechercher des entreprises via l'API recherche-entreprises
   * @param {Object} filters - Filtres de recherche
   * @returns {Array} Liste d'entreprises
   */
  async searchCompanies(filters = {}) {
    try {
      const { codeApe, ville, codePostal, effectif, nombre = 20 } = filters;

      // Construire les paramètres de recherche
      const params = {
        per_page: nombre,
        page: 1
      };

      // Convertir le code APE au format attendu (62.01Z au lieu de 6201)
      if (codeApe) {
        const formattedApe = this.formatCodeApe(codeApe);
        if (formattedApe) {
          params.activite_principale = formattedApe;
        }
      }

      // Code commune au lieu du nom de ville
      if (codePostal) {
        params.code_postal = codePostal;
      }

      console.log('🔍 Recherche entreprises:', params);

      const response = await axios.get(`${this.baseUrl}/search`, {
        params
      });

      if (!response.data.results) {
        return [];
      }

      // Formater les résultats pour correspondre à l'ancien format
      const companies = response.data.results.map(company => {
        // Trouver un établissement dans le code postal demandé
        let etablissement = company.matching_etablissements?.[0] || company.siege;

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
          effectif: this.getLibelleEffectif(etablissement?.tranche_effectif_salarie),
          date_creation: company.date_creation || ''
        };
      });

      console.log(`✅ ${companies.length} entreprises trouvées`);
      return companies;

    } catch (error) {
      console.error('❌ Erreur API recherche-entreprises:', error.response?.data || error.message);
      throw new Error('Erreur lors de la recherche d\'entreprises');
    }
  }

  /**
   * Convertir un code APE au format attendu par l'API
   * @param {String} codeApe - Code APE (ex: 6201 ou 62.01)
   * @returns {String} Code APE formaté (ex: 62.01Z)
   */
  formatCodeApe(codeApe) {
    if (!codeApe) return null;

    // Supprimer les espaces et points
    let code = codeApe.replace(/[\s.]/g, '');

    // Si le code a 4 chiffres (ex: 6201), formater en 62.01Z
    if (code.length === 4 && /^\d{4}$/.test(code)) {
      return `${code.substring(0, 2)}.${code.substring(2)}Z`;
    }

    // Si le code a déjà le format 62.01 ou 6201Z, ajouter Z si manquant
    if (code.length === 5 && /^\d{4}[A-Z]$/.test(code)) {
      return `${code.substring(0, 2)}.${code.substring(2)}`;
    }

    // Si déjà au bon format (62.01Z)
    if (/^\d{2}\.\d{2}[A-Z]$/.test(codeApe)) {
      return codeApe;
    }

    return codeApe + 'Z';
  }

  /**
   * Obtenir le libellé d'un code APE (simplifié)
   */
  getLibelleApe(codeApe) {
    const apeMap = {
      '62': 'Programmation, conseil et autres activités informatiques',
      '63': 'Services d\'information',
      '70': 'Activités des sièges sociaux ; conseil de gestion',
      '71': 'Activités d\'architecture et d\'ingénierie',
      '72': 'Recherche-développement scientifique',
      '73': 'Publicité et études de marché',
      '74': 'Autres activités spécialisées, scientifiques et techniques',
      '46': 'Commerce de gros',
      '47': 'Commerce de détail'
    };

    if (!codeApe) return 'Non renseigné';

    const prefix = codeApe.substring(0, 2);
    return apeMap[prefix] || 'Autres activités';
  }

  /**
   * Obtenir le libellé d'une tranche d'effectif
   */
  getLibelleEffectif(code) {
    const effectifMap = {
      'NN': 'Non renseigné',
      '00': '0 salarié',
      '01': '1 ou 2 salariés',
      '02': '3 à 5 salariés',
      '03': '6 à 9 salariés',
      '11': '10 à 19 salariés',
      '12': '20 à 49 salariés',
      '21': '50 à 99 salariés',
      '22': '100 à 199 salariés',
      '31': '200 à 249 salariés',
      '32': '250 à 499 salariés',
      '41': '500 à 999 salariés',
      '42': '1000 à 1999 salariés',
      '51': '2000 à 4999 salariés',
      '52': '5000 à 9999 salariés',
      '53': '10000 salariés et plus'
    };

    return effectifMap[code] || code || 'Non renseigné';
  }
}

module.exports = new SireneService();
