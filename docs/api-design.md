# API Design Principles

This document outlines the architectural decisions and design patterns applied to the RESTful API of the Archive project. The goal is to provide a consistent, predictable, and scalable interface for clients.

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
    { ... },
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

The API implements HATEOAS (Hypermedia as the Engine of Application State) by providing links within the response. This allows clients to discover related actions and resources dynamically without hardcoding URL patterns.

- Every resource contains a `self` link.
- Collections contain navigation links (`next`, `prev`, `first`, `last`).
- Related resources are linked where appropriate.

## 4. HTTP Methods and Status Codes

We strictly adhere to the intended usage of HTTP methods:

- **GET:** Retrieve resources. Should be idempotent and have no side effects.
- **POST:** Create a new resource. Returns `201 Created` with a `Location` header.
- **PATCH:** Partial update of an existing resource.
- **PUT:** Replace an entire resource.
- **DELETE:** Remove a resource. Returns `204 No Content`.

### Standard Status Codes
- `200 OK`: Success for GET, PATCH, PUT.
- `201 Created`: Success for POST.
- `204 No Content`: Success for DELETE.
- `400 Bad Request`: Validation errors or malformed syntax.
- `401 Unauthorized`: Authentication required.
- `403 Forbidden`: Authenticated but lacks required permissions.
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled server-side exceptions.

## 5. Error Handling

Error responses follow the RFC 7807 (Problem Details for HTTP APIs) standard to provide machine-readable error information.

```json
{
  "type": "https://api.archive.be/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Production with ID {id} could not be found.",
  "instance": "/api/v1/archive/productions/{id}"
}
```
