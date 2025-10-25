# 🚀 Guide de Déploiement sur Base Mainnet

## Prérequis

- ✅ Un wallet avec **ETH sur Base Mainnet** (~$10 pour les gas fees)
- ✅ Foundry installé (`curl -L https://foundry.paradigm.xyz | bash`)
- ✅ Node.js et npm/pnpm installés

## 📋 Étapes de Déploiement

### 1. Préparer l'environnement des contrats

```bash
cd tipsplitter-contracts

# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env et ajouter:
# PRIVATE_KEY=your_private_key_here
# BASE_RPC_URL=https://mainnet.base.org
# BASESCAN_API_KEY=your_basescan_api_key (optionnel, pour vérification)
```

⚠️ **IMPORTANT**: Ne commitez JAMAIS votre `.env` avec votre clé privée !

### 2. Déployer les smart contracts

```bash
# Lancer le script de déploiement
./deploy-mainnet.sh
```

Le script va :
1. Déployer `TipSplitter.sol`
2. Déployer `ForwarderFactory.sol`
3. Créer automatiquement le fichier `.env.local` avec les adresses

Notez les adresses déployées qui s'affichent à la fin.

### 3. Migrer le frontend vers Base Mainnet

```bash
cd ../split-app

# Exécuter le script de migration
./migrate-to-mainnet.sh
```

Ce script remplace automatiquement:
- `baseSepolia` → `base`
- `chainId: 84532` → `chainId: 8453`

### 4. Vérifier le fichier .env.local

Le fichier `split-app/.env.local` devrait contenir:

```env
NEXT_PUBLIC_TIP_SPLITTER=0x... (adresse TipSplitter sur Base)
NEXT_PUBLIC_FACTORY=0x... (adresse ForwarderFactory sur Base)
```

### 5. Tester localement

```bash
# Dans split-app/
npm run dev
```

Ouvrez http://localhost:3000 et testez avec votre wallet sur **Base Mainnet**.

### 6. Déployer sur Vercel

```bash
# Si pas encore fait, installer Vercel CLI
npm i -g vercel

# Déployer
cd split-app
vercel

# Lors du déploiement, Vercel vous demandera les variables d'environnement
# Ajoutez:
# NEXT_PUBLIC_TIP_SPLITTER=0x...
# NEXT_PUBLIC_FACTORY=0x...
```

Ou configurez les variables d'environnement dans le dashboard Vercel:
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Ajoutez `NEXT_PUBLIC_TIP_SPLITTER` et `NEXT_PUBLIC_FACTORY`

## ✅ Vérification

Une fois déployé, vérifiez que:

1. ✅ Les contrats sont sur BaseScan:
   - TipSplitter: https://basescan.org/address/VOTRE_ADRESSE
   - ForwarderFactory: https://basescan.org/address/VOTRE_ADRESSE

2. ✅ L'app fonctionne sur Vercel

3. ✅ Vous pouvez:
   - Configurer un split
   - Générer une adresse de paiement
   - Envoyer de l'ETH et voir la distribution

## 🔐 Sécurité

- ⚠️ Ne partagez JAMAIS votre `PRIVATE_KEY`
- ⚠️ Ajoutez `.env` au `.gitignore`
- ⚠️ Les variables `NEXT_PUBLIC_*` sont publiques (c'est normal pour les adresses de contrats)

## 💰 Coûts Estimés

- Déploiement TipSplitter: ~$2-5
- Déploiement ForwarderFactory: ~$2-5
- Vérification sur BaseScan: Gratuit
- Hébergement Vercel: Gratuit (plan Hobby)

**Total: ~$4-10 en gas fees**

## 🐛 Troubleshooting

**Erreur: "insufficient funds"**
→ Assurez-vous d'avoir assez d'ETH sur Base Mainnet

**Erreur: "nonce too low"**
→ Attendez quelques secondes et réessayez

**Les transactions échouent**
→ Vérifiez que vous êtes sur le bon réseau (Base, chainId 8453)

**L'app ne se connecte pas**
→ Vérifiez que MetaMask est configuré sur Base Mainnet

## 📚 Ressources

- Base Mainnet RPC: https://mainnet.base.org
- BaseScan: https://basescan.org
- Bridge vers Base: https://bridge.base.org
- Documentation Base: https://docs.base.org
