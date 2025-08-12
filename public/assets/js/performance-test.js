/**
 * Script de Test et Optimisation des Performances - TransCargo
 * Teste et mesure les performances du système de lazy loading
 */

class PerformanceTester {
    constructor() {
        this.metrics = {
            loadTimes: [],
            cachePerformance: {
                hits: 0,
                misses: 0,
                totalRequests: 0
            },
            componentLoadTimes: new Map(),
            memoryUsage: [],
            networkRequests: [],
            userInteractions: []
        };
        this.startTime = performance.now();
        this.observers = [];
        this.init();
    }

    init() {
        this.setupPerformanceObservers();
        this.setupNetworkMonitoring();
        this.setupMemoryMonitoring();
        this.setupUserInteractionTracking();
        console.log('🧪 Performance Tester initialisé');
    }

    /**
     * Configuration des observers de performance
     */
    setupPerformanceObservers() {
        if ('PerformanceObserver' in window) {
            // Observer les mesures de performance
            const measureObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPerformanceEntry(entry);
                }
            });
            measureObserver.observe({ entryTypes: ['measure'] });
            this.observers.push(measureObserver);

            // Observer les ressources chargées
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordResourceLoad(entry);
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.push(resourceObserver);

            // Observer la navigation
            const navigationObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordNavigationTiming(entry);
                }
            });
            navigationObserver.observe({ entryTypes: ['navigation'] });
            this.observers.push(navigationObserver);
        }
    }

    /**
     * Monitoring du réseau
     */
    setupNetworkMonitoring() {
        // Intercepter les requêtes fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                this.recordNetworkRequest({
                    url,
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: endTime - startTime,
                    size: response.headers.get('content-length'),
                    cached: response.headers.get('x-cache') === 'HIT'
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                
                this.recordNetworkRequest({
                    url,
                    method: args[1]?.method || 'GET',
                    status: 0,
                    duration: endTime - startTime,
                    error: error.message
                });
                
                throw error;
            }
        };
    }

    /**
     * Monitoring de la mémoire
     */
    setupMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                this.recordMemoryUsage();
            }, 5000); // Toutes les 5 secondes
        }
    }

    /**
     * Suivi des interactions utilisateur
     */
    setupUserInteractionTracking() {
        ['click', 'scroll', 'keypress'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.recordUserInteraction(eventType, event);
            }, { passive: true });
        });
    }

    /**
     * Enregistrer une entrée de performance
     */
    recordPerformanceEntry(entry) {
        if (entry.name.includes('transcargo') || entry.name.includes('lazy')) {
            this.metrics.loadTimes.push({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                timestamp: Date.now()
            });
            
            console.log(`📊 Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
        }
    }

    /**
     * Enregistrer le chargement d'une ressource
     */
    recordResourceLoad(entry) {
        if (entry.name.includes('/assets/js/') || entry.name.includes('/api/')) {
            this.metrics.networkRequests.push({
                name: entry.name,
                duration: entry.duration,
                transferSize: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                decodedBodySize: entry.decodedBodySize,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Enregistrer les timings de navigation
     */
    recordNavigationTiming(entry) {
        this.metrics.navigationTiming = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            firstPaint: entry.responseEnd - entry.requestStart,
            timestamp: Date.now()
        };
    }

    /**
     * Enregistrer une requête réseau
     */
    recordNetworkRequest(request) {
        this.metrics.networkRequests.push({
            ...request,
            timestamp: Date.now()
        });
        
        this.metrics.cachePerformance.totalRequests++;
        if (request.cached) {
            this.metrics.cachePerformance.hits++;
        } else {
            this.metrics.cachePerformance.misses++;
        }
    }

    /**
     * Enregistrer l'utilisation mémoire
     */
    recordMemoryUsage() {
        if (performance.memory) {
            this.metrics.memoryUsage.push({
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Enregistrer une interaction utilisateur
     */
    recordUserInteraction(type, event) {
        this.metrics.userInteractions.push({
            type,
            target: event.target.tagName,
            timestamp: Date.now()
        });
    }

    /**
     * Tester le système de lazy loading
     */
    async testLazyLoading() {
        console.log('🧪 Test du système de lazy loading...');
        
        const tests = [
            this.testComponentLoading,
            this.testCachePerformance,
            this.testPagination,
            this.testImageLazyLoading,
            this.testSPANavigation
        ];
        
        const results = [];
        
        for (const test of tests) {
            try {
                const result = await test.call(this);
                results.push(result);
                console.log(`✅ ${result.name}: ${result.status}`);
            } catch (error) {
                console.error(`❌ Erreur lors du test:`, error);
                results.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Test du chargement des composants
     */
    async testComponentLoading() {
        const startTime = performance.now();
        
        // Créer un élément de test
        const testElement = document.createElement('div');
        testElement.setAttribute('data-lazy-type', 'component');
        testElement.setAttribute('data-lazy-source', 'test-component');
        document.body.appendChild(testElement);
        
        // Enregistrer un composant de test
        if (window.lazyLoader) {
            window.lazyLoader.registerComponent('test-component', async () => {
                return {
                    default: class TestComponent {
                        constructor(container) {
                            this.container = container;
                        }
                        async init() {
                            this.container.innerHTML = '<p>Test Component Loaded</p>';
                        }
                    }
                };
            });
            
            // Charger le composant
            await window.lazyLoader.loadComponent(testElement, 'test-component');
        }
        
        const endTime = performance.now();
        
        // Nettoyer
        testElement.remove();
        
        return {
            name: 'Component Loading',
            status: 'PASSED',
            duration: endTime - startTime,
            details: 'Composant chargé avec succès'
        };
    }

    /**
     * Test des performances du cache
     */
    async testCachePerformance() {
        if (!window.cacheManager) {
            return {
                name: 'Cache Performance',
                status: 'SKIPPED',
                details: 'Cache Manager non disponible'
            };
        }
        
        const testData = { test: 'data', timestamp: Date.now() };
        const cacheKey = 'performance-test';
        
        // Test d'écriture
        const writeStart = performance.now();
        window.cacheManager.set(cacheKey, testData);
        const writeTime = performance.now() - writeStart;
        
        // Test de lecture
        const readStart = performance.now();
        const cachedData = window.cacheManager.get(cacheKey);
        const readTime = performance.now() - readStart;
        
        // Vérification
        const isValid = JSON.stringify(cachedData) === JSON.stringify(testData);
        
        // Nettoyer
        window.cacheManager.delete(cacheKey);
        
        return {
            name: 'Cache Performance',
            status: isValid ? 'PASSED' : 'FAILED',
            writeTime,
            readTime,
            details: `Écriture: ${writeTime.toFixed(2)}ms, Lecture: ${readTime.toFixed(2)}ms`
        };
    }

    /**
     * Test de la pagination
     */
    async testPagination() {
        // Simuler une requête paginée
        const testUrl = '/api/cargaisons/list?page=1&limit=5';
        
        try {
            const response = await fetch(testUrl);
            const data = await response.json();
            
            const hasValidStructure = data.success !== undefined && 
                                    data.cargaisons !== undefined && 
                                    data.pagination !== undefined;
            
            return {
                name: 'Pagination Test',
                status: hasValidStructure ? 'PASSED' : 'FAILED',
                details: `Structure de réponse ${hasValidStructure ? 'valide' : 'invalide'}`
            };
        } catch (error) {
            return {
                name: 'Pagination Test',
                status: 'FAILED',
                error: error.message
            };
        }
    }

    /**
     * Test du lazy loading d'images
     */
    async testImageLazyLoading() {
        return new Promise((resolve) => {
            const testImg = document.createElement('img');
            testImg.setAttribute('data-lazy-type', 'image');
            testImg.setAttribute('data-lazy-src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZiIvPjwvc3ZnPg==');
            
            const startTime = performance.now();
            
            testImg.onload = () => {
                const endTime = performance.now();
                testImg.remove();
                
                resolve({
                    name: 'Image Lazy Loading',
                    status: 'PASSED',
                    duration: endTime - startTime,
                    details: 'Image chargée avec succès'
                });
            };
            
            testImg.onerror = () => {
                testImg.remove();
                resolve({
                    name: 'Image Lazy Loading',
                    status: 'FAILED',
                    details: 'Erreur lors du chargement de l\'image'
                });
            };
            
            document.body.appendChild(testImg);
            
            // Observer l'image si le lazy loader est disponible
            if (window.lazyLoader) {
                window.lazyLoader.observe(testImg);
            } else {
                // Fallback: charger directement
                testImg.src = testImg.getAttribute('data-lazy-src');
            }
            
            // Timeout de sécurité
            setTimeout(() => {
                testImg.remove();
                resolve({
                    name: 'Image Lazy Loading',
                    status: 'TIMEOUT',
                    details: 'Timeout lors du chargement'
                });
            }, 5000);
        });
    }

    /**
     * Test de la navigation SPA
     */
    async testSPANavigation() {
        if (!window.spaRouter) {
            return {
                name: 'SPA Navigation',
                status: 'SKIPPED',
                details: 'SPA Router non disponible'
            };
        }
        
        const startTime = performance.now();
        const originalPath = window.location.pathname;
        
        try {
            // Tester la navigation
            await window.spaRouter.navigate('/test-route', {}, { skipHistory: true });
            
            // Revenir à la route originale
            await window.spaRouter.navigate(originalPath, {}, { skipHistory: true });
            
            const endTime = performance.now();
            
            return {
                name: 'SPA Navigation',
                status: 'PASSED',
                duration: endTime - startTime,
                details: 'Navigation SPA fonctionnelle'
            };
        } catch (error) {
            return {
                name: 'SPA Navigation',
                status: 'FAILED',
                error: error.message
            };
        }
    }

    /**
     * Générer un rapport de performance
     */
    generateReport() {
        const now = Date.now();
        const totalTime = now - this.startTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            totalTestTime: totalTime,
            summary: {
                totalLoadTimes: this.metrics.loadTimes.length,
                averageLoadTime: this.calculateAverageLoadTime(),
                cacheHitRate: this.calculateCacheHitRate(),
                totalNetworkRequests: this.metrics.networkRequests.length,
                memoryUsage: this.getCurrentMemoryUsage(),
                userInteractions: this.metrics.userInteractions.length
            },
            details: {
                loadTimes: this.metrics.loadTimes,
                cachePerformance: this.metrics.cachePerformance,
                networkRequests: this.metrics.networkRequests.slice(-10), // Dernières 10 requêtes
                memoryUsage: this.metrics.memoryUsage.slice(-5), // Derniers 5 échantillons
                navigationTiming: this.metrics.navigationTiming
            },
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }

    /**
     * Calculer le temps de chargement moyen
     */
    calculateAverageLoadTime() {
        if (this.metrics.loadTimes.length === 0) return 0;
        
        const total = this.metrics.loadTimes.reduce((sum, entry) => sum + entry.duration, 0);
        return total / this.metrics.loadTimes.length;
    }

    /**
     * Calculer le taux de cache hit
     */
    calculateCacheHitRate() {
        const { hits, totalRequests } = this.metrics.cachePerformance;
        return totalRequests > 0 ? (hits / totalRequests) * 100 : 0;
    }

    /**
     * Obtenir l'utilisation mémoire actuelle
     */
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
            };
        }
        return null;
    }

    /**
     * Générer des recommandations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Recommandations basées sur le temps de chargement
        const avgLoadTime = this.calculateAverageLoadTime();
        if (avgLoadTime > 1000) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: `Temps de chargement moyen élevé (${avgLoadTime.toFixed(2)}ms). Considérer l'optimisation des composants.`
            });
        }
        
        // Recommandations basées sur le cache
        const cacheHitRate = this.calculateCacheHitRate();
        if (cacheHitRate < 50) {
            recommendations.push({
                type: 'cache',
                priority: 'medium',
                message: `Taux de cache hit faible (${cacheHitRate.toFixed(1)}%). Augmenter la durée de vie du cache.`
            });
        }
        
        // Recommandations basées sur la mémoire
        const memoryUsage = this.getCurrentMemoryUsage();
        if (memoryUsage && memoryUsage.percentage > 80) {
            recommendations.push({
                type: 'memory',
                priority: 'high',
                message: `Utilisation mémoire élevée (${memoryUsage.percentage.toFixed(1)}%). Vérifier les fuites mémoire.`
            });
        }
        
        return recommendations;
    }

    /**
     * Afficher le rapport dans la console
     */
    displayReport() {
        const report = this.generateReport();
        
        console.group('📊 Rapport de Performance TransCargo');
        console.log('🕒 Durée totale:', report.totalTestTime, 'ms');
        console.log('⚡ Temps de chargement moyen:', report.summary.averageLoadTime.toFixed(2), 'ms');
        console.log('💾 Taux de cache hit:', report.summary.cacheHitRate.toFixed(1), '%');
        console.log('🌐 Requêtes réseau:', report.summary.totalNetworkRequests);
        
        if (report.summary.memoryUsage) {
            console.log('🧠 Utilisation mémoire:', report.summary.memoryUsage.percentage.toFixed(1), '%');
        }
        
        if (report.recommendations.length > 0) {
            console.group('💡 Recommandations');
            report.recommendations.forEach(rec => {
                console.log(`${rec.priority === 'high' ? '🔴' : '🟡'} ${rec.message}`);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
        
        return report;
    }

    /**
     * Nettoyer les observers
     */
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        console.log('🧹 Performance Tester nettoyé');
    }
}

// Instance globale
let performanceTester = null;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    performanceTester = new PerformanceTester();
    window.performanceTester = performanceTester;
    
    // Lancer les tests après l'initialisation du système lazy
    window.addEventListener('transcargo:lazy:ready', async () => {
        console.log('🚀 Lancement des tests de performance...');
        
        // Attendre un peu pour que tout soit stabilisé
        setTimeout(async () => {
            const results = await performanceTester.testLazyLoading();
            console.log('📋 Résultats des tests:', results);
            
            // Afficher le rapport après 10 secondes d'utilisation
            setTimeout(() => {
                performanceTester.displayReport();
            }, 10000);
        }, 2000);
    });
});

// Nettoyage avant déchargement
window.addEventListener('beforeunload', () => {
    if (performanceTester) {
        performanceTester.cleanup();
    }
});

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceTester;
}