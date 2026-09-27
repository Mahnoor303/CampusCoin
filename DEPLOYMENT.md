# CampusCoin — Live Deployment (GitHub + alwaysdata)

Poora app **ek hi alwaysdata site** par chalta hai: Express backend (port-based Node.js site) built React frontend bhi khud serve karta hai (`backend/backend/src/app.js` mein SPA fallback added hai). Is liye CORS ki zaroorat nahi aur sirf **campuscoin.alwaysdata.net** address kaafi hai.

```
Browser ──> campuscoin.alwaysdata.net
              │
              ▼
      alwaysdata Node.js site (campuscoin-api)
      node /home/campuscoin/CampusCoin/backend/backend/src/server.js
              │
              ├── /api/*        → Express REST API
              └── /* (baqi sab) → dist/index.html (React app)
              │
              ▼
      alwaysdata MongoDB service (port 8300–8499 range)
```

> **Note:** Aapki site filhal **PHP** type par set hai (screenshot ke mutabiq). Type ko **Node.js** par switch karna zaroori hai — PHP se Node nahi chalta. Frontend static files alag se PHP site par rakhne ki bhi zaroorat nahi kyunki Express sab serve karega.

---

## Step 1 — GitHub par push (bina deploy ke bhi ho jata hai)

Repo local init ho chuka hai (`origin = https://github.com/Mahnoor303/CampusCoin.git`, branch `main`). Sirf push karna hai:

```bash
git push -u origin main
```

> Push ke waqt GitHub **username + Personal Access Token** mangega (password nahi chalta). Token: GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained** → repo `CampusCoin` → **Contents: Read and write** permission.

`dist/` built frontend committed hai, is liye alwaysdata par `npm run build` ki zaroorat **nahi** — sirf backend ka `npm install` hoga.

Agar baad mein frontend changes karein:

```bash
npm run build        # dist/ regenerate
git add dist && git commit -m "rebuild frontend" && git push
```

---

## Step 2 — alwaysdata: MongoDB service banayein (database)

alwaysdata ne standalone MongoDB hosting band kar di thi, lekin **SSH + custom service** wala route ab bhi officially supported hai (help.alwaysdata.com → Development → MongoDB guide).

1. **SSH se connect karein** (alwaysdata panel: Remote access → SSH; password/account password hi hota hai):
   ```bash
   ssh campuscoin@ssh-campuscoin.alwaysdata.net
   ```
2. MongoDB download karein:
   ```bash
   mkdir -p ~/mongodb && cd ~/mongodb
   wget -O- https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian12-8.0.1.tgz | tar -xz --strip-components=1
   mkdir -p data log
   ```
3. **Web panel → Advanced → Services → Add a service:**
   - **Command:** `./bin/mongod --dbpath ./data/ --logpath ./log/mongo.log --ipv6 --bind_ip 127.0.0.1 --port=8400`
   - **Working directory:** `/home/campuscoin/mongodb`
   - Auto-restart: on
   
   *(Public cloud par default 27017 allowed nahi — **8300–8499** range ka koi port lein. Humne `--bind_ip 127.0.0.1` rakha hai taake DB sirf usi server se reachable ho — public expose karne ki zaroorat nahi kyunki Node app usi machine par chalega.)*
4. Service start karein. Connection string ab hoga:
   ```
   mongodb://127.0.0.1:8400/campuscoin
   ```

---

## Step 3 — alwaysdata: Node.js site (backend + frontend dono)

**Web panel → Web → Sites → campuscoin.alwaysdata.net → Edit:**

| Field | Value |
|---|---|
| **Type** | `Node.js` (PHP se change karein) |
| **Address** | `campuscoin.alwaysdata.net` |
| **Working directory** | `/home/campuscoin/CampusCoin/backend/backend` |
| **Command** | `node src/server.js` |

Command ko environment ke sath likhein (Environment variables field mein ya inline):

```
PORT=__PORT__  NODE_ENV=production
```

> **PORT**: alwaysdata site config mein jo internal port command ke sath dikhaya jata hai (e.g. `node --port 8100 ...` pattern) — site save karte waqt panel khud `PORT` env inject kar deta hai; app.js/server.js already `process.env.PORT` par listen karta hai. Apni site config mein jo port mention ho wahi use hota hai.

### Environment variables (site config ke **Environment** field mein):

```
NODE_ENV=production
MONGO_URI=mongodb://127.0.0.1:8400/campuscoin
JWT_SECRET=<koi-lamba-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://campuscoin.alwaysdata.net
```

- `JWT_SECRET`: `openssl rand -hex 32` se SSH par bana lein.
- `CLIENT_URL` CORS ke liye hai (same-origin hone ki wajah se practically zaroorat nahi, par rakhein to behtar).

---

## Step 4 — Code server par le aayein + install + start

SSH par:

```bash
cd ~/CampusCoin                       # agar pehli baar hai: git clone https://github.com/Mahnoor303/CampusCoin.git
git pull
cd backend/backend
npm install --omit=dev
```

Phir panel → Sites → **campuscoin-api → Start/Restart**.

Verify:

```bash
curl https://campuscoin.alwaysdata.net/api/health
# {"success":true,"message":"CampusCoin API is operational",...}

curl -s https://campuscoin.alwaysdata.net/ | head -3
# <!doctype html> ... <div id="root">  ← React app load ho gaya
```

Browser mein `https://campuscoin.alwaysdata.net` kholein — landing page aayega, Sign up karke dashboard tak sab live backend ke sath chalega.

---

## Step 5 — Frontend API URL (already wired)

`src/lib/api.ts` mein:

```ts
const API_BASE = env.VITE_API_URL || (isDev ? "http://127.0.0.1:5000/api" : "/api");
```

Production build mein default `"/api"` use hota hai = same origin = **koi VITE_API_URL set karne ki zaroorat nahi**. (Dev mein Vite proxy `/api` → `127.0.0.1:5000` karta hai.)

---

## Troubleshooting

| Masla | Hal |
|---|---|
| Site "502 Bad Gateway" | Logs dekhein: Web panel → Logs → **Error logs**. Aam wajah: `MONGO_URI` galat ya MongoDB service stopped. |
| MongoDB connect nahi hota | Service running hai? Port 8400 hi use ho raha hai dono jagah? `mongosh "127.0.0.1:8400"` se SSH par test karein. |
| "Cannot find module" error | `npm install --omit=dev` backend/backend folder mein chalayein. |
| Frontend purana load ho raha | `git pull && cd backend/backend && npm install` phir site **Restart** karein (dist Express process se serve hota hai). |
| Node version | Panel → Environment → Node.js: 20+ rakhein. |

## Updates ka routine (agla deployment)

```bash
git add . && git commit -m "..." && git push      # local se
# phir SSH par:
cd ~/CampusCoin && git pull && cd backend/backend && npm install --omit=dev
# panel → site restart
```
