# API Documentation - MK9 Analytics

## Overview
This document describes the available API endpoints in MK9 Analytics. The API is built using Next.js API Routes and follows RESTful conventions.

## Base URL
All API endpoints are prefixed with `/api`.

## Authentication
*Note: Authentication is not yet implemented. All endpoints are currently accessible without authentication.*
When authentication is implemented, endpoints will require a valid JWT token in the Authorization header.

## Endpoints

### Promoters
#### GET `/api/promotores`
Retrieve a paginated list of promoters with optional filtering and sorting.

**Query Parameters:**
- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 10): Number of items per page
- `search` (string, optional): Filter by promoter name (case-insensitive)
- `supervisorId` (string, optional): Filter by supervisor ID
- `city` (string, optional): Filter by city
- `state` (string, optional): Filter by state
- `sortBy` (string, default: "name"): Field to sort by (name, city, state)
- `sortOrder` (string, default: "asc"): Sort order (asc or desc)

**Response:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "city": "string | null",
      "state": "string | null",
      "supervisorId": "string",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

#### POST `/api/promotores`
Create a new promoter.

**Request Body:**
```json
{
  "name": "string",
  "city": "string | null",
  "state": "string | null",
  "supervisorId": "string"
}
```

**Response:** The created promoter object.

#### GET `/api/promotores/[id]`
Retrieve a specific promoter by ID.

**Response:** The promoter object if found, otherwise 404.

#### PUT `/api/promotores/[id]`
Update an existing promoter.

**Request Body:** Partial promoter object (any subset of the promoter fields).

**Response:** The updated promoter object.

#### DELETE `/api/promotores/[id]`
Delete a promoter (only if they have no associated visits).

**Response:** Success confirmation.

### Visits (Dynamic ID Route)
#### GET `/api/[id]`
Retrieve a specific visit by ID.

**Response:** The visit object with populated relations (operation, promoter, store, industry) or 404 if not found.

#### PUT `/api/[id]`
Update a visit (typically used for status changes).

**Request Body:** Partial visit object (fields that can be updated: status, completedDate, etc.).

**Response:** The updated visit object.

#### DELETE `/api/[id]`
Delete a visit (only if in PLANEJADA status).

**Response:** Success confirmation.

### Imports
#### POST `/api/imports/upload`
Upload and initiate processing of import file.

**Request:** Multipart/form-data with file

**Response:** Import preview or error

#### POST `/api/imports/preview`
Generate preview of import file without persistence.

**Request:** File metadata and configuration

**Response:** Preview data with validation results

#### POST `/api/imports/confirm`
Confirm and persist import data.

**Request:** Import configuration and validated data

**Response:** Import confirmation

#### GET `/api/imports/history`
Retrieve import history with filtering and pagination.

**Response:** List of import operations

## Planned Endpoints
The following endpoints are planned for future implementation:

### Operations
- GET `/api/operations`
- POST `/api/operations`
- GET `/api/operations/[id]`
- PUT `/api/operations/[id]`
- DELETE `/api/operations/[id]`

### Stores
- GET `/api/stores`
- POST `/api/stores`
- GET `/api/stores/[id]`
- PUT `/api/stores/[id]`
- DELETE `/api/stores/[id]`

### Industries
- GET `/api/industries`
- POST `/api/industries`
- GET `/api/industries/[id]`
- PUT `/api/industries/[id]`
- DELETE `/api/industries/[id]`

## Error Responses
All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (when authentication is implemented)
- 403: Forbidden (when authentication is implemented)
- 404: Not Found
- 405: Method Not Allowed
- 409: Conflict (e.g., trying to delete a promoter with associated visits)
- 500: Internal Server Error

Error responses follow this format:
```json
{
  "error": "string (error message)",
  "details": "object (optional, additional error details)"
}
```

## Rate Limiting
*Note: Rate limiting is not yet implemented.*
When implemented, the API will enforce rate limits to prevent abuse.

## Versioning
The API is currently versionless. Future versions will use URL versioning (e.g., `/api/v1/`).