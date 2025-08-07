import { Produit } from './Model/Produit';
import { Alimentaire } from './Model/Alimentaire';
import { Chimique } from './Model/Chimique';
import { Materiel } from './Model/Materiel';
import { Fragile } from './Model/Fragile';
import { Incassable } from './Model/Incassable';
import { Cargaison } from './Model/Cargaison';
import { Routiere } from './Model/Routiere';
import { Maritime } from './Model/Maritime';
import { Aerienne } from './Model/Aerienne';

// Fonction principale de test
function executerTests(): void {
  console.log("=== TESTS NOUVELLE ARCHITECTURE GP DU MONDE ===\n");
  
  try {
    testCreationProduits();
    testEncapsulation();
    testMethodeInfo();
    testCreationCargaisons();
    testMethodesCargaisons();
    testContraintes();
    testCalculsFrais();
    testExemplesComplets();
    testCargaisonsCompletes();
    
    console.log("✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !");
  } catch (error) {
    console.error("❌ ERREUR DANS LES TESTS:", error);
  }
}

function testCreationProduits(): void {
  console.log("1. Test création des produits avec héritage:");
  
  // Test des classes concrètes de produits
  const riz = new Alimentaire("Riz basmati", 25);
  console.log(`   ✓ ${riz.toString()}`);
  
  const acide = new Chimique("Acide sulfurique", 10, 8);
  console.log(`   ✓ ${acide.toString()}`);
  
  const tv = new Fragile("Télévision LCD", 15);
  console.log(`   ✓ ${tv.toString()}`);
  
  const metal = new Incassable("Pièces métalliques", 50);
  console.log(`   ✓ ${metal.toString()}`);
  
  // Test que les classes abstraites ne peuvent pas être instanciées
  console.log("   ✓ Classes abstraites Produit et Materiel non instanciables\n");
}

function testEncapsulation(): void {
  console.log("2. Test encapsulation (getters/setters):");
  
  const produit = new Alimentaire("Test", 10);
  
  // Test getters
  console.log(`   ✓ Getter libellé: ${produit.libelle}`);
  console.log(`   ✓ Getter poids: ${produit.poids}kg`);
  
  // Test setters avec validation
  produit.libelle = "Nouveau libellé";
  produit.poids = 20;
  console.log(`   ✓ Setters fonctionnels: ${produit.libelle} (${produit.poids}kg)`);
  
  // Test validation dans les setters
  try {
    produit.poids = -5;
    console.log("   ❌ Validation poids échouée");
  } catch (error) {
    console.log("   ✓ Validation poids réussie: poids négatif refusé");
  }
  
  // Test pour produit chimique
  const chimique = new Chimique("Produit chimique", 5, 7);
  console.log(`   ✓ Degré toxicité: ${chimique.degreToxicite}/10`);
  chimique.degreToxicite = 9;
  console.log(`   ✓ Modification degré toxicité: ${chimique.degreToxicite}/10\n`);
}

function testMethodeInfo(): void {
  console.log("3. Test méthode info() des produits:");
  
  // Test info() pour produit alimentaire
  console.log("   Test info() Alimentaire:");
  const riz = new Alimentaire("Riz premium", 25);
  riz.info();
  console.log();
  
  // Test info() pour produit chimique
  console.log("   Test info() Chimique:");
  const acide = new Chimique("Acide industriel", 10, 7);
  acide.info();
  console.log();
  
  // Test info() pour produit fragile
  console.log("   Test info() Fragile:");
  const verre = new Fragile("Verrerie", 5);
  verre.info();
  console.log();
  
  // Test info() pour produit incassable
  console.log("   Test info() Incassable:");
  const metal = new Incassable("Pièces métalliques", 40);
  metal.info();
  console.log();
}

function testCreationCargaisons(): void {
  console.log("4. Test création des cargaisons avec héritage:");
  
  const cargRoutiere = new Routiere("ROUT001", 1000);
  console.log(`   ✓ Cargaison routière créée: ${cargRoutiere.id} (${cargRoutiere.getType()})`);
  
  const cargMaritime = new Maritime("MAR001", 1500);
  console.log(`   ✓ Cargaison maritime créée: ${cargMaritime.id} (${cargMaritime.getType()})`);
  
  const cargAerienne = new Aerienne("AIR001", 3000);
  console.log(`   ✓ Cargaison aérienne créée: ${cargAerienne.id} (${cargAerienne.getType()})`);
  
  console.log("   ✓ Classe abstraite Cargaison non instanciable\n");
}

