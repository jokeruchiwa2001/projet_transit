import { Materiel } from './Materiel';

// Classe concrète Fragile
export class Fragile extends Materiel {
  
  constructor(libelle: string, poids: number) {
    super(libelle, poids);
  }
  
  public isFragile(): boolean {
    return true;
  }
  
  public toString(): string {
    return `Produit matériel fragile: ${this.libelle} (${this.poids}kg)`;
  }
  
  public info(): void {
    console.log("=== INFORMATIONS PRODUIT MATÉRIEL FRAGILE ===");
    console.log(`Libellé: ${this.libelle}`);
    console.log(`Type: ${this.getType()}`);
    console.log(`Sous-type: Fragile`);
    console.log(`Poids: ${this.poids}kg`);
    console.log(`Transport autorisé: Routier, Aérien`);
    console.log(`Transport INTERDIT: Maritime`);
    console.log(`Tarifs: Routier (200F/kg/km), Aérien (1000F/kg)`);
    console.log("==============================================");
  }
}
