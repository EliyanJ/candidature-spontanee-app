/**
 * 🏙️ Gestion des villes avec arrondissements
 * Paris, Lyon, Marseille
 */

const CITIES_WITH_ARRONDISSEMENTS = {
  paris: {
    name: 'Paris',
    normalizedName: 'paris',
    codePostaux: [
      '75001', '75002', '75003', '75004', '75005',
      '75006', '75007', '75008', '75009', '75010',
      '75011', '75012', '75013', '75014', '75015',
      '75016', '75017', '75018', '75019', '75020'
    ],
    totalArrondissements: 20
  },
  lyon: {
    name: 'Lyon',
    normalizedName: 'lyon',
    codePostaux: [
      '69001', '69002', '69003', '69004', '69005',
      '69006', '69007', '69008', '69009'
    ],
    totalArrondissements: 9
  },
  marseille: {
    name: 'Marseille',
    normalizedName: 'marseille',
    codePostaux: [
      '13001', '13002', '13003', '13004', '13005',
      '13006', '13007', '13008', '13009', '13010',
      '13011', '13012', '13013', '13014', '13015', '13016'
    ],
    totalArrondissements: 16
  }
};

/**
 * Mapping des principales villes françaises vers leurs codes postaux
 * Pour les villes sans arrondissements
 */
const MAIN_CITIES = {
  // Île-de-France
  'boulogne-billancourt': ['92100'],
  'nanterre': ['92000'],
  'montreuil': ['93100'],
  'saint-denis': ['93200'],
  'argenteuil': ['95100'],
  'versailles': ['78000'],

  // Grandes villes de province
  'toulouse': ['31000', '31100', '31200', '31300', '31400', '31500'],
  'nice': ['06000', '06100', '06200', '06300'],
  'nantes': ['44000', '44100', '44200', '44300'],
  'strasbourg': ['67000', '67100', '67200'],
  'montpellier': ['34000', '34070', '34080', '34090'],
  'bordeaux': ['33000', '33100', '33200', '33300', '33800'],
  'lille': ['59000', '59160', '59260', '59777', '59800'],
  'rennes': ['35000', '35200', '35700'],
  'reims': ['51100'],
  'le-havre': ['76600', '76610', '76620'],
  'saint-etienne': ['42000', '42100'],
  'toulon': ['83000', '83100', '83200'],
  'grenoble': ['38000', '38100'],
  'dijon': ['21000'],
  'angers': ['49000', '49100'],
  'nimes': ['30000', '30900'],
  'villeurbanne': ['69100'],
  'clermont-ferrand': ['63000', '63100'],
  'le-mans': ['72000', '72100'],
  'aix-en-provence': ['13080', '13090', '13100'],
  'brest': ['29200'],
  'tours': ['37000', '37100', '37200'],
  'amiens': ['80000'],
  'limoges': ['87000'],
  'annecy': ['74000'],
  'perpignan': ['66000'],
  'besancon': ['25000'],
  'metz': ['57000'],
  'orleans': ['45000']
};

/**
 * Normaliser un nom de ville (supprimer accents, minuscules, tirets)
 * @param {string} cityName - Nom de la ville
 * @returns {string} Nom normalisé
 */
function normalizeCityName(cityName) {
  if (!cityName) return '';

  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .trim();
}

/**
 * Détecter si une entrée est un code postal ou un nom de ville
 * @param {string} input - Entrée utilisateur
 * @returns {Object} Type et valeur
 */
function detectInputType(input) {
  if (!input) return { type: 'unknown', value: null };

  const cleaned = input.trim();

  // Si c'est 5 chiffres = code postal
  if (/^\d{5}$/.test(cleaned)) {
    return {
      type: 'code_postal',
      value: cleaned
    };
  }

  // Sinon c'est un nom de ville
  return {
    type: 'ville',
    value: normalizeCityName(cleaned)
  };
}

