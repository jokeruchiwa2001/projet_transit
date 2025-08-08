const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Charger les variables d'environnement
require('dotenv').config();

// Rendre fetch disponible globalement pour compatibilité Node.js
global.fetch = fetch;

// Import du service API
const ApiService = require('./api-service');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// CSP pour autoriser les scripts inline et les ressources externes
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https://*.tile.openstreetmap.org https://*.openstreetmap.org; " +
    "connect-src 'self' https://nominatim.openstreetmap.org;"
  );
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Utilitaires de stockage JSON
const loadJSON = (filename) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) || [];
  } catch (error) {
    console.error(`Erreur lecture ${filename}:`, error);
    return [];
  }
};

const saveJSON = (filename, data) => {
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateId = (prefix) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix.toUpperCase()}-${timestamp}${random}`.toUpperCase();
};

const generateCodeDestinataire = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

const calculerPrixFinal = (prixCalcule) => {
  const PRIX_MINIMUM = 10000;
  return Math.max(prixCalcule, PRIX_MINIMUM);
};

// Simulation Google Maps
const simulateGeocode = (address) => {
  const mockLocations = {
    'dakar': { lieu: 'Dakar, Sénégal', latitude: 14.6937, longitude: -17.4441 },
    'thies': { lieu: 'Thiès, Sénégal', latitude: 14.7886, longitude: -16.9246 },
    'saint-louis': { lieu: 'Saint-Louis, Sénégal', latitude: 16.0361, longitude: -16.4803 },
    'kaolack': { lieu: 'Kaolack, Sénégal', latitude: 14.1612, longitude: -16.0723 }
  };

  const normalizedAddress = address.toLowerCase();
  for (const [key, location] of Object.entries(mockLocations)) {
    if (normalizedAddress.includes(key)) {
      return location;
    }
  }

  return {
    lieu: address,
    latitude: 14.6937 + (Math.random() - 0.5) * 2,
    longitude: -17.4441 + (Math.random() - 0.5) * 2
  };
};

const simulateDistance = (origin, destination) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
  const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
  const lat1 = origin.latitude * Math.PI / 180;
  const lat2 = destination.latitude * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

// Gestionnaires par défaut (à sécuriser avec une vraie base de données)
const gestionnaires = [
  { id: 1, username: 'admin', password: 'admin123', nom: 'Administrateur', role: 'admin' },
  { id: 2, username: 'gestionnaire', password: 'gest123', nom: 'Gestionnaire', role: 'gestionnaire' }
];

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  // Simple vérification du token (à remplacer par JWT en production)
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, timestamp] = decoded.split(':');
    
    // Vérifier que le token n'est pas expiré (24h)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: 'Token expiré' });
    }
    
    const user = gestionnaires.find(g => g.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide' });
  }
};

// Route pour la configuration publique
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    appName: process.env.APP_NAME || 'TransCargo',
    appUrl: process.env.APP_URL || `http://localhost:${PORT}`
  });
});

// Routes d'authentification
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }
    
    const user = gestionnaires.find(g => g.username === username && g.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    // Générer un token simple (à remplacer par JWT en production)
    const token = Buffer.from(`${user.username}:${Date.now()}`).toString('base64');
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nom: user.nom,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

// Routes API

// Route de base
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API TransCargo',
    version: '1.0.0',
    status: 'Fonctionnel en mode simulation'
  });
});

