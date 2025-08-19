// Gestionnaire d'actions pour les colis TransCargo
// Responsabilité : Gérer toutes les actions sur les colis (reçu, récupération, perte)

class ColisActionManager {
    constructor() {
        this.initialized = false;
    }

    // Initialiser le gestionnaire
    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('✅ Gestionnaire d\'actions colis initialisé');
    }

    // Générer un reçu
    async generateReceipt(id) {
        try {
            const result = await apiCall(`/colis/${id}/recu`);
            showReceiptModal(result.recu);
        } catch (error) {
            showNotification('Erreur lors de la génération du reçu', 'error');
        }
    }

    // Marquer un colis comme récupéré
    async markColisRecupere(id) {
        try {
            await apiManager.markColisRecupere(id);
            showNotification('Colis marqué comme récupéré', 'success');
            
            // Recharger la recherche si on est dans la recherche
            await this.refreshSearchIfNeeded();
        } catch (error) {
            showNotification(error.message || 'Erreur lors de la mise à jour', 'error');
        }
    }

    // Marquer un colis comme perdu
    markColisPerdu(id) {
        customConfirm(
            '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir marquer ce colis comme perdu ?</strong></p></div>',
            `colisActionManager.doMarkColisPerdu('${id}')`,
            'Confirmation - Marquer comme perdu'
        );
    }

    // Exécuter le marquage comme perdu
    async doMarkColisPerdu(id) {
        try {
            await apiManager.markColisPerdu(id);
            showNotification('Colis marqué comme perdu', 'warning');
            
            // Recharger la recherche si on est dans la recherche
            await this.refreshSearchIfNeeded();
        } catch (error) {
            showNotification(error.message || 'Erreur lors de la mise à jour', 'error');
        }
    }

    // Actualiser la recherche si nécessaire
    async refreshSearchIfNeeded() {
        if (navigationManager.getCurrentSearchTab() === 'colis-search') {
            const code = TransCargoUtils.$('search-code-colis').value;
            if (code && window.formManager) {
                await window.formManager.handleColisSearch({ preventDefault: () => {} });
            }
        }
    }
}

// Export et instance globale
window.ColisActionManager = ColisActionManager;
window.colisActionManager = new ColisActionManager();