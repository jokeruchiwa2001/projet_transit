import { Produit } from './Produit';

// Classe abstraite Materiel - ne peut pas être instanciée
export abstract class Materiel extends Produit {
  
  constructor(libelle: string, poids: number) {
    super(libelle, poids);
  }
  
  public getType(): string {
    return "materiel";
  }
  
  // Méthode abstraite à implémenter par les classes filles
  public abstract isFragile(): boolean;
  
  // Méthode info() abstraite à implémenter par les classes filles
  public abstract info(): void;
}
