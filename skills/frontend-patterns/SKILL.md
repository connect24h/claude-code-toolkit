---
name: frontend-patterns
description: Frontend development patterns for React, Next.js, state management, performance optimization, and UI best practices. Use when building React/Next.js components, managing state, or optimizing frontend performance.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# Frontend Development Patterns

Modern frontend patterns for React, Next.js, and performant user interfaces.

## When to Activate

- Building React components (composition, props, rendering)
- Managing state (useState, useReducer, Zustand, Context)
- Implementing data fetching (SWR, React Query, server components)
- Optimizing performance (memoization, virtualization, code splitting)
- Working with forms (validation, controlled inputs, Zod schemas)
- Building accessible, responsive UI patterns

## Pattern Summary

| Category | Patterns |
|----------|----------|
| Components | Composition, Compound Components, Render Props |
| Custom Hooks | useToggle, useQuery, useDebounce |
| State | Context + Reducer, Zustand |
| Performance | useMemo, useCallback, React.memo, lazy loading, virtualization |
| Forms | Controlled inputs, schema validation, error display |
| Error Handling | Error Boundaries |
| Animation | Framer Motion AnimatePresence |
| Accessibility | Keyboard navigation, focus management, ARIA attributes |

## Key Principles

- **Composition over inheritance** -- build complex UI from small, composable components
- **Memoize expensive computations** -- useMemo for derived data, useCallback for handler stability
- **Lazy load heavy components** -- code splitting with React.lazy + Suspense
- **Virtualize long lists** -- render only visible items for 1000+ element lists
- **Manage focus explicitly** -- save/restore focus for modals and dialogs
- **Use semantic HTML and ARIA** -- role, aria-expanded, aria-modal for screen readers

For detailed patterns and examples, see references/patterns.md

**Remember**: Choose patterns that fit your project complexity.
