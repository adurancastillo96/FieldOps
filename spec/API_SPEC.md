# API Specification

> [!NOTE]
> `spec/openapi.yaml` is the canonical, machine-readable source of truth for API contracts in this project.
> This document (`spec/API_SPEC.md`) serves as the human-readable companion guide. Always keep them in sync.
> You can validate their consistency using the `openapi-validate` skill.

## Base URL
`/api/v1`

## Authentication
V1 uses Bearer Auth (JWT) with mock verification for demonstration purposes. 
In local development, any bearer token (e.g. `Bearer test-token-123`) is accepted.

## Common Headers
| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` or `multipart/form-data` | Yes |
| `Authorization` | `Bearer <token>` | Yes (for protected routes) |

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
| 400 | `VALIDATION_ERROR` | Invalid input or invalid payload format |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource (e.g. work order) not found |
| 409 | `CONFLICT` | State conflict (e.g. work order already completed) |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Endpoints

### Resource: Work Orders

#### `GET /work-orders`
List work orders assigned to the authenticated technician.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `pending`, `in_progress`, `completed` |

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "7a3b3780-e83c-41c3-8f0a-115f5d888201",
      "created_at": "2026-07-06T18:00:00Z",
      "updated_at": "2026-07-06T18:00:00Z",
      "address": "Calle Principal 123, Madrid",
      "ont_model": "HG8145V5",
      "expected_mac_prefix": "48:8F:4C",
      "assigned_technician_id": "tech-01",
      "status": "pending"
    }
  ]
}
```

---

#### `GET /work-orders/{id}`
Retrieve a specific work order by ID.

**Response:** `200 OK`
```json
{
  "id": "7a3b3780-e83c-41c3-8f0a-115f5d888201",
  "created_at": "2026-07-06T18:00:00Z",
  "updated_at": "2026-07-06T18:00:00Z",
  "address": "Calle Principal 123, Madrid",
  "ont_model": "HG8145V5",
      "expected_mac_prefix": "48:8F:4C",
  "assigned_technician_id": "tech-01",
  "status": "pending"
}
```

---

### Resource: Synchronization

#### `POST /sync`
Synchronize an offline-captured inspection containing step metadata and image blobs.

**Request Type:** `multipart/form-data`

**Request Parameters:**
- `payload`: (JSON String, Required) The inspection metadata and steps data.
- `files`: (Binary files, Optional) One or more image uploads. Form parameter names must match the corresponding step IDs (e.g. `ont-after-closeup`).

**Example `payload` JSON schema:**
```json
{
  "id": "ea32e8fc-f8a4-44cf-a3bc-a4f7e256a001",
  "work_order_id": "7a3b3780-e83c-41c3-8f0a-115f5d888201",
  "technician_id": "tech-01",
  "gps_lat": 40.416775,
  "gps_lon": -3.703790,
  "steps": [
    {
      "step_id": "site-overview",
      "evidence_type": "photo",
      "ocr_value": null,
      "optical_power_dbm": null,
      "quality_blur": "pass",
      "quality_exposure": "pass",
      "quality_framing": "pass"
    },
    {
      "step_id": "ont-after-closeup",
      "evidence_type": "photo",
      "ocr_value": "48:8F:4C:AA:BB:CC",
      "optical_power_dbm": null,
      "quality_blur": "pass",
      "quality_exposure": "pass",
      "quality_framing": "pass"
    },
    {
      "step_id": "power-meter",
      "evidence_type": "reading",
      "ocr_value": null,
      "optical_power_dbm": -19.5,
      "quality_blur": "pass",
      "quality_exposure": "pass",
      "quality_framing": "pass"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "status": "synced",
  "inspection_id": "ea32e8fc-f8a4-44cf-a3bc-a4f7e256a001",
  "verdict": "approved",
  "details": "All quality and compliance gates passed successfully."
}
```

---

### Real-Time Real-Time Channel (WebSocket)

#### `WS /ws/{user_id}/{session_id}`
Establishes a bidirectional real-time audio and UI command control link.

**Uplink Protocol:**
- Audio frame: Binary PCM data (16kHz, 16-bit, Mono) in ~100ms buffers (3200 bytes).
- Control events: JSON structures (e.g. to upload video frame or trigger a tool call).

**Downstream Protocol:**
- Audio frame: Binary PCM audio (24kHz, 16-bit, Mono) streamed from Gemini TTS.
- UI commands: JSON event structures including `render_command` specifications.

**Example Downstream JSON Command Event:**
```json
{
  "type": "render_command",
  "render_command": {
    "layer": "clinical",
    "action": "show",
    "data": {
      "step_id": "power-meter",
      "status": "pass",
      "reading": -19.5,
      "text": "Optical power reading is within safety threshold."
    }
  }
}
```
