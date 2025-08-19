// Module de gestion des appels API TransCargo

class ApiManager {
    constructor() {
        this.baseUrl = 'http://localhost:3006';
        this.apiUrl = '/api'; // Fallback pour le serveur Node.js
    }

    // Vérification de l'authentification
    checkAuth() {
        const token = localStorage.getItem('gestionnaire_token');
        const user = localStorage.getItem('gestionnaire_user');
        
        if (!token || !user) {
            window.location.href = '/login.html';
            return false;
        }
        
        return true;
    }

    // Déconnexion
    logout() {
        localStorage.removeItem('gestionnaire_token');
        localStorage.removeItem('gestionnaire_user');
        window.location.href = '/';
    }

    // Déterminer quelle API utiliser selon l'endpoint
    getApiUrl(endpoint) {
        // Vérifier si l'endpoint doit utiliser l'API PHP
        const usePhpApi = (
            endpoint.includes('/colis/search') ||
            endpoint.includes('/colis/track') ||
            endpoint.includes('/statistiques') ||
            endpoint.match(/\/cargaisons\/[^\/]+\/(close|reopen|start|arrive)/) ||
            endpoint.match(/\/colis\/[^\/]+\/(recupere|perdu|recu)/)
        );
        
        if (usePhpApi) {
            // Utiliser l'API PHP locale
            return `${window.location.protocol}//${window.location.host}/api${endpoint}`;
        } else {
            // Utiliser json-server
            const isLocal = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
            
            if (isLocal) {
                return `http://localhost:3006${endpoint}`;
            } else {
                return `https://json-server-typescript-5.onrender.com${endpoint}`;
            }
        }
    }

    // Appel API avec authentification et détection d'environnement
    async call(endpoint, options = {}) {
        const token = localStorage.getItem('gestionnaire_token');
        const url = this.getApiUrl(endpoint);
        
        // Détecter l'environnement local pour l'authentification
        const isLocal = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
        
        console.log(`🔗 Appel API: ${url} (endpoint: ${endpoint})`);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    // Pas d'Authorization pour le serveur JSON local
                    ...(!isLocal && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers
                },
                ...options
            });
            
            if (response.status === 401) {
                this.logout();
                return;
            }
            
            if (!response.ok) {
                // Récupérer le message d'erreur du serveur
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `Erreur ${response.status}` };
                }
                
                // Gestion spéciale pour les erreurs serveur
                if (response.status >= 500) {
                    console.error(`Erreur serveur ${response.status}`);
                    showNotification('Erreur serveur temporaire', 'error');
                    return { error: `Erreur serveur (${response.status})` };
                }
                
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            
            // Gestion des erreurs réseau
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error('Erreur de connexion réseau');
                showNotification('Problème de connexion réseau', 'error');
                throw new Error('Problème de connexion réseau');
            }
            
            // Relancer l'erreur au lieu de la retourner
            throw error;
        }
    }

    // Méthodes spécifiques pour les différentes entités
    async getCargaisons() {
        return this.call('/cargaisons');
    }

    async createCargaison(data) {
        return this.call('/cargaisons', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getCargaisonsDisponibles(type) {
        // Pour json-server, on récupère toutes les cargaisons et on filtre côté client
        const cargaisons = await this.call('/cargaisons');
        let cargaisonsOuvertes = cargaisons.filter(c => c.etatGlobal === 'OUVERT');
        
        if (type) {
            cargaisonsOuvertes = cargaisonsOuvertes.filter(c => c.type === type);
        }
        
        // Ajouter les informations de capacité
        const colis = await this.call('/colis');
        return cargaisonsOuvertes.map(cargaison => {
            const colisInCargaison = colis.filter(c => c.cargaisonId === cargaison.id);
            const poidsUtilise = colisInCargaison.reduce((total, c) => total + c.poids, 0);
            const poidsRestant = cargaison.poidsMax - poidsUtilise;
            const nbColis = colisInCargaison.length;
            
            return {
                ...cargaison,
                poidsUtilise,
                poidsRestant,
                nbColis
            };
        });
    }

    async closeCargaison(id) {
        // Utiliser l'API PHP pour les actions sur les cargaisons
        const response = await fetch(`/api/cargaisons/${id}/close`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la fermeture');
        }
        return response.json();
    }

    async reopenCargaison(id) {
        const response = await fetch(`/api/cargaisons/${id}/reopen`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la réouverture');
        }
        return response.json();
    }

    async startCargaison(id) {
        const response = await fetch(`/api/cargaisons/${id}/start`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors du démarrage');
        }
        return response.json();
    }

    async markCargaisonArrived(id) {
        const response = await fetch(`/api/cargaisons/${id}/arrive`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de l\'arrivée');
        }
        return response.json();
    }

    async getCargaisonColis(id) {
        return this.call(`/cargaisons/${id}/colis`);
    }

    async createColis(data) {
        return this.call('/colis', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async searchColis(code) {
        const response = await fetch(`/api/colis/search?code=${encodeURIComponent(code)}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la recherche');
        }
        return response.json();
    }

    async generateReceipt(id) {
        const response = await fetch(`/api/colis/${id}/recu`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la génération du reçu');
        }
        return response.json();
    }

    async markColisRecupere(id) {
        const response = await fetch(`/api/colis/${id}/recupere`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la récupération');
        }
        return response.json();
    }

    async markColisPerdu(id) {
        const response = await fetch(`/api/colis/${id}/perdu`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors du marquage comme perdu');
        }
        return response.json();
    }

    async getStatistiques() {
        const response = await fetch('/api/statistiques');
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors du chargement des statistiques');
        }
        return response.json();
    }

    async trackColis(code) {
        const response = await fetch(`/api/colis/track?code=${encodeURIComponent(code)}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors du suivi');
        }
        return response.json();
    }

    async getMessages() {
        return this.call('/messages');
    }
}

// Instance globale
const apiManager = new ApiManager();

// Fonction globale pour compatibilité
async function apiCall(endpoint, options = {}) {
    return apiManager.call(endpoint, options);
}

// Export pour utilisation globale
window.ApiManager = ApiManager;
window.apiCall = apiCall;
window.checkAuth = () => apiManager.checkAuth();
window.logout = () => apiManager.logout();