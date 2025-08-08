// Configuration de l'API externe
const API_CONFIG = {
  // URL du serveur JSON - local vs production
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? '' // API interne en production
    : 'http://localhost:3001', // JSON Server local en dev
  
  // Endpoints disponibles
  ENDPOINTS: {
    CARGAISONS: '/cargaisons',
    COLIS: '/colis'
  },
  
  // Fonction helper pour construire les URLs
  getUrl: function(endpoint) {
    return this.BASE_URL + endpoint;
  }
};

module.exports = API_CONFIG;
