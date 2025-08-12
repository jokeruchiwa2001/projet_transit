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
            showSection(section);
        });
    });
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

// Gestion des onglets
function initTabs() {
    $$('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            showTab(tab);
        });
    });
    
    $$('.search-tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.searchTab;
            showSearchTab(tab);
        });
    });
}

function showTab(tabName) {
    $$('.tab-button').forEach(btn => btn.classList.remove('active'));
    $$('.tab-content').forEach(content => content.classList.remove('active'));
    
    $$(`[data-tab="${tabName}"]`).forEach(btn => btn.classList.add('active'));
    $(tabName)?.classList.add('active');
    
    currentTab = tabName;
}

function showSearchTab(tabName) {
    $$('.search-tab-button').forEach(btn => btn.classList.remove('active'));
    $$('.search-tab-content').forEach(content => content.classList.remove('active'));
    
    $$(`[data-search-tab="${tabName}"]`).forEach(btn => btn.classList.add('active'));
    $(tabName)?.classList.add('active');
    
    currentSearchTab = tabName;
}

// API Calls
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

// Gestion des colis
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

// Recherche
async function searchColis(code) {
    try {
        const result = await apiCall(`/colis/search?code=${encodeURIComponent(code)}`);
        displayColisSearchResult(result);
    } catch (error) {
        displayError('resultat-colis', 'Erreur lors de la recherche');
    }
}

async function searchCargaisons(criteria) {
    try {
        const params = new URLSearchParams();
        Object.entries(criteria).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        
        const results = await apiCall(`/cargaisons/search?${params}`);
        displayCargaisonSearchResults(results);
    } catch (error) {
        displayError('resultat-cargaison', 'Erreur lors de la recherche');
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

// Fonction pour créer une modal personnalisée
function createCustomModal(title, content, buttons = []) {
    // Supprimer toute modal existante
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
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; padding: 2rem; border-radius: 8px;
        max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-height: 80vh; overflow-y: auto;
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

    // Fermer avec Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeCustomModal();
    });

    return modal;
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) modal.remove();
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

// Statistiques
async function loadStatistiques() {
    try {
        showLoading('stats-grid');
        const stats = await apiCall('/statistiques');
        displayStatistiques(stats);
        createCharts(stats);
    } catch (error) {
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

// Gestion des formulaires
function initForms() {
    // Formulaire nouvelle cargaison
    $('form-nouvelle-cargaison')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            type: $('type-cargaison').value,
            lieuDepart: $('lieu-depart').value,
            lieuArrivee: $('lieu-arrivee').value,
            poidsMax: parseInt($('poids-max').value)
        };
        
        try {
            await createCargaison(formData);
            e.target.reset();
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
            nombreColis: parseInt($('colis-nombre').value)
        };
        
        try {
            await createColis(formData);
            e.target.reset();
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
    
    // Formulaire suivi
    $('form-suivi')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = $('code-suivi').value;
        if (code) {
            await trackColis(code);
        }
    });
}

