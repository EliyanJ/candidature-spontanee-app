import React, { useState, useEffect } from 'react';
import { campaignsAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response = await campaignsAPI.getAll();
      setCampaigns(response.data.campaigns || []);
    } catch (err) {
      console.error('Erreur chargement campagnes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignStats = async (campaignId) => {
    try {
      const response = await campaignsAPI.getStats(campaignId);
      return response.data.stats;
    } catch (err) {
      console.error('Erreur chargement stats:', err);
      return null;
    }
  };

  const [stats, setStats] = useState({});

  useEffect(() => {
    campaigns.forEach(async (campaign) => {
      const campaignStats = await loadCampaignStats(campaign.id);
      if (campaignStats) {
        setStats(prev => ({ ...prev, [campaign.id]: campaignStats }));
      }
    });
  }, [campaigns]);

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Brouillon', color: '#999' },
      active: { label: 'En cours', color: '#ffc107' },
      completed: { label: 'Terminée', color: '#10b981' },
      paused: { label: 'En pause', color: '#667eea' }
    };

    const badge = badges[status] || badges.draft;

    return (
      <span className="status-badge" style={{ background: badge.color }}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="card">
        <h2>📊 Dashboard</h2>
        <p className="empty-state">
          Aucune campagne créée. Créez votre première campagne dans l'onglet Email !
        </p>
      </div>
    );
  }

  // Calcul des stats globales
  const globalStats = Object.values(stats).reduce(
    (acc, stat) => ({
      total: acc.total + (stat?.total || 0),
      sent: acc.sent + (stat?.sent || 0),
      failed: acc.failed + (stat?.failed || 0)
    }),
    { total: 0, sent: 0, failed: 0 }
  );

  return (
    <div className="dashboard">
      <div className="card">
        <h2>📊 Statistiques globales</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <h3>{globalStats.total}</h3>
              <p>Emails total</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{globalStats.sent}</h3>
              <p>Envoyés avec succès</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{globalStats.failed}</h3>
              <p>Échecs</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>
                {globalStats.total > 0
                  ? Math.round((globalStats.sent / globalStats.total) * 100)
                  : 0}%
              </h3>
              <p>Taux de succès</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>📋 Campagnes ({campaigns.length})</h2>

        <div className="campaigns-list">
          {campaigns.map(campaign => {
            const campaignStats = stats[campaign.id];

            return (
              <div key={campaign.id} className="campaign-item">
                <div className="campaign-header">
                  <h3>{campaign.name}</h3>
                  {getStatusBadge(campaign.status)}
                </div>

                <div className="campaign-details">
                  <p>📅 Créée le: {new Date(campaign.created_at).toLocaleDateString('fr-FR')}</p>
                  <p>📧 Limite: {campaign.emails_per_day} emails/jour</p>
                  <p>⏱️ Délai: {campaign.delay_between_emails}s entre envois</p>
                </div>

                {campaignStats && (
                  <div className="campaign-stats">
                    <div className="stat-bar">
                      <div className="stat-item">
                        <span className="label">Total:</span>
                        <span className="value">{campaignStats.total}</span>
                      </div>
                      <div className="stat-item success">
                        <span className="label">Envoyés:</span>
                        <span className="value">{campaignStats.sent}</span>
                      </div>
                      <div className="stat-item danger">
                        <span className="label">Échecs:</span>
                        <span className="value">{campaignStats.failed}</span>
                      </div>
                    </div>

                    {campaignStats.total > 0 && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(campaignStats.sent / campaignStats.total) * 100}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
