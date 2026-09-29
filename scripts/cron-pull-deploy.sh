#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CampusLoop Automated Pull & Deploy Cron Job
# Checks origin/main for new commits every run.
# If changes are found, it pulls and runs `bun run deploy`.
# ==============================================================================

# Define full PATH and environment
export HOME="/home/btech1057424"
export PATH="/home/btech1057424/node20/bin:/home/btech1057424/.bun/bin:/home/btech1057424/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NODE_OPTIONS="--max-old-space-size=5120"
export OPEN_NEXT_DEPLOY="true"

APP_DIR="/home/btech1057424/OSS/campusloop"
cd "$APP_DIR" || exit 1

LOG_TIME() {
    date '+%Y-%m-%d %H:%M:%S'
}

echo "--------------------------------------------------------------------------------"
echo "[$(LOG_TIME)] [CRON] Starting CampusLoop automated check..."

# Prevent concurrent executions via lockfile
LOCK_FILE="/tmp/campusloop-cron-deploy.lock"
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "[$(LOG_TIME)] [CRON] Another check/deployment is already in progress (locked). Exiting."
    exit 0
fi

# Load Cloudflare credentials from .env if present
if [ -f "$APP_DIR/.env" ]; then
    if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
        CF_TOKEN=$(grep -E '^CLOUDFLARE_API_TOKEN=' "$APP_DIR/.env" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
        [ -n "$CF_TOKEN" ] && export CLOUDFLARE_API_TOKEN="$CF_TOKEN"
    fi
    if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
        CF_ACC=$(grep -E '^CLOUDFLARE_ACCOUNT_ID=' "$APP_DIR/.env" | head -n1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
        [ -n "$CF_ACC" ] && export CLOUDFLARE_ACCOUNT_ID="$CF_ACC"
    fi
fi

# Ensure git remote origin is fetched cleanly
echo "[$(LOG_TIME)] [CRON] Fetching updates from origin/main..."
if ! git fetch origin main --quiet; then
    echo "[$(LOG_TIME)] [CRON] [ERROR] Failed to fetch from origin main. Check network/git remote." >&2
    exit 1
fi

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

echo "[$(LOG_TIME)] [CRON] Current HEAD:   ${LOCAL_HASH}"
echo "[$(LOG_TIME)] [CRON] Remote main:    ${REMOTE_HASH}"

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    echo "[$(LOG_TIME)] [CRON] No new commits detected. Everything is up to date."
    echo "[$(LOG_TIME)] [CRON] Completed successfully (no deploy needed)."
    exit 0
fi

echo "[$(LOG_TIME)] [CRON] New commits detected! Starting pull & deploy sequence..."

# Pull changes cleanly
if ! git pull origin main; then
    echo "[$(LOG_TIME)] [CRON] [ERROR] git pull origin main encountered an error." >&2
    exit 1
fi

NEW_HEAD=$(git rev-parse HEAD)
echo "[$(LOG_TIME)] [CRON] Successfully pulled new changes. Updated to commit: ${NEW_HEAD}"

# If package.json or bun.lockb changed, ensure dependencies are up to date
if git diff --name-only "$LOCAL_HASH" "$NEW_HEAD" | grep -qE "package\.json|bun\.lock"; then
    echo "[$(LOG_TIME)] [CRON] Dependencies changed in commit range. Running bun install..."
    bun install
fi

echo "[$(LOG_TIME)] [CRON] Executing: bun run deploy..."
DEPLOY_START=$(date +%s)

if bun run deploy; then
    DEPLOY_END=$(date +%s)
    DURATION=$((DEPLOY_END - DEPLOY_START))
    echo "[$(LOG_TIME)] [CRON] [SUCCESS] Deployment completed successfully in ${DURATION}s!"
else
    DEPLOY_EXIT=$?
    echo "[$(LOG_TIME)] [CRON] [ERROR] Deployment failed with exit code ${DEPLOY_EXIT}." >&2
    exit "$DEPLOY_EXIT"
fi

echo "[$(LOG_TIME)] [CRON] Check & deploy sequence finished cleanly."
