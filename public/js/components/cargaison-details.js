// Composant de détails des cargaisons TransCargo
// Responsabilité : Afficher les détails complets d'une cargaison

class CargaisonDetailsManager {
    constructor() {
        this.initialized = false;
    }

    // Initialiser le gestionnaire
    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('✅ Gestionnaire de détails cargaisons initialisé');
    }

    // Afficher les détails d'une cargaison
    async viewDetails(id) {
        try {
            console.log(`🔍 Chargement des détails de la cargaison ${id}...`);
            
            // Charger les données de la cargaison
            const cargaison = await apiCall(`/cargaisons/${id}`);
            
            // Charger tous les colis et filtrer par cargaisonId
            const allColis = await apiCall('/colis');
            const colis = allColis.filter(c => c.cargaisonId === id);
            
            console.log(`📦 ${colis.length} colis trouvés pour la cargaison ${id}`);
            
            // Calculer les propriétés manquantes
            this.enrichCargaisonData(cargaison, colis);
            
            // Afficher le modal avec les détails
            this.showDetailsModal(cargaison, colis);
            
        } catch (error) {
            console.error('❌ Erreur chargement détails cargaison:', error);
            showNotification('Erreur lors du chargement des détails', 'error');
        }
    }

    // Enrichir les données de la cargaison avec les calculs manquants
    enrichCargaisonData(cargaison, colis) {
        // Calculer le poids utilisé
        const poidsUtilise = colis.reduce((total, c) => total + (c.poids || 0), 0);
        cargaison.poidsUtilise = poidsUtilise;
        
        // Calculer le poids restant
        cargaison.poidsRestant = Math.max(0, cargaison.poidsMax - poidsUtilise);
        
        // Calculer le prix par kg si pas défini
        if (!cargaison.prixParKg && cargaison.distance) {
            // Prix de base selon le type de transport
            const prixBase = {
                'routiere': 100,
                'maritime': 80,
                'aerienne': 200
            };
            cargaison.prixParKg = prixBase[cargaison.type] || 100;
        }
        
        // S'assurer que prixTotal existe
        if (!cargaison.prixTotal) {
            cargaison.prixTotal = colis.reduce((total, c) => total + (c.prixFinal || 0), 0);
        }
    }

    // Vérifier si tous les colis peuvent être marqués avec un état donné
    canMarkAllAs(colis, targetState) {
        if (colis.length === 0) return false;
        
        return colis.some(c => {
            if (targetState === 'RECUPERE') {
                // Pour récupérer : le colis doit être arrivé
                return c.etat === 'ARRIVE';
            } else if (targetState === 'PERDU') {
                // NOUVELLE RÈGLE : Pour marquer perdu : le colis doit aussi être arrivé
                return c.etat === 'ARRIVE';
            }
            return false;
        });
    }

    // Marquer tous les colis d'une cargaison avec un état donné
    async markAllColisAs(cargaisonId, targetState) {
        try {
            console.log(`🔄 Marquage en lot des colis de la cargaison ${cargaisonId} comme ${targetState}...`);
            
            // Charger les colis actuels de la cargaison
            const allColis = await apiCall('/colis');
            const colis = allColis.filter(c => c.cargaisonId === cargaisonId);
            
            if (colis.length === 0) {
                showNotification('Aucun colis à traiter', 'warning');
                return;
            }
            
            // Filtrer les colis qui peuvent être mis à jour
            const colisToUpdate = colis.filter(c => {
                if (targetState === 'RECUPERE') {
                    return c.etat === 'ARRIVE';
                } else if (targetState === 'PERDU') {
                    // NOUVELLE RÈGLE : Seuls les colis arrivés peuvent être marqués perdus
                    return c.etat === 'ARRIVE';
                }
                return false;
            });
            
            if (colisToUpdate.length === 0) {
                const message = targetState === 'RECUPERE' 
                    ? 'Aucun colis arrivé à marquer comme récupéré'
                    : 'Aucun colis arrivé à marquer comme perdu';
                showNotification(message, 'info');
                return;
            }
            
            // Confirmer l'action
            const action = targetState === 'RECUPERE' ? 'récupérés' : 'perdus';
            if (!confirm(`Marquer ${colisToUpdate.length} colis comme ${action} ?`)) {
                return;
            }
            
            let successCount = 0;
            let errorCount = 0;
            
            // Traiter chaque colis individuellement
            for (const colis of colisToUpdate) {
                try {
                    const endpoint = targetState === 'RECUPERE' 
                        ? `/colis/${colis.id}/recupere`
                        : `/colis/${colis.id}/perdu`;
                        
                    await apiCall(endpoint, { method: 'POST' });
                    successCount++;
                } catch (error) {
                    console.error(`❌ Erreur pour le colis ${colis.id}:`, error);
                    errorCount++;
                }
            }
            
            // Afficher le résultat
            if (successCount > 0) {
                const action = targetState === 'RECUPERE' ? 'récupéré(s)' : 'perdu(s)';
                showNotification(`${successCount} colis marqué(s) comme ${action}`, 'success');
                
                // Recharger les détails de la cargaison
                this.viewDetails(cargaisonId);
            }
            
            if (errorCount > 0) {
                showNotification(`${errorCount} erreur(s) lors du traitement`, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du marquage en lot:', error);
            showNotification('Erreur lors du traitement des colis', 'error');
        }
    }

    // Afficher le modal des détails
    showDetailsModal(cargaison, colis) {
        const modalContent = this.buildDetailsHTML(cargaison, colis);
        
        // Utiliser le système de modal existant
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalBody) {
            modalBody.innerHTML = modalContent;
            
            // Ajouter les classes pour un modal large et centré
            modal.classList.add('modal-lg', 'show');
            modal.style.display = 'flex'; // Utiliser flex au lieu de block pour le centrage
        } else {
            console.error('❌ Éléments modal non trouvés');
        }
    }

    // Construire le HTML des détails
    buildDetailsHTML(cargaison, colis) {
        const colisHTML = colis.length > 0 ? colis.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.expediteur.prenom} ${c.expediteur.nom}</td>
                <td>${c.destinataire.nomComplet}</td>
                <td>${c.poids} kg</td>
                <td>${c.typeProduit}</td>
                <td>
                    <span class="badge ${TransCargoUtils.getStatusBadgeClass(c.etat)}">
                        ${TransCargoUtils.formatStatus(c.etat)}
                    </span>
                </td>
                <td>${c.prixFinal.toLocaleString()} FCFA</td>
            </tr>
        `).join('') : '<tr><td colspan="7" class="text-center text-muted">Aucun colis dans cette cargaison</td></tr>';

        return `
            <div class="cargaison-details">
                <div class="details-header">
                    <h2>
                        <i class="fas fa-${TransCargoUtils.getTransportIcon(cargaison.type)}"></i>
                        Détails de la cargaison ${cargaison.numero}
                    </h2>
                    <div class="details-badges">
                        <span class="badge ${TransCargoUtils.getStatusBadgeClass(cargaison.etatGlobal)}">
                            <i class="fas fa-${TransCargoUtils.getStatusIcon(cargaison.etatGlobal)}"></i>
                            ${TransCargoUtils.formatStatus(cargaison.etatGlobal)}
                        </span>
                        <span class="badge ${TransCargoUtils.getStatusBadgeClass(cargaison.etatAvancement)}">
                            ${TransCargoUtils.formatStatus(cargaison.etatAvancement)}
                        </span>
                    </div>
                </div>

                <div class="details-grid">
                    <div class="details-section">
                        <h3><i class="fas fa-info-circle"></i> Informations générales</h3>
                        <div class="details-content">
                            <div class="detail-item">
                                <strong>Type de transport :</strong>
                                <span>${TransCargoUtils.formatTransportType(cargaison.type)}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Numéro :</strong>
                                <span>${cargaison.numero}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Date de création :</strong>
                                <span>${new Date(cargaison.dateCreation).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Poids maximum :</strong>
                                <span>${cargaison.poidsMax} kg</span>
                            </div>
                            <div class="detail-item">
                                <strong>Poids utilisé :</strong>
                                <span>${cargaison.poidsUtilise || 0} kg</span>
                            </div>
                            <div class="detail-item">
                                <strong>Poids restant :</strong>
                                <span>${cargaison.poidsRestant || cargaison.poidsMax} kg</span>
                            </div>
                        </div>
                    </div>

                    <div class="details-section">
                        <h3><i class="fas fa-route"></i> Trajet</h3>
                        <div class="details-content">
                            <div class="detail-item">
                                <strong>Départ :</strong>
                                <span>${cargaison.trajet.depart.lieu}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Arrivée :</strong>
                                <span>${cargaison.trajet.arrivee.lieu}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Distance :</strong>
                                <span>${cargaison.distance} km</span>
                            </div>
                            <div class="detail-item">
                                <strong>Prix par kg :</strong>
                                <span>${cargaison.prixParKg} FCFA/kg</span>
                            </div>
                        </div>
                    </div>

                    <div class="details-section">
                        <h3><i class="fas fa-chart-bar"></i> Statistiques</h3>
                        <div class="details-content">
                            <div class="detail-item">
                                <strong>Nombre de colis :</strong>
                                <span>${colis.length}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Revenus totaux :</strong>
                                <span>${(cargaison.prixTotal || 0).toLocaleString()} FCFA</span>
                            </div>
                            <div class="detail-item">
                                <strong>Taux de remplissage :</strong>
                                <span>${Math.round(((cargaison.poidsUtilise || 0) / cargaison.poidsMax) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <h3><i class="fas fa-boxes"></i> Colis associés (${colis.length})</h3>
                    ${colis.length > 0 ? `
                    <div class="colis-bulk-actions">
                        <strong>Actions en lot :</strong>
                        <button class="btn btn-sm btn-success" onclick="cargaisonDetailsManager.markAllColisAs('${cargaison.id}', 'RECUPERE')" 
                                ${!this.canMarkAllAs(colis, 'RECUPERE') ? 'disabled' : ''}>
                            <i class="fas fa-check-circle"></i> Tout marquer récupéré
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cargaisonDetailsManager.markAllColisAs('${cargaison.id}', 'PERDU')"
                                ${!this.canMarkAllAs(colis, 'PERDU') ? 'disabled' : ''}>
                            <i class="fas fa-times-circle"></i> Tout marquer perdu
                        </button>
                    </div>
                    ` : ''}
                    <div class="table-container">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Expéditeur</th>
                                    <th>Destinataire</th>
                                    <th>Poids</th>
                                    <th>Type</th>
                                    <th>État</th>
                                    <th>Prix</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${colisHTML}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="details-actions">
                    <button class="btn btn-secondary" onclick="closeModal()">
                        <i class="fas fa-times"></i> Fermer
                    </button>
                    ${colis.length === 0 ? `
                        <button class="btn btn-info" onclick="cargaisonDetailsManager.addColisToEmptyCargaison('${cargaison.id}')">
                            <i class="fas fa-plus"></i> Ajouter un colis
                        </button>
                    ` : ''}
                    ${cargaison.etatGlobal === 'OUVERT' ? `
                        <button class="btn btn-warning" onclick="cargaisonManager.close('${cargaison.id}'); closeModal();">
                            <i class="fas fa-lock"></i> Fermer la cargaison
                        </button>
                    ` : ''}
                    ${cargaison.etatGlobal === 'FERME' && cargaison.etatAvancement === 'EN_ATTENTE' ? `
                        <button class="btn btn-success" onclick="cargaisonManager.reopen('${cargaison.id}'); closeModal();">
                            <i class="fas fa-unlock"></i> Rouvrir la cargaison
                        </button>
                    ` : ''}
                    ${cargaison.etatAvancement === 'EN_ATTENTE' && colis.length > 0 ? `
                        <button class="btn btn-primary" onclick="cargaisonManager.start('${cargaison.id}'); closeModal();">
                            <i class="fas fa-play"></i> Démarrer le transport
                        </button>
                    ` : ''}
                    ${cargaison.etatAvancement === 'EN_COURS' ? `
                        <button class="btn btn-success" onclick="cargaisonManager.markArrived('${cargaison.id}'); closeModal();">
                            <i class="fas fa-check"></i> Marquer comme arrivée
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// Export et instance globale
window.CargaisonDetailsManager = CargaisonDetailsManager;
window.cargaisonDetailsManager = new CargaisonDetailsManager();