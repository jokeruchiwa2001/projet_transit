/**
 * API pour les Actions en Lot sur les Colis - TransCargo
 * Gère les opérations groupées sur les colis
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data');
const COLIS_FILE = path.join(DATA_DIR, 'colis.json');

/**
 * Charger les colis depuis le fichier JSON
 */
async function loadColis() {
    try {
        const data = await fs.readFile(COLIS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement des colis:', error);
        return [];
    }
}

/**
 * Sauvegarder les colis dans le fichier JSON
 */
async function saveColis(colis) {
    try {
        await fs.writeFile(COLIS_FILE, JSON.stringify(colis, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des colis:', error);
        return false;
    }
}

/**
 * Marquer un colis comme récupéré
 */
async function markColisRecupere(req, res) {
    try {
        const colisId = req.params.id;
        
        if (!colisId) {
            return res.status(400).json({
                success: false,
                error: 'ID du colis manquant'
            });
        }

        const colis = await loadColis();
        const colisIndex = colis.findIndex(c => c.id === colisId);

        if (colisIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Colis non trouvé'
            });
        }

        const currentColis = colis[colisIndex];

        // Vérifier que le colis est arrivé
        if (currentColis.etat !== 'ARRIVE') {
            return res.status(400).json({
                success: false,
                error: 'Le colis doit être arrivé pour être marqué comme récupéré'
            });
        }

        // Mettre à jour l'état
        colis[colisIndex] = {
            ...currentColis,
            etat: 'RECUPERE',
            dateRecuperation: new Date().toISOString()
        };

        const saved = await saveColis(colis);

        if (saved) {
            res.json({
                success: true,
                message: 'Colis marqué comme récupéré',
                colis: colis[colisIndex]
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la sauvegarde'
            });
        }

    } catch (error) {
        console.error('Erreur lors de la mise à jour du colis:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
}

/**
 * Marquer un colis comme perdu
 */
async function markColisPerdu(req, res) {
    try {
        const colisId = req.params.id;
        
        if (!colisId) {
            return res.status(400).json({
                success: false,
                error: 'ID du colis manquant'
            });
        }

        const colis = await loadColis();
        const colisIndex = colis.findIndex(c => c.id === colisId);

        if (colisIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Colis non trouvé'
            });
        }

        const currentColis = colis[colisIndex];

        // Vérifier que le colis peut être marqué comme perdu
        if (!['EN_COURS', 'ARRIVE'].includes(currentColis.etat)) {
            return res.status(400).json({
                success: false,
                error: 'Le colis ne peut pas être marqué comme perdu dans son état actuel'
            });
        }

        // Mettre à jour l'état
        colis[colisIndex] = {
            ...currentColis,
            etat: 'PERDU',
            datePerdu: new Date().toISOString()
        };

        const saved = await saveColis(colis);

        if (saved) {
            res.json({
                success: true,
                message: 'Colis marqué comme perdu',
                colis: colis[colisIndex]
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la sauvegarde'
            });
        }

    } catch (error) {
        console.error('Erreur lors de la mise à jour du colis:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
}

/**
 * Obtenir les colis d'une cargaison
 */
async function getColisByCargaison(req, res) {
    try {
        const cargaisonId = req.params.cargaisonId;
        
        if (!cargaisonId) {
            return res.status(400).json({
                success: false,
                error: 'ID de la cargaison manquant'
            });
        }

        const colis = await loadColis();
        const cargaisonColis = colis.filter(c => c.cargaisonId === cargaisonId);

        res.json(cargaisonColis);

    } catch (error) {
        console.error('Erreur lors de la récupération des colis:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
}

/**
 * Actions en lot sur les colis d'une cargaison
 */
async function bulkActionColis(req, res) {
    try {
        const { cargaisonId, action, colisIds } = req.body;
        
        if (!cargaisonId || !action) {
            return res.status(400).json({
                success: false,
                error: 'Paramètres manquants (cargaisonId, action)'
            });
        }

        const validActions = ['RECUPERE', 'PERDU'];
        if (!validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Action non valide'
            });
        }

        const colis = await loadColis();
        let updatedCount = 0;
        const errors = [];

        // Si colisIds n'est pas fourni, traiter tous les colis éligibles de la cargaison
        let targetColis;
        if (colisIds && Array.isArray(colisIds)) {
            targetColis = colis.filter(c => c.cargaisonId === cargaisonId && colisIds.includes(c.id));
        } else {
            // Filtrer selon l'action
            if (action === 'RECUPERE') {
                targetColis = colis.filter(c => c.cargaisonId === cargaisonId && c.etat === 'ARRIVE');
            } else if (action === 'PERDU') {
                targetColis = colis.filter(c => c.cargaisonId === cargaisonId && ['EN_COURS', 'ARRIVE'].includes(c.etat));
            }
        }

        // Mettre à jour chaque colis
        for (let i = 0; i < colis.length; i++) {
            const currentColis = colis[i];
            const shouldUpdate = targetColis.some(tc => tc.id === currentColis.id);

            if (shouldUpdate) {
                // Vérifier les conditions selon l'action
                let canUpdate = false;
                let errorMessage = '';

                if (action === 'RECUPERE' && currentColis.etat === 'ARRIVE') {
                    canUpdate = true;
                } else if (action === 'PERDU' && ['EN_COURS', 'ARRIVE'].includes(currentColis.etat)) {
                    canUpdate = true;
                } else {
                    errorMessage = `Colis ${currentColis.id}: état ${currentColis.etat} non compatible avec l'action ${action}`;
                }

                if (canUpdate) {
                    colis[i] = {
                        ...currentColis,
                        etat: action,
                        [`date${action === 'RECUPERE' ? 'Recuperation' : 'Perdu'}`]: new Date().toISOString()
                    };
                    updatedCount++;
                } else if (errorMessage) {
                    errors.push(errorMessage);
                }
            }
        }

        // Sauvegarder les modifications
        const saved = await saveColis(colis);

        if (saved) {
            res.json({
                success: true,
                message: `${updatedCount} colis mis à jour`,
                updatedCount,
                errors,
                action
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la sauvegarde'
            });
        }

    } catch (error) {
        console.error('Erreur lors de l\'action en lot:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
}

/**
 * Obtenir les statistiques des colis d'une cargaison
 */
async function getCargaisonColisStats(req, res) {
    try {
        const cargaisonId = req.params.cargaisonId;
        
        if (!cargaisonId) {
            return res.status(400).json({
                success: false,
                error: 'ID de la cargaison manquant'
            });
        }

        const colis = await loadColis();
        const cargaisonColis = colis.filter(c => c.cargaisonId === cargaisonId);

        const stats = {
            total: cargaisonColis.length,
            enAttente: cargaisonColis.filter(c => c.etat === 'EN_ATTENTE').length,
            enCours: cargaisonColis.filter(c => c.etat === 'EN_COURS').length,
            arrives: cargaisonColis.filter(c => c.etat === 'ARRIVE').length,
            recuperes: cargaisonColis.filter(c => c.etat === 'RECUPERE').length,
            perdus: cargaisonColis.filter(c => c.etat === 'PERDU').length,
            eligiblesPourRecuperation: cargaisonColis.filter(c => c.etat === 'ARRIVE').length,
            eligiblesPourPerdu: cargaisonColis.filter(c => ['EN_COURS', 'ARRIVE'].includes(c.etat)).length
        };

        res.json({
            success: true,
            stats,
            cargaisonId
        });

    } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
}

// Export des fonctions pour utilisation dans les routes
module.exports = {
    markColisRecupere,
    markColisPerdu,
    getColisByCargaison,
    bulkActionColis,
    getCargaisonColisStats
};

// Si exécuté directement (pour les tests)
if (require.main === module) {
    async function test() {
        console.log('Test des actions en lot sur les colis...');
        
        // Simuler une requête de test
        const mockReq = {
            body: {
                cargaisonId: 'CG-ME8OG8VKQLDST',
                action: 'RECUPERE'
            }
        };
        
        const mockRes = {
            json: (data) => console.log('Réponse:', JSON.stringify(data, null, 2)),
            status: (code) => ({
                json: (data) => console.log(`Status ${code}:`, JSON.stringify(data, null, 2))
            })
        };
        
        await bulkActionColis(mockReq, mockRes);
    }
    
    test().catch(console.error);
}