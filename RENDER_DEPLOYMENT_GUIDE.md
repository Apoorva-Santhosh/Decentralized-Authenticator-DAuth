# Render Deployment Guide for Decentralized Authenticator (DAuth)

## Project Overview

Your project is a **React + Express.js** full-stack application with blockchain integration:
- **Frontend**: React with Vite (UI for authentication, password analysis, ledger viewing)
- **Backend**: Express.js server (serves static files and API endpoints)
- **Blockchain**: Ethereum smart contracts (AuthManager.sol) with Hardhat

---

## Prerequisites

Before deploying to Render, you'll need:

1. **GitHub Account** - Push your code to GitHub (Render integrates directly)
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Git initialized** in your project (it already is since you mentioned it's a repo)
4. **Node.js 18+ compatible code** (your dependencies support this)

---

## Step 1: Prepare Your Project for Render

### 1.1 Update Build Configuration

Your `vite.config.js` has a base path that's specific to GitHub Pages. Update it for Render:

**Current:**
```javascript
base: '/BlockAuth-PassAnalysis/',
```

**Change to (for root deployment):**
```javascript
base: '/',
```

Or keep the custom path if needed. This depends on your Render setup.

### 1.2 Fix server.js - Convert to ES Module

Your `server.js` uses CommonJS (`require`), but `package.json` specifies `"type": "module"`. Update `server.js`:

**Change:**
```javascript
const express = require('express');
const path = require('path');
```

**To:**
```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 1.3 Add Node.js Version File

Create a `.nvmrc` file in your root to specify Node version:

```
18.18.0
```

Or create a `build.sh` file if you need custom build steps (see Advanced section).

### 1.4 Verify package.json Scripts

Your `package.json` should have:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node server.js"
  }
}
```

Make sure the `"start"` script is present - Render will use this to run your application.

### 1.5 Update server.js for Production

Ensure your Express server properly handles the React Router:

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Parse incoming JSON requests
app.use(express.json());

// API routes (blockchain-related)
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express backend!' });
});

// Serve React app for all other routes (important for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

---

## Step 2: Push Code to GitHub

If not already done:

```powershell
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/Decentralized-Authenticator-DAuth.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Create Render Web Service

### 3.1 Log in to Render Dashboard

Go to [render.com/dashboard](https://render.com/dashboard)

### 3.2 Create a New Web Service

1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: 
   - Click "Connect Repository"
   - Select your GitHub repo `Decentralized-Authenticator-DAuth`
   - Click "Connect"
3. **Configure Service**:
   - **Name**: `dauth` (or any name)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users (e.g., `Ohio` for USA)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 3.3 Environment Variables (if needed)

If your blockchain contract needs network configuration:

1. Scroll to **"Environment"** section
2. Add variables (examples):
   ```
   NODE_ENV=production
   VITE_INFURA_KEY=your_infura_key_here (if using Infura for blockchain)
   VITE_CONTRACT_ADDRESS=your_deployed_contract_address
   ```

3. Check your code to see what environment variables you're actually using.

### 3.4 Choose Plan

- **Free Plan**: Good for testing (has limitations)
- **Starter Plan**: $7/month (recommended for production)

### 3.5 Click "Create Web Service"

Render will now:
1. Clone your repository
2. Install dependencies
3. Build your Vite project
4. Start your Express server

---

## Step 4: Monitor Deployment

### 4.1 View Deployment Logs

In Render dashboard:
1. Click on your service
2. Go to **"Logs"** tab
3. Watch for build progress and errors

### 4.2 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Cannot find module 'express'` | Dependencies didn't install. Check `npm install` in build logs |
| `Port already in use` | Render handles this. The app uses `process.env.PORT` automatically |
| `dist folder not found` | Build command failed. Check build logs for errors |
| `React Router 404 errors` | Ensure the catch-all route in `server.js` is properly configured |
| Blank page loads | Check browser console for errors. Verify base path in `vite.config.js` |

### 4.3 Get Your Live URL

Once deployed successfully:
- Render assigns a URL like: `https://dauth-xxxxx.onrender.com`
- Your app is now live! 🎉

