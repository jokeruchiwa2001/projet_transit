// Configuration de l'API externe
const API_CONFIG = {
  // URL du serveur JSON - utilise toujours l'API interne
  BASE_URL: 'http://localhost:3005/api', // API interne pour développement et production
  
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
