#!/bin/bash

# Script de déploiement sur Base Mainnet
# Usage: ./deploy-mainnet.sh

set -e

echo "🚀 Déploiement sur Base Mainnet..."
echo ""

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant !"
    echo "Copiez .env.example vers .env et remplissez vos clés"
    exit 1
fi

# Charger les variables d'environnement
source .env

# Vérifier que PRIVATE_KEY est défini
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY n'est pas défini dans .env"
    exit 1
fi

echo "📝 Étape 1/2 : Déploiement de TipSplitter..."

# Vérifier si BASESCAN_API_KEY existe
if [ -z "$BASESCAN_API_KEY" ]; then
    echo "⚠️  Déploiement sans vérification (BASESCAN_API_KEY manquant)"
    forge script script/DeployTipSplitter.s.sol:DeployTipSplitter \
        --rpc-url https://mainnet.base.org \
        --private-key $PRIVATE_KEY \
        --broadcast \
        -vvvv
else
    echo "📝 Déploiement avec vérification sur BaseScan"
    forge script script/DeployTipSplitter.s.sol:DeployTipSplitter \
        --rpc-url https://mainnet.base.org \
        --private-key $PRIVATE_KEY \
        --broadcast \
        --verify \
        --etherscan-api-key $BASESCAN_API_KEY \
        -vvvv
fi

# Demander l'adresse du TipSplitter déployé
echo ""
read -p "Entrez l'adresse du TipSplitter déployé: " TIPSPLITTER_ADDRESS

if [ -z "$TIPSPLITTER_ADDRESS" ]; then
    echo "❌ Adresse du TipSplitter requise"
    exit 1
fi

echo ""
echo "📝 Étape 2/2 : Déploiement de ForwarderFactory..."
export TIP_SPLITTER=$TIPSPLITTER_ADDRESS

# Vérifier si BASESCAN_API_KEY existe
if [ -z "$BASESCAN_API_KEY" ]; then
    echo "⚠️  Déploiement sans vérification (BASESCAN_API_KEY manquant)"
    forge script script/DeployFactory.s.sol:DeployFactory \
        --rpc-url https://mainnet.base.org \
        --private-key $PRIVATE_KEY \
        --broadcast \
        -vvvv
else
    echo "📝 Déploiement avec vérification sur BaseScan"
    forge script script/DeployFactory.s.sol:DeployFactory \
        --rpc-url https://mainnet.base.org \
        --private-key $PRIVATE_KEY \
        --broadcast \
        --verify \
        --etherscan-api-key $BASESCAN_API_KEY \
        -vvvv
fi

# Demander l'adresse de la Factory déployée
echo ""
read -p "Entrez l'adresse de la ForwarderFactory déployée: " FACTORY_ADDRESS

if [ -z "$FACTORY_ADDRESS" ]; then
    echo "❌ Adresse de la Factory requise"
    exit 1
fi

echo ""
echo "📝 Mise à jour du fichier .env.local..."

# Créer le fichier .env.local pour le frontend
cat > ../split-app/.env.local << EOF
# Base Mainnet Addresses
NEXT_PUBLIC_TIP_SPLITTER=$TIPSPLITTER_ADDRESS
NEXT_PUBLIC_FACTORY=$FACTORY_ADDRESS
EOF

echo "✅ Fichier .env.local mis à jour"
echo ""
echo "🎉 Déploiement terminé avec succès !"
echo ""
echo "📋 Résumé:"
echo "  - TipSplitter: $TIPSPLITTER_ADDRESS"
echo "  - ForwarderFactory: $FACTORY_ADDRESS"
echo "  - Chain: Base Mainnet (8453)"
echo ""
echo "🔗 Liens:"
echo "  - TipSplitter: https://basescan.org/address/$TIPSPLITTER_ADDRESS"
echo "  - Factory: https://basescan.org/address/$FACTORY_ADDRESS"
echo ""

# Si pas de clé API, afficher les instructions de vérification manuelle
if [ -z "$BASESCAN_API_KEY" ]; then
    echo "📝 Pour vérifier manuellement vos contrats sur BaseScan:"
    echo ""
    echo "1. TipSplitter:"
    echo "   forge verify-contract $TIPSPLITTER_ADDRESS \\"
    echo "     src/TipSplitter.sol:TipSplitter \\"
    echo "     --chain-id 8453 \\"
    echo "     --etherscan-api-key YOUR_API_KEY"
    echo ""
    echo "2. ForwarderFactory:"
    echo "   forge verify-contract $FACTORY_ADDRESS \\"
    echo "     src/ForwarderFactory.sol:ForwarderFactory \\"
    echo "     --chain-id 8453 \\"
    echo "     --constructor-args \$(cast abi-encode \"constructor(address)\" $TIPSPLITTER_ADDRESS) \\"
    echo "     --etherscan-api-key YOUR_API_KEY"
    echo ""
    echo "Ou vérifiez via l'interface web BaseScan:"
    echo "https://basescan.org/verifyContract"
fi
