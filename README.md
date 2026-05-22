# Cooking Assistant (Team DevSecOps)

## Try it out!

Deployed on GitHub pages & GCP: https://aet-devops26.github.io/team-devsecops

## Local development

The full stack runs under Docker Compose with live-reload:

```bash
cp .env.example .env   # fill in any values you want to override
docker compose watch
```

This starts the web client (http://localhost:8080), Spring API (http://localhost:8081),
and the two Python GenAI services, and auto-syncs/rebuilds on source changes.
