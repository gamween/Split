# BB25 Split - Farcaster Mini App Implementation

## ✅ Implementation Complete

Your app has been successfully converted to a Farcaster Mini App following the Base Mini Apps migration guide.

---

## 📋 What Was Implemented

### 1. **Mini App SDK Integration**
- ✅ Installed `@farcaster/miniapp-sdk`
- ✅ Created `MiniAppProvider` component that calls `sdk.actions.ready()`
- ✅ Added loading splash screen while SDK initializes
- ✅ Integrated into app providers hierarchy

### 2. **Farcaster Manifest**
- ✅ Created `/.well-known/farcaster.json` with full app metadata
- ✅ Configured app name, description, icons, screenshots
- ✅ Set splash screen and webhook endpoint
- ✅ Added placeholder for `accountAssociation` (to be filled after deployment)

### 3. **Frame Entry Point**
- ✅ Created Frame image endpoint: `/api/frame/image`
- ✅ Created Frame action handler: `/api/frame/action`
- ✅ Implemented two-button Frame:
  - "I'm a Sender" → launches `/sender`
  - "I'm a Receiver" → launches `/receiver`

### 4. **Metadata & Discovery**
- ✅ Added `fc:miniapp` metadata to layout
- ✅ Added Frame metadata for social sharing
- ✅ Created OG images for embeds

### 5. **Webhook Endpoint**
- ✅ Created `/api/webhook` for Farcaster notifications
- ✅ Stub implementation ready for future event handling

### 6. **Images & Assets**
- ✅ Created minimal black/white/gray design images:
  - `icon.svg` (512x512) - App icon
  - `splash.svg` (1200x630) - Loading screen
  - `hero.svg` (1200x630) - Hero image
  - `og.svg` (1200x630) - Open Graph image
  - `embed-image.svg` (1200x630) - Frame embed
  - `screenshot-sender.svg` - Sender page preview
  - `screenshot-receiver.svg` - Receiver page preview

### 7. **Next.js Configuration**
- ✅ Added CORS headers for `/api` routes
- ✅ Added headers for `/.well-known` manifest
- ✅ Configured proper content types

### 8. **Security & Chain Enforcement**
- ✅ Maintained Base Sepolia (84532) enforcement
- ✅ Kept "Save Split" local-only (no signature)
- ✅ "Send Tip" remains the only on-chain transaction

---

## 🆕 New Environment Variables

Add these to your `.env.local`:

```bash
# Required - Your deployed app URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Existing (keep as is)
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_TIP_SPLITTER=0x06b68a99C83319cB546939023cfc92CdeF046Ee8
NEXT_PUBLIC_FACTORY=0x71078C74AD243228591D95A383DEBaAE0f746AA3

# Optional - For webhook verification (add later if needed)
# NEYNAR_API_KEY=your_neynar_api_key
# HUBBLE_URL=https://hub.farcaster.xyz
```

---

## 🚀 Testing in Warpcast - Step by Step

### **STEP 1: Deploy to Vercel**

1. Push your code to GitHub:
   ```bash
   cd /Users/fianso/Development/base/BB25/split-app
   git add .
   git commit -m "feat: convert to Farcaster Mini App"
   git push origin main
   ```

2. Deploy to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - **Important**: Add environment variables:
     - `NEXT_PUBLIC_APP_URL` = your Vercel URL (e.g., `https://bb25-split.vercel.app`)
     - `NEXT_PUBLIC_RPC_URL` = `https://sepolia.base.org`
     - `NEXT_PUBLIC_TIP_SPLITTER` = `0x06b68a99C83319cB546939023cfc92CdeF046Ee8`
     - `NEXT_PUBLIC_FACTORY` = `0x71078C74AD243228591D95A383DEBaAE0f746AA3`
   - Deploy

3. After deployment, update the manifest:
   - Edit `/public/.well-known/farcaster.json`
   - Replace all `https://your-domain.vercel.app` with your actual Vercel URL
   - Commit and redeploy

### **STEP 2: Convert SVG Images to PNG**

The manifest requires PNG images. Convert your SVG files:

**Option A - Online Converter:**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload and convert each SVG from `/public/`:
   - `icon.svg` → `icon.png`
   - `splash.svg` → `splash.png`
   - `hero.svg` → `hero.png`
   - `og.svg` → `og.png`
   - `embed-image.svg` → `embed-image.png`
   - `screenshot-sender.svg` → `screenshot-sender.png`
   - `screenshot-receiver.svg` → `screenshot-receiver.png`
3. Download and place PNG files in `/public/`
4. Update manifest to use `.png` extensions
5. Commit and redeploy

**Option B - Command Line (if you have ImageMagick):**
```bash
cd /Users/fianso/Development/base/BB25/split-app/public
for f in *.svg; do convert "$f" "${f%.svg}.png"; done
```

### **STEP 3: Generate Account Association Credentials**

