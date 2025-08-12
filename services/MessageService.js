// Service de messagerie pour envoyer des notifications automatiques
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Twilio (optionnel - nécessite configuration)
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.log('Twilio non configuré, utilisation de TextBelt par défaut');
}

class MessageService {
  
  static generateId() {
    return 'MSG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // Template HTML pour emails professionnels
  static getEmailHTMLTemplate(type, data) {
    const baseStyle = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
        .status-created { background: #28a745; }
        .status-transit { background: #ffc107; color: #333; }
        .status-arrived { background: #17a2b8; }
        .status-lost { background: #dc3545; }
        .colis-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .info-label { font-weight: bold; color: #555; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
        .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    `;

    const templates = {
      'colis_cree': {
        expediteur: {
          sujet: `✅ Colis créé avec succès - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>🚛 TransCargo</h1>
                <p>Votre colis a été créé avec succès</p>
              </div>
              <div class="content">
                <span class="status-badge status-created">✅ Colis créé</span>
                <div class="colis-info">
                  <h3>Détails de votre expédition</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Destinataire:</span> ${data.destinataire.nom}</div>
                  <div class="info-row"><span class="info-label">Poids:</span> ${data.poids} kg</div>
                  <div class="info-row"><span class="info-label">Prix total:</span> ${data.prixFinal} FCFA</div>
                </div>
                <p>Votre colis a été enregistré dans notre système et sera traité dans les plus brefs délais.</p>
                <p>Vous recevrez une notification lorsque votre colis sera en transit.</p>
              </div>
              <div class="footer">
                <p>Merci de faire confiance à TransCargo</p>
                <p>Pour toute question, contactez-nous</p>
              </div>
            </div>
          `
        },
        destinataire: {
          sujet: `📦 Un colis vous a été envoyé - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>📦 TransCargo</h1>
                <p>Vous avez reçu un nouveau colis</p>
              </div>
              <div class="content">
                <span class="status-badge status-created">📦 Colis en préparation</span>
                <div class="colis-info">
                  <h3>Détails de votre colis</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Expéditeur:</span> ${data.expediteur.nom}</div>
                  <div class="info-row"><span class="info-label">Poids:</span> ${data.poids} kg</div>
                </div>
                <p>Un colis vous a été envoyé par <strong>${data.expediteur.nom}</strong>.</p>
                <p>Vous recevrez une notification dès que votre colis sera en transit.</p>
              </div>
              <div class="footer">
                <p>TransCargo - Votre partenaire logistique de confiance</p>
              </div>
            </div>
          `
        }
      },
      
      'colis_parti': {
        expediteur: {
          sujet: `🚛 Colis en transit - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>🚛 TransCargo</h1>
                <p>Votre colis est en route</p>
              </div>
              <div class="content">
                <span class="status-badge status-transit">🚛 En transit</span>
                <div class="colis-info">
                  <h3>Suivi de votre expédition</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Date de départ:</span> ${new Date(data.dateDepart).toLocaleDateString('fr-FR')}</div>
                  <div class="info-row"><span class="info-label">Destinataire:</span> ${data.destinataire.nom}</div>
                </div>
                <p>Votre colis a quitté notre entrepôt et est maintenant en transit vers sa destination.</p>
                <p>Nous vous tiendrons informé de son arrivée.</p>
              </div>
              <div class="footer">
                <p>TransCargo - Suivi en temps réel</p>
              </div>
            </div>
          `
        },
        destinataire: {
          sujet: `🚛 Votre colis est en route - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>🚛 TransCargo</h1>
                <p>Votre colis arrive bientôt</p>
              </div>
              <div class="content">
                <span class="status-badge status-transit">🚛 En transit</span>
                <div class="colis-info">
                  <h3>Votre colis est en route</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Départ:</span> ${new Date(data.dateDepart).toLocaleDateString('fr-FR')}</div>
                  <div class="info-row"><span class="info-label">Expéditeur:</span> ${data.expediteur.nom}</div>
                </div>
                <p>Bonne nouvelle ! Votre colis est maintenant en transit.</p>
                <p>Nous vous contacterons dès son arrivée.</p>
              </div>
              <div class="footer">
                <p>TransCargo - Livraison fiable</p>
              </div>
            </div>
          `
        }
      },
      
      'colis_arrive': {
        expediteur: {
          sujet: `✅ Colis livré avec succès - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>✅ TransCargo</h1>
                <p>Livraison réussie</p>
              </div>
              <div class="content">
                <span class="status-badge status-arrived">✅ Livré</span>
                <div class="colis-info">
                  <h3>Livraison confirmée</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Date de livraison:</span> ${new Date(data.dateArrivee).toLocaleDateString('fr-FR')}</div>
                  <div class="info-row"><span class="info-label">Destinataire:</span> ${data.destinataire.nom}</div>
                </div>
                <p>Excellente nouvelle ! Votre colis a été livré avec succès.</p>
                <p>Merci de nous avoir fait confiance pour cette expédition.</p>
              </div>
              <div class="footer">
                <p>TransCargo - Mission accomplie !</p>
              </div>
            </div>
          `
        },
        destinataire: {
          sujet: `✅ Votre colis est arrivé - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>🎉 TransCargo</h1>
                <p>Votre colis est arrivé !</p>
              </div>
              <div class="content">
                <span class="status-badge status-arrived">✅ Prêt à récupérer</span>
                <div class="colis-info">
                  <h3>Votre colis vous attend</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Expéditeur:</span> ${data.expediteur.nom}</div>
                  <div class="info-row"><span class="info-label">Date d'arrivée:</span> ${new Date(data.dateArrivee).toLocaleDateString('fr-FR')}</div>
                </div>
                <p>🎉 Votre colis est arrivé et vous attend !</p>
                <p>Vous pouvez maintenant venir le récupérer.</p>
              </div>
              <div class="footer">
                <p>TransCargo - Livraison rapide et sécurisée</p>
              </div>
            </div>
          `
        }
      },
      
      'colis_perdu': {
        expediteur: {
          sujet: `⚠️ Enquête en cours - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>⚠️ TransCargo</h1>
                <p>Enquête en cours</p>
              </div>
              <div class="content">
                <span class="status-badge status-lost">⚠️ Enquête</span>
                <div class="colis-info">
                  <h3>Situation de votre colis</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Destinataire:</span> ${data.destinataire.nom}</div>
                </div>
                <p>Nous vous informons qu'une enquête est en cours concernant votre colis.</p>
                <p>Notre équipe met tout en œuvre pour le retrouver. Nous vous tiendrons informé de l'évolution.</p>
                <p>Nous nous excusons pour ce désagrément.</p>
              </div>
              <div class="footer">
                <p>TransCargo - Nous restons mobilisés</p>
              </div>
            </div>
          `
        },
        destinataire: {
          sujet: `⚠️ Information importante - ${data.codeDestinataire}`,
          html: `
            ${baseStyle}
            <div class="container">
              <div class="header">
                <h1>⚠️ TransCargo</h1>
                <p>Information importante</p>
              </div>
              <div class="content">
                <span class="status-badge status-lost">⚠️ Enquête</span>
                <div class="colis-info">
                  <h3>Situation de votre colis</h3>
                  <div class="info-row"><span class="info-label">Code de suivi:</span> <strong>${data.codeDestinataire}</strong></div>
                  <div class="info-row"><span class="info-label">Expéditeur:</span> ${data.expediteur.nom}</div>
                </div>
                <p>Nous vous informons qu'une enquête est en cours concernant votre colis.</p>
                <p>Notre équipe fait le maximum pour résoudre cette situation rapidement.</p>
                <p>Nous vous excusons pour ce contretemps.</p>
              </div>
              <div class="footer">
                <p>TransCargo - Votre satisfaction est notre priorité</p>
              </div>
            </div>
          `
        }
      }
    };

    return templates[type] || null;
  }

  // Templates de messages (pour SMS)
  static getMessageTemplate(type, data) {
    const templates = {
      'colis_cree': {
        expediteur: {
          sujet: `✅ Colis créé - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} créé. Dest: ${data.destinataire.nom}. ${data.poids}kg. Prix: ${data.prixFinal}F`
        },
        destinataire: {
          sujet: `📦 Colis en route pour vous - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} envoyé par ${data.expediteur.nom}. ${data.poids}kg. Suivi sur notre site.`
        }
      },
      
      'colis_parti': {
        expediteur: {
          sujet: `🚛 Colis en transit - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} parti le ${new Date(data.dateDepart).toLocaleDateString('fr-FR')}. En route vers ${data.destinataire.nom}.`
        },
        destinataire: {
          sujet: `🚛 Votre colis est en route - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} en transit depuis le ${new Date(data.dateDepart).toLocaleDateString('fr-FR')}. Arrivée prochaine.`
        }
      },
      
      'colis_arrive': {
        expediteur: {
          sujet: `✅ Colis livré - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} livré le ${new Date(data.dateArrivee).toLocaleDateString('fr-FR')} à ${data.destinataire.nom}. Merci !`
        },
        destinataire: {
          sujet: `✅ Votre colis est arrivé - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} arrivé ! Récupérez-le dès maintenant. Expéditeur: ${data.expediteur.nom}`
        }
      },
      
      'colis_perdu': {
        expediteur: {
          sujet: `⚠️ Colis perdu - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} signalé perdu. Enquête en cours. Nous vous tiendrons informé. Désolé.`
        },
        destinataire: {
          sujet: `⚠️ Colis perdu - ${data.codeDestinataire}`,
          message: `TransCargo: Colis ${data.codeDestinataire} de ${data.expediteur.nom} signalé perdu. Enquête en cours. Désolé.`
        }
      }
    };

    return templates[type] || null;
  }

  // Configurer le transport email (Gmail gratuit)
  static getEmailTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'transcargo.notifications@gmail.com',
        pass: process.env.EMAIL_PASS || 'votre-mot-de-passe-app'
      }
    });
  }

  // Envoyer un vrai SMS (Twilio ou TextBelt)
  static async envoyerSMS(numero, message) {
    // Essayer Twilio d'abord si configuré
    if (twilioClient && process.env.TWILIO_PHONE) {
      try {
        const result = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE,
          to: numero
        });
        console.log(`✅ SMS Twilio envoyé avec succès à ${numero}`);
        return { success: true, result };
      } catch (error) {
        console.log(`❌ Échec SMS Twilio à ${numero}:`, error.message);
        // Continuer avec TextBelt en cas d'échec Twilio
      }
    }

    // Utiliser TextBelt comme fallback
    try {
      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: numero,
          message: message,
          key: process.env.TEXTBELT_KEY || 'textbelt' // Clé gratuite par défaut
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ SMS TextBelt envoyé avec succès à ${numero}`);
        return { success: true, result };
      } else {
        console.log(`❌ Échec SMS TextBelt à ${numero}:`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`❌ Erreur envoi SMS à ${numero}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un vrai email
  static async envoyerEmail(destinataire, sujet, message) {
    try {
      const transporter = this.getEmailTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'transcargo.notifications@gmail.com',
        to: destinataire,
        subject: sujet,
        text: message,
        html: message.replace(/\n/g, '<br>')
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé avec succès à ${destinataire}`);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ Erreur envoi email à ${destinataire}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email HTML stylisé
  static async envoyerEmailHTML(destinataire, sujet, htmlContent) {
    try {
      const transporter = this.getEmailTransporter();
      
      const mailOptions = {
        from: `TransCargo <${process.env.EMAIL_USER || 'transcargo.notifications@gmail.com'}>`,
        to: destinataire,
        subject: sujet,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email HTML envoyé avec succès à ${destinataire}`);
      return { 
        success: true, 
        result,
        id: this.generateId(),
        destinataire: destinataire,
        sujet: sujet,
        type: 'email',
        dateEnvoi: new Date().toISOString(),
        statut: 'envoye'
      };
    } catch (error) {
      console.error(`❌ Erreur envoi email HTML à ${destinataire}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        id: this.generateId(),
        destinataire: destinataire,
        sujet: sujet,
        type: 'email',
        dateEnvoi: new Date().toISOString(),
        statut: 'echec'
      };
    }
  }

  // Envoyer un message (vrai SMS/Email)
  static async envoyerMessage(destinataire, sujet, message, type = 'sms') {
    const messageData = {
      id: this.generateId(),
      destinataire: destinataire,
      sujet: sujet,
      message: message,
      type: type, // email, sms
      dateEnvoi: new Date().toISOString(),
      statut: 'en_cours'
    };

    let envoyeResult = { success: false };

    // Mode démo si pas de configuration réelle
    const isDemoMode = !process.env.TWILIO_ACCOUNT_SID && !process.env.EMAIL_USER;

    try {
      if (isDemoMode) {
        // Mode simulation avec affichage console
        console.log(`\n📱 === SIMULATION ${type.toUpperCase()} ===`);
        console.log(`À: ${destinataire}`);
        console.log(`Sujet: ${sujet}`);
        console.log(`Message: ${message}`);
        console.log(`=== FIN SIMULATION ===\n`);
        envoyeResult = { success: true, demo: true };
      } else if (type === 'sms') {
        // Envoyer SMS réel
        envoyeResult = await this.envoyerSMS(destinataire, message);
      } else if (type === 'email') {
        // Envoyer Email réel
        envoyeResult = await this.envoyerEmail(destinataire, sujet, message);
      }

      // Mettre à jour le statut
      messageData.statut = envoyeResult.success ? 'envoye' : 'echec';
      if (!envoyeResult.success) {
        messageData.erreur = envoyeResult.error;
      }
      if (envoyeResult.demo) {
        messageData.demo = true;
      }

    } catch (error) {
      console.error(`❌ Erreur générale envoi message:`, error);
      messageData.statut = 'echec';
      messageData.erreur = error.message;
    }

    // Sauvegarder le message
    this.sauvegarderMessage(messageData);
    
    const modeText = isDemoMode ? ' (DÉMO)' : '';
    console.log(`📧 Message ${messageData.statut} à ${destinataire} (${type})${modeText}`);
    if (messageData.statut === 'echec') {
      console.log(`   Erreur: ${messageData.erreur}`);
    }

    return messageData;
  }

  // Sauvegarder les messages dans un fichier JSON
  static sauvegarderMessage(messageData) {
    try {
      const filePath = path.join(__dirname, '..', 'data', 'messages.json');
      
      // Créer le fichier s'il n'existe pas
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      }
      
      const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      messages.push(messageData);
      fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
    } catch (error) {
      console.error('Erreur sauvegarde message:', error);
    }
  }

  // Obtenir tous les messages
  static obtenirMessages() {
    try {
      const filePath = path.join(__dirname, '..', 'data', 'messages.json');
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      return [];
    } catch (error) {
      console.error('Erreur lecture messages:', error);
      return [];
    }
  }

  // Envoyer les notifications pour un colis
  static async notifierColis(type, colisData) {
    const template = this.getMessageTemplate(type, colisData);
    if (!template) {
      console.error(`Template non trouvé pour le type: ${type}`);
      return;
    }

    const messagesEnvoyes = [];

    // Envoyer à l'expéditeur
    if (template.expediteur && colisData.expediteur && colisData.expediteur.telephone) {
      const message = await this.envoyerMessage(
        colisData.expediteur.telephone,
        template.expediteur.sujet,
        template.expediteur.message,
        'sms'
      );
      messagesEnvoyes.push(message);
    }

    // Envoyer au destinataire (SMS)
    if (template.destinataire && colisData.destinataire && colisData.destinataire.telephone) {
      const message = await this.envoyerMessage(
        colisData.destinataire.telephone,
        template.destinataire.sujet,
        template.destinataire.message,
        'sms'
      );
      messagesEnvoyes.push(message);
    }

    // Envoyer emails stylisés si disponibles
    const emailTemplate = this.getEmailHTMLTemplate(type, colisData);
    if (emailTemplate && emailTemplate.expediteur && colisData.expediteur && colisData.expediteur.email) {
      const messageEmail = await this.envoyerEmailHTML(
        colisData.expediteur.email,
        emailTemplate.expediteur.sujet,
        emailTemplate.expediteur.html
      );
      this.sauvegarderMessage(messageEmail);
      messagesEnvoyes.push(messageEmail);
    }

    if (emailTemplate && emailTemplate.destinataire && colisData.destinataire && colisData.destinataire.email) {
      const messageEmail = await this.envoyerEmailHTML(
        colisData.destinataire.email,
        emailTemplate.destinataire.sujet,
        emailTemplate.destinataire.html
      );
      this.sauvegarderMessage(messageEmail);
      messagesEnvoyes.push(messageEmail);
    }

    return messagesEnvoyes;
  }
}

module.exports = MessageService;
