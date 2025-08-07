# TransCargo - Système de Gestion de Cargaisons

![TransCargo Logo](https://img.shields.io/badge/TransCargo-Logistics-blue)

Application complète de gestion de cargaisons maritimes, aériennes et routières avec système de suivi en temps réel et intégration Google Maps.

## 🚀 Fonctionnalités

### Gestion des Cargaisons
- ✅ Création de cargaisons (maritime, aérienne, routière)
- ✅ Gestion des états (ouvert/fermé, en attente/en cours/arrivé)
- ✅ Calcul automatique des trajets avec Google Maps
- ✅ Gestion du poids maximum et des contraintes par type
- ✅ Fermeture et réouverture des cargaisons

### Gestion des Colis
- ✅ Enregistrement des expéditeurs et destinataires
- ✅ Génération automatique de codes de suivi
- ✅ Calcul des prix avec minimum de 10,000 FCFA
- ✅ États: En attente → En cours → Arrivé → Récupéré
- ✅ Gestion des colis perdus et archivage automatique
- ✅ Génération de reçus d'expédition

### Recherche et Suivi
- ✅ Recherche de colis par code
- ✅ Recherche de cargaisons (code, lieu, date, type)
- ✅ Système de suivi public pour les clients
- ✅ Estimation des délais de livraison
- ✅ Détection automatique des retards

### Interface Web
- ✅ Interface gestionnaire complète
- ✅ Interface de suivi public
- ✅ Tableau de bord avec statistiques
- ✅ Graphiques et métriques en temps réel
- ✅ Design responsive et moderne

### Intégrations
- ✅ Google Maps pour les trajets et coordonnées
- ✅ Stockage JSON pour la persistance des données
- ✅ API REST complète
- ✅ Interface TypeScript type-safe

## 📦 Structure du Projet

```
project_typescript/
├── src/
│   ├── Model/
│   │   ├── Cargaison.ts          # Classe abstraite de base
│   │   ├── Aerienne.ts           # Cargaison aérienne
│   │   ├── Maritime.ts           # Cargaison maritime
│   │   ├── Routiere.ts           # Cargaison routière
│   │   ├── Colis.ts              # Gestion des colis
│   │   └── Produit.ts            # Classes de produits
│   ├── Services/
│   │   ├── CargaisonService.ts   # Service principal
│   │   └── GoogleMapsService.ts  # Intégration Google Maps
│   ├── Storage/
│   │   └── DataManager.ts        # Gestion du stockage JSON
│   └── server.ts                 # Serveur Express
├── public/
│   ├── index.html               # Interface web
│   ├── styles.css               # Styles modernes
│   └── app.js                   # JavaScript frontend
└── data/                        # Données JSON (auto-créé)
    ├── cargaisons.json
    ├── colis.json
    └── clients.json
```

## 🛠️ Installation et Démarrage

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation

1. **Cloner et installer les dépendances:**
```bash
cd project_typescript
npm install
```

2. **Configuration Google Maps (optionnel):**
```bash
# Créer un fichier .env
echo "GOOGLE_MAPS_API_KEY=votre_clé_api_google_maps" > .env
```

3. **Compiler le TypeScript:**
```bash
npm run build
```

4. **Démarrer l'application:**

**Mode développement:**
```bash
npm run dev
```

**Mode production:**
```bash
npm start
```

5. **Accéder à l'application:**
- Interface web: http://localhost:3000
- API: http://localhost:3000/api

## 🔧 Scripts Disponibles

```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement
npm run build      # Compiler TypeScript
npm run watch      # Compiler en mode watch
npm run dev:watch  # Développement avec rechargement auto
```

## 📡 API Endpoints

### Cargaisons
- `GET /api/cargaisons` - Liste toutes les cargaisons
- `POST /api/cargaisons` - Créer une nouvelle cargaison
- `GET /api/cargaisons/search` - Rechercher des cargaisons
- `POST /api/cargaisons/:id/close` - Fermer une cargaison
- `POST /api/cargaisons/:id/reopen` - Rouvrir une cargaison
- `POST /api/cargaisons/:id/start` - Démarrer une cargaison
- `POST /api/cargaisons/:id/arrive` - Marquer comme arrivée

### Colis
- `GET /api/colis` - Liste tous les colis
- `POST /api/colis` - Enregistrer un nouveau colis
- `GET /api/colis/search` - Rechercher un colis
- `GET /api/colis/track` - Suivre un colis
- `GET /api/colis/:id/recu` - Générer un reçu
- `POST /api/colis/:id/recupere` - Marquer comme récupéré
- `POST /api/colis/:id/perdu` - Marquer comme perdu

### Statistiques
- `GET /api/statistiques` - Obtenir les statistiques

## 💼 Utilisation

### Pour les Gestionnaires

1. **Créer une cargaison:**
   - Aller dans l'onglet "Gestionnaire"
   - Choisir le type de transport
   - Saisir les lieux de départ et d'arrivée
   - Le système calcule automatiquement la distance

2. **Enregistrer un colis:**
   - Onglet "Nouveau Colis"
   - Saisir les informations de l'expéditeur et du destinataire
   - Détails du colis (poids, type, transport)
   - Un reçu est généré automatiquement

3. **Rechercher et gérer:**
   - Recherche par code de colis ou cargaison
   - Actions: fermer/rouvrir, démarrer, marquer arrivée
   - Gestion des états des colis

### Pour les Clients

1. **Suivre un colis:**
   - Aller dans "Suivi Colis"
   - Entrer le code de suivi reçu
   - Voir l'état et l'estimation d'arrivée

## 💰 Tarification

- **Prix minimum:** 10,000 FCFA par colis
- **Tarifs par kg:**
  - Maritime: 500 FCFA/kg
  - Aérienne: 1,000 FCFA/kg
  - Routière: 300 FCFA/kg

## 🗺️ Intégration Google Maps

Le système utilise l'API Google Maps pour:
- Géocoder les adresses
- Calculer les distances
- Estimer les temps de trajet
- Afficher les cartes (optionnel)

**Mode simulation:** Si aucune clé API n'est configurée, le système fonctionne en mode simulation avec des données d'exemple pour le Sénégal.

## 📊 Types de Transport et Contraintes

### Maritime
- Accepte tous types de produits
- Frais supplémentaires de 5,000 FCFA si produits alimentaires et chimiques mélangés

### Aérienne
- **Interdit:** Produits chimiques
- Pas de frais supplémentaires

### Routière
- Accepte tous types de produits
- Frais supplémentaires de 2,500 FCFA si poids total > 1000 kg

## 🔄 États des Colis

1. **En attente** - Colis enregistré, en attente de départ
2. **En cours** - Cargaison partie, colis en transit
3. **Arrivé** - Colis arrivé à destination
4. **Récupéré** - Colis remis au destinataire
5. **Perdu** - Colis déclaré perdu
6. **Archivé** - Colis archivé automatiquement (30 jours après récupération)

## 🛡️ Sécurité

- Validation des données côté serveur
- Gestion d'erreurs appropriée
- Pas de stockage de données sensibles
- CORS configuré pour la sécurité

## 🎨 Design

Interface moderne avec:
- Design responsive (mobile-friendly)
- Couleurs et typographie professionnelles
- Animations et transitions fluides
- Icônes Font Awesome
- Graphiques Chart.js

## 📈 Fonctionnalités Avancées

- **Archivage automatique** des colis anciens
- **Détection de retards** automatique
- **Statistiques en temps réel**
- **Génération de reçus** formatés
- **Notifications** utilisateur
- **Modal et formulaires** interactifs

## 🔧 Configuration

Variables d'environnement disponibles:
```bash
PORT=3000                           # Port du serveur
GOOGLE_MAPS_API_KEY=your_api_key   # Clé API Google Maps
NODE_ENV=development               # Environnement
```

## 📝 Données de Test

L'application fonctionne immédiatement avec des données simulées. Les fichiers JSON sont créés automatiquement dans le dossier `data/`.

## 🤝 Contribution

Pour contribuer au projet:
1. Fork le repository
2. Créer une branche feature
3. Commit les changements
4. Push et créer une Pull Request

## 📄 Licence

Ce projet est sous licence ISC.

---

**TransCargo** - Solution complète de gestion logistique 🚢✈️🚛
