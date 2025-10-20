/**
 * Script pour importer les communes depuis le CSV
 * et mettre à jour backend/constants/cities.js
 */

const fs = require('fs');
const path = require('path');

// Chemins
const CSV_PATH = path.join(__dirname, '../commune.csv');
const CITIES_FILE = path.join(__dirname, 'constants/cities.js');

/**
 * Normaliser un nom de ville (supprimer accents, minuscules, tirets)
 */
function normalizeCityName(cityName) {
  if (!cityName) return '';

  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/'/g, '-') // Remplacer apostrophes par tirets
    .trim();
}

/**
 * Parser le CSV et retourner un objet ville -> codes postaux
 */
function parseCSV() {
  console.log('📖 Lecture du fichier CSV...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');

  // Ignorer l'en-tête
  const dataLines = lines.slice(1).filter(line => line.trim());

  console.log(`📊 ${dataLines.length} lignes trouvées`);

  const cities = {};

  for (const line of dataLines) {
    const [nom, codePostal] = line.split(';').map(s => s.trim());

    if (!nom || !codePostal) continue;

    // Normaliser le nom de la ville
    const normalizedName = normalizeCityName(nom);

    // Ajouter le code postal à la ville
    if (!cities[normalizedName]) {
      cities[normalizedName] = [];
    }

    // Éviter les doublons
    if (!cities[normalizedName].includes(codePostal)) {
      cities[normalizedName].push(codePostal);
    }
  }

  console.log(`🏙️  ${Object.keys(cities).length} villes uniques trouvées`);

  return cities;
}

/**
 * Lire le fichier cities.js actuel et extraire MAIN_CITIES
 */
function readCurrentCities() {
  console.log('📖 Lecture du fichier cities.js actuel...');
  const content = fs.readFileSync(CITIES_FILE, 'utf-8');

  // Extraire la partie CITIES_WITH_ARRONDISSEMENTS
  const arrondMatch = content.match(/const CITIES_WITH_ARRONDISSEMENTS = \{[\s\S]*?\n\};/);
  const arrondissementsSection = arrondMatch ? arrondMatch[0] : null;

  // Extraire MAIN_CITIES existant
  const mainCitiesMatch = content.match(/const MAIN_CITIES = \{[\s\S]*?\n\};/);

  if (!mainCitiesMatch) {
    return { arrondissementsSection, existingCities: {} };
  }

  // Parser MAIN_CITIES pour obtenir les villes existantes
  const mainCitiesContent = mainCitiesMatch[0];
  const existingCities = {};

  // Expression régulière pour extraire les entrées
  const regex = /'([^']+)':\s*\[([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(mainCitiesContent)) !== null) {
    const cityName = match[1];
    const codePostaux = match[2]
      .split(',')
      .map(s => s.trim().replace(/'/g, ''))
      .filter(s => s);

    existingCities[cityName] = codePostaux;
  }

  console.log(`✅ ${Object.keys(existingCities).length} villes existantes trouvées`);

  return { arrondissementsSection, existingCities };
}

/**
 * Fusionner les villes existantes avec les nouvelles
 */
function mergeCities(existingCities, newCities) {
  console.log('🔀 Fusion des villes...');

  const merged = { ...existingCities };
  let addedCount = 0;
  let updatedCount = 0;

  for (const [cityName, codePostaux] of Object.entries(newCities)) {
    if (!merged[cityName]) {
      merged[cityName] = codePostaux;
      addedCount++;
    } else {
      // Fusionner les codes postaux
      const existingCodes = merged[cityName];
      const allCodes = [...new Set([...existingCodes, ...codePostaux])];

      if (allCodes.length > existingCodes.length) {
        merged[cityName] = allCodes;
        updatedCount++;
      }
    }
  }

  console.log(`✨ ${addedCount} nouvelles villes ajoutées`);
  console.log(`🔄 ${updatedCount} villes mises à jour avec de nouveaux codes postaux`);
  console.log(`📊 Total: ${Object.keys(merged).length} villes`);

  return merged;
}

/**
 * Générer le contenu de MAIN_CITIES formaté
 */
function generateMainCitiesContent(cities) {
  const entries = Object.entries(cities)
    .sort((a, b) => a[0].localeCompare(b[0])) // Tri alphabétique
    .map(([cityName, codePostaux]) => {
      const codes = codePostaux.map(c => `'${c}'`).join(', ');
      return `  '${cityName}': [${codes}]`;
    });

  return `const MAIN_CITIES = {\n${entries.join(',\n')}\n};`;
}

/**
 * Réécrire le fichier cities.js
 */
function writeCitiesFile(arrondissementsSection, mainCitiesContent) {
  console.log('✍️  Écriture du nouveau fichier cities.js...');

  const fileContent = `/**
 * 🏙️ Gestion des villes avec arrondissements
 * Paris, Lyon, Marseille
 */

${arrondissementsSection}

/**
 * Mapping des villes françaises vers leurs codes postaux
 * Pour les villes sans arrondissements
 */
${mainCitiesContent}

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
    .replace(/\\s+/g, '-') // Remplacer espaces par tirets
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
  if (/^\\d{5}$/.test(cleaned)) {
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
      error: \`Ville "\${input}" non trouvée\`,
      suggestions: suggestions,
      codePostaux: []
    };
  }

  // Cas 5 : Aucune correspondance
  return {
    success: false,
    type: 'not_found',
    original: input,
    error: \`Ville "\${input}" non reconnue. Veuillez entrer un code postal spécifique.\`,
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
  return /^\\d{5}$/.test(codePostal);
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

/**
 * 🎲 RANDOMISATION GÉOGRAPHIQUE
 *
 * Sélectionne aléatoirement N arrondissements parmi une liste
 * Utilisé pour diversifier les recherches sans réduire la couverture géographique
 *
 * @param {Array<string>} codePostaux - Liste complète des codes postaux
 * @param {Number} count - Nombre d'arrondissements à sélectionner (défaut: 3)
 * @returns {Array<string>} Liste de codes postaux sélectionnés
 */
function selectRandomArrondissements(codePostaux, count = 3) {
  if (!codePostaux || codePostaux.length === 0) {
    return [];
  }

  // Si on demande plus que disponible, retourner tous
  if (count >= codePostaux.length) {
    return codePostaux;
  }

  // Mélanger avec Fisher-Yates
  const shuffled = [...codePostaux];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Prendre les N premiers
  return shuffled.slice(0, count);
}

module.exports = {
  CITIES_WITH_ARRONDISSEMENTS,
  MAIN_CITIES,
  normalizeCityName,
  detectInputType,
  resolveLocation,
  findSimilarCities,
  isValidCodePostal,
  getDepartementFromCodePostal,
  selectRandomArrondissements
};
`;

  fs.writeFileSync(CITIES_FILE, fileContent, 'utf-8');
  console.log('✅ Fichier cities.js mis à jour !');
}

/**
 * Main
 */
function main() {
  console.log('🚀 Importation des communes...\n');

  // 1. Parser le CSV
  const newCities = parseCSV();

  // 2. Lire les villes existantes
  const { arrondissementsSection, existingCities } = readCurrentCities();

  // 3. Fusionner
  const mergedCities = mergeCities(existingCities, newCities);

  // 4. Générer le nouveau contenu
  const mainCitiesContent = generateMainCitiesContent(mergedCities);

  // 5. Écrire le fichier
  writeCitiesFile(arrondissementsSection, mainCitiesContent);

  console.log('\n🎉 Import terminé avec succès !');
}

// Exécution
main();
