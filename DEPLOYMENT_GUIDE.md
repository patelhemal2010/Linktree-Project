# 🚀 Vercel Deployment & Database Migration Guide

This guide provides a step-by-step roadmap to host your **Linktree** project on Vercel without losing any data.

---

## 📅 Deployment Roadmap

### Phase 1: Database Migration (PostgreSQL)
Vercel is serverless, so your local database must be moved to a hosted provider.
1. **Choose a Provider**: I recommend **Supabase** or **Neon** (or Vercel Postgres).
2. **Setup DB**: Create a new project and copy the `PostgreSQL Connection String`.
3. **Export Data**: Run this in your terminal to export your local data:
   ```bash
   pg_dump -U postgres linkhub > backup.sql
   ```
4. **Import Data**: Run this to import it into your new production database:
   ```bash
   psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f backup.sql
   ```

### Phase 2: Backend Preparation
Vercel handles Node.js apps as "Serverless Functions".
1. **Update `db.js`**: (Done ✅) I've already updated the backend to support the `DATABASE_URL` environment variable.
2. **CORS Config**: Update `backend/server.js` to allow your Vercel domain.
3. **Image Uploads**:
   - Local folders (`/uploads`) do **not** work on Vercel.
   - You must use **Vercel Blob** or **Cloudinary** to store profile images.
   - For now, existing images should be uploaded manually to a cloud provider and URLs updated in the DB.

### Phase 3: Vercel Configuration
1. **Root `vercel.json`**: Create this file to route traffic to the Frontend and Backend.
2. **Environment Variables**: Add these in Vercel Dashboard:
   - `DATABASE_URL` (From Supabase/Neon)
   - `JWT_SECRET` (A strong random string)
   - `VITE_API_BASE_URL` (For the frontend)

---

## 🛠 Step-by-Step Instructions

### 1. Preparing the Backend for Vercel
Create a file named `vercel.json` in the **root** of your project:
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/backend/server.js" },
    { "source": "/l/(.*)", "destination": "/backend/server.js" },
    { "source": "/(.*)", "destination": "/frontend/index.html" }
  ]
}
```

### 2. Pushing to GitHub
1. Initialize git if you haven't: `git init`
2. Add all files: `git add .`
3. Commit: `git commit -m "Prepare for deployment"`
4. Push to a new GitHub repository.

### 3. Deploying on Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New" -> "Project"**.
2. Import your GitHub repository.
3. **Important**: In the configuration:
   - **Framework Preset**: Vite (if it detects the frontend).
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
4. Add **Environment Variables**:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `VITE_API_URL` -> Set this to your Vercel URL (e.g., `https://your-project.vercel.app/api`)

### 4. Handling "Patel Jewellers" Data
To ensure your "Patel Jewellers" profile card is preserved:
- Ensure the `users` and `links` tables are successfully migrated in Phase 1.
- If the profile image is missing, re-upload it through the deployed admin panel once cloud storage is connected.

---

## ⚠️ Critical Notes
- **Serverless Limits**: Vercel functions have a timeout (usually 10s-60s). Ensure your database queries are fast.
- **Statelessness**: You cannot save files to `backend/uploads`. Use a library like `cloudinary` or `@vercel/blob` for image uploads.
