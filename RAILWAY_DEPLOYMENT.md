# Railway Deployment Guide

## Prerequisites
- A Railway account (sign up at https://railway.app)
- Your GitHub repository connected to Railway

## Step-by-Step Deployment

### 1. Connect to Railway
1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `juniorasura/Message`

### 2. Configure the Project
1. Railway will automatically detect it's a Node.js project
2. The `Procfile` will tell Railway to run `node server.js`
3. Railway will automatically install dependencies from `package.json`

### 3. Get Your Railway URL
1. Once deployed, Railway will provide a URL like: `https://your-app-name.railway.app`
2. Copy this URL

### 4. Update Frontend Configuration
1. Go to your `config.js` file
2. Replace the `RAILWAY_SERVER` URL with your actual Railway URL:
   ```javascript
   RAILWAY_SERVER: 'https://your-actual-app-name.railway.app/api',
   ```
3. Change `ACTIVE_SERVER` to `'RAILWAY_SERVER'`:
   ```javascript
   ACTIVE_SERVER: 'RAILWAY_SERVER',
   ```

### 5. Commit and Push Changes
```bash
git add config.js
git commit -m "Update config for Railway deployment"
git push origin main
```

### 6. Test Your Deployment
1. Visit your Railway URL to ensure the server is running
2. Test the API endpoints: `https://your-app-name.railway.app/api/health`
3. Update your GitHub Pages frontend to use the Railway backend

## Important Notes

### Database
- Railway provides ephemeral storage, so your SQLite database will be reset on each deployment
- For production, consider using Railway's PostgreSQL service
- The database file is excluded from Git (see `.gitignore`)

### Environment Variables
- Railway automatically sets `PORT` environment variable
- You can add custom environment variables in Railway dashboard

### File Uploads
- The `uploads` directory is included in deployment
- Files uploaded to Railway will persist until the next deployment
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)

### Monitoring
- Railway provides logs and monitoring in the dashboard
- You can view real-time logs and restart the service if needed

## Troubleshooting

### Common Issues
1. **Port Issues**: The app now uses `process.env.PORT || 3000` to work with Railway
2. **Database Issues**: SQLite database will be recreated on each deployment
3. **File Uploads**: Ensure the `uploads` directory exists and has proper permissions

### Logs
- Check Railway logs in the dashboard for any errors
- Common errors include missing dependencies or database issues

## Next Steps
1. Deploy to Railway
2. Update your frontend configuration
3. Test the complete application
4. Consider setting up a custom domain if needed

## Support
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway 