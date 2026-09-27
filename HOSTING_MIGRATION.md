# CampusCoin — Free Hosting (sirf Vercel: frontend + backend, MongoDB Atlas)

> Render ab free plan pe bhi **credit card** maangta hai — is liye ye final guide
> **sirf Vercel** use karti hai (card nahi chahiye). Backend Express **serverless
> function** ban ke Vercel pe hi chalega (`backend/backend/src/api/index.js` ready hai).
>
> **Aapka setup:**
> - Atlas username: `mughalmahnoor247_db_user`
> - **MONGO_URI (Notepad mein save karo):**
>   ```
>   mongodb+srv://mughalmahnoor247_db_user:8sVbkilLRHZC3TmU@campuscoin.jnqudfi.mongodb.net/campuscoin?appName=campuscoin
>   ```
>   *( URI mein `/campuscoin` database ka naam add kiya gaya hai — ye zaroori hai )*
>
> ⚠️ **Security note:** Ye password chat mein share ho chuka hai — Step 5 mein
> Atlas se change karwa dunga.

**Final architecture:**
```
Browser ──> https://campuscoin.vercel.app          (frontend — Vite build)
                │  /api/* requests
                ▼
        https://campuscoin-api.vercel.app          (backend — Express serverless)
                │
                ▼
        MongoDB Atlas (campuscoin.jnqudfi.mongodb.net)
```

---

## Step 1 — Database ready hai ✅

Aapne Atlas cluster bana liya hai (`campuscoin.jnqudfi.mongodb.net`). Sirf 2 cheezein
confirm karein (https://cloud.mongodb.com):

1. **Network Access** (left menu) → **ADD IP ADDRESS** → **Allow Access From Anywhere**
   (`0.0.0.0/0`) → Confirm. *(Vercel ke serverless functions ki IPs har request pe
   badalti hain — open rakhna zaroori hai.)*
2. **Database Access** → user `mughalmahnoor247_db_user` ka role
   **"Read and write to any database"** hai? Agar nahi, Edit karke set karein.

---

## Step 2 — Code GitHub pe push karein

Naye files (`backend/backend/src/api/index.js`, `backend/backend/vercel.json`,
`vercel.json`, ye guide) GitHub pe hona zaroori hai. Main push kar sakta hoon —
bas bol dein. Khud karna ho to:

```bash
git add backend/backend/src/api/index.js backend/backend/vercel.json vercel.json HOSTING_MIGRATION.md
git commit -m "Add Vercel serverless backend + deploy config"
git push
```

---

## Step 3 — Backend deploy (Vercel, project #1) — 5 min

1. https://vercel.com → **Continue with GitHub** se login
2. **Add New → Project** → repo **CampusCoin** → **Import**
3. Import se pehle wali screen pe **important settings**:
   - **Project Name:** `campuscoin-api`
   - **Root Directory:** `backend/backend` (Configure → select karein)
   - **Framework Preset:** **Other**
4. **Environment Variables** section — ye 4 add karein:
   | Name | Value |
   |---|---|
   | `MONGO_URI` | `mongodb+srv://mughalmahnoor247_db_user:8sVbkilLRHZC3TmU@campuscoin.jnqudfi.mongodb.net/campuscoin?appName=campuscoin` |
   | `JWT_SECRET` | `2357647f04b03862e2d0b63636e7a344b82e0ec3fa6cdd7f` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
5. **Deploy** dabao → 2-3 min wait
6. Deploy complete hone par **URL copy karein** (e.g. `https://campuscoin-api.vercel.app`) ✅
7. **Test:** browser mein kholo:
   `https://campuscoin-api.vercel.app/api/health`
   → `{"success":true,"message":"CampusCoin API is operational",...}` dikhna chahiye 🎉

---

## Step 4 — Frontend deploy (Vercel, project #2) — 5 min

1. Vercel dashboard → **Add New → Project** → **wahi repo CampusCoin** → **Import**
2. Is baar settings:
   - **Project Name:** `campuscoin` (ya jo chaho)
   - **Root Directory:** default rakho (kuch select na karo)
   - **Framework Preset:** **Vite** (auto-detect ho jata hai)
3. **Environment Variables** — sirf 1:
   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://campuscoin-api.vercel.app/api` ← *(Step 3 wala URL + `/api`)* |
4. **Deploy** dabao → 2 min
5. URL milega e.g. `https://campuscoin.vercel.app` — **Notepad mein save karo** ✅

---

## Step 5 — CORS + password fix (aakhri step)

1. **Vercel dashboard** → project **campuscoin-api** → **Settings → Environment Variables**
2. `CLIENT_URL` naam ka **naya variable add karein**:
   - Value: `https://campuscoin.vercel.app` ← *(Step 4 wala URL, end mein `/` nahi)*
3. **Save** → phir **Deployments** tab → latest deploy ke right **⋯ → Redeploy**
4. **Atlas password change (recommended):** https://cloud.mongodb.com → Database Access →
   user `mughalmahnoor247_db_user` → **Edit** → **Edit Password** → naya strong password →
   Update. Phir Vercel → campuscoin-api → Settings → Environment Variables → `MONGO_URI`
   mein purane password ki jagah naya daal ke **Redeploy**.

---

## Bas! Ab check karo 🎉

`https://campuscoin.vercel.app` browser mein kholo → **Sign Up** → dashboard — sab
Vercel + Atlas pe live. F12 → Network tab: API requests `campuscoin-api.vercel.app`
pe jani chahiye.

**Purana AlwaysData** ab band kar sakte ho (Web → Sites → delete).

---

## Local dev pe koi farq nahi

- `npm run dev` → Vite proxy `/api` → localhost:5000 (jaise pehle)
- `cd backend/backend && npm start` → local Express server (jaise pehle)

---

## Free tier limits

| Service | Limit |
|---|---|
| Vercel (frontend) | Unlimited static, 100 GB bandwidth |
| Vercel (backend serverless) | 100 GB bandwidth, 10s timeout (free "Hobby") |
| Atlas M0 | 512 MB storage |

Serverless thanda hone par pehli request ~1-2 sec slow ho sakti hai — normal hai.

---

## Troubleshooting

| Masla | Hal |
|---|---|
| `/api/health` pe 404 | Root Directory `backend/backend` select hua? Redeploy karo |
| `/api/health` pe 500 | Vercel → campuscoin-api → **Logs** tab → error dekhein (aksar MONGO_URI galat) |
| Atlas connection timeout | Network Access mein `0.0.0.0/0` add hai? |
| CORS error (F12 console) | `CLIENT_URL` Step 5 wale hisaab se set? Redeploy hua? |
| "Couldn't reach the server" | `VITE_API_URL` step 4 table ke mutabiq? Redeploy hua? |
| Sign up pe 500 | Atlas → Database Access → user role "Read and write" hai? |
