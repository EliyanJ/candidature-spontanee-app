import React, { useState } from 'react';
import { configAPI } from '../services/api';
import './Settings.css';

function Settings() {
  const [config, setConfig] = useState({
    smtp_type: 'gmail',
    smtp_email: '',
    smtp_password: '',
    user_name: '',
    user_phone: '',
    user_linkedin: '',
    user_formation: '',
    user_ecole: ''
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();

    try {
      await configAPI.setEmail({
        email: config.smtp_email,
        password: config.smtp_password,
        type: config.smtp_type
      });

      alert('✅ Configuration sauvegardée');
    } catch (err) {
      alert('Erreur sauvegarde config: ' + err.message);
    }
  };

  const handleTestConnection = async () => {
    if (!config.smtp_email || !config.smtp_password) {
      alert('Veuillez renseigner l\'email et le mot de passe');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Sauvegarder d'abord
      await configAPI.setEmail({
        email: config.smtp_email,
        password: config.smtp_password,
        type: config.smtp_type
      });

      // Tester la connexion
      const response = await configAPI.testEmail();

      setTestResult({
        success: response.data.success,
        message: response.data.message
      });

    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="settings">
      <div className="card">
        <h2>⚙️ Configuration Email</h2>

        <form onSubmit={handleSaveConfig}>
          <div className="form-group">
            <label>Type de service email</label>
            <select name="smtp_type" value={config.smtp_type} onChange={handleChange}>
              <option value="gmail">Gmail</option>
              <option value="outlook">Outlook</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          <div className="form-group">
            <label>Adresse email</label>
            <input
              type="email"
              name="smtp_email"
              value={config.smtp_email}
              onChange={handleChange}
              placeholder="votre.email@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Mot de passe d'application
              {config.smtp_type === 'gmail' && (
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="help-link"
                >
                  (Comment créer ?)
                </a>
              )}
            </label>
            <input
              type="password"
              name="smtp_password"
              value={config.smtp_password}
              onChange={handleChange}
              placeholder="xxxx xxxx xxxx xxxx"
              required
            />
            <small className="help-text">
              ⚠️ Pour Gmail, vous devez créer un "mot de passe d'application" dans les
              paramètres de sécurité de votre compte Google. N'utilisez PAS votre mot de passe
              principal !
            </small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              💾 Sauvegarder la configuration
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? '⏳ Test en cours...' : '🔌 Tester la connexion'}
            </button>
          </div>
        </form>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </div>
        )}
      </div>

      <div className="card">
        <h2>👤 Informations personnelles</h2>

        <p className="info-banner">
          Ces informations seront utilisées pour personnaliser vos emails avec les variables
          disponibles.
        </p>

        <div className="form-group">
          <label>Nom complet</label>
          <input
            type="text"
            name="user_name"
            value={config.user_name}
            onChange={handleChange}
            placeholder="Jean Dupont"
          />
        </div>

        <div className="form-group">
          <label>Téléphone</label>
          <input
            type="tel"
            name="user_phone"
            value={config.user_phone}
            onChange={handleChange}
            placeholder="06 12 34 56 78"
          />
        </div>

        <div className="form-group">
          <label>Profil LinkedIn</label>
          <input
            type="url"
            name="user_linkedin"
            value={config.user_linkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/votre-profil"
          />
        </div>

        <div className="form-group">
          <label>Formation</label>
          <input
            type="text"
            name="user_formation"
            value={config.user_formation}
            onChange={handleChange}
            placeholder="Master Informatique"
          />
        </div>

        <div className="form-group">
          <label>École / Université</label>
          <input
            type="text"
            name="user_ecole"
            value={config.user_ecole}
            onChange={handleChange}
            placeholder="Université Paris"
          />
        </div>

        <button type="button" className="btn btn-primary">
          💾 Sauvegarder le profil
        </button>
      </div>

      <div className="card info-card">
        <h2>ℹ️ Informations importantes</h2>

        <div className="info-section">
          <h3>📧 Limites d'envoi Gmail</h3>
          <ul>
            <li>Maximum 500 emails par jour</li>
            <li>Maximum 100 destinataires par email</li>
            <li>Recommandé: 40-50 emails/jour pour éviter d'être marqué comme spam</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>⚠️ Bonnes pratiques</h3>
          <ul>
            <li>Utilisez un délai d'au moins 30 secondes entre les envois</li>
            <li>Envoyez uniquement pendant les heures ouvrables (9h-18h)</li>
            <li>Personnalisez vos emails avec les variables disponibles</li>
            <li>Vérifiez que votre CV est à jour</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>🔒 Sécurité</h3>
          <ul>
            <li>Vos identifiants sont stockés localement</li>
            <li>Utilisez toujours un mot de passe d'application, jamais votre mot de passe principal</li>
            <li>Ne partagez jamais vos identifiants</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;
