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

export type EtatColis = 'EN_ATTENTE' | 'EN_COURS' | 'ARRIVE' | 'RECUPERE' | 'PERDU' | 'ARCHIVE' | 'ANNULE';

export class Colis {
  private _id: string;
  private _expediteur: ClientData;
  private _destinataire: DestinataireData;
  private _poids: number;
  private _typeProduit: string;
  private _typeCargaison: 'maritime' | 'aerienne' | 'routiere';
  private _prixCalcule: number;
  private _prixFinal: number;
  private _etat: EtatColis;
  private _cargaisonId: string;
  private _dateCreation: Date;
  private _dateArrivee?: Date;
  private _codeDestinataire: string;
  private _nombreColis: number;

  constructor(
    expediteur: ClientData,
    destinataire: DestinataireData,
    poids: number,
    typeProduit: string,
    typeCargaison: 'maritime' | 'aerienne' | 'routiere',
    nombreColis: number,
    cargaisonId: string
  ) {
    this._id = this.generateId();
    this._expediteur = expediteur;
    this._destinataire = destinataire;
    this._poids = poids;
    this._typeProduit = typeProduit;
    this._typeCargaison = typeCargaison;
    this._nombreColis = nombreColis;
    this._cargaisonId = cargaisonId;
    this._etat = 'EN_ATTENTE';
    this._dateCreation = new Date();
    this._codeDestinataire = this.generateCodeDestinataire();
    this._prixCalcule = this.calculerPrix();
    this._prixFinal = this.appliquerPrixMinimum();
  }

  // Getters
  public get id(): string { return this._id; }
  public get expediteur(): ClientData { return this._expediteur; }
  public get destinataire(): DestinataireData { return this._destinataire; }
  public get poids(): number { return this._poids; }
  public get typeProduit(): string { return this._typeProduit; }
  public get typeCargaison(): 'maritime' | 'aerienne' | 'routiere' { return this._typeCargaison; }
  public get prixCalcule(): number { return this._prixCalcule; }
  public get prixFinal(): number { return this._prixFinal; }
  public get etat(): EtatColis { return this._etat; }
  public get cargaisonId(): string { return this._cargaisonId; }
  public get dateCreation(): Date { return this._dateCreation; }
  public get dateArrivee(): Date | undefined { return this._dateArrivee; }
  public get codeDestinataire(): string { return this._codeDestinataire; }
  public get nombreColis(): number { return this._nombreColis; }

  // Méthodes de gestion d'état
  public changerEtat(nouvelEtat: EtatColis): void {
    // Vérifications des transitions d'état valides
    if (this._etat === 'ARCHIVE' && nouvelEtat !== 'ARCHIVE') {
      throw new Error("Un colis archivé ne peut pas changer d'état");
    }
    
    if (this._etat === 'ANNULE' && nouvelEtat !== 'ANNULE') {
      throw new Error("Un colis annulé ne peut pas changer d'état");
    }

    this._etat = nouvelEtat;
    
    if (nouvelEtat === 'ARRIVE') {
      this._dateArrivee = new Date();
    }
  }

  public peutEtreAnnule(): boolean {
    return this._etat === 'EN_ATTENTE';
  }

  public annuler(): void {
    if (!this.peutEtreAnnule()) {
      throw new Error("Ce colis ne peut plus être annulé");
    }
    this._etat = 'ANNULE';
  }

  public marquerCommePerdu(): void {
    this._etat = 'PERDU';
  }

  public marquerCommeRecupere(): void {
    if (this._etat !== 'ARRIVE') {
      throw new Error("Le colis doit être arrivé avant d'être récupéré");
    }
    this._etat = 'RECUPERE';
  }

  public archiver(): void {
    if (this._etat !== 'RECUPERE' && this._etat !== 'PERDU') {
      throw new Error("Seuls les colis récupérés ou perdus peuvent être archivés");
    }
    this._etat = 'ARCHIVE';
  }

