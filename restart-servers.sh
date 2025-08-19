#!/bin/bash

echo "🔄 Redémarrage des serveurs TransCargo..."

# Tuer tous les processus node existants pour ce projet
echo "⏹️  Arrêt des serveurs existants..."
pkill -f "node.*server.js" || true
pkill -f "json-server" || true
pkill -f "php.*router.php" || true

echo "⏳ Attente de l'arrêt complet..."
sleep 2

echo "🚀 Démarrage des serveurs..."

# Terminal 1: JSON Server (port 3006)
echo "📊 Démarrage de json-server sur le port 3006..."
nohup npx json-server --watch data/db.json --port 3006 > json-server.log 2>&1 &
JSON_SERVER_PID=$!

# Terminal 2: Node.js Server (port 3005)
echo "⚡ Démarrage du serveur Node.js sur le port 3005..."
nohup node server.js > node-server.log 2>&1 &
NODE_SERVER_PID=$!

# Terminal 3: PHP Server (port 8000) - optionnel
echo "🐘 Démarrage du serveur PHP sur le port 8000..."
cd public
nohup php -S localhost:8000 router.php > ../php-server.log 2>&1 &
PHP_SERVER_PID=$!
cd ..

echo "✅ Tous les serveurs sont démarrés !"
echo ""
echo "📋 Informations des serveurs:"
echo "   🔗 JSON Server:  http://localhost:3006"
echo "   🔗 Node.js API:  http://localhost:3005"
echo "   🔗 Interface Web: http://localhost:8000"
echo "   🔗 Admin Panel:   http://localhost:8000/admin.html"
echo ""
echo "📝 Logs disponibles:"
echo "   📄 JSON Server:  tail -f json-server.log"
echo "   📄 Node Server:  tail -f node-server.log"  
echo "   📄 PHP Server:   tail -f php-server.log"
echo ""
echo "⏹️  Pour arrêter tous les serveurs: ./stop-servers.sh"
echo ""

# Enregistrer les PIDs pour pouvoir les arrêter plus tard
echo $JSON_SERVER_PID > json-server.pid
echo $NODE_SERVER_PID > node-server.pid
echo $PHP_SERVER_PID > php-server.pid

echo "🎉 TransCargo est prêt !"