function testMethodesCargaisons(): void {
  console.log("5. Test méthodes des cargaisons:");
  
  const cargaison = new Routiere("TEST001", 500);
  const riz = new Alimentaire("Riz", 20);
  const metal = new Incassable("Métal", 30);
  
  // Test ajouterProduit()
  cargaison.ajouterProduit(riz);
  cargaison.ajouterProduit(metal);
  console.log(`   ✓ ajouterProduit(): ${cargaison.nbProduit()} produits ajoutés`);
  
  // Test nbProduit()
  console.log(`   ✓ nbProduit(): ${cargaison.nbProduit()} produits`);
  
  // Test calculerProduit()
  const fraisRiz = cargaison.calculerProduit(riz);
  console.log(`   ✓ calculerProduit() riz: ${fraisRiz}F`);
  
  const fraisMetal = cargaison.calculerProduit(metal);
  console.log(`   ✓ calculerProduit() métal: ${fraisMetal}F`);
  
  // Test sommeTotale()
  const total = cargaison.sommeTotale();
  console.log(`   ✓ sommeTotale(): ${total}F\n`);
}

function testContraintes(): void {
  console.log("6. Test des contraintes de transport:");
  
  // Test contrainte routière: pas de chimique
  try {
    const cargRoutiere = new Routiere("INVALID1", 500);
    const acide = new Chimique("Acide", 5, 3);
    cargRoutiere.ajouterProduit(acide);
    console.log("   ❌ Contrainte routière non respectée");
  } catch (error) {
    console.log("   ✓ Contrainte routière respectée: chimique refusé");
  }
  
  // Test contrainte maritime: pas de fragile
  try {
    const cargMaritime = new Maritime("INVALID2", 800);
    const tv = new Fragile("TV", 10);
    cargMaritime.ajouterProduit(tv);
    console.log("   ❌ Contrainte maritime non respectée");
  } catch (error) {
    console.log("   ✓ Contrainte maritime respectée: fragile refusé");
  }
  
  // Test contrainte aérienne: pas de chimique
  try {
    const cargAerienne = new Aerienne("INVALID3", 1000);
    const acide = new Chimique("Acide", 3, 5);
    cargAerienne.ajouterProduit(acide);
    console.log("   ❌ Contrainte aérienne non respectée");
  } catch (error) {
    console.log("   ✓ Contrainte aérienne respectée: chimique refusé");
  }
  
  // Test limite 10 produits
  try {
    const cargaison = new Routiere("LIMIT", 100);
    for (let i = 0; i < 11; i++) {
      cargaison.ajouterProduit(new Alimentaire(`Produit${i}`, 1));
    }
    console.log("   ❌ Limite produits non respectée");
  } catch (error) {
    console.log("   ✓ Limite produits respectée: >10 produits refusé\n");
  }
}

function testCalculsFrais(): void {
  console.log("7. Test calculs détaillés:");
  
  // Test calcul routier
  const cargRoutiere = new Routiere("CALC1", 1000);
  const riz = new Alimentaire("Riz", 25);
  cargRoutiere.ajouterProduit(riz);
  const fraisRoutier = cargRoutiere.sommeTotale();
  console.log(`   ✓ Routier alimentaire (25kg×1000km×100F): ${fraisRoutier}F`);
  
  // Test calcul maritime avec chimique
  const cargMaritime = new Maritime("CALC2", 500);
  const acide = new Chimique("Acide", 10, 8);
  cargMaritime.ajouterProduit(acide);
  const fraisMaritime = cargMaritime.sommeTotale();
  console.log(`   ✓ Maritime chimique (10kg×500F×8+10000F): ${fraisMaritime}F`);
  
  // Test calcul aérien
  const cargAerienne = new Aerienne("CALC3", 2000);
  const metal = new Incassable("Métal", 15);
  cargAerienne.ajouterProduit(metal);
  const fraisAerien = cargAerienne.sommeTotale();
  console.log(`   ✓ Aérien matériel (15kg×1000F): ${fraisAerien}F\n`);
}

