# Correction du Front-End TipSplitter

## Problème identifié
Les transactions `deposit()` envoyaient les fonds vers l'adresse du contrat au lieu de distribuer les parts configurées car :
- L'ABI utilisée était incomplète ou mal référencée
- La mauvaise fonction était appelée (`deposit` au lieu de `depositFor`)

## Corrections effectuées

### 1. Copie de l'ABI complète
```bash
cp /Users/fianso/Development/base/BB25/tipsplitter-contracts/out/TipSplitter.sol/TipSplitter.json \
   /Users/fianso/Development/base/BB25/split-app/abi/TipSplitter.json
```

Cette commande a copié l'ABI exacte du contrat compilé par Foundry vers le projet front-end.

### 2. Correction de l'appel de fonction
**Avant :**
```typescript
functionName: 'deposit',
args: [owner as \`0x\${string}\`],
```

**Après :**
```typescript
functionName: 'depositFor',
args: [owner as \`0x\${string}\`],
```

## Fonctions du contrat

Le contrat TipSplitter possède **deux fonctions de dépôt** :

1. **`deposit()`** - Sans paramètres
   - Utilise la configuration de split de l'appelant (msg.sender)
   - L'ETH est distribué aux destinataires configurés par celui qui envoie

2. **`depositFor(address owner)`** - Avec un paramètre owner
   - Utilise la configuration de split du `owner` spécifié
   - Permet d'envoyer un tip à quelqu'un d'autre en utilisant SA configuration

## Vérification

L'ABI contient maintenant toutes les fonctions :
- ✅ `TOTAL_BPS`
- ✅ `deposit`
- ✅ `depositFor` ← Correction appliquée
- ✅ `getSplit`
- ✅ `getSplitLength`
- ✅ `setSplit`
- ✅ `splits`

## Test à effectuer

1. Ouvrir http://localhost:3000
2. Connecter le wallet (Rabby/MetaMask) sur Base Sepolia
3. Configurer un split avec setSplit() :
   - Exemple : 2 adresses avec 5000 bps chacune (50% + 50%)
4. Envoyer un tip avec depositFor() :
   - Spécifier l'adresse du owner
   - Montant : par exemple 0.001 ETH
5. Vérifier sur Basescan :
   - La fonction appelée doit être `depositFor(address)`
   - Les fonds doivent être distribués aux bonnes adresses selon les parts configurées
   - Le contrat ne doit PAS conserver les fonds

## Contrat déployé
- **Adresse** : 0x06b68a99C83319cB546939023cfc92CdeF046Ee8
- **Réseau** : Base Sepolia
- **Explorer** : https://sepolia.basescan.org/address/0x06b68a99C83319cB546939023cfc92CdeF046Ee8
