const { APE_SECTORS } = require('../constants/apeSectors');
const { TRANCHES_EFFECTIFS } = require('../constants/effectifs');
const { CITIES_WITH_ARRONDISSEMENTS, MAIN_CITIES, resolveLocation } = require('../constants/cities');

class ConstantsController {
  /**
   * Obtenir tous les secteurs APE organisés
   */
  getApeSectors(req, res) {
    try {
      res.json({
        success: true,
        sectors: APE_SECTORS
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir les tranches d'effectifs
   */
  getEffectifs(req, res) {
    try {
      res.json({
        success: true,
        tranches: TRANCHES_EFFECTIFS
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir la liste des villes avec arrondissements
   */
  getCities(req, res) {
    try {
      res.json({
        success: true,
        citiesWithArrondissements: CITIES_WITH_ARRONDISSEMENTS,
        mainCities: Object.keys(MAIN_CITIES)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Résoudre une localisation (ville ou code postal)
   */
  resolveLocation(req, res) {
    try {
      const { location } = req.query;

      if (!location) {
        return res.status(400).json({
          success: false,
          message: 'Paramètre "location" requis'
        });
      }

      const result = resolveLocation(location);

      res.json({
        success: result.success,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir toutes les constantes en une seule requête
   */
  getAllConstants(req, res) {
    try {
      res.json({
        success: true,
        data: {
          apeSectors: APE_SECTORS,
          effectifs: TRANCHES_EFFECTIFS,
          citiesWithArrondissements: CITIES_WITH_ARRONDISSEMENTS,
          mainCities: Object.keys(MAIN_CITIES)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ConstantsController();
