/**
 * 👥 Mapping des tranches d'effectifs salariés
 * Codes utilisés par l'API Recherche Entreprises
 */

const TRANCHES_EFFECTIFS = [
  {
    id: 'tpe',
    label: 'TPE (1-9 salariés)',
    description: 'Très Petite Entreprise',
    codes: ['01', '02', '03'], // 1-2, 3-5, 6-9 salariés
    min: 1,
    max: 9
  },
  {
    id: 'petite',
    label: 'Petite entreprise (10-49 salariés)',
    description: 'Petite Entreprise',
    codes: ['11', '12'], // 10-19, 20-49 salariés
    min: 10,
    max: 49
  },
  {
    id: 'moyenne',
    label: 'Moyenne entreprise (50-249 salariés)',
    description: 'Entreprise de Taille Intermédiaire',
    codes: ['21', '22', '31'], // 50-99, 100-199, 200-249 salariés
    min: 50,
    max: 249
  },
  {
    id: 'grande',
    label: 'Grande entreprise (250+ salariés)',
    description: 'Grande Entreprise',
    codes: ['32', '41', '42', '51', '52', '53'], // 250-499, 500-999, 1000-1999, 2000-4999, 5000-9999, 10000+
    min: 250,
    max: Infinity
  }
];

/**
 * Mapping détaillé des codes INSEE
 */
const CODES_EFFECTIFS_DETAILS = {
  'NN': { label: 'Non renseigné', min: 0, max: 0 },
  '00': { label: '0 salarié', min: 0, max: 0 },
  '01': { label: '1 ou 2 salariés', min: 1, max: 2 },
  '02': { label: '3 à 5 salariés', min: 3, max: 5 },
  '03': { label: '6 à 9 salariés', min: 6, max: 9 },
  '11': { label: '10 à 19 salariés', min: 10, max: 19 },
  '12': { label: '20 à 49 salariés', min: 20, max: 49 },
  '21': { label: '50 à 99 salariés', min: 50, max: 99 },
  '22': { label: '100 à 199 salariés', min: 100, max: 199 },
  '31': { label: '200 à 249 salariés', min: 200, max: 249 },
  '32': { label: '250 à 499 salariés', min: 250, max: 499 },
  '41': { label: '500 à 999 salariés', min: 500, max: 999 },
  '42': { label: '1000 à 1999 salariés', min: 1000, max: 1999 },
  '51': { label: '2000 à 4999 salariés', min: 2000, max: 4999 },
  '52': { label: '5000 à 9999 salariés', min: 5000, max: 9999 },
  '53': { label: '10000 salariés et plus', min: 10000, max: Infinity }
};

/**
 * Obtenir les codes pour une tranche d'effectifs
 * @param {string} trancheId - ID de la tranche (tpe, petite, moyenne, grande)
 * @returns {Array<string>} Liste des codes
 */
function getCodesByTranche(trancheId) {
  const tranche = TRANCHES_EFFECTIFS.find(t => t.id === trancheId);
  return tranche ? tranche.codes : [];
}

/**
 * Obtenir le libellé d'un code effectif
 * @param {string} code - Code effectif
 * @returns {string} Libellé
 */
function getLibelleEffectif(code) {
  const details = CODES_EFFECTIFS_DETAILS[code];
  return details ? details.label : code || 'Non renseigné';
}

/**
 * Obtenir la tranche depuis un code
 * @param {string} code - Code effectif
 * @returns {Object|null} Tranche trouvée
 */
function getTrancheFromCode(code) {
  for (const tranche of TRANCHES_EFFECTIFS) {
    if (tranche.codes.includes(code)) {
      return tranche;
    }
  }
  return null;
}

/**
 * Vérifier si un code correspond à un entrepreneur individuel (0 salarié)
 * @param {string} code - Code effectif
 * @returns {boolean} True si 0 salarié
 */
function isEntrepreneurIndividuel(code) {
  return code === '00' || code === 'NN';
}

/**
 * Obtenir les codes pour filtrer plusieurs tranches
 * @param {Array<string>} tranchesIds - Liste des IDs de tranches
 * @returns {Array<string>} Liste des codes combinés
 */
function getCombinedCodes(tranchesIds) {
  const allCodes = [];

  for (const id of tranchesIds) {
    const codes = getCodesByTranche(id);
    allCodes.push(...codes);
  }

  // Dédupliquer
  return [...new Set(allCodes)];
}

module.exports = {
  TRANCHES_EFFECTIFS,
  CODES_EFFECTIFS_DETAILS,
  getCodesByTranche,
  getLibelleEffectif,
  getTrancheFromCode,
  isEntrepreneurIndividuel,
  getCombinedCodes
};
