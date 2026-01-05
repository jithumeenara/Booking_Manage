# 🚀 Deployment Guide - ACSTI Booking Management System

This application has two parts that need to be deployed separately:
1. **Frontend** (React + Vite) → Netlify
2. **Backend API** (Express.js) → Render.com (recommended) or Railway

---

## 📋 Prerequisites

- [x] GitHub repository: https://github.com/jithumeenara/Booking_Manage.git
- [x] MySQL Database on AWS RDS (already set up)
- [ ] Netlify account (for frontend)
- [ ] Render.com account (for backend) - **FREE tier available**

---

## 🎯 Deployment Strategy

### Option 1: Render.com for Backend (RECOMMENDED - FREE)
- ✅ Free tier available
- ✅ Easy to set up
- ✅ Automatic deployments from GitHub
- ✅ Native Node.js support

### Option 2: Railway.app for Backend
- ⚠️ Free $5 credit per month (may not be enough)
- ✅ Easy to set up

---

## 📦 STEP 1: Deploy Backend API to Render.com

### 1.1 Create a Render.com Account
1. Go to https://render.com/
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 1.2 Create a New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `jithumeenara/Booking_Manage`
3. Configure the service:
   - **Name**: `acsti-booking-api`
   - **Region**: Choose closest to your database (Singapore for ap-southeast-2)
   - **Branch**: `main` (or `master`)
   - **Root Directory**: Leave empty (uses repository root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run api`
   - **Instance Type**: `Free`

### 1.3 Add Environment Variables
In the "Environment" section, add these variables:

```
MYSQL_HOST=database-1.cjwmwicii3aw.ap-southeast-2.rds.amazonaws.com
MYSQL_PORT=3306
MYSQL_USER=admin
MYSQL_PASSWORD=Mysql2login&
MYSQL_DATABASE=acsti_db
JWT_SECRET=some_long_random_string_here
PORT=3001
```

⚠️ **IMPORTANT**: Keep these credentials secure!

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. You'll get a URL like: `https://acsti-booking-api.onrender.com`

**📝 Copy this URL - you'll need it for the frontend!**

---

## 🎨 STEP 2: Deploy Frontend to Netlify

### 2.1 Update netlify.toml
1. Open `netlify.toml` in your project
2. Replace `https://your-backend-url.com` with your Render backend URL from Step 1.4:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://acsti-booking-api.onrender.com/api/:splat"
     status = 200
     force = true
   ```

### 2.2 Push Code to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/jithumeenara/Booking_Manage.git
git branch -M main
git push -u origin main
```

### 2.3 Deploy to Netlify
1. Go to https://netlify.com/
2. Sign up / Log in with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **GitHub** and authorize Netlify
5. Select repository: `jithumeenara/Booking_Manage`
6. Configure build settings:
   - **Branch**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **"Deploy site"**

### 2.4 Get Your Site URL
- Netlify will give you a URL like: `https://YOUR-SITE-NAME.netlify.app`
- You can customize this in Site Settings → Domain Management

---

## ✅ STEP 3: Test Your Deployment

### 3.1 Test Backend API
Open your browser and visit:
```
https://acsti-booking-api.onrender.com/api/auth/me
```
You should see: `{"error":"Not authenticated"}` (this is correct!)

### 3.2 Test Frontend
1. Visit your Netlify URL
2. Try to sign up/login
3. Check if API calls work correctly

---

## 🔧 Troubleshooting

### Backend Issues
- **Database connection fails**: Check environment variables in Render
- **500 errors**: Check Render logs: Dashboard → Logs
- **Cold starts**: First request may be slow on free tier (30-60s)

### Frontend Issues
- **API calls fail**: 
  1. Check `netlify.toml` has correct backend URL
  2. Verify CORS is enabled in backend (already configured)
  3. Check Network tab in browser DevTools
- **Build fails**: Check build logs in Netlify

### Database Issues
- **Connection timeout**: Check AWS RDS security group allows Render's IP ranges
- **Access denied**: Verify database credentials in environment variables

---

## 🔒 Security Checklist

- [x] `.env` file is in `.gitignore` ✅
- [ ] Update JWT_SECRET to a strong random string (min 32 characters)
- [ ] Consider using environment-specific secrets
- [ ] Enable AWS RDS backup and encryption
- [ ] Monitor database access logs

---

## 📊 Free Tier Limitations

### Render.com (Backend)
- ✅ 750 hours/month free
- ⚠️ Spins down after 15 min of inactivity (30-60s cold start)
- ✅ 512 MB RAM, 0.1 CPU
- ✅ Automatic SSL

### Netlify (Frontend)
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic SSL
- ✅ CDN included

---

## 🚀 Optional: Custom Domain

### For Backend (Render)
1. Render Dashboard → Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Add CNAME record in your DNS

### For Frontend (Netlify)
1. Netlify Dashboard → Domain Settings → Add custom domain
2. Add DNS records as instructed
3. SSL certificate auto-generated

---

## 📝 Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | `https://acsti-booking-api.onrender.com` | Express.js API |
| Frontend | `https://YOUR-SITE.netlify.app` | React App |
| Database | AWS RDS MySQL | Data Storage |
| GitHub | `https://github.com/jithumeenara/Booking_Manage.git` | Source Code |

---

## 🆘 Need Help?

Common commands:
```bash
# View backend logs on Render
# Go to Render Dashboard → Your Service → Logs

# View Netlify deploy logs
# Netlify Dashboard → Deploys → Click on latest deploy

# Test database connection locally
npm run api

# Build frontend locally to test
npm run build
npm run preview
```

---

**🎉 That's it! Your app should now be live and accessible to everyone!**
