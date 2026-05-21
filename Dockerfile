# ── Étape 1 : Build Angular ──────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copier les manifests d'abord pour profiter du cache Docker (layer npm install)
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Étape 2 : Serve avec Nginx ────────────────────────────────────────────────
FROM nginx:alpine

# Fichiers buildés → dossier public Nginx
COPY --from=build /app/dist/raidops-front/browser /usr/share/nginx/html

# Config Nginx custom (SPA fallback + proxy API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
