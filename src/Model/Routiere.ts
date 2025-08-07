import { Cargaison } from './Cargaison';
import { Produit } from './Produit';
import { Alimentaire } from './Alimentaire';
import { Chimique } from './Chimique';
import { Materiel } from './Materiel';

// Classe concrète Routiere
export class Routiere extends Cargaison {
  
  constructor(id: string, distance: number) {
    super(id, distance);
  }
  
  public getType(): string {
    return "routiere";
  }
  
  public verifierContraintesAjout(produit: Produit): void {
    // Les produits chimiques ne peuvent pas être transportés par route
    if (produit instanceof Chimique) {
      throw new Error("Les produits chimiques ne peuvent pas être transportés par voie routière");
    }
  }
  
  public calculerProduit(produit: Produit): number {
    if (produit instanceof Alimentaire) {
      // 100F/kg/km
      return produit.poids * this.distance * 100;
    } else if (produit instanceof Materiel) {
      // 200F/kg/km
      return produit.poids * this.distance * 200;
    } else {
      throw new Error("Type de produit non supporté pour le transport routier");
    }
  }
  
  public calculerFraisSupplementaires(): number {
    return 0; // Pas de frais supplémentaires pour le routier
  }
}
