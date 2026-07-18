# Deployment Guide — Vercel + Render + MongoDB Atlas

This deploys the EMS as three free-tier services:

| Piece | Host | Cost |
|-------|------|------|
| Database | MongoDB Atlas | Free (M0) |
| Backend API | Render (web service) | Free |
| Frontend | Vercel | Free (Hobby) |

> **Auth works cross-domain.** The frontend sends the JWT both as an httpOnly cookie
> *and* as an `Authorization: Bearer` header (stored in localStorage). Even when a
> browser blocks third-party cookies across `vercel.app` ↔ `onrender.com`, the Bearer
> header keeps login working. The backend's CORS also auto-allows any `*.vercel.app` origin.

---

## 0. Push the code to GitHub

From the project root:
```bash
git init
git add .
git commit -m "Employee Management System"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
(If you asked me to set up git, the first three lines are already done — just add the remote and push.)

---

## 1. MongoDB Atlas (database)

1. Create an account → **Build a Database** → **M0 Free**.
2. **Database Access** → Add a user (username + password). Save these.
3. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere — needed for Render).
4. **Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/ems?retryWrites=true&w=majority
   ```
   Replace `<user>`/`<password>` and add the DB name `ems` before the `?` as shown.

Keep this string for step 2.

---

## 2. Render (backend API)

1. **New + → Blueprint**, connect your GitHub repo. Render reads [`render.yaml`](../render.yaml)
   and creates the **ems-backend** web service automatically.
2. When prompted, fill the `sync:false` env vars:
   - **`MONGO_URI`** → the Atlas string from step 1.
   - **`CLIENT_URL`** → leave blank for now (you'll set it after Vercel), or put a
     placeholder. CORS already allows `*.vercel.app`, so the app works either way.
   - `JWT_SECRET` is auto-generated; `SEED_ON_START=true` seeds demo data on first boot.
3. Click **Apply / Deploy**. Wait for build → live. Note the URL, e.g.
   `https://ems-backend.onrender.com`.
4. Verify: open `https://ems-backend.onrender.com/api/health` → `{"success":true,...}`.

> First boot auto-seeds the Super Admin + demo employees (because `SEED_ON_START=true`
> and the DB is empty). It **won't** wipe data on later restarts — it only seeds when empty.

> ⚠️ Render free instances sleep after inactivity and use an ephemeral filesystem, so
> uploaded profile images don't persist across restarts (fine for a demo). For persistent
> uploads, add a Render Disk or use S3/Cloudinary.

---

## 3. Vercel (frontend)

1. **Add New → Project**, import the same GitHub repo.
2. **Root Directory → `frontend`** (important — it's a monorepo).
3. Framework preset: **Next.js** (auto-detected).
4. **Environment Variables**:
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://ems-backend.onrender.com/api` |
   | `NEXT_PUBLIC_UPLOADS_URL` | `https://ems-backend.onrender.com` |
5. **Deploy**. Note the URL, e.g. `https://ems-yourname.vercel.app`.

> `NEXT_PUBLIC_*` vars are baked in at build time. If you change them later, redeploy.

---

## 4. Link them (finish CORS/cookies)

1. Back in **Render → ems-backend → Environment**, set
   **`CLIENT_URL`** = your Vercel URL (`https://ems-yourname.vercel.app`).
   Save — Render restarts automatically.
2. Done. Open the Vercel URL and log in:
   - **Super Admin** — `admin@ems.com` / `Admin@123`
   - **HR** — `hr@ems.com` / `Admin@123`
   - **Employee** — `employee1@ems.com` / `Admin@123`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Login "Network Error" | `NEXT_PUBLIC_API_URL` wrong or missing `/api`; redeploy Vercel after fixing. |
| CORS error in console | Set `CLIENT_URL` on Render to the exact Vercel origin (no trailing slash). |
| 401 right after login | Third-party cookie blocked — the Bearer fallback still works; hard refresh. Ensure `COOKIE_SECURE=true` on Render. |
| Backend 502 for ~30s | Render free instance was asleep; first request wakes it. |
| No data on dashboard | Confirm `SEED_ON_START=true` and `MONGO_URI` is reachable; check Render logs. |
| Build fails on Render (`tsc not found`) | Build command must be `npm install --include=dev && npm run build` (already in render.yaml). |

## Alternative: one-box Docker
Any VPS with Docker: set real values in `docker-compose.yml` (or an env file) and run
`docker compose up --build -d`. Frontend on `:3000`, backend on `:5000`, Mongo in a volume.
