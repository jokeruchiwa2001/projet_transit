import { Produit } from './Produit';

// Classe concrète Alimentaire
export class Alimentaire extends Produit {
  
  constructor(libelle: string, poids: number) {
    super(libelle, poids);
  }
  
  public getType(): string {
    return "alimentaire";
  }
  
  public toString(): string {
    return `Produit alimentaire: ${this.libelle} (${this.poids}kg)`;
  }
  
  public info(): void {
    console.log("=== INFORMATIONS PRODUIT ALIMENTAIRE ===");
    console.log(`Libellé: ${this.libelle}`);
    console.log(`Type: ${this.getType()}`);
    console.log(`Poids: ${this.poids}kg`);
    console.log(`Transport autorisé: Routier, Maritime, Aérien`);
    console.log(`Frais supplémentaires: Chargement maritime (+5000F)`);
    console.log("==========================================");
  }
}
