/**
 * Vue Détails de Cargaison
 * Affiche les détails d'une cargaison avec gestion des colis
 */

class CargaisonDetailsView {
    constructor(container, params = {}) {
        this.container = container;
        this.params = params;
        this.cargaisonId = params.id;
        this.cargaison = null;
        this.colisManager = null;
        this.init();
    }

    async init() {
        await this.loadCargaisonData();
        this.render();
        this.setupEventListeners();
        console.log('CargaisonDetailsView initialisé');
    }

    async loadCargaisonData() {
        if (!this.cargaisonId) {
            throw new Error('ID de cargaison manquant');
        }

        try {
            const cacheKey = `cargaison_details_${this.cargaisonId}`;
            let data;

            // Vérifier le cache
            if (window.cacheManager && window.cacheManager.has(cacheKey)) {
                data = window.cacheManager.get(cacheKey);
            } else {
                const response = await fetch(`/api/cargaisons/${this.cargaisonId}`);
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
                this.cargaison = data.cargaison;
            } else {
                throw new Error(data.error || 'Cargaison non trouvée');
            }

        } catch (error) {
            console.error('Erreur lors du chargement de la cargaison:', error);
            throw error;
        }
    }

    render() {
        if (!this.cargaison) {
            this.renderError('Cargaison non trouvée');
            return;
        }

        this.container.innerHTML = `
            <div class="cargaison-details-wrapper">
                <!-- Header avec navigation -->
                <div class="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-4">
                            <button onclick="history.back()" 
                                    class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100">
                                <i data-feather="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">
                                    Cargaison ${this.cargaison.numero || this.cargaison.id}
                                </h1>
                                <p class="text-sm text-gray-500">
                                    ${this.formatTransportType(this.cargaison.type)} - 
                                    Créée le ${this.formatDate(this.cargaison.dateCreation)}
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <span class="status-badge status-${this.getStatusClass(this.cargaison.etatAvancement)}">
                                ${this.formatStatus(this.cargaison.etatAvancement)}
                            </span>
                            ${this.renderActionButtons()}
                        </div>
                    </div>
                </div>

                <!-- Informations de la cargaison -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <!-- Détails principaux -->
                    <div class="lg:col-span-2">
                        <div class="bg-white p-6 rounded-xl shadow-sm">
                            <h2 class="text-lg font-semibold text-gray-900 mb-4">
                                <i data-feather="info" class="w-5 h-5 inline mr-2"></i>
                                Informations générales
                            </h2>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 class="font-medium text-gray-900 mb-3">Trajet</h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <i data-feather="map-pin" class="w-4 h-4 text-green-600"></i>
                                            <span class="text-sm">
                                                <strong>Départ:</strong> ${this.cargaison.trajet?.depart?.lieu || 'Non défini'}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-feather="flag" class="w-4 h-4 text-red-600"></i>
                                            <span class="text-sm">
                                                <strong>Arrivée:</strong> ${this.cargaison.trajet?.arrivee?.lieu || 'Non défini'}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-feather="navigation" class="w-4 h-4 text-blue-600"></i>
                                            <span class="text-sm">
                                                <strong>Distance:</strong> ${this.formatNumber(this.cargaison.distance)} km
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 class="font-medium text-gray-900 mb-3">Capacité</h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <i data-feather="weight" class="w-4 h-4 text-purple-600"></i>
                                            <span class="text-sm">
                                                <strong>Poids max:</strong> ${this.formatNumber(this.cargaison.poidsMax)} kg
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-feather="package" class="w-4 h-4 text-orange-600"></i>
                                            <span class="text-sm">
                                                <strong>Colis:</strong> ${this.cargaison.colisIds?.length || 0}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-feather="dollar-sign" class="w-4 h-4 text-green-600"></i>
                                            <span class="text-sm">
                                                <strong>Valeur totale:</strong> ${this.formatCurrency(this.cargaison.prixTotal || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            ${this.renderTimeline()}
                        </div>
                    </div>

                    <!-- Statistiques -->
                    <div class="space-y-6">
                        ${this.renderStats()}
                        ${this.renderMap()}
                    </div>
                </div>

                <!-- Gestionnaire de colis -->
                <div id="colis-manager-container">
                    <!-- Le gestionnaire de colis sera chargé ici -->
                </div>
            </div>
        `;

        // Réinitialiser les icônes Feather
        if (window.feather) {
            feather.replace();
        }

        // Charger le gestionnaire de colis
        this.loadColisManager();
    }

