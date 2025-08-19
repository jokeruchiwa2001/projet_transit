// Application principale TransCargo
// Responsabilité : Orchestrer l'initialisation et coordonner tous les modules

class TransCargoApp {
    constructor() {
        this.modules = {};
        this.initialized = false;
    }

    // Initialiser l'application
    async init() {
        if (this.initialized) return;

        console.log('🚀 Démarrage de TransCargo...');

        try {
            // Initialiser les modules
            await this.initializeModules();
            
            // Démarrer l'application
            await this.startApplication();
            
            this.initialized = true;
            console.log('✅ TransCargo initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de TransCargo:', error);
            showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
        }
    }

    // Initialiser tous les modules
    async initializeModules() {
        console.log('📦 Initialisation des modules TransCargo...');

        // Initialiser les services
        this.modules.appInitializer = new AppInitializer();
        this.modules.eventManager = new EventManager();
        this.modules.formManager = new FormManager();
        
        // Initialiser les gestionnaires d'actions
        this.modules.colisActionManager = colisActionManager;
        this.modules.colisActionManager.init();
        
        // Initialiser le gestionnaire de détails des cargaisons
        this.modules.cargaisonDetailsManager = cargaisonDetailsManager;
        this.modules.cargaisonDetailsManager.init();

        // Exposer les modules globalement pour compatibilité
        window.formManager = this.modules.formManager;
        window.eventManager = this.modules.eventManager;
        window.appInitializer = this.modules.appInitializer;

        console.log('✅ Modules TransCargo initialisés');
    }

    // Démarrer l'application
    async startApplication() {
        console.log('🎯 Démarrage de l\'application...');

        // Initialiser les gestionnaires d'événements
        this.modules.eventManager.init();
        
        // Initialiser les formulaires
        this.modules.formManager.init();
        
        // Initialiser l'application principale
        await this.modules.appInitializer.init();

        console.log('✅ Application démarrée');
    }

    // Obtenir un module
    getModule(name) {
        return this.modules[name];
    }

    // Vérifier si l'application est initialisée
    isInitialized() {
        return this.initialized;
    }
}

// Instance globale de l'application
const transCargoApp = new TransCargoApp();

// Classe de compatibilité pour l'ancien AdminApp
class AdminApp {
    constructor() {
        console.log('⚠️ AdminApp est déprécié, utilisez TransCargoApp');
        return transCargoApp;
    }

    async init() {
        return await transCargoApp.init();
    }

    // Méthodes de compatibilité pour les anciennes références
    async generateReceipt(id) {
        return await transCargoApp.getModule('colisActionManager').generateReceipt(id);
    }

    async markColisRecupere(id) {
        return await transCargoApp.getModule('colisActionManager').markColisRecupere(id);
    }

    markColisPerdu(id) {
        return transCargoApp.getModule('colisActionManager').markColisPerdu(id);
    }

    async doMarkColisPerdu(id) {
        return await transCargoApp.getModule('colisActionManager').doMarkColisPerdu(id);
    }
}

// Instances globales pour compatibilité
const adminApp = new AdminApp();

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    transCargoApp.init();
});

// Exports globaux
window.TransCargoApp = TransCargoApp;
window.transCargoApp = transCargoApp;
window.AdminApp = AdminApp;
window.adminApp = adminApp;