# Deployment Guide: Next.js + FastAPI

This guide covers deploying the Next.js frontend to Vercel and the Python FastAPI backend to Railway.

## Prerequisites

- GitHub repository with your code
- Vercel account (free)
- Railway account (free tier available)

## Step 1: Deploy FastAPI to Railway

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add FastAPI service"
   git push origin main
   ```

2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure the FastAPI service**
   - Railway will detect the Dockerfile in the `python/` directory
   - Set the root directory to `python/`
   - Railway will automatically build and deploy

4. **Get your Railway URL**
   - Once deployed, Railway will provide a URL like:
   - `https://your-app-name.up.railway.app`
   - Copy this URL for the next step

## Step 2: Deploy Next.js to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project" → "Import from GitHub"
   - Select your repository

2. **Configure environment variables**
   - Add your existing environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     - `DATABASE_URL`
     - `RESEND_API_KEY` (if using email)
     - `RESEND_EMAIL_FROM` (if using email)
   
   - **Add the Railway URL:**
     - `NEXT_PUBLIC_API_URL` = `https://your-app-name.up.railway.app`

3. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your Next.js app
   - You'll get a URL like: `https://your-app.vercel.app`

## Step 3: Update Local Development

Update your local `.env` file to include the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # For local development
```

When deploying to production, Vercel will use the Railway URL automatically.

## Testing the Deployment

1. **Test FastAPI backend:**
   ```bash
   curl https://your-app-name.up.railway.app/health
   ```

2. **Test Next.js frontend:**
   - Visit your Vercel URL
   - Check that the app loads correctly

3. **Test integration:**
   - Your Next.js app should now be able to call the FastAPI backend
   - Use the API endpoints defined in your Next.js code

## Continuous Deployment

Both platforms support automatic deployments:

- **Railway**: Automatically deploys when you push to GitHub
- **Vercel**: Automatically deploys when you push to GitHub

Just push your changes, and both services will update automatically.

## Troubleshooting

**Railway deployment fails:**
- Check the logs in Railway dashboard
- Ensure Dockerfile is in the `python/` directory
- Verify all dependencies are in requirements.txt

**Vercel deployment fails:**
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify the build command in vercel.json

**API calls failing:**
- Check that NEXT_PUBLIC_API_URL is set correctly in Vercel
- Verify Railway service is running
- Check CORS settings in FastAPI if needed

## Alternative: Single Platform (Railway Only)

If you prefer to deploy everything on Railway:

1. Create two services in Railway from the same repo:
   - Service 1: Root directory `/` (Next.js)
   - Service 2: Root directory `python/` (FastAPI)

2. Configure environment variables for each service

3. Use Railway's internal networking for service-to-service communication
