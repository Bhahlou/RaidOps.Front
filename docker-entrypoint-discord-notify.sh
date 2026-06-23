#!/bin/sh
# Posts a "now live" message to Discord on container boot. Mirrors RaidOps.Service's
# IDiscordDeployNotifier — same intent (announce per-env deploys), different mechanism
# since this image is just nginx serving static files, no app process to hook into.
# Silently does nothing if DISCORD_DEPLOY_WEBHOOK_URL isn't set (e.g. local/dev runs).
set -eu

if [ -z "${DISCORD_DEPLOY_WEBHOOK_URL:-}" ]; then
  exit 0
fi

VERSION="${APP_VERSION:-dev}"
ENV_LABEL="${ENV_NAME:-unknown}"

curl -s -X POST "$DISCORD_DEPLOY_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"embeds\":[{\"title\":\"✅ RaidOps Frontend ${ENV_LABEL} ${VERSION} is live\",\"color\":5763719}]}" \
  || true

exit 0
