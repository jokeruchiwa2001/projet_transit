// Module de gestion des cargaisons TransCargo

class CargaisonManager {
    constructor() {
        this.paginationState = {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 0,
            allCargaisons: []
        };
    }

    // Créer une nouvelle cargaison
    async create(formData) {
        try {
            console.log('🚛 Création de cargaison...');
            const data = await jsonServerApi.createCargaison(formData);
            
            showNotification('Cargaison créée avec succès', 'success');
            console.log('📝 Rechargement des cargaisons...');
            await this.load();
            console.log('✅ Cargaisons rechargées');
            
            // Mettre à jour les statistiques
            if (typeof updateDashboardStats === 'function') {
                setTimeout(() => updateDashboardStats(), 500);
            }
            
            return data;
        } catch (error) {
            console.error('❌ Erreur création cargaison:', error);
            showNotification('Erreur lors de la création de la cargaison', 'error');
            throw error;
        }
    }

    // Charger toutes les cargaisons
    async load() {
        try {
            console.log('📡 Chargement des cargaisons...');
            const container = document.getElementById('liste-cargaisons');
            if (container) {
                container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
            }
            const cargaisons = await jsonServerApi.getCargaisons();
            console.log(`📦 ${cargaisons.length} cargaisons reçues`);
            
            // Stocker toutes les cargaisons et mettre à jour l'état de pagination
            this.paginationState.allCargaisons = cargaisons;
            this.paginationState.totalItems = cargaisons.length;
            this.paginationState.totalPages = Math.ceil(cargaisons.length / this.paginationState.itemsPerPage);
            
            // Afficher la page courante
            this.displayWithPagination();
            console.log('✅ Affichage des cargaisons terminé');
        } catch (error) {
            console.error('❌ Erreur chargement cargaisons:', error);
            const container = document.getElementById('liste-cargaisons');
            if (container) {
                container.innerHTML = '<div class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> Erreur lors du chargement des cargaisons</div>';
            }
        }
    }

    // Afficher les cargaisons avec pagination
    displayWithPagination() {
        const { currentPage, itemsPerPage, allCargaisons, totalItems } = this.paginationState;
        
        if (totalItems === 0) {
            this.display([]);
            this.updatePaginationControls();
            return;
        }
        
        // Calculer les indices de début et fin pour la page courante
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        
        // Extraire les cargaisons pour la page courante
        const currentPageCargaisons = allCargaisons.slice(startIndex, endIndex);
        
        // Afficher les cargaisons
        this.display(currentPageCargaisons);
        
        // Mettre à jour les contrôles de pagination
        this.updatePaginationControls();
    }

