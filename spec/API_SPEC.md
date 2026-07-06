# API Specification

> [!NOTE]
> `spec/openapi.yaml` is the canonical, machine-readable source of truth for API contracts in this project.
> This document (`spec/API_SPEC.md`) serves as the human-readable companion guide. Always keep them in sync.
> You can validate their consistency using the `openapi-validate` skill.

## Base URL
`/api/v1`

## Authentication
<!-- Authentication method and flow -->

## Common Headers
| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes |
| `Authorization` | `Bearer <token>` | For protected routes |

## Error Response Format
All errors follow this structure (modeled as `ErrorResponse` in `spec/openapi.yaml`):
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Standard Error Codes
| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

## Endpoints

### Resource: [Resource Name]

#### `GET /resource`
<!-- List resources -->

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |

**Response:** `200 OK`
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

---

<!-- Add more endpoints as they are specified -->

