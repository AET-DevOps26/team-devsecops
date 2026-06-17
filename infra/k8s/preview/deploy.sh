#!/usr/bin/env bash
# Deploy (or update) a per-PR frontend preview into the team's existing namespace.
# Usage: deploy.sh <pr-number>
# Env:   WEB_CLIENT_IMAGE  (required) — web-client image ref to deploy
#        PREVIEW_DOMAIN    (default devsecops.stud.k8s.aet.cit.tum.de)
#        PREVIEW_NAMESPACE (default app)
set -euo pipefail

PR="${1:?pr number required}"
export PR
NS="${PREVIEW_NAMESPACE:-app}"
HOST="pr-${PR}.${PREVIEW_DOMAIN:-devsecops.stud.k8s.aet.cit.tum.de}"
export WEB_CLIENT_IMAGE="${WEB_CLIENT_IMAGE:?}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# web-client Deployment + Service, named/labelled per PR.
envsubst '${PR} ${WEB_CLIENT_IMAGE}' < "$DIR/manifests.yaml" | kubectl apply -n "$NS" -f -

# Per-PR ingress (inline to substitute the host). Its own TLS secret avoids
# collisions with production and other previews in this shared namespace.
kubectl apply -n "$NS" -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: preview-pr-${PR}
  labels:
    preview-pr: "${PR}"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
    - hosts: ["$HOST"]
      secretName: preview-pr-${PR}-tls
  rules:
    - host: "$HOST"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-client-pr-${PR}
                port:
                  number: 8080
EOF

# Stable per-PR tag → apply is a no-op on updates; restart to pull the new image.
kubectl rollout restart "deployment/web-client-pr-${PR}" -n "$NS"
kubectl rollout status "deployment/web-client-pr-${PR}" -n "$NS" --timeout=180s

echo "https://${HOST}/team-devsecops/"
