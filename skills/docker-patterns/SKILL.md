---
name: docker-patterns
description: Docker and Docker Compose patterns for local development, container security, networking, volume strategies, and multi-service orchestration. Use when writing Dockerfiles, docker-compose configs, or troubleshooting container networking.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# Docker Patterns

Docker and Docker Compose best practices for containerized development.

## When to Activate

- Setting up Docker Compose for local development
- Designing multi-container architectures
- Troubleshooting container networking or volume issues
- Reviewing Dockerfiles for security and size
- Migrating from local dev to containerized workflow

## Best Practices Summary

| Practice | Description |
|----------|-------------|
| Specific tags | `node:22-alpine`, never `:latest` |
| Multi-stage builds | Separate deps/build/production stages |
| Non-root user | Always create and use a non-root user |
| Layer caching | Copy dependency files first |
| HEALTHCHECK | Add health check instruction |
| .dockerignore | Exclude node_modules, .git, tests |
| Resource limits | Set CPU/memory in compose or k8s |
| Secrets | Use env_file or Docker secrets, never hardcode |

## Key Patterns

- **Dev vs Prod stages**: Use `target: dev` in compose for hot reload, `target: production` for minimal image
- **Override files**: `docker-compose.override.yml` auto-loaded for dev, explicit `-f` for production
- **Custom networks**: Isolate frontend from database (db only reachable from api)
- **Anonymous volumes**: `/app/node_modules` preserves container deps from bind mount override
- **Health checks**: `service_healthy` condition in depends_on

## Anti-Patterns

- Running as root
- Using `:latest` tag
- Storing data without volumes
- One giant container with all services
- Putting secrets in docker-compose.yml or image layers

For detailed configs and examples, see references/patterns.md
