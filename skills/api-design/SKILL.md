---
name: api-design
description: REST API design patterns including resource naming, status codes, pagination, filtering, error responses, versioning, and rate limiting for production APIs. Use when designing REST APIs, defining endpoints, or setting up pagination, filtering, and error handling.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# API Design Patterns

Conventions and best practices for designing consistent, developer-friendly REST APIs.

## When to Activate

- Designing new API endpoints
- Reviewing existing API contracts
- Adding pagination, filtering, or sorting
- Implementing error handling for APIs
- Planning API versioning strategy
- Building public or partner-facing APIs

## Resource Naming Rules

- Resources are nouns, plural, lowercase, kebab-case
- Query params for filtering; no verbs in URLs
- Sub-resources for relationships: `/users/:id/orders`

## HTTP Methods

| Method | Idempotent | Safe | Use For |
|--------|-----------|------|---------|
| GET | Yes | Yes | Retrieve resources |
| POST | No | No | Create resources, trigger actions |
| PUT | Yes | No | Full replacement of a resource |
| PATCH | No* | No | Partial update of a resource |
| DELETE | Yes | No | Remove a resource |

## Status Codes

| Code | When |
|------|------|
| 200 | GET, PUT, PATCH with body |
| 201 | POST (include Location header) |
| 204 | DELETE, PUT without body |
| 400 | Validation failure, malformed JSON |
| 401 | Missing/invalid authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Duplicate/state conflict |
| 422 | Valid JSON, bad data |
| 429 | Rate limit exceeded |

## Pagination

| Use Case | Type |
|----------|------|
| Admin dashboards, small datasets | Offset (`?page=2&per_page=20`) |
| Infinite scroll, feeds, large datasets | Cursor (`?cursor=xxx&limit=20`) |
| Public APIs | Cursor default, offset optional |

## Rate Limit Tiers

| Tier | Limit | Use Case |
|------|-------|----------|
| Anonymous | 30/min | Public endpoints |
| Authenticated | 100/min | Standard API access |
| Premium | 1000/min | Paid API plans |
| Internal | 10000/min | Service-to-service |

## API Design Checklist

- [ ] Resource URL follows naming conventions
- [ ] Correct HTTP method used
- [ ] Appropriate status codes returned
- [ ] Input validated with schema (Zod, Pydantic, etc.)
- [ ] Error responses follow standard format
- [ ] Pagination on list endpoints
- [ ] Authentication required (or explicitly public)
- [ ] Authorization checked
- [ ] Rate limiting configured
- [ ] No internal details leaked in responses
- [ ] Documented (OpenAPI/Swagger)

For detailed patterns and examples, see references/patterns.md
