# ── Étape 1 : Build Angular ──────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copier les manifests d'abord pour profiter du cache Docker (layer npm install)
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
ARG BUILD_CONFIGURATION=production
# "production," first: applies its budgets/outputHashing, then layers BUILD_CONFIGURATION's
# fileReplacements on top (Angular's esbuild builder doesn't support configuration "extends").
RUN npm run build -- --configuration="production,$BUILD_CONFIGURATION"

# ── Étape 2 : Serve avec Nginx ────────────────────────────────────────────────
FROM nginx:alpine

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# curl requis par le script de notif Discord au boot (absent de nginx:alpine par défaut)
RUN apk add --no-cache curl

# Fichiers buildés → dossier public Nginx
COPY --from=build /app/dist/raidops-front/browser /usr/share/nginx/html

# Config Nginx custom (SPA fallback + proxy API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Notif Discord "is live" — tourne avant nginx via le mécanisme docker-entrypoint.d
COPY docker-entrypoint-discord-notify.sh /docker-entrypoint.d/99-discord-notify.sh
RUN chmod +x /docker-entrypoint.d/99-discord-notify.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