    renderActionButtons() {
        const buttons = [];
        const etat = this.cargaison.etatAvancement;
        const etatGlobal = this.cargaison.etatGlobal;

        if (etatGlobal === 'OUVERT') {
            buttons.push(`
                <button onclick="window.cargaisonDetailsView.closeCargaison()" 
                        class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                    <i data-feather="lock" class="w-4 h-4 inline mr-2"></i>
                    Fermer
                </button>
            `);
        }

        if (etat === 'EN_ATTENTE' && etatGlobal === 'FERME') {
            buttons.push(`
                <button onclick="window.cargaisonDetailsView.startCargaison()" 
                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <i data-feather="play" class="w-4 h-4 inline mr-2"></i>
                    Démarrer
                </button>
            `);
        }

        if (etat === 'EN_COURS') {
            buttons.push(`
                <button onclick="window.cargaisonDetailsView.markCargaisonArrived()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <i data-feather="check" class="w-4 h-4 inline mr-2"></i>
                    Marquer arrivée
                </button>
            `);
        }

        return buttons.join('');
    }

    renderTimeline() {
        const timeline = [];
        
        if (this.cargaison.dateCreation) {
            timeline.push({
                date: this.cargaison.dateCreation,
                label: 'Création',
                icon: 'plus',
                completed: true
            });
        }
        
        if (this.cargaison.dateDepart) {
            timeline.push({
                date: this.cargaison.dateDepart,
                label: 'Départ',
                icon: 'play',
                completed: true
            });
        }
        
        if (this.cargaison.dateArriveePrevu) {
            timeline.push({
                date: this.cargaison.dateArriveePrevu,
                label: 'Arrivée prévue',
                icon: 'clock',
                completed: false
            });
        }
        
        if (this.cargaison.dateArriveeReelle) {
            timeline.push({
                date: this.cargaison.dateArriveeReelle,
                label: 'Arrivée réelle',
                icon: 'flag',
                completed: true
            });
        }

        if (timeline.length === 0) return '';

        return `
            <div class="mt-6">
                <h3 class="font-medium text-gray-900 mb-3">Chronologie</h3>
                <div class="space-y-3">
                    ${timeline.map(item => `
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center ${
                                item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }">
                                <i data-feather="${item.icon}" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-900">${item.label}</p>
                                <p class="text-xs text-gray-500">${this.formatDateTime(item.date)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderStats() {
        const stats = [
            {
                label: 'État global',
                value: this.formatStatus(this.cargaison.etatGlobal),
                icon: 'info',
                color: this.cargaison.etatGlobal === 'OUVERT' ? 'green' : 'gray'
            },
            {
                label: 'Type transport',
                value: this.formatTransportType(this.cargaison.type),
                icon: this.getTypeIcon(this.cargaison.type),
                color: 'blue'
            },
            {
                label: 'Nombre de colis',
                value: this.cargaison.colisIds?.length || 0,
                icon: 'package',
                color: 'purple'
            }
        ];

        return `
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i data-feather="bar-chart" class="w-5 h-5 inline mr-2"></i>
                    Statistiques
                </h2>
                <div class="space-y-4">
                    ${stats.map(stat => `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i data-feather="${stat.icon}" class="w-4 h-4 text-${stat.color}-600"></i>
                                <span class="text-sm text-gray-600">${stat.label}</span>
                            </div>
                            <span class="font-medium text-gray-900">${stat.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderMap() {
        if (!this.cargaison.trajet?.depart || !this.cargaison.trajet?.arrivee) {
            return '';
        }

        return `
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i data-feather="map" class="w-5 h-5 inline mr-2"></i>
                    Carte du trajet
                </h2>
                <div class="h-48 bg-gray-100 rounded-lg flex items-center justify-center"
                     data-lazy-type="map"
                     data-lat="${this.cargaison.trajet.depart.latitude}"
                     data-lng="${this.cargaison.trajet.depart.longitude}"
                     data-zoom="8"
                     data-marker="true">
                    <div class="text-center">
                        <i data-feather="map-pin" class="w-8 h-8 text-gray-400 mx-auto mb-2"></i>
                        <p class="text-sm text-gray-500">Carte en cours de chargement...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async loadColisManager() {
        const container = this.container.querySelector('#colis-manager-container');
        if (!container) return;

        try {
            // Charger le composant de gestion des colis
            const { ColisManagerComponent } = await import('../components/colis-manager.js');
            
            this.colisManager = new ColisManagerComponent(container, {
                cargaisonId: this.cargaisonId
            });
            
            // Rendre disponible globalement
            window.colisManagerComponent = this.colisManager;
            
        } catch (error) {
            console.error('Erreur lors du chargement du gestionnaire de colis:', error);
            container.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <div class="text-center py-8">
                        <i data-feather="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
                        <p class="text-gray-600">Impossible de charger le gestionnaire de colis</p>
                    </div>
                </div>
            `;
            
            if (window.feather) {
                feather.replace(container);
            }
        }
    }

    setupEventListeners() {
        // Les événements sont gérés par les callbacks onclick dans le HTML
        // Rendre cette instance disponible globalement
        window.cargaisonDetailsView = this;
    }

    async closeCargaison() {
        if (typeof createCustomModal === 'function') {
            createCustomModal(
                'Confirmation - Fermer cargaison',
                '<div class="text-center"><i class="fas fa-lock fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir fermer cette cargaison ?</strong></p></div>',
                [
                    {
                        text: 'Confirmer',
                        class: 'btn-warning',
                        onclick: `closeCustomModal(); this.doCloseCargaison()`
                    }
                ]
            );
            return;
        }
    }

    async doCloseCargaison() {

        try {
            const response = await fetch(`/api/cargaisons/${this.cargaisonId}/close`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                this.showNotification('Cargaison fermée avec succès', 'success');
                await this.refreshData();
            } else {
                throw new Error(data.error || 'Erreur lors de la fermeture');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la fermeture de la cargaison', 'error');
        }
    }

    async startCargaison() {
        try {
            const response = await fetch(`/api/cargaisons/${this.cargaisonId}/start`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                this.showNotification('Cargaison démarrée avec succès', 'success');
                await this.refreshData();
            } else {
                throw new Error(data.error || 'Erreur lors du démarrage');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du démarrage de la cargaison', 'error');
        }
    }

    async markCargaisonArrived() {
        try {
            const response = await fetch(`/api/cargaisons/${this.cargaisonId}/arrive`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                this.showNotification('Cargaison marquée comme arrivée', 'success');
                await this.refreshData();
            } else {
                throw new Error(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    async refreshData() {
        // Invalider le cache
        if (window.cacheManager) {
            window.cacheManager.invalidate(`cargaison_details_${this.cargaisonId}`);
        }

        // Recharger les données
        await this.loadCargaisonData();
        this.render();
    }

    renderError(message) {
        this.container.innerHTML = `
            <div class="flex items-center justify-center min-h-96">
                <div class="text-center">
                    <i data-feather="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <button onclick="history.back()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Retour
                    </button>
                </div>
            </div>
        `;

        if (window.feather) {
            feather.replace();
        }
    }

    // Méthodes utilitaires
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
            'OUVERT': 'ouvert',
            'FERME': 'ferme'
        };
        return classes[status] || 'attente';
    }

    formatStatus(status) {
        const statuses = {
            'EN_ATTENTE': 'En attente',
            'EN_COURS': 'En cours',
            'ARRIVE': 'Arrivé',
            'OUVERT': 'Ouvert',
            'FERME': 'Fermé'
        };
        return statuses[status] || status;
    }

    formatNumber(number) {
        return new Intl.NumberFormat('fr-FR').format(number);
    }

    formatCurrency(amount) {
        return this.formatNumber(amount) + ' FCFA';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('fr-FR');
    }

    showNotification(message, type = 'info') {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    destroy() {
        if (this.colisManager) {
            this.colisManager.destroy();
        }
        window.cargaisonDetailsView = null;
        window.colisManagerComponent = null;
    }
}

// Export par défaut
export default CargaisonDetailsView;