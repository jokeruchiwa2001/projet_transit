// Utilitaires généraux pour TransCargo

// Sélecteurs DOM
const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

// Formatage des types de transport
function formatTransportType(type) {
    const types = {
        maritime: 'Maritime',
        aerienne: 'Aérienne', 
        routiere: 'Routière'
    };
    return types[type] || type;
}

// Formatage des statuts
function formatStatus(status) {
    const statuses = {
        'EN_ATTENTE': 'En attente',
        'EN_COURS': 'En cours',
        'ARRIVE': 'Arrivé',
        'RECUPERE': 'Récupéré',
        'PERDU': 'Perdu',
        'ARCHIVE': 'Archivé',
        'ANNULE': 'Annulé',
        'OUVERT': 'Ouvert',
        'FERME': 'Fermé'
    };
    return statuses[status] || status;
}

// Classes CSS pour les badges de statut
function getStatusBadgeClass(status) {
    const classes = {
        'EN_ATTENTE': 'badge-warning',
        'EN_COURS': 'badge-primary',
        'ARRIVE': 'badge-success',
        'RECUPERE': 'badge-success',
        'PERDU': 'badge-danger',
        'ARCHIVE': 'badge-secondary',
        'ANNULE': 'badge-danger',
        'OUVERT': 'badge-success',
        'FERME': 'badge-secondary'
    };
    return classes[status] || 'badge-secondary';
}

// Icônes pour les types de transport
function getTransportIcon(type) {
    const icons = {
        maritime: 'ship',
        aerienne: 'plane',
        routiere: 'truck'
    };
    return icons[type] || 'box';
}

// Icônes pour les statuts
function getStatusIcon(status) {
    const icons = {
        'OUVERT': 'unlock',
        'FERME': 'lock',
        'EN_ATTENTE': 'clock',
        'EN_COURS': 'spinner',
        'ARRIVE': 'check-circle',
        'RECUPERE': 'check-double',
        'PERDU': 'exclamation-triangle',
        'ARCHIVE': 'archive',
        'ANNULE': 'times-circle'
    };
    return icons[status] || 'question-circle';
}

// Icônes pour les notifications
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Affichage de chargement
function showLoading(containerId) {
    const container = $(containerId);
    if (container) {
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
}

// Affichage d'erreur
function displayError(containerId, message) {
    const container = $(containerId);
    if (container) {
        container.innerHTML = `<div class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    }
}

// Export des fonctions pour utilisation globale
window.TransCargoUtils = {
    $,
    $$,
    formatTransportType,
    formatStatus,
    getStatusBadgeClass,
    getTransportIcon,
    getStatusIcon,
    getNotificationIcon,
    showLoading,
    displayError
};