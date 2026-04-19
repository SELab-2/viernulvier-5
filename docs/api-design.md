# API Design Principles

This document outlines the architectural decisions and design patterns applied to the RESTful API of the Viernulvier Archive project. The goal is to provide a consistent, predictable, and scalable interface for clients.

## 1. Resource-Oriented Architecture

The API is structured around resources, which are identified by URI paths. We use plural nouns to represent collections (e.g., `/productions`, `/blogs`) and unique identifiers to access specific resources (e.g., `/productions/:id`).

### URL Structure
All routes follow a consistent hierarchical pattern:
`{protocol}://{host}/api/{version}/{context}/{resource}`

Example: `https://api.archive.be/api/v1/archive/productions`

- **Version:** `/v1/` ensures backward compatibility and allows for future iterations without breaking existing clients.
- **Context:** `/archive/` namespaces the resources specifically belonging to the archive application.
- **Resource:** Plural nouns representing the entity type.

## 2. Response Enveloping

To ensure consistency across all endpoints, every response is wrapped in a standard JSON envelope. This allows clients to predict the structure of the data they receive.

### Single Resource Response
A single resource is returned within a `data` object, accompanied by relevant metadata and hypermedia links.

```json
{
  "data": {
    "id": "uuid",
    "title": "Example Production",
    ...
    "links": {
      "self": "/api/v1/archive/productions/uuid",
      "events": "/api/v1/archive/events?productionId=uuid"
    }
  },
  "links": {
    "self": "/api/v1/archive/productions/uuid"
  }
}
```

### Collection Response (Pagination)
Collections use a consistent structure for data, pagination metadata, and navigation links.

```json
{
  "data": [
    { 
      "id": "...", 
      "links": { "self": "..." } 
    },
    { ... }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "links": {
    "self": "/api/v1/archive/productions?page=1",
    "next": "/api/v1/archive/productions?page=2",
    "prev": null,
    "first": "/api/v1/archive/productions?page=1",
    "last": "/api/v1/archive/productions?page=5"
  }
}
```

## 3. Hypermedia (HATEOAS)

The API implements HATEOAS (Hypermedia as the Engine of Application State). Links are provided in two places:
1.  **Top-level `links`**: Metadata about the request itself (e.g., pagination).
2.  **Resource-level `data.links`**: Links directly related to the resource (e.g., related entities).

- Every resource contains a `self` link in its `links` property.
- Collections contain navigation links (`next`, `prev`, `first`, `last`).
- Related resources are linked where appropriate (e.g., a `space` links to its `halls`).

## 4. Authentication & Security

The API uses JWT (JSON Web Tokens) for authentication, but with a focus on security for web clients.

- **Storage:** Tokens are stored in **HttpOnly, Secure, SameSite=Strict cookies**.
- **Access:** JavaScript cannot access the token, preventing XSS-based token theft.
- **Response:** Upon successful login, the API returns the user object in the JSON body, but **never the token itself**. The token is strictly transmitted via the `Set-Cookie` header.
- **Logout:** The `/logout` endpoint clears the auth cookie and returns a `200 OK`.

## 5. HTTP Methods and Status Codes

We strictly adhere to the intended usage of HTTP methods:

- **GET:** Retrieve resources. Should be idempotent and have no side effects.
- **POST:** Create a new resource. Returns `201 Created` with a `Location` header.
- **PATCH:** Partial update of an existing resource.
- **DELETE:** Remove a resource. Returns `204 No Content`.

### Standard Status Codes
- `200 OK`: Success for GET, PATCH.
- `201 Created`: Success for POST.
- `204 No Content`: Success for DELETE.
- `400 Bad Request`: Validation errors or malformed syntax.
- `401 Unauthorized`: Authentication required or invalid credentials.
- `403 Forbidden`: Authenticated but lacks required permissions.
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded (e.g., too many failed login attempts).
- `500 Internal Server Error`: Unhandled server-side exceptions.

## 6. Error Handling

Error responses follow a standard structure to provide clear feedback to developers.

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "The requested resource was not found."
}
```

For validation errors, a `details` field is provided:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "path": ["email"], "message": "Invalid email format" }
  ]
}
```
