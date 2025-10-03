import React, { useState, useEffect } from 'react';
import { companiesAPI } from '../services/api';
import './CompanyList.css';

function CompanyList({ companies, selectedCompanies, onCompanySelect }) {
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrapingStatus, setScrapingStatus] = useState({});

  useEffect(() => {
    loadCompanies();
  }, [companies]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await companiesAPI.getAll();
      setAllCompanies(response.data.data);
    } catch (err) {
      console.error('Erreur chargement entreprises:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeEmails = async (companyId) => {
    setScrapingStatus({ ...scrapingStatus, [companyId]: 'loading' });

    try {
      const response = await companiesAPI.scrapeEmails(companyId);

      if (response.data.success) {
        setScrapingStatus({
          ...scrapingStatus,
          [companyId]: {
            status: 'success',
            emails: response.data.emails,
            websiteUrl: response.data.websiteUrl
          }
        });
      } else {
        setScrapingStatus({
          ...scrapingStatus,
          [companyId]: {
            status: 'failed',
            message: response.data.message
          }
        });
      }
    } catch (err) {
      setScrapingStatus({
        ...scrapingStatus,
        [companyId]: {
          status: 'error',
          message: err.message
        }
      });
    }
  };

  const isSelected = (company) => {
    return selectedCompanies.some(c => c.siret === company.siret || c.id === company.id);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des entreprises...</p>
      </div>
    );
  }

  if (allCompanies.length === 0) {
    return (
      <div className="card">
        <h2>📋 Entreprises sauvegardées</h2>
        <p className="empty-state">
          Aucune entreprise sauvegardée. Commencez par faire une recherche !
        </p>
      </div>
    );
  }

  return (
    <div className="company-list">
      <div className="card">
        <h2>📋 Entreprises sauvegardées ({allCompanies.length})</h2>

        <div className="companies-grid">
          {allCompanies.map((company) => {
            const status = scrapingStatus[company.id];

            return (
              <div
                key={company.id}
                className={`company-item ${isSelected(company) ? 'selected' : ''}`}
              >
                <div className="company-select" onClick={() => onCompanySelect(company)}>
                  <input
                    type="checkbox"
                    checked={isSelected(company)}
                    onChange={() => {}}
                  />
                </div>

                <div className="company-content">
                  <h3>{company.nom}</h3>
                  <p className="company-location">📍 {company.ville} ({company.code_postal})</p>
                  <p className="company-sector">🏢 {company.libelle_ape}</p>

                  {company.website_url && (
                    <p className="company-website">
                      🌐 <a href={company.website_url} target="_blank" rel="noopener noreferrer">
                        {company.website_url}
                      </a>
                    </p>
                  )}

                  {/* Scraping status */}
                  {status?.status === 'loading' && (
                    <div className="scraping-status loading">
                      ⏳ Recherche des emails en cours...
                    </div>
                  )}

                  {status?.status === 'success' && (
                    <div className="scraping-status success">
                      ✅ {status.emails.length} email(s) trouvé(s):
                      <ul>
                        {status.emails.slice(0, 3).map((emailData, idx) => (
                          <li key={idx}>
                            {emailData.email}
                            {emailData.priority === 1 && ' 🎯'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {status?.status === 'failed' && (
                    <div className="scraping-status warning">
                      ⚠️ {status.message}
                    </div>
                  )}

                  {status?.status === 'error' && (
                    <div className="scraping-status error">
                      ❌ Erreur: {status.message}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="company-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleScrapeEmails(company.id)}
                      disabled={status?.status === 'loading'}
                    >
                      📧 Trouver emails
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CompanyList;
