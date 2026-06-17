#!/usr/bin/env bash
# Deploy (or update) a per-PR frontend preview into the existing namespace.
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

# Route command output to stderr so stdout carries only the final URL line
exec 3>&1 1>&2

# web-client Deployment + Service, named/labelled per PR
envsubst '${PR} ${WEB_CLIENT_IMAGE}' < "$DIR/manifests.yaml" | kubectl apply -n "$NS" -f -

# setup TLS and expose the deployment using an Ingress
# (this is done inline to easily substitute $HOST)
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

# restart to pull the image with the latest changes from the PR
kubectl rollout restart "deployment/web-client-pr-${PR}" -n "$NS"
kubectl rollout status "deployment/web-client-pr-${PR}" -n "$NS" --timeout=180s

echo "https://${HOST}/team-devsecops/" >&3
