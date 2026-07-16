# Cooking Assistant (Team DevSecOps)

## Try it out!

Rancher deployment (Kubernetes): https://devsecops.stud.k8s.aet.cit.tum.de

Azure deployment (Docker Compose): http://4.223.70.80/

Coverage reports: https://aet-devops26.github.io/team-devsecops/

API scheme (Swagger UI): https://devsecops.stud.k8s.aet.cit.tum.de/swagger-ui/index.html

Monitoring (Grafana): https://grafana.devsecops.stud.k8s.aet.cit.tum.de
## Local development

The full stack runs under Docker Compose with live-reload:

```bash
cp .env.example .env   # fill in any values you want to override
docker compose watch
```

This starts the web client (http://localhost:8080), Spring API (http://localhost:8081),
and the two Python GenAI services, and auto-syncs/rebuilds on source changes.

Please install pre-commit using `pipx install pre-commit` and set up the pre-commit hooks using `pre-commit install`.
