import { Cargaison, TrajetCoordinates, EtatAvancement, EtatGlobal } from '../Model/Cargaison';
import { Aerienne } from '../Model/Aerienne';
import { Maritime } from '../Model/Maritime';
import { Routiere } from '../Model/Routiere';
import { Colis, ClientData, DestinataireData, EtatColis } from '../Model/Colis';
import { DataManager, CargaisonData, ColisData } from '../Storage/DataManager';
import { GoogleMapsService } from './GoogleMapsService';

export interface CritereRechercheCargaison {
  code?: string;
  lieuDepart?: string;
  lieuArrivee?: string;
  dateDepart?: Date;
  dateArrivee?: Date;
  type?: 'maritime' | 'aerienne' | 'routiere';
}

export interface StatistiquesCargaison {
  totalCargaisons: number;
  cargaisonsOuvertes: number;
  cargaisonsFermees: number;
  cargaisonsEnCours: number;
  totalColis: number;
  colisEnAttente: number;
  colisEnCours: number;
  colisArrivees: number;
  colisRecuperes: number;
  colisPerdus: number;
  revenuTotal: number;
}

export class CargaisonService {
  
  // Création de cargaisons
  public static async creerCargaison(
    type: 'maritime' | 'aerienne' | 'routiere',
    lieuDepart: string,
    lieuArrivee: string,
    poidsMax?: number
  ): Promise<Cargaison> {
    try {
      // Créer le trajet avec Google Maps
      const trajetInfo = await GoogleMapsService.createTrajet(lieuDepart, lieuArrivee);
      
      const trajet: TrajetCoordinates = {
        depart: trajetInfo.depart,
        arrivee: trajetInfo.arrivee
      };

      const id = DataManager.generateId('CG');
      let cargaison: Cargaison;

      switch (type) {
        case 'aerienne':
          cargaison = new Aerienne(id, trajetInfo.distance);
          break;
        case 'maritime':
          cargaison = new Maritime(id, trajetInfo.distance);
          break;
        case 'routiere':
          cargaison = new Routiere(id, trajetInfo.distance);
          break;
        default:
          throw new Error('Type de cargaison non supporté');
      }

      cargaison.setTrajet(trajet);
      if (poidsMax) {
        cargaison.setPoidsMax(poidsMax);
      }

      // Sauvegarder en JSON
      const cargaisonData: CargaisonData = {
        id: cargaison.id,
        numero: cargaison.numero,
        poidsMax: cargaison.poidsMax,
        trajet: trajet,
        distance: trajetInfo.distance,
        type: type,
        etatAvancement: cargaison.etatAvancement,
        etatGlobal: cargaison.etatGlobal,
        dateCreation: cargaison.dateCreation.toISOString(),
        produits: [],
        colisIds: [],
        prixTotal: 0
      };

      DataManager.saveCargaison(cargaisonData);
      return cargaison;
    } catch (error) {
      console.error('Erreur lors de la création de la cargaison:', error);
      throw error;
    }
  }

