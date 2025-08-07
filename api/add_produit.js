#!/usr/bin/env node

// Import des classes TypeScript compilées
const { Routiere } = require('../dist/Model/Routiere');
const { Maritime } = require('../dist/Model/Maritime');
const { Aerienne } = require('../dist/Model/Aerienne');
const { Alimentaire } = require('../dist/Model/Alimentaire');
const { Chimique } = require('../dist/Model/Chimique');
const { Fragile } = require('../dist/Model/Fragile');
const { Incassable } = require('../dist/Model/Incassable');

// Récupération des arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log(JSON.stringify({
        error: 'Arguments manquants: cargaisonId, produitData'
    }));
    process.exit(1);
}

const [cargaisonId, produitDataJson] = args;

try {
    const produitData = JSON.parse(produitDataJson);
    
    // Créer le produit selon le type
    let produit;
    switch (produitData.type.toLowerCase()) {
        case 'alimentaire':
            produit = new Alimentaire(produitData.libelle, produitData.poids);
            break;
        case 'chimique':
            produit = new Chimique(produitData.libelle, produitData.poids, produitData.degreToxicite);
            break;
        case 'fragile':
            produit = new Fragile(produitData.libelle, produitData.poids);
            break;
        case 'incassable':
            produit = new Incassable(produitData.libelle, produitData.poids);
            break;
        default:
            throw new Error('Type de produit invalide');
    }
    
    // Charger la cargaison existante (simulation)
    // Dans un vrai projet, on chargerait depuis la base de données
    let cargaison;
    const type = cargaisonId.split('-')[0].toLowerCase();
    const distance = produitData.distance || 1000; // Distance par défaut
    
    switch (type) {
        case 'rou':
        case 'routiere':
            cargaison = new Routiere(cargaisonId, distance);
            break;
        case 'mar':
        case 'maritime':
            cargaison = new Maritime(cargaisonId, distance);
            break;
        case 'aer':
        case 'aerienne':
            cargaison = new Aerienne(cargaisonId, distance);
            break;
        default:
            throw new Error('Type de cargaison invalide');
    }
    
    // Ajouter le produit à la cargaison
    cargaison.ajouterProduit(produit);
    
    // Retourner le résultat
    const result = {
        success: true,
        message: 'Produit ajouté avec succès',
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
        },
        produitAjoute: {
            libelle: produit.libelle,
            poids: produit.poids,
            type: produit.getType(),
            toString: produit.toString()
        }
    };
    
    console.log(JSON.stringify(result));
    
} catch (error) {
    console.log(JSON.stringify({
        success: false,
        error: error.message
    }));
    process.exit(1);
}
