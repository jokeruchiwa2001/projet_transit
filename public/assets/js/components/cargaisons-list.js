/**
 * Composant Liste de Cargaisons avec Lazy Loading et Pagination
 * Gère l'affichage paginé des cargaisons avec chargement au scroll
 */

class CargaisonsListComponent {
    constructor(container, params = {}) {
        this.container = container;
        this.params = params;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.isLoading = false;
        this.hasMoreData = true;
        this.filters = {};
        this.searchTerm = '';
        this.cargaisons = [];
        this.intersectionObserver = null;
        this.init();
    }

    async init() {
        this.setupContainer();
        this.setupIntersectionObserver();
        this.setupEventListeners();
        await this.loadInitialData();
        console.log('CargaisonsListComponent initialisé');
    }

    setupContainer() {
        this.container.innerHTML = `
            <div class="cargaisons-list-wrapper">
                <!-- Header avec filtres et recherche -->
                <div class="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                        <h2 class="text-2xl font-bold text-gray-900">Gestion des Cargaisons</h2>
                        <button id="btn-nouvelle-cargaison" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold">
                            <i data-feather="plus" class="inline-block w-5 h-5 mr-2"></i>
                            Nouvelle Cargaison
                        </button>
                    </div>
                    
                    <!-- Filtres -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select id="filter-type" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="">Tous les types</option>
                            <option value="maritime">Maritime</option>
                            <option value="aerienne">Aérienne</option>
                            <option value="routiere">Routière</option>
                        </select>
                        <select id="filter-status" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="">Tous les états</option>
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="EN_COURS">En cours</option>
                            <option value="ARRIVE">Arrivé</option>
                            <option value="FERME">Fermé</option>
                        </select>
                        <input type="text" id="search-code" placeholder="Rechercher par code..." 
                               class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <button id="btn-search" class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                            <i data-feather="search" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- Liste des cargaisons -->
                <div id="cargaisons-container" class="space-y-4">
                    <!-- Les cargaisons seront chargées ici -->
                </div>

                <!-- Indicateur de chargement -->
                <div id="loading-indicator" class="hidden text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-600">Chargement des cargaisons...</p>
                </div>

                <!-- Sentinelle pour le scroll infini -->
                <div id="scroll-sentinel" class="h-4"></div>

                <!-- Message fin de liste -->
                <div id="end-message" class="hidden text-center py-8 text-gray-500">
                    <i data-feather="check-circle" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>Toutes les cargaisons ont été chargées</p>
                </div>
            </div>
        `;

        // Réinitialiser les icônes Feather
        if (window.feather) {
            feather.replace();
        }
    }