    // Afficher les cargaisons
    display(cargaisons) {
        const container = document.getElementById('liste-cargaisons');
        
        if (cargaisons.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">Aucune cargaison créée</p>';
            return;
        }
        
        container.innerHTML = cargaisons.map(cargaison => `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">
                            <i class="fas fa-${TransCargoUtils.getTransportIcon(cargaison.type)}"></i>
                            ${cargaison.numero}
                        </div>
                        <div class="card-subtitle">${TransCargoUtils.formatTransportType(cargaison.type)}</div>
                    </div>
                    <div class="badge ${TransCargoUtils.getStatusBadgeClass(cargaison.etatGlobal)}">
                        <i class="fas fa-${TransCargoUtils.getStatusIcon(cargaison.etatGlobal)}"></i>
                        ${TransCargoUtils.formatStatus(cargaison.etatGlobal)}
                    </div>
                </div>
                <div class="card-content">
                    <div class="result-details">
                        <div class="result-detail">
                            <strong>Trajet</strong>
                            <span>${cargaison.trajet?.depart?.lieu || 'N/A'} → ${cargaison.trajet?.arrivee?.lieu || 'N/A'}</span>
                        </div>
                        <div class="result-detail">
                            <strong>Distance</strong>
                            <span>${cargaison.distance || 0} km</span>
                        </div>
                        <div class="result-detail">
                            <strong>Poids max</strong>
                            <span>${cargaison.poidsMax} kg</span>
                        </div>
                        <div class="result-detail">
                            <strong>Colis</strong>
                            <span>${cargaison.colisIds?.length || 0}</span>
                        </div>
                        <div class="result-detail">
                            <strong>État</strong>
                            <span class="badge ${TransCargoUtils.getStatusBadgeClass(cargaison.etatAvancement)}">
                                ${TransCargoUtils.formatStatus(cargaison.etatAvancement)}
                            </span>
                        </div>
                        <div class="result-detail">
                            <strong>Prix total</strong>
                            <span>${(cargaison.prixTotal || 0).toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="cargaisonManager.viewDetails('${cargaison.id}')">
                        <i class="fas fa-eye"></i> Détails
                    </button>
                    ${cargaison.etatGlobal === 'OUVERT' ? `
                        <button class="btn btn-warning" onclick="cargaisonManager.close('${cargaison.id}')">
                            <i class="fas fa-lock"></i> Fermer
                        </button>
                    ` : ''}
                    ${cargaison.etatGlobal === 'FERME' && cargaison.etatAvancement === 'EN_ATTENTE' ? `
                        <button class="btn btn-success" onclick="cargaisonManager.reopen('${cargaison.id}')">
                            <i class="fas fa-unlock"></i> Rouvrir
                        </button>
                    ` : ''}
                    ${cargaison.etatAvancement === 'EN_ATTENTE' ? `
                        <button class="btn btn-primary" onclick="cargaisonManager.start('${cargaison.id}')">
                            <i class="fas fa-play"></i> Démarrer
                        </button>
                    ` : ''}
                    ${cargaison.etatAvancement === 'EN_COURS' ? `
                        <button class="btn btn-success" onclick="cargaisonManager.markArrived('${cargaison.id}')">
                            <i class="fas fa-check"></i> Marquer arrivée
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Mettre à jour les contrôles de pagination
    updatePaginationControls() {
        const { currentPage, totalPages, totalItems, itemsPerPage } = this.paginationState;
        const container = document.getElementById('pagination-container');
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        let paginationHTML = `
            <div class="pagination-controls">
                <button class="pagination-button" onclick="cargaisonManager.goToPage(1)" ${currentPage === 1 ? 'disabled' : ''} title="Première page">
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="pagination-button" onclick="cargaisonManager.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} title="Page précédente">
                    <i class="fas fa-angle-left"></i>
                </button>
        `;
        
        // Générer les numéros de page
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Ajuster si on est près de la fin
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Ajouter "..." au début si nécessaire
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-button" onclick="cargaisonManager.goToPage(1)" title="Page 1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Ajouter les numéros de page
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-button ${i === currentPage ? 'active' : ''}" onclick="cargaisonManager.goToPage(${i})" title="Page ${i}">
                    ${i}
                </button>
            `;
        }
        
        // Ajouter "..." à la fin si nécessaire
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-button" onclick="cargaisonManager.goToPage(${totalPages})" title="Page ${totalPages}">${totalPages}</button>`;
        }
        
        paginationHTML += `
                <button class="pagination-button" onclick="cargaisonManager.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} title="Page suivante">
                    <i class="fas fa-angle-right"></i>
                </button>
                <button class="pagination-button" onclick="cargaisonManager.goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''} title="Dernière page">
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
            <div class="pagination-info">
                <i class="fas fa-info-circle"></i>
                Affichage de ${startItem} à ${endItem} sur ${totalItems} cargaisons
            </div>
        `;
        
        container.innerHTML = paginationHTML;
    }

    // Aller à une page spécifique
    goToPage(page) {
        if (page < 1 || page > this.paginationState.totalPages) return;
        
        this.paginationState.currentPage = page;
        this.displayWithPagination();
    }

    // Changer le nombre d'éléments par page
    changeItemsPerPage(newItemsPerPage) {
        this.paginationState.itemsPerPage = parseInt(newItemsPerPage);
        this.paginationState.totalPages = Math.ceil(this.paginationState.totalItems / this.paginationState.itemsPerPage);
        this.paginationState.currentPage = 1; // Retourner à la première page
        this.displayWithPagination();
    }

    // Actions sur les cargaisons
    async viewDetails(id) {
        // Déléguer au gestionnaire de détails
        if (window.cargaisonDetailsManager) {
            await window.cargaisonDetailsManager.viewDetails(id);
        } else {
            console.error('❌ Gestionnaire de détails non disponible');
            showNotification('Erreur : Gestionnaire de détails non disponible', 'error');
        }
    }

    async close(id) {
        customConfirm('Êtes-vous sûr de vouloir fermer cette cargaison ?', `cargaisonManager.doClose('${id}')`, 'Confirmer la fermeture');
    }

    async doClose(id) {
        try {
            await jsonServerApi.closeCargaison(id);
            showNotification('Cargaison fermée avec succès', 'success');
            await this.load();
            
            // Recharger les statistiques
            if (window.navigationManager) {
                await window.navigationManager.updateDashboardStats();
            }
        } catch (error) {
            showNotification(error.message || 'Erreur lors de la fermeture', 'error');
        }
    }

    async reopen(id) {
        try {
            await jsonServerApi.reopenCargaison(id);
            showNotification('Cargaison rouverte avec succès', 'success');
            await this.load();
            
            // Recharger les statistiques
            if (window.navigationManager) {
                await window.navigationManager.updateDashboardStats();
            }
        } catch (error) {
            showNotification(error.message || 'Erreur lors de la réouverture', 'error');
        }
    }

    async start(id) {
        try {
            await jsonServerApi.startCargaison(id);
            showNotification('Cargaison démarrée avec succès', 'success');
            await this.load();
            
            // Recharger les statistiques
            if (window.navigationManager) {
                await window.navigationManager.updateDashboardStats();
            }
        } catch (error) {
            console.error('Erreur démarrage cargaison:', error);
            
            // Afficher le message d'erreur spécifique
            const message = error.message || 'Erreur lors du démarrage';
            showNotification(message, 'error');
            
            // Si c'est une cargaison vide, suggérer d'ajouter des colis
            if (message.includes('cargaison vide')) {
                setTimeout(() => {
                    showNotification('💡 Astuce : Allez dans "Nouveau Colis" pour ajouter des colis à cette cargaison', 'info');
                }, 2000);
            }
        }
    }

    async markArrived(id) {
        try {
            await jsonServerApi.markCargaisonArrived(id);
            showNotification('Cargaison marquée comme arrivée avec succès', 'success');
            await this.load();
            
            // Recharger les statistiques
            if (window.navigationManager) {
                await window.navigationManager.updateDashboardStats();
            }
        } catch (error) {
            showNotification(error.message || 'Erreur lors de la mise à jour', 'error');
        }
    }
}

// Instance globale
const cargaisonManager = new CargaisonManager();

// Export pour utilisation globale
window.cargaisonManager = cargaisonManager;
window.CargaisonManager = CargaisonManager;
window.cargaisonManager = cargaisonManager;

async function marquerCargaisonArrivee(cargaisonId) {
    // 1. Mettre à jour la cargaison
    await fetch(`${window.JSON_SERVER_URL}/cargaisons/${cargaisonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etat: 'ARRIVE' })
    });

    // 2. Récupérer tous les colis de cette cargaison
    const colisRes = await fetch(`${window.JSON_SERVER_URL}/colis?cargaisonId=${cargaisonId}`);
    const colisList = await colisRes.json();

    // 3. Mettre à jour chaque colis
    await Promise.all(colisList.map(colis =>
        fetch(`${window.JSON_SERVER_URL}/colis/${colis.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ etat: 'ARRIVE' })
        })
    ));

    // 4. Rafraîchir l'affichage ou notifier l'utilisateur
    alert('Cargaison et tous ses colis sont maintenant "ARRIVE".');
    // ...refresh UI si besoin...
}

