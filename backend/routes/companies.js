const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');

// Rechercher des entreprises via l'API Sirene
router.get('/search', companiesController.searchCompanies.bind(companiesController));

// Sauvegarder une entreprise
router.post('/', companiesController.saveCompany.bind(companiesController));

// Obtenir toutes les entreprises sauvegardées
router.get('/', companiesController.getSavedCompanies.bind(companiesController));

// Scraper les emails d'une entreprise
router.post('/:companyId/scrape-emails', companiesController.scrapeCompanyEmails.bind(companiesController));

// Obtenir les emails d'une entreprise
router.get('/:companyId/emails', companiesController.getCompanyEmails.bind(companiesController));

// Scraper les sites web de plusieurs entreprises en parallèle
router.post('/scrape-websites-parallel', companiesController.scrapeWebsitesParallel.bind(companiesController));

module.exports = router;
