/**
 * Composant Gestionnaire de Colis
 * Gère l'affichage et les actions en lot sur les colis d'une cargaison
 */

class ColisManagerComponent {
    constructor(container, params = {}) {
        this.container = container;
        this.params = params;
        this.cargaisonId = params.cargaisonId;
        this.colis = [];
        this.selectedColis = new Set();
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.setupContainer();
        this.setupEventListeners();
        await this.loadColis();
        console.log('ColisManagerComponent initialisé');
    }

    setupContainer() {
        this.container.innerHTML = `
            <div class="colis-manager-wrapper">
                <!-- Header avec actions en lot -->
                <div class="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">Gestion des Colis</h3>
                            <p class="text-sm text-gray-500" id="colis-count">Chargement...</p>
                        </div>
                        
                        <!-- Actions en lot -->
                        <div class="flex gap-2" id="bulk-actions" style="display: none;">
                            <button id="btn-mark-all-lost" 
                                    class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                                <i data-feather="x-circle" class="w-4 h-4 inline mr-2"></i>
                                Marquer comme perdus
                            </button>
                            <button id="btn-mark-all-recovered" 
                                    class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                <i data-feather="check-circle" class="w-4 h-4 inline mr-2"></i>
                                Marquer comme récupérés
                            </button>
                            <button id="btn-clear-selection" 
                                    class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                                <i data-feather="x" class="w-4 h-4 inline mr-2"></i>
                                Annuler sélection
                            </button>
                        </div>
                    </div>

                    <!-- Sélection rapide -->
                    <div class="flex gap-2 flex-wrap">
                        <button id="btn-select-all" 
                                class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm transition-colors">
                            Tout sélectionner
                        </button>
                        <button id="btn-select-arrived" 
                                class="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg text-sm transition-colors">
                            Sélectionner arrivés
                        </button>
                        <button id="btn-select-none" 
                                class="text-gray-600 hover:bg-gray-50 px-3 py-1 rounded-lg text-sm transition-colors">
                            Désélectionner tout
                        </button>
                    </div>
                </div>

                <!-- Liste des colis -->
                <div id="colis-container" class="space-y-4">
                    <!-- Les colis seront chargés ici -->
                </div>

                <!-- Indicateur de chargement -->
                <div id="loading-indicator" class="hidden text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-600">Chargement des colis...</p>
                </div>
            </div>

            <!-- Modal de confirmation -->
            <div id="confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                    <div class="text-center">
                        <div id="modal-icon" class="w-16 h-16 mx-auto mb-4"></div>
                        <h3 id="modal-title" class="text-lg font-bold text-gray-900 mb-2"></h3>
                        <p id="modal-message" class="text-gray-600 mb-6"></p>
                        <div class="flex gap-3 justify-center">
                            <button id="modal-cancel" 
                                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                Annuler
                            </button>
                            <button id="modal-confirm" 
                                    class="px-4 py-2 rounded-lg text-white">
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Réinitialiser les icônes Feather
        if (window.feather) {
            feather.replace();
        }
    }

    setupEventListeners() {
        // Actions en lot
        const btnMarkAllLost = this.container.querySelector('#btn-mark-all-lost');
        const btnMarkAllRecovered = this.container.querySelector('#btn-mark-all-recovered');
        const btnClearSelection = this.container.querySelector('#btn-clear-selection');

        if (btnMarkAllLost) {
            btnMarkAllLost.addEventListener('click', () => this.confirmBulkAction('PERDU'));
        }

        if (btnMarkAllRecovered) {
            btnMarkAllRecovered.addEventListener('click', () => this.confirmBulkAction('RECUPERE'));
        }

        if (btnClearSelection) {
            btnClearSelection.addEventListener('click', () => this.clearSelection());
        }

        // Sélection rapide
        const btnSelectAll = this.container.querySelector('#btn-select-all');
        const btnSelectArrived = this.container.querySelector('#btn-select-arrived');
        const btnSelectNone = this.container.querySelector('#btn-select-none');

        if (btnSelectAll) {
            btnSelectAll.addEventListener('click', () => this.selectAll());
        }

        if (btnSelectArrived) {
            btnSelectArrived.addEventListener('click', () => this.selectArrived());
        }

        if (btnSelectNone) {
            btnSelectNone.addEventListener('click', () => this.clearSelection());
        }

        // Modal de confirmation
        const modalCancel = this.container.querySelector('#modal-cancel');
        const modalConfirm = this.container.querySelector('#modal-confirm');
        const modal = this.container.querySelector('#confirmation-modal');

        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.hideModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }
    }

    async loadColis() {
        if (!this.cargaisonId) {
            this.showError('ID de cargaison manquant');
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            const cacheKey = `colis_cargaison_${this.cargaisonId}`;
            let data;

            // Vérifier le cache
            if (window.cacheManager && window.cacheManager.has(cacheKey)) {
                data = window.cacheManager.get(cacheKey);
            } else {
                const response = await fetch(`/api/cargaisons/${this.cargaisonId}/colis`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                data = await response.json();
                
                // Mettre en cache
                if (window.cacheManager) {
                    window.cacheManager.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
                }
            }

            if (data.success) {
                this.colis = data.colis || [];
                this.renderColis();
                this.updateColisCount();
            } else {
                throw new Error(data.error || 'Erreur lors du chargement');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des colis:', error);
            this.showError('Erreur lors du chargement des colis');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderColis() {
        const container = this.container.querySelector('#colis-container');
        
        if (this.colis.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i data-feather="package" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun colis</h3>
                    <p class="text-gray-500">Cette cargaison ne contient aucun colis</p>
                </div>
            `;
            
            if (window.feather) {
                feather.replace(container);
            }
            return;
        }

