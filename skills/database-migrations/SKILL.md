---
name: database-migrations
description: Database migration best practices for schema changes, data migrations, rollbacks, and zero-downtime deployments across PostgreSQL, MySQL, and common ORMs (Prisma, Drizzle, Django, TypeORM, golang-migrate). Use when creating schema migrations, handling rollbacks, or planning zero-downtime database changes.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# Database Migration Patterns

Safe, reversible database schema changes for production systems.

## When to Activate

- Creating or altering database tables
- Adding/removing columns or indexes
- Running data migrations (backfill, transform)
- Planning zero-downtime schema changes
- Setting up migration tooling for a new project

## Core Principles

1. **Every change is a migration** -- never alter production databases manually
2. **Migrations are forward-only in production** -- rollbacks use new forward migrations
3. **Schema and data migrations are separate** -- never mix DDL and DML
4. **Test against production-sized data** -- what works on 100 rows may lock on 10M
5. **Migrations are immutable once deployed** -- never edit a deployed migration

## Migration Safety Checklist

- [ ] Has both UP and DOWN (or marked irreversible)
- [ ] No full table locks on large tables
- [ ] New columns have defaults or are nullable
- [ ] Indexes created concurrently
- [ ] Data backfill is a separate migration
- [ ] Tested against production-sized data copy
- [ ] Rollback plan documented

## Zero-Downtime: Expand-Contract Pattern

| Phase | Action |
|-------|--------|
| EXPAND | Add new column (nullable/default), app writes to BOTH, backfill |
| MIGRATE | App reads from NEW, writes to BOTH, verify consistency |
| CONTRACT | App uses only NEW, drop old column in separate migration |

## Anti-Patterns

| Anti-Pattern | Better Approach |
|-------------|-----------------|
| Manual SQL in production | Always use migration files |
| Editing deployed migrations | Create new migration |
| NOT NULL without default | Add nullable, backfill, then add constraint |
| Inline index on large table | CREATE INDEX CONCURRENTLY |
| Schema + data in one migration | Separate migrations |
| Drop column before removing code | Remove code first, drop column next deploy |

For detailed SQL/ORM examples, see references/patterns.md
