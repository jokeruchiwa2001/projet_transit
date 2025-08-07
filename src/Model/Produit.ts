// Classe abstraite Produit - ne peut pas être instanciée
export abstract class Produit {
  private _libelle: string;
  private _poids: number;
  
  constructor(libelle: string, poids: number) {
    if (!libelle || libelle.trim() === "") {
      throw new Error("Le libellé ne peut pas être vide");
    }
    if (poids <= 0) {
      throw new Error("Le poids doit être positif");
    }
    this._libelle = libelle;
    this._poids = poids;
  }
  
  // Accesseurs (getters)
  public get libelle(): string {
    return this._libelle;
  }
  
  public get poids(): number {
    return this._poids;
  }
  
  // Mutateurs (setters)
  public set libelle(libelle: string) {
    if (!libelle || libelle.trim() === "") {
      throw new Error("Le libellé ne peut pas être vide");
    }
    this._libelle = libelle;
  }
  
  public set poids(poids: number) {
    if (poids <= 0) {
      throw new Error("Le poids doit être positif");
    }
    this._poids = poids;
  }
  
  // Méthodes abstraites à implémenter par les classes filles
  public abstract getType(): string;
  public abstract toString(): string;
}
