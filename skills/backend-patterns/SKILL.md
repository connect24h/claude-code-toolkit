---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Node.js, Express, and Next.js API routes. Use when building server-side APIs, implementing repository/service patterns, or optimizing database queries.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# Backend Development Patterns

Backend architecture patterns and best practices for scalable server-side applications.

## When to Activate

- Designing REST or GraphQL API endpoints
- Implementing repository, service, or controller layers
- Optimizing database queries (N+1, indexing, connection pooling)
- Adding caching (Redis, in-memory, HTTP cache headers)
- Setting up background jobs or async processing
- Structuring error handling and validation for APIs
- Building middleware (auth, logging, rate limiting)

## Core Patterns Summary

| Pattern | Purpose |
|---------|---------|
| RESTful API | Resource-based URLs with proper HTTP methods |
| Repository | Abstract data access behind a consistent interface |
| Service Layer | Separate business logic from data access |
| Middleware | Request/response processing pipeline (auth, logging) |
| Cache-Aside | Check cache first, fetch from DB on miss |
| Centralized Error Handler | Consistent error responses with proper status codes |
| Retry with Backoff | Exponential backoff for transient failures |
| JWT Auth | Token-based authentication with role-based access |
| Rate Limiting | Per-IP or per-user request throttling |
| Job Queue | Background processing for non-blocking operations |
| Structured Logging | JSON log entries with request context |

## Key Principles

- **N+1 Prevention**: Batch fetch related data instead of querying in loops
- **Select Only Needed Columns**: Never `SELECT *` in production
- **Transactions for Multi-Table Writes**: Ensure atomicity
- **Cache Invalidation**: Invalidate on write, TTL as safety net
- **Error Classification**: Operational vs programmer errors, proper status codes
- **Non-Root User**: Always validate auth before accessing resources

For detailed patterns and examples, see references/patterns.md

**Remember**: Backend patterns enable scalable, maintainable server-side applications. Choose patterns that fit your complexity level.
