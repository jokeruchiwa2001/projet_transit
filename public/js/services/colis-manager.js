// Gestionnaire des fonctionnalités de gestion des colis pour les admins

class ColisManager {
    constructor() {
        this.currentColisCode = null;
        this.currentColis = null;
        this.initEventListeners();
    }

    initEventListeners() {
        // Gestionnaire pour le formulaire de gestion
        const formGestion = document.getElementById('form-gestion-colis');
        if (formGestion) {
            formGestion.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Gestionnaire pour le formulaire de changement d'état
        const formChangeEtat = document.getElementById('form-change-etat');
        if (formChangeEtat) {
            formChangeEtat.addEventListener('submit', this.changerEtat.bind(this));
        }

        // Gestionnaire pour la recherche de colis
        const formRechercheColis = document.getElementById('form-recherche-colis');
        if (formRechercheColis) {
            formRechercheColis.addEventListener('submit', this.handleRechercheColisSubmit.bind(this));
        }

        // Gestionnaire pour la recherche de cargaisons
        const formRechercheCargaison = document.getElementById('form-recherche-cargaison');
        if (formRechercheCargaison) {
            formRechercheCargaison.addEventListener('submit', this.handleRechercheCargaisonSubmit.bind(this));
        }

        // Gestionnaires pour les onglets de recherche
        this.initSearchTabs();
    }

    initSearchTabs() {
        const tabButtons = document.querySelectorAll('.search-tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-search-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Désactiver tous les onglets
        document.querySelectorAll('.search-tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.search-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activer l'onglet sélectionné
        document.querySelector(`[data-search-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const codeInput = document.getElementById('gestion-code-colis');
        const code = codeInput.value.trim();

        if (!code) {
            showNotification('Veuillez saisir un code de colis', 'error');
            return;
        }

        this.currentColisCode = code;
        await this.rechercherColis(code);
    }

    async rechercherColis(code) {
        try {
            const response = await jsonServerApi.rechercherColis(code);
            
            if (response) {
                this.currentColis = response;
                this.afficherResultatGestion(response);
                showNotification('Colis trouvé', 'success');
            } else {
                this.currentColis = null;
                document.getElementById('resultat-gestion').innerHTML = 
                    '<div class="no-result"><i class="fas fa-exclamation-circle"></i> Aucun colis trouvé avec ce code</div>';
                showNotification('Aucun colis trouvé', 'error');
            }
        } catch (error) {
            console.error('Erreur recherche colis:', error);
            showNotification('Erreur lors de la recherche', 'error');
        }
    }

    afficherResultatGestion(colis) {
        const container = document.getElementById('resultat-gestion');
        
        const html = `
            <div class="colis-details card">
                <div class="colis-header">
                    <h4><i class="fas fa-box"></i> Détails du colis</h4>
                    <div class="colis-status">
                        <span class="badge badge-${this.getBadgeClass(colis.etat)}">${colis.etat}</span>
                    </div>
                </div>
                
                <div class="colis-info">
                    <div class="info-row">
                        <span class="label">Code :</span>
                        <span class="value">${colis.id}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Code destinataire :</span>
                        <span class="value">${colis.codeDestinataire}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Expéditeur :</span>
                        <span class="value">${colis.expediteur.prenom} ${colis.expediteur.nom}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Destinataire :</span>
                        <span class="value">${colis.destinataire.nomComplet}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Type :</span>
                        <span class="value">${colis.typeProduit}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Poids :</span>
                        <span class="value">${colis.poids} kg</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Nombre :</span>
                        <span class="value">${colis.nombreColis}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Prix :</span>
                        <span class="value">${colis.prixFinal?.toLocaleString()} FCFA</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date création :</span>
                        <span class="value">${new Date(colis.dateCreation).toLocaleDateString()}</span>
                    </div>
                    ${colis.dateArrivee ? `
                        <div class="info-row">
                            <span class="label">Date arrivée :</span>
                            <span class="value">${new Date(colis.dateArrivee).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="colis-actions">
                    <p><i class="fas fa-info-circle"></i> Utilisez les boutons d'action ci-dessus pour gérer ce colis</p>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    getBadgeClass(etat) {
        const classes = {
            'EN_ATTENTE': 'warning',
            'EN_COURS': 'info',
            'ARRIVE': 'success',
            'RECUPERE': 'primary',
            'PERDU': 'danger',
            'ARCHIVE': 'secondary'
        };
        return classes[etat] || 'secondary';
    }

    async recupererColis() {
        if (!this.validateCurrentColis()) return;
        
        if (this.currentColis.etat !== 'ARRIVE') {
            showNotification('Le colis doit être arrivé pour être récupéré', 'error');
            return;
        }

        try {
            await jsonServerApi.recupererColis(this.currentColis.id);
            
            showNotification('Colis marqué comme récupéré', 'success');
            await this.rechercherColis(this.currentColisCode);
        } catch (error) {
            console.error('Erreur récupération colis:', error);
            showNotification('Erreur lors de la récupération', 'error');
        }
    }

    async marquerPerdu() {
        if (!this.validateCurrentColis()) return;
        
        if (this.currentColis.etat === 'RECUPERE') {
            showNotification('Impossible de marquer comme perdu un colis déjà récupéré', 'error');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir marquer ce colis comme perdu ?')) {
            try {
                await jsonServerApi.marquerColisPerdu(this.currentColis.id);
                
                showNotification('Colis marqué comme perdu', 'success');
                await this.rechercherColis(this.currentColisCode);
            } catch (error) {
                console.error('Erreur marquage perdu:', error);
                showNotification('Erreur lors du marquage', 'error');
            }
        }
    }

    async archiverColis() {
        if (!this.validateCurrentColis()) return;
        
        if (this.currentColis.etat !== 'ARRIVE' && this.currentColis.etat !== 'RECUPERE') {
            showNotification('Seuls les colis arrivés ou récupérés peuvent être archivés', 'error');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir archiver ce colis ?')) {
            try {
                // Simulation de l'archivage (changement d'état vers ARCHIVE)
                await this.changerEtatColis('ARCHIVE', 'Archivé manuellement');
                showNotification('Colis archivé avec succès', 'success');
            } catch (error) {
                console.error('Erreur archivage:', error);
                showNotification('Erreur lors de l\'archivage', 'error');
            }
        }
    }

    afficherModalEtat() {
        if (!this.validateCurrentColis()) return;
        
        // Pré-sélectionner l'état actuel
        const selectEtat = document.getElementById('nouvel-etat');
        selectEtat.value = this.currentColis.etat;
        
        // Afficher le modal
        const modal = document.getElementById('modal-change-etat');
        modal.style.display = 'block';
    }

    fermerModalEtat() {
        const modal = document.getElementById('modal-change-etat');
        modal.style.display = 'none';
        
        // Réinitialiser le formulaire
        document.getElementById('form-change-etat').reset();
    }

    async changerEtat(e) {
        e.preventDefault();
        
        const nouvelEtat = document.getElementById('nouvel-etat').value;
        const commentaire = document.getElementById('commentaire-etat').value;
        
        if (!nouvelEtat) {
            showNotification('Veuillez sélectionner un état', 'error');
            return;
        }
        
        await this.changerEtatColis(nouvelEtat, commentaire);
        this.fermerModalEtat();
    }

    async changerEtatColis(nouvelEtat, commentaire) {
        try {
            // Pour l'instant, nous simulons le changement d'état
            // En production, il faudrait une API spécifique
            const endpoint = this.getEndpointForState(nouvelEtat);
            
            if (endpoint) {
                await apiCall(endpoint, {
                    method: 'POST',
                    body: JSON.stringify({ commentaire })
                });
            } else {
                // Changement d'état générique
                showNotification(`État changé vers: ${nouvelEtat}`, 'info');
            }
            
            showNotification(`État du colis changé vers: ${nouvelEtat}`, 'success');
            await this.rechercherColis(this.currentColisCode);
            
        } catch (error) {
            console.error('Erreur changement état:', error);
            showNotification('Erreur lors du changement d\'état', 'error');
        }
    }

    getEndpointForState(etat) {
        const endpoints = {
            'RECUPERE': `/colis/${this.currentColis.id}/recupere`,
            'PERDU': `/colis/${this.currentColis.id}/perdu`
        };
        return endpoints[etat];
    }

    validateCurrentColis() {
        if (!this.currentColis) {
            showNotification('Veuillez d\'abord rechercher un colis', 'error');
            return false;
        }
        return true;
    }

    // Gestionnaires pour la recherche de colis
    async handleRechercheColisSubmit(e) {
        e.preventDefault();
        const code = document.getElementById('search-code-colis').value.trim();
        
        if (!code) {
            showNotification('Veuillez saisir un code de colis', 'error');
            return;
        }

        try {
            const response = await jsonServerApi.rechercherColis(code);
            this.afficherResultatRechercheColis(response);
        } catch (error) {
            console.error('Erreur recherche colis:', error);
            showNotification('Erreur lors de la recherche', 'error');
        }
    }

    afficherResultatRechercheColis(colis) {
        const container = document.getElementById('resultat-colis');
        
        if (!colis) {
            container.innerHTML = '<div class="no-result"><i class="fas fa-exclamation-circle"></i> Aucun colis trouvé avec ce code</div>';
            return;
        }

        const html = `
            <div class="search-result card">
                <div class="result-header">
                    <h4><i class="fas fa-box"></i> Colis trouvé</h4>
                    <span class="badge badge-${this.getBadgeClass(colis.etat)}">${colis.etat}</span>
                </div>
                <div class="result-info">
                    <div class="info-row">
                        <span class="label">Code :</span>
                        <span class="value">${colis.id}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Code destinataire :</span>
                        <span class="value">${colis.codeDestinataire}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Expéditeur :</span>
                        <span class="value">${colis.expediteur.prenom} ${colis.expediteur.nom}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Destinataire :</span>
                        <span class="value">${colis.destinataire.nomComplet}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Type :</span>
                        <span class="value">${colis.typeProduit}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Poids :</span>
                        <span class="value">${colis.poids} kg</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    // Gestionnaires pour la recherche de cargaisons
    async handleRechercheCargaisonSubmit(e) {
        e.preventDefault();
        
        const params = new URLSearchParams();
        const fields = ['search-code-cargaison', 'search-type', 'search-lieu-depart', 'search-lieu-arrivee', 'search-date-depart', 'search-date-arrivee'];
        const paramNames = ['code', 'type', 'lieuDepart', 'lieuArrivee', 'dateDepart', 'dateArrivee'];
        
        fields.forEach((fieldId, index) => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim()) {
                params.append(paramNames[index], field.value.trim());
            }
        });

        try {
            // Convertir les params en objet de critères
            const criteria = {};
            for (const [key, value] of params.entries()) {
                criteria[key] = value;
            }
            
            const response = await jsonServerApi.rechercherCargaisons(criteria);
            this.afficherResultatRechercheCargaison(response);
        } catch (error) {
            console.error('Erreur recherche cargaisons:', error);
            showNotification('Erreur lors de la recherche', 'error');
        }
    }

    afficherResultatRechercheCargaison(cargaisons) {
        const container = document.getElementById('resultat-cargaison');
        
        if (!cargaisons || cargaisons.length === 0) {
            container.innerHTML = '<div class="no-result"><i class="fas fa-exclamation-circle"></i> Aucune cargaison trouvée avec ces critères</div>';
            return;
        }

        const html = cargaisons.map(cargaison => `
            <div class="search-result card">
                <div class="result-header">
                    <h4><i class="fas fa-ship"></i> ${cargaison.numero}</h4>
                    <div>
                        <span class="badge badge-${this.getTypeBadgeClass(cargaison.type)}">${cargaison.type}</span>
                        <span class="badge badge-${this.getBadgeClass(cargaison.etatAvancement)}">${cargaison.etatAvancement}</span>
                    </div>
                </div>
                <div class="result-info">
                    <div class="info-row">
                        <span class="label">Trajet :</span>
                        <span class="value">${cargaison.trajet?.depart?.lieu || 'N/A'} → ${cargaison.trajet?.arrivee?.lieu || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Distance :</span>
                        <span class="value">${cargaison.distance} km</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Poids max :</span>
                        <span class="value">${cargaison.poidsMax} kg</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date création :</span>
                        <span class="value">${new Date(cargaison.dateCreation).toLocaleDateString()}</span>
                    </div>
                    ${cargaison.dateDepart ? `
                        <div class="info-row">
                            <span class="label">Date départ :</span>
                            <span class="value">${new Date(cargaison.dateDepart).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                    ${cargaison.dateArriveeReelle ? `
                        <div class="info-row">
                            <span class="label">Date arrivée :</span>
                            <span class="value">${new Date(cargaison.dateArriveeReelle).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="result-actions">
                    <button class="btn btn-info" onclick="cargaisonManager.viewDetails('${cargaison.id}')">
                        <i class="fas fa-eye"></i> Voir détails
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `<div class="search-results-grid">${html}</div>`;
    }

    getTypeBadgeClass(type) {
        const classes = {
            'maritime': 'primary',
            'aerienne': 'info',
            'routiere': 'warning'
        };
        return classes[type] || 'secondary';
    }
}

// Export et initialisation globale
window.ColisManager = ColisManager;
window.colisManager = new ColisManager();
