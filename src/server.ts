import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { CargaisonService } from './Services/CargaisonService';
import { GoogleMapsService } from './Services/GoogleMapsService';
import { DataManager } from './Storage/DataManager';

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Configuration Google Maps (optionnel)
if (process.env.GOOGLE_MAPS_API_KEY) {
  GoogleMapsService.setApiKey(process.env.GOOGLE_MAPS_API_KEY);
}

// Routes API

// Route de base
app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'API TransCargo',
    version: '1.0.0',
    endpoints: [
      'GET /api/cargaisons',
      'GET /api/cargaisons/disponibles',
      'POST /api/cargaisons',
      'GET /api/cargaisons/search',
      'POST /api/cargaisons/:id/close',
      'POST /api/cargaisons/:id/reopen',
      'POST /api/cargaisons/:id/start',
      'POST /api/cargaisons/:id/arrive',
      'GET /api/colis',
      'POST /api/colis',
      'GET /api/colis/search',
      'GET /api/colis/track',
      'GET /api/colis/:id/recu',
      'POST /api/colis/:id/recupere',
      'POST /api/colis/:id/perdu',
      'GET /api/statistiques'
    ]
  });
});

// Routes Cargaisons
app.get('/api/cargaisons', (req, res) => {
  try {
    const cargaisons = CargaisonService.obtenirToutesLesCargaisons();
    res.json(cargaisons);
  } catch (error) {
    console.error('Erreur lors de la récupération des cargaisons:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour obtenir les cargaisons ouvertes disponibles pour ajouter des colis
app.get('/api/cargaisons/disponibles', (req, res) => {
  try {
    const type = req.query.type as 'maritime' | 'aerienne' | 'routiere';
    const criteres = type ? { type } : {};
    const cargaisons = CargaisonService.rechercherCargaisons(criteres);
    const cargaisonsOuvertes = cargaisons.filter(c => c.etatGlobal === 'OUVERT');
    
    const cargaisonsFormatees = cargaisonsOuvertes.map(c => ({
      id: c.id,
      numero: c.numero,
      type: c.type,
      trajet: c.trajet,
      distance: c.distance,
      poidsMax: c.poidsMax,
      poidsUtilise: CargaisonService.obtenirPoidsUtilise(c.id),
      poidsRestant: c.poidsMax - CargaisonService.obtenirPoidsUtilise(c.id),
      nbColis: CargaisonService.obtenirNombreColisCargaison(c.id)
    }));
    
    res.json(cargaisonsFormatees);
  } catch (error) {
    console.error('Erreur lors de la récupération des cargaisons disponibles:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/cargaisons', async (req, res) => {
  try {
    const { type, lieuDepart, lieuArrivee, poidsMax } = req.body;
    
    if (!type || !lieuDepart || !lieuArrivee) {
      return res.status(400).json({ 
        error: 'Type, lieu de départ et lieu d\'arrivée sont requis' 
      });
    }

    const cargaison = await CargaisonService.creerCargaison(
      type,
      lieuDepart,
      lieuArrivee,
      poidsMax
    );

    res.status(201).json({
      message: 'Cargaison créée avec succès',
      cargaison: {
        id: cargaison.id,
        numero: cargaison.numero,
        type: cargaison.getType(),
        trajet: cargaison.trajet,
        distance: cargaison.distance,
        poidsMax: cargaison.poidsMax,
        etatGlobal: cargaison.etatGlobal,
        etatAvancement: cargaison.etatAvancement
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la cargaison:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

app.get('/api/cargaisons/search', (req, res) => {
  try {
    const criteria = {
      code: req.query.code as string,
      lieuDepart: req.query.lieuDepart as string,
      lieuArrivee: req.query.lieuArrivee as string,
      type: req.query.type as 'maritime' | 'aerienne' | 'routiere',
      dateDepart: req.query.dateDepart ? new Date(req.query.dateDepart as string) : undefined
    };

    const results = CargaisonService.rechercherCargaisons(criteria);
    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche de cargaisons:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/cargaisons/:id/close', (req, res) => {
  try {
    const { id } = req.params;
    const success = CargaisonService.fermerCargaison(id);
    
    if (success) {
      res.json({ message: 'Cargaison fermée avec succès' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    console.error('Erreur lors de la fermeture de la cargaison:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

app.post('/api/cargaisons/:id/reopen', (req, res) => {
  try {
    const { id } = req.params;
    const success = CargaisonService.rouvrirCargaison(id);
    
    if (success) {
      res.json({ message: 'Cargaison rouverte avec succès' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    console.error('Erreur lors de la réouverture de la cargaison:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

app.post('/api/cargaisons/:id/start', (req, res) => {
  try {
    const { id } = req.params;
    const dateDepart = req.body.dateDepart ? new Date(req.body.dateDepart) : undefined;
    const success = CargaisonService.demarrerCargaison(id, dateDepart);
    
    if (success) {
      res.json({ message: 'Cargaison démarrée avec succès' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    console.error('Erreur lors du démarrage de la cargaison:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

app.post('/api/cargaisons/:id/arrive', (req, res) => {
  try {
    const { id } = req.params;
    const dateArrivee = req.body.dateArrivee ? new Date(req.body.dateArrivee) : undefined;
    const success = CargaisonService.marquerCargaisonArrivee(id, dateArrivee);
    
    if (success) {
      res.json({ message: 'Cargaison marquée comme arrivée' });
    } else {
      res.status(404).json({ error: 'Cargaison non trouvée' });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la cargaison:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

// Routes Colis
app.get('/api/colis', (req, res) => {
  try {
    const colis = CargaisonService.obtenirTousLesColis();
    res.json(colis);
  } catch (error) {
    console.error('Erreur lors de la récupération des colis:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/colis', (req, res) => {
  try {
    const { expediteur, destinataire, poids, typeProduit, typeCargaison, nombreColis, cargaisonId } = req.body;
    
    if (!expediteur || !destinataire || !poids || !typeProduit || !typeCargaison || !nombreColis || !cargaisonId) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis, y compris la sélection de cargaison' 
      });
    }

    const colis = CargaisonService.creerColis(
      expediteur,
      destinataire,
      poids,
      typeProduit,
      typeCargaison,
      nombreColis,
      cargaisonId
    );

    const recu = CargaisonService.genererRecu(colis.id);

    res.status(201).json({
      message: 'Colis enregistré avec succès',
      colis: colis.toJSON(),
      recu: recu
    });
  } catch (error) {
    console.error('Erreur lors de la création du colis:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

app.get('/api/colis/search', (req, res) => {
  try {
    const code = req.query.code as string;
    
    if (!code) {
      return res.status(400).json({ error: 'Code requis' });
    }

    const colis = CargaisonService.rechercherColisByCode(code);
    res.json(colis);
  } catch (error) {
    console.error('Erreur lors de la recherche de colis:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.get('/api/colis/track', (req, res) => {
  try {
    const code = req.query.code as string;
    
    if (!code) {
      return res.status(400).json({ error: 'Code requis' });
    }

    const result = CargaisonService.suivreColis(code);
    res.json(result);
  } catch (error) {
    console.error('Erreur lors du suivi de colis:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.get('/api/colis/:id/recu', (req, res) => {
  try {
    const { id } = req.params;
    const recu = CargaisonService.genererRecu(id);
    
    if (recu) {
      res.json({ recu });
    } else {
      res.status(404).json({ error: 'Colis non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la génération du reçu:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/colis/:id/recupere', (req, res) => {
  try {
    const { id } = req.params;
    const success = CargaisonService.recupererColis(id);
    
    if (success) {
      res.json({ message: 'Colis marqué comme récupéré' });
    } else {
      res.status(404).json({ error: 'Colis non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du colis:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

app.post('/api/colis/:id/perdu', (req, res) => {
  try {
    const { id } = req.params;
    const success = CargaisonService.marquerColisCommePerdu(id);
    
    if (success) {
      res.json({ message: 'Colis marqué comme perdu' });
    } else {
      res.status(404).json({ error: 'Colis non trouvé' });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du colis:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
});

// Route Statistiques
app.get('/api/statistiques', (req, res) => {
  try {
    const stats = CargaisonService.obtenirStatistiques();
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour servir l'application web
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

// Middleware de gestion d'erreurs
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur TransCargo démarré sur le port ${PORT}`);
  console.log(`📱 Interface web: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  
  // Créer le dossier data s'il n'existe pas
  DataManager.loadCargaisons(); // Ceci va créer le dossier si nécessaire
  
  console.log('✅ Application prête !');
});

export default app;
