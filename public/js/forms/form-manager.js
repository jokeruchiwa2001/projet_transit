// Gestionnaire de formulaires TransCargo
// Responsabilité : Initialiser et gérer tous les formulaires de l'application

class FormManager {
    constructor() {
        this.initialized = false;
    }

    // Initialiser tous les formulaires
    init() {
        if (this.initialized) return;

        console.log('📝 Initialisation des formulaires...');
        
        this.initCargaisonForm();
        this.initColisForm();
        this.initSearchForm();
        this.initSelectHandlers();
        
        this.initialized = true;
        console.log('✅ Formulaires initialisés');
    }

    // Initialiser le formulaire de cargaison
    initCargaisonForm() {
        const formCargaison = TransCargoUtils.$('form-nouvelle-cargaison');
        if (formCargaison) {
            formCargaison.addEventListener('submit', this.handleCargaisonSubmit.bind(this));
        }
    }

    // Initialiser le formulaire de colis
    initColisForm() {
        const formColis = TransCargoUtils.$('form-nouveau-colis');
        if (formColis) {
            formColis.addEventListener('submit', this.handleColisSubmit.bind(this));
        }
    }

    // Initialiser le formulaire de recherche
    initSearchForm() {
        const formRechercheColis = TransCargoUtils.$('form-recherche-colis');
        if (formRechercheColis) {
            formRechercheColis.addEventListener('submit', this.handleColisSearch.bind(this));
        }
    }

    // Initialiser les gestionnaires de sélection
    initSelectHandlers() {
        // Event listeners pour la sélection de cargaison
        const typeProduit = TransCargoUtils.$('colis-type-produit');
        if (typeProduit) {
            typeProduit.addEventListener('change', this.updateCargaisonOptions.bind(this));
        }
        
        const typeCargaison = TransCargoUtils.$('colis-type-cargaison');
        if (typeCargaison) {
            typeCargaison.addEventListener('change', (e) => {
                this.loadCargaisonsDisponibles(e.target.value);
            });
        }
        
        // Event listener pour le sélecteur d'éléments par page
        const itemsPerPage = TransCargoUtils.$('items-per-page');
        if (itemsPerPage) {
            itemsPerPage.addEventListener('change', (e) => {
                cargaisonManager.changeItemsPerPage(e.target.value);
            });
        }
    }

    // Gérer la soumission du formulaire de cargaison
    async handleCargaisonSubmit(e) {
        e.preventDefault();
        
        const departLat = TransCargoUtils.$('lieu-depart-lat').value;
        const departLng = TransCargoUtils.$('lieu-depart-lng').value;
        const arriveeLat = TransCargoUtils.$('lieu-arrivee-lat').value;
        const arriveeLng = TransCargoUtils.$('lieu-arrivee-lng').value;
        
        if (!departLat || !departLng || !arriveeLat || !arriveeLng) {
            showNotification('Veuillez sélectionner les lieux de départ et d\'arrivée sur la carte', 'warning');
            return;
        }
        
        const formData = {
            type: TransCargoUtils.$('type-cargaison').value,
            lieuDepart: TransCargoUtils.$('lieu-depart-display').value,
            lieuArrivee: TransCargoUtils.$('lieu-arrivee-display').value,
            poidsMax: parseInt(TransCargoUtils.$('poids-max').value),
            coordonneesDepart: {
                latitude: parseFloat(departLat),
                longitude: parseFloat(departLng)
            },
            coordonneesArrivee: {
                latitude: parseFloat(arriveeLat),
                longitude: parseFloat(arriveeLng)
            }
        };
        
        // Calculer la distance entre départ et arrivée
        if (typeof calculateDistance === 'function') {
            const distance = calculateDistance(
                parseFloat(departLat), 
                parseFloat(departLng), 
                parseFloat(arriveeLat), 
                parseFloat(arriveeLng)
            );
            formData.distance = distance;
            console.log(`📏 Distance calculée: ${distance} km`);
        } else {
            console.warn('⚠️ Fonction calculateDistance non disponible');
            formData.distance = 1; // Valeur par défaut
        }
        
        try {
            console.log('📋 Formulaire de création de cargaison soumis');
            await cargaisonManager.create(formData);
            this.resetCargaisonForm(e.target);
            
            // Actualiser les cargaisons disponibles pour le nouveau colis
            await this.refreshCargaisonsList();
            
        } catch (error) {
            console.error('❌ Erreur création cargaison:', error);
        }
    }

    // Réinitialiser le formulaire de cargaison
    resetCargaisonForm(form) {
        form.reset();
        
        // Réinitialiser les champs cachés
        ['lieu-depart-display', 'lieu-arrivee-display', 'lieu-depart-lat', 'lieu-depart-lng', 'lieu-arrivee-lat', 'lieu-arrivee-lng'].forEach(id => {
            const element = TransCargoUtils.$(id);
            if (element) element.value = '';
        });
    }

