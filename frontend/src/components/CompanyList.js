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
      const companies = response.data.data;

      // Charger les emails pour chaque entreprise
      const companiesWithEmails = await Promise.all(
        companies.map(async (company) => {
          try {
            const emailsResponse = await companiesAPI.getEmails(company.id);
            return {
              ...company,
              emails: emailsResponse.data.emails || []
            };
          } catch (err) {
            return {
              ...company,
              emails: []
            };
          }
        })
      );

      setAllCompanies(companiesWithEmails);
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

                  {/* Afficher les emails directement */}
                  {company.emails && company.emails.length > 0 ? (
                    <div className="emails-list">
                      <p className="emails-title">📧 Emails trouvés :</p>
                      <ul>
                        {company.emails.slice(0, 3).map((emailData, idx) => (
                          <li key={idx} className="email-item">
                            {emailData.email}
                            {emailData.priority === 1 && <span className="priority-badge">🎯 Prioritaire</span>}
                          </li>
                        ))}
                      </ul>
                      {company.emails.length > 3 && (
                        <small>+ {company.emails.length - 3} autre(s) email(s)</small>
                      )}
                    </div>
                  ) : company.website_url ? (
                    <div className="no-emails">
                      ⚠️ Aucun email trouvé sur le site
                    </div>
                  ) : (
                    <div className="no-website">
                      ❌ Site web non trouvé
                    </div>
                  )}
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
