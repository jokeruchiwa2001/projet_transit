import { Produit } from './Produit';

// Classe concrète Chimique
export class Chimique extends Produit {
  private _degreToxicite: number;
  
  constructor(libelle: string, poids: number, degreToxicite: number) {
    super(libelle, poids);
    if (degreToxicite < 1 || degreToxicite > 10) {
      throw new Error("Le degré de toxicité doit être entre 1 et 10");
    }
    this._degreToxicite = degreToxicite;
  }
  
  // Accesseur pour degré de toxicité
  public get degreToxicite(): number {
    return this._degreToxicite;
  }
  
  // Mutateur pour degré de toxicité
  public set degreToxicite(degre: number) {
    if (degre < 1 || degre > 10) {
      throw new Error("Le degré de toxicité doit être entre 1 et 10");
    }
    this._degreToxicite = degre;
  }
  
  public getType(): string {
    return "chimique";
  }
  
  public toString(): string {
    return `Produit chimique: ${this.libelle} (${this.poids}kg, toxicité: ${this.degreToxicite}/10)`;
  }
  
  public info(): void {
    console.log("=== INFORMATIONS PRODUIT CHIMIQUE ===");
    console.log(`Libellé: ${this.libelle}`);
    console.log(`Type: ${this.getType()}`);
    console.log(`Poids: ${this.poids}kg`);
    console.log(`Degré de toxicité: ${this.degreToxicite}/10`);
    console.log(`Transport autorisé: Maritime UNIQUEMENT`);
    console.log(`Calcul: ${this.poids}kg × 500F × ${this.degreToxicite} = ${this.poids * 500 * this.degreToxicite}F`);
    console.log(`Frais supplémentaires: Entretien (+10000F)`);
    console.log("======================================");
  }
}
