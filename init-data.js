// Script d'initialisation des données TransCargo
// Responsabilité : Créer les fichiers de données de base si ils n'existent pas

const fs = require('fs');
const path = require('path');

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Dossier data créé');
}

// Données initiales pour les cargaisons
const initialCargaisons = [];

// Données initiales pour les colis
const initialColis = [];

// Données initiales pour les clients
const initialClients = [];

// Données initiales pour les messages
const initialMessages = [];

// Fonction pour créer un fichier s'il n'existe pas
function createFileIfNotExists(filename, data) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Fichier ${filename} créé`);
    } else {
        console.log(`📄 Fichier ${filename} existe déjà`);
    }
}

// Initialiser les fichiers de données
console.log('🚀 Initialisation des données TransCargo...');

createFileIfNotExists('cargaisons.json', initialCargaisons);
createFileIfNotExists('colis.json', initialColis);
createFileIfNotExists('clients.json', initialClients);
createFileIfNotExists('messages.json', initialMessages);

console.log('✅ Initialisation des données terminée');