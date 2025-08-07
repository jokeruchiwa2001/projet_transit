import { Cargaison } from './Cargaison';
import { Produit } from './Produit';
import { Alimentaire } from './Alimentaire';
import { Chimique } from './Chimique';
import { Materiel } from './Materiel';
import { Fragile } from './Fragile';

// Classe concrète Maritime
export class Maritime extends Cargaison {
  
  constructor(id: string, distance: number) {
    super(id, distance);
  }
  
  public getType(): string {
    return "maritime";
  }
  
  public verifierContraintesAjout(produit: Produit): void {
    // Les produits fragiles ne peuvent pas être transportés par mer
    if (produit instanceof Fragile) {
      throw new Error("Les produits fragiles ne peuvent pas être transportés par voie maritime");
    }
  }
  
  public calculerProduit(produit: Produit): number {
    if (produit instanceof Alimentaire) {
      // 50F/kg/km
      return produit.poids * this.distance * 50;
    } else if (produit instanceof Chimique) {
      // 500F/kg pour chaque degré de toxicité
      return produit.poids * 500 * produit.degreToxicite;
    } else if (produit instanceof Materiel) {
      // 400F/kg/km
      return produit.poids * this.distance * 400;
    } else {
      throw new Error("Type de produit non reconnu");
    }
  }
  
  public calculerFraisSupplementaires(): number {
    let frais = 0;
    
    // Frais de chargement maritime pour les produits alimentaires
    if (this.hasProduitsAlimentaires()) {
      frais += 5000;
    }
    
    // Frais d'entretien pour les produits chimiques
    if (this.hasProduitsChimiques()) {
      frais += 10000;
    }
    
    return frais;
  }
}