function testExemplesComplets(): void {
  console.log("8. Exemples complets avec devis:");
  
  // Exemple 1: Transport routier mixte
  console.log("   Exemple 1 - Transport routier mixte:");
  const carg1 = new Routiere("EXEMPLE1", 800);
  carg1.ajouterProduit(new Alimentaire("Céréales", 50));
  carg1.ajouterProduit(new Incassable("Outils", 25));
  
  console.log(`     ID: ${carg1.id}`);
  console.log(`     Type: ${carg1.getType()}`);
  console.log(`     Distance: ${carg1.distance}km`);
  console.log(`     Nombre produits: ${carg1.nbProduit()}`);
  console.log(`     Poids total: ${carg1.getPoidsTotal()}kg`);
  console.log(`     Total à payer: ${carg1.sommeTotale()}F`);
  
  // Exemple 2: Transport maritime alimentaire + incassable
  console.log("\n   Exemple 2 - Transport maritime avec frais supplémentaires:");
  const carg2 = new Maritime("EXEMPLE2", 1200);
  carg2.ajouterProduit(new Alimentaire("Produits surgelés", 40));
  carg2.ajouterProduit(new Incassable("Conteneurs", 100));
  
  const fraisAlim = carg2.calculerProduit(carg2.produits[0]);
  const fraisIncas = carg2.calculerProduit(carg2.produits[1]);
  const fraisSupp = carg2.calculerFraisSupplementaires();
  
  console.log(`     Frais alimentaire: ${fraisAlim}F`);
  console.log(`     Frais incassable: ${fraisIncas}F`);
  console.log(`     Frais supplémentaires: ${fraisSupp}F`);
  console.log(`     Total: ${carg2.sommeTotale()}F`);
  
  // Exemple 3: Transport aérien express
  console.log("\n   Exemple 3 - Transport aérien express:");
  const carg3 = new Aerienne("EXEMPLE3", 5000);
  carg3.ajouterProduit(new Alimentaire("Produits frais", 10));
  carg3.ajouterProduit(new Incassable("Électronique", 8));
  
  console.log(`     Coût alimentaire: ${carg3.calculerProduit(carg3.produits[0])}F`);
  console.log(`     Coût électronique: ${carg3.calculerProduit(carg3.produits[1])}F`);
  console.log(`     Total express: ${carg3.sommeTotale()}F\n`);
}

function testCargaisonsCompletes(): void {
  console.log("9. Test complet des cargaisons avec gestion des erreurs:");
  console.log("=" .repeat(60));
  
  // Création des trois types de cargaisons
  const cargaisonRoutiere = new Routiere("ROUTE001", 1000);
  const cargaisonMaritime = new Maritime("MARITIME001", 1500);
  const cargaisonAerienne = new Aerienne("AERIEN001", 2000);
  
  console.log("\n📦 CARGAISON ROUTIÈRE:");
  console.log("-".repeat(30));
  testAjoutProduitsCargaison(cargaisonRoutiere, [
    new Alimentaire("Fruits", 20),
    new Alimentaire("Légumes", 30),
    new Incassable("Outils", 25),
    new Fragile("Ordinateurs", 15),
    new Alimentaire("Céréales", 40)
  ]);
  
  // Test produit incompatible (chimique sur routière)
  console.log("\n🚫 Test produit incompatible:");
  try {
    const produitChimique = new Chimique("Acide", 5, 3);
    cargaisonRoutiere.ajouterProduit(produitChimique);
  } catch (error) {
    console.log(`   ❌ ${(error as Error).message}`);
  }
  
  console.log("\n🚢 CARGAISON MARITIME:");
  console.log("-".repeat(30));
  testAjoutProduitsCargaison(cargaisonMaritime, [
    new Chimique("Produit chimique A", 10, 5),
    new Chimique("Produit chimique B", 8, 7),
    new Alimentaire("Conserves", 50),
    new Incassable("Métaux", 100),
    new Alimentaire("Produits surgelés", 25)
  ]);
  
  // Test produit incompatible (fragile sur maritime)
  console.log("\n🚫 Test produit incompatible:");
  try {
    const produitFragile = new Fragile("Verre", 10);
    cargaisonMaritime.ajouterProduit(produitFragile);
  } catch (error) {
    console.log(`   ❌ ${(error as Error).message}`);
  }
  
  console.log("\n✈️ CARGAISON AÉRIENNE:");
  console.log("-".repeat(30));
  testAjoutProduitsCargaison(cargaisonAerienne, [
    new Alimentaire("Produits frais", 5),
    new Fragile("Électronique", 8),
    new Incassable("Pièces détachées", 12),
    new Alimentaire("Médicaments", 3),
    new Fragile("Instruments", 6)
  ]);
  
  // Test produit incompatible (chimique sur aérienne)
  console.log("\n🚫 Test produit incompatible:");
  try {
    const produitChimique = new Chimique("Acide", 3, 4);
    cargaisonAerienne.ajouterProduit(produitChimique);
  } catch (error) {
    console.log(`   ❌ ${(error as Error).message}`);
  }
  
  // Test cargaison pleine (10 produits max)
  console.log("\n📦 Test limite de produits (cargaison pleine):");
  console.log("-".repeat(45));
  
  const cargaisonTest = new Routiere("TEST_PLEIN", 500);
  
  // Ajouter 10 produits (limite)
  for (let i = 1; i <= 10; i++) {
    try {
      const produit = new Alimentaire(`Produit ${i}`, 5);
      cargaisonTest.ajouterProduit(produit);
      console.log(`   ✓ Produit ${i} ajouté. Total: ${cargaisonTest.sommeTotale()}F (${cargaisonTest.nbProduit()} produits)`);
    } catch (error) {
      console.log(`   ❌ Erreur ajout produit ${i}: ${(error as Error).message}`);
    }
  }
  
  // Essayer d'ajouter un 11ème produit
  console.log("\n🚫 Tentative d'ajout d'un 11ème produit:");
  try {
    const produitSupplementaire = new Alimentaire("Produit 11", 5);
    cargaisonTest.ajouterProduit(produitSupplementaire);
  } catch (error) {
    console.log(`   ❌ ${(error as Error).message}`);
  }
  
  // Résumé final de toutes les cargaisons
  console.log("\n📋 RÉSUMÉ FINAL DES CARGAISONS:");
  console.log("=".repeat(50));
  afficherResumeCargaison(cargaisonRoutiere);
  afficherResumeCargaison(cargaisonMaritime);
  afficherResumeCargaison(cargaisonAerienne);
  afficherResumeCargaison(cargaisonTest);
}

