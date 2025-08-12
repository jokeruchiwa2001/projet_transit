# 📧📱 Configuration du Système de Messagerie

## 🎯 Services Intégrés

### 1. **SMS Gratuit (TextBelt)**
- ✅ **Service** : TextBelt API
- ✅ **Gratuit** : 1 SMS par jour par adresse IP
- ✅ **International** : Fonctionne dans la plupart des pays
- ✅ **Format numéro** : +221777123456 (avec indicatif pays)

### 2. **Email Gratuit (Gmail)**
- ✅ **Service** : Gmail SMTP avec Nodemailer  
- ✅ **Gratuit** : Illimité avec compte Gmail
- ✅ **Fiable** : Service Google stable

## ⚙️ Configuration

### 1. **Configuration Email (.env)**
```env
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
```

### 2. **Activer Gmail pour applications**
1. Aller sur [Google Account Security](https://myaccount.google.com/security)
2. Activer **"Validation en 2 étapes"**
3. Générer un **"Mot de passe d'application"**
4. Utiliser ce mot de passe dans `EMAIL_PASS`

## 🧪 Test du Système

### Test SMS
```bash
node test-sms.js
```

### Test complet
```bash
# 1. Modifier le numéro dans test-sms.js
# 2. Lancer le test
node test-sms.js

# 3. Créer un vrai colis via l'interface
# Les SMS/emails seront envoyés automatiquement
```

## 🔧 Limitations & Solutions

### TextBelt (SMS Gratuit)
- **Limite** : 1 SMS/jour par IP
- **Solution** : Acheter des crédits TextBelt ($0.015/SMS)
- **Alternative** : Twilio (plus cher mais plus fiable)

### Gmail (Email)
- **Limite** : ~100 emails/jour pour nouveaux comptes
- **Solution** : Compte Gmail vérifié (limite plus élevée)

## 🚀 Services Premium (Optionnels)

### Twilio (SMS/WhatsApp)
```bash
npm install twilio
```

### SendGrid (Email)
```bash
npm install @sendgrid/mail
```

## 📱 Formats de Numéros Supportés

### Sénégal
- ✅ `+221777123456`
- ✅ `+221781234567`
- ✅ `+221701234567`

### International
- ✅ `+33612345678` (France)
- ✅ `+1234567890` (USA)
- ✅ `+447123456789` (UK)

## ✅ Vérification du Fonctionnement

1. **Console** : Messages de succès/erreur
2. **Fichier** : `data/messages.json`
3. **Réception** : SMS/Email sur votre téléphone/email
