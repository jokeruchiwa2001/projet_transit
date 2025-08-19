// API Manager spécialement adapté pour json-server
class JsonServerApiManager {
    constructor() {
        this.baseUrl = window.JSON_SERVER_URL || 'http://localhost:3006';
    }

    // Appel générique vers json-server
    async call(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    // === CARGAISONS ===
    async getCargaisons() {
        return this.call('/cargaisons');
    }

    async getCargaisonsDisponibles(type) {
        // Pour json-server, on récupère toutes les cargaisons et on filtre côté client
        console.log('🔍 Récupération des cargaisons disponibles pour type:', type);
        const cargaisons = await this.call('/cargaisons');
        console.log('📦 Cargaisons récupérées:', cargaisons.length);
        
        let cargaisonsOuvertes = cargaisons.filter(c => c.etatGlobal === 'OUVERT');
        console.log('🔓 Cargaisons ouvertes:', cargaisonsOuvertes.length);
        
        if (type) {
            cargaisonsOuvertes = cargaisonsOuvertes.filter(c => c.type === type);
            console.log(`🚛 Cargaisons ${type} ouvertes:`, cargaisonsOuvertes.length);
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

    async createCargaison(data) {
        // Construire la structure trajet attendue
        const trajet = {
            depart: {
                lieu: data.lieuDepart || "Lieu non défini",
                latitude: data.coordonneesDepart?.latitude || 0,
                longitude: data.coordonneesDepart?.longitude || 0
            },
            arrivee: {
                lieu: data.lieuArrivee || "Lieu non défini",
                latitude: data.coordonneesArrivee?.latitude || 0,
                longitude: data.coordonneesArrivee?.longitude || 0
            }
        };

        // Ajouter un ID et des champs par défaut
        const cargaison = {
            id: this.generateId('CG'),
            numero: `CG-${Date.now().toString(36)}`.toUpperCase(),
            type: data.type || 'routiere',
            poidsMax: data.poidsMax || 1000,
            trajet: trajet,
            distance: data.distance || 1,
            etatAvancement: 'EN_ATTENTE',
            etatGlobal: 'OUVERT',
            dateCreation: new Date().toISOString(),
            produits: [],
            colisIds: [],
            prixTotal: 0
        };

        console.log('📦 Création cargaison avec structure trajet:', cargaison);

        return this.call('/cargaisons', {
            method: 'POST',
            body: JSON.stringify(cargaison)
        });
    }

    async updateCargaison(id, data) {
        return this.call(`/cargaisons/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async closeCargaison(id) {
        return this.updateCargaison(id, { etatGlobal: 'FERME' });
    }

    async reopenCargaison(id) {
        return this.updateCargaison(id, { etatGlobal: 'OUVERT' });
    }

    async startCargaison(id) {
        // Récupérer la cargaison
        const cargaison = await this.call(`/cargaisons/${id}`);
        if (!cargaison) {
            throw new Error('Cargaison introuvable');
        }
        
        // Récupérer tous les colis pour vérifier si la cargaison a des colis
        const allColis = await this.getColis();
        const colisInCargaison = allColis.filter(c => c.cargaisonId === id);
        
        // Vérifications
        if (colisInCargaison.length === 0) {
            throw new Error('Impossible de démarrer une cargaison vide. Ajoutez au moins un colis avant le départ.');
        }
        
        if (cargaison.etatGlobal === 'OUVERT') {
            throw new Error('Impossible de démarrer une cargaison ouverte. Fermez-la d\'abord.');
        }
        
        if (cargaison.etatAvancement === 'EN_COURS') {
            throw new Error('Cette cargaison est déjà en cours');
        }
        
        // Démarrer la cargaison
        const result = await this.updateCargaison(id, { 
            etatAvancement: 'EN_COURS',
            dateDepart: new Date().toISOString()
        });
        
        // Mettre à jour tous les colis de cette cargaison en "EN_COURS"
        for (const colis of colisInCargaison) {
            await this.updateColis(colis.id, { etat: 'EN_COURS' });
        }
        
        return result;
    }

    async markCargaisonArrived(id) {
        return this.updateCargaison(id, { 
            etatAvancement: 'ARRIVE',
            dateArriveeReelle: new Date().toISOString()
        });
    }

    // === COLIS ===
    async getColis() {
        return this.call('/colis');
    }

    async createColis(data) {
        // Calculer le prix selon les nouvelles règles
        const prix = this.calculerPrixColis(data);
        
        const colis = {
            ...data,
            id: this.generateId('COL'),
            ...prix,
            etat: 'EN_ATTENTE',
            dateCreation: new Date().toISOString(),
            codeDestinataire: this.generateCodeDestinataire()
        };

        // Créer le colis
        const nouveauColis = await this.call('/colis', {
            method: 'POST',
            body: JSON.stringify(colis)
        });

        // Mettre à jour la cargaison
        if (data.cargaisonId) {
            await this.ajouterColisACargaison(data.cargaisonId, nouveauColis.id, prix.prixFinal);
        }

        return nouveauColis;
    }

    async updateColis(id, data) {
        return this.call(`/colis/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async recupererColis(id) {
        return this.updateColis(id, { etat: 'RECUPERE' });
    }

    async marquerColisPerdu(id) {
        return this.updateColis(id, { 
            etat: 'PERDU',
            datePerdu: new Date().toISOString()
        });
    }

    // === RECHERCHE ===
    async rechercherColis(code) {
        const colis = await this.getColis();
        return colis.find(c => c.id === code || c.codeDestinataire === code);
    }

    async rechercherCargaisons(criteria) {
        const cargaisons = await this.getCargaisons();
        let results = cargaisons;

        if (criteria.code) {
            results = results.filter(c => 
                c.id.toLowerCase().includes(criteria.code.toLowerCase()) ||
                c.numero.toLowerCase().includes(criteria.code.toLowerCase())
            );
        }

        if (criteria.lieuDepart) {
            results = results.filter(c => 
                c.trajet?.depart?.lieu?.toLowerCase().includes(criteria.lieuDepart.toLowerCase())
            );
        }

        if (criteria.lieuArrivee) {
            results = results.filter(c => 
                c.trajet?.arrivee?.lieu?.toLowerCase().includes(criteria.lieuArrivee.toLowerCase())
            );
        }

        if (criteria.type) {
            results = results.filter(c => c.type === criteria.type);
        }

        if (criteria.dateDepart) {
            const searchDate = new Date(criteria.dateDepart);
            results = results.filter(c => {
                if (!c.dateDepart) return false;
                const cargaisonDate = new Date(c.dateDepart);
                return cargaisonDate.toDateString() === searchDate.toDateString();
            });
        }

        if (criteria.dateArrivee) {
            const searchDate = new Date(criteria.dateArrivee);
            results = results.filter(c => {
                if (!c.dateArriveeReelle) return false;
                const cargaisonDate = new Date(c.dateArriveeReelle);
                return cargaisonDate.toDateString() === searchDate.toDateString();
            });
        }

        return results;
    }

    // === FONCTIONS UTILITAIRES ===
    generateId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix.toUpperCase()}-${timestamp}${random}`.toUpperCase();
    }

    generateCodeDestinataire() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    calculerPrixColis(data) {
        const { poids, typeProduit, typeCargaison, nombreColis, distance = 1 } = data;
        let prixCalcule = 0;

        // Validation des contraintes
        if (typeProduit === 'chimique' && typeCargaison !== 'maritime') {
            throw new Error('Les produits chimiques ne peuvent transiter QUE par voie maritime');
        }
        
        if (typeProduit === 'materiel-fragile' && typeCargaison === 'maritime') {
            throw new Error('Les produits matériels fragiles ne peuvent JAMAIS passer par voie maritime');
        }

        // Calcul selon les nouveaux tarifs
        switch (typeProduit.toLowerCase()) {
            case 'alimentaire':
                switch (typeCargaison) {
                    case 'routiere':
                        prixCalcule = poids * 100 * distance;
                        break;
                    case 'maritime':
                        prixCalcule = poids * 50 * distance + 5000; // +5000F frais chargement
                        break;
                    case 'aerienne':
                        prixCalcule = poids * 300 * distance;
                        break;
                }
                break;
                
            case 'chimique':
                if (typeCargaison === 'maritime') {
                    const toxicite = 1;
                    prixCalcule = poids * 500 * toxicite + 10000; // +10000F frais entretien
                }
                break;
                
            case 'materiel-fragile':
                switch (typeCargaison) {
                    case 'routiere':
                        prixCalcule = poids * 200 * distance;
                        break;
                    case 'aerienne':
                        prixCalcule = poids * 1000; // pas de distance
                        break;
                }
                break;
                
            case 'materiel-incassable':
                switch (typeCargaison) {
                    case 'routiere':
                        prixCalcule = poids * 200 * distance;
                        break;
                    case 'maritime':
                        prixCalcule = poids * 400 * distance;
                        break;
                    case 'aerienne':
                        prixCalcule = poids * 1000; // pas de distance
                        break;
                }
                break;
                
            default:
                prixCalcule = poids * 100 * distance; // tarif par défaut
        }

        const prixTotal = prixCalcule * nombreColis;
        const prixFinal = Math.max(prixTotal, 10000); // Prix minimum

        return { prixCalcule, prixFinal };
    }

    async ajouterColisACargaison(cargaisonId, colisId, prixFinal) {
        // Récupérer la cargaison actuelle
        const cargaison = await this.call(`/cargaisons/${cargaisonId}`);
        
        // Mettre à jour avec le nouveau colis
        const updatedCargaison = {
            ...cargaison,
            colisIds: [...(cargaison.colisIds || []), colisId],
            prixTotal: (cargaison.prixTotal || 0) + prixFinal
        };

        return this.updateCargaison(cargaisonId, updatedCargaison);
    }

    async obtenirStatistiques() {
        const [cargaisons, colis] = await Promise.all([
            this.getCargaisons(),
            this.getColis()
        ]);

        return {
            totalCargaisons: cargaisons.length,
            cargaisonsOuvertes: cargaisons.filter(c => c.etatGlobal === 'OUVERT').length,
            cargaisonsFermees: cargaisons.filter(c => c.etatGlobal === 'FERME').length,
            cargaisonsEnCours: cargaisons.filter(c => c.etatAvancement === 'EN_COURS').length,
            totalColis: colis.length,
            colisEnAttente: colis.filter(c => c.etat === 'EN_ATTENTE').length,
            colisEnCours: colis.filter(c => c.etat === 'EN_COURS').length,
            colisArrivees: colis.filter(c => c.etat === 'ARRIVE').length,
            colisRecuperes: colis.filter(c => c.etat === 'RECUPERE').length,
            colisPerdus: colis.filter(c => c.etat === 'PERDU').length,
            revenuTotal: colis.reduce((total, c) => total + (c.prixFinal || 0), 0),
            transportMaritime: cargaisons.filter(c => c.type === 'maritime').length,
            transportAerien: cargaisons.filter(c => c.type === 'aerienne').length,
            transportRoutier: cargaisons.filter(c => c.type === 'routiere').length
        };
    }
}

// Créer et rendre disponible immédiatement l'API manager
const jsonServerApi = new JsonServerApiManager();

// Rendre global immédiatement
window.jsonServerApi = jsonServerApi;

// Pour la compatibilité, on peut aussi remplacer l'apiCall global
window.apiCall = (endpoint, options) => {
    return jsonServerApi.call(endpoint, options);
};

// Alias pour apiManager
window.apiManager = jsonServerApi;

console.log('✅ JsonServerApi initialisé et disponible globalement');
