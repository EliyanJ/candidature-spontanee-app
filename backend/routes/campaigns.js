const express = require('express');
const router = express.Router();
const campaignsController = require('../controllers/campaignsController');

// Créer une campagne
router.post('/', campaignsController.createCampaign.bind(campaignsController));

// Obtenir toutes les campagnes
router.get('/', campaignsController.getCampaigns.bind(campaignsController));

// Lancer une campagne
router.post('/:campaignId/start', campaignsController.startCampaign.bind(campaignsController));

// Obtenir les statistiques d'une campagne
router.get('/:campaignId/stats', campaignsController.getCampaignStats.bind(campaignsController));

module.exports = router;
