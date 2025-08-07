# Intégration API Externe TransCargo

## 🔗 Configuration API

Votre application TransCargo utilise maintenant une API JSON externe déployée sur Render :

**URL de l'API** : https://json-server-typescript-5.onrender.com

## 📁 Structure des données

### Endpoints disponibles
- `GET /cargaisons` - Liste toutes les cargaisons
- `GET /cargaisons/:id` - Récupère une cargaison par ID
- `POST /cargaisons` - Crée une nouvelle cargaison
- `PUT /cargaisons/:id` - Met à jour une cargaison
- `DELETE /cargaisons/:id` - Supprime une cargaison

- `GET /colis` - Liste tous les colis
- `GET /colis/:id` - Récupère un colis par ID
- `POST /colis` - Crée un nouveau colis
- `PUT /colis/:id` - Met à jour un colis
- `DELETE /colis/:id` - Supprime un colis

## 🔧 Fichiers modifiés

### Nouveaux fichiers
- `config.js` - Configuration de l'URL API
- `api-service.js` - Service pour gérer les appels API
- `API_INTEGRATION.md` - Ce guide

### Fichiers mis à jour
- `server.js` - Routes modifiées pour utiliser l'API externe
- `package.json` - Ajout de node-fetch

## 🚀 Avantages de cette architecture

### ✅ **Séparation des responsabilités**
- **API de données** : JSON Server sur Render
- **API métier** : TransCargo sur Render
- **Interface** : Frontend intégré

### ✅ **Scalabilité**
- Données centralisées
- API indépendante
- Possible de connecter d'autres applications

### ✅ **Maintenance simplifiée**
- Mise à jour des données séparée de la logique
- Sauvegarde centralisée
- Monitoring séparé

## 🔄 Fonctionnement

```
Frontend ──→ TransCargo API ──→ JSON Server API ──→ Données JSON
         ←──                ←──                  ←──
```

### Flux de données
1. **Frontend** fait une requête à TransCargo API
2. **TransCargo API** traite la logique métier
3. **TransCargo API** appelle JSON Server API
4. **JSON Server** retourne les données
5. **TransCargo API** traite et renvoie la réponse
6. **Frontend** affiche les données

## 🛠️ Développement local

### Tester l'intégration
```bash
# Vérifier que l'API externe fonctionne
curl https://json-server-typescript-5.onrender.com/cargaisons

# Démarrer TransCargo en local
npm start
```

### Debug
```bash
# Voir les logs des requêtes API
console.log dans api-service.js
```

## 🌐 Déploiement

Lors du déploiement sur Render, l'application :
1. **Se connecte automatiquement** à votre JSON Server
2. **Utilise les données centralisées**
3. **Fonctionne de manière distribuée**

## 📊 Monitoring

### Vérifications importantes
- ✅ JSON Server accessible : https://json-server-typescript-5.onrender.com
- ✅ TransCargo API fonctionne
- ✅ Données synchronisées
- ✅ Pas d'erreurs CORS

### Métriques à surveiller
- **Latence** des appels API
- **Disponibilité** du JSON Server
- **Erreurs** de connexion
- **Performance** globale

## 🔐 Sécurité

### Points d'attention
- **JSON Server** est public (lecture/écriture)
- **TransCargo API** a l'authentification
- **Protection** au niveau applicatif

### Recommandations
- Surveiller les accès non autorisés
- Sauvegarder régulièrement les données
- Considérer l'ajout d'authentification au JSON Server

## 🎯 Prochaines étapes

### Améliorations possibles
1. **Cache** pour réduire les appels API
2. **Authentification** sur JSON Server
3. **Base de données** réelle (PostgreSQL, MongoDB)
4. **WebSockets** pour les mises à jour temps réel

### Migration future
```javascript
// Facile de changer d'API en modifiant config.js
const API_CONFIG = {
  BASE_URL: 'https://nouvelle-api.com',
  // ...
};
```

---

**✅ Votre architecture est maintenant modulaire et scalable !**
