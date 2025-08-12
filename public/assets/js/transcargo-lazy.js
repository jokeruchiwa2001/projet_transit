/**
 * TransCargo Lazy Loading System
 * Système principal d'orchestration du lazy loading
 */

class TransCargoLazySystem {
    constructor() {
        this.initialized = false;
        this.components = new Map();
        this.views = new Map();
        this.loadingQueue = [];
        this.performanceMetrics = {
            startTime: performance.now(),
            componentsLoaded: 0,
            totalLoadTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        this.init();
    }

    async init() {
        if (this.initialized) return;

        console.log('🚀 Initialisation du système TransCargo Lazy Loading...');
        
        try {
            // Charger les dépendances de base
            await this.loadCoreDependencies();
            
            // Initialiser les gestionnaires
            this.initializeManagers();
            
            // Configurer les observers
            this.setupObservers();
            
            // Précharger les composants critiques
            await this.preloadCriticalComponents();
            
            // Marquer comme initialisé
            this.initialized = true;
            
            // Calculer le temps d'initialisation
            const initTime = performance.now() - this.performanceMetrics.startTime;
            console.log(`✅ Système TransCargo Lazy Loading initialisé en ${initTime.toFixed(2)}ms`);
            
            // Déclencher l'événement d'initialisation
            this.dispatchEvent('transcargo:lazy:ready', {
                initTime,
                metrics: this.performanceMetrics
            });
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du système lazy loading:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Charger les dépendances de base
     */
    async loadCoreDependencies() {
        const dependencies = [
            { name: 'cache-manager', path: './cache-manager.js' },
            { name: 'lazy-loader', path: './lazy-loader.js' },
            { name: 'spa-router', path: './spa-router.js' }
        ];

        const loadPromises = dependencies.map(async (dep) => {
            try {
                if (dep.name === 'cache-manager' && !window.cacheManager) {
                    await this.loadScript(dep.path);
                }
                if (dep.name === 'lazy-loader' && !window.lazyLoader) {
                    await this.loadScript(dep.path);
                }
                if (dep.name === 'spa-router' && !window.spaRouter) {
                    await this.loadScript(dep.path);
                }
                console.log(`✓ ${dep.name} chargé`);
            } catch (error) {
                console.warn(`⚠️ Erreur lors du chargement de ${dep.name}:`, error);
            }
        });

        await Promise.allSettled(loadPromises);
    }

    /**
     * Initialiser les gestionnaires
     */
    initializeManagers() {
        // Configurer le cache manager
        if (window.cacheManager) {
            window.cacheManager.defaultTTL = 5 * 60 * 1000; // 5 minutes
            window.cacheManager.maxCacheSize = 150;
        }

        // Configurer le lazy loader
        if (window.lazyLoader) {
            // Enregistrer les composants personnalisés
            this.registerCustomComponents();
        }

        // Configurer le routeur SPA
        if (window.spaRouter) {
            this.setupSPARoutes();
        }
    }

    /**
     * Enregistrer les composants personnalisés
     */
    registerCustomComponents() {
        const components = [
            {
                name: 'cargaisons-list',
                loader: () => import('./components/cargaisons-list.js'),
                preload: true
            },
            {
                name: 'colis-manager',
                loader: () => import('./components/colis-manager.js'),
                preload: false
            },
            {
                name: 'dashboard-stats',
                loader: () => this.loadDashboardStats(),
                preload: true
            },
            {
                name: 'map-viewer',
                loader: () => this.loadMapViewer(),
                preload: false
            }
        ];

        components.forEach(component => {
            window.lazyLoader.registerComponent(component.name, component.loader);
            this.components.set(component.name, component);
        });
    }

    /**
     * Configurer les routes SPA
     */
    setupSPARoutes() {
        // Les routes sont déjà configurées dans spa-router.js
        // Ajouter des middlewares personnalisés si nécessaire
        window.spaRouter.use(async (path, params) => {
            // Middleware de logging
            console.log(`🔄 Navigation vers: ${path}`, params);
            
            // Middleware de métriques
            this.trackNavigation(path);
            
            return true; // Continuer la navigation
        });
    }

    /**
     * Configurer les observers
     */
    setupObservers() {
        // Observer les changements de performance
        if ('PerformanceObserver' in window) {
            try {
                const perfObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name.includes('transcargo')) {
                            this.trackPerformanceEntry(entry);
                        }
                    }
                });
                
                perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (error) {
                console.warn('PerformanceObserver non supporté:', error);
            }
        }

        // Observer les erreurs JavaScript
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event);
        });

        // Observer les erreurs de promesses non gérées
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event);
        });
    }

    /**
     * Précharger les composants critiques
     */
    async preloadCriticalComponents() {
        const criticalComponents = Array.from(this.components.values())
            .filter(component => component.preload);

        if (criticalComponents.length === 0) return;

        console.log(`🔄 Préchargement de ${criticalComponents.length} composants critiques...`);

        const preloadPromises = criticalComponents.map(async (component) => {
            try {
                performance.mark(`preload-${component.name}-start`);
                await component.loader();
                performance.mark(`preload-${component.name}-end`);
                performance.measure(
                    `preload-${component.name}`,
                    `preload-${component.name}-start`,
                    `preload-${component.name}-end`
                );
                console.log(`✓ ${component.name} préchargé`);
            } catch (error) {
                console.warn(`⚠️ Erreur lors du préchargement de ${component.name}:`, error);
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Charger un script dynamiquement
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Charger les statistiques du dashboard
     */
    async loadDashboardStats() {
        return {
            default: class DashboardStatsComponent {
                constructor(container) {
                    this.container = container;
                }

                async init() {
                    try {
                        const response = await window.cacheManager.fetchWithCache('/api/statistics');
                        this.render(response.stats);
                    } catch (error) {
                        console.error('Erreur lors du chargement des statistiques:', error);
                        this.renderError();
                    }
                }

                render(stats) {
                    this.container.innerHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div class="bg-white p-6 rounded-xl shadow-sm">
                                <div class="flex items-center">
                                    <div class="bg-blue-100 p-3 rounded-full">
                                        <i data-feather="package" class="text-blue-600 w-6 h-6"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-500">Cargaisons</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.totalCargaisons}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white p-6 rounded-xl shadow-sm">
                                <div class="flex items-center">
                                    <div class="bg-green-100 p-3 rounded-full">
                                        <i data-feather="box" class="text-green-600 w-6 h-6"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-500">Colis</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.totalColis}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white p-6 rounded-xl shadow-sm">
                                <div class="flex items-center">
                                    <div class="bg-yellow-100 p-3 rounded-full">
                                        <i data-feather="truck" class="text-yellow-600 w-6 h-6"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-500">En cours</p>
                                        <p class="text-2xl font-bold text-gray-900">${stats.cargaisonsEnCours}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white p-6 rounded-xl shadow-sm">
                                <div class="flex items-center">
                                    <div class="bg-purple-100 p-3 rounded-full">
                                        <i data-feather="dollar-sign" class="text-purple-600 w-6 h-6"></i>
                                    </div>
                                    <div class="ml-4">
                                        <p class="text-sm font-medium text-gray-500">Revenus</p>
                                        <p class="text-2xl font-bold text-gray-900">${this.formatCurrency(stats.revenuTotal)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    if (window.feather) {
                        feather.replace();
                    }
                }

                renderError() {
                    this.container.innerHTML = `
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex">
                                <i data-feather="alert-circle" class="text-red-500 w-5 h-5 mr-2"></i>
                                <span class="text-red-700">Erreur lors du chargement des statistiques</span>
                            </div>
                        </div>
                    `;

                    if (window.feather) {
                        feather.replace();
                    }
                }

                formatCurrency(amount) {
                    return new Intl.NumberFormat('fr-FR').format(Math.round(amount / 1000000 * 10) / 10) + 'M';
                }
            }
        };
    }

    /**
     * Charger le visualiseur de cartes
     */
    async loadMapViewer() {
        return {
            default: class MapViewerComponent {
                constructor(container, params = {}) {
                    this.container = container;
                    this.params = params;
                }

                async init() {
                    // Utiliser le lazy loader pour charger la carte
                    if (window.lazyLoader) {
                        await window.lazyLoader.loadMap(this.container);
                    }
                }
            }
        };
    }

    /**
     * Suivre les métriques de navigation
     */
    trackNavigation(path) {
        this.performanceMetrics.navigations = this.performanceMetrics.navigations || {};
        this.performanceMetrics.navigations[path] = (this.performanceMetrics.navigations[path] || 0) + 1;
    }

    /**
     * Suivre les entrées de performance
     */
    trackPerformanceEntry(entry) {
        if (entry.entryType === 'measure') {
            this.performanceMetrics.totalLoadTime += entry.duration;
            this.performanceMetrics.componentsLoaded++;
        }
    }

    /**
     * Gérer les erreurs JavaScript
     */
    handleJavaScriptError(event) {
        console.error('Erreur JavaScript capturée:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });

        // Envoyer à un service de monitoring si configuré
        this.reportError('javascript', event);
    }

    /**
     * Gérer les rejets de promesses non gérés
     */
    handleUnhandledRejection(event) {
        console.error('Promesse rejetée non gérée:', event.reason);
        this.reportError('unhandled-rejection', event);
    }

    /**
     * Gérer les erreurs d'initialisation
     */
    handleInitializationError(error) {
        console.error('Erreur d\'initialisation critique:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        this.showCriticalError('Erreur lors de l\'initialisation de l\'application');
        
        // Tenter une récupération
        setTimeout(() => {
            this.attemptRecovery();
        }, 2000);
    }

    /**
     * Afficher une erreur critique
     */
    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i data-feather="alert-circle" class="w-5 h-5 mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i data-feather="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        if (window.feather) {
            feather.replace(errorDiv);
        }
        
        // Supprimer automatiquement après 10 secondes
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }

    /**
     * Tenter une récupération après erreur
     */
    async attemptRecovery() {
        console.log('🔄 Tentative de récupération...');
        
        try {
            // Réinitialiser les états
            this.initialized = false;
            
            // Vider les caches
            if (window.cacheManager) {
                window.cacheManager.clear();
            }
            
            // Réessayer l'initialisation
            await this.init();
            
            console.log('✅ Récupération réussie');
            
        } catch (error) {
            console.error('❌ Échec de la récupération:', error);
            this.showCriticalError('Impossible de récupérer l\'application. Veuillez recharger la page.');
        }
    }

    /**
     * Rapporter une erreur
     */
    reportError(type, event) {
        // Ici, vous pourriez envoyer l'erreur à un service de monitoring
        // comme Sentry, LogRocket, etc.
        
        const errorData = {
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            event: {
                message: event.message || event.reason?.message,
                stack: event.error?.stack || event.reason?.stack
            }
        };
        
        // Pour l'instant, juste logger
        console.log('📊 Erreur rapportée:', errorData);
    }

    /**
     * Déclencher un événement personnalisé
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Obtenir les métriques de performance
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheStats: window.cacheManager?.getStats(),
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    /**
     * Nettoyer les ressources
     */
    destroy() {
        // Nettoyer les observers
        // Vider les caches
        if (window.cacheManager) {
            window.cacheManager.clear();
        }
        
        // Réinitialiser les états
        this.initialized = false;
        this.components.clear();
        this.views.clear();
        
        console.log('🧹 Système TransCargo Lazy Loading nettoyé');
    }
}

// Initialisation automatique
let transCargoLazy = null;

document.addEventListener('DOMContentLoaded', async () => {
    transCargoLazy = new TransCargoLazySystem();
    window.transCargoLazy = transCargoLazy;
});

// Nettoyage avant déchargement
window.addEventListener('beforeunload', () => {
    if (transCargoLazy) {
        transCargoLazy.destroy();
    }
});

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransCargoLazySystem;
}