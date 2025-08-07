import * as fs from 'fs';
import * as path from 'path';

// Types pour le stockage
export interface TrajetCoordinates {
  depart: {
    lieu: string;
    latitude: number;
    longitude: number;
  };
  arrivee: {
    lieu: string;
    latitude: number;
    longitude: number;
  };
}

export interface ColisData {
  id: string;
  expediteur: ClientData;
  destinataire: DestinataireData;
  produits: any[];
  poids: number;
  typeProduit: string;
  typeCargaison: string;
  prixCalcule: number;
  prixFinal: number; // Minimum 10,000 FCFA
  etat: 'EN_ATTENTE' | 'EN_COURS' | 'ARRIVE' | 'RECUPERE' | 'PERDU' | 'ARCHIVE' | 'ANNULE';
  cargaisonId: string;
  dateCreation: string;
  dateArrivee?: string;
  codeDestinataire: string;
}

export interface ClientData {
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  email?: string;
}

export interface DestinataireData {
  nomComplet: string;
  telephone: string;
  adresse: string;
}

export interface CargaisonData {
  id: string;
  numero: string;
  poidsMax: number;
  trajet: TrajetCoordinates;
  distance: number;
  type: 'maritime' | 'aerienne' | 'routiere';
  etatAvancement: 'EN_ATTENTE' | 'EN_COURS' | 'ARRIVE' | 'RETARD';
  etatGlobal: 'OUVERT' | 'FERME';
  dateCreation: string;
  dateDepart?: string;
  dateArriveePrevu?: string;
  dateArriveeReelle?: string;
  produits: any[];
  colisIds: string[];
  prixTotal: number;
}

export class DataManager {
  private static dataDir = path.join(process.cwd(), 'data');
  
  static {
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }
  
  // Gestion des cargaisons
  static saveCargaison(cargaison: CargaisonData): void {
    const filePath = path.join(this.dataDir, 'cargaisons.json');
    const cargaisons = this.loadCargaisons();
    
    const existingIndex = cargaisons.findIndex(c => c.id === cargaison.id);
    if (existingIndex >= 0) {
      cargaisons[existingIndex] = cargaison;
    } else {
      cargaisons.push(cargaison);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(cargaisons, null, 2));
  }
  
  static loadCargaisons(): CargaisonData[] {
    const filePath = path.join(this.dataDir, 'cargaisons.json');
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) || [];
    } catch (error) {
      console.error('Erreur lecture cargaisons:', error);
      return [];
    }
  }
  
  static getCargaisonById(id: string): CargaisonData | null {
    const cargaisons = this.loadCargaisons();
    return cargaisons.find(c => c.id === id) || null;
  }
  
  static searchCargaisons(criteria: {
    code?: string;
    lieuDepart?: string;
    lieuArrivee?: string;
    dateDepart?: string;
    dateArrivee?: string;
    type?: string;
  }): CargaisonData[] {
    const cargaisons = this.loadCargaisons();
    
    return cargaisons.filter(cargaison => {
      if (criteria.code && !cargaison.id.toLowerCase().includes(criteria.code.toLowerCase())) {
        return false;
      }
      
      if (criteria.lieuDepart && !cargaison.trajet.depart.lieu.toLowerCase().includes(criteria.lieuDepart.toLowerCase())) {
        return false;
      }
      
      if (criteria.lieuArrivee && !cargaison.trajet.arrivee.lieu.toLowerCase().includes(criteria.lieuArrivee.toLowerCase())) {
        return false;
      }
      
      if (criteria.type && cargaison.type !== criteria.type) {
        return false;
      }
      
      if (criteria.dateDepart && cargaison.dateDepart) {
        const cargaisonDate = new Date(cargaison.dateDepart).toDateString();
        const searchDate = new Date(criteria.dateDepart).toDateString();
        if (cargaisonDate !== searchDate) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  // Gestion des colis
  static saveColis(colis: ColisData): void {
    const filePath = path.join(this.dataDir, 'colis.json');
    const colisList = this.loadColis();
    
    const existingIndex = colisList.findIndex(c => c.id === colis.id);
    if (existingIndex >= 0) {
      colisList[existingIndex] = colis;
    } else {
      colisList.push(colis);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(colisList, null, 2));
  }
  
  static loadColis(): ColisData[] {
    const filePath = path.join(this.dataDir, 'colis.json');
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) || [];
    } catch (error) {
      console.error('Erreur lecture colis:', error);
      return [];
    }
  }
  
  static getColisByCode(code: string): ColisData | null {
    const colisList = this.loadColis();
    return colisList.find(c => c.id === code || c.codeDestinataire === code) || null;
  }
  
  static updateColisEtat(colisId: string, nouvelEtat: ColisData['etat']): boolean {
    const colisList = this.loadColis();
    const colisIndex = colisList.findIndex(c => c.id === colisId);
    
    if (colisIndex >= 0) {
      colisList[colisIndex].etat = nouvelEtat;
      
      if (nouvelEtat === 'ARRIVE') {
        colisList[colisIndex].dateArrivee = new Date().toISOString();
      }
      
      const filePath = path.join(this.dataDir, 'colis.json');
      fs.writeFileSync(filePath, JSON.stringify(colisList, null, 2));
      return true;
    }
    
    return false;
  }
  
  static getColisParCargaison(cargaisonId: string): ColisData[] {
    const colisList = this.loadColis();
    return colisList.filter(c => c.cargaisonId === cargaisonId);
  }
  
  // Gestion des clients
  static saveClient(client: ClientData & { id: string }): void {
    const filePath = path.join(this.dataDir, 'clients.json');
    const clients = this.loadClients();
    
    const existingIndex = clients.findIndex(c => c.id === client.id);
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(clients, null, 2));
  }
  
  static loadClients(): (ClientData & { id: string })[] {
    const filePath = path.join(this.dataDir, 'clients.json');
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) || [];
    } catch (error) {
      console.error('Erreur lecture clients:', error);
      return [];
    }
  }
  
  // Utilitaires
  static generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix.toUpperCase()}-${timestamp}${random}`.toUpperCase();
  }
  
  static generateCodeDestinataire(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  
  static calculerPrixFinal(prixCalcule: number): number {
    const PRIX_MINIMUM = 10000;
    return Math.max(prixCalcule, PRIX_MINIMUM);
  }
  
  static getStatistiques() {
    const cargaisons = this.loadCargaisons();
    const colisList = this.loadColis();
    const clients = this.loadClients();
    
    return {
      totalCargaisons: cargaisons.length,
      cargaisonsOuvertes: cargaisons.filter(c => c.etatGlobal === 'OUVERT').length,
      totalColis: colisList.length,
      colisEnCours: colisList.filter(c => c.etat === 'EN_COURS').length,
      totalClients: clients.length,
      revenuTotal: colisList.reduce((sum, c) => sum + c.prixFinal, 0)
    };
  }
}
