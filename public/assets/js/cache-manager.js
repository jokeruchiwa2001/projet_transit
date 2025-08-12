/**
 * Gestionnaire de Cache pour TransCargo
 * Gère le cache côté client avec expiration et invalidation intelligente
 */

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.expirationTimes = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut
        this.maxCacheSize = 100; // Nombre maximum d'entrées
        this.init();
    }

    init() {
        // Nettoyer le cache expiré toutes les minutes
        setInterval(() => this.cleanExpiredCache(), 60000);
        
        // Nettoyer le cache au déchargement de la page
        window.addEventListener('beforeunload', () => this.persistCache());
        
        // Restaurer le cache depuis localStorage
        this.restoreCache();
        
        console.log('CacheManager initialisé');
    }

    /**
     * Stocker des données dans le cache
     */
    set(key, data, ttl = this.defaultTTL) {
        // Vérifier la taille du cache
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldest();
        }

        const expirationTime = Date.now() + ttl;
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            accessed: Date.now()
        });
        
        this.expirationTimes.set(key, expirationTime);
        
        console.log(`Cache: Stocké ${key} (expire dans ${ttl}ms)`);
    }

    /**
     * Récupérer des données du cache
     */
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        // Vérifier l'expiration
        const expirationTime = this.expirationTimes.get(key);
        if (expirationTime && Date.now() > expirationTime) {
            this.delete(key);
            return null;
        }

        const entry = this.cache.get(key);
        entry.accessed = Date.now(); // Mettre à jour le temps d'accès
        
        console.log(`Cache: Récupéré ${key}`);
        return entry.data;
    }

    /**
     * Vérifier si une clé existe dans le cache
     */
    has(key) {
        if (!this.cache.has(key)) {
            return false;
        }

        // Vérifier l'expiration
        const expirationTime = this.expirationTimes.get(key);
        if (expirationTime && Date.now() > expirationTime) {
            this.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Supprimer une entrée du cache
     */
    delete(key) {
        this.cache.delete(key);
        this.expirationTimes.delete(key);
        console.log(`Cache: Supprimé ${key}`);
    }

    /**
     * Invalider le cache par pattern
     */
    invalidate(pattern) {
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
        console.log(`Cache: Invalidé ${keysToDelete.length} entrées pour le pattern "${pattern}"`);
    }

    /**
     * Nettoyer le cache expiré
     */
    cleanExpiredCache() {
        const now = Date.now();
        const expiredKeys = [];
        
        for (const [key, expirationTime] of this.expirationTimes) {
            if (now > expirationTime) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.delete(key));
        
        if (expiredKeys.length > 0) {
            console.log(`Cache: Nettoyé ${expiredKeys.length} entrées expirées`);
        }
    }

    /**
     * Évincer l'entrée la plus ancienne (LRU)
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, entry] of this.cache) {
            if (entry.accessed < oldestTime) {
                oldestTime = entry.accessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.delete(oldestKey);
            console.log(`Cache: Évincé l'entrée la plus ancienne: ${oldestKey}`);
        }
    }

    /**
     * Vider tout le cache
     */
    clear() {
        this.cache.clear();
        this.expirationTimes.clear();
        console.log('Cache: Vidé complètement');
    }

    /**
     * Obtenir les statistiques du cache
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys()),
            usage: Math.round((this.cache.size / this.maxCacheSize) * 100)
        };
    }

    /**
     * Persister le cache dans localStorage
     */
    persistCache() {
        try {
            const cacheData = {};
            const expirationData = {};
            
            for (const [key, entry] of this.cache) {
                cacheData[key] = entry;
            }
            
            for (const [key, expiration] of this.expirationTimes) {
                expirationData[key] = expiration;
            }
            
            localStorage.setItem('transcargo_cache', JSON.stringify(cacheData));
            localStorage.setItem('transcargo_cache_exp', JSON.stringify(expirationData));
            
        } catch (error) {
            console.warn('Erreur lors de la persistance du cache:', error);
        }
    }

    /**
     * Restaurer le cache depuis localStorage
     */
    restoreCache() {
        try {
            const cacheData = localStorage.getItem('transcargo_cache');
            const expirationData = localStorage.getItem('transcargo_cache_exp');
            
            if (cacheData && expirationData) {
                const cache = JSON.parse(cacheData);
                const expirations = JSON.parse(expirationData);
                const now = Date.now();
                
                for (const [key, entry] of Object.entries(cache)) {
                    const expiration = expirations[key];
                    
                    // Ne restaurer que les entrées non expirées
                    if (!expiration || now < expiration) {
                        this.cache.set(key, entry);
                        if (expiration) {
                            this.expirationTimes.set(key, expiration);
                        }
                    }
                }
                
                console.log(`Cache: Restauré ${this.cache.size} entrées depuis localStorage`);
            }
            
        } catch (error) {
            console.warn('Erreur lors de la restauration du cache:', error);
        }
    }

    /**
     * Méthode helper pour les requêtes avec cache
     */
    async fetchWithCache(url, options = {}, ttl = this.defaultTTL) {
        const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
        
        // Vérifier le cache d'abord
        const cachedData = this.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Stocker dans le cache
            this.set(cacheKey, data, ttl);
            
            return data;
            
        } catch (error) {
            console.error(`Erreur lors de la requête ${url}:`, error);
            throw error;
        }
    }

    /**
     * Précharger des données
     */
    async preloadData(urls, ttl = this.defaultTTL) {
        const promises = urls.map(url => 
            this.fetchWithCache(url, {}, ttl).catch(error => {
                console.warn(`Erreur lors du préchargement de ${url}:`, error);
                return null;
            })
        );
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        console.log(`Préchargement: ${successful}/${urls.length} URLs chargées avec succès`);
        return results;
    }
}

// Instance globale
window.cacheManager = new CacheManager();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}