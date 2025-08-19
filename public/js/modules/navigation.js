// Module de navigation TransCargo

class NavigationManager {
    constructor() {
        this.currentSection = 'accueil';
        this.currentSearchTab = 'colis-search';
    }

    // Initialiser la navigation
    init() {
        this.initSectionNavigation();
        this.initSearchTabs();
    }

    // Initialiser la navigation entre sections
    initSectionNavigation() {
        TransCargoUtils.$$('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Mise à jour de la navigation active
                TransCargoUtils.$$('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                link.classList.add('active');
            });
        });
    }

    // Initialiser les onglets de recherche
    initSearchTabs() {
        TransCargoUtils.$$('.search-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.searchTab;
                
                // Mise à jour des boutons
                TransCargoUtils.$$('.search-tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Mise à jour du contenu
                TransCargoUtils.$$('.search-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                TransCargoUtils.$(tabId).classList.add('active');
                
                this.currentSearchTab = tabId;
            });
        });
    }

    // Afficher une section
    showSection(sectionId) {
        // Cacher toutes les sections
        TransCargoUtils.$$('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Afficher la section demandée
        const targetSection = TransCargoUtils.$(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Mettre à jour la navigation active
        TransCargoUtils.$$('.nav-link').forEach(link => link.classList.remove('active'));
        TransCargoUtils.$$(`[data-section="${sectionId}"]`).forEach(link => link.classList.add('active'));
        
        this.currentSection = sectionId;
        
        // Actions spécifiques selon la section
        this.handleSectionChange(sectionId);
    }

    // Gérer les changements de section
    handleSectionChange(sectionId) {
        switch(sectionId) {
            case 'accueil':
                this.updateDashboardStats();
                break;
            case 'cargaisons':
                if (window.cargaisonManager) {
                    cargaisonManager.load();
                }
                break;
            case 'statistiques':
                this.updateStatisticsPage();
                break;
        }
    }

    // Mettre à jour les statistiques du tableau de bord
    async updateDashboardStats() {
        console.log('📊 Chargement des statistiques du tableau de bord...');
        
        // Utiliser document.getElementById directement pour plus de fiabilité
        const totalCargaisonsEl = document.getElementById('total-cargaisons');
        const totalColisEl = document.getElementById('total-colis');
        const revenusTotalEl = document.getElementById('revenus-total');
        const enCoursEl = document.getElementById('en-cours');
        
        console.log('🔍 Éléments trouvés:', {
            totalCargaisonsEl: !!totalCargaisonsEl,
            totalColisEl: !!totalColisEl,
            revenusTotalEl: !!revenusTotalEl,
            enCoursEl: !!enCoursEl
        });
        
        // Éléments détaillés
        const cargaisonsArrivesEl = document.getElementById('cargaisons-arrives');
        const cargaisonsOuvertesEl = document.getElementById('cargaisons-ouvertes');
        const cargaisonsFermesEl = document.getElementById('cargaisons-fermes');
        const transportMaritimeEl = document.getElementById('transport-maritime');
        const transportRoutiereEl = document.getElementById('transport-routiere');
        const transportAerienneEl = document.getElementById('transport-aerienne');
        const colisArrivesEl = document.getElementById('colis-arrives');
        const colisAttenteEl = document.getElementById('colis-attente');
        const colisPerdusEl = document.getElementById('colis-perdus');
        const colisRecuperesEl = document.getElementById('colis-recuperes');

        try {
            // Utiliser la méthode directe qui fonctionne (comme dans debugStats)
            console.log('🌐 Récupération directe des données...');
            const cargaisonsResponse = await fetch('http://localhost:3006/cargaisons');
            const cargaisons = await cargaisonsResponse.json();
            
            const colisResponse = await fetch('http://localhost:3006/colis');
            const colis = await colisResponse.json();
            
            console.log('📦 Données récupérées:', {
                cargaisons: cargaisons.length,
                colis: colis.length
            });
            
            // Calculer les statistiques directement
            const stats = {
                totalCargaisons: cargaisons.length,
                cargaisonsOuvertes: cargaisons.filter(c => c.etatGlobal === 'OUVERT').length,
                cargaisonsFermees: cargaisons.filter(c => c.etatGlobal === 'FERME').length,
                cargaisonsArrivees: cargaisons.filter(c => c.etatAvancement === 'ARRIVE').length,
                cargaisonsEnCours: cargaisons.filter(c => c.etatAvancement === 'EN_COURS').length,
                totalColis: colis.length,
                colisEnAttente: colis.filter(c => c.etat === 'EN_ATTENTE').length,
                colisEnCours: colis.filter(c => c.etat === 'EN_COURS').length,
                colisArrivees: colis.filter(c => c.etat === 'ARRIVE').length,
                colisRecuperes: colis.filter(c => c.etat === 'RECUPERE').length,
                colisPerdus: colis.filter(c => c.etat === 'PERDU').length,
                revenuTotal: colis.reduce((total, c) => total + (c.prixFinal || 0), 0),
                transportMaritime: cargaisons.filter(c => c.type === 'maritime').length,
                transportAerien: cargaisons.filter(c => c.type === 'aerienne').length,
                transportRoutier: cargaisons.filter(c => c.type === 'routiere').length
            };
            
            console.log('📊 Statistiques calculées:', stats);
            
            // Mettre à jour l'affichage principal
            if (totalCargaisonsEl) totalCargaisonsEl.textContent = stats.totalCargaisons.toString();
            if (totalColisEl) totalColisEl.textContent = stats.totalColis.toString();
            if (revenusTotalEl) revenusTotalEl.textContent = (stats.revenuTotal || 0).toLocaleString() + 'F';
            if (enCoursEl) enCoursEl.textContent = stats.cargaisonsEnCours.toString();

            // Mettre à jour les statistiques détaillées
            if (cargaisonsArrivesEl) cargaisonsArrivesEl.textContent = stats.cargaisonsArrivees.toString();
            if (cargaisonsOuvertesEl) cargaisonsOuvertesEl.textContent = stats.cargaisonsOuvertes.toString();
            if (cargaisonsFermesEl) cargaisonsFermesEl.textContent = stats.cargaisonsFermees.toString();
            if (transportMaritimeEl) transportMaritimeEl.textContent = stats.transportMaritime.toString();
            if (transportRoutiereEl) transportRoutiereEl.textContent = stats.transportRoutier.toString();
            if (transportAerienneEl) transportAerienneEl.textContent = stats.transportAerien.toString();
            if (colisArrivesEl) colisArrivesEl.textContent = stats.colisArrivees.toString();
            if (colisAttenteEl) colisAttenteEl.textContent = stats.colisEnAttente.toString();
            if (colisPerdusEl) colisPerdusEl.textContent = stats.colisPerdus.toString();
            if (colisRecuperesEl) colisRecuperesEl.textContent = stats.colisRecuperes.toString();

            console.log('✅ Statistiques mises à jour:', {
                cargaisons: stats.totalCargaisons,
                colis: stats.totalColis,
                revenus: (stats.revenuTotal || 0).toLocaleString() + 'F',
                enCours: stats.cargaisonsEnCours
            });

        } catch (error) {
            console.error('❌ Erreur chargement statistiques locales:', error);
            console.error('❌ Détails de l\'erreur:', error.message, error.stack);
            
            // Valeurs par défaut en cas d'erreur
            if (totalCargaisonsEl) {
                totalCargaisonsEl.textContent = '0';
                console.log('🔧 Reset total-cargaisons à 0');
            }
            if (totalColisEl) {
                totalColisEl.textContent = '0';
                console.log('🔧 Reset total-colis à 0');
            }
            if (revenusTotalEl) {
                revenusTotalEl.textContent = '0F';
                console.log('🔧 Reset revenus-total à 0F');
            }
            if (enCoursEl) {
                enCoursEl.textContent = '0';
                console.log('🔧 Reset en-cours à 0');
            }
        }
    }

    // Charger les données depuis le serveur JSON local ou distant
    async loadLocalData(endpoint) {
        try {
            // Détecter l'environnement
            const isLocal = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
            
            let url;
            if (isLocal) {
                // En local : utiliser le serveur JSON local sur le port 3006
                const localBaseUrl = 'http://localhost:3006';
                if (endpoint.includes('cargaisons')) {
                    url = `${localBaseUrl}/cargaisons`;
                } else if (endpoint.includes('colis')) {
                    url = `${localBaseUrl}/colis`;
                }
                console.log(`🏠 Environnement local détecté - Chargement depuis serveur JSON local: ${url}`);
            } else {
                // En production : utiliser le serveur JSON sur Render
                const baseUrl = 'https://json-server-typescript-5.onrender.com';
                if (endpoint.includes('cargaisons')) {
                    url = `${baseUrl}/cargaisons`;
                } else if (endpoint.includes('colis')) {
                    url = `${baseUrl}/colis`;
                }
                console.log(`🌐 Environnement production détecté - Chargement depuis Render: ${url}`);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`✅ Données chargées avec succès (${data.length} éléments)`);
            return data;
        } catch (error) {
            console.error(`❌ Erreur chargement ${endpoint}:`, error);
            
            // En cas d'erreur en production, essayer le fallback local
            if (!window.location.hostname.includes('localhost')) {
                console.log('🔄 Tentative de fallback vers les données locales...');
                try {
                    const fallbackResponse = await fetch(endpoint);
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        console.log(`✅ Données de fallback chargées (${fallbackData.length} éléments)`);
                        return fallbackData;
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback échoué:', fallbackError);
                }
            }
            
            return [];
        }
    }

    // Formater la devise
    formatCurrency(amount) {
        if (amount >= 1000000000) {
            return (amount / 1000000000).toFixed(1) + 'B F';
        } else if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M F';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'K F';
        }
        return amount.toLocaleString() + ' F';
    }

    // Mettre à jour les statistiques détaillées
    updateDetailedStats(stats) {
        // Statistiques des cargaisons par état
        const cargaisonArrivesEl = document.getElementById('cargaisons-arrives');
        const cargaisonOuvertesEl = document.getElementById('cargaisons-ouvertes');
        const cargaisonFermesEl = document.getElementById('cargaisons-fermes');

        if (cargaisonArrivesEl) cargaisonArrivesEl.textContent = stats.arrives.toString();
        if (cargaisonOuvertesEl) cargaisonOuvertesEl.textContent = stats.ouverts.toString();
        if (cargaisonFermesEl) cargaisonFermesEl.textContent = stats.fermes.toString();

        // Statistiques par type de transport
        const maritimeEl = document.getElementById('transport-maritime');
        const routiereEl = document.getElementById('transport-routiere');
        const aerienneEl = document.getElementById('transport-aerienne');

        if (maritimeEl) maritimeEl.textContent = stats.maritime.toString();
        if (routiereEl) routiereEl.textContent = stats.routiere.toString();
        if (aerienneEl) aerienneEl.textContent = stats.aerienne.toString();

        // Statistiques des colis par état
        const colisArrivesEl = document.getElementById('colis-arrives');
        const colisAttenteEl = document.getElementById('colis-attente');
        const colisPerdusEl = document.getElementById('colis-perdus');
        const colisRecuperesEl = document.getElementById('colis-recuperes');

        if (colisArrivesEl) colisArrivesEl.textContent = stats.colisArrive.toString();
        if (colisAttenteEl) colisAttenteEl.textContent = stats.colisEnAttente.toString();
        if (colisPerdusEl) colisPerdusEl.textContent = stats.colisPerdu.toString();
        if (colisRecuperesEl) colisRecuperesEl.textContent = stats.colisRecupere.toString();
        
        console.log('✅ Statistiques détaillées mises à jour:', {
            arrives: stats.arrives,
            ouverts: stats.ouverts,
            fermes: stats.fermes,
            maritime: stats.maritime,
            routiere: stats.routiere,
            aerienne: stats.aerienne
        });
    }

    // Mettre à jour la page des statistiques
    async updateStatisticsPage() {
        console.log('📊 Chargement de la page Statistiques avec les données locales...');
        
        const statsGrid = TransCargoUtils.$('stats-grid');
        if (!statsGrid) return;

        try {
            // Charger les données depuis les fichiers JSON locaux
            const [cargaisons, colis] = await Promise.all([
                this.loadLocalData('/data/cargaisons.json'),
                this.loadLocalData('/data/colis.json')
            ]);

            // Calculer les statistiques réelles
            const totalCargaisons = cargaisons.length;
            const totalColis = colis.length;
            const revenus = colis.reduce((sum, c) => sum + (c.prixFinal || 0), 0);
            const enCours = cargaisons.filter(c =>
                c.etatAvancement === 'EN_COURS' || c.etatAvancement === 'EN_ATTENTE'
            ).length;
            const arrives = cargaisons.filter(c => c.etatAvancement === 'ARRIVE').length;
            const ouverts = cargaisons.filter(c => c.etatGlobal === 'OUVERT').length;
            const fermes = cargaisons.filter(c => c.etatGlobal === 'FERME').length;

            // Calculer les statistiques par type de transport
            const maritime = cargaisons.filter(c => c.type === 'maritime').length;
            const routiere = cargaisons.filter(c => c.type === 'routiere').length;
            const aerienne = cargaisons.filter(c => c.type === 'aerienne').length;

            // Calculer les statistiques des colis par état
            const colisArrive = colis.filter(c => c.etat === 'ARRIVE').length;
            const colisEnAttente = colis.filter(c => c.etat === 'EN_ATTENTE').length;
            const colisPerdu = colis.filter(c => c.etat === 'PERDU').length;
            const colisRecupere = colis.filter(c => c.etat === 'RECUPERE').length;

            // Générer le HTML des statistiques
            statsGrid.innerHTML = `
                <!-- Statistiques principales -->
                <div class="stats-section">
                    <h4><i class="fas fa-chart-line"></i> Vue d'ensemble</h4>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <i class="fas fa-boxes"></i>
                            <h3>${totalCargaisons}</h3>
                            <p>Total Cargaisons</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-cube"></i>
                            <h3>${totalColis}</h3>
                            <p>Total Colis</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-euro-sign"></i>
                            <h3>${(revenus || 0).toLocaleString()}F</h3>
                            <p>Revenus Total</p>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-truck-loading"></i>
                            <h3>${enCours}</h3>
                            <p>En Cours</p>
                        </div>
                    </div>
                </div>

                <!-- État des Cargaisons -->
                <div class="stats-section">
                    <h4><i class="fas fa-boxes"></i> État des Cargaisons</h4>
                    <div class="stats-grid">
                        <div class="stat-card secondary">
                            <i class="fas fa-check-circle"></i>
                            <h3>${arrives}</h3>
                            <p>Cargaisons Arrivées</p>
                        </div>
                        <div class="stat-card secondary">
                            <i class="fas fa-unlock"></i>
                            <h3>${ouverts}</h3>
                            <p>Cargaisons Ouvertes</p>
                        </div>
                        <div class="stat-card secondary">
                            <i class="fas fa-lock"></i>
                            <h3>${fermes}</h3>
                            <p>Cargaisons Fermées</p>
                        </div>
                    </div>
                </div>

                <!-- Types de Transport -->
                <div class="stats-section">
                    <h4><i class="fas fa-shipping-fast"></i> Types de Transport</h4>
                    <div class="stats-grid">
                        <div class="stat-card tertiary">
                            <i class="fas fa-ship"></i>
                            <h3>${maritime}</h3>
                            <p>Transport Maritime</p>
                        </div>
                        <div class="stat-card tertiary">
                            <i class="fas fa-truck"></i>
                            <h3>${routiere}</h3>
                            <p>Transport Routier</p>
                        </div>
                        <div class="stat-card tertiary">
                            <i class="fas fa-plane"></i>
                            <h3>${aerienne}</h3>
                            <p>Transport Aérien</p>
                        </div>
                    </div>
                </div>

                <!-- État des Colis -->
                <div class="stats-section">
                    <h4><i class="fas fa-cube"></i> État des Colis</h4>
                    <div class="stats-grid">
                        <div class="stat-card success">
                            <i class="fas fa-check"></i>
                            <h3>${colisArrive}</h3>
                            <p>Colis Arrivés</p>
                        </div>
                        <div class="stat-card warning">
                            <i class="fas fa-clock"></i>
                            <h3>${colisEnAttente}</h3>
                            <p>Colis en Attente</p>
                        </div>
                        <div class="stat-card danger">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>${colisPerdu}</h3>
                            <p>Colis Perdus</p>
                        </div>
                        <div class="stat-card info">
                            <i class="fas fa-hand-holding"></i>
                            <h3>${colisRecupere}</h3>
                            <p>Colis Récupérés</p>
                        </div>
                    </div>
                </div>
            `;

            console.log('✅ Page Statistiques mise à jour avec les données locales');

        } catch (error) {
            console.error('❌ Erreur chargement page Statistiques:', error);
            statsGrid.innerHTML = `
                <div class="stats-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Erreur de chargement</h4>
                    <p>Impossible de charger les statistiques. Vérifiez que les fichiers de données sont disponibles.</p>
                </div>
            `;
        }
    }

    // Obtenir la section courante
    getCurrentSection() {
        return this.currentSection;
    }

    // Obtenir l'onglet de recherche courant
    getCurrentSearchTab() {
        return this.currentSearchTab;
    }
}

