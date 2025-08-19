#!/usr/bin/env node
/**
 * Script de correction définitive pour mettre à jour tous les colis
 * dont la cargaison est ARRIVÉ mais qui sont encore EN_COURS
 */

const fetch = require('node-fetch');
global.fetch = fetch;

console.log('🔧 Correction définitive des colis EN_COURS...\n');

async function fixColisDefinitif() {
  try {
    // 1. Récupérer toutes les cargaisons
    console.log('📊 Récupération des cargaisons...');
    const cargaisonsResponse = await fetch('http://localhost:3006/cargaisons');
    const cargaisons = await cargaisonsResponse.json();
    
    // 2. Récupérer tous les colis
    console.log('📦 Récupération des colis...');
    const colisResponse = await fetch('http://localhost:3006/colis');
    const colis = await colisResponse.json();
    
    console.log(`Trouvé ${cargaisons.length} cargaisons et ${colis.length} colis\n`);
    
    // 3. Identifier les problèmes
    let problemesDetectes = 0;
    let colisACorrigee = [];
    
    for (const cargaison of cargaisons) {
      if (cargaison.etatAvancement === 'ARRIVE') {
        const colisAssocies = colis.filter(c => c.cargaisonId === cargaison.id);
        const colisEnCours = colisAssocies.filter(c => c.etat === 'EN_COURS');
        
        if (colisEnCours.length > 0) {
          console.log(`❌ Problème détecté: ${cargaison.numero}`);
          console.log(`   Cargaison: ARRIVÉ, mais ${colisEnCours.length} colis EN_COURS`);
          problemesDetectes++;
          colisACorrigee.push(...colisEnCours);
        }
      }
    }
    
    if (problemesDetectes === 0) {
      console.log('✅ Aucun problème détecté ! Tous les colis sont cohérents.');
      return;
    }
    
    console.log(`\n🔧 Correction de ${colisACorrigee.length} colis...`);
    
    // 4. Corriger les colis un par un
    let correctionReussie = 0;
    const dateArrivee = new Date().toISOString();
    
    for (const colis of colisACorrigee) {
      try {
        const colisCorrige = {
          ...colis,
          etat: 'ARRIVE',
          dateArrivee: dateArrivee
        };
        
        const updateResponse = await fetch(`http://localhost:3006/colis/${colis.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(colisCorrige)
        });
        
        if (updateResponse.ok) {
          console.log(`  ✅ ${colis.id}: EN_COURS → ARRIVE`);
          correctionReussie++;
        } else {
          console.log(`  ❌ ${colis.id}: Échec de la mise à jour`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${colis.id}: Erreur - ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Correction terminée !`);
    console.log(`   ✅ ${correctionReussie}/${colisACorrigee.length} colis corrigés`);
    
    if (correctionReussie === colisACorrigee.length) {
      console.log('\n✨ Tous les colis ont été corrigés avec succès !');
      console.log('   Vous pouvez maintenant rafraîchir votre interface (Ctrl+Shift+R)');
    } else {
      console.log('\n⚠️  Certains colis n\'ont pas pu être corrigés.');
      console.log('   Vérifiez que json-server fonctionne sur le port 3006');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message);
    console.log('\nVérifiez que json-server fonctionne:');
    console.log('   npx json-server --watch data/db.json --port 3006');
  }
}

// Exécuter la correction
fixColisDefinitif();
