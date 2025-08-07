import { Produit } from './Produit';
import { Alimentaire } from './Alimentaire';
import { Chimique } from './Chimique';

// Types pour les coordonnées géographiques
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

// Types pour les états
export type EtatAvancement = 'EN_ATTENTE' | 'EN_COURS' | 'ARRIVE' | 'RETARD';
export type EtatGlobal = 'OUVERT' | 'FERME';

// Classe abstraite Cargaison - ne peut pas être instanciée
export abstract class Cargaison {
  private _id: string;
  private _numero: string;
  private _poidsMax: number;
  private _produits: Produit[];
  private _trajet?: TrajetCoordinates;
  private _distance: number;
  private _etatAvancement: EtatAvancement;
  private _etatGlobal: EtatGlobal;
  private _dateCreation: Date;
  private _dateDepart?: Date;
  private _dateArriveePrevu?: Date;
  private _dateArriveeReelle?: Date;
  
  constructor(id: string, distance: number) {
    if (!id || id.trim() === "") {
      throw new Error("L'ID de la cargaison ne peut pas être vide");
    }
    if (distance <= 0) {
      throw new Error("La distance doit être positive");
    }
    
    this._id = id;
    this._numero = this.generateNumero();
    this._poidsMax = 1000; // Valeur par défaut
    this._produits = [];
    this._distance = distance;
    this._etatAvancement = 'EN_ATTENTE';
    this._etatGlobal = 'OUVERT';
    this._dateCreation = new Date();
  }
  
  // Accesseurs (getters)
  public get id(): string {
    return this._id;
  }
  
  public get numero(): string {
    return this._numero;
  }
  
  public get poidsMax(): number {
    return this._poidsMax;
  }
  
  public get produits(): Produit[] {
    return [...this._produits];
  }
  
  public get trajet(): TrajetCoordinates | undefined {
    return this._trajet;
  }
  
  public get distance(): number {
    return this._distance;
  }
  
  public get etatAvancement(): EtatAvancement {
    return this._etatAvancement;
  }
  
  public get etatGlobal(): EtatGlobal {
    return this._etatGlobal;
  }
  
  public get dateCreation(): Date {
    return this._dateCreation;
  }
  
  public get dateDepart(): Date | undefined {
    return this._dateDepart;
  }
  
  public get dateArriveePrevu(): Date | undefined {
    return this._dateArriveePrevu;
  }
  
  public get dateArriveeReelle(): Date | undefined {
    return this._dateArriveeReelle;
  }
  
  // Mutateurs (setters)
  public setTrajet(trajet: TrajetCoordinates): void {
    this._trajet = trajet;
  }
  
  public setPoidsMax(poidsMax: number): void {
    if (poidsMax <= 0) {
      throw new Error("Le poids maximum doit être positif");
    }
    this._poidsMax = poidsMax;
  }
  
  public setEtatAvancement(etat: EtatAvancement): void {
    this._etatAvancement = etat;
  }
  
  public fermer(): void {
    if (this._etatGlobal === 'FERME') {
      throw new Error("La cargaison est déjà fermée");
    }
    this._etatGlobal = 'FERME';
  }
  
  public rouvrir(): void {
    if (this._etatAvancement !== 'EN_ATTENTE') {
      throw new Error("Une cargaison ne peut être rouverte que si elle est en attente");
    }
    this._etatGlobal = 'OUVERT';
  }
  
  public setDateDepart(date: Date): void {
    this._dateDepart = date;
    this._etatAvancement = 'EN_COURS';
  }
  
  public setDateArriveePrevu(date: Date): void {
    this._dateArriveePrevu = date;
  }
  
  public setDateArriveeReelle(date: Date): void {
    this._dateArriveeReelle = date;
    this._etatAvancement = 'ARRIVE';
  }
  
  // Méthodes communes à toutes les cargaisons
  public ajouterProduit(produit: Produit): void {
    if (this._etatGlobal === 'FERME') {
      throw new Error("Impossible d'ajouter des produits à une cargaison fermée");
    }
    
    if (this._produits.length >= 10) {
      throw new Error("Une cargaison ne peut pas contenir plus de 10 produits");
    }
    
    if (this.getPoidsTotal() + produit.poids > this._poidsMax) {
      throw new Error("Le poids total dépasserait le poids maximum autorisé");
    }
    
    this.verifierContraintesAjout(produit);
    this._produits.push(produit);
  }
  
  public nbProduit(): number {
    return this._produits.length;
  }
  
  public sommeTotale(): number {
    let total = 0;
    for (const produit of this._produits) {
      total += this.calculerProduit(produit);
    }
    total += this.calculerFraisSupplementaires();
    return total;
  }
  
  // Méthodes abstraites à implémenter par les classes filles
  public abstract getType(): string;
  public abstract calculerProduit(produit: Produit): number;
  public abstract verifierContraintesAjout(produit: Produit): void;
  public abstract calculerFraisSupplementaires(): number;
  
  // Méthodes utilitaires
  public hasProduitsAlimentaires(): boolean {
    return this._produits.some(p => p instanceof Alimentaire);
  }
  
  public hasProduitsChimiques(): boolean {
    return this._produits.some(p => p instanceof Chimique);
  }
  
  public getPoidsTotal(): number {
    return this._produits.reduce((total, produit) => total + produit.poids, 0);
  }
  
  public generateNumero(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    return `CG-${timestamp}${random}`.toUpperCase();
  }
  
  public isRetard(): boolean {
    if (!this._dateArriveePrevu || this._etatAvancement === 'ARRIVE') {
      return false;
    }
    return new Date() > this._dateArriveePrevu && this._etatAvancement === 'EN_COURS';
  }
  
  public getJoursRetard(): number {
    if (!this.isRetard() || !this._dateArriveePrevu) {
      return 0;
    }
    const diff = Date.now() - this._dateArriveePrevu.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  
  public toString(): string {
    const produitsStr = this._produits.map(p => `  - ${p.toString()}`).join('\n');
    const trajetStr = this._trajet ? 
      `${this._trajet.depart.lieu} → ${this._trajet.arrivee.lieu}` : 
      'Trajet non défini';
    return `Cargaison ${this._numero} (${this.getType()}, ${this._distance}km):\nTrajet: ${trajetStr}\nÉtat: ${this._etatAvancement} (${this._etatGlobal})\n${produitsStr}`;
  }
}