  // Gestion des colis
  public static creerColis(
    expediteur: ClientData,
    destinataire: DestinataireData,
    poids: number,
    typeProduit: string,
    typeCargaison: 'maritime' | 'aerienne' | 'routiere',
    nombreColis: number,
    cargaisonId: string
  ): Colis {
    // Le gestionnaire DOIT obligatoirement choisir une cargaison
    if (!cargaisonId) {
      throw new Error('Le gestionnaire doit obligatoirement sélectionner une cargaison');
    }

    // Vérifier que la cargaison existe et est valide
    const cargaisonData = DataManager.getCargaisonById(cargaisonId);
    if (!cargaisonData) {
      throw new Error(`Cargaison avec l'ID ${cargaisonId} introuvable`);
    }
    
    if (cargaisonData.etatGlobal !== 'OUVERT') {
      throw new Error('La cargaison sélectionnée n\'est pas ouverte');
    }
    
    if (cargaisonData.type !== typeCargaison) {
      throw new Error(`Type de cargaison incompatible. Attendu: ${typeCargaison}, trouvé: ${cargaisonData.type}`);
    }
    
    // Reconstituer l'objet Cargaison
    let cargaisonCible: Cargaison;
    switch (cargaisonData.type) {
      case 'maritime':
        cargaisonCible = new Maritime(cargaisonData.id, cargaisonData.distance);
        break;
      case 'aerienne':
        cargaisonCible = new Aerienne(cargaisonData.id, cargaisonData.distance);
        break;
      case 'routiere':
        cargaisonCible = new Routiere(cargaisonData.id, cargaisonData.distance);
        break;
      default:
        throw new Error('Type de cargaison inconnu');
    }
    
    // Copier les propriétés nécessaires
    Object.assign(cargaisonCible, {
      numero: cargaisonData.numero,
      poidsMax: cargaisonData.poidsMax,
      trajet: cargaisonData.trajet,
      etatGlobal: cargaisonData.etatGlobal,
      etatAvancement: cargaisonData.etatAvancement
    });

    const colis = new Colis(
      expediteur,
      destinataire,
      poids,
      typeProduit,
      typeCargaison,
      nombreColis,
      cargaisonCible.id
    );

    // Vérifier que le poids n'excède pas la capacité de la cargaison
    const colisExistants = DataManager.getColisParCargaison(cargaisonCible.id);
    const poidsActuel = colisExistants.reduce((total, c) => total + c.poids, 0);
    
    if (poidsActuel + poids > cargaisonCible.poidsMax) {
      throw new Error('Le poids du colis dépasse la capacité restante de la cargaison');
    }

    // Sauvegarder le colis
    DataManager.saveColis(colis.toJSON());

    // Mettre à jour la cargaison dans le stockage
    const cargaisonDataUpdate = DataManager.getCargaisonById(cargaisonCible.id);
    if (cargaisonDataUpdate) {
      cargaisonDataUpdate.colisIds.push(colis.id);
      cargaisonDataUpdate.prixTotal += colis.prixFinal;
      DataManager.saveCargaison(cargaisonDataUpdate);
    }

    // Sauvegarder le client s'il n'existe pas déjà
    const clientId = DataManager.generateId('CLI');
    DataManager.saveClient({ ...expediteur, id: clientId });

    return colis;
  }

  // Recherche de colis
  public static rechercherColisByCode(code: string): ColisData | null {
    return DataManager.getColisByCode(code);
  }

  // Recherche de cargaisons
  public static rechercherCargaisons(criteres: CritereRechercheCargaison): CargaisonData[] {
    const searchCriteria: any = {};
    
    if (criteres.code) searchCriteria.code = criteres.code;
    if (criteres.lieuDepart) searchCriteria.lieuDepart = criteres.lieuDepart;
    if (criteres.lieuArrivee) searchCriteria.lieuArrivee = criteres.lieuArrivee;
    if (criteres.type) searchCriteria.type = criteres.type;
    if (criteres.dateDepart) searchCriteria.dateDepart = criteres.dateDepart.toISOString();

    return DataManager.searchCargaisons(searchCriteria);
  }

  // Gestion des états des colis
  public static changerEtatColis(colisId: string, nouvelEtat: EtatColis): boolean {
    return DataManager.updateColisEtat(colisId, nouvelEtat);
  }

  public static recupererColis(colisId: string): boolean {
    return DataManager.updateColisEtat(colisId, 'RECUPERE');
  }

  public static marquerColisCommePerdu(colisId: string): boolean {
    return DataManager.updateColisEtat(colisId, 'PERDU');
  }

  public static archiverColis(colisId: string): boolean {
    const colis = DataManager.getColisByCode(colisId);
    if (!colis) return false;
    
    if (colis.etat === 'RECUPERE' || colis.etat === 'PERDU') {
      return DataManager.updateColisEtat(colisId, 'ARCHIVE');
    }
    
    return false;
  }

