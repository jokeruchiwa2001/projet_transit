#!/bin/bash

echo "🚀 Démarrage des serveurs TransCargo..."

# Démarrer json-server en arrière-plan
echo "📊 Démarrage de json-server sur le port 3006..."
npx json-server --watch data/db.json --port 3006 &
JSON_PID=$!

# Attendre que json-server soit prêt
sleep 3

# Démarrer le serveur PHP avec routeur
echo "🌐 Démarrage du serveur PHP sur le port 8000 avec routeur..."
cd public && php -S localhost:8000 router.php &
PHP_PID=$!

echo "✅ Serveurs démarrés !"
echo "📊 json-server: http://localhost:3006"
echo "🌐 Interface web: http://localhost:8000"
echo "🔧 Admin: http://localhost:8000/admin.html"
echo ""
echo "🧪 API Tests:"
echo "   curl 'http://localhost:8000/api/colis/search?code=COL-XXX'"
echo "   curl 'http://localhost:8000/api/statistiques'"
echo ""
echo "Pour arrêter les serveurs : Ctrl+C ou kill $JSON_PID $PHP_PID"

# Attendre que l'utilisateur arrête les serveurs
wait
