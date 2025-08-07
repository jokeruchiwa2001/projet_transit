# TransCargo - Application de Gestion de Cargaisons

🚢 **Application complète de gestion de cargaisons maritimes, aériennes et routières**

## 🌟 Fonctionnalités

### 📦 Gestion des Cargaisons
- ✅ Création de cargaisons (maritime, aérienne, routière)
- ✅ Sélection interactive de lieux avec carte Leaflet
- ✅ Calcul automatique des distances
- ✅ Gestion des états (ouvert, fermé, en cours, arrivé)
- ✅ Validation des capacités de poids

### 📋 Gestion des Colis
- ✅ Enregistrement des colis avec calcul automatique des prix
- ✅ Système de tarification selon le type de produit :
  - **Alimentaire** : 100F/kg/km (routière), 90F/kg/km + 5000F (maritime), 300F/kg/km (aérienne)
  - **Chimique** : 500F/kg/degré (routière uniquement)
  - **Matériel** : 200F/kg/km (routière), 400F/kg/km (maritime), 1000F/kg (aérienne)
- ✅ Prix minimum automatique de 10000F
- ✅ Codes de suivi uniques
- ✅ États de livraison complets
- ✅ Génération de reçus

### 🗺️ Carte Interactive
- ✅ **Leaflet + OpenStreetMap** (gratuit, sans clé API)
- ✅ Sélection de lieux par clic
- ✅ Recherche de villes/adresses
- ✅ Géocodage automatique

### 👥 Interface Utilisateur
- ✅ **Interface publique** pour le suivi des colis
- ✅ **Interface administrateur** complète
- ✅ **Design responsive** moderne
- ✅ **Notifications** en temps réel

### 🔒 Sécurité
- ✅ Authentification administrateur
- ✅ Protection des routes API
- ✅ Tokens d'accès sécurisés

## 🚀 Accès à l'Application

### Interface Publique
👉 **URL** : https://votre-app.onrender.com
- Suivi des colis par code
- Consultation des statuts

### Interface Administrateur  
👉 **URL** : https://votre-app.onrender.com/admin.html

**Identifiants** :
- **Username** : `admin`
- **Password** : `admin123`

## 📱 Utilisation

### Pour les Clients
1. Rendez-vous sur l'interface publique
2. Entrez votre code de suivi
3. Consultez l'état de votre colis

### Pour les Gestionnaires
1. Connectez-vous à l'interface admin
2. **Créez des cargaisons** :
   - Sélectionnez le type (maritime/aérienne/routière)
   - Choisissez les lieux sur la carte
   - Définissez la capacité
3. **Ajoutez des colis** :
   - Remplissez les informations client
   - Sélectionnez le type de produit
   - Le prix est calculé automatiquement
4. **Gérez les expéditions** :
   - Fermez les cargaisons pleines
   - Démarrez les transports
   - Marquez les arrivées

## 🛠️ Technologie

- **Backend** : Node.js + Express
- **Frontend** : HTML5 + JavaScript + CSS3
- **Carte** : Leaflet + OpenStreetMap
- **Stockage** : JSON Files
- **Déploiement** : Render
- **Gratuit** : Aucune clé API requise

## 📊 API Endpoints

### Publiques
- `GET /` - Interface publique
- `GET /api/colis/track?code=XXX` - Suivi colis

### Administrateur (authentification requise)
- `POST /api/auth/login` - Connexion
- `GET /api/cargaisons` - Liste des cargaisons
- `POST /api/cargaisons` - Créer une cargaison
- `POST /api/colis` - Enregistrer un colis
- `POST /api/cargaisons/:id/start` - Démarrer cargaison
- `POST /api/cargaisons/:id/close` - Fermer cargaison

## 💰 Tarification

### Alimentaire
- 🚛 **Routière** : 100F/kg/km
- 🚢 **Maritime** : 90F/kg/km + 5000F changement
- ✈️ **Aérienne** : 300F/kg/km

### Chimique
- 🚛 **Routière** : 500F/kg/degré
- ❌ Maritime/Aérienne : Interdits

### Matériel
- 🚛 **Routière** : 200F/kg/km
- 🚢 **Maritime** : 400F/kg/km  
- ✈️ **Aérienne** : 1000F/kg

**Prix minimum** : 10000F pour tous les colis

## 🎯 Règles Métier

- ✅ Une cargaison ne peut partir que si elle contient au moins un colis
- ✅ Les colis sont automatiquement assignés aux cargaisons ouvertes
- ✅ Vérification automatique des capacités de poids
- ✅ Codes de suivi uniques générés automatiquement
- ✅ Calcul des prix selon la distance réelle

## 📞 Support

Cette application est prête pour la production et entièrement fonctionnelle !

**Développé avec ❤️ pour une gestion efficace des cargaisons**

---

*Dernière mise à jour : $(date)*
