import { Materiel } from './Materiel';

// Classe concrète Incassable
export class Incassable extends Materiel {
  
  constructor(libelle: string, poids: number) {
    super(libelle, poids);
  }
  
  public isFragile(): boolean {
    return false;
  }
  
  public toString(): string {
    return `Produit matériel incassable: ${this.libelle} (${this.poids}kg)`;
  }
  
  public info(): void {
    console.log("=== INFORMATIONS PRODUIT MATÉRIEL INCASSABLE ===");
    console.log(`Libellé: ${this.libelle}`);
    console.log(`Type: ${this.getType()}`);
    console.log(`Sous-type: Incassable`);
    console.log(`Poids: ${this.poids}kg`);
    console.log(`Transport autorisé: Routier, Maritime, Aérien`);
    console.log(`Tarifs: Routier (200F/kg/km), Maritime (400F/kg/km), Aérien (1000F/kg)`);
    console.log("=================================================");
  }
}
