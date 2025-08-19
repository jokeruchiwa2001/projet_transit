// Service d'initialisation de l'application TransCargo
// Responsabilité : Orchestrer le démarrage de l'application

class AppInitializer {
    constructor() {
        this.initialized = false;
    }

    // Initialiser l'application
    async init() {
        if (this.initialized) return;

        console.log('🚀 Initialisation de l\'interface d\'administration TransCargo...');

        // Vérifier l'authentification
        if (!this.checkAuth()) {
            console.log('❌ Authentification échouée - Redirection vers login');
            window.location.href = '/login.html';
            return;
        }

        try {
            // Initialiser les modules
            this.initModules();
            
            // Affichage initial
            navigationManager.showSection('accueil');
            
            this.initialized = true;
            console.log('✅ Interface d\'administration TransCargo initialisée');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
        }
    }

    // Initialiser les modules
    initModules() {
        console.log('📦 Initialisation des modules...');
        
        // Navigation
        navigationManager.init();
        
        // Charger les statistiques du tableau de bord
        setTimeout(() => {
            console.log('🔄 Chargement initial des statistiques...');
            navigationManager.updateDashboardStats();
        }, 1000);
        
        // Recharger les statistiques quand on revient sur l'accueil
        setTimeout(() => {
            if (navigationManager.getCurrentSection() === 'accueil') {
                console.log('🔄 Rechargement des statistiques pour l\'accueil...');
                navigationManager.updateDashboardStats();
            }
        }, 2000);
        
        console.log('✅ Modules initialisés');
    }

    // Vérifier l'authentification locale
    checkAuth() {
        const token = localStorage.getItem('gestionnaire_token');
        const user = localStorage.getItem('gestionnaire_user');
        
        if (!token || !user) {
            console.log('🔐 Aucun token d\'authentification trouvé');
            return false;
        }
        
        try {
            const userData = JSON.parse(user);
            console.log('✅ Utilisateur authentifié:', userData.username);
            return true;
        } catch (error) {
            console.error('❌ Erreur parsing données utilisateur:', error);
            localStorage.removeItem('gestionnaire_token');
            localStorage.removeItem('gestionnaire_user');
            return false;
        }
    }
}

// Export
window.AppInitializer = AppInitializer;