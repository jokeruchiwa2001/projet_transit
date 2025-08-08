// Fonctions de gestion de la carte Leaflet

// Variables globales pour la carte
let leafletMap = null;
let currentMarker = null;
let selectedLocation = null;
let currentLocationField = null;

// Ouvrir le sélecteur de lieu
function openLocationSelector(field) {
    currentLocationField = field;
    const modal = document.getElementById('map-modal');
    modal.style.display = 'block';
    
    // Attendre un peu que le modal soit affiché
    setTimeout(() => {
        initializeMap();
    }, 300);
}

// Initialiser la carte Leaflet
function initializeMap() {
    // Nettoyer la carte existante si elle existe
    if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
    }
    
    // Vérifier que le conteneur existe
    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer) {
        console.error('Conteneur de carte non trouvé');
        return;
    }
    
    // Nettoyer le conteneur
    mapContainer.innerHTML = '';
    
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
        alert('Veuillez entrer un lieu à rechercher');
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
                alert('Lieu non trouvé. Essayez avec un autre nom.');
            }
        })
        .catch(error => {
            console.error('Erreur de recherche:', error);
            alert('Erreur lors de la recherche. Vérifiez votre connexion.');
        });
}

// Confirmer la sélection du lieu
function confirmLocationSelection() {
    if (!selectedLocation) {
        alert('Veuillez sélectionner un lieu sur la carte');
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
    }
    
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