        container.innerHTML = this.colis.map(colis => this.createColisElement(colis)).join('');
        
        // Réinitialiser les icônes Feather
        if (window.feather) {
            feather.replace(container);
        }
    }

    createColisElement(colis) {
        const isSelected = this.selectedColis.has(colis.id);
        const canBeSelected = ['ARRIVE', 'EN_COURS'].includes(colis.etat);
        
        return `
            <div class="bg-white rounded-xl shadow-sm p-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}" 
                 data-colis-id="${colis.id}">
                <div class="flex items-start gap-4">
                    <!-- Checkbox de sélection -->
                    ${canBeSelected ? `
                        <div class="flex items-center pt-1">
                            <input type="checkbox" 
                                   class="colis-checkbox w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                   data-colis-id="${colis.id}"
                                   ${isSelected ? 'checked' : ''}>
                        </div>
                    ` : '<div class="w-4"></div>'}
                    
                    <!-- Informations du colis -->
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-gray-900">${colis.id}</h4>
                            <span class="status-badge status-${this.getStatusClass(colis.etat)}">
                                ${this.formatStatus(colis.etat)}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p class="text-gray-500">Expéditeur</p>
                                <p class="font-medium">${colis.expediteur.prenom} ${colis.expediteur.nom}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Destinataire</p>
                                <p class="font-medium">${colis.destinataire.nomComplet}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Poids / Prix</p>
                                <p class="font-medium">${colis.poids} kg - ${this.formatCurrency(colis.prixFinal)}</p>
                            </div>
                        </div>
                        
                        <!-- Actions individuelles -->
                        <div class="flex gap-2 mt-3">
                            ${this.renderIndividualActions(colis)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderIndividualActions(colis) {
        const actions = [];
        
        if (colis.etat === 'ARRIVE') {
            actions.push(`
                <button onclick="window.colisManagerComponent.markColisRecovered('${colis.id}')" 
                        class="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-sm transition-colors">
                    <i data-feather="check" class="w-3 h-3 inline mr-1"></i>
                    Récupéré
                </button>
            `);
        }
        
        if (['EN_COURS', 'ARRIVE'].includes(colis.etat)) {
            actions.push(`
                <button onclick="window.colisManagerComponent.markColisLost('${colis.id}')" 
                        class="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm transition-colors">
                    <i data-feather="x" class="w-3 h-3 inline mr-1"></i>
                    Perdu
                </button>
            `);
        }
        
        actions.push(`
            <button onclick="window.colisManagerComponent.viewColisDetails('${colis.id}')" 
                    class="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm transition-colors">
                <i data-feather="eye" class="w-3 h-3 inline mr-1"></i>
                Détails
            </button>
        `);
        
        return actions.join('');
    }

    updateColisCount() {
        const countElement = this.container.querySelector('#colis-count');
        const selectedCount = this.selectedColis.size;
        
        if (countElement) {
            if (selectedCount > 0) {
                countElement.textContent = `${this.colis.length} colis total - ${selectedCount} sélectionné(s)`;
            } else {
                countElement.textContent = `${this.colis.length} colis dans cette cargaison`;
            }
        }
        
        // Afficher/masquer les actions en lot
        const bulkActions = this.container.querySelector('#bulk-actions');
        if (bulkActions) {
            bulkActions.style.display = selectedCount > 0 ? 'flex' : 'none';
        }
    }

    selectAll() {
        this.selectedColis.clear();
        this.colis.forEach(colis => {
            if (['ARRIVE', 'EN_COURS'].includes(colis.etat)) {
                this.selectedColis.add(colis.id);
            }
        });
        this.updateSelection();
    }

    selectArrived() {
        this.selectedColis.clear();
        this.colis.forEach(colis => {
            if (colis.etat === 'ARRIVE') {
                this.selectedColis.add(colis.id);
            }
        });
        this.updateSelection();
    }

    clearSelection() {
        this.selectedColis.clear();
        this.updateSelection();
    }

    updateSelection() {
        // Mettre à jour les checkboxes
        const checkboxes = this.container.querySelectorAll('.colis-checkbox');
        checkboxes.forEach(checkbox => {
            const colisId = checkbox.dataset.colisId;
            checkbox.checked = this.selectedColis.has(colisId);
            
            // Mettre à jour l'apparence du conteneur
            const colisElement = checkbox.closest('[data-colis-id]');
            if (colisElement) {
                if (checkbox.checked) {
                    colisElement.classList.add('ring-2', 'ring-blue-500');
                } else {
                    colisElement.classList.remove('ring-2', 'ring-blue-500');
                }
            }
        });
        
        this.updateColisCount();
        
        // Ajouter les écouteurs pour les nouvelles checkboxes
        this.setupCheckboxListeners();
    }

    setupCheckboxListeners() {
        const checkboxes = this.container.querySelectorAll('.colis-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.removeEventListener('change', this.handleCheckboxChange);
            checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));
        });
    }

    handleCheckboxChange(event) {
        const colisId = event.target.dataset.colisId;
        
        if (event.target.checked) {
            this.selectedColis.add(colisId);
        } else {
            this.selectedColis.delete(colisId);
        }
        
        this.updateSelection();
    }

    confirmBulkAction(action) {
        if (this.selectedColis.size === 0) {
            this.showNotification('Aucun colis sélectionné', 'warning');
            return;
        }

        const actionText = action === 'PERDU' ? 'perdus' : 'récupérés';
        const actionColor = action === 'PERDU' ? 'red' : 'green';
        const iconName = action === 'PERDU' ? 'x-circle' : 'check-circle';
        
        this.showModal({
            title: `Marquer ${this.selectedColis.size} colis comme ${actionText}`,
            message: `Êtes-vous sûr de vouloir marquer ${this.selectedColis.size} colis comme ${actionText} ? Cette action ne peut pas être annulée.`,
            icon: iconName,
            iconColor: actionColor,
            confirmText: 'Confirmer',
            confirmColor: actionColor,
            onConfirm: () => this.executeBulkAction(action)
        });
    }

    async executeBulkAction(action) {
        const selectedIds = Array.from(this.selectedColis);
        
        try {
            this.hideModal();
            this.showLoading();
            
            const promises = selectedIds.map(colisId => 
                fetch(`/api/colis/${colisId}/${action.toLowerCase()}`, { method: 'POST' })
                    .then(response => response.json())
            );
            
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.length - successful;
            
            if (successful > 0) {
                const actionText = action === 'PERDU' ? 'perdus' : 'récupérés';
                this.showNotification(
                    `${successful} colis marqués comme ${actionText}${failed > 0 ? ` (${failed} échecs)` : ''}`,
                    failed > 0 ? 'warning' : 'success'
                );
                
                // Invalider le cache et recharger
                if (window.cacheManager) {
                    window.cacheManager.invalidate(`colis_cargaison_${this.cargaisonId}`);
                }
                
                await this.loadColis();
                this.clearSelection();
            } else {
                throw new Error('Aucun colis n\'a pu être mis à jour');
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'action en lot:', error);
            this.showNotification('Erreur lors de la mise à jour des colis', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async markColisRecovered(colisId) {
        await this.updateColisStatus(colisId, 'RECUPERE', 'récupéré');
    }

    async markColisLost(colisId) {
        if (typeof createCustomModal === 'function') {
            createCustomModal(
                'Confirmation - Marquer comme perdu',
                '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir marquer ce colis comme perdu ?</strong></p></div>',
                [
                    {
                        text: 'Confirmer',
                        class: 'btn-danger',
                        onclick: `closeCustomModal(); window.colisManager.doMarkColisLost('${colisId}')`
                    }
                ]
            );
            return;
        }
        await this.updateColisStatus(colisId, 'PERDU', 'perdu');
    }

    async doMarkColisLost(colisId) {
        await this.updateColisStatus(colisId, 'PERDU', 'perdu');
    }

    async updateColisStatus(colisId, status, statusText) {
        try {
            const response = await fetch(`/api/colis/${colisId}/${status.toLowerCase()}`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                this.showNotification(`Colis marqué comme ${statusText}`, 'success');
                
                // Invalider le cache et recharger
                if (window.cacheManager) {
                    window.cacheManager.invalidate(`colis_cargaison_${this.cargaisonId}`);
                }
                
                await this.loadColis();
            } else {
                throw new Error(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la mise à jour du colis', 'error');
        }
    }

    viewColisDetails(colisId) {
        // Implémenter l'affichage des détails du colis
        console.log('Voir détails du colis:', colisId);
    }

    showModal(options) {
        const modal = this.container.querySelector('#confirmation-modal');
        const modalIcon = this.container.querySelector('#modal-icon');
        const modalTitle = this.container.querySelector('#modal-title');
        const modalMessage = this.container.querySelector('#modal-message');
        const modalConfirm = this.container.querySelector('#modal-confirm');

        if (modalIcon) {
            modalIcon.innerHTML = `<i data-feather="${options.icon}" class="w-16 h-16 text-${options.iconColor}-500"></i>`;
        }
        
        if (modalTitle) {
            modalTitle.textContent = options.title;
        }
        
        if (modalMessage) {
            modalMessage.textContent = options.message;
        }
        
        if (modalConfirm) {
            modalConfirm.textContent = options.confirmText;
            modalConfirm.className = `px-4 py-2 rounded-lg text-white bg-${options.confirmColor}-600 hover:bg-${options.confirmColor}-700`;
            modalConfirm.onclick = options.onConfirm;
        }
        
        if (modal) {
            modal.classList.remove('hidden');
        }
        
        if (window.feather) {
            feather.replace(modalIcon);
        }
    }

    hideModal() {
        const modal = this.container.querySelector('#confirmation-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Méthodes utilitaires
    getStatusClass(status) {
        const classes = {
            'EN_ATTENTE': 'attente',
            'EN_COURS': 'cours',
            'ARRIVE': 'arrive',
            'RECUPERE': 'recupere',
            'PERDU': 'perdu'
        };
        return classes[status] || 'attente';
    }

    formatStatus(status) {
        const statuses = {
            'EN_ATTENTE': 'En attente',
            'EN_COURS': 'En cours',
            'ARRIVE': 'Arrivé',
            'RECUPERE': 'Récupéré',
            'PERDU': 'Perdu'
        };
        return statuses[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    }

    showLoading() {
        const indicator = this.container.querySelector('#loading-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    }

    hideLoading() {
        const indicator = this.container.querySelector('#loading-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    showError(message) {
        const container = this.container.querySelector('#colis-container');
        container.innerHTML = `
            <div class="text-center py-12">
                <i data-feather="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <button onclick="window.colisManagerComponent.loadColis()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Réessayer
                </button>
            </div>
        `;
        
        if (window.feather) {
            feather.replace(container);
        }
    }

    showNotification(message, type = 'info') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    destroy() {
        this.selectedColis.clear();
    }
}

// Rendre disponible globalement pour les callbacks
window.colisManagerComponent = null;

// Export par défaut
export default ColisManagerComponent;

// Export nommé pour compatibilité
export { ColisManagerComponent };