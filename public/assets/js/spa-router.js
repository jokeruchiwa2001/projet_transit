/**
 * Routeur SPA pour TransCargo
 * Gère la navigation sans rechargement de page avec lazy loading des vues
 */

class SPARouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.viewContainer = null;
        this.loadingStates = new Map();
        this.middlewares = [];
        this.init();
    }

    init() {
        this.viewContainer = document.getElementById('main-content') || document.querySelector('main');
        this.setupEventListeners();
        this.registerDefaultRoutes();
        console.log('SPARouter initialisé');
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Gérer les changements d'URL
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange(e.state);
        });

        // Intercepter les clics sur les liens
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.dataset.route;
                const params = JSON.parse(link.dataset.params || '{}');
                this.navigate(route, params);
            }
        });

        // Gérer les soumissions de formulaires avec routage
        document.addEventListener('submit', (e) => {
            const form = e.target.closest('form[data-route]');
            if (form) {
                e.preventDefault();
                const route = form.dataset.route;
                const formData = new FormData(form);
                const params = Object.fromEntries(formData.entries());
                this.navigate(route, params);
            }
        });
    }

    /**
     * Enregistrer les routes par défaut
     */
    registerDefaultRoutes() {
        this.register('/', {
            component: 'dashboard',
            title: 'Tableau de bord - TransCargo',
            loader: () => import('./views/dashboard.js')
        });

        this.register('/cargaisons', {
            component: 'cargaisons-list',
            title: 'Cargaisons - TransCargo',
            loader: () => import('./views/cargaisons.js')
        });

        this.register('/cargaisons/:id', {
            component: 'cargaison-details',
            title: 'Détails Cargaison - TransCargo',
            loader: () => import('./views/cargaison-details.js')
        });

        this.register('/colis', {
            component: 'colis-list',
            title: 'Colis - TransCargo',
            loader: () => import('./views/colis.js')
        });

        this.register('/suivi', {
            component: 'suivi',
            title: 'Suivi - TransCargo',
            loader: () => import('./views/suivi.js')
        });

        this.register('/clients', {
            component: 'clients-list',
            title: 'Clients - TransCargo',
            loader: () => import('./views/clients.js')
        });
    }

    /**
     * Enregistrer une route
     */
    register(path, config) {
        this.routes.set(path, {
            path,
            component: config.component,
            title: config.title || 'TransCargo',
            loader: config.loader,
            middleware: config.middleware || [],
            cache: config.cache !== false
        });
    }

    /**
     * Ajouter un middleware
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * Naviguer vers une route
     */
    async navigate(path, params = {}, options = {}) {
        try {
            // Exécuter les middlewares globaux
            for (const middleware of this.middlewares) {
                const result = await middleware(path, params);
                if (result === false) {
                    return; // Middleware a bloqué la navigation
                }
            }

            const route = this.matchRoute(path);
            if (!route) {
                console.warn(`Route non trouvée: ${path}`);
                this.navigate('/404');
                return;
            }

            // Exécuter les middlewares de la route
            for (const middleware of route.middleware) {
                const result = await middleware(path, params);
                if (result === false) {
                    return;
                }
            }

            // Mettre à jour l'historique si ce n'est pas une navigation arrière
            if (!options.skipHistory) {
                const state = { path, params };
                history.pushState(state, route.title, path);
            }

            // Charger et afficher la vue
            await this.loadView(route, params);

            // Mettre à jour le titre de la page
            document.title = route.title;

            // Mettre à jour la navigation active
            this.updateActiveNavigation(path);

            this.currentRoute = { ...route, params };

        } catch (error) {
            console.error('Erreur lors de la navigation:', error);
            this.showError('Erreur de navigation');
        }
    }

    /**
     * Correspondance de route avec paramètres
     */
    matchRoute(path) {
        // Correspondance exacte d'abord
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }

        // Correspondance avec paramètres
        for (const [routePath, route] of this.routes) {
            const match = this.matchPathWithParams(routePath, path);
            if (match) {
                return { ...route, params: match };
            }
        }

        return null;
    }

    /**
     * Correspondance de chemin avec paramètres
     */
    matchPathWithParams(routePath, actualPath) {
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');

        if (routeParts.length !== actualParts.length) {
            return null;
        }

        const params = {};
        
        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const actualPart = actualParts[i];

            if (routePart.startsWith(':')) {
                // Paramètre de route
                const paramName = routePart.slice(1);
                params[paramName] = actualPart;
            } else if (routePart !== actualPart) {
                return null;
            }
        }

        return params;
    }

    /**
     * Charger une vue
     */
    async loadView(route, params = {}) {
        const cacheKey = `view_${route.component}`;
        
        try {
            // Afficher l'indicateur de chargement
            this.showLoading();

            // Vérifier le cache si activé
            if (route.cache && window.cacheManager && window.cacheManager.has(cacheKey)) {
                const cachedView = window.cacheManager.get(cacheKey);
                await this.renderView(cachedView, params);
                return;
            }

            // Charger le composant
            if (this.loadingStates.get(route.component)) {
                return; // Déjà en cours de chargement
            }

            this.loadingStates.set(route.component, true);

            const module = await route.loader();
            const ViewClass = module.default || module[route.component];

            if (!ViewClass) {
                throw new Error(`Composant ${route.component} non trouvé`);
            }

            const viewInstance = new ViewClass(this.viewContainer, params);
            
            // Mettre en cache si activé
            if (route.cache && window.cacheManager) {
                window.cacheManager.set(cacheKey, viewInstance, 10 * 60 * 1000); // 10 minutes
            }

            await this.renderView(viewInstance, params);

        } catch (error) {
            console.error(`Erreur lors du chargement de la vue ${route.component}:`, error);
            this.showError(`Erreur de chargement: ${route.component}`);
        } finally {
            this.loadingStates.set(route.component, false);
            this.hideLoading();
        }
    }

    /**
     * Rendre une vue
     */
    async renderView(viewInstance, params) {
        if (!this.viewContainer) {
            console.error('Conteneur de vue non trouvé');
            return;
        }

        // Nettoyer la vue précédente
        this.viewContainer.innerHTML = '';

        // Initialiser la nouvelle vue
        if (typeof viewInstance.render === 'function') {
            await viewInstance.render(params);
        } else if (typeof viewInstance.init === 'function') {
            await viewInstance.init(params);
        }

        // Observer les nouveaux éléments lazy
        if (window.lazyLoader) {
            window.lazyLoader.observeAll();
        }

        // Réinitialiser les icônes Feather
        if (window.feather) {
            feather.replace();
        }
    }

    /**
     * Afficher l'indicateur de chargement
     */
    showLoading() {
        if (!this.viewContainer) return;

        const loader = document.createElement('div');
        loader.className = 'spa-loader fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Chargement...</p>
            </div>
        `;
        
        document.body.appendChild(loader);
    }

    /**
     * Masquer l'indicateur de chargement
     */
    hideLoading() {
        const loader = document.querySelector('.spa-loader');
        if (loader) {
            loader.remove();
        }
    }

    /**
     * Afficher une erreur
     */
    showError(message) {
        if (!this.viewContainer) return;

        this.viewContainer.innerHTML = `
            <div class="flex items-center justify-center min-h-96">
                <div class="text-center">
                    <i data-feather="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <button onclick="location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Recharger la page
                    </button>
                </div>
            </div>
        `;

        if (window.feather) {
            feather.replace();
        }
    }

    /**
     * Mettre à jour la navigation active
     */
    updateActiveNavigation(currentPath) {
        // Supprimer les classes actives
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('nav-active', 'active');
        });

        // Ajouter la classe active au lien correspondant
        const activeLink = document.querySelector(`[data-route="${currentPath}"]`);
        if (activeLink) {
            activeLink.classList.add('nav-active', 'active');
        }
    }

    /**
     * Gérer les changements de route
     */
    handleRouteChange(state) {
        if (state) {
            this.navigate(state.path, state.params, { skipHistory: true });
        } else {
            // Navigation initiale
            const currentPath = window.location.pathname;
            this.navigate(currentPath, {}, { skipHistory: true });
        }
    }

    /**
     * Initialiser le routeur avec la route actuelle
     */
    start() {
        const currentPath = window.location.pathname;
        this.navigate(currentPath, {}, { skipHistory: true });
    }

    /**
     * Aller en arrière
     */
    back() {
        history.back();
    }

    /**
     * Aller en avant
     */
    forward() {
        history.forward();
    }

    /**
     * Recharger la route actuelle
     */
    reload() {
        if (this.currentRoute) {
            // Invalider le cache pour cette vue
            if (window.cacheManager) {
                window.cacheManager.invalidate(this.currentRoute.component);
            }
            
            this.navigate(this.currentRoute.path, this.currentRoute.params, { skipHistory: true });
        }
    }

    /**
     * Obtenir la route actuelle
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Vérifier si une route existe
     */
    hasRoute(path) {
        return this.matchRoute(path) !== null;
    }
}

// Instance globale
window.spaRouter = new SPARouter();

// Auto-démarrage
document.addEventListener('DOMContentLoaded', () => {
    window.spaRouter.start();
});

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPARouter;
}