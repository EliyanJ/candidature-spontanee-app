import React, { useState } from 'react';
import { companiesAPI } from '../services/api';
import './SearchCompanies.css';

function SearchCompanies({ onCompanySelect, selectedCompanies, onCompaniesSaved }) {
  const [filters, setFilters] = useState({
    codeApe: '',
    ville: '',
    codePostal: '',
    effectif: '',
    nombre: 20
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await companiesAPI.search(filters);
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

    try {
      for (const company of selectedCompanies) {
        await companiesAPI.save(company);
      }

      alert(`${selectedCompanies.length} entreprise(s) sauvegardée(s)`);
      onCompaniesSaved(selectedCompanies);
    } catch (err) {
      alert('Erreur lors de la sauvegarde: ' + err.message);
    } finally {
      setLoading(false);
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
          <div className="grid grid-2">
            <div className="form-group">
              <label>Code APE (secteur)</label>
              <input
                type="text"
                name="codeApe"
                placeholder="Ex: 6201 pour informatique"
                value={filters.codeApe}
                onChange={handleInputChange}
              />
              <small>6201: Programmation, 7022: Conseil, 4791: E-commerce</small>
            </div>

            <div className="form-group">
              <label>Ville</label>
              <input
                type="text"
                name="ville"
                placeholder="Ex: PARIS"
                value={filters.ville}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Code Postal</label>
              <input
                type="text"
                name="codePostal"
                placeholder="Ex: 75001"
                value={filters.codePostal}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Taille (effectif)</label>
              <select name="effectif" value={filters.effectif} onChange={handleInputChange}>
                <option value="">Toutes tailles</option>
                <option value="01">1-2 salariés</option>
                <option value="02">3-5 salariés</option>
                <option value="03">6-9 salariés</option>
                <option value="11">10-19 salariés</option>
                <option value="12">20-49 salariés</option>
                <option value="21">50-99 salariés</option>
                <option value="22">100-199 salariés</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nombre de résultats</label>
              <input
                type="number"
                name="nombre"
                min="1"
                max="100"
                value={filters.nombre}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
            </button>

            {selectedCompanies.length > 0 && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSaveSelected}
                disabled={loading}
              >
                💾 Sauvegarder la sélection ({selectedCompanies.length})
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="error-message">
            ⚠️ {error}
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
