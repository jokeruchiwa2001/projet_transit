// Fichier principal d'administration TransCargo
// Orchestre tous les modules et initialise l'application

class AdminApp {
    constructor() {
        this.initialized = false;
    }

    // Initialiser l'application
    async init() {
        if (this.initialized) return;

        console.log('🚀 Initialisation de l\'interface d\'administration TransCargo...');

        // Vérifier l'authentification
        if (!checkAuth()) {
            console.log('❌ Authentification échouée');
            return;
        }

        try {
            // Initialiser les modules
            this.initModules();
            
            // Initialiser les gestionnaires d'événements
            this.initEventHandlers();
            
            // Affichage initial
            navigationManager.showSection('accueil');
            
            this.initialized = true;
            console.log('✅ Interface d\'administration TransCargo initialisée');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
        }
    }

    // Initialiser les modules
    initModules() {
        console.log('📦 Initialisation des modules...');
        
        // Navigation
        navigationManager.init();
        
        // Formulaires
        this.initForms();
        
        console.log('✅ Modules initialisés');
    }

    // Initialiser les gestionnaires d'événements
    initEventHandlers() {
        console.log('🔗 Initialisation des gestionnaires d\'événements...');
        
        // Gestion de la fermeture de tous les modals
        this.setupModalCloseHandlers();
        
        // Fermeture en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            const modal = TransCargoUtils.$('modal');
            const mapModal = TransCargoUtils.$('map-modal');
            
            if (e.target === modal) {
                closeModal();
            }
            if (e.target === mapModal && typeof closeMapModal === 'function') {
                closeMapModal();
            }
        });
        
        console.log('✅ Gestionnaires d\'événements initialisés');
    }

    // Configuration des gestionnaires de fermeture pour tous les modals
    setupModalCloseHandlers() {
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
                if (typeof closeMapModal === 'function') {
                    closeMapModal();
                }
            }
        });
        
        // Fermeture avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = TransCargoUtils.$('modal');
                const mapModal = TransCargoUtils.$('map-modal');
                
                if (modal && modal.style.display === 'block') {
                    closeModal();
                }
                if (mapModal && (mapModal.style.display === 'flex' || mapModal.classList.contains('show')) && typeof closeMapModal === 'function') {
                    closeMapModal();
                }
            }
        });
    }

    // Initialiser les formulaires
    initForms() {
        console.log('📝 Initialisation des formulaires...');
        
        // Formulaire nouvelle cargaison
        const formCargaison = TransCargoUtils.$('form-nouvelle-cargaison');
        if (formCargaison) {
            formCargaison.addEventListener('submit', this.handleCargaisonSubmit.bind(this));
        }
        
        // Formulaire nouveau colis
        const formColis = TransCargoUtils.$('form-nouveau-colis');
        if (formColis) {
            formColis.addEventListener('submit', this.handleColisSubmit.bind(this));
        }
        
        // Formulaire recherche colis
        const formRechercheColis = TransCargoUtils.$('form-recherche-colis');
        if (formRechercheColis) {
            formRechercheColis.addEventListener('submit', this.handleColisSearch.bind(this));
        }
        
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
        
        console.log('✅ Formulaires initialisés');
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
        
        try {
            console.log('📋 Formulaire de création de cargaison soumis');
            await cargaisonManager.create(formData);
            e.target.reset();
            
            // Réinitialiser les champs cachés
            ['lieu-depart-display', 'lieu-arrivee-display', 'lieu-depart-lat', 'lieu-depart-lng', 'lieu-arrivee-lat', 'lieu-arrivee-lng'].forEach(id => {
                const element = TransCargoUtils.$(id);
                if (element) element.value = '';
            });
            
            console.log('🔄 Actualisation des listes de cargaisons pour formulaire colis...');
            // Actualiser aussi les cargaisons disponibles pour le nouveau colis
            const typeCargaisonColis = TransCargoUtils.$('colis-type-cargaison')?.value;
            if (typeCargaisonColis) {
                try {
                    await this.loadCargaisonsDisponibles(typeCargaisonColis);
                    console.log('✅ Listes cargaisons mises à jour');
                } catch (err) {
                    console.error('⚠️ Erreur mise à jour liste cargaisons:', err);
                }
            }
        } catch (error) {
            console.error('❌ Erreur création cargaison:', error);
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
        
        const formData = {
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
        
        // Vérification côté client que la cargaison est sélectionnée
        if (!formData.cargaisonId) {
            showNotification('Veuillez obligatoirement sélectionner une cargaison', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
            return;
        }
        
        try {
            const response = await apiCall('/colis', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            // Vérifier si la réponse contient une erreur
            if (response && response.error) {
                showNotification(response.error, 'error');
                
                // Si c'est une erreur de capacité, afficher les détails
                if (response.poidsDisponible !== undefined) {
                    const details = `Poids actuel: ${response.poidsActuel}kg / ${response.poidsMax}kg\nPoids disponible: ${response.poidsDisponible}kg`;
                    setTimeout(() => {
                        showNotification(details, 'warning');
                    }, 2000);
                }
            } else {
                showNotification('Colis enregistré avec succès', 'success');
                if (response.recu) {
                    showReceiptModal(response.recu);
                }
                
                e.target.reset();
                // Réinitialiser l'affichage des cargaisons
                const cargaisonInfo = TransCargoUtils.$('cargaison-info');
                if (cargaisonInfo) cargaisonInfo.style.display = 'none';
                
                // Actualiser les listes pour refléter les changements de capacité
                await cargaisonManager.load();
                if (formData.typeCargaison) {
                    await this.loadCargaisonsDisponibles(formData.typeCargaison);
                }
                
                // Réactiver le bouton avec succès
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Colis enregistré !';
                
                // Remettre le texte original après 2 secondes
                setTimeout(() => {
                    submitBtn.innerHTML = originalContent;
                }, 2000);
            }
            
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
                    <button class="btn btn-primary" onclick="adminApp.generateReceipt('${result.id}')">
                        <i class="fas fa-receipt"></i> Reçu
                    </button>
                    ${result.etat === 'ARRIVE' ? `
                        <button class="btn btn-success" onclick="adminApp.markColisRecupere('${result.id}')">
                            <i class="fas fa-check"></i> Marquer récupéré
                        </button>
                    ` : ''}
                    <button class="btn btn-danger" onclick="adminApp.markColisPerdu('${result.id}')">
                        <i class="fas fa-exclamation-triangle"></i> Marquer perdu
                    </button>
                </div>
            </div>
        `;
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
            await apiCall(`/colis/${id}/recupere`, { method: 'POST' });
            showNotification('Colis marqué comme récupéré', 'success');
            
            // Recharger la recherche si on est dans la recherche
            if (navigationManager.getCurrentSearchTab() === 'colis-search') {
                const code = TransCargoUtils.$('search-code-colis').value;
                if (code) await this.handleColisSearch({ preventDefault: () => {} });
            }
        } catch (error) {
            showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    // Marquer un colis comme perdu
    async markColisPerdu(id) {
        customConfirm(
            '<div class="text-center"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i><p><strong>Êtes-vous sûr de vouloir marquer ce colis comme perdu ?</strong></p></div>',
            `adminApp.doMarkColisPerdu('${id}')`,
            'Confirmation - Marquer comme perdu'
        );
    }

    async doMarkColisPerdu(id) {
        try {
            await apiCall(`/colis/${id}/perdu`, { method: 'POST' });
            showNotification('Colis marqué comme perdu', 'warning');
            
            // Recharger la recherche si on est dans la recherche
            if (navigationManager.getCurrentSearchTab() === 'colis-search') {
                const code = TransCargoUtils.$('search-code-colis').value;
                if (code) await this.handleColisSearch({ preventDefault: () => {} });
            }
        } catch (error) {
            showNotification('Erreur lors de la mise à jour', 'error');
        }
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

// Instance globale
const adminApp = new AdminApp();

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    adminApp.init();
});

// Export pour utilisation globale
window.AdminApp = AdminApp;
window.adminApp = adminApp;