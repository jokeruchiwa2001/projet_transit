// Module de gestion des modales TransCargo

class ModalManager {
    constructor() {
        this.activeModals = [];
    }

    // Créer une modal personnalisée
    create(title, content, buttons = []) {
        // Supprimer toute modal existante avec le même ID
        const existingModal = document.getElementById('custom-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
            align-items: center; justify-content: center;
            backdrop-filter: blur(10px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
            padding: 2rem; border-radius: 16px; 
            max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-height: 80vh; overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        modalContent.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">${title}</h3>
            <div style="margin: 1rem 0;">${content}</div>
            <div style="text-align: right; margin-top: 1.5rem;">
                ${buttons.map(btn => `<button class="btn ${btn.class || 'btn-secondary'}" onclick="${btn.onclick}" style="margin-left: 0.5rem;">${btn.text}</button>`).join('')}
                <button class="btn btn-secondary" onclick="closeCustomModal()" style="margin-left: 0.5rem;">Fermer</button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        this.activeModals.push(modal);

        // Fermer avec Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return modal;
    }

    // Fermer la modal active
    close() {
        const modal = document.getElementById('custom-modal');
        if (modal) {
            modal.remove();
            const index = this.activeModals.indexOf(modal);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
        }
    }

    // Modal d'alerte
    alert(message, title = 'Information') {
        return this.create(title, message);
    }

    // Modal de confirmation
    confirm(message, onConfirm, title = 'Confirmation') {
        return this.create(title, message, [
            { text: 'Confirmer', class: 'btn-primary', onclick: `closeCustomModal(); ${onConfirm}()` }
        ]);
    }

    // Modal de chargement
    loading(message = 'Chargement...') {
        return this.create(message, '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Veuillez patienter...</p></div>');
    }

    // Modal pour afficher un reçu
    showReceipt(receiptContent) {
        const content = `
            <pre style="white-space: pre-wrap; font-family: monospace; background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">${receiptContent}</pre>
            <div class="text-center">
                <button class="btn btn-primary" onclick="printReceipt()">
                    <i class="fas fa-print"></i> Imprimer
                </button>
            </div>
        `;
        return this.create('<i class="fas fa-receipt"></i> Reçu d\'expédition', content);
    }

    // Fermer toutes les modales
    closeAll() {
        this.activeModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        this.activeModals = [];
    }
}

// Instance globale
const modalManager = new ModalManager();

// Fonctions globales pour compatibilité
function createCustomModal(title, content, buttons = []) {
    return modalManager.create(title, content, buttons);
}

function closeCustomModal() {
    modalManager.close();
}

function customAlert(message, title = 'Information') {
    return modalManager.alert(message, title);
}

function customConfirm(message, onConfirm, title = 'Confirmation') {
    return modalManager.confirm(message, onConfirm, title);
}

function showReceiptModal(receiptContent) {
    return modalManager.showReceipt(receiptContent);
}

function printReceipt() {
    window.print();
}

// Gestion des modales standard
function closeModal() {
    const modal = TransCargoUtils.$('modal');
    if (modal) {
        modal.style.display = 'none';
        // Retirer toutes les classes de modal pour éviter les conflits
        modal.classList.remove('show', 'modal-lg', 'modal-xl', 'modal-sm', 'modal-md');
    }
    
    const modalBody = TransCargoUtils.$('modal-body');
    if (modalBody) {
        modalBody.innerHTML = '';
    }
}

// Ajouter les gestionnaires d'événements pour fermer les modales
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal');
    if (modal) {
        // Fermer avec Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
        
        // Fermer en cliquant sur l'arrière-plan
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});

// Export pour utilisation globale
window.ModalManager = ModalManager;
window.createCustomModal = createCustomModal;
window.closeCustomModal = closeCustomModal;
window.customAlert = customAlert;
window.customConfirm = customConfirm;
window.showReceiptModal = showReceiptModal;
window.printReceipt = printReceipt;
window.closeModal = closeModal;