#!/bin/bash

# Script pour migrer de Base Sepolia vers Base Mainnet
# Usage: ./migrate-to-mainnet.sh

set -e

echo "🔄 Migration vers Base Mainnet..."
echo ""

# Fichiers à modifier
FILES=(
  "app/sender/page.tsx"
  "app/receiver/page.tsx"
)

for file in "${FILES[@]}"; do
  echo "📝 Mise à jour de $file..."
  
  # Remplacer l'import
  sed -i '' 's/import { baseSepolia }/import { base }/g' "$file"
  
  # Remplacer baseSepolia.id par base.id
  sed -i '' 's/baseSepolia\.id/base.id/g' "$file"
  
  # Remplacer baseSepolia par base dans les autres contextes
  sed -i '' 's/baseSepolia/base/g' "$file"
  
  echo "✅ $file mis à jour"
done

echo ""
echo "✅ Migration terminée !"
echo ""
echo "⚠️  N'oubliez pas:"
echo "  1. Déployer les contrats sur Base Mainnet"
echo "  2. Mettre à jour le fichier .env.local avec les nouvelles adresses"
echo "  3. Changer les chainId de 84532 (Sepolia) vers 8453 (Mainnet) dans getSplitKey"
