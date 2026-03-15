---
name: python-testing
description: Python testing strategies using pytest, TDD methodology, fixtures, mocking, parametrization, and coverage requirements. Use when writing pytest tests, setting up fixtures, or implementing TDD in Python projects.
origin: ECC
allowed-tools: "Read, Grep, Glob, Bash"
---

# Python Testing Patterns

Comprehensive testing strategies for Python applications using pytest, TDD methodology, and best practices.

## When to Activate

- Writing new Python code (follow TDD: red, green, refactor)
- Designing test suites for Python projects
- Reviewing Python test coverage
- Setting up testing infrastructure

## TDD Cycle

1. **RED**: Write a failing test for the desired behavior
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve code while keeping tests green

## Coverage Requirements

- **Target**: 80%+ code coverage
- **Critical paths**: 100% coverage required
- `pytest --cov=mypackage --cov-report=term-missing --cov-report=html`

## DO

- Follow TDD: Write tests before code
- Test one thing per test
- Use descriptive names: `test_user_login_with_invalid_credentials_fails`
- Use fixtures to eliminate duplication
- Mock external dependencies
- Test edge cases: empty inputs, None, boundary conditions
- Keep tests fast; use marks to separate slow tests

## DON'T

- Test implementation details -- test behavior
- Use complex conditionals in tests
- Ignore test failures
- Test third-party code
- Share state between tests
- Catch exceptions in tests -- use `pytest.raises`
- Write overly brittle tests with over-specific mocks

## Running Tests

```bash
pytest                                    # Run all tests
pytest tests/test_utils.py               # Run specific file
pytest tests/test_utils.py::test_func    # Run specific test
pytest -v                                 # Verbose output
pytest --cov=mypackage --cov-report=html # With coverage
pytest -m "not slow"                     # Skip slow tests
pytest -x                                 # Stop on first failure
pytest --lf                               # Run last failed
pytest -k "test_user"                    # Pattern match
```

## Quick Reference

| Pattern | Usage |
|---------|-------|
| `pytest.raises()` | Test expected exceptions |
| `@pytest.fixture()` | Create reusable test fixtures |
| `@pytest.mark.parametrize()` | Run tests with multiple inputs |
| `@pytest.mark.slow` | Mark slow tests |
| `pytest -m "not slow"` | Skip slow tests |
| `@patch()` | Mock functions and classes |
| `tmp_path` fixture | Automatic temp directory |
| `pytest --cov` | Generate coverage report |
| `assert` | Simple and readable assertions |

For detailed patterns and examples, see references/patterns.md

**Remember**: Tests are code too. Keep them clean, readable, and maintainable.