// Instance globale
const navigationManager = new NavigationManager();

// Fonctions globales pour compatibilité
function showSection(sectionName) {
    navigationManager.showSection(sectionName);
}

function updateDashboardStats() {
    navigationManager.updateDashboardStats();
}

// Fonction de debugging pour forcer la mise à jour des statistiques
async function debugStats() {
    console.log('🔧 DEBUG: Test manuel des statistiques...');
    
    try {
        // Test direct via fetch
        console.log('🌐 Test direct via fetch...');
        const cargaisonsResponse = await fetch('http://localhost:3006/cargaisons');
        const cargaisons = await cargaisonsResponse.json();
        
        const colisResponse = await fetch('http://localhost:3006/colis');
        const colis = await colisResponse.json();
        
        console.log('📦 Données récupérées directement:', {
            cargaisons: cargaisons.length,
            colis: colis.length
        });
        
        // Calcul des revenus
        const revenus = colis.reduce((total, c) => total + (c.prixFinal || 0), 0);
        
        // Mise à jour directe
        const totalCargaisonsEl = document.getElementById('total-cargaisons');
        const totalColisEl = document.getElementById('total-colis');
        const revenusTotalEl = document.getElementById('revenus-total');
        const enCoursEl = document.getElementById('en-cours');
        
        if (totalCargaisonsEl) {
            totalCargaisonsEl.textContent = cargaisons.length.toString();
            console.log('✅ Cargaisons mises à jour:', cargaisons.length);
        }
        
        if (totalColisEl) {
            totalColisEl.textContent = colis.length.toString();
            console.log('✅ Colis mis à jour:', colis.length);
        }
        
        if (revenusTotalEl) {
            revenusTotalEl.textContent = revenus.toLocaleString() + 'F';
            console.log('✅ Revenus mis à jour:', revenus);
        }
        
        if (enCoursEl) {
            const enCours = cargaisons.filter(c => c.etatAvancement === 'EN_COURS').length;
            enCoursEl.textContent = enCours.toString();
            console.log('✅ En cours mis à jour:', enCours);
        }
        
        // Mettre à jour les statistiques détaillées aussi
        const elements = [
            { id: 'cargaisons-arrives', value: cargaisons.filter(c => c.etatAvancement === 'ARRIVE').length },
            { id: 'cargaisons-ouvertes', value: cargaisons.filter(c => c.etatGlobal === 'OUVERT').length },
            { id: 'cargaisons-fermes', value: cargaisons.filter(c => c.etatGlobal === 'FERME').length },
            { id: 'transport-maritime', value: cargaisons.filter(c => c.type === 'maritime').length },
            { id: 'transport-routiere', value: cargaisons.filter(c => c.type === 'routiere').length },
            { id: 'transport-aerienne', value: cargaisons.filter(c => c.type === 'aerienne').length }
        ];
        
        elements.forEach(elem => {
            const el = document.getElementById(elem.id);
            if (el) {
                el.textContent = elem.value.toString();
                console.log(`✅ ${elem.id} mis à jour:`, elem.value);
            }
        });
        
        console.log('✅ Toutes les statistiques forcées avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur test stats:', error);
        alert('Erreur: ' + error.message);
    }
}

// Export pour utilisation globale
window.NavigationManager = NavigationManager;
window.navigationManager = navigationManager;
window.showSection = showSection;
window.updateDashboardStats = updateDashboardStats;
window.debugStats = debugStats;