1. Ensure your app is live at your Vercel URL
2. Go to [Base Build Account Association](https://www.base.dev/preview?tab=account)
3. Paste your Vercel URL (e.g., `bb25-split.vercel.app`) in the "App URL" field
4. Click "Submit"
5. Click "Verify" and follow instructions to sign with your Farcaster account
6. Copy the generated `accountAssociation` fields (header, payload, signature)
7. Update `/public/.well-known/farcaster.json`:
   ```json
   {
     "accountAssociation": {
       "header": "eyJmaWQiOjkxNTIs...",  // paste from Base Build
       "payload": "eyJkb21haW4i...",     // paste from Base Build  
       "signature": "MHgwMDAw..."        // paste from Base Build
     },
     "baseBuilder": {
       "allowedAddresses": ["0xYourBaseAccountAddress"]  // add your address
     },
     "miniapp": { ... }
   }
   ```
8. Commit and redeploy

### **STEP 4: Verify Manifest is Accessible**

Test that your manifest is publicly accessible:
```bash
curl https://your-app.vercel.app/.well-known/farcaster.json
```

Should return valid JSON with all fields filled.

### **STEP 5: Preview Your Mini App**

1. Go to [Base Build Preview Tool](https://www.base.dev/preview)
2. Enter your app URL: `https://your-app.vercel.app`
3. **Tabs to check:**
   - **Preview**: See the Frame embed with "I'm a Sender" / "I'm a Receiver" buttons
   - **Account association**: Verify credentials are valid
   - **Metadata**: Check all manifest fields are populated
4. Click the launch button to test the Mini App opens correctly

### **STEP 6: Publish to Base App**

1. Open the [Base app](https://www.base.dev/)
2. Create a new cast
3. Paste your app URL: `https://your-app.vercel.app`
4. The Frame should appear with your embed image and buttons
5. Post the cast

### **STEP 7: Test in Warpcast**

1. Open [Warpcast](https://warpcast.com/) (mobile or desktop)
2. Find your cast with the Mini App
3. **Test Frame buttons:**
   - Tap "I'm a Sender" → should launch Mini App at `/sender`
   - Tap "I'm a Receiver" → should launch Mini App at `/receiver`

4. **Test Sender Flow:**
   - Connect wallet (Rabby/MetaMask/Coinbase Wallet)
   - Verify chain switches to Base Sepolia (84532)
   - Add recipient addresses and BPS (total = 10000)
   - Click "Save Split" → **NO signature required** (local storage only)
   - Enter tip amount (e.g., 0.01 ETH)
   - Click "Send Tip" → **2 signatures required**:
     1. `setSplit()` - saves config on-chain
     2. `deposit()` - sends ETH and distributes to recipients
   - Verify recipients receive funds according to BPS

5. **Test Receiver Flow:**
   - Enter owner address
   - Click "Save Split" → **NO signature required**
   - Click "Get Unique Address" → **signature required** (factory deployment)
   - Copy payment link
   - Share with senders

---

## 📁 Files Changed

### New Files Created:
```
public/
  .well-known/farcaster.json       # Mini App manifest
  icon.svg                         # App icon
  splash.svg                       # Splash screen
  hero.svg                         # Hero image
  og.svg                           # Open Graph image
  embed-image.svg                  # Frame embed image
  screenshot-sender.svg            # Sender page screenshot
  screenshot-receiver.svg          # Receiver page screenshot

app/
  miniapp-provider.tsx             # Mini App SDK initialization
  api/
    frame/
      image/route.tsx              # Frame image endpoint
      action/route.ts              # Frame action handler
    webhook/route.ts               # Webhook endpoint

scripts/
  convert-images.sh                # Image conversion helper

.env.example                       # Environment variables template
```

### Modified Files:
```
app/
  layout.tsx                       # Added fc:miniapp metadata
  providers.tsx                    # Integrated MiniAppProvider

next.config.mjs                    # Added CORS headers
```

---

## 🔍 Debugging Tips

### If Mini App doesn't load:
- Check browser console for SDK errors
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Ensure `sdk.actions.ready()` is called after app loads

### If Frame doesn't display:
- Verify manifest at `/.well-known/farcaster.json` is accessible
- Check all image URLs are absolute and publicly accessible
- Validate `fc:frame` metadata in page source

### If wallet connection fails:
- Ensure wagmi config includes Base Sepolia (84532)
- Check `isCorrectChain` validation works
- Verify RPC URL is correct: `https://sepolia.base.org`

### If transactions fail:
- Confirm contract addresses are correct:
  - TipSplitter: `0x06b68a99C83319cB546939023cfc92CdeF046Ee8`
  - Factory: `0x71078C74AD243228591D95A383DEBaAE0f746AA3`
- Verify user has Base Sepolia ETH for gas
- Check localStorage for saved split config

---

## 🎯 Key Features Maintained

✅ No signature on "Save Split" (local storage only)  
✅ Only "Send Tip" triggers wallet signatures  
✅ Base Sepolia (84532) enforced throughout  
✅ Clean black/white/gray minimal design  
✅ Split config persists in localStorage by wallet address  
✅ Auto-loads saved config on wallet connection  

---

## 📞 Support Resources

- **Base Mini Apps Docs**: https://docs.base.org/mini-apps/
- **Farcaster Frames Spec**: https://docs.farcaster.xyz/reference/frames/spec
- **Base Build Tools**: https://www.base.dev/
- **Warpcast Developer Tools**: https://warpcast.com/~/developers

---

## ✨ Next Steps (Optional Enhancements)

1. **Add Neynar verification** for webhook security
2. **Implement analytics** to track Mini App usage
3. **Add share functionality** to cast successful tips
4. **Create notification system** for received tips
5. **Deploy to Base Mainnet** when ready for production

---

**Your app is now a fully functional Farcaster Mini App! 🎉**

Follow the testing checklist above to verify everything works in Warpcast.