    // Actualiser la liste des cargaisons
    async refreshCargaisonsList() {
        console.log('🔄 Actualisation des listes de cargaisons pour formulaire colis...');
        const typeCargaisonColis = TransCargoUtils.$('colis-type-cargaison')?.value;
        if (typeCargaisonColis) {
            try {
                await this.loadCargaisonsDisponibles(typeCargaisonColis);
                console.log('✅ Listes cargaisons mises à jour');
            } catch (err) {
                console.error('⚠️ Erreur mise à jour liste cargaisons:', err);
            }
        }
    }

    // Gérer la soumission du formulaire de colis
    async handleColisSubmit(e) {
        e.preventDefault();
        
        const submitBtn = TransCargoUtils.$('btn-enregistrer-colis');
        const originalContent = submitBtn.innerHTML;
        
        // Désactiver le bouton et afficher le spinner
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
        
        const formData = this.buildColisFormData();
        
        // Vérification côté client que la cargaison est sélectionnée
        if (!formData.cargaisonId) {
            showNotification('Veuillez obligatoirement sélectionner une cargaison', 'error');
            this.resetSubmitButton(submitBtn, originalContent);
            return;
        }
        
        try {
            await this.submitColisData(formData, e.target, submitBtn, originalContent);
        } catch (error) {
            console.error('Erreur création colis:', error);
            showNotification('Erreur lors de l\'enregistrement du colis', 'error');
        } finally {
            // Réactiver le bouton
            submitBtn.disabled = false;
            if (submitBtn.innerHTML.includes('spinner')) {
                submitBtn.innerHTML = originalContent;
            }
        }
    }

    // Construire les données du formulaire de colis
    buildColisFormData() {
        return {
            expediteur: {
                prenom: TransCargoUtils.$('exp-prenom').value,
                nom: TransCargoUtils.$('exp-nom').value,
                telephone: TransCargoUtils.$('exp-telephone').value,
                email: TransCargoUtils.$('exp-email').value,
                adresse: TransCargoUtils.$('exp-adresse').value
            },
            destinataire: {
                nomComplet: TransCargoUtils.$('dest-nom').value,
                telephone: TransCargoUtils.$('dest-telephone').value,
                email: TransCargoUtils.$('dest-email').value,
                adresse: TransCargoUtils.$('dest-adresse').value
            },
            poids: parseFloat(TransCargoUtils.$('colis-poids').value),
            typeProduit: TransCargoUtils.$('colis-type-produit').value,
            typeCargaison: TransCargoUtils.$('colis-type-cargaison').value,
            nombreColis: parseInt(TransCargoUtils.$('colis-nombre').value),
            cargaisonId: TransCargoUtils.$('colis-cargaison').value
        };
    }

    // Soumettre les données du colis
    async submitColisData(formData, form, submitBtn, originalContent) {
        try {
            // Utiliser directement json-server avec validation côté client
            const cargaison = await jsonServerApi.call(`/cargaisons/${formData.cargaisonId}`);
            
            // Vérifier la capacité
            const colis = await jsonServerApi.getColis();
            const colisExistants = colis.filter(c => c.cargaisonId === formData.cargaisonId);
            const poidsActuel = colisExistants.reduce((total, c) => total + (c.poids || 0), 0);
            const nouveauPoidsTotal = poidsActuel + formData.poids;

            if (nouveauPoidsTotal > cargaison.poidsMax) {
                throw new Error(`Capacité insuffisante! Poids disponible: ${cargaison.poidsMax - poidsActuel}kg, demandé: ${formData.poids}kg`);
            }

            // Ajouter la distance à formData
            formData.distance = cargaison.distance || 1;

            // Créer le colis via json-server
            const response = await jsonServerApi.createColis(formData);
            await this.handleColisSuccess(response, form, formData, submitBtn, originalContent);
            
        } catch (error) {
            this.handleColisError({ error: error.message });
        }
    }

    // Gérer les erreurs de création de colis
    handleColisError(response) {
        showNotification(response.error, 'error');
        
        // Si c'est une erreur de capacité, afficher les détails
        if (response.poidsDisponible !== undefined) {
            const details = `Poids actuel: ${response.poidsActuel}kg / ${response.poidsMax}kg\nPoids disponible: ${response.poidsDisponible}kg`;
            setTimeout(() => {
                showNotification(details, 'warning');
            }, 2000);
        }
    }

