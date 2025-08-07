#!/usr/bin/env node

// Import des classes TypeScript compilées
const { Routiere } = require('../dist/Model/Routiere');
const { Maritime } = require('../dist/Model/Maritime');
const { Aerienne } = require('../dist/Model/Aerienne');

// Récupération des arguments
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log(JSON.stringify({
        error: 'Arguments manquants: id, type, distance'
    }));
    process.exit(1);
}
 
const [id, type, distance] = args;

try {
    let cargaison;
    const distanceNum = parseInt(distance);
    
    // Créer la cargaison selon le type
    switch (type.toLowerCase()) {
        case 'routiere':
            cargaison = new Routiere(id, distanceNum);
            break;
        case 'maritime':
            cargaison = new Maritime(id, distanceNum);
            break; 
        case 'aerienne':
            cargaison = new Aerienne(id, distanceNum);
            break;
        default:
            throw new Error('Type de cargaison invalide');
    }
     
    // Retourner les données de la cargaison
    const result = {
        success: true, 
        cargaison: {
            id: cargaison.id,
            type: cargaison.getType(),
            distance: cargaison.distance,
            nbProduits: cargaison.nbProduit(),
            poidsTotal: cargaison.getPoidsTotal(),
            sommeTotale: cargaison.sommeTotale(),
            produits: cargaison.produits.map(p => ({
                libelle: p.libelle,
                poids: p.poids,
                type: p.getType(),
                toString: p.toString()
            }))
        }
    };
    
    console.log(JSON.stringify(result));
    
} catch (error) {
    console.log(JSON.stringify({
        error: error.message
    }));
    process.exit(1);
}
