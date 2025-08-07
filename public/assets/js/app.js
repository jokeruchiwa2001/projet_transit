// Application principale GP du Monde

class GPApp {
    constructor() {
        this.baseUrl = '';
        this.init();
    }
    
    init() {
        console.log('GP du Monde - Application initialisée');
        this.initializeFeatherIcons();
    }
    
    initializeFeatherIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    // Méthodes utilitaires
    async request(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            const response = await fetch(this.baseUrl + url, {
                ...defaultOptions,
                ...options,
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erreur de requête:', error);
            throw error;
        }
    }
    
    showNotification(message, type = 'success') {
        // Créer une notification toast
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    formatNumber(number) {
        return new Intl.NumberFormat('fr-FR').format(number);
    }
    
    formatCurrency(amount) {
        return this.formatNumber(amount) + ' FCFA';
    }
}

// Fonctions globales pour le dashboard
async function loadDashboardStats() {
    try {
        const response = await app.request('/api/cargaisons/list');
        if (response.success) {
            const cargaisons = response.cargaisons;
            
            // Calculer les statistiques
            const stats = {
                cargaisons: cargaisons.length,
                colis: cargaisons.reduce((sum, c) => sum + (c.nbProduits || 0), 0),
                clients: new Set(cargaisons.map(c => c.clientId)).size || 15, // Fallback
                revenus: cargaisons.reduce((sum, c) => sum + (c.sommeTotale || 0), 0)
            };
            
            // Mettre à jour l'interface
            document.getElementById('stat-cargaisons').textContent = stats.cargaisons;
            document.getElementById('stat-colis').textContent = stats.colis;
            document.getElementById('stat-clients').textContent = stats.clients;
            document.getElementById('stat-revenus').textContent = app.formatNumber(Math.round(stats.revenus / 1000000 * 10) / 10) + 'M';
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
        // Valeurs par défaut
        document.getElementById('stat-cargaisons').textContent = '24';
        document.getElementById('stat-colis').textContent = '156';
        document.getElementById('stat-clients').textContent = '89';
        document.getElementById('stat-revenus').textContent = '2.5M';
    }
}

async function loadRecentActivities() {
    const container = document.getElementById('recent-activities');
    if (!container) return;
    
    try {
        const response = await app.request('/api/cargaisons/list');
        if (response.success) {
            const recentCargaisons = response.cargaisons
                .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
                .slice(0, 5);
            
            container.innerHTML = recentCargaisons.map(cargaison => `
                <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div class="bg-blue-100 p-2 rounded-full">
                        <i data-feather="plus" class="text-blue-600 w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-medium">Nouvelle cargaison créée</p>
                        <p class="text-sm text-gray-500">Cargaison ${cargaison.type} ${cargaison.id}</p>
                    </div>
                    <span class="text-xs text-gray-400">${getTimeAgo(cargaison.dateCreation)}</span>
                </div>
            `).join('');
            
            app.initializeFeatherIcons();
        }
    } catch (error) {
        container.innerHTML = `
            <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div class="bg-blue-100 p-2 rounded-full">
                    <i data-feather="plus" class="text-blue-600 w-4 h-4"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium">Système initialisé</p>
                    <p class="text-sm text-gray-500">Prêt à gérer vos cargaisons</p>
                </div>
                <span class="text-xs text-gray-400">Maintenant</span>
            </div>
        `;
        app.initializeFeatherIcons();
    }
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Maintenant';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Maintenant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
}

// Initialisation de l'application
const app = new GPApp();

// Gestionnaire d'événements globaux
document.addEventListener('DOMContentLoaded', function() {
    // Mettre la date minimale pour les inputs de date
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.min = today;
    });
});
