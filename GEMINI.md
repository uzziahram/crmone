# CRMONE Engineering Standards

## 1. Security
- **Passwords**: ALWAYS hash passwords using `bcryptjs` (salt rounds: 10). NEVER store or compare plain-text passwords.
- **Data Exposure**: When querying the `customers` or `users` tables, explicitly select non-sensitive columns. NEVER return password hashes in API responses.
- **Authentication**: Use JWT for session management. Tokens should be stored in `httpOnly` cookies.

## 2. Validation
- **Schema**: Use `Zod` for all API request body and parameter validation.
- **Types**: Maintain strict TypeScript typing across the project. Synchronize types in the `@/types` directory with the database schema.

## 3. Database
- **Technology**: MySQL 8.0 (Docker container `db`).
- **Connection**: Use the shared connection pool in `@/lib/database/db.ts`.
- **Transactions**: Use SQL transactions (`connection.beginTransaction()`, `commit()`, `rollback()`) for all multi-step operations like checkout.

## 4. API Design
- **Consistent Responses**: Use the utilities in `@/lib/api-utils.ts` (`successResponse`, `errorResponse`, `handleApiError`) for all API endpoints to ensure consistent JSON structure and status codes.
- **Methods**: Follow standard RESTful practices (GET for reading, POST for creation, PATCH for partial updates, DELETE for removal).

## 5. Testing
- **Unit Tests**: Add tests in the `__tests__` directory for all core logic (auth, utilities, etc.) using `Jest`.
- **Running Tests**: Run `npm test` before committing changes.
