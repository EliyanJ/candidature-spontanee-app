const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Créer le dossier uploads s'il n'existe pas
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Routes
const companiesRoutes = require('./routes/companies');
const campaignsRoutes = require('./routes/campaigns');

app.use('/api/companies', companiesRoutes);
app.use('/api/campaigns', campaignsRoutes);

// Route pour upload de CV
app.post('/api/upload-cv', upload.single('cv'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    path: req.file.path
  });
});

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// Configuration email test
const emailService = require('./services/emailService');

app.post('/api/config/email', (req, res) => {
  try {
    const { email, password, type } = req.body;

    emailService.setupTransporter({ email, password, type });

    res.json({
      success: true,
      message: 'Configuration email mise à jour'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/config/email/test', async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🚀 Serveur démarré sur le port ${PORT}        ║
║                                                ║
║   📡 API disponible sur:                       ║
║   http://localhost:${PORT}                     ║
║                                                ║
║   🔍 Health check:                             ║
║   http://localhost:${PORT}/api/health          ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;