  // Calcul des prix selon le tableau de tarifs fourni
  private calculerPrix(): number {
    // Récupérer la distance de la cargaison (en kilomètres)
    const distance = this.obtenirDistanceCargaison();
    let prixBase = 0;
    let autresFrais = 0;
    
    // Tarifs selon produit et type de cargaison
    switch (this._typeProduit.toLowerCase()) {
      case 'alimentaire':
        switch (this._typeCargaison) {
          case 'routiere':
            prixBase = this._poids * 100 * distance; // 100F/kg/km
            break;
          case 'maritime':
            prixBase = this._poids * 90 * distance; // 90F/kg/km
            autresFrais = 5000; // 5000F changement maritime
            break;
          case 'aerienne':
            prixBase = this._poids * 300 * distance; // 300F/kg/km
            break;
        }
        break;
        
      case 'chimique':
        switch (this._typeCargaison) {
          case 'routiere':
            throw new Error('Transport routier non autorisé pour les produits chimiques');
          case 'maritime':
            prixBase = this._poids * 500; // 500F/kg pour chaque degré
            autresFrais = 10000; // 10,000F entretien
            break;
          case 'aerienne':
            throw new Error('Transport aérien non autorisé pour les produits chimiques');
        }
        break;
        
      case 'materiel':
        switch (this._typeCargaison) {
          case 'routiere':
            prixBase = this._poids * 200 * distance; // 200F/kg/km
            break;
          case 'maritime':
            prixBase = this._poids * 400 * distance; // 400F/kg/km
            break;
          case 'aerienne':
            prixBase = this._poids * 1000; // 1000F/kg (forfaitaire)
            break;
        }
        break;
        
      default:
        throw new Error(`Type de produit non reconnu: ${this._typeProduit}`);
    }

    return (prixBase + autresFrais) * this._nombreColis;
  }

  // Méthode pour obtenir la distance de la cargaison assignée
  private obtenirDistanceCargaison(): number {
    // Import dynamique pour éviter les dépendances circulaires
    const { DataManager } = require('../Storage/DataManager');
    try {
      const cargaisonData = DataManager.getCargaisonById(this._cargaisonId);
      return cargaisonData ? cargaisonData.distance || 1 : 1;
    } catch {
      return 1; // Distance par défaut
    }
  }

  private appliquerPrixMinimum(): number {
    const PRIX_MINIMUM = 10000;
    return Math.max(this._prixCalcule, PRIX_MINIMUM);
  }

  // Génération d'identifiants
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `COL-${timestamp}${random}`.toUpperCase();
  }

  private generateCodeDestinataire(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  // Méthodes utilitaires
  public genererRecu(): string {
    return `
=== REÇU D'EXPÉDITION ===
Code colis: ${this._id}
Code destinataire: ${this._codeDestinataire}

EXPÉDITEUR:
${this._expediteur.prenom} ${this._expediteur.nom}
${this._expediteur.adresse}
Tél: ${this._expediteur.telephone}
${this._expediteur.email ? 'Email: ' + this._expediteur.email : ''}

DESTINATAIRE:
${this._destinataire.nomComplet}
${this._destinataire.adresse}
Tél: ${this._destinataire.telephone}

DÉTAILS DU COLIS:
Nombre de colis: ${this._nombreColis}
Poids total: ${this._poids} kg
Type de produit: ${this._typeProduit}
Type de transport: ${this._typeCargaison}

TARIFICATION:
Prix calculé: ${this._prixCalcule.toLocaleString()} FCFA
Prix final: ${this._prixFinal.toLocaleString()} FCFA

Date d'expédition: ${this._dateCreation.toLocaleDateString()}
=========================
    `;
  }

  public toJSON(): any {
    return {
      id: this._id,
      expediteur: this._expediteur,
      destinataire: this._destinataire,
      poids: this._poids,
      typeProduit: this._typeProduit,
      typeCargaison: this._typeCargaison,
      prixCalcule: this._prixCalcule,
      prixFinal: this._prixFinal,
      etat: this._etat,
      cargaisonId: this._cargaisonId,
      dateCreation: this._dateCreation.toISOString(),
      dateArrivee: this._dateArrivee?.toISOString(),
      codeDestinataire: this._codeDestinataire,
      nombreColis: this._nombreColis
    };
  }

  public static fromJSON(data: any): Colis {
    const colis = new Colis(
      data.expediteur,
      data.destinataire,
      data.poids,
      data.typeProduit,
      data.typeCargaison,
      data.nombreColis,
      data.cargaisonId
    );
    
    colis._id = data.id;
    colis._etat = data.etat;
    colis._dateCreation = new Date(data.dateCreation);
    colis._dateArrivee = data.dateArrivee ? new Date(data.dateArrivee) : undefined;
    colis._codeDestinataire = data.codeDestinataire;
    colis._prixCalcule = data.prixCalcule;
    colis._prixFinal = data.prixFinal;
    
    return colis;
  }
}
