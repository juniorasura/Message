# ChatApp Server Configuration Guide

## Problem: "Server Offline" Message

If you're seeing "Server Offline" when accessing your chat app, it's because the frontend can't connect to your backend server. Here's how to fix it:

## Solution Options

### Option 1: Same Network Access (Recommended for Testing)

1. **Find your PC's IP address** (already done: `192.168.18.6`)
2. **Update the config file** (`config.js`):
   ```javascript
   ACTIVE_SERVER: 'NETWORK_SERVER', // This is already set
   ```
3. **Access from your phone**: Go to `http://192.168.18.6:3000` on your phone
4. **Access from GitHub Pages**: The app will automatically use your PC's IP

### Option 2: Deploy to Cloud (Recommended for Production)

Deploy your backend to a cloud service:

#### Heroku (Free)
1. Create account at [heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Run these commands:
   ```bash
   heroku create your-chatapp-name
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```
4. Update `config.js`:
   ```javascript
   DEPLOYED_SERVER: 'https://your-chatapp-name.herokuapp.com/api',
   ACTIVE_SERVER: 'DEPLOYED_SERVER',
   ```

#### Railway (Free)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy automatically
4. Update `config.js` with the provided URL

## Current Configuration

Your current setup uses:
- **Network Server**: `http://192.168.18.6:3000/api`
- **Active Server**: `NETWORK_SERVER`

## Testing Your Setup

1. **From PC**: Go to `http://localhost:3000` ✅
2. **From Phone (same WiFi)**: Go to `http://192.168.18.6:3000` ✅
3. **From GitHub Pages**: The app will try to connect to `192.168.18.6:3000` ✅

## Troubleshooting

### "Server Offline" still appears?
1. Make sure your PC's firewall allows connections on port 3000
2. Check that your phone and PC are on the same WiFi network
3. Try accessing `http://192.168.18.6:3000` directly in your phone's browser

### Want to access from anywhere?
Deploy to a cloud service (Option 2) - this is the best long-term solution.

### For GitHub Pages access from mobile data?
You must deploy your backend to a cloud service since GitHub Pages cannot reach local network IPs from the internet. 