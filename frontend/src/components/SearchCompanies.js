import React, { useState, useEffect } from 'react';
import { companiesAPI, constantsAPI } from '../services/api';
import './SearchCompanies.css';

function SearchCompanies({ onCompanySelect, selectedCompanies, onCompaniesSaved }) {
  const [filters, setFilters] = useState({
    secteur: '',
    location: '',
    effectif: '20+'
  });

  const [sectors, setSectors] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState('');

  // Charger les secteurs au montage du composant
  useEffect(() => {
    const loadSectors = async () => {
      try {
        const response = await constantsAPI.getApeSectors();
        setSectors(response.data.sectors);
      } catch (err) {
        console.error('Erreur chargement secteurs:', err);
      }
    };
    loadSectors();
  }, []);

  // Timer pour la progression
  useEffect(() => {
    let interval;
    if (scrapingProgress && scrapingProgress.startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - scrapingProgress.startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scrapingProgress]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setScrapingProgress(null);

    try {
      // Trouver le secteur sélectionné et récupérer ses codes APE
      const selectedSector = sectors.find(s => s.id === filters.secteur);

      if (!selectedSector) {
        setError('Veuillez sélectionner un secteur');
        setLoading(false);
        return;
      }

      // Prendre le premier code APE du secteur (on pourrait aussi chercher avec tous)
      const codeApe = selectedSector.codes[0].value;

      // Construire les paramètres de recherche
      const searchParams = {
        codeApe,
        location: filters.location,
        tranche_effectif_salarie: filters.effectif !== '20+' ? filters.effectif : undefined,
        nombre: 20 // Fixé à 20
      };

      // Recherche des entreprises (rapide - sans scraping)
      const response = await companiesAPI.search(searchParams);
      setSearchResults(response.data.data);

      if (response.data.data.length === 0) {
        setError('Aucune entreprise trouvée avec ces critères');
      }
    } catch (err) {
      setError('Erreur lors de la recherche: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSelected = async () => {
    if (selectedCompanies.length === 0) {
      alert('Veuillez sélectionner au moins une entreprise');
      return;
    }

    setLoading(true);
    const startTime = Date.now();
    setScrapingProgress({ current: 0, total: selectedCompanies.length, startTime });

    try {
      // Étape 1 : Scraper les sites web en parallèle (5 à la fois)
      const scrapingResponse = await companiesAPI.scrapeWebsitesParallel(
        selectedCompanies.map(c => ({ nom: c.nom, ville: c.ville, siret: c.siret }))
      );

      // Extraire les résultats (gérer la réponse API)
      const scrapingResults = scrapingResponse.data.data || scrapingResponse.data || [];

      // Fusionner les résultats de scraping avec les entreprises
      const enrichedCompanies = selectedCompanies.map(company => {
        const scrapingResult = scrapingResults.find(r => r.siret === company.siret);
        return {
          ...company,
          website_url: scrapingResult?.websiteUrl || null
        };
      });

      // Étape 2 : Sauvegarder et scraper les emails en parallèle
      let completed = 0;
      const savePromises = enrichedCompanies.map(async (company) => {
        // Sauvegarder l'entreprise
        const saveResponse = await companiesAPI.save(company);
        const companyId = saveResponse.data.companyId;

        // Si on a un site web, scraper les emails
        if (company.website_url) {
          await companiesAPI.scrapeEmails(companyId);
        }

        completed++;
        setScrapingProgress({ current: completed, total: selectedCompanies.length, startTime });
      });

      await Promise.all(savePromises);

      // Rediriger automatiquement vers l'onglet entreprises
      onCompaniesSaved(enrichedCompanies);
    } catch (err) {
      alert('Erreur lors de la sauvegarde: ' + err.message);
      setLoading(false);
      setScrapingProgress(null);
    }
  };

  const isSelected = (company) => {
    return selectedCompanies.some(c => c.siret === company.siret);
  };

  return (
    <div className="search-companies">
      <div className="card">
        <h2>🔍 Rechercher des entreprises</h2>

        <form onSubmit={handleSearch} className="search-form">
          <div className="filter-hint">
            💡 <strong>Nouveauté</strong> : Recherche optimisée pour les entreprises de <strong>20+ employés</strong> avec site internet.
            Les résultats sont limités à <strong>20 entreprises max</strong>.
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>Secteur d'activité *</label>
              <select
                name="secteur"
                value={filters.secteur}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Choisir un secteur --</option>
                {sectors.map(sector => (
                  <option key={sector.id} value={sector.id}>
                    {sector.icon} {sector.label}
                  </option>
                ))}
              </select>
              <small>Sélectionnez le secteur qui vous intéresse</small>
            </div>

            <div className="form-group">
              <label>Ville ou Code Postal *</label>
              <input
                type="text"
                name="location"
                placeholder="Ex: PARIS ou 75001"
                value={filters.location}
                onChange={handleInputChange}
                required
              />
              <small>Ville (en MAJUSCULES) ou code postal (5 chiffres)</small>
            </div>

            <div className="form-group">
              <label>Taille de l'entreprise</label>
              <select name="effectif" value={filters.effectif} onChange={handleInputChange}>
                <option value="20+">20+ salariés (recommandé)</option>
                <option value="12">20 à 49 salariés</option>
                <option value="21">50 à 99 salariés</option>
                <option value="22">100 à 199 salariés</option>
                <option value="31">200 à 249 salariés</option>
                <option value="32">250 à 499 salariés</option>
                <option value="41,42">500 à 1999 salariés</option>
                <option value="51,52,53">2000+ salariés</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳ Recherche en cours...' : '🔍 Rechercher'}
          </button>
        </form>

        {selectedCompanies.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSaveSelected}
              disabled={loading}
            >
              💾 Sauvegarder la sélection ({selectedCompanies.length})
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {loading && scrapingProgress && (
          <div className="scraping-progress">
            <h3>🌐 Recherche des sites web et emails en cours...</h3>

            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(scrapingProgress.current / scrapingProgress.total) * 100}%`
                }}
              ></div>
            </div>

            <div className="progress-info">
              <p className="progress-counter">
                <strong>{scrapingProgress.current}</strong> / {scrapingProgress.total} entreprises traitées
              </p>
              <p className="progress-percentage">
                {Math.round((scrapingProgress.current / scrapingProgress.total) * 100)}%
              </p>
            </div>

            <p className="progress-timer">
              ⏱️ Temps écoulé : {elapsedTime}s
            </p>

            <small className="progress-note">
              Cela peut prendre 1-3 minutes selon le nombre d'entreprises.
              Vous serez redirigé automatiquement vers l'onglet entreprises à la fin.
            </small>
          </div>
        )}
      </div>

      {/* Résultats */}
      {searchResults.length > 0 && (
        <div className="card">
          <h2>📋 Résultats ({searchResults.length})</h2>

          <div className="results-list">
            {searchResults.map((company, index) => (
              <div
                key={company.siret || index}
                className={`company-card ${isSelected(company) ? 'selected' : ''}`}
                onClick={() => onCompanySelect(company)}
              >
                <div className="company-header">
                  <div className="company-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected(company)}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="company-info">
                    <h3>{company.nom}</h3>
                    {company.nom_commercial && (
                      <p className="commercial-name">{company.nom_commercial}</p>
                    )}
                  </div>
                </div>

                <div className="company-details">
                  <p>📍 {company.adresse}, {company.code_postal} {company.ville}</p>
                  <p>🏢 {company.libelle_ape}</p>
                  <p>👥 {company.effectif}</p>
                  <p className="siret">SIRET: {company.siret}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchCompanies;
