import { Cargaison } from './Cargaison';
import { Produit } from './Produit';
import { Alimentaire } from './Alimentaire';
import { Chimique } from './Chimique';
import { Materiel } from './Materiel';

// Classe concrète Aerienne
export class Aerienne extends Cargaison {
  
  constructor(id: string, distance: number) {
    super(id, distance);
  }
  
  public getType(): string {
    return "aerienne";
  }
  
  public verifierContraintesAjout(produit: Produit): void {
    // Les produits chimiques ne peuvent pas être transportés par air
    if (produit instanceof Chimique) {
      throw new Error("Les produits chimiques ne peuvent pas être transportés par voie aérienne");
    }
  }
  
  public calculerProduit(produit: Produit): number {
    if (produit instanceof Alimentaire) {
      // 300F/kg/km
      return produit.poids * this.distance * 300;
    } else if (produit instanceof Materiel) {
      // 1000F/kg (pas de distance)
      return produit.poids * 1000;
    } else {
      throw new Error("Type de produit non supporté pour le transport aérien");
    }
  }
  
  public calculerFraisSupplementaires(): number {
    return 0; // Pas de frais supplémentaires pour l'aérien
  }
}
