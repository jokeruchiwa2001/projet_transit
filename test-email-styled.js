// Test des emails stylisés
const MessageService = require('./services/MessageService');

async function testerEmailStyled() {
  console.log('🎨 Test des emails stylisés TransCargo...');
  
  const testData = {
    codeDestinataire: 'TC-TEST-HTML-001',
    expediteur: { 
      nom: 'Bachir Uchiwa',
      email: 'expediteur@test.com'
    },
    destinataire: { 
      nom: 'Client Test',
      email: 'pabassdiame76@gmail.com' // Votre email pour recevoir le test
    },
    poids: 5.5,
    prixFinal: 25000,
    dateDepart: new Date(),
    dateArrivee: new Date()
  };

  try {
    console.log('\n📧 Test email création de colis...');
    const emailTemplate = MessageService.getEmailHTMLTemplate('colis_cree', testData);
    
    if (emailTemplate && emailTemplate.destinataire) {
      const result = await MessageService.envoyerEmailHTML(
        testData.destinataire.email,
        emailTemplate.destinataire.sujet,
        emailTemplate.destinataire.html
      );
      
      console.log('Résultat:', result.success ? '✅ Succès' : '❌ Échec');
    }

    console.log('\n🚛 Test email colis en transit...');
    const transitTemplate = MessageService.getEmailHTMLTemplate('colis_parti', testData);
    
    if (transitTemplate && transitTemplate.destinataire) {
      const result = await MessageService.envoyerEmailHTML(
        testData.destinataire.email,
        transitTemplate.destinataire.sujet,
        transitTemplate.destinataire.html
      );
      
      console.log('Résultat:', result.success ? '✅ Succès' : '❌ Échec');
    }

    console.log('\n🎉 Test email colis arrivé...');
    const arriveTemplate = MessageService.getEmailHTMLTemplate('colis_arrive', testData);
    
    if (arriveTemplate && arriveTemplate.destinataire) {
      const result = await MessageService.envoyerEmailHTML(
        testData.destinataire.email,
        arriveTemplate.destinataire.sujet,
        arriveTemplate.destinataire.html
      );
      
      console.log('Résultat:', result.success ? '✅ Succès' : '❌ Échec');
    }

    console.log('\n✨ Tests des emails stylisés terminés !');
    console.log('Vérifiez votre boîte email pour voir les nouveaux designs.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testerEmailStyled();