---

## Step 5: Deployment Checklist

Before deploying, ensure:

- [ ] `.nvmrc` file exists with Node.js version
- [ ] `server.js` uses ES modules (no `require`)
- [ ] `package.json` has `"start"` script
- [ ] `npm run build` works locally without errors
- [ ] All environment variables are set in Render dashboard
- [ ] GitHub repository is up to date and pushed
- [ ] `vite.config.js` has correct `base` path
- [ ] No hardcoded localhost URLs in code
- [ ] `dist` folder is added to `.gitignore` (build artifacts shouldn't be committed)

---

## Step 6: Post-Deployment

### 6.1 Custom Domain (Optional)

1. In Render dashboard, go to **"Settings"**
2. Under **"Custom Domain"**, add your domain
3. Update DNS records as Render instructs

### 6.2 Enable Auto-Deploy

- By default, Render auto-deploys on every push to `main` branch
- To disable: Settings → **"Auto Deploy"** → Turn off

### 6.3 Monitor Performance

1. **Logs**: Check `/Logs` regularly
2. **Metrics**: View CPU, memory, bandwidth usage
3. **Errors**: Set up Render's alerts if desired

### 6.4 Database/Blockchain Considerations

- **Smart Contracts**: Your current setup uses client-side interaction with blockchain
- **Backend APIs**: If you need backend blockchain interaction, add API routes in `server.js`
- **Ethereum Network**: Make sure your smart contract is deployed to a public testnet (Sepolia, Mumbai) or mainnet

---

## Advanced: Custom Build Processes

If you need custom build steps, create a `build.sh` file:

```bash
#!/bin/bash
set -e

# Install dependencies
npm install

# Build React app
npm run build

# Add any other build steps here
echo "Build completed successfully!"
```

Then in Render, set:
- **Build Command**: `bash build.sh`
- **Start Command**: `npm start`

---

## Troubleshooting

### "Build failed" Error

Check these in this order:

1. **Check logs** in Render dashboard
2. **Run locally**: `npm run build` and `npm start`
3. **Node version**: Ensure `.nvmrc` specifies compatible version
4. **Dependencies**: Make sure no missing packages in `package.json`
5. **Environment variables**: All required env vars are set

### App Crashes After Deploy

Check `/Logs` for runtime errors:
- Port binding issues
- Missing modules
- Unhandled promise rejections

### Blank Page but No Errors

- Check browser DevTools → Network tab (is `index.html` loading?)
- Check browser Console for JavaScript errors
- Verify `vite.config.js` base path matches your URL structure

### How to Redeploy Manually

1. Push new changes to GitHub:
   ```powershell
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. Render auto-deploys. To manually trigger:
   - Render dashboard → Service → "Logs" → "Redeploy"

---

## Cost Estimate

- **Free Plan**: $0 (limited, spins down after 15 min inactivity)
- **Starter Plan**: $7/month (recommended)
- **Standard Plan**: $12/month (for production apps)

For a blockchain authentication app, **Starter Plan** should be sufficient.

---

## Security Best Practices

1. **Never commit secrets**: Use environment variables for API keys, contract addresses
2. **Use HTTPS**: Render provides free SSL certificates (enabled by default)
3. **Environment-specific configs**: Different contract addresses for testnet vs mainnet
4. **Validate inputs**: Sanitize all user inputs before blockchain interaction

---

## Next Steps

After successful deployment:

1. Test all features (Register, Login, Ledger, Password Analysis)
2. Monitor logs for 24 hours
3. Set up custom domain if needed
4. Update any hardcoded URLs to your live domain
5. Test blockchain transactions if applicable

---

## Useful Resources

- [Render Docs](https://docs.render.com)
- [Vite Guide](https://vitejs.dev/guide/)
- [Express.js Guide](https://expressjs.com/)
- [Hardhat Docs](https://hardhat.org/docs) (for blockchain deployment)

---

## Questions?

If you encounter issues during deployment, check:
1. Render dashboard logs
2. Local `npm run build` and `npm start`
3. GitHub repo is properly pushed
4. All required environment variables are set

Good luck with your deployment! 🚀
