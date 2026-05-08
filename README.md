# Cooking Assistant (Team DevSecOps)

## Deployment

> **Live app:** https://aet-devops26.github.io/team-devsecops

See the [project wiki](https://github.com/AET-DevOps26/team-devsecops/wiki) for the [problem statement](https://github.com/AET-DevOps26/team-devsecops/wiki/Problem-Statement) and [initial system structure](https://github.com/AET-DevOps26/team-devsecops/wiki/Initial-System-Structure).

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
