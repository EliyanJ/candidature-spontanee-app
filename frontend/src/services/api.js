import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Companies API
export const companiesAPI = {
  search: (filters) => api.get('/companies/search', { params: filters }),
  save: (company) => api.post('/companies', company),
  getAll: () => api.get('/companies'),
  scrapeEmails: (companyId) => api.post(`/companies/${companyId}/scrape-emails`),
  getEmails: (companyId) => api.get(`/companies/${companyId}/emails`),
};

// Campaigns API
export const campaignsAPI = {
  create: (campaign) => api.post('/campaigns', campaign),
  getAll: () => api.get('/campaigns'),
  start: (campaignId, companyIds) => api.post(`/campaigns/${campaignId}/start`, { companyIds }),
  getStats: (campaignId) => api.get(`/campaigns/${campaignId}/stats`),
};

// Config API
export const configAPI = {
  setEmail: (config) => api.post('/config/email', config),
  testEmail: () => api.post('/config/email/test'),
};

// Upload API
export const uploadAPI = {
  uploadCV: (file) => {
    const formData = new FormData();
    formData.append('cv', file);
    return api.post('/upload-cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
