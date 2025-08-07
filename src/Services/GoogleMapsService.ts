import { TrajetCoordinates } from '../Model/Cargaison';

export interface LocationResult {
  lieu: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

export interface DistanceResult {
  distance: number; // en kilomètres
  duration: number; // en minutes
  status: string;
}

export class GoogleMapsService {
  private static apiKey: string = 'YOUR_GOOGLE_MAPS_API_KEY'; // À remplacer par votre clé API
  
  // Configurer la clé API
  public static setApiKey(key: string): void {
    this.apiKey = key;
  }

  // Géocoder une adresse pour obtenir les coordonnées
  public static async geocodeAddress(address: string): Promise<LocationResult[]> {
    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Mode simulation pour les tests sans API key
      return this.simulateGeocode(address);
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results.map((result: any) => ({
          lieu: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formatted_address: result.formatted_address
        }));
      } else {
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du géocodage:', error);
      throw error;
    }
  }

  // Calculer la distance entre deux points
  public static async calculateDistance(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<DistanceResult> {
    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Mode simulation pour les tests sans API key
      return this.simulateDistance(origin, destination);
    }

    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&units=metric&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows.length > 0) {
        const element = data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          return {
            distance: Math.round(element.distance.value / 1000), // Convertir en km
            duration: Math.round(element.duration.value / 60), // Convertir en minutes
            status: 'OK'
          };
        } else {
          throw new Error(`Distance calculation failed: ${element.status}`);
        }
      } else {
        throw new Error(`Distance Matrix API failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Erreur lors du calcul de distance:', error);
      throw error;
    }
  }

  // Créer un trajet complet avec géocodage et calcul de distance
  public static async createTrajet(
    lieuDepart: string,
    lieuArrivee: string
  ): Promise<TrajetCoordinates & { distance: number; duration: number }> {
    try {
      // Géocoder les deux adresses
      const [departResults, arriveeResults] = await Promise.all([
        this.geocodeAddress(lieuDepart),
        this.geocodeAddress(lieuArrivee)
      ]);

      if (departResults.length === 0) {
        throw new Error(`Lieu de départ non trouvé: ${lieuDepart}`);
      }

      if (arriveeResults.length === 0) {
        throw new Error(`Lieu d'arrivée non trouvé: ${lieuArrivee}`);
      }

      const depart = departResults[0];
      const arrivee = arriveeResults[0];

      // Calculer la distance
      const distanceInfo = await this.calculateDistance(
        { latitude: depart.latitude, longitude: depart.longitude },
        { latitude: arrivee.latitude, longitude: arrivee.longitude }
      );

      return {
        depart: {
          lieu: depart.lieu,
          latitude: depart.latitude,
          longitude: depart.longitude
        },
        arrivee: {
          lieu: arrivee.lieu,
          latitude: arrivee.latitude,
          longitude: arrivee.longitude
        },
        distance: distanceInfo.distance,
        duration: distanceInfo.duration
      };
    } catch (error) {
      console.error('Erreur lors de la création du trajet:', error);
      throw error;
    }
  }

  // Méthodes de simulation pour les tests (sans clé API)
  private static simulateGeocode(address: string): LocationResult[] {
    // Quelques coordonnées d'exemple pour la simulation
    const mockLocations: { [key: string]: LocationResult } = {
      'dakar': {
        lieu: 'Dakar, Sénégal',
        latitude: 14.6937,
        longitude: -17.4441,
        formatted_address: 'Dakar, Sénégal'
      },
      'thies': {
        lieu: 'Thiès, Sénégal',
        latitude: 14.7886,
        longitude: -16.9246,
        formatted_address: 'Thiès, Sénégal'
      },
      'saint-louis': {
        lieu: 'Saint-Louis, Sénégal',
        latitude: 16.0361,
        longitude: -16.4803,
        formatted_address: 'Saint-Louis, Sénégal'
      },
      'kaolack': {
        lieu: 'Kaolack, Sénégal',
        latitude: 14.1612,
        longitude: -16.0723,
        formatted_address: 'Kaolack, Sénégal'
      }
    };

    const normalizedAddress = address.toLowerCase();
    for (const [key, location] of Object.entries(mockLocations)) {
      if (normalizedAddress.includes(key)) {
        return [location];
      }
    }

    // Si aucune correspondance, retourner des coordonnées aléatoires autour de Dakar
    return [{
      lieu: address,
      latitude: 14.6937 + (Math.random() - 0.5) * 2,
      longitude: -17.4441 + (Math.random() - 0.5) * 2,
      formatted_address: address
    }];
  }

  private static simulateDistance(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): DistanceResult {
    // Calcul approximatif de la distance à vol d'oiseau
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(destination.latitude - origin.latitude);
    const dLon = this.toRadians(destination.longitude - origin.longitude);
    const lat1 = this.toRadians(origin.latitude);
    const lat2 = this.toRadians(destination.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Estimation du temps de trajet (vitesse moyenne de 60 km/h)
    const duration = Math.round(distance / 60 * 60);

    return {
      distance: Math.round(distance),
      duration: duration,
      status: 'OK'
    };
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Générer une URL Google Maps pour visualiser le trajet
  public static generateMapsUrl(trajet: TrajetCoordinates): string {
    const origin = `${trajet.depart.latitude},${trajet.depart.longitude}`;
    const destination = `${trajet.arrivee.latitude},${trajet.arrivee.longitude}`;
    
    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  }

  // Générer le code HTML pour intégrer une carte
  public static generateMapEmbed(
    trajet: TrajetCoordinates, 
    width: number = 600, 
    height: number = 400
  ): string {
    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      return `
        <div style="width: ${width}px; height: ${height}px; background: #f0f0f0; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
          <p>Carte Google Maps<br/>
          De: ${trajet.depart.lieu}<br/>
          Vers: ${trajet.arrivee.lieu}</p>
        </div>
      `;
    }

    const center = `${trajet.depart.latitude},${trajet.depart.longitude}`;
    const markers = `&markers=color:green|label:D|${trajet.depart.latitude},${trajet.depart.longitude}&markers=color:red|label:A|${trajet.arrivee.latitude},${trajet.arrivee.longitude}`;
    
    return `
      <iframe
        width="${width}"
        height="${height}"
        frameborder="0"
        style="border:0"
        src="https://www.google.com/maps/embed/v1/directions?key=${this.apiKey}&origin=${trajet.depart.latitude},${trajet.depart.longitude}&destination=${trajet.arrivee.latitude},${trajet.arrivee.longitude}&avoid=tolls|highways"
        allowfullscreen>
      </iframe>
    `;
  }
}
