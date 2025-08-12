// Test du système de SMS réel
const MessageService = require('./services/MessageService');

async function testerSMS() {
  console.log('🧪 Test d\'envoi de SMS réel...');
  
  // REMPLACEZ PAR VOTRE VRAI NUMÉRO (format international)
  const numeroTest = '+221785052217'; // Numéro de test vérifié
  
  const testData = {
    codeDestinataire: 'TEST-SMS-001',
    expediteur: { 
      nom: 'Service Test', 
      telephone: '+221777000000' 
    },
    destinataire: { 
      nom: 'Bachir', 
      telephone: numeroTest,
      adresse: 'Dakar, Sénégal'
    },
    poids: 2,
    typeProduit: 'Materiel',
    typeCargaison: 'routiere',
    prixFinal: 5000
  };

  try {
    console.log(`📱 Tentative d'envoi SMS à ${numeroTest}...`);
    
    // Test SMS direct
    const resultatSMS = await MessageService.envoyerSMS(
      numeroTest, 
      "Test TransCargo: SMS fonctionne! Code: TEST-001"
    );

    console.log('Résultat SMS:', resultatSMS);
    
    // Test notification complète
    console.log('\n📦 Test notification complète...');
    const messages = await MessageService.notifierColis('colis_cree', testData);
    console.log(`✅ ${messages.length} notifications envoyées`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Lancer le test
testerSMS();
