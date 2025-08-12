// Test du système d'email
const MessageService = require('./services/MessageService');

async function testerEmail() {
  console.log('📧 Test d\'envoi d\'email...');
  
  const emailTest = 'bachir.uchiwa@example.com'; // Remplacez par votre email
  
  try {
    const resultat = await MessageService.envoyerEmail(
      emailTest,
      'Test TransCargo - Email fonctionne!',
      'Bonjour,\n\nCeci est un test d\'email du système TransCargo.\n\nCordialement,\nL\'équipe TransCargo'
    );
    
    console.log('Résultat Email:', resultat);
    
    // Test notification email complète
    console.log('\n📧 Test notification email complète...');
    const testData = {
      codeDestinataire: 'TEST-EMAIL-001',
      expediteur: { 
        nom: 'Service Test', 
        email: 'expediteur@test.com' 
      },
      destinataire: { 
        nom: 'Bachir', 
        email: emailTest
      },
      poids: 2,
      prixFinal: 5000
    };
    
    const messageEmail = await MessageService.envoyerMessage(
      emailTest,
      '📦 Test notification TransCargo',
      'TransCargo: Colis TEST-EMAIL-001 créé avec succès !',
      'email'
    );
    
    console.log('✅ Email de notification envoyé:', messageEmail.statut);
    
  } catch (error) {
    console.error('❌ Erreur lors du test email:', error);
  }
}

testerEmail();
