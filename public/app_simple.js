// Configuration de l'API
const API_BASE_URL = '/api';

// État de l'application
let currentSection = 'accueil';

// Utilitaires
const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

// Gestion de la navigation
function initNavigation() {
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Gestionnaire spécial pour le lien gestionnaire
    const gestionnaireLink = $('gestionnaire-link');
    if (gestionnaireLink) {
        gestionnaireLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login';
        });
    }
}

function showSection(sectionName) {
    // Cacher toutes les sections
    $$('.section').forEach(section => section.classList.remove('active'));
    
    // Afficher la section sélectionnée
    $(sectionName)?.classList.add('active');
    
    // Mettre à jour la navigation
    $$('.nav-link').forEach(link => link.classList.remove('active'));
    $$(`[data-section="${sectionName}"]`).forEach(link => link.classList.add('active'));
    
    currentSection = sectionName;
}

// API Calls publiques (sans authentification)
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Erreur de communication avec le serveur', 'error');
        throw error;
    }
}

// Suivi de colis
async function trackColis(code) {
    try {
        const result = await apiCall(`/colis/track?code=${encodeURIComponent(code)}`);
        displayTrackingResult(result);
    } catch (error) {
        displayError('resultat-suivi', 'Erreur lors du suivi');
    }
}

function displayTrackingResult(result) {
    const container = $('resultat-suivi');
    
    if (result.statut === 'NOT_FOUND') {
        container.innerHTML = `
            <div class="result-item">
                <div class="text-center">
                    <i class="fas fa-exclamation-circle text-danger" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Code non trouvé</h3>
                    <p>${result.message}</p>
                </div>
            </div>
        `;
        return;
    }
    
    const colis = result.colis;
    const cargaison = result.cargaison;
    
    container.innerHTML = `
        <div class="result-item">
            <div class="result-header">
                <div class="result-title">Suivi du colis ${colis.id}</div>
                <div class="badge ${getStatusBadgeClass(colis.etat)}">
                    ${formatStatus(colis.etat)}
                </div>
            </div>
            
            <div class="progress-steps">
                <div class="progress-step ${getStepClass(colis.etat, 'EN_ATTENTE')}">1</div>
                <div class="progress-step ${getStepClass(colis.etat, 'EN_COURS')}">2</div>
                <div class="progress-step ${getStepClass(colis.etat, 'ARRIVE')}">3</div>
                <div class="progress-step ${getStepClass(colis.etat, 'RECUPERE')}">4</div>
            </div>
            
            <div class="text-center mb-3">
                <h4>${result.message}</h4>
            </div>
            
            <div class="result-details">
                <div class="result-detail">
                    <strong>Expéditeur</strong>
                    <span>${colis.expediteur.prenom} ${colis.expediteur.nom}</span>
                </div>
                <div class="result-detail">
                    <strong>Destinataire</strong>
                    <span>${colis.destinataire.nomComplet}</span>
                </div>
                <div class="result-detail">
                    <strong>Date d'expédition</strong>
                    <span>${formatDate(colis.dateCreation)}</span>
                </div>
                ${colis.dateArrivee ? `
                    <div class="result-detail">
                        <strong>Date d'arrivée</strong>
                        <span>${formatDate(colis.dateArrivee)}</span>
                    </div>
                ` : ''}
                ${cargaison && cargaison.trajet ? `
                    <div class="result-detail">
                        <strong>Trajet</strong>
                        <span>${cargaison.trajet.depart.lieu} → ${cargaison.trajet.arrivee.lieu}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Utilitaires d'affichage
function displayError(containerId, message) {
    const container = $(containerId);
    if (container) {
        container.innerHTML = `<div class="text-center text-danger"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Styles pour la notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        zIndex: '1001',
        maxWidth: '400px'
    });
    
    document.body.appendChild(notification);
    
    // Fermeture automatique
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Formateurs
function formatStatus(status) {
    const statuses = {
        'EN_ATTENTE': 'En attente',
        'EN_COURS': 'En cours',
        'ARRIVE': 'Arrivé',
        'RECUPERE': 'Récupéré',
        'PERDU': 'Perdu',
        'ARCHIVE': 'Archivé',
        'ANNULE': 'Annulé'
    };
    return statuses[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'EN_ATTENTE': 'badge-warning',
        'EN_COURS': 'badge-primary',
        'ARRIVE': 'badge-success',
        'RECUPERE': 'badge-success',
        'PERDU': 'badge-danger',
        'ARCHIVE': 'badge-secondary',
        'ANNULE': 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
}

function getStepClass(currentStatus, stepStatus) {
    const statusOrder = ['EN_ATTENTE', 'EN_COURS', 'ARRIVE', 'RECUPERE'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return '';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}

// Gestion des formulaires
function initForms() {
    // Formulaire suivi
    $('form-suivi')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = $('code-suivi').value;
        if (code) {
            await trackColis(code);
        }
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initForms();
    
    // Affichage initial
    showSection('accueil');
    
    console.log('Application publique TransCargo initialisée');
});
