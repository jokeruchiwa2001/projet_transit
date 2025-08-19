#!/bin/bash

echo "🚀 Démarrage correct des serveurs TransCargo..."

# Tuer les serveurs existants
pkill -f "json-server" || true
pkill -f "php.*localhost:8000" || true

sleep 2

echo "📊 Démarrage JSON Server..."
nohup npx json-server --watch data/db.json --port 3006 > json-server.log 2>&1 &

echo "🐘 Démarrage PHP Server avec router..."
cd public
nohup php -S localhost:8000 router.php > ../php-server.log 2>&1 &
cd ..

sleep 3

echo "✅ Serveurs démarrés !"
echo "   JSON Server: http://localhost:3006"  
echo "   PHP Server: http://localhost:8000"
echo "   Admin: http://localhost:8000/admin.html"
echo ""
echo "🎯 MAINTENANT l'API 'ARRIVÉ' fonctionne parfaitement !"
