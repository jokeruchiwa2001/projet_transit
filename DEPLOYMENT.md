# Guide de déploiement TransCargo

## Configuration pour la production

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Modifiez le fichier `.env` avec vos vraies valeurs :

```env
# Google Maps API Key (OBLIGATOIRE)
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Configuration du serveur
PORT=3005
NODE_ENV=production

# Configuration de l'application
APP_NAME=TransCargo
APP_URL=https://votre-domaine.com

# Sécurité (générez des clés aléatoirement)
JWT_SECRET=votre_cle_jwt_super_secrete_ici
SESSION_SECRET=votre_cle_session_super_secrete_ici
```

### 2. Configuration Google Maps API

#### Obtenir une clé API Google Maps :

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs suivantes :
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
4. Créez une clé API :
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "API Key"
   - Notez votre clé API

#### Sécuriser votre clé API :

1. Dans Google Cloud Console, cliquez sur votre clé API
2. Sous "Application restrictions", choisissez "HTTP referrers"
3. Ajoutez vos domaines autorisés :
   ```
   https://votre-domaine.com/*
   https://www.votre-domaine.com/*
   ```
4. Sous "API restrictions", sélectionnez les APIs que vous utilisez

### 3. Déploiement

#### Option 1 : Serveur VPS/Dédié

```bash
# Installation des dépendances
npm install

# Build si nécessaire
npm run build

# Démarrage en production
NODE_ENV=production npm start
```

#### Option 2 : Avec PM2 (recommandé)

```bash
# Installation de PM2
npm install -g pm2

# Démarrage avec PM2
pm2 start server.js --name "transcargo"

# Sauvegarde de la configuration PM2
pm2 save
pm2 startup
```

#### Option 3 : Docker

Créez un `Dockerfile` :

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3005

CMD ["npm", "start"]
```

### 4. Configuration Nginx (optionnel)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. SSL/HTTPS (recommandé)

Utilisez Let's Encrypt avec Certbot :

```bash
sudo certbot --nginx -d votre-domaine.com
```

### 6. Vérifications post-déploiement

1. ✅ L'application se charge à `https://votre-domaine.com`
2. ✅ La connexion admin fonctionne
3. ✅ Google Maps se charge correctement
4. ✅ La création de cargaisons fonctionne
5. ✅ L'ajout de colis fonctionne
6. ✅ Les calculs de prix sont corrects

### 7. Maintenance

- Les données sont stockées dans le dossier `data/`
- Sauvegardez régulièrement les fichiers JSON
- Surveillez les logs avec `pm2 logs transcargo`
- Mettez à jour les dépendances avec `npm audit`

### 8. Sécurité

- Changez les mots de passe par défaut
- Utilisez HTTPS uniquement
- Configurez un firewall
- Limitez l'accès SSH
- Sauvegardez les données régulièrement

---

## Support

Si vous rencontrez des problèmes de déploiement, vérifiez :

1. Les logs du serveur : `pm2 logs transcargo`
2. La configuration `.env`
3. La validité de votre clé Google Maps API
4. Les permissions des fichiers de données
