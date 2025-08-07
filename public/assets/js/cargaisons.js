// Gestion des cargaisons

async function loadCargaisons() {
    const container = document.getElementById('cargaisons-list');
    if (!container) return;
    
    try {
        const response = await app.request('/api/cargaisons/list');
        if (response.success) {
            displayCargaisons(response.cargaisons);
        } else {
            container.innerHTML = '<p class="text-center text-gray-500">Erreur lors du chargement des cargaisons</p>';
        }
    } catch (error) {
        console.error('Erreur chargement cargaisons:', error);
        // Afficher des données de démonstration
        displayCargaisons(getDemoCargaisons());
    }
}

function displayCargaisons(cargaisons) {
    const container = document.getElementById('cargaisons-list');
    
    if (cargaisons.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i data-feather="package" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune cargaison</h3>
                <p class="text-gray-500 mb-6">Créez votre première cargaison pour commencer</p>
                <button onclick="openCargaisonModal()" class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                    Créer une cargaison
                </button>
            </div>
        `;
        app.initializeFeatherIcons();
        return;
    }
    
    container.innerHTML = cargaisons.map(cargaison => `
        <div class="bg-white rounded-xl shadow-sm p-6 card-hover">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="bg-${getTypeColor(cargaison.type)}-100 p-2 rounded-full">
                        <i data-feather="${getTypeIcon(cargaison.type)}" class="text-${getTypeColor(cargaison.type)}-600 w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900">${cargaison.id}</h3>
                        <p class="text-sm text-gray-500">Cargaison ${cargaison.type}</p>
                    </div>
                </div>
                <span class="status-badge status-${cargaison.status || 'attente'}">${getStatusText(cargaison.status)}</span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                    <p class="font-medium">${cargaison.depart || 'Non défini'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Arrivée</p>
                    <p class="font-medium">${cargaison.arrivee || 'Non défini'}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Produits</p>
                    <p class="font-medium">${cargaison.nbProduits || 0}/10</p>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                    <p class="font-medium">${app.formatNumber(cargaison.distance || 0)} km</p>
                </div>
            </div>
            
            <div class="flex justify-between items-center">
                <div class="flex space-x-2">
                    <button onclick="viewCargaison('${cargaison.id}')" class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm transition-colors">
                        Voir détails
                    </button>
                    <button onclick="addProduitModal('${cargaison.id}')" class="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg text-sm transition-colors">
                        Ajouter produit
                    </button>
                    <button onclick="closeCargaison('${cargaison.id}')" class="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-sm transition-colors">
                        Fermer
                    </button>
                </div>
                <p class="font-bold text-lg">${app.formatCurrency(cargaison.sommeTotale || 0)}</p>
            </div>
        </div>
    `).join('');
    
    app.initializeFeatherIcons();
}

function getTypeColor(type) {
    const colors = {
        'maritime': 'blue',
        'aerienne': 'green',
        'routiere': 'orange'
    };
    return colors[type] || 'gray';
}

function getTypeIcon(type) {
    const icons = {
        'maritime': 'anchor',
        'aerienne': 'plane',
        'routiere': 'truck'
    };
    return icons[type] || 'package';
}

function getStatusText(status) {
    const texts = {
        'attente': 'En attente',
        'cours': 'En cours',
        'arrive': 'Arrivé',
        'ferme': 'Fermé'
    };
    return texts[status] || 'En attente';
}

function getDemoCargaisons() {
    return [
        {
            id: 'MAR-2024-001',
            type: 'maritime',
            distance: 4280,
            depart: 'Dakar, Sénégal',
            arrivee: 'Marseille, France',
            nbProduits: 7,
            sommeTotale: 1250000,
            status: 'cours',
            dateCreation: '2024-01-15T08:30:00'
        },
        {
            id: 'ROU-2024-015',
            type: 'routiere',
            distance: 1200,
            depart: 'Dakar, Sénégal',
            arrivee: 'Bamako, Mali',
            nbProduits: 3,
            sommeTotale: 450000,
            status: 'attente',
            dateCreation: '2024-01-14T14:00:00'
        }
    ];
}

function initCargaisonModal() {
    const modal = document.getElementById('modal-cargaison');
    const btnOpen = document.getElementById('btn-nouvelle-cargaison');
    const btnClose = document.getElementById('close-modal');
    const btnCancel = document.getElementById('cancel-modal');
    const form = document.getElementById('form-cargaison');
    
    if (btnOpen) {
        btnOpen.addEventListener('click', () => openCargaisonModal());
    }
    
    [btnClose, btnCancel].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => closeCargaisonModal());
        }
    });
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCargaisonModal();
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', handleCargaisonSubmit);
    }
}

function openCargaisonModal() {
    const modal = document.getElementById('modal-cargaison');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeCargaisonModal() {
    const modal = document.getElementById('modal-cargaison');
    const form = document.getElementById('form-cargaison');
    
    if (modal) {
        modal.classList.add('hidden');
    }
    
    if (form) {
        form.reset();
    }
}

async function handleCargaisonSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        type: formData.get('type'),
        distance: parseInt(formData.get('distance')),
        depart: formData.get('depart'),
        arrivee: formData.get('arrivee')
    };
    
    try {
        const response = await app.request('/api/cargaisons/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            app.showNotification('Cargaison créée avec succès!');
            closeCargaisonModal();
            loadCargaisons(); // Recharger la liste
        } else {
            app.showNotification(response.error || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Erreur création cargaison:', error);
        app.showNotification('Erreur lors de la création de la cargaison', 'error');
    }
}

// Fonctions pour les actions sur les cargaisons
function viewCargaison(id) {
    console.log('Voir cargaison:', id);
    // Implémenter la vue détaillée
}

function addProduitModal(id) {
    console.log('Ajouter produit à:', id);
    // Implémenter le modal d'ajout de produit
}

function closeCargaison(id) {
    if (confirm('Êtes-vous sûr de vouloir fermer cette cargaison ?')) {
        console.log('Fermer cargaison:', id);
        // Implémenter la fermeture de cargaison
    }
}

// Filtrage et recherche
function initCargaisonFilters() {
    const filterType = document.getElementById('filter-type');
    const filterStatus = document.getElementById('filter-status');
    const searchCode = document.getElementById('search-code');
    const btnSearch = document.getElementById('btn-search');
    
    [filterType, filterStatus].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
    
    if (btnSearch) {
        btnSearch.addEventListener('click', applyFilters);
    }
    
    if (searchCode) {
        searchCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
}

async function applyFilters() {
    const type = document.getElementById('filter-type')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';
    const search = document.getElementById('search-code')?.value || '';
    
    try {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        
        const response = await app.request('/api/cargaisons/list?' + params.toString());
        if (response.success) {
            displayCargaisons(response.cargaisons);
        }
    } catch (error) {
        console.error('Erreur filtrage:', error);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initCargaisonFilters();
});
