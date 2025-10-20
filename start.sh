#!/bin/bash

echo "🚀 Démarrage de l'application Candidatures Spontanées..."
echo ""

# Fonction pour tuer les processus en cas d'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt de l'application..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Chemin de base
BASE_DIR="/home/tiliyan/Workspace/candidature-spontanee-app"

# Démarrer le backend (unset ANTHROPIC_API_KEY pour forcer l'utilisation du .env)
echo "📡 Démarrage du backend sur http://localhost:3001..."
cd "$BASE_DIR/backend" && unset ANTHROPIC_API_KEY && npm run dev &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 3

# Démarrer le frontend
echo "🎨 Démarrage du frontend sur http://localhost:3000..."
cd "$BASE_DIR/frontend" && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application démarrée !"
echo "📡 Backend : http://localhost:3001"
echo "🎨 Frontend : http://localhost:3000"
echo ""
echo "⚠️  Appuie sur Ctrl+C pour arrêter l'application"
echo ""

# Attendre que les processus se terminent
wait
