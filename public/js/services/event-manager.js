// Gestionnaire d'événements TransCargo
// Responsabilité : Gérer tous les événements globaux de l'application

class EventManager {
    constructor() {
        this.initialized = false;
    }

    // Initialiser les gestionnaires d'événements
    init() {
        if (this.initialized) return;

        console.log('🔗 Initialisation des gestionnaires d\'événements...');
        
        // Gestion de la fermeture de tous les modals
        this.setupModalCloseHandlers();
        
        // Fermeture en cliquant à l'extérieur
        this.setupOutsideClickHandlers();
        
        this.initialized = true;
        console.log('✅ Gestionnaires d\'événements initialisés');
    }

    // Configuration des gestionnaires de fermeture pour tous les modals
    setupModalCloseHandlers() {
        // Utiliser la délégation d'événement pour les boutons de fermeture
        document.addEventListener('click', (e) => {
            // Bouton × du modal principal
            if (e.target.matches('#modal .close')) {
                e.preventDefault();
                closeModal();
            }
            
            // Bouton × du modal de carte
            if (e.target.matches('#map-modal .close')) {
                e.preventDefault();
                if (typeof closeMapModal === 'function') {
                    closeMapModal();
                }
            }
        });
        
        // Fermeture avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }

    // Gérer la fermeture avec la touche Échap
    handleEscapeKey() {
        const modal = TransCargoUtils.$('modal');
        const mapModal = TransCargoUtils.$('map-modal');
        
        if (modal && modal.style.display === 'block') {
            closeModal();
        }
        if (mapModal && (mapModal.style.display === 'flex' || mapModal.classList.contains('show')) && typeof closeMapModal === 'function') {
            closeMapModal();
        }
    }

    // Gérer les clics à l'extérieur des modals
    setupOutsideClickHandlers() {
        window.addEventListener('click', (e) => {
            const modal = TransCargoUtils.$('modal');
            const mapModal = TransCargoUtils.$('map-modal');
            
            if (e.target === modal) {
                closeModal();
            }
            if (e.target === mapModal && typeof closeMapModal === 'function') {
                closeMapModal();
            }
        });
    }
}

// Export
window.EventManager = EventManager;