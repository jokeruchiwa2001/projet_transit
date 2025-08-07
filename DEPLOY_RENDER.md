# Guide de déploiement TransCargo sur Render

## 🚀 Étapes de déploiement

### 1. Préparation du projet

✅ **Fichiers ajoutés/modifiés** :
- `render.yaml` - Configuration Render
- `.gitignore` - Fichiers à ignorer
- `server.js` - Port configuré pour Render
- Variables d'environnement configurées

### 2. Créer un repository GitHub

1. **Créez un nouveau repository** sur GitHub
2. **Initialisez Git** dans votre projet :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - TransCargo application"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/transcargo.git
   git push -u origin main
   ```

### 3. Déployer sur Render

1. **Connectez-vous à Render** : https://render.com
2. **Cliquez sur "New +"** → **"Web Service"**
3. **Connectez votre repository GitHub**
4. **Configurez le service** :
   - **Name** : `transcargo`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : `Free` (pour commencer)

### 4. Variables d'environnement sur Render

Dans les **Environment Variables** de votre service Render, ajoutez :

```
NODE_ENV=production
```

### 5. Déploiement automatique

Render va automatiquement :
1. **Installer** les dépendances (`npm install`)
2. **Démarrer** le serveur (`npm start`)
3. **Assigner** une URL publique (ex: `https://transcargo.onrender.com`)

### 6. Configuration des données

Les fichiers JSON dans le dossier `data/` seront créés automatiquement :
- `cargaisons.json`
- `colis.json`
- `clients.json`

### 7. URLs d'accès

Une fois déployé, votre application sera accessible à :
- **Interface publique** : `https://votre-app.onrender.com`
- **Interface admin** : `https://votre-app.onrender.com/admin.html`
- **API** : `https://votre-app.onrender.com/api`

### 8. Connexion admin

**Identifiants par défaut** :
- **Username** : `admin`
- **Password** : `admin123`

⚠️ **Important** : Changez ces identifiants en production !

## 🔧 Configurations spéciales Render

### Domaine personnalisé (optionnel)

Si vous avez un domaine :
1. Allez dans **Settings** → **Custom Domains**
2. Ajoutez votre domaine
3. Configurez les DNS selon les instructions

### Mise à l'échelle

Pour plus de performances :
1. **Upgrader** vers un plan payant
2. **Augmenter** les ressources
3. **Activer** l'auto-scaling

### Surveillance

Render fournit :
- **Logs** en temps réel
- **Métriques** de performance
- **Alertes** en cas de problème

## 🐛 Dépannage courant

### Erreur de build
```bash
# Vérifiez package.json
npm install
npm start
```

### Problème de port
```bash
# Le port est configuré automatiquement par Render
process.env.PORT
```

### Données perdues
```bash
# Les données JSON sont persistantes sur Render
# Sauvegardez régulièrement via l'API
```

## 📊 Monitoring

### Vérifications post-déploiement

1. ✅ **Application** accessible
2. ✅ **API** fonctionnelle (`/api/config`)
3. ✅ **Admin** login fonctionne
4. ✅ **Création** cargaisons/colis
5. ✅ **Carte Leaflet** opérationnelle

### Commandes utiles

```bash
# Logs en temps réel
# Accessible via le dashboard Render

# Redéploiement manuel
# Bouton "Manual Deploy" sur Render

# Rollback
# Bouton "Redeploy" version précédente
```

## 🔐 Sécurité

### Recommandations production

1. **Changez** les mots de passe par défaut
2. **Activez** HTTPS (automatique sur Render)
3. **Configurez** des sauvegardes régulières
4. **Surveillez** les logs d'accès

### Variables d'environnement sensibles

```env
# À ajouter sur Render si nécessaire
JWT_SECRET=your_super_secret_key
SESSION_SECRET=another_secret_key
```

## 🎉 Félicitations !

Votre application TransCargo est maintenant déployée et accessible mondialement !

**URL de votre application** : https://votre-app.onrender.com

---

## Support

En cas de problème :
1. **Consultez** les logs Render
2. **Vérifiez** la configuration
3. **Redéployez** si nécessaire
