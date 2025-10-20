const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Configuration email
router.post('/email', configController.setEmailConfig);
router.post('/email/test', configController.testEmailConnection);

// Profil utilisateur
router.post('/user', configController.setUserProfile);
router.get('/user', configController.getUserProfile);

// Variables
router.get('/variables', configController.getAllVariables);

module.exports = router;