// Routes Cargaisons (protégées par authentification)  
app.get('/api/cargaisons', authenticateToken, async (req, res) => {
  try {
    const cargaisons = await ApiService.getCargaisons();
    res.json(cargaisons);
  } catch (error) {
    console.error('Erreur lors de la récupération des cargaisons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir les cargaisons ouvertes disponibles pour ajouter des colis
app.get('/api/cargaisons/disponibles', authenticateToken, async (req, res) => {
  try {
    const type = req.query.type;
    const cargaisons = await ApiService.getCargaisons();
    
    // Filtrer les cargaisons ouvertes du bon type
    let cargaisonsDisponibles = cargaisons.filter(c => c.etatGlobal === 'OUVERT');
    
    if (type) {
      cargaisonsDisponibles = cargaisonsDisponibles.filter(c => c.type === type);
    }
    
    // Ajouter les informations de capacité pour chaque cargaison
    const colis = await ApiService.getColis();
    const cargaisonsAvecCapacite = cargaisonsDisponibles.map(cargaison => {
      const colisInCargaison = colis.filter(c => c.cargaisonId === cargaison.id);
      const poidsUtilise = colisInCargaison.reduce((total, c) => total + c.poids, 0);
      const poidsRestant = cargaison.poidsMax - poidsUtilise;
      const nbColis = colisInCargaison.length;
      
      return {
        ...cargaison,
        poidsUtilise,
        poidsRestant,
        nbColis
      };
    });
    
    res.json(cargaisonsAvecCapacite);
  } catch (error) {
    console.error('Erreur lors de la récupération des cargaisons disponibles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/cargaisons', authenticateToken, async (req, res) => {
  try {
    const { type, lieuDepart, lieuArrivee, poidsMax = 1000, coordonneesDepart, coordonneesArrivee } = req.body;
    
    if (!type || !lieuDepart || !lieuArrivee) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    let depart, arrivee, distance;

    // Utiliser les coordonnées fournies ou simuler
    if (coordonneesDepart && coordonneesArrivee) {
      depart = {
        lieu: lieuDepart,
        latitude: coordonneesDepart.latitude,
        longitude: coordonneesDepart.longitude
      };
      arrivee = {
        lieu: lieuArrivee,
        latitude: coordonneesArrivee.latitude,
        longitude: coordonneesArrivee.longitude
      };
      distance = simulateDistance(depart, arrivee);
    } else {
      // Fallback vers simulation
      depart = simulateGeocode(lieuDepart);
      arrivee = simulateGeocode(lieuArrivee);
      distance = simulateDistance(depart, arrivee);
    }

    const cargaison = {
      id: generateId('CG'),
      numero: `CG-${Date.now().toString(36)}`.toUpperCase(),
      poidsMax,
      trajet: { depart, arrivee },
      distance,
      type,
      etatAvancement: 'EN_ATTENTE',
      etatGlobal: 'OUVERT',
      dateCreation: new Date().toISOString(),
      produits: [],
      colisIds: [],
      prixTotal: 0
    };

    const nouvelleCargaison = await ApiService.createCargaison(cargaison);

    res.status(201).json({ message: 'Cargaison créée', cargaison });
  } catch (error) {
    console.error('Erreur création cargaison:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les colis d'une cargaison
app.get('/api/cargaisons/:id/colis', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const colis = await ApiService.getColisByCargaison(id);
    res.json(colis);
  } catch (error) {
    console.error('Erreur lors de la récupération des colis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour gérer les actions sur les cargaisons (protégées)
app.post('/api/cargaisons/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cargaison = await ApiService.getCargaisonById(id);
    
    if (!cargaison) {
      return res.status(404).json({ error: 'Cargaison non trouvée' });
    }
    
    // Vérifier qu'il y a au moins un colis dans la cargaison
    const colisInCargaison = await ApiService.getColisByCargaison(id);
    
    if (colisInCargaison.length === 0) {
      return res.status(400).json({ error: 'Impossible de démarrer une cargaison vide. Ajoutez au moins un colis avant le départ.' });
    }
    
    // Mettre à jour la cargaison
    cargaison.etatAvancement = 'EN_COURS';
    cargaison.dateDepart = new Date().toISOString();
    await ApiService.updateCargaison(id, cargaison);
    
    // Mettre tous les colis de cette cargaison en cours
    for (const colis of colisInCargaison) {
      if (colis.etat === 'EN_ATTENTE') {
        colis.etat = 'EN_COURS';
        await ApiService.updateColis(colis.id, colis);
      }
    }
    
    res.json({ message: 'Cargaison démarrée' });
  } catch (error) {
    console.error('Erreur lors du démarrage de la cargaison:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/cargaisons/:id/reopen', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const cargaisons = loadJSON('cargaisons.json');
    const index = cargaisons.findIndex(c => c.id === id);
    
    if (index >= 0) {
      if (cargaisons[index].etatAvancement !== 'EN_ATTENTE') {
        return res.status(400).json({ error: 'Seules les cargaisons en attente peuvent être rouvertes' });
      }
      cargaisons[index].etatGlobal = 'OUVERT';
      saveJSON('cargaisons.json', cargaisons);
      res.json({ message: 'Cargaison rouverte' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/cargaisons/:id/arrive', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const cargaisons = loadJSON('cargaisons.json');
    const index = cargaisons.findIndex(c => c.id === id);
    
    if (index >= 0) {
      cargaisons[index].etatAvancement = 'ARRIVE';
      cargaisons[index].dateArriveeReelle = new Date().toISOString();
      
      // Mettre tous les colis de cette cargaison comme arrivés
      const colisList = loadJSON('colis.json');
      colisList.forEach(c => {
        if (c.cargaisonId === id && c.etat === 'EN_COURS') {
          c.etat = 'ARRIVE';
          c.dateArrivee = new Date().toISOString();
        }
      });
      
      saveJSON('cargaisons.json', cargaisons);
      saveJSON('colis.json', colisList);
      res.json({ message: 'Cargaison marquée comme arrivée' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour fermer une cargaison
app.post('/api/cargaisons/:id/close', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const cargaisons = loadJSON('cargaisons.json');
    const index = cargaisons.findIndex(c => c.id === id);
    
    if (index >= 0) {
      // Vérifier qu'il y a au moins un colis dans la cargaison
      const colis = loadJSON('colis.json');
      const colisInCargaison = colis.filter(c => c.cargaisonId === id);
      
      if (colisInCargaison.length === 0) {
        return res.status(400).json({ error: 'Impossible de fermer une cargaison vide. Ajoutez au moins un colis avant de fermer.' });
      }
      
      cargaisons[index].etatGlobal = 'FERME';
      saveJSON('cargaisons.json', cargaisons);
      res.json({ message: 'Cargaison fermée' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes Colis
app.post('/api/colis', authenticateToken, async (req, res) => {
  try {
    const { expediteur, destinataire, poids, typeProduit, typeCargaison, nombreColis } = req.body;
    
    if (!expediteur || !destinataire || !poids || !typeProduit || !typeCargaison || !nombreColis) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Trouver une cargaison ouverte du bon type
    const cargaisons = await ApiService.getCargaisons();
    const cargaisonOuverte = cargaisons.find(c => c.type === typeCargaison && c.etatGlobal === 'OUVERT');

    if (!cargaisonOuverte) {
      return res.status(400).json({ error: `Aucune cargaison ${typeCargaison} ouverte` });
    }

    // Calcul du prix selon le nouveau tableau de tarifs
    let prixCalcule = 0;
    const distance = cargaisonOuverte.distance || 1;
    
    switch (typeProduit.toLowerCase()) {
      case 'alimentaire':
        switch (typeCargaison) {
          case 'routiere':
            prixCalcule = poids * 100 * distance;
            break;
          case 'maritime':
            prixCalcule = poids * 90 * distance + 5000; // + 5000F changement maritime
            break;
          case 'aerienne':
            prixCalcule = poids * 300 * distance;
            break;
        }
        break;
        
      case 'chimique':
        if (typeCargaison !== 'routiere') {
          return res.status(400).json({ error: 'Les produits chimiques ne peuvent être transportés que par voie routière' });
        }
        const degres = 1; // À paramétrer selon le produit
        prixCalcule = poids * 500 * degres;
        break;
        
      case 'materiel':
        switch (typeCargaison) {
          case 'routiere':
            prixCalcule = poids * 200 * distance;
            break;
          case 'maritime':
            prixCalcule = poids * 400 * distance;
            break;
          case 'aerienne':
            prixCalcule = poids * 1000; // pas de distance
            break;
        }
        break;
        
      default:
        // Tarif par défaut si produit non reconnu
        const tarifDefaut = { maritime: 500, aerienne: 1000, routiere: 300 };
        prixCalcule = poids * tarifDefaut[typeCargaison];
    }
    
    const prixTotal = prixCalcule * nombreColis;
    const prixFinal = Math.max(prixTotal, 10000); // Prix minimum 10000F

    const colis = {
      id: generateId('COL'),
      expediteur,
      destinataire,
      poids,
      typeProduit,
      typeCargaison,
      nombreColis,
      prixCalcule,
      prixFinal,
      etat: 'EN_ATTENTE',
      cargaisonId: cargaisonOuverte.id,
      dateCreation: new Date().toISOString(),
      codeDestinataire: generateCodeDestinataire()
    };

    // Sauvegarder le colis
    const nouveauColis = await ApiService.createColis(colis);

    // Mettre à jour la cargaison
    cargaisonOuverte.colisIds.push(colis.id);
    cargaisonOuverte.prixTotal += prixFinal;
    await ApiService.updateCargaison(cargaisonOuverte.id, cargaisonOuverte);

    // Générer le reçu
    const recu = `
=== REÇU D'EXPÉDITION ===
Code colis: ${colis.id}
Code destinataire: ${colis.codeDestinataire}

EXPÉDITEUR:
${expediteur.prenom} ${expediteur.nom}
${expediteur.adresse}
Tél: ${expediteur.telephone}
${expediteur.email ? 'Email: ' + expediteur.email : ''}

DESTINATAIRE:
${destinataire.nomComplet}
${destinataire.adresse}
Tél: ${destinataire.telephone}

DÉTAILS DU COLIS:
Nombre de colis: ${nombreColis}
Poids total: ${poids} kg
Type de produit: ${typeProduit}
Type de transport: ${typeCargaison}

TARIFICATION:
Prix calculé: ${prixCalcule.toLocaleString()} FCFA
Prix final: ${prixFinal.toLocaleString()} FCFA

Date d'expédition: ${new Date().toLocaleDateString()}
=========================`;

    res.status(201).json({ message: 'Colis créé', colis, recu });
  } catch (error) {
    console.error('Erreur création colis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Recherche de colis (protégée pour gestionnaires)
app.get('/api/colis/search', authenticateToken, (req, res) => {
  try {
    const { code } = req.query;
    const colisList = loadJSON('colis.json');
    const colis = colisList.find(c => c.id === code || c.codeDestinataire === code);
    res.json(colis || null);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour générer un reçu
app.get('/api/colis/:id/recu', (req, res) => {
  try {
    const { id } = req.params;
    const colisList = loadJSON('colis.json');
    const colis = colisList.find(c => c.id === id);
    
    if (!colis) {
      return res.status(404).json({ error: 'Colis non trouvé' });
    }

    const recu = `
=== REÇU D'EXPÉDITION ===
Code colis: ${colis.id}
Code destinataire: ${colis.codeDestinataire}

EXPÉDITEUR:
${colis.expediteur.prenom} ${colis.expediteur.nom}
${colis.expediteur.adresse}
Tél: ${colis.expediteur.telephone}
${colis.expediteur.email ? 'Email: ' + colis.expediteur.email : ''}

DESTINATAIRE:
${colis.destinataire.nomComplet}
${colis.destinataire.adresse}
Tél: ${colis.destinataire.telephone}

DÉTAILS DU COLIS:
Nombre de colis: ${colis.nombreColis}
Poids total: ${colis.poids} kg
Type de produit: ${colis.typeProduit}
Type de transport: ${colis.typeCargaison}

TARIFICATION:
Prix calculé: ${colis.prixCalcule.toLocaleString()} FCFA
Prix final: ${colis.prixFinal.toLocaleString()} FCFA

Date d'expédition: ${new Date(colis.dateCreation).toLocaleDateString()}
=========================`;

    res.json({ recu });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour actions sur les colis (protégées)
app.post('/api/colis/:id/recupere', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const colisList = loadJSON('colis.json');
    const index = colisList.findIndex(c => c.id === id);
    
    if (index >= 0) {
      if (colisList[index].etat !== 'ARRIVE') {
        return res.status(400).json({ error: 'Le colis doit être arrivé avant d\'être récupéré' });
      }
      colisList[index].etat = 'RECUPERE';
      saveJSON('colis.json', colisList);
      res.json({ message: 'Colis marqué comme récupéré' });
    } else {
      res.status(404).json({ error: 'Colis non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/colis/:id/perdu', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const colisList = loadJSON('colis.json');
    const index = colisList.findIndex(c => c.id === id);
    
    if (index >= 0) {
      colisList[index].etat = 'PERDU';
      saveJSON('colis.json', colisList);
      res.json({ message: 'Colis marqué comme perdu' });
    } else {
      res.status(404).json({ error: 'Colis non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suivi de colis
app.get('/api/colis/track', (req, res) => {
  try {
    const { code } = req.query;
    const colisList = loadJSON('colis.json');
    const colis = colisList.find(c => c.id === code || c.codeDestinataire === code);
    
    if (!colis) {
      return res.json({
        statut: 'NOT_FOUND',
        message: 'Code de colis non trouvé',
        colis: null,
        cargaison: null
      });
    }

    const cargaisons = loadJSON('cargaisons.json');
    const cargaison = cargaisons.find(c => c.id === colis.cargaisonId);

    let message = '';
    switch (colis.etat) {
      case 'EN_ATTENTE': message = 'Votre colis est en attente de départ'; break;
      case 'EN_COURS': message = 'Votre colis est en cours de transport'; break;
      case 'ARRIVE': message = 'Votre colis est arrivé et peut être récupéré'; break;
      case 'RECUPERE': message = 'Votre colis a été récupéré'; break;
      case 'PERDU': message = 'Votre colis est malheureusement perdu'; break;
      default: message = 'État inconnu';
    }

    res.json({ statut: colis.etat, message, colis, cargaison });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques
app.get('/api/statistiques', authenticateToken, async (req, res) => {
  try {
    // En production, utiliser l'API service, en dev utiliser les fichiers locaux
    let cargaisons, colisList;
    
    if (process.env.NODE_ENV === 'production') {
      // Lecture directe des fichiers en production
      cargaisons = loadJSON('cargaisons.json');
      colisList = loadJSON('colis.json');
    } else {
      // Utiliser l'API service en développement
      try {
        cargaisons = await ApiService.getCargaisons();
        colisList = await ApiService.getColis();
      } catch (apiError) {
        console.log('API Service non disponible, utilisation des fichiers locaux');
        cargaisons = loadJSON('cargaisons.json');
        colisList = loadJSON('colis.json');
      }
    }

    const stats = {
      totalCargaisons: cargaisons.length,
      cargaisonsOuvertes: cargaisons.filter(c => c.etatGlobal === 'OUVERT').length,
      cargaisonsFermees: cargaisons.filter(c => c.etatGlobal === 'FERME').length,
      cargaisonsEnCours: cargaisons.filter(c => c.etatAvancement === 'EN_COURS').length,
      totalColis: colisList.length,
      colisEnAttente: colisList.filter(c => c.etat === 'EN_ATTENTE').length,
      colisEnCours: colisList.filter(c => c.etat === 'EN_COURS').length,
      colisArrivees: colisList.filter(c => c.etat === 'ARRIVE').length,
      colisRecuperes: colisList.filter(c => c.etat === 'RECUPERE').length,
      colisPerdus: colisList.filter(c => c.etat === 'PERDU').length,
      revenuTotal: colisList.reduce((total, c) => total + (c.prixFinal || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour servir les pages
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/admin.html'));
});

// Routes 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur TransCargo démarré sur le port ${PORT}`);
  console.log(`📱 Interface web: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log('✅ Application prête en mode simulation !');
});
