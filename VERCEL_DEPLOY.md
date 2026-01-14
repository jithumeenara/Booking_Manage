# Deploying to Vercel

This guide explains how to deploy your ACSTI Booking application to Vercel.

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **Cloud Database**: Since Vercel is serverless, you cannot use a local MySQL database. You need a hosted MySQL database.
    *   **Recommended**: [PlanetScale](https://planetscale.com/), [Aiven](https://aiven.io/mysql), or [Railway](https://railway.app/).
    *   **Alternative**: Use [Supabase](https://supabase.com/) (PostgreSQL) - requires code changes. For this app (MySQL), Aiven or PlanetScale is best.

## Step-by-Step Deployment Guide

### 1. Prepare Your Database
1.  Create a MySQL database on a cloud provider (e.g., Aiven, PlanetScale).
2.  Get the connection details:
    *   Host (e.g., `mysql-service.aivencloud.com`)
    *   Port (e.g., `12345`)
    *   User
    *   Password
    *   Database Name

### 2. Push to GitHub
Ensure your latest code is pushed to GitHub.
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 3. Deploy on Vercel
1.  Go to your **Vercel Dashboard**.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `Booking` repository from GitHub.
4.  **Configure Project**:
    *   **Framework Preset**: Select `Vite`.
    *   **Root Directory**: `.` (default).
    *   **Build Command**: `npm run build` (default).
    *   **Output Directory**: `dist` (default).
    *   **Install Command**: `npm install` (default).

5.  **Environment Variables**:
    You MUST add the following environment variables in the Vercel dashboard configuration section before clicking Deploy.

    | Variable Name | Value |
    | :--- | :--- |
    | `MYSQL_HOST` | Your Cloud Database Host |
    | `MYSQL_PORT` | Your Cloud Database Port |
    | `MYSQL_USER` | Your Cloud Database User |
    | `MYSQL_PASSWORD` | Your Cloud Database Password |
    | `MYSQL_DATABASE` | Your Cloud Database Name |
    | `JWT_SECRET` | A secure random string |
    | `FRONTEND_URL` | `https://your-project-name.vercel.app` (You can add this later if needed) |
    | `NODE_ENV` | `production` |

6.  Click **Deploy**.

## Important Notes

*   **Database Migrations**: The app is set up to auto-migrate on start. On Vercel, this happens on the first request to the API. It might cause the first request to be slightly slower.
*   **Cold Starts**: Vercel functions go to sleep after inactivity. The first request after a while might take a few seconds to connect to the database.
*   **Cron Jobs**: This app relies on `setInterval` in `server/index.js` for some background tasks (email polling etc.). **These will NOT work reliably on Vercel** because serverless functions are ephemeral.
    *   *Solution*: Use **Vercel Cron Jobs** or an external cron service to hit specific API endpoints to trigger these tasks.