/**
 * Convertir une ville ou code postal en liste de codes postaux pour l'API
 * @param {string} input - Entrée utilisateur (ville ou code postal)
 * @returns {Object} Résultat avec codes postaux et informations
 */
function resolveLocation(input) {
  const { type, value } = detectInputType(input);

  if (type === 'unknown' || !value) {
    return {
      success: false,
      error: 'Entrée invalide',
      codePostaux: []
    };
  }

  // Cas 1 : Code postal unique
  if (type === 'code_postal') {
    return {
      success: true,
      type: 'code_postal',
      original: input,
      codePostaux: [value],
      count: 1
    };
  }

  // Cas 2 : Ville avec arrondissements (Paris, Lyon, Marseille)
  const cityWithArrond = CITIES_WITH_ARRONDISSEMENTS[value];
  if (cityWithArrond) {
    return {
      success: true,
      type: 'ville_arrondissements',
      ville: cityWithArrond.name,
      original: input,
      codePostaux: cityWithArrond.codePostaux,
      count: cityWithArrond.totalArrondissements
    };
  }

  // Cas 3 : Ville principale sans arrondissements
  const mainCityCodes = MAIN_CITIES[value];
  if (mainCityCodes) {
    return {
      success: true,
      type: 'ville_principale',
      ville: input,
      original: input,
      codePostaux: mainCityCodes,
      count: mainCityCodes.length
    };
  }

  // Cas 4 : Ville inconnue - chercher une correspondance approximative
  const suggestions = findSimilarCities(value);

  if (suggestions.length > 0) {
    return {
      success: false,
      type: 'ville_inconnue',
      original: input,
      error: `Ville "${input}" non trouvée`,
      suggestions: suggestions,
      codePostaux: []
    };
  }

  // Cas 5 : Aucune correspondance
  return {
    success: false,
    type: 'not_found',
    original: input,
    error: `Ville "${input}" non reconnue. Veuillez entrer un code postal spécifique.`,
    codePostaux: []
  };
}

/**
 * Trouver des villes similaires (correction orthographique simple)
 * @param {string} searchTerm - Terme de recherche
 * @returns {Array<string>} Liste de suggestions
 */
function findSimilarCities(searchTerm) {
  const allCities = [
    ...Object.values(CITIES_WITH_ARRONDISSEMENTS).map(c => c.normalizedName),
    ...Object.keys(MAIN_CITIES)
  ];

  // Distance de Levenshtein simple
  const suggestions = allCities
    .map(city => ({
      city,
      distance: levenshteinDistance(searchTerm, city)
    }))
    .filter(item => item.distance <= 3) // Maximum 3 caractères de différence
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3) // Top 3 suggestions
    .map(item => item.city);

  return suggestions;
}

/**
 * Calculer la distance de Levenshtein entre deux chaînes
 * @param {string} a - Première chaîne
 * @param {string} b - Deuxième chaîne
 * @returns {number} Distance
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Valider un code postal français
 * @param {string} codePostal - Code postal à valider
 * @returns {boolean} True si valide
 */
function isValidCodePostal(codePostal) {
  return /^\d{5}$/.test(codePostal);
}

/**
 * Obtenir le département depuis un code postal
 * @param {string} codePostal - Code postal
 * @returns {string} Numéro de département
 */
function getDepartementFromCodePostal(codePostal) {
  if (!isValidCodePostal(codePostal)) return null;

  // Cas spécial Corse
  if (codePostal.startsWith('20')) {
    return codePostal.startsWith('200') || codePostal.startsWith('201') ? '2A' : '2B';
  }

  return codePostal.substring(0, 2);
}

module.exports = {
  CITIES_WITH_ARRONDISSEMENTS,
  MAIN_CITIES,
  normalizeCityName,
  detectInputType,
  resolveLocation,
  findSimilarCities,
  isValidCodePostal,
  getDepartementFromCodePostal
};
