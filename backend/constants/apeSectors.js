/**
 * 📋 Mapping des secteurs d'activité avec leurs codes APE/NAF
 * Utilisé pour l'interface de filtrage utilisateur
 */

const APE_SECTORS = [
  {
    id: 'tech_digital',
    label: '💻 Tech & Digital',
    icon: '💻',
    codes: [
      { value: '62.01Z', label: 'Programmation informatique' },
      { value: '62.02A', label: 'Conseil en systèmes informatiques' },
      { value: '62.02B', label: 'Tierce maintenance informatique' },
      { value: '62.03Z', label: 'Gestion d\'installations informatiques' },
      { value: '62.09Z', label: 'Autres activités informatiques' },
      { value: '63.11Z', label: 'Traitement de données & hébergement' },
      { value: '63.12Z', label: 'Portails Internet' },
      { value: '58.29C', label: 'Edition de logiciels' },
      { value: '73.11Z', label: 'Agences de publicité' },
      { value: '74.10Z', label: 'Design spécialisé' }
    ]
  },
  {
    id: 'conseil_services',
    label: '🏢 Conseil & Services',
    icon: '🏢',
    codes: [
      { value: '70.22Z', label: 'Conseil pour les affaires' },
      { value: '70.10Z', label: 'Sièges sociaux' },
      { value: '71.12B', label: 'Ingénierie, études techniques' },
      { value: '78.10Z', label: 'Agences de recrutement' },
      { value: '78.20Z', label: 'Travail temporaire' },
      { value: '78.30Z', label: 'Mise à disposition RH' },
      { value: '69.20Z', label: 'Activités comptables' },
      { value: '69.10Z', label: 'Activités juridiques' },
      { value: '74.90B', label: 'Activités spécialisées diverses' }
    ]
  },
  {
    id: 'marketing_communication',
    label: '📊 Marketing & Communication',
    icon: '📊',
    codes: [
      { value: '73.11Z', label: 'Agences de publicité' },
      { value: '73.12Z', label: 'Régie publicitaire' },
      { value: '73.20Z', label: 'Études de marché et sondages' },
      { value: '70.21Z', label: 'Conseil en relations publiques' }
    ]
  },
  {
    id: 'commerce_ecommerce',
    label: '🏪 Commerce & E-commerce',
    icon: '🏪',
    codes: [
      { value: '47.91A', label: 'Vente à distance (e-commerce)' },
      { value: '47.91B', label: 'Vente à distance spécialisée' },
      { value: '46.90Z', label: 'Commerce de gros' },
      { value: '47.11F', label: 'Hypermarchés' },
      { value: '47.19B', label: 'Commerces non spécialisés' }
    ]
  },
  {
    id: 'banque_finance',
    label: '🏦 Banque & Finance',
    icon: '🏦',
    codes: [
      { value: '64.19Z', label: 'Banques & intermédiations' },
      { value: '64.20Z', label: 'Sociétés holding' },
      { value: '64.30Z', label: 'Fonds de placement' },
      { value: '64.91Z', label: 'Crédit-bail' },
      { value: '64.99Z', label: 'Autres services financiers' },
      { value: '66.12Z', label: 'Courtage' },
      { value: '66.19B', label: 'Services financiers auxiliaires' }
    ]
  },
  {
    id: 'education_formation',
    label: '🎓 Education & Formation',
    icon: '🎓',
    codes: [
      { value: '85.42Z', label: 'Enseignement supérieur' },
      { value: '85.59A', label: 'Formation continue d\'adultes' },
      { value: '85.59B', label: 'Autres enseignements' },
      { value: '85.52Z', label: 'Enseignement culturel' }
    ]
  },
  {
    id: 'btp_construction',
    label: '🏗️ BTP & Construction',
    icon: '🏗️',
    codes: [
      { value: '41.10A', label: 'Promotion immobilière' },
      { value: '41.20A', label: 'Construction de maisons' },
      { value: '42.11Z', label: 'Construction de routes' },
      { value: '43.11Z', label: 'Travaux de démolition' },
      { value: '43.21A', label: 'Installation électrique' },
      { value: '43.22A', label: 'Installation eau et gaz' },
      { value: '71.12B', label: 'Ingénierie BTP' }
    ]
  },
  {
    id: 'immobilier',
    label: '🏠 Immobilier',
    icon: '🏠',
    codes: [
      { value: '68.10Z', label: 'Marchands de biens immobiliers' },
      { value: '68.20A', label: 'Location de logements' },
      { value: '68.20B', label: 'Location de terrains' },
      { value: '68.31Z', label: 'Agences immobilières' },
      { value: '68.32A', label: 'Administration d\'immeubles' }
    ]
  },
  {
    id: 'sante_social',
    label: '🏥 Santé & Social',
    icon: '🏥',
    codes: [
      { value: '86.10Z', label: 'Activités hospitalières' },
      { value: '86.21Z', label: 'Médecins généralistes' },
      { value: '86.22Z', label: 'Médecins spécialistes' },
      { value: '86.90A', label: 'Ambulances' },
      { value: '87.10A', label: 'Hébergement médicalisé' },
      { value: '88.10A', label: 'Aide à domicile' }
    ]
  },
  {
    id: 'tourisme_hotellerie',
    label: '🏨 Tourisme & Hôtellerie',
    icon: '🏨',
    codes: [
      { value: '55.10Z', label: 'Hôtels et hébergement' },
      { value: '56.10A', label: 'Restauration traditionnelle' },
      { value: '56.10B', label: 'Cafétérias' },
      { value: '56.10C', label: 'Restauration rapide' },
      { value: '79.11Z', label: 'Agences de voyage' },
      { value: '79.12Z', label: 'Voyagistes' }
    ]
  },
  {
    id: 'industrie_fabrication',
    label: '🏭 Industrie & Fabrication',
    icon: '🏭',
    codes: [
      { value: '25.11Z', label: 'Fabrication structures métalliques' },
      { value: '26.11Z', label: 'Composants électroniques' },
      { value: '26.20Z', label: 'Fabrication d\'ordinateurs' },
      { value: '27.11Z', label: 'Moteurs électriques' },
      { value: '28.11Z', label: 'Moteurs et turbines' }
    ]
  },
  {
    id: 'transport_logistique',
    label: '🚚 Transport & Logistique',
    icon: '🚚',
    codes: [
      { value: '49.20Z', label: 'Transports ferroviaires de fret' },
      { value: '49.41A', label: 'Transports routiers interurbains' },
      { value: '49.41B', label: 'Transports routiers de proximité' },
      { value: '52.10A', label: 'Entreposage frigorifique' },
      { value: '52.10B', label: 'Entreposage non frigorifique' },
      { value: '52.29A', label: 'Messagerie, fret express' }
    ]
  },
  {
    id: 'telecoms_medias',
    label: '📡 Télécoms & Médias',
    icon: '📡',
    codes: [
      { value: '58.11Z', label: 'Edition de livres' },
      { value: '58.13Z', label: 'Edition de journaux' },
      { value: '58.21Z', label: 'Edition de jeux électroniques' },
      { value: '59.11A', label: 'Production films et TV' },
      { value: '60.10Z', label: 'Radio' },
      { value: '61.10Z', label: 'Télécommunications filaires' },
      { value: '61.20Z', label: 'Télécommunications sans fil' },
      { value: '61.30Z', label: 'Télécommunications par satellite' }
    ]
  },
  {
    id: 'recherche_developpement',
    label: '🔬 Recherche & Développement',
    icon: '🔬',
    codes: [
      { value: '72.11Z', label: 'R&D en biotechnologie' },
      { value: '72.19Z', label: 'R&D sciences physiques' },
      { value: '72.20Z', label: 'R&D sciences humaines' }
    ]
  }
];

/**
 * Obtenir tous les codes APE d'un secteur
 * @param {string} sectorId - ID du secteur
 * @returns {Array<string>} Liste des codes APE
 */
function getCodesBySector(sectorId) {
  const sector = APE_SECTORS.find(s => s.id === sectorId);
  return sector ? sector.codes.map(c => c.value) : [];
}

/**
 * Rechercher un code APE dans tous les secteurs
 * @param {string} code - Code APE à rechercher
 * @returns {Object|null} Secteur et code trouvé
 */
function findCodeInSectors(code) {
  for (const sector of APE_SECTORS) {
    const found = sector.codes.find(c => c.value === code);
    if (found) {
      return {
        sector: sector.label,
        sectorId: sector.id,
        code: found
      };
    }
  }
  return null;
}

/**
 * Obtenir un secteur par son ID
 * @param {string} sectorId - ID du secteur
 * @returns {Object|null} Secteur trouvé
 */
function getSectorById(sectorId) {
  return APE_SECTORS.find(s => s.id === sectorId) || null;
}

module.exports = {
  APE_SECTORS,
  getCodesBySector,
  findCodeInSectors,
  getSectorById
};
