/**
 * 📋 CATÉGORIES LARGES DE SECTEURS D'ACTIVITÉ
 * Regroupement logique pour faciliter la recherche d'entreprises
 * Chaque catégorie regroupe plusieurs codes APE/NAF
 */

const APE_SECTORS = [
  {
    id: 'all',
    label: '🌍 Tous les secteurs',
    icon: '🌍',
    codes: [] // Vide = pas de filtre APE
  },
  {
    id: 'services_conseil',
    label: '💼 Services & Conseil',
    icon: '💼',
    description: 'Conseil, informatique, juridique, comptabilité, RH, marketing',
    codes: [
      // Tech & Digital
      { value: '62.01Z', label: 'Programmation informatique' },
      { value: '62.02A', label: 'Conseil en systèmes informatiques' },
      { value: '62.02B', label: 'Tierce maintenance informatique' },
      { value: '62.03Z', label: 'Gestion d\'installations informatiques' },
      { value: '62.09Z', label: 'Autres activités informatiques' },
      { value: '63.11Z', label: 'Traitement de données & hébergement' },
      { value: '63.12Z', label: 'Portails Internet' },
      { value: '58.29C', label: 'Edition de logiciels' },
      // Conseil & Services
      { value: '70.22Z', label: 'Conseil pour les affaires' },
      { value: '70.10Z', label: 'Sièges sociaux' },
      { value: '71.12B', label: 'Ingénierie, études techniques' },
      { value: '78.10Z', label: 'Agences de recrutement' },
      { value: '78.20Z', label: 'Travail temporaire' },
      { value: '78.30Z', label: 'Mise à disposition RH' },
      { value: '69.20Z', label: 'Activités comptables' },
      { value: '69.10Z', label: 'Activités juridiques' },
      { value: '74.90B', label: 'Activités spécialisées diverses' },
      // Marketing & Communication
      { value: '73.11Z', label: 'Agences de publicité' },
      { value: '73.12Z', label: 'Régie publicitaire' },
      { value: '73.20Z', label: 'Études de marché et sondages' },
      { value: '70.21Z', label: 'Conseil en relations publiques' },
      { value: '74.10Z', label: 'Design spécialisé' },
      // Recherche & Développement
      { value: '72.11Z', label: 'R&D en biotechnologie' },
      { value: '72.19Z', label: 'R&D sciences physiques' },
      { value: '72.20Z', label: 'R&D sciences humaines' }
    ]
  },
  {
    id: 'commerce_distribution',
    label: '🏪 Commerce & Distribution',
    icon: '🏪',
    description: 'Vente en ligne, commerce de gros, retail, distribution',
    codes: [
      { value: '47.91A', label: 'Vente à distance (e-commerce)' },
      { value: '47.91B', label: 'Vente à distance spécialisée' },
      { value: '46.90Z', label: 'Commerce de gros' },
      { value: '47.11F', label: 'Hypermarchés' },
      { value: '47.19B', label: 'Commerces non spécialisés' },
      { value: '46.19B', label: 'Commerce de gros divers' },
      { value: '47.71Z', label: 'Commerce de détail d\'habillement' },
      { value: '47.72A', label: 'Commerce de détail de chaussures' },
      { value: '47.73Z', label: 'Commerce de détail de produits pharmaceutiques' },
      { value: '47.78C', label: 'Autres commerces de détail spécialisés' }
    ]
  },
  {
    id: 'industrie_btp',
    label: '🏗️ Industrie & BTP',
    icon: '🏗️',
    description: 'Construction, fabrication, industrie, travaux publics',
    codes: [
      // BTP & Construction
      { value: '41.10A', label: 'Promotion immobilière' },
      { value: '41.20A', label: 'Construction de maisons' },
      { value: '42.11Z', label: 'Construction de routes' },
      { value: '43.11Z', label: 'Travaux de démolition' },
      { value: '43.21A', label: 'Installation électrique' },
      { value: '43.22A', label: 'Installation eau et gaz' },
      { value: '43.29A', label: 'Travaux d\'isolation' },
      { value: '43.32A', label: 'Menuiserie' },
      { value: '43.39Z', label: 'Autres travaux de finition' },
      // Industrie & Fabrication
      { value: '25.11Z', label: 'Fabrication structures métalliques' },
      { value: '26.11Z', label: 'Composants électroniques' },
      { value: '26.20Z', label: 'Fabrication d\'ordinateurs' },
      { value: '27.11Z', label: 'Moteurs électriques' },
      { value: '28.11Z', label: 'Moteurs et turbines' },
      { value: '10.71A', label: 'Fabrication industrielle de pain' },
      { value: '10.71B', label: 'Cuisson de produits de boulangerie' }
    ]
  },
  {
    id: 'sante_social_education',
    label: '🏥 Santé, Social & Éducation',
    icon: '🏥',
    description: 'Santé, médical, social, formation, enseignement',
    codes: [
      // Santé & Social
      { value: '86.10Z', label: 'Activités hospitalières' },
      { value: '86.21Z', label: 'Médecins généralistes' },
      { value: '86.22Z', label: 'Médecins spécialistes' },
      { value: '86.23Z', label: 'Pratique dentaire' },
      { value: '86.90A', label: 'Ambulances' },
      { value: '86.90B', label: 'Laboratoires d\'analyses médicales' },
      { value: '87.10A', label: 'Hébergement médicalisé' },
      { value: '88.10A', label: 'Aide à domicile' },
      { value: '88.10B', label: 'Accueil ou accompagnement sans hébergement' },
      // Education & Formation
      { value: '85.42Z', label: 'Enseignement supérieur' },
      { value: '85.59A', label: 'Formation continue d\'adultes' },
      { value: '85.59B', label: 'Autres enseignements' },
      { value: '85.52Z', label: 'Enseignement culturel' },
      { value: '85.51Z', label: 'Enseignement sportif et récréatif' }
    ]
  },
  {
    id: 'loisirs_tourisme',
    label: '🎯 Loisirs, Tourisme & Restauration',
    icon: '🎯',
    description: 'Hôtellerie, restauration, tourisme, culture, sport',
    codes: [
      // Tourisme & Hôtellerie
      { value: '55.10Z', label: 'Hôtels et hébergement' },
      { value: '55.20Z', label: 'Hébergement touristique' },
      { value: '55.30Z', label: 'Terrains de camping' },
      { value: '56.10A', label: 'Restauration traditionnelle' },
      { value: '56.10B', label: 'Cafétérias' },
      { value: '56.10C', label: 'Restauration rapide' },
      { value: '56.21Z', label: 'Services des traiteurs' },
      { value: '56.30Z', label: 'Débits de boissons' },
      { value: '79.11Z', label: 'Agences de voyage' },
      { value: '79.12Z', label: 'Voyagistes' },
      // Culture & Loisirs
      { value: '90.01Z', label: 'Arts du spectacle vivant' },
      { value: '90.02Z', label: 'Activités de soutien au spectacle' },
      { value: '90.03A', label: 'Création artistique' },
      { value: '93.11Z', label: 'Gestion d\'installations sportives' },
      { value: '93.13Z', label: 'Activités de clubs de sports' },
      { value: '93.29Z', label: 'Autres activités récréatives' }
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
