# CampusCoin — Live Deployment (Vercel + MongoDB Atlas)

Poora app ab **Vercel (free, no credit card)** pe live hai. AlwaysData deployment
retire ho chuka hai.

```
Browser ──> https://<frontend>.vercel.app        (React/Vite frontend — Vercel static)
                │  /api/* requests (VITE_API_URL)
                ▼
        https://<backend>.vercel.app             (Express — Vercel serverless function)
                │
                ▼
        MongoDB Atlas  (campuscoin.jnqudfi.mongodb.net)
```

- **Backend project:** Root Directory `backend/backend`, serverless entry
  `backend/backend/api/index.js` (existing Express app ko wrap karta hai).
- **Frontend project:** Root Directory repo root, Vite build, env var
  `VITE_API_URL = https://<backend>.vercel.app/api`.
- **Backend env vars:** `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`,
  `CLIENT_URL=https://<frontend>.vercel.app` (CORS ke liye).

> Step-by-step click-by-click guide: **[HOSTING_MIGRATION.md](./HOSTING_MIGRATION.md)**

## Update deploy karne ka routine

```bash
git add . && git commit -m "..." && git push origin main
```

Bas — Vercel dono projects khud rebuild kar leta hai (auto-deploy on push).

## Quick verification

```bash
curl https://<backend>.vercel.app/api/health
# {"success":true,"message":"CampusCoin API is operational",...}
```

## Troubleshooting

| Masla | Hal |
|---|---|
| Build fail "No Output Directory named public" | backend/backend/public/ folder repo mein hona chahiye (fix pushed — repo pull karein) |
| `/api/health` 404 | Backend project ka Root Directory `backend/backend` hai? Deployments → Redeploy |
| `/api/health` 500 | Vercel → project → Logs → aksar `MONGO_URI` galat |
| Login fail "Invalid credentials" | Naya Atlas DB khaali hai — pehle Sign Up karo; purana data AlwaysData se migrate karna ho to HOSTING_MIGRATION.md dekhein |
| CORS error (browser console) | Backend `CLIENT_URL` = frontend URL (bina trailing slash)? Redeploy kiya? |
