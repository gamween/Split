# Déploiement Vercel - Configuration Finale

## ✅ Application déployée !

**URL de production** : https://split-kgjw140fk-gamween-7559s-projects.vercel.app

---

## 🔧 Configuration requise dans Vercel Dashboard

### 1. Désactiver Vercel Authentication Protection

Le manifest `/.well-known/farcaster.json` doit être accessible publiquement sans authentification.

**Comment faire :**
1. Allez sur https://vercel.com/gamween-7559s-projects/split-app/settings/deployment-protection
2. Sous "Deployment Protection", désactivez "Vercel Authentication"
3. Ou ajoutez `/.well-known/*` aux chemins publics

### 2. Ajouter les variables d'environnement

Allez sur https://vercel.com/gamween-7559s-projects/split-app/settings/environment-variables

Ajoutez ces variables pour **Production** :

```
NEXT_PUBLIC_APP_URL=https://split-kgjw140fk-gamween-7559s-projects.vercel.app
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_TIP_SPLITTER=0x06b68a99C83319cB546939023cfc92CdeF046Ee8
NEXT_PUBLIC_FACTORY=0x71078C74AD243228591D95A383DEBaAE0f746AA3
```

### 3. Obtenir un domaine personnalisé (optionnel mais recommandé)

Pour faciliter les tests Farcaster :

1. Allez sur https://vercel.com/gamween-7559s-projects/split-app/settings/domains
2. Ajoutez un domaine (ex: `bb25-split.vercel.app`)
3. Mettez à jour le manifest avec la nouvelle URL
4. Redéployez

---

## 🚀 Prochaines étapes après configuration

### 1. Tester l'accessibilité du manifest

```bash
curl https://split-kgjw140fk-gamween-7559s-projects.vercel.app/.well-known/farcaster.json
```

Devrait retourner du JSON valide (pas d'authentification).

### 2. Générer les credentials d'Account Association

1. Allez sur https://www.base.dev/preview?tab=account
2. Entrez votre URL Vercel
3. Cliquez "Verify" et signez avec votre compte Farcaster
4. Copiez les champs `accountAssociation` générés
5. Mettez à jour `/public/.well-known/farcaster.json`
6. Redéployez : `npx vercel --prod`

### 3. Prévisualiser sur Base Build

1. Allez sur https://www.base.dev/preview
2. Entrez votre URL
3. Vérifiez :
   - Preview (Frame avec boutons)
   - Account association (valide)
   - Metadata (tous les champs remplis)

### 4. Publier sur Base App

1. Allez sur https://www.base.dev/
2. Créez un cast avec votre URL
3. Le Frame devrait apparaître
4. Testez les boutons "I'm a Sender" / "I'm a Receiver"

### 5. Tester dans Warpcast

1. Ouvrez Warpcast (mobile ou desktop)
2. Trouvez votre cast
3. Testez le lancement du Mini App
4. Vérifiez les flows complets

---

## 📋 Checklist de déploiement

- [ ] Désactiver Vercel Authentication pour `/.well-known/*`
- [ ] Ajouter toutes les variables d'environnement
- [ ] Tester curl du manifest (doit retourner JSON)
- [ ] Générer Account Association credentials
- [ ] Mettre à jour le manifest avec les credentials
- [ ] Redéployer
- [ ] Prévisualiser sur Base Build
- [ ] Publier sur Base App
- [ ] Tester dans Warpcast

---

## 🐛 Debugging

### Si le manifest n'est pas accessible :
- Vérifier Deployment Protection désactivée
- Vérifier que `vercel.json` est bien déployé
- Vérifier CORS headers dans Network tab

### Si le Frame ne s'affiche pas :
- Vérifier métadonnées `fc:frame` dans le HTML source
- Vérifier que toutes les images sont accessibles
- Tester avec Base Build Preview tool

### Si l'app ne se lance pas :
- Vérifier console browser pour erreurs SDK
- Vérifier que `sdk.actions.ready()` est appelé
- Vérifier variables d'environnement

---

**Toute la documentation complète est dans :** `/MINIAPP_IMPLEMENTATION.md`
