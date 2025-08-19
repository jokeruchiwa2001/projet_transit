const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const MessageService = require('./services/MessageService');

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

// Fonction pour charger les admins depuis la base de données
const loadAdmins = () => {
  try {
    const dbData = loadJSON('db.json');
    return dbData.admins || [];
  } catch (error) {
    console.error('Erreur lors du chargement des admins:', error);
    return [];
  }
};

// Fonction pour charger les données UNIQUEMENT depuis db.json
const loadDataFromDbJson = (type) => {
  try {
    const dbData = loadJSON('db.json');
    if (dbData && dbData[type]) {
      return dbData[type];
    }
    return [];
  } catch (error) {
    console.error(`Erreur lors du chargement des ${type} depuis db.json:`, error);
    return [];
  }
};

// Fonction pour sauvegarder UNIQUEMENT dans db.json
const saveDataToDbJson = (type, data) => {
  try {
    const dbData = loadJSON('db.json') || {};
    dbData[type] = data;
    saveJSON('db.json', dbData);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des ${type} dans db.json:`, error);
  }
};

// Gestionnaires par défaut (à remplacer par la fonction loadAdmins)
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
    
    const admins = loadAdmins();
    const user = admins.find(g => g.username === username);
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
    
    const admins = loadAdmins();
    const user = admins.find(g => g.username === username && g.password === password);
    
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

app.post('/api/cargaisons', async (req, res) => {
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
app.post('/api/cargaisons/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const cargaisons = loadDataFromDbJson('cargaisons');
    const index = cargaisons.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Cargaison non trouvée' });
    }
    
    const cargaison = cargaisons[index];
    
    // Vérifier qu'il y a au moins un colis dans la cargaison
    const colisList = loadDataFromDbJson('colis');
    const colisInCargaison = colisList.filter(c => c.cargaisonId === id);
    
    if (colisInCargaison.length === 0) {
      return res.status(400).json({ error: 'Impossible de démarrer une cargaison vide. Ajoutez au moins un colis avant le départ.' });
    }
    
    // Vérifier que la cargaison est fermée
    if (cargaison.etatGlobal === 'OUVERT') {
      return res.status(400).json({ error: 'Impossible de démarrer une cargaison ouverte. Fermez-la d\'abord.' });
    }
    
    // Vérifier que la cargaison n'est pas déjà démarrée
    if (cargaison.etatAvancement === 'EN_COURS') {
      return res.status(400).json({ error: 'Cette cargaison est déjà en cours.' });
    }
    
    // Vérifier que la cargaison n'est pas arrivée
    if (cargaison.etatAvancement === 'ARRIVE') {
      return res.status(400).json({ error: 'Cette cargaison est déjà arrivée.' });
    }
    
    // Mettre à jour la cargaison
    cargaisons[index].etatAvancement = 'EN_COURS';
    cargaisons[index].dateDepart = new Date().toISOString();
    
    // Mettre tous les colis de cette cargaison en cours et envoyer notifications
    for (const colis of colisList) {
      if (colis.cargaisonId === id && colis.etat === 'EN_ATTENTE') {
        colis.etat = 'EN_COURS';
        
        // Envoyer notification de départ
        try {
          const clients = loadJSON('clients.json');
          const expediteur = clients.find(c => c.telephone === colis.expediteur);
          const destinataire = clients.find(c => c.telephone === colis.destinataire);
          
          if (expediteur && destinataire) {
            const colisAvecDetails = {
              ...colis,
              expediteur,
              destinataire,
              dateDepart: cargaisons[index].dateDepart,
              cargaisonId: id
            };
            await MessageService.notifierColis('colis_parti', colisAvecDetails);
          }
        } catch (error) {
          console.error('Erreur notification départ colis:', error);
        }
      }
    }
    
    // Sauvegarder dans les deux formats pour compatibilité
    saveDataToDbJson('cargaisons', cargaisons);
    saveDataToDbJson('colis', colisList);
    
    console.log(`📧 ${colisInCargaison.length} notifications de départ envoyées`);
    res.json({ message: 'Cargaison démarrée' });
  } catch (error) {
    console.error('Erreur lors du démarrage de la cargaison:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/cargaisons/:id/reopen', (req, res) => {
  try {
    const { id } = req.params;
    const cargaisons = loadDataFromDbJson('cargaisons');
    const index = cargaisons.findIndex(c => c.id === id);
    
    if (index >= 0) {
      if (cargaisons[index].etatAvancement !== 'EN_ATTENTE') {
        return res.status(400).json({ error: 'Seules les cargaisons en attente peuvent être rouvertes' });
      }
      cargaisons[index].etatGlobal = 'OUVERT';
      saveDataToDbJson('cargaisons', cargaisons);
      res.json({ message: 'Cargaison rouverte' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/cargaisons/:id/arrive', async (req, res) => {
  try {
    const { id } = req.params;
    // Charger depuis db.json unifié ET fichiers séparés pour compatibilité
    const cargaisons = loadDataFromDbJson('cargaisons');
    const index = cargaisons.findIndex(c => c.id === id);
    
    if (index >= 0) {
      cargaisons[index].etatAvancement = 'ARRIVE';
      cargaisons[index].dateArriveeReelle = new Date().toISOString();
      
      // Mettre tous les colis de cette cargaison comme arrivés et envoyer notifications
      const colisList = loadDataFromDbJson('colis');
      const clients = loadJSON('clients.json');
      const dateArrivee = new Date().toISOString();
      
      for (const colis of colisList) {
        if (colis.cargaisonId === id && colis.etat === 'EN_COURS') {
          colis.etat = 'ARRIVE';
          colis.dateArrivee = dateArrivee;
          
          // Envoyer notification d'arrivée
          try {
            const expediteur = clients.find(c => c.telephone === colis.expediteur);
            const destinataire = clients.find(c => c.telephone === colis.destinataire);
            
            if (expediteur && destinataire) {
              const colisAvecDetails = {
                ...colis,
                expediteur,
                destinataire,
                dateArrivee,
                cargaisonId: id
              };
              await MessageService.notifierColis('colis_arrive', colisAvecDetails);
            }
          } catch (error) {
            console.error('Erreur notification arrivée colis:', error);
          }
        }
      }
      
      // Sauvegarder dans les deux formats pour compatibilité totale
      saveDataToDbJson('cargaisons', cargaisons);
      saveDataToDbJson('colis', colisList);
      
      const colisArrivés = colisList.filter(c => c.cargaisonId === id && c.etat === 'ARRIVE');
      console.log(`📧 ${colisArrivés.length} notifications d'arrivée envoyées`);
      
      res.json({ message: 'Cargaison marquée comme arrivée' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour fermer une cargaison
app.post('/api/cargaisons/:id/close', (req, res) => {
  try {
    const { id } = req.params;
    const cargaisons = loadDataFromDbJson('cargaisons');
    const index = cargaisons.findIndex(c => c.id === id);
    
    if (index >= 0) {
      const cargaison = cargaisons[index];
      
      // Vérifier que la cargaison n'est pas déjà fermée
      if (cargaison.etatGlobal === 'FERME') {
        return res.status(400).json({ error: 'Cette cargaison est déjà fermée.' });
      }
      
      // Vérifier que la cargaison n'est pas en cours
      if (cargaison.etatAvancement === 'EN_COURS') {
        return res.status(400).json({ error: 'Impossible de fermer une cargaison en cours. Marquez-la comme arrivée d\'abord.' });
      }
      
      cargaisons[index].etatGlobal = 'FERME';
      saveDataToDbJson('cargaisons', cargaisons);
      res.json({ message: 'Cargaison fermée avec succès' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes Colis
app.post('/api/colis', async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    const { expediteur, destinataire, poids, typeProduit, typeCargaison, nombreColis, cargaisonId } = req.body;
    
    if (!expediteur || !destinataire || !poids || !typeProduit || !nombreColis) {
      console.log('Données manquantes:', { expediteur, destinataire, poids, typeProduit, typeCargaison, nombreColis, cargaisonId });
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Utiliser la cargaison spécifiée ou trouver une cargaison ouverte du bon type
    const cargaisons = await ApiService.getCargaisons();
    let cargaisonOuverte;
    
    if (cargaisonId) {
      cargaisonOuverte = cargaisons.find(c => c.id === cargaisonId && c.etatGlobal === 'OUVERT');
    } else if (typeCargaison) {
      cargaisonOuverte = cargaisons.find(c => c.type === typeCargaison && c.etatGlobal === 'OUVERT');
    }

    if (!cargaisonOuverte) {
      const message = cargaisonId ? 'Cargaison non trouvée ou fermée' : `Aucune cargaison ${typeCargaison} ouverte`;
      return res.status(400).json({ error: message });
    }

    // Vérifier si la cargaison peut supporter le poids supplémentaire
    const colisList = await ApiService.getColis();
    const colisExistants = colisList.filter(c => c.cargaisonId === cargaisonOuverte.id);
    const poidsActuel = colisExistants.reduce((total, c) => total + (c.poids || 0), 0);
    const poidsTotal = poids; // poids est déjà le poids total
    const nouveauPoidsTotal = poidsActuel + poidsTotal;

    if (nouveauPoidsTotal > cargaisonOuverte.poidsMax) {
      return res.status(400).json({ 
        error: `Capacité insuffisante! Poids disponible: ${cargaisonOuverte.poidsMax - poidsActuel}kg, demandé: ${poidsTotal}kg`,
        poidsActuel: poidsActuel,
        poidsMax: cargaisonOuverte.poidsMax,
        poidsDisponible: cargaisonOuverte.poidsMax - poidsActuel
      });
    }

    // Validation des contraintes de transport
    if (typeProduit === 'chimique' && typeCargaison !== 'maritime') {
      return res.status(400).json({ error: 'Les produits chimiques ne peuvent transiter QUE par voie maritime' });
    }
    
    if (typeProduit === 'materiel-fragile' && typeCargaison === 'maritime') {
      return res.status(400).json({ error: 'Les produits matériels fragiles ne peuvent JAMAIS passer par voie maritime' });
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
            prixCalcule = poids * 50 * distance + 5000; // + 5000F frais de chargement maritime pour alimentaires
            break;
          case 'aerienne':
            prixCalcule = poids * 300 * distance;
            break;
        }
        break;
        
      case 'chimique':
        // Les produits chimiques ne transitent QUE par maritime
        if (typeCargaison === 'maritime') {
          const toxicite = 1; // À paramétrer selon le produit
          prixCalcule = poids * 500 * toxicite + 10000; // + 10000F frais d'entretien pour chimiques
        }
        break;
        
      case 'materiel-fragile':
        switch (typeCargaison) {
          case 'routiere':
            prixCalcule = poids * 200 * distance;
            break;
          case 'aerienne':
            prixCalcule = poids * 1000; // pas de distance pour aérien
            break;
          // Maritime exclu pour fragiles
        }
        break;
        
      case 'materiel-incassable':
        switch (typeCargaison) {
          case 'routiere':
            prixCalcule = poids * 200 * distance;
            break;
          case 'maritime':
            prixCalcule = poids * 400 * distance;
            break;
          case 'aerienne':
            prixCalcule = poids * 1000; // pas de distance pour aérien
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

    // Envoyer les notifications de création
    try {
      const colisAvecDetails = {
        ...colis,
        expediteur,
        destinataire
      };
      await MessageService.notifierColis('colis_cree', colisAvecDetails);
      console.log('📧 Notifications de création envoyées');
    } catch (error) {
      console.error('Erreur envoi notifications:', error);
    }

    res.status(201).json({ message: 'Colis créé', colis, recu });
  } catch (error) {
    console.error('Erreur création colis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Recherche avancée de cargaisons (protégée pour admins)
app.get('/api/cargaisons/search', authenticateToken, (req, res) => {
  try {
    const dbData = loadJSON('db.json');
    const cargaisons = dbData.cargaisons || [];
    const { code, lieuDepart, lieuArrivee, type, dateDepart, dateArrivee } = req.query;
    
    let results = cargaisons;
    
    // Filtrer par code
    if (code) {
      results = results.filter(c => 
        c.id.toLowerCase().includes(code.toString().toLowerCase()) ||
        c.numero.toLowerCase().includes(code.toString().toLowerCase())
      );
    }
    
    // Filtrer par lieu de départ
    if (lieuDepart) {
      results = results.filter(c => 
        c.trajet && c.trajet.depart && 
        c.trajet.depart.lieu.toLowerCase().includes(lieuDepart.toString().toLowerCase())
      );
    }
    
    // Filtrer par lieu d'arrivée
    if (lieuArrivee) {
      results = results.filter(c => 
        c.trajet && c.trajet.arrivee && 
        c.trajet.arrivee.lieu.toLowerCase().includes(lieuArrivee.toString().toLowerCase())
      );
    }
    
    // Filtrer par type
    if (type) {
      results = results.filter(c => c.type === type);
    }
    
    // Filtrer par date de départ
    if (dateDepart) {
      const searchDate = new Date(dateDepart.toString());
      results = results.filter(c => {
        if (!c.dateDepart) return false;
        const cargaisonDate = new Date(c.dateDepart);
        return cargaisonDate.toDateString() === searchDate.toDateString();
      });
    }
    
    // Filtrer par date d'arrivée
    if (dateArrivee) {
      const searchDate = new Date(dateArrivee.toString());
      results = results.filter(c => {
        if (!c.dateArriveeReelle) return false;
        const cargaisonDate = new Date(c.dateArriveeReelle);
        return cargaisonDate.toDateString() === searchDate.toDateString();
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche de cargaisons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Recherche de colis (protégée pour gestionnaires)
app.get('/api/colis/search', authenticateToken, (req, res) => {
  try {
    const { code } = req.query;
    const dbData = loadJSON('db.json');
    const colisList = dbData.colis || [];
    const colis = colisList.find(c => c.id === code || c.codeDestinataire === code);
    res.json(colis || null);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer un colis comme perdu
app.post('/api/colis/:id/lost', async (req, res) => {
  try {
    const { id } = req.params;
    const colisList = loadJSON('colis.json');
    const colisIndex = colisList.findIndex(c => c.id === id || c.codeDestinataire === id);
    
    if (colisIndex === -1) {
      return res.status(404).json({ error: 'Colis non trouvé' });
    }
    
    const colis = colisList[colisIndex];
    
    // Vérifier que le colis n'est pas déjà arrivé
    if (colis.etat === 'ARRIVE') {
      return res.status(400).json({ error: 'Impossible de marquer comme perdu un colis déjà arrivé' });
    }
    
    // Marquer comme perdu
    colis.etat = 'PERDU';
    colis.datePerdu = new Date().toISOString();
    
    // Envoyer notifications de perte
    try {
      const clients = loadJSON('clients.json');
      const expediteur = clients.find(c => c.telephone === colis.expediteur);
      const destinataire = clients.find(c => c.telephone === colis.destinataire);
      
      if (expediteur && destinataire) {
        const colisAvecDetails = {
          ...colis,
          expediteur,
          destinataire,
          cargaisonId: colis.cargaisonId
        };
        await MessageService.notifierColis('colis_perdu', colisAvecDetails);
        console.log('📧 Notifications de perte envoyées');
      }
    } catch (error) {
      console.error('Erreur notification perte colis:', error);
    }
    
    saveJSON('colis.json', colisList);
    res.json({ message: 'Colis marqué comme perdu et notifications envoyées' });
  } catch (error) {
    console.error('Erreur marquage colis perdu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir les messages
app.get('/api/messages', (req, res) => {
  try {
    const messages = MessageService.obtenirMessages();
    res.json(messages);
  } catch (error) {
    console.error('Erreur récupération messages:', error);
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
      revenuTotal: colisList.reduce((total, c) => total + (c.prixFinal || 0), 0),
      
      // Données pour les graphiques
      transportMaritime: cargaisons.filter(c => c.type === 'maritime').length,
      transportAerien: cargaisons.filter(c => c.type === 'aerienne').length,
      transportRoutier: cargaisons.filter(c => c.type === 'routiere').length
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
