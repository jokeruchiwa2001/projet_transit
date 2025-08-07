// Configuration de l'API externe
const API_CONFIG = {
  // URL de votre serveur JSON déployé sur Render
  BASE_URL: 'https://json-server-typescript-5.onrender.com',
  
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
