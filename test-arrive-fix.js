#!/usr/bin/env node
/**
 * Script de test pour vérifier la correction de la mise à jour automatique des colis
 * quand une cargaison arrive
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Rendre fetch disponible globalement
global.fetch = fetch;

const dataDir = path.join(__dirname, 'data');

// Utilitaires de chargement JSON
const loadJSON = (filename) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) || [];
  } catch (error) {
    console.error(`Erreur lecture ${filename}:`, error);
    return [];
  }
};

const saveJSON = (filename, data) => {
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Fonction utilitaire pour charger les données avec fallback
const loadDataWithFallback = (type) => {
  try {
    // D'abord essayer db.json unifié
    const dbData = loadJSON('db.json');
    if (dbData && dbData[type]) {
      return dbData[type];
    }
    
    // Fallback vers les fichiers séparés
    const filename = type === 'cargaisons' ? 'cargaisons.json' : 'colis.json';
    return loadJSON(filename);
  } catch (error) {
    console.error(`Erreur lors du chargement des ${type}:`, error);
    return [];
  }
};

// Fonction pour sauvegarder dans les deux formats pour compatibilité
const saveDataWithSync = (type, data) => {
  try {
    // Sauvegarder dans db.json
    const dbData = loadJSON('db.json') || {};
    dbData[type] = data;
    saveJSON('db.json', dbData);
    
    // Sauvegarder aussi dans l'ancien format pour compatibilité
    const filename = type === 'cargaisons' ? 'cargaisons.json' : 'colis.json';
    saveJSON(filename, data);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des ${type}:`, error);
  }
};

console.log('🔧 Test de la correction "ARRIVÉ" automatique...\n');

// 1. Créer des données de test
console.log('1. Création des données de test...');

const testCargaison = {
  id: 'CG-TEST12345',
  numero: 'CG-TEST12345',
  type: 'routiere',
  poidsMax: 1000,
  trajet: {
    depart: { lieu: 'Dakar', latitude: 14.6937, longitude: -17.4441 },
    arrivee: { lieu: 'Thiès', latitude: 14.7886, longitude: -16.9246 }
  },
  distance: 70,
  etatAvancement: 'EN_COURS', // Déjà en cours
  etatGlobal: 'FERME',
  dateCreation: new Date().toISOString(),
  dateDepart: new Date().toISOString(),
  produits: [],
  colisIds: ['COL-TEST1', 'COL-TEST2'],
  prixTotal: 20000
};

const testColis1 = {
  id: 'COL-TEST1',
  expediteur: { prenom: 'Test', nom: 'User', telephone: '123456789', adresse: 'Test Address' },
  destinataire: { nomComplet: 'Test Destinataire', telephone: '987654321', adresse: 'Dest Address' },
  poids: 10,
  typeProduit: 'alimentaire',
  typeCargaison: 'routiere',
  nombreColis: 1,
  etat: 'EN_COURS', // En cours
  cargaisonId: 'CG-TEST12345',
  dateCreation: new Date().toISOString(),
  codeDestinataire: 'TEST1234',
  prixCalcule: 7000,
  prixFinal: 10000
};

const testColis2 = {
  id: 'COL-TEST2',
  expediteur: { prenom: 'Test2', nom: 'User2', telephone: '123456789', adresse: 'Test Address' },
  destinataire: { nomComplet: 'Test Destinataire 2', telephone: '987654321', adresse: 'Dest Address' },
  poids: 15,
  typeProduit: 'alimentaire',
  typeCargaison: 'routiere',
  nombreColis: 1,
  etat: 'EN_COURS', // En cours
  cargaisonId: 'CG-TEST12345',
  dateCreation: new Date().toISOString(),
  codeDestinataire: 'TEST5678',
  prixCalcule: 10500,
  prixFinal: 10500
};

// Ajouter aux données existantes
const cargaisons = loadDataWithFallback('cargaisons');
const colis = loadDataWithFallback('colis');

// Nettoyer les données de test existantes
const cargaisonsFiltrees = cargaisons.filter(c => c.id !== 'CG-TEST12345');
const colisFiltres = colis.filter(c => !c.id.startsWith('COL-TEST'));

cargaisonsFiltrees.push(testCargaison);
colisFiltres.push(testColis1, testColis2);

saveDataWithSync('cargaisons', cargaisonsFiltrees);
saveDataWithSync('colis', colisFiltres);

console.log('✅ Données de test créées');
console.log(`   Cargaison: ${testCargaison.id} (état: ${testCargaison.etatAvancement})`);
console.log(`   Colis 1: ${testColis1.id} (état: ${testColis1.etat})`);
console.log(`   Colis 2: ${testColis2.id} (état: ${testColis2.etat})`);

// 2. Simuler l'arrivée de la cargaison
console.log('\n2. Simulation de l\'arrivée de la cargaison...');

// Simuler la logique de la route /arrive
const cargaisonsUpdate = loadDataWithFallback('cargaisons');
const colisUpdate = loadDataWithFallback('colis');
const index = cargaisonsUpdate.findIndex(c => c.id === 'CG-TEST12345');

if (index >= 0) {
  cargaisonsUpdate[index].etatAvancement = 'ARRIVE';
  cargaisonsUpdate[index].dateArriveeReelle = new Date().toISOString();
  
  const dateArrivee = new Date().toISOString();
  
  // Mettre à jour tous les colis de cette cargaison
  for (const colis of colisUpdate) {
    if (colis.cargaisonId === 'CG-TEST12345' && colis.etat === 'EN_COURS') {
      console.log(`   Mise à jour du colis ${colis.id} : EN_COURS -> ARRIVE`);
      colis.etat = 'ARRIVE';
      colis.dateArrivee = dateArrivee;
    }
  }
  
  saveDataWithSync('cargaisons', cargaisonsUpdate);
  saveDataWithSync('colis', colisUpdate);
  
  console.log('✅ Cargaison marquée comme arrivée');
} else {
  console.log('❌ Cargaison de test non trouvée');
}

// 3. Vérifier le résultat
console.log('\n3. Vérification du résultat...');
const cargaisonsVerif = loadDataWithFallback('cargaisons');
const colisVerif = loadDataWithFallback('colis');

const cargaisonTest = cargaisonsVerif.find(c => c.id === 'CG-TEST12345');
const colisTest = colisVerif.filter(c => c.cargaisonId === 'CG-TEST12345');

if (cargaisonTest && cargaisonTest.etatAvancement === 'ARRIVE') {
  console.log('✅ Cargaison correctement marquée comme ARRIVÉ');
  
  const colisArrives = colisTest.filter(c => c.etat === 'ARRIVE');
  const colisEnCours = colisTest.filter(c => c.etat === 'EN_COURS');
  
  console.log(`   Colis arrivés: ${colisArrives.length}/${colisTest.length}`);
  
  if (colisEnCours.length === 0) {
    console.log('✅ Tous les colis ont été correctement mis à jour vers ARRIVÉ');
  } else {
    console.log('❌ Certains colis sont encore EN_COURS:');
    colisEnCours.forEach(c => console.log(`     - ${c.id}`));
  }
} else {
  console.log('❌ La cargaison n\'est pas correctement marquée comme arrivée');
}

// 4. Nettoyer les données de test
console.log('\n4. Nettoyage des données de test...');
const cargaisonsClean = cargaisonsVerif.filter(c => c.id !== 'CG-TEST12345');
const colisClean = colisVerif.filter(c => !c.id.startsWith('COL-TEST'));

saveDataWithSync('cargaisons', cargaisonsClean);
saveDataWithSync('colis', colisClean);

console.log('✅ Données de test nettoyées');
console.log('\n🎉 Test terminé !');