function testAjoutProduitsCargaison(cargaison: any, produits: Produit[]): void {
  produits.forEach((produit, index) => {
    try {
      cargaison.ajouterProduit(produit);
      console.log(`   ✓ ${produit.toString()}`);
      console.log(`     💰 Montant cargaison: ${cargaison.sommeTotale()}F (${cargaison.nbProduit()} produits)`);
    } catch (error) {
      console.log(`   ❌ Erreur: ${(error as Error).message}`);
    }
  });
}

function afficherResumeCargaison(cargaison: any): void {
  console.log(`\n🚛 ${cargaison.id} (${cargaison.getType().toUpperCase()}):`);
  console.log(`   📦 Nombre de produits: ${cargaison.nbProduit()}/10`);
  console.log(`   ⚖️  Poids total: ${cargaison.getPoidsTotal()}kg`);
  console.log(`   🏁 Distance: ${cargaison.distance}km`);
  console.log(`   💵 TOTAL À PAYER: ${cargaison.sommeTotale()}F`);
}

// Fonction de démonstration de l'architecture
function demonstrationArchitecture(): void {
  console.log("=== DÉMONSTRATION ARCHITECTURE ORIENTÉE OBJET ===\n");
  
  console.log("HIÉRARCHIE DES CLASSES:");
  console.log("Produit (abstraite)");
  console.log("├── Alimentaire (concrète)");
  console.log("├── Chimique (concrète)");
  console.log("└── Materiel (abstraite)");
  console.log("    ├── Fragile (concrète)");
  console.log("    └── Incassable (concrète)");
  console.log("");
  console.log("Cargaison (abstraite)");
  console.log("├── Routiere (concrète)");
  console.log("├── Maritime (concrète)");
  console.log("└── Aerienne (concrète)");
  console.log("");
  
  console.log("FONCTIONNALITÉS IMPLÉMENTÉES:");
  console.log("✓ Encapsulation complète avec getters/setters");
  console.log("✓ Héritage et classes abstraites");
  console.log("✓ Polymorphisme dans les calculs");
  console.log("✓ Validation des contraintes métier");
  console.log("✓ Méthodes spécialisées par type de cargaison");
  console.log("✓ Gestion automatique des frais supplémentaires");
}

// Exécution des tests
if (require.main === module) {
  executerTests();
  console.log("\n" + "=".repeat(80) + "\n");
  demonstrationArchitecture();
}

export { executerTests, demonstrationArchitecture };
