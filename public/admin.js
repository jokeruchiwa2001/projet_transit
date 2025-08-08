// Configuration
const API_BASE_URL = '/api';

// État de l'application
let currentSection = 'cargaisons';
let currentSearchTab = 'colis-search';

// Utilitaires
const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

// Vérification de l'authentification
function checkAuth() {
    const token = localStorage.getItem('gestionnaire_token');
    const user = localStorage.getItem('gestionnaire_user');
    
    if (!token || !user) {
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}

// Déconnexion
function logout() {
    localStorage.removeItem('gestionnaire_token');
    localStorage.removeItem('gestionnaire_user');
    window.location.href = '/';
}

// API avec authentification
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('gestionnaire_token');
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            // Gestion spéciale pour les erreurs serveur
            if (response.status >= 500) {
                console.error(`Erreur serveur ${response.status}`);
                showNotification('Erreur serveur temporaire', 'error');
                return { error: `Erreur serveur (${response.status})` };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        
        // Gestion des erreurs réseau
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('Erreur de connexion réseau');
            showNotification('Problème de connexion réseau', 'error');
            return { error: 'Problème de connexion réseau' };
        }
        
        showNotification('Erreur de communication avec le serveur', 'error');
        return { error: error.message };
    }
}

// Les fonctions de carte sont maintenant dans map-functions.js

function simulateLocationSelection(address) {
    if (!address.trim()) {
        address = 'Lieu par défaut, Dakar, Sénégal';
    }
    
    // Coordonnées simulées autour de Dakar
    const baseLatitude = 14.6937;
    const baseLongitude = -17.4441;
    const randomOffset = () => (Math.random() - 0.5) * 0.1; // ±0.05 degrés
    
    selectedLocation = {
        lieu: address,
        latitude: baseLatitude + randomOffset(),
        longitude: baseLongitude + randomOffset()
    };
    
    showNotification(`Lieu sélectionné : ${address}`, 'success');
}





// Cette fonction est maintenant dans map-functions.js

function confirmLocation() {
    if (!selectedLocation || !currentLocationTarget) {
        showNotification('Veuillez sélectionner un lieu sur la carte', 'warning');
        return;
    }
    
    // Remplir les champs appropriés
    if (currentLocationTarget === 'depart') {
        $('lieu-depart-display').value = selectedLocation.lieu;
        $('lieu-depart-lat').value = selectedLocation.latitude;
        $('lieu-depart-lng').value = selectedLocation.longitude;
    } else {
        $('lieu-arrivee-display').value = selectedLocation.lieu;
        $('lieu-arrivee-lat').value = selectedLocation.latitude;
        $('lieu-arrivee-lng').value = selectedLocation.longitude;
    }
    
    closeMapModal();
    showNotification('Lieu sélectionné avec succès', 'success');
}

// Navigation
function initNavigation() {
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    $$('.section').forEach(section => section.classList.remove('active'));
    $(sectionName)?.classList.add('active');
    
    $$('.nav-link').forEach(link => link.classList.remove('active'));
    $$(`[data-section="${sectionName}"]`).forEach(link => link.classList.add('active'));
    
    currentSection = sectionName;
    
    if (sectionName === 'cargaisons') {
        loadCargaisons();
    } else if (sectionName === 'statistiques') {
        loadStatistiques();
    }
}

// Gestion des onglets de recherche
$$('.search-tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.searchTab;
        
        $$('.search-tab-button').forEach(btn => btn.classList.remove('active'));
        $$('.search-tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        $(tab)?.classList.add('active');
        
        currentSearchTab = tab;
    });
});

