# API Specification (REST)

This document describes the REST API endpoints exposed by the FastAPI backend for the FieldOps guided photo audit system.

## 1. List Work Orders
Retrieve the list of assigned work orders.

* **Endpoint**: `GET /api/v1/work-orders`
* **Response Status**: `200 OK`
* **Response Body**:
```json
[
  {
    "id": "madrid-101",
    "address": "Calle de Alcala 45, Madrid",
    "technician": "tech-01",
    "status": "pending",
    "gps_lat": 40.416775,
    "gps_lon": -3.703790
  }
]
```

## 2. Get Work Order Details
Retrieve specific details and current inspection progress of a work order.

* **Endpoint**: `GET /api/v1/work-orders/{id}`
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "id": "madrid-101",
  "address": "Calle de Alcala 45, Madrid",
  "technician": "tech-01",
  "status": "in_progress",
  "gps_lat": 40.416775,
  "gps_lon": -3.703790,
  "steps": [
    {
      "step_id": "bend_radius",
      "name": "Fiber Bend Radius",
      "status": "pending",
      "photo_url": null,
      "verdict": null,
      "justification": null
    }
  ]
}
```

## 3. Upload Step Photo & Audit
Upload a photo for a specific inspection step to trigger GCS storage and Gemini Vision compliance auditing.

* **Endpoint**: `POST /api/v1/work-orders/{id}/upload`
* **Content-Type**: `multipart/form-data` or `application/json` (with base64 data)
* **Request Body**:
```json
{
  "step_id": "bend_radius",
  "image_data": "data:image/jpeg;base64,...",
  "gps_lat": 40.416775,
  "gps_lon": -3.703790
}
```
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "step_id": "bend_radius",
  "status": "fail",
  "photo_url": "https://storage.googleapis.com/...",
  "verdict": {
    "quality": {
      "blur": "pass",
      "exposure": "pass",
      "overall": "pass"
    },
    "compliance": {
      "overall": "fail",
      "details": "Pinched fiber observed. Bend radius is below the minimum 30mm safety standard."
    }
  },
  "message": "Audit completed. Compliance check failed."
}
```

## 4. Chat with assistant
Send a text query or voice-dictated query to the root orchestrator agent regarding this work order.

* **Endpoint**: `POST /api/v1/work-orders/{id}/chat`
* **Request Body**:
```json
{
  "message": "override the bend radius step since the fiber cabinet has strict space limits"
}
```
* **Response Status**: `200 OK`
* **Response Body**:
```json
{
  "reply": "I have registered your justification and overridden the bend radius requirement for step 1. The step is now marked as complete with deviation.",
  "action": {
    "type": "override_step",
    "step_id": "bend_radius",
    "status": "completed_with_deviation",
    "justification": "fiber cabinet has strict space limits"
  }
}
```

## 5. Get Markdown Report
Retrieve the generated Markdown report document for the work order.

* **Endpoint**: `GET /api/v1/work-orders/{id}/report`
* **Response Status**: `200 OK`
* **Response Body**: (plain text / markdown content)
```markdown
# FTTH Installation Report - madrid-101
* **Address**: Calle de Alcala 45, Madrid
* **Status**: Completed with Deviation

## Steps
### 1. Fiber Bend Radius
* **Status**: Completed with Deviation
* **Justification**: fiber cabinet has strict space limits
* **Audit Verdict**: failed compliance (Pinched fiber observed)
...
```
