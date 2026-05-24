# Restaurant Order System

NestJS backend for restaurant operations with JWT auth, role-based permissions, menu management, and table order processing.

## Domain

### Entities

- MenuItem: name, category (starter/main/dessert/drink), price, isAvailable
- Order: tableNumber, customerName, status (pending/preparing/served/cancelled), totalAmount
- OrderItem: orderId, menuItemId, quantity, price

### Roles

- admin: manage menu (add/update/delete, mark unavailable)
- staff: create and update orders

## Key Features

- Register + JWT login endpoints
- DTO validation with class-validator on auth/menu/orders payloads
- Role-based authorization using custom Roles decorator + RolesGuard
- Protected write routes using JwtAuthGuard + RolesGuard
- Service-level logging for key operations and failures
- Route-level caching on GET /menu
- Manual caching on GET /menu/:id
- Cache invalidation when menu item availability or details change
- Custom exceptions:
  - MenuItemUnavailableException when unavailable items are ordered
  - InvalidOrderStatusException when cancelling non-cancellable orders
- Business rule endpoint: PATCH /orders/:id/cancel only allows pending/preparing

## Tech Stack

- NestJS 11
- TypeScript
- TypeORM
- PostgreSQL (configured in AppModule)
- @nestjs/cache-manager
- Passport JWT
- Swagger docs at /docs

## Setup

```bash
npm install
```

## Run

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

## Test

```bash
npm test
npm run test:cov
npm run test:e2e
npm run test:e2e:cov
npm run test:cov:all
```

## Authentication

### Register

POST /auth/register

Example body:

```json
{
  "username": "newstaff",
  "password": "staff123",
  "role": "staff"
}
```

### Login

POST /auth/login

Example body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Seeded demo users:

- admin / admin123 (role: admin)
- staff / staff123 (role: staff)

Use the returned Bearer token in Authorization header:

```http
Authorization: Bearer <access_token>
```

## API Summary

### Menu

- GET /menu (admin, staff) - route-level cached
- GET /menu/:id (admin, staff) - manual cache
- POST /menu (admin)
- PATCH /menu/:id (admin)
- PATCH /menu/:id/unavailable (admin)
- DELETE /menu/:id (admin)

### Orders

- GET /orders (admin, staff)
- GET /orders/:id (admin, staff)
- POST /orders (staff)
- PATCH /orders/:id/status (staff)
- PATCH /orders/:id/cancel (staff)

## Business Rules

- Order creation validates each menu item availability.
- If an item is unavailable, MenuItemUnavailableException is thrown.
- Cancellation is only valid for pending and preparing statuses.
- Cancelling a served order throws InvalidOrderStatusException.

## Cache Behavior

- GET /menu is cached with key menu_all.
- GET /menu/:id is cached manually with key menu_item_<id>.
- Cache is invalidated on create/update/delete and availability updates.

## Notes

- Users are currently maintained in memory for training/demo scenarios.

## Requirement Checklist Mapping

- Min 2 entities: implemented with TypeORM entities (User, MenuItem, Order, OrderItem)
- DTOs: Create/Update DTOs with class-validator decorators for auth/menu/orders
- Auth: register + login + JWT + roles (admin, staff)
- Protected routes: write operations behind JwtAuthGuard + RolesGuard
- Custom exception: business 4xx exceptions for unavailable menu item and invalid order status
- Logging: logger usage in auth/menu/orders services for key operations
- Caching: route-level cache on GET /menu, manual cache on GET /menu/:id, invalidation on create/update/delete
- Unit tests: service-level tests with mocked repository/cache and business rule checks
- E2E tests: protected CRUD flow and explicit 401/403 assertions
- Docker: working Dockerfile + docker-compose.yml with Postgres service

## Postman Collection

- Import `Restaurant-System.postman_collection.json` from the project root.
- Run in this order for smooth variable setup:
  - Auth -> Login Admin
  - Auth -> Login Staff
  - Menu -> Create Menu Item (Admin)
  - Orders -> Create Order (Staff)

## Docker

```bash
docker compose up --build
```

This starts:

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs
- PostgreSQL on localhost:5432
