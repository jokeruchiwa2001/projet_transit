# GP du Monde - Gestion de Cargaisons

Application de gestion de cargaisons pour l'entreprise de transport GP du Monde.

## 🏗️ Architecture du Projet

```
project_typescript/
├── src/                     # Code source TypeScript
│   ├── Model/              # Classes métier
│   │   ├── Produit.ts      # Classe abstraite produit
│   │   ├── Alimentaire.ts  # Produits alimentaires
│   │   ├── Chimique.ts     # Produits chimiques
│   │   ├── Materiel.ts     # Classe abstraite matériel
│   │   ├── Fragile.ts      # Matériel fragile
│   │   ├── Incassable.ts   # Matériel incassable
│   │   ├── Cargaison.ts    # Classe abstraite cargaison
│   │   ├── Routiere.ts     # Transport routier
│   │   ├── Maritime.ts     # Transport maritime
│   │   └── Aerienne.ts     # Transport aérien
│   └── test.ts             # Tests complets
├── dist/                   # Code TypeScript compilé (.js)
├── public/                 # Interface web publique
│   ├── index.php          # Point d'entrée PHP
│   └── assets/            # CSS, JS, images
├── views/                  # Vues PHP
├── routes/                 # Routes API PHP
├── api/                    # Scripts Node.js utilisant TypeScript
└── data/                   # Stockage JSON (simulation BDD)
```

## 🚀 Installation et Configuration

### Prérequis
- **PHP 7.4+** avec serveur Apache/Nginx
- **Node.js 16+** avec npm
- **TypeScript** installé globalement

### Installation

1. **Compiler le TypeScript** :
```bash
npm install -g typescript @types/node
npx tsc
```

2. **Configurer le serveur web** :
   - Pointer le document root vers `public/`
   - Activer mod_rewrite pour Apache
   - Assurer que PHP peut exécuter des commandes shell

3. **Permissions** :
```bash
chmod +x api/*.js
chmod 755 data/
```

## 🎯 Fonctionnalités Principales

### Classes TypeScript (POO Complète)
- ✅ **Encapsulation** avec getters/setters
- ✅ **Héritage** et classes abstraites
- ✅ **Polymorphisme** dans les calculs
- ✅ **Validation** des règles métier

### Interface Web
- 📊 **Dashboard** avec statistiques
- 📦 **Gestion des cargaisons**
- 👥 **Gestion des clients**
- 🔍 **Suivi des colis**

### API Hybride
- **PHP** pour les routes et la persistance
- **TypeScript/Node.js** pour la logique métier
- **JSON** pour l'échange de données

## 🔧 Utilisation

### Démarrer l'application
1. Accéder à `http://localhost/` (ou votre domaine)
2. Navigation automatique vers le dashboard

### Créer une cargaison
1. Aller dans **Cargaisons** > **Nouvelle Cargaison**
2. Sélectionner le type (Maritime, Aérienne, Routière)
3. Définir distance et lieux de départ/arrivée

### Ajouter des produits
1. Cliquer sur **Ajouter produit** dans une cargaison
2. Choisir le type de produit
3. Le système valide automatiquement les contraintes

## 📋 Règles Métier Implémentées

### Contraintes de Transport
- 🚢 **Produits chimiques** → UNIQUEMENT maritime
- ❌ **Produits fragiles** → JAMAIS maritime
- 📊 **1-10 produits** par cargaison

### Calcul des Tarifs
```
                 Routier    Maritime    Aérien
Alimentaire     100F/kg/km  50F/kg/km   300F/kg/km
Chimique           ❌       500F/kg×toxicité  ❌
Matériel       200F/kg/km  400F/kg/km   1000F/kg
```

### Frais Supplémentaires (Maritime)
- **Alimentaires** : +5000F (chargement)
- **Chimiques** : +10000F (entretien)

## 🧪 Tests

Exécuter les tests TypeScript :
```bash
node dist/test.js
```

Les tests couvrent :
- ✅ Création des produits et cargaisons
- ✅ Validation des contraintes
- ✅ Calculs de frais
- ✅ Encapsulation (getters/setters)
- ✅ Gestion d'erreurs

## 🎨 Interface Utilisateur

### Technologies Frontend
- **Tailwind CSS** pour le design
- **Feather Icons** pour les icônes
- **JavaScript vanilla** pour l'interactivité
- **Design responsive** mobile-first

### Fonctionnalités UI
- 📱 Interface responsive
- 🎨 Design moderne avec gradient
- ⚡ Interactions fluides
- 📊 Statistiques en temps réel
- 🔔 Notifications toast

## 🔄 Architecture API

### Flow de Données
```
Frontend (JS) → PHP Router → Node.js (TypeScript) → Response (JSON)
```

### Exemples d'API
- `POST /api/cargaisons/create` - Créer une cargaison
- `GET /api/cargaisons/list` - Lister les cargaisons
- `POST /api/produits/add` - Ajouter un produit

## 🛡️ Sécurité

- ✅ Validation côté serveur (PHP + TypeScript)
- ✅ Échappement des paramètres shell
- ✅ Headers de sécurité configurés
- ✅ Validation des types TypeScript

## 📝 Développement

### Ajouter une nouvelle fonctionnalité
1. Créer/modifier les classes dans `src/Model/`
2. Compiler : `npx tsc`
3. Créer l'API dans `api/`
4. Ajouter la route dans `routes/`
5. Mettre à jour le frontend

### Structure des Classes
- **Classes abstraites** : Produit, Materiel, Cargaison
- **Classes concrètes** : Alimentaire, Chimique, Fragile, Incassable, Routiere, Maritime, Aerienne
- **Méthodes requises** : `ajouterProduit()`, `calculerProduit()`, `sommeTotale()`, `nbProduit()`, `info()`

## 🎯 Prochaines Étapes

- [ ] Base de données MySQL/PostgreSQL
- [ ] Authentification utilisateurs
- [ ] API REST complète
- [ ] Export PDF des cargaisons
- [ ] Notifications en temps réel
- [ ] Module de facturation

## 📞 Support

Pour toute question sur l'implémentation ou l'utilisation du système, référez-vous aux tests dans `src/test.ts` qui documentent tous les cas d'usage.
