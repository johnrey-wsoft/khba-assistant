---
outline: deep
---

# Patterns

Standardized patterns used across the template. Each pattern solves a specific problem and works together with the others.

| Pattern                              | Purpose                    | When to Use                    |
| ------------------------------------ | -------------------------- | ------------------------------ |
| [API Response](./api-response)       | Consistent response format | Every API route                |
| [Auth Guard](./auth-guard)           | Route protection           | Protected API endpoints        |
| [Form Validation](./form-validation) | Type-safe form schemas     | Auth forms and user inputs     |
| [Route Definitions](./routes)        | Centralized URL management | Navigation and redirects       |
| [Query Keys](./query-keys)           | Cache key hierarchy        | Data fetching with React Query |
| [HTTP Status](./http-status)         | Status codes and text      | API responses                  |

## Pattern Relationships

These patterns work together in a cohesive system:

```text
┌─────────────────────────────────────────┐
│        User Makes Request               │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Route Definition   │
        │  (routes.constant)  │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   Auth Guard        │
        │ (requireAuth check) │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  API Endpoint       │
        │  (business logic)   │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  API Response       │
        │  (apiResponse fn)   │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  HTTP Status Code   │
        │  (HttpStatus const) │
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────┐
│  Response sent to client with           │
│  { success, data, error } shape         │
└─────────────────────────────────────────┘
```

## Getting Started with Patterns

### For New Developers

1. **Read the overview** of each pattern on this page
2. **Deep-dive** into the pattern guide that matches your task
3. **Look at examples** in the `app/` and `lib/` directories
4. **Reference** the AGENTS.md file for comprehensive architectural details

### For Daily Development

- **Adding a new API endpoint?** → Start with [Auth Guard](./auth-guard.md)
- **Building a form?** → Use [Form Validation](./form-validation.md)
- **Fetching data?** → Leverage [Query Keys](./query-keys.md)
- **Navigating pages?** → Reference [Route Definitions](./routes.md)

## See Also

- [Overview](../overview.md) - Getting started guide
- [AGENTS.md](../../AGENTS.md) - Comprehensive architectural documentation
