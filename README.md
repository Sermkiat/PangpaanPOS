# PangpaanPOS

Full-stack POS built for Raspberry Pi 5. Stack: Next.js 14 (App Router, TS, Tailwind, shadcn), Zustand for client state, Express + Drizzle + Postgres, Docker compose + Cloudflared tunnel + Watchtower.

## Structure
- `src/` Next.js app (App Router) with features: POS, Orders, Inventory, Recipes, Costing, Expenses, Waste, Allocation, Dashboard, Settings
- `api/` Express TypeScript API with Drizzle schema/migrations
- `public/` PWA assets (manifest, service worker, icons)
- `docker-compose.yml` orchestrates db/api/web/cloudflared/watchtower

## Quick start (dev on Pi5)
```bash
cd /mnt/webapp/pangpaan-pos
npm install
cd api && npm install && cd ..
# run web dev
npm run dev
# run API dev
cd api && npm run dev
```

## Docker (recommended)
```bash
# build + start
TUNNEL_TOKEN=<cloudflare_token> docker compose up -d --build
# health
curl http://localhost:8088/health
# web
open http://localhost:8090
```

## Environment
- `DATABASE_URL=postgresql://pang:pangpass@db:5432/pangpaan_pos`
- `PORT=8000` (API)
- `NEXT_PUBLIC_API_BASE=http://api:8000`
- `TUNNEL_TOKEN=<cloudflare tunnel token>`

## Migrations (Drizzle)
```bash
cd api
npx drizzle-kit generate:pg
npx drizzle-kit migrate
```

## PWA
- `public/manifest.webmanifest`
- `public/sw.js` (cache-first shell)
- iPad-friendly layout, big buttons, warm pastel theme

## Deployment
- Raspberry Pi 5 with Docker + Portainer
- Cloudflare Tunnel exposes `pangpaan.com` to services
- Watchtower auto-updates images from Docker Hub (hook via GitHub Actions to build/push)