  // Gestion des cargaisons
  public static fermerCargaison(cargaisonId: string): boolean {
    const cargaison = DataManager.getCargaisonById(cargaisonId);
    if (!cargaison) return false;

    if (cargaison.etatGlobal === 'FERME') {
      throw new Error('La cargaison est déjà fermée');
    }

    // Vérifier qu'il y a au moins un colis dans la cargaison
    const colis = DataManager.getColisParCargaison(cargaisonId);
    if (colis.length === 0) {
      throw new Error('Impossible de fermer une cargaison vide. Ajoutez au moins un colis avant de fermer.');
    }

    cargaison.etatGlobal = 'FERME';
    DataManager.saveCargaison(cargaison);
    return true;
  }

  public static rouvrirCargaison(cargaisonId: string): boolean {
    const cargaison = DataManager.getCargaisonById(cargaisonId);
    if (!cargaison) return false;

    if (cargaison.etatAvancement !== 'EN_ATTENTE') {
      throw new Error('Une cargaison ne peut être rouverte que si elle est en attente');
    }

    cargaison.etatGlobal = 'OUVERT';
    DataManager.saveCargaison(cargaison);
    return true;
  }

  public static demarrerCargaison(cargaisonId: string, dateDepart?: Date): boolean {
    const cargaison = DataManager.getCargaisonById(cargaisonId);
    if (!cargaison) return false;

    // Vérifier qu'il y a au moins un colis dans la cargaison
    const colis = DataManager.getColisParCargaison(cargaisonId);
    if (colis.length === 0) {
      throw new Error('Impossible de démarrer une cargaison vide. Ajoutez au moins un colis avant le départ.');
    }

    cargaison.etatAvancement = 'EN_COURS';
    cargaison.dateDepart = (dateDepart || new Date()).toISOString();
    
    // Mettre tous les colis de cette cargaison en cours
    colis.forEach(c => {
      if (c.etat === 'EN_ATTENTE') {
        DataManager.updateColisEtat(c.id, 'EN_COURS');
      }
    });

    DataManager.saveCargaison(cargaison);
    return true;
  }

  public static marquerCargaisonArrivee(cargaisonId: string, dateArrivee?: Date): boolean {
    const cargaison = DataManager.getCargaisonById(cargaisonId);
    if (!cargaison) return false;

    cargaison.etatAvancement = 'ARRIVE';
    cargaison.dateArriveeReelle = (dateArrivee || new Date()).toISOString();
    
    // Mettre tous les colis de cette cargaison comme arrivés
    const colis = DataManager.getColisParCargaison(cargaisonId);
    colis.forEach(c => {
      if (c.etat === 'EN_COURS') {
        DataManager.updateColisEtat(c.id, 'ARRIVE');
      }
    });

    DataManager.saveCargaison(cargaison);
    return true;
  }

