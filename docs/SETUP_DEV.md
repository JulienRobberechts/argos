# Setup — Développement local

## Prérequis

- Node.js >= 20
- Docker & Docker Compose
- Clés API : [Anthropic](https://console.anthropic.com) et [Voyage AI](https://www.voyageai.com)

## Variables d'environnement

```bash
cp .env.example .env
```

Renseigner dans `.env` :

| Variable | Description |
|---|---|
| `ANTHROPIC_APP_API_KEY` | Clé API Anthropic (génération de réponses) |
| `VOYAGE_API_KEY` | Clé API Voyage AI (embeddings) |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL (libre choix en dev) |
| `APP_PASSWORD` | Mot de passe de l'écran de login |

Les autres variables ont des valeurs par défaut adaptées au développement.

---

## Option A — DB Docker + services locaux

**Base de données**

```bash
docker compose up -d postgres
```

**Backend**

```bash
cd backend
npm install
npm run migrate   # crée les tables et l'extension pgvector
npm run dev       # écoute sur http://localhost:3001
```

**Frontend**

```bash
cd frontend
npm install
npm run dev       # écoute sur http://localhost:5173
```

## Option B — Docker Compose complet

Utilise `Dockerfile.dev` (Vite dev server + tsx watch, hot-reload actif) — **à ne pas confondre avec `Dockerfile` qui sert au déploiement Railway**.

Depuis le répertoire devknowledge:

```bash
docker compose up --build
```

API disponible sur `http://localhost:3205`, frontend sur `http://localhost:5173`.

**Migrations**

Le host `postgres` dans `DATABASE_URL` n'est résolvable qu'à l'intérieur du réseau Docker. Lancer les migrations depuis le conteneur `api` :

```bash
docker compose exec api npm run migrate
```

**Vérification**

```bash
curl -H "x-api-key: <APP_PASSWORD>" http://localhost:3205/api/documents
# doit retourner []
```

**Logs**

```bash
docker compose logs -f api
```

## Tests

```bash
cd backend
npm test
```
