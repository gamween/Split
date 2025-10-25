#!/bin/bash

# Script de déploiement Vercel
# Usage: ./deploy-vercel.sh

set -e

echo "🚀 Déploiement sur Vercel..."
echo ""

# Vérifier que .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ Fichier .env.local manquant !"
    echo "Créez-le avec vos adresses de contrats:"
    echo ""
    echo "NEXT_PUBLIC_TIP_SPLITTER=0x..."
    echo "NEXT_PUBLIC_FACTORY=0x..."
    exit 1
fi

# Afficher les variables qui seront déployées
echo "📋 Variables d'environnement:"
cat .env.local
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm i -g vercel
fi

echo ""
echo "🌐 Déploiement sur Vercel..."
echo ""

# Déployer
vercel --prod

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 N'oubliez pas d'ajouter les variables d'environnement dans Vercel Dashboard:"
echo "   https://vercel.com/dashboard → Settings → Environment Variables"
echo ""
echo "Ajoutez:"
cat .env.local | sed 's/^/  - /'
