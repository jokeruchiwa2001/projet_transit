/**
 * Système de Lazy Loading pour TransCargo
 * Gère le chargement différé des composants, données et ressources
 */

class LazyLoader {
    constructor() {
        this.cache = new Map();
        this.loadingStates = new Map();
        this.observers = new Map();
        this.componentRegistry = new Map();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupComponentLoader();
        console.log('LazyLoader initialisé');
    }

    /**
     * Configuration de l'Intersection Observer pour le lazy loading
     */
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const lazyType = element.dataset.lazyType;
                    const lazySource = element.dataset.lazySource;

                    switch (lazyType) {
                        case 'image':
                            this.loadImage(element);
                            break;
                        case 'component':
                            this.loadComponent(element, lazySource);
                            break;
                        case 'data':
                            this.loadData(element, lazySource);
                            break;
                        case 'map':
                            this.loadMap(element);
                            break;
                    }

                    this.intersectionObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });
    }

    /**
     * Configuration du chargeur de composants
     */
    setupComponentLoader() {
        // Enregistrer les composants disponibles
        this.registerComponent('cargaisons-list', () => import('./components/cargaisons-list.js'));
        this.registerComponent('colis-manager', () => import('./components/colis-manager.js'));
        this.registerComponent('dashboard-stats', () => import('./components/dashboard-stats.js'));
        this.registerComponent('map-viewer', () => import('./components/map-viewer.js'));
    }

    /**
     * Enregistrer un composant pour le lazy loading
     */
    registerComponent(name, loader) {
        this.componentRegistry.set(name, loader);
    }

    /**
     * Observer un élément pour le lazy loading
     */
    observe(element) {
        if (element && this.intersectionObserver) {
            this.intersectionObserver.observe(element);
        }
    }

    /**
     * Observer tous les éléments avec data-lazy-type
     */
    observeAll() {
        const lazyElements = document.querySelectorAll('[data-lazy-type]');
        lazyElements.forEach(element => this.observe(element));
    }

    /**
     * Charger une image de manière différée
     */
    async loadImage(element) {
        const src = element.dataset.lazySrc;
        const placeholder = element.dataset.lazyPlaceholder;

        if (!src) return;

        try {
            // Afficher le placeholder pendant le chargement
            if (placeholder) {
                element.src = placeholder;
            }

            // Créer une nouvelle image pour précharger
            const img = new Image();
            img.onload = () => {
                element.src = src;
                element.classList.add('lazy-loaded');
                element.classList.remove('lazy-loading');
            };
            img.onerror = () => {
                element.classList.add('lazy-error');
                element.classList.remove('lazy-loading');
            };

            element.classList.add('lazy-loading');
            img.src = src;

        } catch (error) {
            console.error('Erreur lors du chargement de l\'image:', error);
            element.classList.add('lazy-error');
        }
    }

    /**
     * Charger un composant de manière différée
     */
    async loadComponent(element, componentName) {
        if (this.loadingStates.get(componentName)) {
            return; // Déjà en cours de chargement
        }

        try {
            this.loadingStates.set(componentName, true);
            this.showLoadingSkeleton(element);

            const loader = this.componentRegistry.get(componentName);
            if (!loader) {
                throw new Error(`Composant ${componentName} non trouvé`);
            }

            const module = await loader();
            const ComponentClass = module.default || module[componentName];

            if (ComponentClass) {
                const instance = new ComponentClass(element);
                await instance.init();
                element.classList.add('lazy-loaded');
            }

        } catch (error) {
            console.error(`Erreur lors du chargement du composant ${componentName}:`, error);
            this.showError(element, `Erreur de chargement: ${componentName}`);
        } finally {
            this.loadingStates.set(componentName, false);
            this.hideLoadingSkeleton(element);
        }
    }

    /**
     * Charger des données de manière différée
     */
    async loadData(element, endpoint) {
        const cacheKey = `data_${endpoint}`;
        
        try {
            // Vérifier le cache d'abord
            if (this.cache.has(cacheKey)) {
                const cachedData = this.cache.get(cacheKey);
                this.renderData(element, cachedData);
                return;
            }

            this.showLoadingSkeleton(element);

            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Mettre en cache
            this.cache.set(cacheKey, data);
            
            // Rendre les données
            this.renderData(element, data);
            element.classList.add('lazy-loaded');

        } catch (error) {
            console.error(`Erreur lors du chargement des données ${endpoint}:`, error);
            this.showError(element, 'Erreur de chargement des données');
        } finally {
            this.hideLoadingSkeleton(element);
        }
    }

    /**
     * Charger une carte de manière différée
     */
    async loadMap(element) {
        try {
            this.showLoadingSkeleton(element);

            // Vérifier si Google Maps est déjà chargé
            if (!window.google || !window.google.maps) {
                await this.loadGoogleMaps();
            }

            const lat = parseFloat(element.dataset.lat);
            const lng = parseFloat(element.dataset.lng);
            const zoom = parseInt(element.dataset.zoom) || 10;

            const map = new google.maps.Map(element, {
                center: { lat, lng },
                zoom: zoom,
                styles: this.getMapStyles()
            });

            // Ajouter un marqueur si spécifié
            if (element.dataset.marker === 'true') {
                new google.maps.Marker({
                    position: { lat, lng },
                    map: map
                });
            }

            element.classList.add('lazy-loaded');

        } catch (error) {
            console.error('Erreur lors du chargement de la carte:', error);
            this.showError(element, 'Erreur de chargement de la carte');
        } finally {
            this.hideLoadingSkeleton(element);
        }
    }

    /**
     * Charger Google Maps API
     */
    async loadGoogleMaps() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initGoogleMaps`;
            script.async = true;
            script.defer = true;

            window.initGoogleMaps = () => {
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Erreur de chargement de Google Maps'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Styles personnalisés pour les cartes
     */
    getMapStyles() {
        return [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
            }
        ];
    }

    /**
     * Afficher un skeleton de chargement
     */
    showLoadingSkeleton(element) {
        const skeleton = document.createElement('div');
        skeleton.className = 'lazy-skeleton';
        skeleton.innerHTML = `
            <div class="animate-pulse">
                <div class="bg-gray-200 rounded h-4 mb-2"></div>
                <div class="bg-gray-200 rounded h-4 mb-2 w-3/4"></div>
                <div class="bg-gray-200 rounded h-4 w-1/2"></div>
            </div>
        `;
        
        element.appendChild(skeleton);
    }

    /**
     * Masquer le skeleton de chargement
     */
    hideLoadingSkeleton(element) {
        const skeleton = element.querySelector('.lazy-skeleton');
        if (skeleton) {
            skeleton.remove();
        }
    }

    /**
     * Afficher une erreur
     */
    showError(element, message) {
        element.innerHTML = `
            <div class="lazy-error p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-center">
                    <i data-feather="alert-circle" class="text-red-500 w-5 h-5 mr-2"></i>
                    <span class="text-red-700">${message}</span>
                </div>
                <button onclick="location.reload()" class="mt-2 text-sm text-red-600 hover:text-red-800 underline">
                    Réessayer
                </button>
            </div>
        `;
        
        // Réinitialiser les icônes Feather
        if (window.feather) {
            feather.replace();
        }
    }

    /**
     * Rendre des données dans un élément
     */
    renderData(element, data) {
        if (element.dataset.template) {
            const template = document.getElementById(element.dataset.template);
            if (template) {
                element.innerHTML = this.processTemplate(template.innerHTML, data);
            }
        } else {
            element.innerHTML = JSON.stringify(data, null, 2);
        }
    }

    /**
     * Traiter un template avec des données
     */
    processTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || '';
        });
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

    /**
     * Précharger des ressources
     */
    async preload(resources) {
        const promises = resources.map(resource => {
            if (resource.type === 'component') {
                const loader = this.componentRegistry.get(resource.name);
                return loader ? loader() : Promise.resolve();
            } else if (resource.type === 'data') {
                return fetch(resource.url).then(r => r.json());
            }
            return Promise.resolve();
        });

        try {
            await Promise.all(promises);
            console.log('Préchargement terminé');
        } catch (error) {
            console.warn('Erreur lors du préchargement:', error);
        }
    }

    /**
     * Nettoyer les observers
     */
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.cache.clear();
        this.loadingStates.clear();
        this.observers.clear();
    }
}

// Instance globale
window.lazyLoader = new LazyLoader();

// Auto-initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader.observeAll();
});

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoader;
}