// Gestion des cargaisons
async function createCargaison(formData) {
    try {
        const data = await apiCall('/cargaisons', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showNotification('Cargaison créée avec succès', 'success');
        loadCargaisons();
        return data;
    } catch (error) {
        showNotification('Erreur lors de la création de la cargaison', 'error');
        throw error;
    }
}

async function loadCargaisons() {
    try {
        showLoading('liste-cargaisons');
        const cargaisons = await apiCall('/cargaisons');
        displayCargaisons(cargaisons);
    } catch (error) {
        displayError('liste-cargaisons', 'Erreur lors du chargement des cargaisons');
    }
}

function displayCargaisons(cargaisons) {
    const container = $('liste-cargaisons');
    
    if (cargaisons.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">Aucune cargaison créée</p>';
        return;
    }
    
    container.innerHTML = cargaisons.map(cargaison => `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">${cargaison.numero}</div>
                    <div class="card-subtitle">${formatTransportType(cargaison.type)}</div>
                </div>
                <div class="badge ${getStatusBadgeClass(cargaison.etatGlobal)}">
                    ${formatStatus(cargaison.etatGlobal)}
                </div>
            </div>
            <div class="card-content">
                <div class="result-details">
                    <div class="result-detail">
                        <strong>Trajet</strong>
                        <span>${cargaison.trajet.depart.lieu} → ${cargaison.trajet.arrivee.lieu}</span>
                    </div>
                    <div class="result-detail">
                        <strong>Distance</strong>
                        <span>${cargaison.distance} km</span>
                    </div>
                    <div class="result-detail">
                        <strong>Poids max</strong>
                        <span>${cargaison.poidsMax} kg</span>
                    </div>
                    <div class="result-detail">
                        <strong>Colis</strong>
                        <span>${cargaison.colisIds?.length || 0}</span>
                    </div>
                    <div class="result-detail">
                        <strong>État</strong>
                        <span class="badge ${getStatusBadgeClass(cargaison.etatAvancement)}">
                            ${formatStatus(cargaison.etatAvancement)}
                        </span>
                    </div>
                    <div class="result-detail">
                        <strong>Prix total</strong>
                        <span>${(cargaison.prixTotal || 0).toLocaleString()} FCFA</span>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="viewCargaisonDetails('${cargaison.id}')">
                    <i class="fas fa-eye"></i> Détails
                </button>
                ${cargaison.etatGlobal === 'OUVERT' ? `
                    <button class="btn btn-warning" onclick="closeCargaison('${cargaison.id}')">
                        <i class="fas fa-lock"></i> Fermer
                    </button>
                ` : ''}
                ${cargaison.etatGlobal === 'FERME' && cargaison.etatAvancement === 'EN_ATTENTE' ? `
                    <button class="btn btn-success" onclick="reopenCargaison('${cargaison.id}')">
                        <i class="fas fa-unlock"></i> Rouvrir
                    </button>
                ` : ''}
                ${cargaison.etatAvancement === 'EN_ATTENTE' ? `
                    <button class="btn btn-primary" onclick="startCargaison('${cargaison.id}')">
                        <i class="fas fa-play"></i> Démarrer
                    </button>
                ` : ''}
                ${cargaison.etatAvancement === 'EN_COURS' ? `
                    <button class="btn btn-success" onclick="markCargaisonArrived('${cargaison.id}')">
                        <i class="fas fa-check"></i> Marquer arrivée
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Actions sur les cargaisons
async function viewCargaisonDetails(id) {
    try {
        const cargaisons = await apiCall('/cargaisons');
        const cargaison = cargaisons.find(c => c.id === id);
        if (!cargaison) {
            showNotification('Cargaison non trouvée', 'error');
            return;
        }
        
        const colis = await apiCall(`/cargaisons/${id}/colis`);
        
        const modalBody = $('modal-body');
        modalBody.innerHTML = `
            <h3><i class="fas fa-ship"></i> Détails de la cargaison ${cargaison.numero}</h3>
            
            <div class="result-details">
                <div class="result-detail">
                    <strong>Type</strong>
                    <span>${formatTransportType(cargaison.type)}</span>
                </div>
                <div class="result-detail">
                    <strong>Trajet</strong>
                    <span>${cargaison.trajet.depart.lieu} → ${cargaison.trajet.arrivee.lieu}</span>
                </div>
                <div class="result-detail">
                    <strong>Coordonnées départ</strong>
                    <span>${cargaison.trajet.depart.latitude.toFixed(6)}, ${cargaison.trajet.depart.longitude.toFixed(6)}</span>
                </div>
                <div class="result-detail">
                    <strong>Coordonnées arrivée</strong>
                    <span>${cargaison.trajet.arrivee.latitude.toFixed(6)}, ${cargaison.trajet.arrivee.longitude.toFixed(6)}</span>
                </div>
                <div class="result-detail">
                    <strong>Distance</strong>
                    <span>${cargaison.distance} km</span>
                </div>
                <div class="result-detail">
                    <strong>Poids max</strong>
                    <span>${cargaison.poidsMax} kg</span>
                </div>
                <div class="result-detail">
                    <strong>État</strong>
                    <span class="badge ${getStatusBadgeClass(cargaison.etatAvancement)}">
                        ${formatStatus(cargaison.etatAvancement)}
                    </span>
                </div>
                <div class="result-detail">
                    <strong>Colis</strong>
                    <span>${cargaison.colisIds?.length || 0}</span>
                </div>
                <div class="result-detail">
                    <strong>Prix total</strong>
                    <span>${(cargaison.prixTotal || 0).toLocaleString()} FCFA</span>
                </div>
            </div>
            
            ${colis && colis.length > 0 ? `
                <h4>Colis dans cette cargaison :</h4>
                <div class="colis-list">
                    ${colis.map(c => `
                        <div class="card" style="margin-bottom: 1rem;">
                            <div class="card-content">
                                <div class="result-details">
                                    <div class="result-detail">
                                        <strong>Code</strong>
                                        <span>${c.id}</span>
                                    </div>
                                    <div class="result-detail">
                                        <strong>Expéditeur</strong>
                                        <span>${c.expediteur.prenom} ${c.expediteur.nom}</span>
                                    </div>
                                    <div class="result-detail">
                                        <strong>Destinataire</strong>
                                        <span>${c.destinataire.nomComplet}</span>
                                    </div>
                                    <div class="result-detail">
                                        <strong>Poids</strong>
                                        <span>${c.poids} kg</span>
                                    </div>
                                    <div class="result-detail">
                                        <strong>État</strong>
                                        <span class="badge ${getStatusBadgeClass(c.etat)}">${formatStatus(c.etat)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p>Aucun colis dans cette cargaison</p>'}
            
            <div class="text-center" style="margin-top: 2rem;">
                <button class="btn btn-secondary" onclick="closeModal()">
                    <i class="fas fa-times"></i> Fermer
                </button>
            </div>
        `;
        
        $('modal').style.display = 'block';
    } catch (error) {
        showNotification('Erreur lors du chargement des détails', 'error');
    }
}

async function closeCargaison(id) {
    if (!confirm('Êtes-vous sûr de vouloir fermer cette cargaison ?')) return;
    
    try {
        await apiCall(`/cargaisons/${id}/close`, { method: 'POST' });
        showNotification('Cargaison fermée', 'success');
        loadCargaisons();
    } catch (error) {
        showNotification('Erreur lors de la fermeture', 'error');
    }
}

async function reopenCargaison(id) {
    try {
        await apiCall(`/cargaisons/${id}/reopen`, { method: 'POST' });
        showNotification('Cargaison rouverte', 'success');
        loadCargaisons();
    } catch (error) {
        showNotification('Erreur lors de la réouverture', 'error');
    }
}

async function startCargaison(id) {
    try {
        await apiCall(`/cargaisons/${id}/start`, { method: 'POST' });
        showNotification('Cargaison démarrée', 'success');
        loadCargaisons();
    } catch (error) {
        showNotification('Erreur lors du démarrage', 'error');
    }
}

async function markCargaisonArrived(id) {
    try {
        await apiCall(`/cargaisons/${id}/arrive`, { method: 'POST' });
        showNotification('Cargaison marquée comme arrivée', 'success');
        loadCargaisons();
    } catch (error) {
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

// Gestion des statistiques
async function loadStatistiques() {
    try {
        showLoading('stats-grid');
        const response = await apiCall('/statistiques');
        
        // Vérifier si la réponse contient une erreur
        if (response && response.error) {
            console.error('Erreur API statistiques:', response.error);
            displayError('stats-grid', 'Erreur lors du chargement des statistiques: ' + response.error);
            return;
        }
        
        // Vérifier si on a des données valides
        if (!response || typeof response !== 'object') {
            console.error('Données statistiques invalides:', response);
            displayError('stats-grid', 'Données statistiques invalides');
            return;
        }
        
        displayStatistiques(response);
        createCharts(response);
    } catch (error) {
        console.error('Erreur loadStatistiques:', error);
        displayError('stats-grid', 'Erreur lors du chargement des statistiques');
    }
}

function displayStatistiques(stats) {
    const container = $('stats-grid');
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.totalCargaisons}</div>
            <div class="stat-label">Total Cargaisons</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.cargaisonsOuvertes}</div>
            <div class="stat-label">Cargaisons Ouvertes</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totalColis}</div>
            <div class="stat-label">Total Colis</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.colisEnCours}</div>
            <div class="stat-label">Colis en Transit</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.colisArrivees}</div>
            <div class="stat-label">Colis Arrivés</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${(stats.revenuTotal / 1000000).toFixed(1)}M</div>
            <div class="stat-label">Revenus (FCFA)</div>
        </div>
    `;
}

// Graphiques
function createCharts(stats) {
    // Graphique des types de transport
    const transportCtx = $('transport-chart')?.getContext('2d');
    if (transportCtx && typeof Chart !== 'undefined') {
        new Chart(transportCtx, {
            type: 'doughnut',
            data: {
                labels: ['Maritime', 'Aérienne', 'Routière'],
                datasets: [{
                    data: [
                        stats.transportMaritime || 0,
                        stats.transportAerien || 0,
                        stats.transportRoutier || 0
                    ],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Graphique des états des colis
    const colisCtx = $('colis-chart')?.getContext('2d');
    if (colisCtx && typeof Chart !== 'undefined') {
        new Chart(colisCtx, {
            type: 'bar',
            data: {
                labels: ['En attente', 'En cours', 'Arrivés', 'Récupérés', 'Perdus'],
                datasets: [{
                    label: 'Nombre de colis',
                    data: [
                        stats.colisEnAttente,
                        stats.colisEnCours,
                        stats.colisArrivees,
                        stats.colisRecuperes,
                        stats.colisPerdus
                    ],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#059669', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Gestion des cargaisons disponibles
async function loadCargaisonsDisponibles(typeCargaison) {
    const cargaisonSelect = $('colis-cargaison');
    const cargaisonInfo = $('cargaison-info');
    const cargaisonList = $('cargaison-list');
    
    if (!typeCargaison) {
        cargaisonSelect.innerHTML = '<option value="">-- Veuillez sélectionner une cargaison --</option>';
        cargaisonInfo.style.display = 'none';
        return;
    }

    try {
        const cargaisons = await apiCall(`/cargaisons/disponibles?type=${typeCargaison}`);
        
        // Réinitialiser les options
        cargaisonSelect.innerHTML = '<option value="">-- Veuillez sélectionner une cargaison --</option>';
        
        if (cargaisons.length === 0) {
            cargaisonInfo.style.display = 'block';
            cargaisonList.innerHTML = '<p style="color: #dc3545; margin: 0;">Aucune cargaison disponible pour ce type de transport. Créez d\'abord une cargaison ouverte.</p>';
            return;
        }

        cargaisons.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `${c.numero} - ${c.trajet.depart.lieu} → ${c.trajet.arrivee.lieu} (${c.poidsRestant}kg restant)`;
            cargaisonSelect.appendChild(option);
        });

        // Afficher les informations des cargaisons
        cargaisonInfo.style.display = 'block';
        cargaisonList.innerHTML = cargaisons.map(c => `
            <div style="border: 1px solid #dee2e6; padding: 10px; margin: 5px 0; border-radius: 4px; background: white;">
                <strong>${c.numero}</strong> - ${c.type.toUpperCase()}<br>
                <small>Trajet: ${c.trajet.depart.lieu} → ${c.trajet.arrivee.lieu} (${c.distance}km)</small><br>
                <small>Capacité: ${c.poidsUtilise}/${c.poidsMax}kg (${c.poidsRestant}kg restant) • ${c.nbColis} colis</small>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erreur lors du chargement des cargaisons:', error);
        cargaisonInfo.style.display = 'block';
        cargaisonList.innerHTML = '<p style="color: #dc3545; margin: 0;">Erreur lors du chargement des cargaisons</p>';
    }
}

function updateCargaisonOptions() {
    const typeProduit = $('colis-type-produit').value;
    const typeCargaisonSelect = $('colis-type-cargaison');
    
    // Réinitialiser les options
    Array.from(typeCargaisonSelect.options).forEach(option => {
        option.disabled = false;
    });

    if (typeProduit === 'chimique') {
        // Désactiver routière et aérienne pour les produits chimiques
        Array.from(typeCargaisonSelect.options).forEach(option => {
            if (option.value === 'routiere' || option.value === 'aerienne') {
                option.disabled = true;
            }
        });
        // Auto-sélectionner maritime
        typeCargaisonSelect.value = 'maritime';
        loadCargaisonsDisponibles('maritime');
    }
}

// Gestion des colis et recherche
async function createColis(formData) {
    try {
        const data = await apiCall('/colis', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showNotification('Colis enregistré avec succès', 'success');
        showReceiptModal(data.recu);
        return data;
    } catch (error) {
        showNotification('Erreur lors de l\'enregistrement du colis', 'error');
        throw error;
    }
}

async function searchColis(code) {
    try {
        const result = await apiCall(`/colis/search?code=${encodeURIComponent(code)}`);
        displayColisSearchResult(result);
    } catch (error) {
        displayError('resultat-colis', 'Erreur lors de la recherche');
    }
}

function displayColisSearchResult(result) {
    const container = $('resultat-colis');
    
    if (!result) {
        container.innerHTML = '<p class="text-center text-secondary">Aucun colis trouvé</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="result-item">
            <div class="result-header">
                <div class="result-title">Colis ${result.id}</div>
                <div class="badge ${getStatusBadgeClass(result.etat)}">
                    ${formatStatus(result.etat)}
                </div>
            </div>
            <div class="result-details">
                <div class="result-detail">
                    <strong>Expéditeur</strong>
                    <span>${result.expediteur.prenom} ${result.expediteur.nom}</span>
                </div>
                <div class="result-detail">
                    <strong>Destinataire</strong>
                    <span>${result.destinataire.nomComplet}</span>
                </div>
                <div class="result-detail">
                    <strong>Poids</strong>
                    <span>${result.poids} kg</span>
                </div>
                <div class="result-detail">
                    <strong>Type</strong>
                    <span>${result.typeProduit}</span>
                </div>
                <div class="result-detail">
                    <strong>Transport</strong>
                    <span>${formatTransportType(result.typeCargaison)}</span>
                </div>
                <div class="result-detail">
                    <strong>Prix</strong>
                    <span>${result.prixFinal.toLocaleString()} FCFA</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="generateReceipt('${result.id}')">
                    <i class="fas fa-receipt"></i> Reçu
                </button>
                ${result.etat === 'ARRIVE' ? `
                    <button class="btn btn-success" onclick="markColisRecupere('${result.id}')">
                        <i class="fas fa-check"></i> Marquer récupéré
                    </button>
                ` : ''}
                <button class="btn btn-danger" onclick="markColisPerdu('${result.id}')">
                    <i class="fas fa-exclamation-triangle"></i> Marquer perdu
                </button>
            </div>
        </div>
    `;
}

async function generateReceipt(id) {
    try {
        const result = await apiCall(`/colis/${id}/recu`);
        showReceiptModal(result.recu);
    } catch (error) {
        showNotification('Erreur lors de la génération du reçu', 'error');
    }
}

async function markColisRecupere(id) {
    try {
        await apiCall(`/colis/${id}/recupere`, { method: 'POST' });
        showNotification('Colis marqué comme récupéré', 'success');
        // Recharger la recherche si on est dans la recherche
        if (currentSearchTab === 'colis-search') {
            const code = $('search-code-colis').value;
            if (code) await searchColis(code);
        }
    } catch (error) {
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

async function markColisPerdu(id) {
    if (!confirm('Êtes-vous sûr de vouloir marquer ce colis comme perdu ?')) return;
    
    try {
        await apiCall(`/colis/${id}/perdu`, { method: 'POST' });
        showNotification('Colis marqué comme perdu', 'warning');
        // Recharger la recherche si on est dans la recherche
        if (currentSearchTab === 'colis-search') {
            const code = $('search-code-colis').value;
            if (code) await searchColis(code);
        }
    } catch (error) {
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

function showReceiptModal(receiptContent) {
    const modalBody = $('modal-body');
    
    modalBody.innerHTML = `
        <h3><i class="fas fa-receipt"></i> Reçu d'expédition</h3>
        <pre style="white-space: pre-wrap; font-family: monospace; background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">${receiptContent}</pre>
        <div class="text-center">
            <button class="btn btn-primary" onclick="printReceipt()">
                <i class="fas fa-print"></i> Imprimer
            </button>
            <button class="btn btn-secondary" onclick="closeModal()">
                <i class="fas fa-times"></i> Fermer
            </button>
        </div>
    `;
    
    $('modal').style.display = 'block';
}

function printReceipt() {
    window.print();
}

// Utilitaires (reprendre les fonctions de app.js)
function showLoading(containerId) {
    const container = $(containerId);
    if (container) {
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
}

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
    
    setTimeout(() => notification.remove(), 5000);
    
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

function formatTransportType(type) {
    const types = {
        maritime: 'Maritime',
        aerienne: 'Aérienne', 
        routiere: 'Routière'
    };
    return types[type] || type;
}

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

function closeModal() {
    // Fermer le modal principal
    const modal = $('modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Nettoyer le contenu du modal
    const modalBody = $('modal-body');
    if (modalBody) {
        modalBody.innerHTML = '';
    }
}

// Fonction de sécurité pour closeMapModal au cas où map-functions.js ne serait pas chargé
function safeCloseMapModal() {
    if (typeof closeMapModal === 'function') {
        closeMapModal();
    } else {
        console.warn('closeMapModal function not found');
        const mapModal = $('map-modal');
        if (mapModal) {
            mapModal.style.display = 'none';
        }
    }
}

// Configuration des gestionnaires de fermeture pour tous les modals
function setupModalCloseHandlers() {
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
            safeCloseMapModal();
        }
        
        // Boutons avec onclick="closeModal()"
        if (e.target.matches('button[onclick*="closeModal"]')) {
            e.preventDefault();
            closeModal();
        }
        
        // Boutons avec onclick="closeMapModal()"
        if (e.target.matches('button[onclick*="closeMapModal"]')) {
            e.preventDefault();
            safeCloseMapModal();
        }
    });
    
    // Fermeture avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = $('modal');
            const mapModal = $('map-modal');
            
            if (modal && modal.style.display === 'block') {
                closeModal();
            }
            if (mapModal && mapModal.style.display === 'block') {
                safeCloseMapModal();
            }
        }
    });
}

// Gestion des formulaires
function initForms() {
    // Formulaire nouvelle cargaison
    $('form-nouvelle-cargaison')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const departLat = $('lieu-depart-lat').value;
        const departLng = $('lieu-depart-lng').value;
        const arriveeLat = $('lieu-arrivee-lat').value;
        const arriveeLng = $('lieu-arrivee-lng').value;
        
        if (!departLat || !departLng || !arriveeLat || !arriveeLng) {
            showNotification('Veuillez sélectionner les lieux de départ et d\'arrivée sur la carte', 'warning');
            return;
        }
        
        const formData = {
            type: $('type-cargaison').value,
            lieuDepart: $('lieu-depart-display').value,
            lieuArrivee: $('lieu-arrivee-display').value,
            poidsMax: parseInt($('poids-max').value),
            coordonneesDepart: {
                latitude: parseFloat(departLat),
                longitude: parseFloat(departLng)
            },
            coordonneesArrivee: {
                latitude: parseFloat(arriveeLat),
                longitude: parseFloat(arriveeLng)
            }
        };
        
        try {
            await createCargaison(formData);
            e.target.reset();
            // Réinitialiser les champs cachés
            $('lieu-depart-display').value = '';
            $('lieu-arrivee-display').value = '';
            $('lieu-depart-lat').value = '';
            $('lieu-depart-lng').value = '';
            $('lieu-arrivee-lat').value = '';
            $('lieu-arrivee-lng').value = '';
        } catch (error) {
            console.error('Erreur création cargaison:', error);
        }
    });
    
    // Formulaire nouveau colis
    $('form-nouveau-colis')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            expediteur: {
                prenom: $('exp-prenom').value,
                nom: $('exp-nom').value,
                telephone: $('exp-telephone').value,
                email: $('exp-email').value,
                adresse: $('exp-adresse').value
            },
            destinataire: {
                nomComplet: $('dest-nom').value,
                telephone: $('dest-telephone').value,
                adresse: $('dest-adresse').value
            },
            poids: parseFloat($('colis-poids').value),
            typeProduit: $('colis-type-produit').value,
            typeCargaison: $('colis-type-cargaison').value,
            nombreColis: parseInt($('colis-nombre').value),
            cargaisonId: $('colis-cargaison').value
        };
        
        // Vérification côté client que la cargaison est sélectionnée
        if (!formData.cargaisonId) {
            showNotification('Veuillez obligatoirement sélectionner une cargaison', 'error');
            return;
        }
        
        try {
            await createColis(formData);
            e.target.reset();
            // Réinitialiser l'affichage des cargaisons
            $('cargaison-info').style.display = 'none';
        } catch (error) {
            console.error('Erreur création colis:', error);
        }
    });
    
    // Formulaire recherche colis
    $('form-recherche-colis')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = $('search-code-colis').value;
        if (code) {
            await searchColis(code);
        }
    });
    
    // Boutons de sélection de lieu
    // Les event listeners sont maintenant gérés directement dans le HTML
    
    // Event listeners pour la sélection de cargaison
    $('colis-type-produit')?.addEventListener('change', updateCargaisonOptions);
    $('colis-type-cargaison')?.addEventListener('change', (e) => {
        loadCargaisonsDisponibles(e.target.value);
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initNavigation();
    initForms();
    
    // Gestion de la fermeture de tous les modals
    setupModalCloseHandlers();
    
    // Fermeture en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        const modal = $('modal');
        const mapModal = $('map-modal');
        
        if (e.target === modal) {
            closeModal();
        }
        if (e.target === mapModal) {
            safeCloseMapModal();
        }
    });
    
    // Affichage initial
    showSection('cargaisons');
    
    console.log('Interface d\'administration TransCargo initialisée');
});