    setupIntersectionObserver() {
        const sentinel = this.container.querySelector('#scroll-sentinel');
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading && this.hasMoreData) {
                    this.loadMoreData();
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });

        if (sentinel) {
            this.intersectionObserver.observe(sentinel);
        }
    }

    setupEventListeners() {
        // Filtres
        const filterType = this.container.querySelector('#filter-type');
        const filterStatus = this.container.querySelector('#filter-status');
        const searchInput = this.container.querySelector('#search-code');
        const searchBtn = this.container.querySelector('#btn-search');
        const newCargaisonBtn = this.container.querySelector('#btn-nouvelle-cargaison');

        if (filterType) {
            filterType.addEventListener('change', () => this.applyFilters());
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.applyFilters());
        }

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.applyFilters(), 300));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.applyFilters());
        }

        if (newCargaisonBtn) {
            newCargaisonBtn.addEventListener('click', () => this.openNewCargaisonModal());
        }
    }

    async loadInitialData() {
        this.currentPage = 1;
        this.cargaisons = [];
        this.hasMoreData = true;
        
        const container = this.container.querySelector('#cargaisons-container');
        container.innerHTML = '';
        
        await this.loadMoreData();
    }

    async loadMoreData() {
        if (this.isLoading || !this.hasMoreData) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.filters
            });

            if (this.searchTerm) {
                params.append('search', this.searchTerm);
            }

            const cacheKey = `cargaisons_${params.toString()}`;
            let data;

            // Vérifier le cache
            if (window.cacheManager && window.cacheManager.has(cacheKey)) {
                data = window.cacheManager.get(cacheKey);
            } else {
                const response = await fetch(`/api/cargaisons/list?${params}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                data = await response.json();
                
                // Mettre en cache
                if (window.cacheManager) {
                    window.cacheManager.set(cacheKey, data, 2 * 60 * 1000); // 2 minutes
                }
            }

            if (data.success) {
                const newCargaisons = data.cargaisons || [];
                
                if (newCargaisons.length === 0) {
                    this.hasMoreData = false;
                    this.showEndMessage();
                } else {
                    this.cargaisons.push(...newCargaisons);
                    this.renderCargaisons(newCargaisons);
                    this.currentPage++;
                    
                    if (newCargaisons.length < this.itemsPerPage) {
                        this.hasMoreData = false;
                        this.showEndMessage();
                    }
                }
                
                this.totalItems = data.total || this.cargaisons.length;
            } else {
                throw new Error(data.error || 'Erreur lors du chargement');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des cargaisons:', error);
            this.showError('Erreur lors du chargement des cargaisons');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderCargaisons(cargaisons) {
        const container = this.container.querySelector('#cargaisons-container');
        
        cargaisons.forEach(cargaison => {
            const cargaisonElement = this.createCargaisonElement(cargaison);
            container.appendChild(cargaisonElement);
            
            // Animation d'apparition
            setTimeout(() => {
                cargaisonElement.classList.add('opacity-100', 'translate-y-0');
            }, 50);
        });
    }

    createCargaisonElement(cargaison) {
        const element = document.createElement('div');
        element.className = 'bg-white rounded-xl shadow-sm p-6 card-hover opacity-0 translate-y-4 transition-all duration-300';
        element.dataset.cargaisonId = cargaison.id;
        
        element.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="bg-${this.getTypeColor(cargaison.type)}-100 p-2 rounded-full">
                        <i data-feather="${this.getTypeIcon(cargaison.type)}" class="text-${this.getTypeColor(cargaison.type)}-600 w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900">${cargaison.numero || cargaison.id}</h3>
                        <p class="text-sm text-gray-500">Cargaison ${this.formatTransportType(cargaison.type)}</p>
                    </div>
                </div>
                <span class="status-badge status-${this.getStatusClass(cargaison.etatAvancement || cargaison.status)}">
                    ${this.formatStatus(cargaison.etatAvancement || cargaison.status)}
                </span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                    <p class="font-medium">${cargaison.trajet?.depart?.lieu || cargaison.depart || 'Non défini'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Arrivée</p>
                    <p class="font-medium">${cargaison.trajet?.arrivee?.lieu || cargaison.arrivee || 'Non défini'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Colis</p>
                    <p class="font-medium">${cargaison.colisIds?.length || cargaison.nbProduits || 0}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                    <p class="font-medium">${this.formatNumber(cargaison.distance || 0)} km</p>
                </div>
            </div>
            
            <div class="flex justify-between items-center">
                <div class="flex space-x-2">
                    <button onclick="window.cargaisonsListComponent.viewCargaisonDetails('${cargaison.id}')" 
                            class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm transition-colors">
                        <i data-feather="eye" class="w-4 h-4 inline mr-1"></i>
                        Détails
                    </button>
                    ${this.renderActionButtons(cargaison)}
                </div>
                <p class="font-bold text-lg text-green-600">
                    ${this.formatCurrency(cargaison.prixTotal || cargaison.sommeTotale || 0)}
                </p>
            </div>
        `;

        // Réinitialiser les icônes Feather pour cet élément
        if (window.feather) {
            feather.replace(element);
        }

        return element;
    }

    renderActionButtons(cargaison) {
        const buttons = [];
        const etat = cargaison.etatAvancement || cargaison.status;
        const etatGlobal = cargaison.etatGlobal;

        if (etatGlobal === 'OUVERT') {
            buttons.push(`
                <button onclick="window.cargaisonsListComponent.closeCargaison('${cargaison.id}')" 
                        class="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-lg text-sm transition-colors">
                    <i data-feather="lock" class="w-4 h-4 inline mr-1"></i>
                    Fermer
                </button>
            `);
        }

        if (etat === 'EN_ATTENTE' && etatGlobal === 'FERME') {
            buttons.push(`
                <button onclick="window.cargaisonsListComponent.startCargaison('${cargaison.id}')" 
                        class="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg text-sm transition-colors">
                    <i data-feather="play" class="w-4 h-4 inline mr-1"></i>
                    Démarrer
                </button>
            `);
        }

        if (etat === 'EN_COURS') {
            buttons.push(`
                <button onclick="window.cargaisonsListComponent.markCargaisonArrived('${cargaison.id}')" 
                        class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm transition-colors">
                    <i data-feather="check" class="w-4 h-4 inline mr-1"></i>
                    Marquer arrivée
                </button>
            `);
        }

        return buttons.join('');
    }

    async applyFilters() {
        const filterType = this.container.querySelector('#filter-type')?.value || '';
        const filterStatus = this.container.querySelector('#filter-status')?.value || '';
        const searchTerm = this.container.querySelector('#search-code')?.value || '';

        this.filters = {};
        if (filterType) this.filters.type = filterType;
        if (filterStatus) this.filters.status = filterStatus;
        this.searchTerm = searchTerm;

        // Invalider le cache pour cette recherche
        if (window.cacheManager) {
            window.cacheManager.invalidate('cargaisons_');
        }

        await this.loadInitialData();
    }

    async viewCargaisonDetails(id) {
        if (window.spaRouter) {
            window.spaRouter.navigate(`/cargaisons/${id}`);
        } else {
            // Fallback pour l'ancien système
            if (typeof viewCargaisonDetails === 'function') {
                viewCargaisonDetails(id);
            }
        }
    }

    async closeCargaison(id) {
        if (typeof createCustomModal === 'function') {
            createCustomModal(
                'Confirmation - Fermer cargaison',
                '<div class="text-center"><i class="fas fa-lock fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir fermer cette cargaison ?</strong></p></div>',
                [
                    {
                        text: 'Confirmer',
                        class: 'btn-warning',
                        onclick: `closeCustomModal(); window.cargaisonsList.doCloseCargaison('${id}')`
                    }
                ]
            );
            return;
        }
    }

    async doCloseCargaison(id) {

        try {
            const response = await fetch(`/api/cargaisons/${id}/close`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                this.showNotification('Cargaison fermée avec succès', 'success');
                this.refreshCargaison(id);
            } else {
                throw new Error(data.error || 'Erreur lors de la fermeture');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la fermeture de la cargaison', 'error');
        }
    }

    async startCargaison(id) {
        try {
            const response = await fetch(`/api/cargaisons/${id}/start`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                this.showNotification('Cargaison démarrée avec succès', 'success');
                this.refreshCargaison(id);
            } else {
                throw new Error(data.error || 'Erreur lors du démarrage');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du démarrage de la cargaison', 'error');
        }
    }

    async markCargaisonArrived(id) {
        try {
            const response = await fetch(`/api/cargaisons/${id}/arrive`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                this.showNotification('Cargaison marquée comme arrivée', 'success');
                this.refreshCargaison(id);
            } else {
                throw new Error(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    async refreshCargaison(id) {
        // Invalider le cache
        if (window.cacheManager) {
            window.cacheManager.invalidate('cargaisons_');
        }

        // Recharger les données
        await this.loadInitialData();
    }

    openNewCargaisonModal() {
        // Utiliser le modal existant ou créer un nouveau
        if (typeof openCargaisonModal === 'function') {
            openCargaisonModal();
        } else {
            console.log('Modal de création de cargaison à implémenter');
        }
    }

    // Méthodes utilitaires
    getTypeColor(type) {
        const colors = {
            'maritime': 'blue',
            'aerienne': 'green',
            'routiere': 'orange'
        };
        return colors[type] || 'gray';
    }

    getTypeIcon(type) {
        const icons = {
            'maritime': 'anchor',
            'aerienne': 'plane',
            'routiere': 'truck'
        };
        return icons[type] || 'package';
    }

    formatTransportType(type) {
        const types = {
            'maritime': 'Maritime',
            'aerienne': 'Aérienne',
            'routiere': 'Routière'
        };
        return types[type] || type;
    }

    getStatusClass(status) {
        const classes = {
            'EN_ATTENTE': 'attente',
            'EN_COURS': 'cours',
            'ARRIVE': 'arrive',
            'FERME': 'ferme',
            'attente': 'attente',
            'cours': 'cours',
            'arrive': 'arrive',
            'ferme': 'ferme'
        };
        return classes[status] || 'attente';
    }

    formatStatus(status) {
        const statuses = {
            'EN_ATTENTE': 'En attente',
            'EN_COURS': 'En cours',
            'ARRIVE': 'Arrivé',
            'FERME': 'Fermé',
            'attente': 'En attente',
            'cours': 'En cours',
            'arrive': 'Arrivé',
            'ferme': 'Fermé'
        };
        return statuses[status] || 'En attente';
    }

    formatNumber(number) {
        return new Intl.NumberFormat('fr-FR').format(number);
    }

    formatCurrency(amount) {
        return this.formatNumber(amount) + ' FCFA';
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

    showEndMessage() {
        const message = this.container.querySelector('#end-message');
        if (message) {
            message.classList.remove('hidden');
            if (window.feather) {
                feather.replace(message);
            }
        }
    }

    showError(message) {
        const container = this.container.querySelector('#cargaisons-container');
        container.innerHTML = `
            <div class="text-center py-12">
                <i data-feather="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <button onclick="window.cargaisonsListComponent.loadInitialData()" 
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
}

// Rendre disponible globalement pour les callbacks
window.cargaisonsListComponent = null;

// Export par défaut
export default CargaisonsListComponent;

// Export nommé pour compatibilité
export { CargaisonsListComponent };
