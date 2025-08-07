// Configuration de l'API externe
const API_CONFIG = {
  // URL de l'API locale (même serveur)
  BASE_URL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  
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
