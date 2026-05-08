# team-devsecops

Repository for team DevSecOps.

## Deployment

> **Live app:** https://aet-devops26.github.io/team-devsecops

## Local setup

```bash
# Web client
cd web-client && npm install && npm run dev

# Spring API
cd services/spring-api && ./gradlew bootRun

# Python services
cd services/py-help-service && pip install -r requirements.txt && python main.py
cd services/py-recipe-service && pip install -r requirements.txt && python main.py
```
