# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homero is a full-stack TypeScript application built with:
- **Frontend**: React + TanStack Start (SSR framework with TanStack Router)
- **Backend**: Elysia (type-safe, high-performance framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Runtime**: Bun
- **Monorepo**: Workspace-based with apps and packages

## Development Commands

### Running the Application
```bash
bun install                    # Install all dependencies
bun dev                        # Start all applications (web on :3001, server on :3000)
bun dev:web                    # Start only the web application
bun dev:server                 # Start only the server
```

### Database Operations
```bash
bun db:start                   # Start PostgreSQL container (detached)
bun db:watch                   # Start PostgreSQL container (with logs)
bun db:stop                    # Stop the container
bun db:down                    # Stop and remove the container
bun db:push                    # Push schema changes to database
bun db:studio                  # Open Drizzle Studio for database inspection
bun db:generate                # Generate migration files
bun db:migrate                 # Run migrations
```

### Testing
```bash
bun test:server                # Run all server tests
bun test:web                   # Run all web tests
```

### Code Quality
```bash
bun check                      # Lint with oxlint
bun format                     # Format code with Prettier
bun format:check               # Check code formatting
bun check-types                # Type check all apps
```

### Building
```bash
bun build                      # Build all applications
bun run --filter server build  # Build server only
bun run --filter web build     # Build web only
```

## Architecture

### Monorepo Structure
```
apps/
  web/          - Frontend (TanStack Start, React, Tailwind)
  server/       - Backend API (Elysia)
packages/
  db/           - Database layer (Drizzle ORM, schema, migrations)
```

### Database Package (`@homero/db`)

The database package provides a centralized database layer:
- Exports a singleton `db` instance configured with Drizzle ORM
- Automatically selects database URL: uses `DATABASE_URL` environment variable
- Schema is defined in `packages/db/src/schema.ts`
- Uses nanoid() for primary key generation

**Testing utilities** (`packages/db/src/test-db.ts`):
- `createTestDb()` - Spins up an isolated PostgreSQL container using Testcontainers
- `clearDatabase()` - Clears all tables
- `withTransaction()` - Executes callback in a transaction that always rolls back

### Server Architecture

**Entry point**: `apps/server/src/index.ts`

**Module structure**: `apps/server/src/modules/{feature}/handlers/{endpoint}/`

**Route handler pattern**: Handlers follow a dependency injection pattern using the `createRouteHandler` helper from `apps/server/helpers/create-route-handler/`:

```typescript
// Pattern for creating handlers
export const createMyHandler = createRouteHandler(({ db }) =>
  new Elysia().post("/my-route", async ({ body, set }) => {
    // Use db for database operations
  }, {
    body: MY_SCHEMA  // Zod validation schema
  })
);

// Register in apps/server/src/index.ts
app.use(createMyHandler({ db }));
```

This pattern enables:
- Dependency injection of the database instance
- Testability (handlers can be tested with test databases)
- Type safety with Elysia's type system

### Testing Strategy

Server tests use **Testcontainers** for isolated integration testing:

1. Each test file spins up its own PostgreSQL container in `beforeAll()`
2. Tests run against a real database (not mocks)
3. Container is stopped in `afterAll()`
4. Pattern: `createTestDb()` returns `{ db, container }`

Example test structure:
```typescript
let container: Awaited<ReturnType<typeof createTestDb>>;
let testDb: Awaited<ReturnType<typeof createTestDb>>["db"];

beforeAll(async () => {
  const testDbInstance = await createTestDb();
  container = testDbInstance;
  testDb = testDbInstance.db;
  app = createMyHandler({ db: testDb });
});

afterAll(async () => {
  await container?.container.stop();
});
```

## Environment Setup

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Allowed CORS origin for the server

### Default Docker Database
The Docker Compose setup (`packages/db/docker-compose.yml`) provides:
- Database: `homero`
- User: `postgres`
- Password: `password`
- Port: `5432`
- Connection: `postgresql://postgres:password@localhost:5432/homero`

## Key Technical Details

### Database Schema
Current schema (`packages/db/src/schema.ts`):
- `usersTable`: id (nanoid), email, username, passwordHash, createdAt, refreshToken

### Authentication
- Password hashing: **argon2**
- JWT tokens: **jose** library
- Auth handlers in `apps/server/src/modules/auth/handlers/`

### Import Paths
- Server uses path mapping: `helpers/` → `apps/server/helpers/`
- Database imports: `@homero/db` (main exports), `@homero/db/schema` (schema only)

## Development Workflow

When adding new server endpoints:

1. Create handler directory: `apps/server/src/modules/{module}/handlers/{endpoint}/`
2. Create `settings.ts` with Zod validation schemas
3. Create `index.ts` using `createRouteHandler` pattern
4. Create `index.test.ts` using `createTestDb()` for integration tests
5. Register handler in `apps/server/src/index.ts` with `.use(createMyHandler({ db }))`

When modifying database schema:

1. Update `packages/db/src/schema.ts`
2. Run `bun db:push` to sync changes (development)
3. Or run `bun db:generate` then `bun db:migrate` (production-ready migrations)
