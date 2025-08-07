// Script de vérification avant déploiement
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification avant déploiement TransCargo...\n');

const checks = [
  {
    name: 'package.json existe',
    check: () => fs.existsSync('package.json'),
    fix: 'Créez un fichier package.json'
  },
  {
    name: 'server.js existe', 
    check: () => fs.existsSync('server.js'),
    fix: 'Assurez-vous que server.js existe'
  },
  {
    name: 'render.yaml configuré',
    check: () => fs.existsSync('render.yaml'),
    fix: 'Fichier render.yaml manquant'
  },
  {
    name: '.gitignore présent',
    check: () => fs.existsSync('.gitignore'),
    fix: 'Créez un fichier .gitignore'
  },
  {
    name: 'Dossier public existe',
    check: () => fs.existsSync('public') && fs.statSync('public').isDirectory(),
    fix: 'Le dossier public doit exister'
  },
  {
    name: 'admin.html présent',
    check: () => fs.existsSync('public/admin.html'),
    fix: 'Le fichier admin.html est manquant'
  },
  {
    name: 'admin.js présent',
    check: () => fs.existsSync('public/admin.js'),
    fix: 'Le fichier admin.js est manquant'
  },
  {
    name: 'styles.css présent',
    check: () => fs.existsSync('public/styles.css'),
    fix: 'Le fichier styles.css est manquant'
  },
  {
    name: 'PORT configuré pour Render',
    check: () => {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      return serverContent.includes('process.env.PORT');
    },
    fix: 'Configurez le PORT avec process.env.PORT dans server.js'
  },
  {
    name: 'Scripts npm configurés',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts.start;
    },
    fix: 'Configurez le script start dans package.json'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 Votre projet est prêt pour le déploiement sur Render !');
  console.log('\n📋 Prochaines étapes :');
  console.log('1. Créez un repository GitHub');
  console.log('2. Poussez votre code : git push origin main');
  console.log('3. Connectez-vous à Render.com');
  console.log('4. Créez un nouveau Web Service');
  console.log('5. Connectez votre repository');
  console.log('6. Déployez !');
} else {
  console.log('⚠️  Certaines vérifications ont échoué.');
  console.log('   Corrigez les problèmes avant de déployer.');
}

console.log('\n📖 Consultez DEPLOY_RENDER.md pour le guide complet.');
