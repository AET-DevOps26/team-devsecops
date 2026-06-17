#!/usr/bin/env bash
# Deploy (or update) a per-PR frontend preview environment.
# Usage: deploy.sh <pr-number>
# Env:   WEB_CLIENT_IMAGE (required) — web-client image ref to deploy
#        PREVIEW_DOMAIN   (default devsecops.stud.k8s.aet.cit.tum.de)
set -euo pipefail

PR="${1:?pr number required}"
NS="preview-pr-${PR}"
HOST="pr-${PR}.${PREVIEW_DOMAIN:-devsecops.stud.k8s.aet.cit.tum.de}"
export WEB_CLIENT_IMAGE="${WEB_CLIENT_IMAGE:?}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# create a new namespace
kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "$NS" \
  app.kubernetes.io/part-of=pr-preview \
  preview-pr="$PR" --overwrite

# deploy the manifests.yaml to our created namespace
envsubst '${WEB_CLIENT_IMAGE}' < "$DIR/manifests.yaml" | kubectl apply -n "$NS" -f -

# setup TLS and expose the deployment using an Ingress
# (this is done inline to easily substitute $HOST)
kubectl apply -n "$NS" -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: preview
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
    - hosts: ["$HOST"]
      secretName: preview-tls-cert
  rules:
    - host: "$HOST"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-client
                port:
                  number: 8080
EOF

# restart to pull the image with the latest changes from the PR
kubectl rollout restart deployment/web-client -n "$NS"
# wait up to 180s for the pods to be up (otherwise fail)
kubectl rollout status deployment/web-client -n "$NS" --timeout=180s

echo "https://${HOST}/team-devsecops/"
