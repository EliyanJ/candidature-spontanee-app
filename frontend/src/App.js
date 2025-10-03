import React, { useState } from 'react';
import './App.css';
import SearchCompanies from './components/SearchCompanies';
import CompanyList from './components/CompanyList';
import EmailTemplate from './components/EmailTemplate';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [savedCompanies, setSavedCompanies] = useState([]);

  const tabs = [
    { id: 'search', label: '🔍 Recherche', icon: '🔍' },
    { id: 'companies', label: '📋 Entreprises', icon: '📋' },
    { id: 'email', label: '✉️ Email', icon: '✉️' },
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'settings', label: '⚙️ Config', icon: '⚙️' },
  ];

  const handleCompanySelect = (company) => {
    const isSelected = selectedCompanies.find(c => c.siret === company.siret);

    if (isSelected) {
      setSelectedCompanies(selectedCompanies.filter(c => c.siret !== company.siret));
    } else {
      setSelectedCompanies([...selectedCompanies, company]);
    }
  };

  const handleCompaniesSaved = (companies) => {
    setSavedCompanies([...savedCompanies, ...companies]);
    setActiveTab('companies');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📧 Candidature Spontanée - MVP</h1>
        <p>Automatisation d'envoi de candidatures aux entreprises</p>
      </header>

      <nav className="App-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="App-main">
        {activeTab === 'search' && (
          <SearchCompanies
            onCompanySelect={handleCompanySelect}
            selectedCompanies={selectedCompanies}
            onCompaniesSaved={handleCompaniesSaved}
          />
        )}

        {activeTab === 'companies' && (
          <CompanyList
            companies={savedCompanies}
            selectedCompanies={selectedCompanies}
            onCompanySelect={handleCompanySelect}
          />
        )}

        {activeTab === 'email' && (
          <EmailTemplate
            selectedCompanies={selectedCompanies}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard />
        )}

        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>

      <footer className="App-footer">
        <p>💡 {selectedCompanies.length} entreprise(s) sélectionnée(s)</p>
      </footer>
    </div>
  );
}

export default App;
