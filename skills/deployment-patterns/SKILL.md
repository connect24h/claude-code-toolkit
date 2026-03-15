---
name: deployment-patterns
description: Deployment workflows, CI/CD pipeline patterns, Docker containerization, health checks, rollback strategies, and production readiness checklists for web applications. Use when setting up CI/CD, Docker deployments, health checks, or production readiness checklists.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# Deployment Patterns

Production deployment workflows and CI/CD best practices.

## When to Activate

- Setting up CI/CD pipelines
- Dockerizing an application
- Planning deployment strategy (blue-green, canary, rolling)
- Implementing health checks and readiness probes
- Preparing for a production release

## Deployment Strategies

| Strategy | Best For | Trade-off |
|----------|----------|-----------|
| Rolling | Standard deploys, backward-compatible changes | Two versions run simultaneously |
| Blue-Green | Critical services, zero-tolerance for issues | 2x infrastructure during deploy |
| Canary | High-traffic services, risky changes | Requires traffic splitting + monitoring |

## Docker Best Practices

- Use specific version tags (not `:latest`)
- Multi-stage builds to minimize image size
- Run as non-root user
- Copy dependency files first (layer caching)
- Add HEALTHCHECK instruction
- Use `.dockerignore`

## Pipeline Stages

```
PR: lint -> typecheck -> unit tests -> integration tests -> preview deploy
Main: lint -> typecheck -> tests -> build image -> staging -> smoke tests -> production
```

## Production Readiness Checklist

### Application
- [ ] All tests pass
- [ ] No hardcoded secrets
- [ ] Error handling covers edge cases
- [ ] Structured logging (no PII)
- [ ] Health check endpoint

### Infrastructure
- [ ] Docker image builds reproducibly
- [ ] Env vars documented and validated at startup
- [ ] Resource limits set (CPU, memory)
- [ ] SSL/TLS enabled

### Monitoring
- [ ] Metrics exported (request rate, latency, errors)
- [ ] Alerts for error rate spikes
- [ ] Log aggregation set up

### Security
- [ ] Dependencies scanned for CVEs
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Security headers set

### Operations
- [ ] Rollback plan documented and tested
- [ ] Database migration tested against production-sized data
- [ ] Runbook for common failure scenarios

For detailed configs and examples, see references/patterns.md