// Fonctions pour les détails des cargaisons
async function viewCargaisonDetails(id) {
  try {
    // Stocker l'ID de la cargaison actuellement affichée
    currentCargaisonId = id;
    
    const cargaisons = await apiCall('/cargaisons');
    const cargaison = cargaisons.find(c => c.id === id);
    if (!cargaison) {
      showNotification('Cargaison non trouvée', 'error');
      return;
    }
    
    const colis = await apiCall(`/cargaisons/${id}/colis`);
    
    // Compter les colis par état
    const colisArrivesOuEnCours = colis ? colis.filter(c => c.etat === 'ARRIVE' || c.etat === 'EN_COURS') : [];
    const colisArrivesCount = colis ? colis.filter(c => c.etat === 'ARRIVE').length : 0;
    
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
        <!-- Actions en lot pour les colis -->
        <div class="bulk-actions" style="margin: 1.5rem 0; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
          <h4 style="margin-bottom: 1rem; color: #495057;">
            <i class="fas fa-tasks"></i> Actions en lot sur les colis
          </h4>
          <div class="btn-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${colisArrivesOuEnCours.length > 0 ? `
              <button class="btn btn-danger" onclick="markAllColisAsLost('${id}')"
                      style="background: #dc3545; border: none; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
                <i class="fas fa-exclamation-triangle"></i>
                Marquer tous comme perdus (${colisArrivesOuEnCours.length})
              </button>
            ` : ''}
            ${colisArrivesCount > 0 ? `
              <button class="btn btn-success" onclick="markAllColisAsRecovered('${id}')"
                      style="background: #28a745; border: none; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
                <i class="fas fa-check-circle"></i>
                Marquer tous comme récupérés (${colisArrivesCount})
              </button>
            ` : ''}
          </div>
          ${colisArrivesOuEnCours.length === 0 ? `
            <p style="color: #6c757d; margin: 0; font-style: italic;">
              <i class="fas fa-info-circle"></i>
              Aucun colis disponible pour les actions en lot
            </p>
          ` : ''}
        </div>
        
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
                <!-- Actions individuelles -->
                <div class="individual-actions" style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                  ${c.etat === 'ARRIVE' ? `
                    <button class="btn btn-sm btn-success" onclick="markColisRecupere('${c.id}')"
                            style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                      <i class="fas fa-check"></i> Récupéré
                    </button>
                  ` : ''}
                  ${(c.etat === 'EN_COURS' || c.etat === 'ARRIVE') ? `
                    <button class="btn btn-sm btn-danger" onclick="markColisPerdu('${c.id}')"
                            style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                      <i class="fas fa-times"></i> Perdu
                    </button>
                  ` : ''}
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

// Actions sur les cargaisons
async function closeCargaison(id) {
    // Utiliser une modal de confirmation personnalisée
    createCustomModal(
        'Confirmation - Fermer cargaison',
        '<div class="text-center"><i class="fas fa-lock fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir fermer cette cargaison ?</strong></p></div>',
        [
            {
                text: 'Confirmer',
                class: 'btn-warning',
                onclick: `closeCustomModal(); doCloseCargaison('${id}')`
            }
        ]
    );
}

async function doCloseCargaison(id) {
    
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

// Actions sur les colis
async function markColisRecupere(id) {
    try {
        await apiCall(`/colis/${id}/recupere`, { method: 'POST' });
        showNotification('Colis marqué comme récupéré', 'success');
    } catch (error) {
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

async function markColisPerdu(id) {
    // Utiliser une modal de confirmation personnalisée
    createCustomModal(
        'Confirmation - Marquer comme perdu',
        '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir marquer ce colis comme perdu ?</strong></p></div>',
        [
            {
                text: 'Confirmer',
                class: 'btn-danger',
                onclick: `closeCustomModal(); doMarkColisPerdu('${id}')`
            }
        ]
    );
}

async function doMarkColisPerdu(id) {
    
    try {
        await apiCall(`/colis/${id}/perdu`, { method: 'POST' });
        showNotification('Colis marqué comme perdu', 'warning');
        // Recharger les détails de la cargaison pour mettre à jour l'affichage
        const cargaisonId = getCurrentCargaisonId();
        if (cargaisonId) {
            setTimeout(() => viewCargaisonDetails(cargaisonId), 1000);
        }
    } catch (error) {
        showNotification('Erreur lors de la mise à jour', 'error');
    }
}

// Fonctions pour les actions en lot sur les colis
async function markAllColisAsLost(cargaisonId) {
    // Utiliser une modal de confirmation personnalisée
    createCustomModal(
        'Confirmation - Marquer tous comme perdus',
        '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir marquer TOUS les colis éligibles comme perdus ?</strong></p><p class="text-danger">Cette action ne peut pas être annulée.</p></div>',
        [
            {
                text: 'Confirmer',
                class: 'btn-danger',
                onclick: `closeCustomModal(); doMarkAllColisAsLost('${cargaisonId}')`
            }
        ]
    );
}

async function doMarkAllColisAsLost(cargaisonId) {
    
    try {
        showNotification('Traitement en cours...', 'info');
        
        // Récupérer les colis de la cargaison
        const response = await apiCall(`/cargaisons/${cargaisonId}/colis`);
        const colis = response || [];
        
        // Filtrer les colis éligibles (EN_COURS ou ARRIVE)
        const colisEligibles = colis.filter(c => c.etat === 'EN_COURS' || c.etat === 'ARRIVE');
        
        if (colisEligibles.length === 0) {
            showNotification('Aucun colis éligible trouvé', 'warning');
            return;
        }
        
        // Marquer chaque colis comme perdu
        let successCount = 0;
        let errorCount = 0;
        
        for (const c of colisEligibles) {
            try {
                await apiCall(`/colis/${c.id}/perdu`, { method: 'POST' });
                successCount++;
            } catch (error) {
                console.error(`Erreur pour le colis ${c.id}:`, error);
                errorCount++;
            }
        }
        
        // Afficher le résultat
        if (successCount > 0) {
            showNotification(
                `${successCount} colis marqués comme perdus${errorCount > 0 ? ` (${errorCount} échecs)` : ''}`,
                errorCount > 0 ? 'warning' : 'success'
            );
        } else {
            showNotification('Aucun colis n\'a pu être mis à jour', 'error');
        }
        
        // Recharger les détails
        setTimeout(() => viewCargaisonDetails(cargaisonId), 1500);
        
    } catch (error) {
        console.error('Erreur lors du traitement en lot:', error);
        showNotification('Erreur lors du traitement en lot', 'error');
    }
}

async function markAllColisAsRecovered(cargaisonId) {
    // Utiliser une modal de confirmation personnalisée
    createCustomModal(
        'Confirmation - Marquer tous comme récupérés',
        '<div class="text-center"><i class="fas fa-check-circle fa-2x text-success mb-3"></i><p><strong>Êtes-vous sûr de vouloir marquer TOUS les colis arrivés comme récupérés ?</strong></p></div>',
        [
            {
                text: 'Confirmer',
                class: 'btn-success',
                onclick: `closeCustomModal(); doMarkAllColisAsRecovered('${cargaisonId}')`
            }
        ]
    );
}

async function doMarkAllColisAsRecovered(cargaisonId) {
    
    try {
        showNotification('Traitement en cours...', 'info');
        
        // Récupérer les colis de la cargaison
        const response = await apiCall(`/cargaisons/${cargaisonId}/colis`);
        const colis = response || [];
        
        // Filtrer les colis arrivés
        const colisArrives = colis.filter(c => c.etat === 'ARRIVE');
        
        if (colisArrives.length === 0) {
            showNotification('Aucun colis arrivé trouvé', 'warning');
            return;
        }
        
        // Marquer chaque colis comme récupéré
        let successCount = 0;
        let errorCount = 0;
        
        for (const c of colisArrives) {
            try {
                await apiCall(`/colis/${c.id}/recupere`, { method: 'POST' });
                successCount++;
            } catch (error) {
                console.error(`Erreur pour le colis ${c.id}:`, error);
                errorCount++;
            }
        }
        
        // Afficher le résultat
        if (successCount > 0) {
            showNotification(
                `${successCount} colis marqués comme récupérés${errorCount > 0 ? ` (${errorCount} échecs)` : ''}`,
                errorCount > 0 ? 'warning' : 'success'
            );
        } else {
            showNotification('Aucun colis n\'a pu être mis à jour', 'error');
        }
        
        // Recharger les détails
        setTimeout(() => viewCargaisonDetails(cargaisonId), 1500);
        
    } catch (error) {
        console.error('Erreur lors du traitement en lot:', error);
        showNotification('Erreur lors du traitement en lot', 'error');
    }
}

// Fonction utilitaire pour obtenir l'ID de la cargaison actuellement affichée
function getCurrentCargaisonId() {
    // Essayer de récupérer l'ID depuis le titre du modal
    const modalBody = $('modal-body');
    if (modalBody) {
        const titleElement = modalBody.querySelector('h3');
        if (titleElement) {
            const titleText = titleElement.textContent;
            const match = titleText.match(/CG-[A-Z0-9]+/);
            if (match) {
                // Chercher la cargaison correspondante
                // Cette fonction pourrait être améliorée selon votre structure de données
                return match[0];
            }
        }
    }
    return null;
}

async function generateReceipt(id) {
    try {
        const result = await apiCall(`/colis/${id}/recu`);
        showReceiptModal(result.recu);
    } catch (error) {
        showNotification('Erreur lors de la génération du reçu', 'error');
    }
}

// Utilitaires d'affichage
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

function showReceiptModal(receiptContent) {
    const modal = $('modal');
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
    
    modal.style.display = 'block';
}

function closeModal() {
    $('modal').style.display = 'none';
}

function printReceipt() {
    window.print();
}

// Formateurs
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

// Graphiques
function createCharts(stats) {
    // Graphique des types de transport
    const transportCtx = $('transport-chart')?.getContext('2d');
    if (transportCtx) {
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
    if (colisCtx) {
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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTabs();
    initForms();
    
    // Gestion de la fermeture du modal
    $('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        const modal = $('modal');
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Affichage initial
    showSection('accueil');
    
    console.log('Application TransCargo initialisée');
});
