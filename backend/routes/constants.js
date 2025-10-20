const express = require('express');
const router = express.Router();
const constantsController = require('../controllers/constantsController');

// Route pour obtenir tous les secteurs APE
router.get('/ape-sectors', constantsController.getApeSectors);

// Route pour obtenir les tranches d'effectifs
router.get('/effectifs', constantsController.getEffectifs);

// Route pour obtenir les villes
router.get('/cities', constantsController.getCities);

// Route pour résoudre une localisation
router.get('/resolve-location', constantsController.resolveLocation);

// Route pour obtenir toutes les constantes en une fois
router.get('/all', constantsController.getAllConstants);

module.exports = router;
