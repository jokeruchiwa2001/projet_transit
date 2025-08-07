// Gestionnaire Google Maps pour GP du Monde

class GPMapsManager {
    constructor() {
        this.map = null;
        this.departMarker = null;
        this.arriveeMarker = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.departCoordinates = null;
        this.arriveeCoordinates = null;
        this.onRouteCalculated = null;
    }
    
    // Initialiser la carte
    initMap(containerId, options = {}) {
        const defaultOptions = {
            zoom: 6,
            center: { lat: 14.6937, lng: -17.4441 }, // Dakar par défaut
            mapTypeId: 'roadmap'
        };
        
        const mapOptions = { ...defaultOptions, ...options };
        
        this.map = new google.maps.Map(document.getElementById(containerId), mapOptions);
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            draggable: true,
            suppressMarkers: false
        });
        
        this.directionsRenderer.setMap(this.map);
        
        // Écouter les clics sur la carte
        this.map.addListener('click', (event) => {
            this.handleMapClick(event);
        });
        
        // Écouter les changements de route
        this.directionsRenderer.addListener('directions_changed', () => {
            this.onDirectionsChanged();
        });
        
        console.log('Google Maps initialisé');
    }
    
    // Gérer les clics sur la carte
    handleMapClick(event) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Demander à l'utilisateur s'il s'agit du départ ou de l'arrivée
        const choice = this.askForPointType();
        
        if (choice === 'depart') {
            this.setDepartPoint(lat, lng);
        } else if (choice === 'arrivee') {
            this.setArriveePoint(lat, lng);
        }
    }
    
    // Demander le type de point (départ ou arrivée)
    askForPointType() {
        if (!this.departCoordinates) {
            return 'depart';
        } else if (!this.arriveeCoordinates) {
            return 'arrivee';
        } else {
            // Les deux points sont définis, demander lequel modifier
            const choice = confirm('Voulez-vous modifier le point de DÉPART ? (Annuler pour modifier l\'ARRIVÉE)');
            return choice ? 'depart' : 'arrivee';
        }
    }
    
    // Définir le point de départ
    async setDepartPoint(lat, lng) {
        this.departCoordinates = { lat, lng };
        
        // Supprimer l'ancien marqueur
        if (this.departMarker) {
            this.departMarker.setMap(null);
        }
        
        // Créer un nouveau marqueur
        this.departMarker = new google.maps.Marker({
            position: { lat, lng },
            map: this.map,
            title: 'Point de départ',
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            }
        });
        
        // Obtenir l'adresse
        const address = await this.getAddressFromCoordinates(lat, lng);
        this.updateDepartInfo(address, lat, lng);
        
        // Calculer la route si les deux points sont définis
        if (this.arriveeCoordinates) {
            this.calculateRoute();
        }
    }
    
    // Définir le point d'arrivée
    async setArriveePoint(lat, lng) {
        this.arriveeCoordinates = { lat, lng };
        
        // Supprimer l'ancien marqueur
        if (this.arriveeMarker) {
            this.arriveeMarker.setMap(null);
        }
        
        // Créer un nouveau marqueur
        this.arriveeMarker = new google.maps.Marker({
            position: { lat, lng },
            map: this.map,
            title: 'Point d\'arrivée',
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
        });
        
        // Obtenir l'adresse
        const address = await this.getAddressFromCoordinates(lat, lng);
        this.updateArriveeInfo(address, lat, lng);
        
        // Calculer la route si les deux points sont définis
        if (this.departCoordinates) {
            this.calculateRoute();
        }
    }
    
    // Obtenir l'adresse à partir des coordonnées
    async getAddressFromCoordinates(lat, lng) {
        return new Promise((resolve) => {
            const geocoder = new google.maps.Geocoder();
            const latlng = { lat, lng };
            
            geocoder.geocode({ location: latlng }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                }
            });
        });
    }
    
    // Calculer la route entre les deux points
    calculateRoute() {
        if (!this.departCoordinates || !this.arriveeCoordinates) {
            return;
        }
        
        const request = {
            origin: this.departCoordinates,
            destination: this.arriveeCoordinates,
            travelMode: google.maps.TravelMode.DRIVING
        };
        
        this.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                this.directionsRenderer.setDirections(result);
                
                // Extraire la distance
                const route = result.routes[0];
                const leg = route.legs[0];
                const distance = leg.distance.value / 1000; // en km
                
                this.updateRouteInfo(distance, leg.duration.text);
                
                // Callback si défini
                if (this.onRouteCalculated) {
                    this.onRouteCalculated({
                        distance: distance,
                        duration: leg.duration.text,
                        depart: this.departCoordinates,
                        arrivee: this.arriveeCoordinates
                    });
                }
            } else {
                console.error('Erreur calcul route:', status);
                alert('Impossible de calculer la route entre ces deux points');
            }
        });
    }
    
    // Écouter les changements de route (quand l'utilisateur fait glisser)
    onDirectionsChanged() {
        const directions = this.directionsRenderer.getDirections();
        const route = directions.routes[0];
        const leg = route.legs[0];
        
        // Mettre à jour les coordonnées
        this.departCoordinates = {
            lat: leg.start_location.lat(),
            lng: leg.start_location.lng()
        };
        
        this.arriveeCoordinates = {
            lat: leg.end_location.lat(),
            lng: leg.end_location.lng()
        };
        
        // Mettre à jour les informations
        const distance = leg.distance.value / 1000;
        this.updateRouteInfo(distance, leg.duration.text);
        
        // Mettre à jour les adresses
        this.getAddressFromCoordinates(this.departCoordinates.lat, this.departCoordinates.lng)
            .then(address => this.updateDepartInfo(address, this.departCoordinates.lat, this.departCoordinates.lng));
            
        this.getAddressFromCoordinates(this.arriveeCoordinates.lat, this.arriveeCoordinates.lng)
            .then(address => this.updateArriveeInfo(address, this.arriveeCoordinates.lat, this.arriveeCoordinates.lng));
    }
    
    // Mettre à jour les informations de départ
    updateDepartInfo(address, lat, lng) {
        const elements = {
            address: document.getElementById('depart-address'),
            coords: document.getElementById('depart-coordinates'),
            input: document.getElementById('depart-lieu')
        };
        
        if (elements.address) {
            elements.address.textContent = address;
        }
        
        if (elements.coords) {
            elements.coords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        
        if (elements.input) {
            elements.input.value = address;
        }
        
        // Stocker dans des champs cachés
        this.updateHiddenField('depart-lat', lat);
        this.updateHiddenField('depart-lng', lng);
        this.updateHiddenField('depart-address-hidden', address);
    }
    
    // Mettre à jour les informations d'arrivée
    updateArriveeInfo(address, lat, lng) {
        const elements = {
            address: document.getElementById('arrivee-address'),
            coords: document.getElementById('arrivee-coordinates'),
            input: document.getElementById('arrivee-lieu')
        };
        
        if (elements.address) {
            elements.address.textContent = address;
        }
        
        if (elements.coords) {
            elements.coords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        
        if (elements.input) {
            elements.input.value = address;
        }
        
        // Stocker dans des champs cachés
        this.updateHiddenField('arrivee-lat', lat);
        this.updateHiddenField('arrivee-lng', lng);
        this.updateHiddenField('arrivee-address-hidden', address);
    }
    
    // Mettre à jour les informations de route
    updateRouteInfo(distance, duration) {
        const elements = {
            distance: document.getElementById('route-distance'),
            duration: document.getElementById('route-duration'),
            distanceInput: document.getElementById('distance-input')
        };
        
        if (elements.distance) {
            elements.distance.textContent = `${Math.round(distance)} km`;
        }
        
        if (elements.duration) {
            elements.duration.textContent = duration;
        }
        
        if (elements.distanceInput) {
            elements.distanceInput.value = Math.round(distance);
        }
        
        // Stocker dans un champ caché
        this.updateHiddenField('distance-hidden', Math.round(distance));
    }
    
    // Mettre à jour un champ caché
    updateHiddenField(id, value) {
        let field = document.getElementById(id);
        if (!field) {
            field = document.createElement('input');
            field.type = 'hidden';
            field.id = id;
            field.name = id.replace('-hidden', '').replace('-', '_');
            document.body.appendChild(field);
        }
        field.value = value;
    }
    
    // Rechercher un lieu par nom
    searchPlace(query, callback) {
        const service = new google.maps.places.PlacesService(this.map);
        
        service.textSearch({
            query: query
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
                const place = results[0];
                const location = place.geometry.location;
                
                callback({
                    name: place.name,
                    address: place.formatted_address,
                    lat: location.lat(),
                    lng: location.lng()
                });
            } else {
                callback(null);
            }
        });
    }
    
    // Obtenir les données du trajet
    getTrajetData() {
        if (!this.departCoordinates || !this.arriveeCoordinates) {
            return null;
        }
        
        return {
            depart: {
                lieu: document.getElementById('depart-address')?.textContent || '',
                latitude: this.departCoordinates.lat,
                longitude: this.departCoordinates.lng
            },
            arrivee: {
                lieu: document.getElementById('arrivee-address')?.textContent || '',
                latitude: this.arriveeCoordinates.lat,
                longitude: this.arriveeCoordinates.lng
            },
            distance: document.getElementById('distance-hidden')?.value || 0
        };
    }
    
    // Charger un trajet existant
    loadTrajet(trajetData) {
        if (trajetData.depart) {
            this.setDepartPoint(trajetData.depart.latitude, trajetData.depart.longitude);
        }
        
        if (trajetData.arrivee) {
            this.setArriveePoint(trajetData.arrivee.latitude, trajetData.arrivee.longitude);
        }
    }
    
    // Réinitialiser la carte
    reset() {
        if (this.departMarker) {
            this.departMarker.setMap(null);
            this.departMarker = null;
        }
        
        if (this.arriveeMarker) {
            this.arriveeMarker.setMap(null);
            this.arriveeMarker = null;
        }
        
        this.directionsRenderer.setDirections({routes: []});
        
        this.departCoordinates = null;
        this.arriveeCoordinates = null;
        
        // Nettoyer les champs
        this.clearLocationInfo();
    }
    
    // Nettoyer les informations de localisation
    clearLocationInfo() {
        const ids = ['depart-address', 'depart-coordinates', 'arrivee-address', 'arrivee-coordinates', 'route-distance', 'route-duration'];
        
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '';
            }
        });
    }
}

// Instance globale
let gpMaps = null;

// Fonction d'initialisation appelée par Google Maps API
function initGoogleMaps() {
    console.log('Google Maps API chargée');
    gpMaps = new GPMapsManager();
    
    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('googleMapsLoaded'));
}

// Fonction utilitaire pour charger l'API Google Maps
function loadGoogleMapsAPI(apiKey, callback) {
    if (window.google && window.google.maps) {
        callback();
        return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    window.initGoogleMaps = () => {
        initGoogleMaps();
        if (callback) callback();
    };
    
    document.head.appendChild(script);
}