/**
 * Marque la cargaison et tous ses colis comme "ARRIVE"
 * @param {string} cargaisonId
 */
async function marquerCargaisonEtColisArrives(cargaisonId) {
    // 1. Récupérer la cargaison
    const cargaisonRes = await fetch(`${window.JSON_SERVER_URL}/cargaisons/${cargaisonId}`);
    const cargaison = await cargaisonRes.json();

    // 2. Mettre à jour la cargaison (etatAvancement)
    await fetch(`${window.JSON_SERVER_URL}/cargaisons/${cargaisonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etatAvancement: 'ARRIVE' })
    });

    // 3. Mettre à jour tous les colis associés
    if (Array.isArray(cargaison.colisIds)) {
        await Promise.all(
            cargaison.colisIds.map(colisId =>
                fetch(`${window.JSON_SERVER_URL}/colis/${colisId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ etat: 'ARRIVE' })
                })
            )
        );
    }

    // 4. Rafraîchir l'affichage ou notifier l'utilisateur
    alert('Cargaison et tous ses colis sont maintenant "ARRIVE".');
    // ...refresh UI si besoin...
}

// Ajoute ce listener lors de la génération des boutons "ARRIVE"
document.addEventListener('click', function(event) {
    // Vérifie si le bouton cliqué a la classe 'btn-arrive-cargaison'
    if (event.target.classList.contains('btn-arrive-cargaison')) {
        const cargaisonId = event.target.dataset.cargaisonId;
        if (cargaisonId) {
            marquerCargaisonEtColisArrives(cargaisonId);
        }
    }
});
