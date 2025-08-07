// Service pour gérer les appels à l'API JSON externe
const API_CONFIG = require('./config');

class ApiService {
  
  // Méthode générique pour faire des requêtes
  static async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

  // CARGAISONS
  static async getCargaisons() {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CARGAISONS);
    return await this.makeRequest(url);
  }

  static async getCargaisonById(id) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CARGAISONS + `/${id}`);
    return await this.makeRequest(url);
  }

  static async createCargaison(cargaison) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CARGAISONS);
    return await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(cargaison)
    });
  }

  static async updateCargaison(id, cargaison) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CARGAISONS + `/${id}`);
    return await this.makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(cargaison)
    });
  }

  static async deleteCargaison(id) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CARGAISONS + `/${id}`);
    return await this.makeRequest(url, {
      method: 'DELETE'
    });
  }

  // COLIS
  static async getColis() {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.COLIS);
    return await this.makeRequest(url);
  }

  static async getColisById(id) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.COLIS + `/${id}`);
    return await this.makeRequest(url);
  }

  static async createColis(colis) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.COLIS);
    return await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(colis)
    });
  }

  static async updateColis(id, colis) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.COLIS + `/${id}`);
    return await this.makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(colis)
    });
  }

  static async deleteColis(id) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.COLIS + `/${id}`);
    return await this.makeRequest(url, {
      method: 'DELETE'
    });
  }

  // Méthodes spécifiques pour les requêtes complexes
  static async getColisByCargaison(cargaisonId) {
    const colis = await this.getColis();
    return colis.filter(c => c.cargaisonId === cargaisonId);
  }

  static async getColisBy(criteria) {
    const colis = await this.getColis();
    return colis.filter(c => {
      return Object.keys(criteria).every(key => c[key] === criteria[key]);
    });
  }

  static async getCargaisonsBy(criteria) {
    const cargaisons = await this.getCargaisons();
    return cargaisons.filter(c => {
      return Object.keys(criteria).every(key => c[key] === criteria[key]);
    });
  }
}

module.exports = ApiService;
