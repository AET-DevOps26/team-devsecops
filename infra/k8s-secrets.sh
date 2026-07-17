#!/usr/bin/env bash
# Create (or update) the K8s secrets the manifests in infra/k8s/ expect.
# Usage: k8s-secrets.sh [env-file]
#
# Values come from the env file if present (local setup), otherwise from the
# ambient environment (CI passes them via the step's `env:` block).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-$DIR/k8s-secrets.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
elif [[ -n "${1:-}" ]]; then
  echo "No env file at $ENV_FILE" >&2
  exit 1
fi

missing=()
for var in DB_PASSWORD JWT_SECRET INTERNAL_AUTH_SECRET GRAFANA_ADMIN_PASSWORD \
           GEMINI_RECIPE_SERVICE_KEY GEMINI_HELP_SERVICE_KEY LOGOS_KEY \
           PROVIDER GEMINI_MODEL LOGOS_MODEL LOGOS_BASE_URL; do
  [[ -n "${!var:-}" ]] || missing+=("$var")
done
if (( ${#missing[@]} )); then
  if [[ -f "$ENV_FILE" ]]; then
    printf 'Missing in %s:\n' "$ENV_FILE" >&2
  else
    printf 'No env file at %s, and these are unset in the environment:\n' "$ENV_FILE" >&2
  fi
  printf '  %s\n' "${missing[@]}" >&2
  exit 1
fi

# --dry-run=client | apply is idempotent: creates on first run, updates on later ones.
upsert() { kubectl create secret generic "$@" --dry-run=client -o yaml | kubectl apply -f -; }

upsert postgres-secret -n app \
  --from-literal=password="$DB_PASSWORD"

upsert spring-api-secret -n app \
  --from-literal=DB_PASSWORD="$DB_PASSWORD" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=INTERNAL_AUTH_SECRET="$INTERNAL_AUTH_SECRET"

upsert py-recipe-secret -n app \
  --from-literal=PROVIDER="$PROVIDER" \
  --from-literal=LOGOS_MODEL="$LOGOS_MODEL" \
  --from-literal=LOGOS_BASE_URL="$LOGOS_BASE_URL" \
  --from-literal=LOGOS_KEY="$LOGOS_KEY" \
  --from-literal=GEMINI_MODEL="$GEMINI_MODEL" \
  --from-literal=GEMINI_RECIPE_SERVICE_KEY="$GEMINI_RECIPE_SERVICE_KEY" \
  --from-literal=INTERNAL_AUTH_SECRET="$INTERNAL_AUTH_SECRET"

upsert py-help-secret -n app \
  --from-literal=PROVIDER="$PROVIDER" \
  --from-literal=LOGOS_MODEL="$LOGOS_MODEL" \
  --from-literal=LOGOS_BASE_URL="$LOGOS_BASE_URL" \
  --from-literal=LOGOS_KEY="$LOGOS_KEY" \
  --from-literal=GEMINI_MODEL="$GEMINI_MODEL" \
  --from-literal=GEMINI_HELP_SERVICE_KEY="$GEMINI_HELP_SERVICE_KEY" \
  --from-literal=INTERNAL_AUTH_SECRET="$INTERNAL_AUTH_SECRET"

upsert grafana-secret -n monitoring \
  --from-literal=admin-password="$GRAFANA_ADMIN_PASSWORD"

if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
  upsert grafana-discord-secret -n monitoring \
    --from-literal=webhook-url="$DISCORD_WEBHOOK_URL"
fi
