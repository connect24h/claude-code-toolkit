---
name: coding-standards
description: Universal coding standards, best practices, and patterns for TypeScript, JavaScript, React, and Node.js development. Use when writing TypeScript/JavaScript code, reviewing code quality, or setting up project standards.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# Coding Standards & Best Practices

Universal coding standards applicable across all projects.

## When to Activate

- Starting a new project or module
- Reviewing code for quality and maintainability
- Refactoring existing code to follow conventions
- Setting up linting, formatting, or type-checking rules

## Code Quality Principles

1. **Readability First** -- Code is read more than written. Clear names, self-documenting code.
2. **KISS** -- Simplest solution that works. No premature optimization.
3. **DRY** -- Extract common logic. Share utilities.
4. **YAGNI** -- Don't build features before they're needed.

## Summary Rules

| Category | Rule |
|----------|------|
| Variables | Descriptive camelCase names |
| Functions | Verb-noun pattern, < 50 lines |
| Types | Strict types, no `any` |
| Immutability | Spread operator, never mutate |
| Errors | Comprehensive try/catch, specific messages |
| Async | `Promise.all` for independent calls |
| React | Functional components with typed props |
| State | Functional updates (`prev => prev + 1`) |
| Rendering | Logical `&&` over nested ternaries |
| API | Consistent response envelope, Zod validation |
| Performance | useMemo, useCallback, lazy loading |
| DB | Select specific columns, no `SELECT *` |
| Tests | AAA pattern, descriptive names |
| Comments | Explain WHY, not WHAT |
| Nesting | Max 4 levels, use early returns |
| Constants | Named constants, no magic numbers |

## File Organization

```
src/
├── app/          # Next.js App Router
├── components/   # React components (ui/, forms/, layouts/)
├── hooks/        # Custom React hooks
├── lib/          # Utilities and configs
├── types/        # TypeScript types
└── styles/       # Global styles
```

## File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase` with `use` prefix
- Utilities: `camelCase.ts`
- Types: `camelCase.types.ts`

For detailed patterns and examples, see references/patterns.md

**Remember**: Code quality is not negotiable. Clear, maintainable code enables rapid development and confident refactoring.
