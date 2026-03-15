---
name: python-patterns
description: Pythonic idioms, PEP 8 standards, type hints, and best practices for building robust, efficient, and maintainable Python applications. Use when writing Python code, reviewing Python for PEP 8 compliance, or designing Python packages.
origin: ECC
allowed-tools: "Read, Grep, Glob"
---

# Python Development Patterns

Idiomatic Python patterns and best practices for building robust, efficient, and maintainable applications.

## When to Activate

- Writing new Python code
- Reviewing Python code
- Refactoring existing Python code
- Designing Python packages/modules

## Core Principles

1. **Readability Counts** -- Code should be obvious and easy to understand. Clear names, self-documenting structure.
2. **Explicit is Better Than Implicit** -- Avoid magic; be clear about what your code does.
3. **EAFP** -- Easier to Ask Forgiveness than Permission. Prefer exception handling over checking conditions.

## Quick Reference: Python Idioms

| Idiom | Description |
|-------|-------------|
| EAFP | Easier to Ask Forgiveness than Permission |
| Context managers | Use `with` for resource management |
| List comprehensions | For simple transformations |
| Generators | For lazy evaluation and large datasets |
| Type hints | Annotate function signatures |
| Dataclasses | For data containers with auto-generated methods |
| `__slots__` | For memory optimization |
| f-strings | For string formatting (Python 3.6+) |
| `pathlib.Path` | For path operations (Python 3.4+) |
| `enumerate` | For index-element pairs in loops |

## Anti-Patterns to Avoid

- Mutable default arguments -- use `None` and create new objects
- Checking type with `type()` -- use `isinstance`
- Comparing to None with `==` -- use `is`
- `from module import *` -- use explicit imports
- Bare `except:` -- catch specific exceptions
- String concatenation in loops -- use `"".join()`

For detailed patterns and examples, see references/patterns.md

__Remember__: Python code should be readable, explicit, and follow the principle of least surprise. When in doubt, prioritize clarity over cleverness.
