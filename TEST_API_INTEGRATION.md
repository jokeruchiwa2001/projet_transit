# Test de l'intégration API TransCargo

## 🧪 Guide de test de l'API externe

### 1. Vérifier l'API JSON Server

```bash
# Tester la disponibilité de l'API
curl https://json-server-typescript-5.onrender.com/cargaisons
curl https://json-server-typescript-5.onrender.com/colis
```

**Résultat attendu** : Réponse JSON (tableau vide ou avec données)

### 2. Tester TransCargo en local

```bash
# Démarrer l'application
npm start

# Vérifier que le serveur démarre
# Devrait afficher : "🚀 Serveur TransCargo démarré sur le port 3005"
```

### 3. Tests des endpoints principaux

#### Test de connexion admin
```bash
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Résultat attendu** : Token d'authentification

#### Test de récupération des cargaisons
```bash
# Remplacez TOKEN par le token obtenu ci-dessus
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3005/api/cargaisons
```

**Résultat attendu** : Liste des cargaisons depuis l'API externe

### 4. Test de création de cargaison

```bash
curl -X POST http://localhost:3005/api/cargaisons \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "maritime",
    "lieuDepart": "Dakar",
    "lieuArrivee": "Paris",
    "poidsMax": 5000,
    "coordonneesDepart": {"latitude": 14.6937, "longitude": -17.4441},
    "coordonneesArrivee": {"latitude": 48.8566, "longitude": 2.3522}
  }'
```

**Résultat attendu** : Cargaison créée et sauvegardée dans l'API externe

### 5. Test via l'interface web

1. **Ouvrir** : http://localhost:3005/admin.html
2. **Se connecter** avec admin/admin123
3. **Créer une cargaison** :
   - Type : Maritime
   - Sélectionner lieux sur la carte
   - Poids max : 1000 kg
4. **Ajouter un colis** :
   - Informations expéditeur/destinataire
   - Type produit : Alimentaire
   - Poids : 100 kg

### 6. Vérification des données

#### Vérifier sur l'API externe
```bash
# Voir les cargaisons créées
curl https://json-server-typescript-5.onrender.com/cargaisons

# Voir les colis créés
curl https://json-server-typescript-5.onrender.com/colis
```

#### Vérifier la synchronisation
- Les données créées via TransCargo doivent apparaître sur l'API externe
- Les modifications doivent être persistantes

## ✅ Checklist de validation

### Architecture
- [ ] API externe accessible
- [ ] TransCargo se connecte à l'API externe
- [ ] Pas de fichiers JSON locaux utilisés
- [ ] Données centralisées

### Fonctionnalités
- [ ] Création de cargaisons
- [ ] Ajout de colis
- [ ] Calcul de prix correct
- [ ] Validation des règles métier
- [ ] Interface web fonctionnelle

### Performance
- [ ] Temps de réponse acceptable (<2s)
- [ ] Gestion des erreurs réseau
- [ ] Pas de timeouts excessifs

### Données
- [ ] Persistence des données
- [ ] Cohérence entre TransCargo et API externe
- [ ] Pas de perte de données

## 🐛 Troubleshooting

### Erreur de connexion à l'API
```bash
# Vérifier la connectivité
ping json-server-typescript-5.onrender.com
curl -I https://json-server-typescript-5.onrender.com
```

### Erreur CORS
- Vérifier que l'API externe autorise les requêtes cross-origin
- Headers CORS correctement configurés

### Erreur de timeout
- L'API externe peut être en veille (plan gratuit Render)
- Faire une requête pour la "réveiller"

### Données non synchronisées
```bash
# Vérifier les logs du serveur
# Regarder les erreurs de requêtes API
```

## 📊 Monitoring en production

### Métriques importantes
- **Latence** des appels API externes
- **Taux d'erreur** des requêtes
- **Disponibilité** de l'API externe
- **Volume** de données

### Alertes à configurer
- API externe indisponible > 1 minute
- Latence > 5 secondes
- Taux d'erreur > 5%

---

**🎯 Objectif** : Validation complète de l'architecture distribuée TransCargo
