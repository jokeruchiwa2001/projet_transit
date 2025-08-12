/**
 * API Cargaisons avec Pagination - TransCargo
 * Gère les requêtes paginées pour le lazy loading
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data');
const CARGAISONS_FILE = path.join(DATA_DIR, 'cargaisons.json');
const COLIS_FILE = path.join(DATA_DIR, 'colis.json');

class CargaisonsPaginatedAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
    }

    /**
     * Charger les cargaisons depuis le fichier JSON
     */
    async loadCargaisons() {
        const cacheKey = 'all_cargaisons';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const data = await fs.readFile(CARGAISONS_FILE, 'utf8');
            const cargaisons = JSON.parse(data);
            
            // Mettre en cache
            this.cache.set(cacheKey, {
                data: cargaisons,
                timestamp: Date.now()
            });
            
            return cargaisons;
        } catch (error) {
            console.error('Erreur lors du chargement des cargaisons:', error);
            return [];
        }
    }

    /**
     * Charger les colis depuis le fichier JSON
     */
    async loadColis() {
        const cacheKey = 'all_colis';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const data = await fs.readFile(COLIS_FILE, 'utf8');
            const colis = JSON.parse(data);
            
            // Mettre en cache
            this.cache.set(cacheKey, {
                data: colis,
                timestamp: Date.now()
            });
            
            return colis;
        } catch (error) {
            console.error('Erreur lors du chargement des colis:', error);
            return [];
        }
    }

    /**
     * Obtenir les cargaisons avec pagination et filtres
     */
    async getCargaisonsPaginated(params = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                type = '',
                status = '',
                search = '',
                sortBy = 'dateCreation',
                sortOrder = 'desc'
            } = params;

            const cargaisons = await this.loadCargaisons();
            let filteredCargaisons = [...cargaisons];

            // Appliquer les filtres
            if (type) {
                filteredCargaisons = filteredCargaisons.filter(c => c.type === type);
            }

            if (status) {
                filteredCargaisons = filteredCargaisons.filter(c => 
                    c.etatAvancement === status || c.etatGlobal === status
                );
            }

            if (search) {
                const searchLower = search.toLowerCase();
                filteredCargaisons = filteredCargaisons.filter(c =>
                    c.id.toLowerCase().includes(searchLower) ||
                    c.numero?.toLowerCase().includes(searchLower) ||
                    c.trajet?.depart?.lieu?.toLowerCase().includes(searchLower) ||
                    c.trajet?.arrivee?.lieu?.toLowerCase().includes(searchLower)
                );
            }

            // Trier
            filteredCargaisons.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];

                // Gestion des dates
                if (sortBy.includes('date') || sortBy === 'dateCreation') {
                    aValue = new Date(aValue || 0);
                    bValue = new Date(bValue || 0);
                }

                // Gestion des nombres
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
                }

                // Gestion des chaînes et dates
                if (aValue < bValue) return sortOrder === 'desc' ? 1 : -1;
                if (aValue > bValue) return sortOrder === 'desc' ? -1 : 1;
                return 0;
            });

            // Calculer la pagination
            const total = filteredCargaisons.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedCargaisons = filteredCargaisons.slice(offset, offset + limit);

            // Enrichir les données avec les informations des colis
            const enrichedCargaisons = await this.enrichCargaisonsWithColis(paginatedCargaisons);

            return {
                success: true,
                cargaisons: enrichedCargaisons,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                filters: {
                    type,
                    status,
                    search,
                    sortBy,
                    sortOrder
                }
            };

        } catch (error) {
            console.error('Erreur lors de la récupération des cargaisons:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des cargaisons',
                cargaisons: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }
    }

    /**
     * Enrichir les cargaisons avec les informations des colis
     */
    async enrichCargaisonsWithColis(cargaisons) {
        const colis = await this.loadColis();
        
        return cargaisons.map(cargaison => {
            const cargaisonColis = colis.filter(c => c.cargaisonId === cargaison.id);
            
            return {
                ...cargaison,
                colisCount: cargaisonColis.length,
                colisIds: cargaisonColis.map(c => c.id),
                prixTotal: cargaisonColis.reduce((total, c) => total + (c.prixFinal || 0), 0),
                poidsTotal: cargaisonColis.reduce((total, c) => total + (c.poids || 0), 0),
                colisParEtat: this.groupColisByEtat(cargaisonColis)
            };
        });
    }

    /**
     * Grouper les colis par état
     */
    groupColisByEtat(colis) {
        return colis.reduce((acc, c) => {
            acc[c.etat] = (acc[c.etat] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Obtenir une cargaison par ID avec ses colis
     */
    async getCargaisonById(id) {
        try {
            const cargaisons = await this.loadCargaisons();
            const cargaison = cargaisons.find(c => c.id === id);
            
            if (!cargaison) {
                return {
                    success: false,
                    error: 'Cargaison non trouvée'
                };
            }

            const colis = await this.loadColis();
            const cargaisonColis = colis.filter(c => c.cargaisonId === id);

            return {
                success: true,
                cargaison: {
                    ...cargaison,
                    colisCount: cargaisonColis.length,
                    colisIds: cargaisonColis.map(c => c.id),
                    prixTotal: cargaisonColis.reduce((total, c) => total + (c.prixFinal || 0), 0),
                    poidsTotal: cargaisonColis.reduce((total, c) => total + (c.poids || 0), 0),
                    colisParEtat: this.groupColisByEtat(cargaisonColis)
                }
            };

        } catch (error) {
            console.error('Erreur lors de la récupération de la cargaison:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération de la cargaison'
            };
        }
    }

    /**
     * Obtenir les colis d'une cargaison
     */
    async getColisByCargaison(cargaisonId, params = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                etat = '',
                sortBy = 'dateCreation',
                sortOrder = 'desc'
            } = params;

            const colis = await this.loadColis();
            let cargaisonColis = colis.filter(c => c.cargaisonId === cargaisonId);

            // Appliquer les filtres
            if (etat) {
                cargaisonColis = cargaisonColis.filter(c => c.etat === etat);
            }

            // Trier
            cargaisonColis.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];

                if (sortBy.includes('date')) {
                    aValue = new Date(aValue || 0);
                    bValue = new Date(bValue || 0);
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
                }

                if (aValue < bValue) return sortOrder === 'desc' ? 1 : -1;
                if (aValue > bValue) return sortOrder === 'desc' ? -1 : 1;
                return 0;
            });

            // Pagination
            const total = cargaisonColis.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedColis = cargaisonColis.slice(offset, offset + limit);

            return {
                success: true,
                colis: paginatedColis,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

        } catch (error) {
            console.error('Erreur lors de la récupération des colis:', error);
            return {
                success: false,
                error: 'Erreur lors de la récupération des colis',
                colis: []
            };
        }
    }

    /**
     * Mettre à jour l'état de plusieurs colis
     */
    async updateMultipleColis(colisIds, nouvelEtat) {
        try {
            const colis = await this.loadColis();
            let updatedCount = 0;
            const errors = [];

            // Valider l'état
            const etatsValides = ['EN_ATTENTE', 'EN_COURS', 'ARRIVE', 'RECUPERE', 'PERDU', 'ARCHIVE', 'ANNULE'];
            if (!etatsValides.includes(nouvelEtat)) {
                return {
                    success: false,
                    error: 'État invalide'
                };
            }

            // Mettre à jour les colis
            const updatedColis = colis.map(c => {
                if (colisIds.includes(c.id)) {
                    // Vérifier les transitions d'état valides
                    if (this.isValidStateTransition(c.etat, nouvelEtat)) {
                        updatedCount++;
                        return {
                            ...c,
                            etat: nouvelEtat,
                            dateArrivee: nouvelEtat === 'ARRIVE' ? new Date().toISOString() : c.dateArrivee
                        };
                    } else {
                        errors.push(`Colis ${c.id}: transition ${c.etat} -> ${nouvelEtat} non autorisée`);
                        return c;
                    }
                }
                return c;
            });

            // Sauvegarder
            await fs.writeFile(COLIS_FILE, JSON.stringify(updatedColis, null, 2));
            
            // Invalider le cache
            this.cache.delete('all_colis');

            return {
                success: true,
                updatedCount,
                errors,
                message: `${updatedCount} colis mis à jour${errors.length > 0 ? ` (${errors.length} erreurs)` : ''}`
            };

        } catch (error) {
            console.error('Erreur lors de la mise à jour des colis:', error);
            return {
                success: false,
                error: 'Erreur lors de la mise à jour des colis'
            };
        }
    }

    /**
     * Vérifier si une transition d'état est valide
     */
    isValidStateTransition(etatActuel, nouvelEtat) {
        const transitions = {
            'EN_ATTENTE': ['EN_COURS', 'ANNULE'],
            'EN_COURS': ['ARRIVE', 'PERDU'],
            'ARRIVE': ['RECUPERE', 'PERDU'],
            'RECUPERE': ['ARCHIVE'],
            'PERDU': ['ARCHIVE'],
            'ARCHIVE': [],
            'ANNULE': []
        };

        return transitions[etatActuel]?.includes(nouvelEtat) || false;
    }

    /**
     * Obtenir les statistiques des cargaisons
     */
    async getStatistics() {
        try {
            const cargaisons = await this.loadCargaisons();
            const colis = await this.loadColis();

            const stats = {
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

            return {
                success: true,
                stats
            };

        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
            return {
                success: false,
                error: 'Erreur lors du calcul des statistiques'
            };
        }
    }

    /**
     * Invalider le cache
     */
    invalidateCache(pattern = null) {
        if (pattern) {
            for (const [key] of this.cache) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }
}

// Instance singleton
const api = new CargaisonsPaginatedAPI();

// Fonctions d'export pour l'utilisation dans les routes
module.exports = {
    getCargaisonsPaginated: (params) => api.getCargaisonsPaginated(params),
    getCargaisonById: (id) => api.getCargaisonById(id),
    getColisByCargaison: (cargaisonId, params) => api.getColisByCargaison(cargaisonId, params),
    updateMultipleColis: (colisIds, nouvelEtat) => api.updateMultipleColis(colisIds, nouvelEtat),
    getStatistics: () => api.getStatistics(),
    invalidateCache: (pattern) => api.invalidateCache(pattern)
};

// Si exécuté directement (pour les tests)
if (require.main === module) {
    async function test() {
        console.log('Test de l\'API paginée...');
        
        // Test pagination
        const result = await api.getCargaisonsPaginated({
            page: 1,
            limit: 5,
            sortBy: 'dateCreation',
            sortOrder: 'desc'
        });
        
        console.log('Résultat pagination:', JSON.stringify(result, null, 2));
        
        // Test statistiques
        const stats = await api.getStatistics();
        console.log('Statistiques:', JSON.stringify(stats, null, 2));
    }
    
    test().catch(console.error);
}