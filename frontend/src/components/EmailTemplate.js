import React, { useState } from 'react';
import { campaignsAPI, uploadAPI } from '../services/api';
import './EmailTemplate.css';

function EmailTemplate({ selectedCompanies }) {
  const [template, setTemplate] = useState({
    name: 'Candidature spontanée ' + new Date().toLocaleDateString(),
    subject: 'Candidature spontanée - {votre_nom}',
    body: `Bonjour,

Je me permets de vous contacter dans le cadre d'une candidature spontanée au sein de {nom_entreprise}.

Actuellement étudiant(e) en {votre_formation}, je suis vivement intéressé(e) par votre secteur d'activité ({secteur_activite}) et particulièrement par votre entreprise située à {ville}.

Mon profil et mes compétences pourraient s'inscrire dans vos projets futurs. Je serais ravi(e) d'échanger avec vous sur les opportunités potentielles au sein de votre structure.

Vous trouverez mon CV en pièce jointe. Je reste à votre disposition pour un entretien.

Cordialement,
{votre_nom}
{votre_telephone}
{votre_linkedin}`,
    cv: null,
    emails_per_day: 40,
    delay_between_emails: 45
  });

  const [campaignId, setCampaignId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  const variables = [
    '{nom_entreprise}',
    '{ville}',
    '{secteur_activite}',
    '{votre_nom}',
    '{votre_telephone}',
    '{votre_linkedin}',
    '{votre_formation}',
    '{date}'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemplate({ ...template, [name]: value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Seuls les fichiers PDF sont acceptés');
      return;
    }

    setLoading(true);

    try {
      const response = await uploadAPI.uploadCV(file);
      setTemplate({ ...template, cv: response.data.filename });
      alert('✅ CV uploadé avec succès');
    } catch (err) {
      alert('Erreur upload CV: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('body-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = template.body;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setTemplate({ ...template, body: newText });

    // Refocus on textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const generatePreview = () => {
    if (selectedCompanies.length === 0) {
      alert('Sélectionnez au moins une entreprise dans l\'onglet Recherche ou Entreprises');
      return;
    }

    const company = selectedCompanies[0];
    const exampleVariables = {
      '{nom_entreprise}': company.nom,
      '{ville}': company.ville,
      '{secteur_activite}': company.libelle_ape,
      '{votre_nom}': 'Votre Nom',
      '{votre_telephone}': '06 12 34 56 78',
      '{votre_linkedin}': 'linkedin.com/in/votre-profil',
      '{votre_formation}': 'Master Informatique',
      '{date}': new Date().toLocaleDateString('fr-FR')
    };

    let previewBody = template.body;
    Object.keys(exampleVariables).forEach(key => {
      previewBody = previewBody.replace(new RegExp(key, 'g'), exampleVariables[key]);
    });

    let previewSubject = template.subject;
    Object.keys(exampleVariables).forEach(key => {
      previewSubject = previewSubject.replace(new RegExp(key, 'g'), exampleVariables[key]);
    });

    setPreview({ subject: previewSubject, body: previewBody });
  };

  const handleCreateCampaign = async () => {
    if (selectedCompanies.length === 0) {
      alert('Sélectionnez au moins une entreprise');
      return;
    }

    if (!template.subject || !template.body) {
      alert('Veuillez remplir l\'objet et le corps du message');
      return;
    }

    setLoading(true);

    try {
      const response = await campaignsAPI.create({
        name: template.name,
        template_subject: template.subject,
        template_body: template.body,
        cv_filename: template.cv,
        emails_per_day: parseInt(template.emails_per_day),
        delay_between_emails: parseInt(template.delay_between_emails)
      });

      setCampaignId(response.data.campaignId);
      alert('✅ Campagne créée avec succès');
    } catch (err) {
      alert('Erreur création campagne: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async () => {
    if (!campaignId) {
      alert('Créez d\'abord une campagne');
      return;
    }

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir lancer la campagne ?\n\n` +
      `${selectedCompanies.length} entreprises sélectionnées\n` +
      `${template.emails_per_day} emails max par jour\n` +
      `Délai entre envois: ${template.delay_between_emails}s`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const companyIds = selectedCompanies.map(c => c.id);
      const response = await campaignsAPI.start(campaignId, companyIds);

      alert(`✅ Campagne lancée !\n${response.data.totalEmails} emails seront envoyés.`);
    } catch (err) {
      alert('Erreur lancement campagne: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-template">
      <div className="card">
        <h2>✉️ Configuration de l'email</h2>

        <div className="form-group">
          <label>Nom de la campagne</label>
          <input
            type="text"
            name="name"
            value={template.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Objet de l'email</label>
          <input
            type="text"
            name="subject"
            value={template.subject}
            onChange={handleChange}
            placeholder="Candidature spontanée..."
          />
        </div>

        <div className="form-group">
          <label>Corps du message</label>
          <textarea
            id="body-textarea"
            name="body"
            value={template.body}
            onChange={handleChange}
            placeholder="Votre message..."
          />
        </div>

        <div className="variables-section">
          <label>Variables disponibles (cliquez pour insérer):</label>
          <div className="variables-grid">
            {variables.map(variable => (
              <button
                key={variable}
                type="button"
                className="variable-button"
                onClick={() => insertVariable(variable)}
              >
                {variable}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label>📎 CV (PDF uniquement)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
            {template.cv && (
              <p className="file-uploaded">✅ Fichier: {template.cv}</p>
            )}
          </div>

          <div className="form-group">
            <label>Emails par jour (max 500 pour Gmail)</label>
            <input
              type="number"
              name="emails_per_day"
              min="1"
              max="500"
              value={template.emails_per_day}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Délai entre envois (secondes)</label>
            <input
              type="number"
              name="delay_between_emails"
              min="10"
              max="300"
              value={template.delay_between_emails}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-secondary"
            onClick={generatePreview}
            disabled={loading}
          >
            👁️ Aperçu
          </button>

          <button
            className="btn btn-primary"
            onClick={handleCreateCampaign}
            disabled={loading || selectedCompanies.length === 0}
          >
            💾 Créer la campagne
          </button>

          {campaignId && (
            <button
              className="btn btn-success"
              onClick={handleStartCampaign}
              disabled={loading}
            >
              🚀 Lancer l'envoi
            </button>
          )}
        </div>

        <p className="info-text">
          📊 {selectedCompanies.length} entreprise(s) sélectionnée(s)
        </p>
      </div>

      {/* Prévisualisation */}
      {preview && (
        <div className="card preview-card">
          <h2>👁️ Prévisualisation</h2>

          <div className="preview-content">
            <div className="preview-header">
              <p><strong>Objet:</strong> {preview.subject}</p>
            </div>

            <div className="preview-body">
              {preview.body.split('\n').map((line, idx) => (
                <p key={idx}>{line || <br />}</p>
              ))}
            </div>

            {template.cv && (
              <div className="preview-attachment">
                📎 Pièce jointe: {template.cv}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailTemplate;
