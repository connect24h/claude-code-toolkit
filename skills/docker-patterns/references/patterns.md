# Docker Patterns - Detailed Configs and Examples

## Docker Compose for Local Development

### Standard Web App Stack

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/app_dev
      - REDIS_URL=redis://redis:6379/0
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  mailpit:
    image: axllent/mailpit
    ports:
      - "8025:8025"
      - "1025:1025"

volumes:
  pgdata:
  redisdata:
```

## Development vs Production Dockerfile

```dockerfile
# Stage: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage: dev (hot reload, debug tools)
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage: build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

# Stage: production (minimal image)
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

## Override Files

```yaml
# docker-compose.override.yml (auto-loaded, dev-only settings)
services:
  app:
    environment:
      - DEBUG=app:*
      - LOG_LEVEL=debug
    ports:
      - "9229:9229"   # Node.js debugger

# docker-compose.prod.yml (explicit for production)
services:
  app:
    build:
      target: production
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

```bash
docker compose up                                              # Dev (auto-loads override)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d  # Production
```

## Networking

### Custom Networks

```yaml
services:
  frontend:
    networks:
      - frontend-net

  api:
    networks:
      - frontend-net
      - backend-net

  db:
    networks:
      - backend-net    # Only reachable from api, not frontend

networks:
  frontend-net:
  backend-net:
```

### Exposing Only What's Needed

```yaml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"   # Only accessible from host
```

## Volume Strategies

```yaml
services:
  app:
    volumes:
      - .:/app                   # Source code (bind mount for hot reload)
      - /app/node_modules        # Protect container's node_modules
      - /app/.next               # Protect build cache

  db:
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
```

## Container Security

### Dockerfile Hardening

```dockerfile
FROM node:22.12-alpine3.20       # Specific tags
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
USER app                          # Non-root
```

### Compose Security

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /app/.cache
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### Secret Management

```yaml
# GOOD: Environment variables (injected at runtime)
services:
  app:
    env_file:
      - .env
    environment:
      - API_KEY      # Inherits from host

# GOOD: Docker secrets (Swarm mode)
secrets:
  db_password:
    file: ./secrets/db_password.txt

# BAD: Hardcoded in image
# ENV API_KEY=sk-proj-xxxxx      # NEVER
```

## .dockerignore

```
node_modules
.git
.env
.env.*
dist
coverage
*.log
.next
.cache
docker-compose*.yml
Dockerfile*
README.md
tests/
```

## Debugging Commands

```bash
docker compose logs -f app           # Follow app logs
docker compose logs --tail=50 db     # Last 50 lines
docker compose exec app sh           # Shell into app
docker compose exec db psql -U postgres  # Connect to postgres
docker compose ps                     # Running services
docker stats                          # Resource usage
docker compose up --build             # Rebuild images
docker compose build --no-cache app   # Force full rebuild
docker compose down                   # Stop and remove
docker compose down -v                # Also remove volumes (DESTRUCTIVE)
```

### Debugging Network Issues

```bash
docker compose exec app nslookup db
docker compose exec app wget -qO- http://api:3000/health
docker network ls
docker network inspect <project>_default
```