    // Gérer le succès de création de colis
    async handleColisSuccess(response, form, formData, submitBtn, originalContent) {
        showNotification('Colis enregistré avec succès', 'success');
        if (response.recu) {
            showReceiptModal(response.recu);
        }
        
        form.reset();
        // Réinitialiser l'affichage des cargaisons
        const cargaisonInfo = TransCargoUtils.$('cargaison-info');
        if (cargaisonInfo) cargaisonInfo.style.display = 'none';
        
        // Actualiser les listes pour refléter les changements de capacité
        await cargaisonManager.load();
        if (formData.typeCargaison) {
            await this.loadCargaisonsDisponibles(formData.typeCargaison);
        }
        
        // Mettre à jour les statistiques
        if (typeof updateDashboardStats === 'function') {
            setTimeout(() => updateDashboardStats(), 500);
        }
        
        // Réactiver le bouton avec succès
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Colis enregistré !';
        
        // Remettre le texte original après 2 secondes
        setTimeout(() => {
            submitBtn.innerHTML = originalContent;
        }, 2000);
    }

    // Réinitialiser le bouton de soumission
    resetSubmitButton(submitBtn, originalContent) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
    }

    // Gérer la recherche de colis
    async handleColisSearch(e) {
        e.preventDefault();
        const code = TransCargoUtils.$('search-code-colis').value;
        if (code) {
            try {
                const result = await apiCall(`/colis/search?code=${encodeURIComponent(code)}`);
                this.displayColisSearchResult(result);
            } catch (error) {
                TransCargoUtils.displayError('resultat-colis', 'Erreur lors de la recherche');
            }
        }
    }

    // Afficher le résultat de recherche de colis
    displayColisSearchResult(result) {
        const container = TransCargoUtils.$('resultat-colis');
        
        if (!result) {
            container.innerHTML = '<p class="text-center text-secondary">Aucun colis trouvé</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="result-item">
                <div class="result-header">
                    <div class="result-title">Colis ${result.id}</div>
                    <div class="badge ${TransCargoUtils.getStatusBadgeClass(result.etat)}">
                        ${TransCargoUtils.formatStatus(result.etat)}
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
                        <span>${TransCargoUtils.formatTransportType(result.typeCargaison)}</span>
                    </div>
                    <div class="result-detail">
                        <strong>Prix</strong>
                        <span>${result.prixFinal.toLocaleString()} FCFA</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="colisActionManager.generateReceipt('${result.id}')">
                        <i class="fas fa-receipt"></i> Reçu
                    </button>
                    ${result.etat === 'ARRIVE' ? `
                        <button class="btn btn-success" onclick="colisActionManager.markColisRecupere('${result.id}')">
                            <i class="fas fa-check"></i> Marquer récupéré
                        </button>
                    ` : ''}
                    <button class="btn btn-danger" onclick="colisActionManager.markColisPerdu('${result.id}')">
                        <i class="fas fa-exclamation-triangle"></i> Marquer perdu
                    </button>
                </div>
            </div>
        `;
    }

    // Charger les cargaisons disponibles
    async loadCargaisonsDisponibles(typeCargaison) {
        const cargaisonSelect = TransCargoUtils.$('colis-cargaison');
        const cargaisonInfo = TransCargoUtils.$('cargaison-info');
        const cargaisonList = TransCargoUtils.$('cargaison-list');
        
        if (!typeCargaison) {
            cargaisonSelect.innerHTML = '<option value="">-- Veuillez sélectionner une cargaison --</option>';
            cargaisonInfo.style.display = 'none';
            return;
        }

        try {
            // Vérifier que jsonServerApi est disponible
            if (!window.jsonServerApi) {
                throw new Error('API json-server non disponible');
            }
            
            const cargaisons = await window.jsonServerApi.getCargaisonsDisponibles(typeCargaison);
            
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

    // Mettre à jour les options de cargaison selon le type de produit
    updateCargaisonOptions() {
        const typeProduit = TransCargoUtils.$('colis-type-produit').value;
        const typeCargaisonSelect = TransCargoUtils.$('colis-type-cargaison');
        
        // Réinitialiser les options
        Array.from(typeCargaisonSelect.options).forEach(option => {
            option.disabled = false;
        });

        if (typeProduit === 'chimique') {
            // Les produits chimiques ne peuvent transiter QUE par voie maritime
            Array.from(typeCargaisonSelect.options).forEach(option => {
                if (option.value === 'routiere' || option.value === 'aerienne') {
                    option.disabled = true;
                }
            });
            // Auto-sélectionner maritime
            typeCargaisonSelect.value = 'maritime';
            this.loadCargaisonsDisponibles('maritime');
        } else if (typeProduit === 'materiel-fragile') {
            // Les produits matériels fragiles ne peuvent JAMAIS passer par voie maritime
            Array.from(typeCargaisonSelect.options).forEach(option => {
                if (option.value === 'maritime') {
                    option.disabled = true;
                }
            });
            // Si maritime était sélectionné, passer en routière par défaut
            if (typeCargaisonSelect.value === 'maritime') {
                typeCargaisonSelect.value = 'routiere';
                this.loadCargaisonsDisponibles('routiere');
            }
        }
    }
}

// Export
window.FormManager = FormManager;