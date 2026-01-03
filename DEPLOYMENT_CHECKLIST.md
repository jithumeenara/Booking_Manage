# ✅ Deployment Checklist

## ✅ Step 1: GitHub Repository (COMPLETED)
- [x] Code pushed to: https://github.com/jithumeenara/Booking_Manage.git
- [x] `.env` excluded from repository (protected credentials)
- [x] `.env.example` created for reference

---

## 📋 Step 2: Deploy Backend API (DO THIS FIRST)

### Option A: Render.com (RECOMMENDED - FREE)
1. Go to: https://render.com/
2. Sign up with GitHub
3. Create New Web Service
4. Select repository: `jithumeenara/Booking_Manage`
5. Configure:
   - **Name**: `acsti-booking-api`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run api`
6. Add environment variables from `.env` file
7. Deploy!
8. **SAVE YOUR BACKEND URL**: `https://acsti-booking-api.onrender.com`

### Need Help?
- See full guide in: `DEPLOYMENT.md`
- Video tutorial: https://www.youtube.com/watch?v=bnCOyGaSe84

---

## 📋 Step 3: Update Frontend Config

### Before deploying frontend, update:
1. Open `netlify.toml`
2. Replace line 6:
   ```toml
   from = "/api/*"
   to = "https://YOUR-RENDER-URL.onrender.com/api/:splat"
   ```
3. Save and commit:
   ```bash
   git add netlify.toml
   git commit -m "Update API endpoint"
   git push
   ```

---

## 📋 Step 4: Deploy Frontend to Netlify

1. Go to: https://app.netlify.com/
2. Sign up with GitHub
3. Click: **Add new site** → **Import an existing project**
4. Choose **GitHub**
5. Select: `jithumeenara/Booking_Manage`
6. Build settings (should auto-detect):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **Deploy site**
8. Wait 2-3 minutes
9. Get your URL: `https://YOUR-SITE.netlify.app`

---

## ✅ Step 5: Test Your Deployment

### Test Backend
Visit: `https://your-backend-url.onrender.com/api/auth/me`
- Should see: `{"error":"Not authenticated"}` ✅

### Test Frontend
1. Visit your Netlify URL
2. Try to login with:
   - Email: jithulr44@gmail.com
   - Password: 123456
3. Should successfully login ✅

---

## 🚨 Important Notes

### Backend Cold Starts (Render Free Tier)
- First request after 15 min may take 30-60 seconds
- This is normal for free tier
- Upgrade to paid plan ($7/mo) to eliminate cold starts

### Database Security
- Your AWS RDS must allow connections from Render's IP ranges
- Go to AWS RDS → Security Groups → Inbound Rules
- Add rule: MySQL/Aurora (3306) from `0.0.0.0/0` (or Render's IP ranges)

### Environment Variables
- Never commit `.env` to GitHub ✅
- Always set them in Render dashboard for backend
- No env vars needed for frontend (uses API proxy)

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check Render environment variables
- Verify AWS RDS security group allows external connections
- Test database connection from Render logs

### "API calls failed" in frontend
- Verify `netlify.toml` has correct backend URL
- Check browser Network tab for actual error
- Verify backend is running (visit backend URL)

### Build failures
- Check Netlify build logs
- Ensure `package.json` has all dependencies
- Try building locally: `npm run build`

---

## 📞 Quick Links

- **Frontend**: Update after deployment
- **Backend**: Update after deployment
- **GitHub**: https://github.com/jithumeenara/Booking_Manage.git
- **Full Guide**: See `DEPLOYMENT.md`

---

## 🎯 Next Steps After Deployment

1. [ ] Custom domain setup (optional)
2. [ ] SSL certificate (auto-provided by Netlify & Render)
3. [ ] Set up monitoring/alerts
4. [ ] Configure database backups
5. [ ] Add more admin users

---

**Good luck with your deployment! 🚀**
