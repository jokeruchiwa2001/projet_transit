// Script d'initialisation des données par défaut
const fs = require('fs');
const path = require('path');

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Dossier data créé');
}

// Données par défaut
const defaultData = {
  'cargaisons.json': [],
  'colis.json': [],
  'clients.json': []
};

// Initialiser les fichiers JSON s'ils n'existent pas
Object.entries(defaultData).forEach(([filename, data]) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ ${filename} initialisé`);
  } else {
    console.log(`📄 ${filename} existe déjà`);
  }
});

console.log('🎉 Initialisation des données terminée !');
