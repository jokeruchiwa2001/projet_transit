// Fonctions de gestion de la carte Leaflet

// Variables globales pour la carte
let leafletMap = null;
let currentMarker = null;
let selectedLocation = null;
let currentLocationField = null;

// Ouvrir le sélecteur de lieu
function openLocationSelector(field) {
    console.log('Ouverture de la carte pour le champ:', field);
    currentLocationField = field;
    
    const modal = document.getElementById('map-modal');
    if (!modal) {
        console.error('Modal de carte non trouvé');
        return;
    }
    
    // Afficher le modal immédiatement
    modal.style.display = 'block';
    
    // Mettre à jour le titre selon le champ
    const title = document.getElementById('map-modal-title');
    if (title) {
        if (field.includes('depart')) {
            title.textContent = 'Sélectionner le lieu de départ';
        } else if (field.includes('arrivee')) {
            title.textContent = 'Sélectionner le lieu d\'arrivée';
        } else {
            title.textContent = 'Sélectionner un lieu sur la carte';
        }
    }
    
    // Attendre que le modal soit visible puis initialiser la carte
    setTimeout(() => {
        initializeMap();
    }, 200);
}

// Initialiser la carte Leaflet
function initializeMap() {
    // Nettoyer la carte existante si elle existe
    if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
    }
    
    // Vérifier que le conteneur existe et attendre qu'il soit visible
    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer) {
        console.error('Conteneur de carte non trouvé');
        return;
    }
    
    // Vérifier que le modal est visible
    const modal = document.getElementById('map-modal');
    if (!modal || modal.style.display === 'none') {
        console.error('Modal de carte non visible');
        return;
    }
    
    // Nettoyer le conteneur
    mapContainer.innerHTML = '';
    
    // Attendre que le conteneur soit complètement rendu
    setTimeout(() => {
        if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
            console.error('Conteneur de carte pas encore visible, nouvelle tentative...');
            setTimeout(() => initializeMap(), 100);
            return;
        }
    
    // Initialiser la carte sur Dakar, Sénégal
    leafletMap = L.map('leaflet-map').setView([14.6937, -17.4441], 10);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(leafletMap);
    
    // Ajouter un marqueur initial
    currentMarker = L.marker([14.6937, -17.4441], {
        draggable: true
    }).addTo(leafletMap);
    
    currentMarker.bindPopup('📍 Faites glisser le marqueur ou cliquez sur la carte');
    
    // Écouter les clics sur la carte
    leafletMap.on('click', function(e) {
        updateMarkerPosition(e.latlng.lat, e.latlng.lng);
    });
    
    // Écouter le glissement du marqueur
    currentMarker.on('dragend', function(e) {
        const position = e.target.getLatLng();
        updateMarkerPosition(position.lat, position.lng);
    });
    
        // Redimensionner la carte après un délai
        setTimeout(() => {
            leafletMap.invalidateSize();
        }, 100);
        
    }, 50); // Fermer le setTimeout du conteneur
}

// Mettre à jour la position du marqueur
function updateMarkerPosition(lat, lng) {
    currentMarker.setLatLng([lat, lng]);
    
    // Sauvegarder la position
    selectedLocation = {
        latitude: lat,
        longitude: lng,
        lieu: `Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    };
    
    // Géocodage inverse pour obtenir l'adresse
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                selectedLocation.lieu = data.display_name;
                currentMarker.bindPopup(`📍 ${data.display_name}`).openPopup();
                
                // Afficher les informations du lieu sélectionné
                const infoDiv = document.getElementById('selected-location-info');
                const textSpan = document.getElementById('selected-location-text');
                if (infoDiv && textSpan) {
                    textSpan.textContent = data.display_name;
                    infoDiv.style.display = 'block';
                }
            }
        })
        .catch(error => {
            console.error('Erreur de géocodage:', error);
            currentMarker.bindPopup(`📍 Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`).openPopup();
        });
}

// Rechercher un lieu
function searchLocation() {
    const searchInput = document.getElementById('location-search');
    const query = searchInput.value.trim();
    
    if (!query) {
        showNotification('Veuillez entrer un lieu à rechercher', 'warning');
        return;
    }
    
    // Recherche avec Nominatim
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=fr`;
    
    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                // Centrer la carte sur le résultat
                leafletMap.setView([lat, lng], 13);
                
                // Mettre à jour le marqueur
                updateMarkerPosition(lat, lng);
                
                // Vider le champ de recherche
                searchInput.value = '';
            } else {
                showNotification('Lieu non trouvé. Essayez avec un autre nom.', 'warning');
            }
        })
        .catch(error => {
            console.error('Erreur de recherche:', error);
            showNotification('Erreur lors de la recherche. Vérifiez votre connexion.', 'error');
        });
}

// Confirmer la sélection du lieu
function confirmLocationSelection() {
    if (!selectedLocation) {
        showNotification('Veuillez sélectionner un lieu sur la carte', 'warning');
        return;
    }
    
    if (!currentLocationField) {
        console.error('Champ de destination non défini');
        return;
    }
    
    // Mettre à jour le champ correspondant
    const locationInput = document.getElementById(currentLocationField);
    if (locationInput) {
        locationInput.value = selectedLocation.lieu;
        locationInput.dataset.latitude = selectedLocation.latitude;
        locationInput.dataset.longitude = selectedLocation.longitude;
        
        // Mettre à jour aussi les champs cachés pour la compatibilité
        if (currentLocationField.includes('depart')) {
            const latInput = document.getElementById('lieu-depart-lat');
            const lngInput = document.getElementById('lieu-depart-lng');
            if (latInput) latInput.value = selectedLocation.latitude;
            if (lngInput) lngInput.value = selectedLocation.longitude;
        } else if (currentLocationField.includes('arrivee')) {
            const latInput = document.getElementById('lieu-arrivee-lat');
            const lngInput = document.getElementById('lieu-arrivee-lng');
            if (latInput) latInput.value = selectedLocation.latitude;
            if (lngInput) lngInput.value = selectedLocation.longitude;
        }
    }
    
    console.log('Lieu sélectionné:', selectedLocation);
    
    // Fermer le modal
    closeMapModal();
}

// Fermer le modal de carte
function closeMapModal() {
    const modal = document.getElementById('map-modal');
    modal.style.display = 'none';
    
    // Nettoyer la carte
    if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
    }
    
    // Réinitialiser les variables
    selectedLocation = null;
    currentLocationField = null;
    
    // Cacher les informations du lieu
    const infoDiv = document.getElementById('selected-location-info');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

// Fermer le modal en cliquant à l'extérieur
window.onclick = function(event) {
    const modal = document.getElementById('map-modal');
    if (event.target === modal) {
        closeMapModal();
    }
}

// Écouter la touche Échap pour fermer le modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMapModal();
    }
});