  // Suivi des colis pour les clients
  public static suivreColis(code: string): {
    colis: ColisData | null;
    cargaison: CargaisonData | null;
    statut: string;
    message: string;
  } {
    const colis = this.rechercherColisByCode(code);
    
    if (!colis) {
      return {
        colis: null,
        cargaison: null,
        statut: 'NOT_FOUND',
        message: 'Code de colis non trouvé ou colis annulé'
      };
    }

    const cargaison = DataManager.getCargaisonById(colis.cargaisonId);
    let message = '';

    switch (colis.etat) {
      case 'EN_ATTENTE':
        message = 'Votre colis est en attente de départ';
        break;
      case 'EN_COURS':
        if (cargaison?.dateArriveePrevu) {
          const dateArrivee = new Date(cargaison.dateArriveePrevu);
          const maintenant = new Date();
          const diffJours = Math.ceil((dateArrivee.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffJours > 0) {
            message = `Votre colis arrivera dans ${diffJours} jour(s)`;
          } else if (diffJours < 0) {
            message = `Votre colis est en retard de ${Math.abs(diffJours)} jour(s)`;
          } else {
            message = 'Votre colis devrait arriver aujourd\'hui';
          }
        } else {
          message = 'Votre colis est en cours de transport';
        }
        break;
      case 'ARRIVE':
        message = 'Votre colis est arrivé et peut être récupéré';
        break;
      case 'RECUPERE':
        message = 'Votre colis a été récupéré';
        break;
      case 'PERDU':
        message = 'Votre colis est malheureusement perdu';
        break;
      case 'ARCHIVE':
        message = 'Votre colis a été archivé';
        break;
      case 'ANNULE':
        message = 'Votre colis a été annulé';
        break;
      default:
        message = 'État du colis inconnu';
    }

    return {
      colis,
      cargaison,
      statut: colis.etat,
      message
    };
  }

  // Archivage automatique
  public static archiverColisAutomatiquement(): number {
    const colis = DataManager.loadColis();
    let archivesCount = 0;
    
    // Les paramètres d'archivage (à configurer selon les besoins)
    const JOURS_AVANT_ARCHIVAGE = 30;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - JOURS_AVANT_ARCHIVAGE);

    colis.forEach(c => {
      if (c.etat === 'RECUPERE' && c.dateArrivee) {
        const dateArrivee = new Date(c.dateArrivee);
        if (dateArrivee < dateLimit) {
          DataManager.updateColisEtat(c.id, 'ARCHIVE');
          archivesCount++;
        }
      }
    });

    return archivesCount;
  }

  // Statistiques
  public static obtenirStatistiques(): StatistiquesCargaison {
    const cargaisons = DataManager.loadCargaisons();
    const colis = DataManager.loadColis();

    return {
      totalCargaisons: cargaisons.length,
      cargaisonsOuvertes: cargaisons.filter(c => c.etatGlobal === 'OUVERT').length,
      cargaisonsFermees: cargaisons.filter(c => c.etatGlobal === 'FERME').length,
      cargaisonsEnCours: cargaisons.filter(c => c.etatAvancement === 'EN_COURS').length,
      totalColis: colis.length,
      colisEnAttente: colis.filter(c => c.etat === 'EN_ATTENTE').length,
      colisEnCours: colis.filter(c => c.etat === 'EN_COURS').length,
      colisArrivees: colis.filter(c => c.etat === 'ARRIVE').length,
      colisRecuperes: colis.filter(c => c.etat === 'RECUPERE').length,
      colisPerdus: colis.filter(c => c.etat === 'PERDU').length,
      revenuTotal: colis.reduce((total, c) => total + c.prixFinal, 0)
    };
  }

  // Génération de reçu
  public static genererRecu(colisId: string): string | null {
    const colisData = DataManager.getColisByCode(colisId);
    if (!colisData) return null;

    const colis = Colis.fromJSON(colisData);
    return colis.genererRecu();
  }

  // Utilitaires
  public static obtenirToutesLesCargaisons(): CargaisonData[] {
    return DataManager.loadCargaisons();
  }

  public static obtenirTousLesColis(): ColisData[] {
    return DataManager.loadColis();
  }

  public static obtenirColisParCargaison(cargaisonId: string): ColisData[] {
    return DataManager.getColisParCargaison(cargaisonId);
  }

  public static obtenirCargaisonParId(cargaisonId: string): CargaisonData | null {
    return DataManager.getCargaisonById(cargaisonId);
  }

  // Méthodes utilitaires pour les cargaisons disponibles
  public static obtenirPoidsUtilise(cargaisonId: string): number {
    const colis = DataManager.getColisParCargaison(cargaisonId);
    return colis.reduce((total, c) => total + c.poids, 0);
  }

  public static obtenirNombreColisCargaison(cargaisonId: string): number {
    const colis = DataManager.getColisParCargaison(cargaisonId);
    return colis.length;
  }
}
