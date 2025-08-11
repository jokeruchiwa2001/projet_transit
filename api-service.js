// Service pour gérer les appels à l'API JSON externe
const API_CONFIG = require('./config');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

class ApiService {
  
  // Lecture directe des fichiers JSON en production
  static readJSONFile(filename) {
    try {
      const filePath = path.join(__dirname, 'data', filename);
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Erreur lecture ${filename}:`, error);
      return [];
    }
  }
  
  // Méthode générique pour faire des requêtes (dev uniquement)
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
    // Utiliser toujours les fichiers locaux
    return this.readJSONFile('cargaisons.json');
  }

  static async getCargaisonById(id) {
    // Toujours lire directement dans le fichier JSON
    const cargaisons = this.readJSONFile('cargaisons.json');
    return cargaisons.find(c => c.id === id);
  }

  static async createCargaison(cargaison) {
    // Toujours écrire directement dans le fichier JSON
    try {
      const filePath = path.join(__dirname, 'data', 'cargaisons.json');
      const existingData = this.readJSONFile('cargaisons.json');
      existingData.push(cargaison);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
      return cargaison;
    } catch (error) {
      console.error('Erreur écriture cargaison:', error);
      throw error;
    }
  }

  static async updateCargaison(id, cargaison) {
    // Toujours écrire directement dans le fichier JSON
    try {
      const filePath = path.join(__dirname, 'data', 'cargaisons.json');
      const existingData = this.readJSONFile('cargaisons.json');
      const index = existingData.findIndex(c => c.id === id);
      if (index !== -1) {
        existingData[index] = cargaison;
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        return cargaison;
      }
      throw new Error('Cargaison non trouvée');
    } catch (error) {
      console.error('Erreur mise à jour cargaison:', error);
      throw error;
    }
  }

  static async deleteCargaison(id) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CARGAISONS + `/${id}`);
    return await this.makeRequest(url, {
      method: 'DELETE'
    });
  }

  // COLIS
  static async getColis() {
    // Utiliser toujours les fichiers locaux
    return this.readJSONFile('colis.json');
  }

  static async getColisById(id) {
    // Toujours lire directement dans le fichier JSON
    const colis = this.readJSONFile('colis.json');
    return colis.find(c => c.id === id);
  }

  static async createColis(colis) {
    // Toujours écrire directement dans le fichier JSON
    try {
      const filePath = path.join(__dirname, 'data', 'colis.json');
      const existingData = this.readJSONFile('colis.json');
      existingData.push(colis);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
      return colis;
    } catch (error) {
      console.error('Erreur écriture colis:', error);
      throw error;
    }
  }

  static async updateColis(id, colis) {
    // Toujours écrire directement dans le fichier JSON
    try {
      const filePath = path.join(__dirname, 'data', 'colis.json');
      const existingData = this.readJSONFile('colis.json');
      const index = existingData.findIndex(c => c.id === id);
      if (index !== -1) {
        existingData[index] = colis;
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        return colis;
      }
      throw new Error('Colis non trouvé');
    } catch (error) {
      console.error('Erreur mise à jour colis:', error);
      throw error;
    }
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
