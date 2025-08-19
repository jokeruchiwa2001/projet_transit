#!/bin/bash

echo "⏹️  Arrêt des serveurs TransCargo..."

# Lire les PIDs si les fichiers existent
if [ -f json-server.pid ]; then
    JSON_PID=$(cat json-server.pid)
    if kill -0 $JSON_PID 2>/dev/null; then
        kill $JSON_PID
        echo "🛑 JSON Server ($JSON_PID) arrêté"
    fi
    rm -f json-server.pid
fi

if [ -f node-server.pid ]; then
    NODE_PID=$(cat node-server.pid)
    if kill -0 $NODE_PID 2>/dev/null; then
        kill $NODE_PID
        echo "🛑 Node Server ($NODE_PID) arrêté"
    fi
    rm -f node-server.pid
fi

if [ -f php-server.pid ]; then
    PHP_PID=$(cat php-server.pid)
    if kill -0 $PHP_PID 2>/dev/null; then
        kill $PHP_PID
        echo "🛑 PHP Server ($PHP_PID) arrêté"
    fi
    rm -f php-server.pid
fi

# Méthode de force au cas où
pkill -f "json-server" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "php.*router.php" 2>/dev/null || true

echo "✅ Tous les serveurs TransCargo ont été arrêtés"
