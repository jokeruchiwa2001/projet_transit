#!/usr/bin/env node
/**
 * Script pour tester le rafraîchissement de l'interface après une action "ARRIVÉ"
 */

console.log('🔄 Test de rafraîchissement interface TransCargo...\n');

const fs = require('fs');
const path = require('path');

// Vérifier les données actuelles
const dataPath = path.join(__dirname, 'data/db.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('📊 État actuel des données:');
console.log('\n🚛 Cargaisons:');
data.cargaisons.forEach(c => {
  console.log(`  ${c.numero}: ${c.etatAvancement} (${c.type})`);
});

console.log('\n📦 Colis:');
data.colis.forEach(c => {
  const cargaison = data.cargaisons.find(cg => cg.id === c.cargaisonId);
  console.log(`  ${c.id}: ${c.etat} → Cargaison ${cargaison?.numero || 'Inconnue'}`);
});

console.log('\n✅ Vérification règle métier "ARRIVÉ":');
data.cargaisons.forEach(cargaison => {
  const colisAssocies = data.colis.filter(c => c.cargaisonId === cargaison.id);
  const cargaisonArrivee = cargaison.etatAvancement === 'ARRIVE';
  const colisArrives = colisAssocies.filter(c => c.etat === 'ARRIVE');
  const colisEnCours = colisAssocies.filter(c => c.etat === 'EN_COURS');
  
  if (cargaisonArrivee && colisEnCours.length > 0) {
    console.log(`  ❌ ${cargaison.numero}: Cargaison ARRIVÉE mais ${colisEnCours.length} colis encore EN_COURS !`);
  } else if (cargaisonArrivee && colisArrives.length > 0) {
    console.log(`  ✅ ${cargaison.numero}: Cargaison et tous ses ${colisArrives.length} colis sont ARRIVÉS`);
  } else {
    console.log(`  ➖ ${cargaison.numero}: Cargaison ${cargaison.etatAvancement} avec ${colisAssocies.length} colis`);
  }
});

console.log('\n💡 Instructions pour voir les changements dans l\'interface:');
console.log('1. Ouvrir http://localhost:8000/admin.html');
console.log('2. Se connecter avec pabass/diame');
console.log('3. Vider le cache du navigateur (Ctrl+Shift+R ou F12 > Application > Clear Storage)');
console.log('4. Cliquer sur une cargaison pour voir ses détails');
console.log('5. Les colis devraient maintenant afficher "ARRIVÉ"');

console.log('\n🎯 Si le problème persiste:');
console.log('- Vérifier que json-server (port 3006) fonctionne');
console.log('- Vérifier que le serveur PHP (port 8000) fonctionne');
console.log('- Essayer dans une fenêtre de navigation privée');
