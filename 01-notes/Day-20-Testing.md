# Day 20 — Testing in NestJS

## Learning goals

- Write unit tests with Jest and Nest `TestingModule`
- Mock repositories and external dependencies
- Test success, validation and authorization paths
- Run E2E tests against an isolated test database
- Verify access-token and refresh-token security behavior

## Testing pyramid

```text
Many unit tests -> fewer integration tests -> a small number of E2E tests
```

- **Unit test:** Tests one class in isolation; collaborators are mocked.
- **Integration test:** Checks multiple real components working together.
- **E2E test:** Boots the application and sends real HTTP requests through the
  complete request pipeline.

## Arrange, Act, Assert

```ts
// Arrange
mockUserRepository.findById.mockResolvedValue(user);

// Act
const result = await service.createIncome(1, dto);

// Assert
expect(result.data).toEqual(savedIncome);
```

Keep one behavior per test. Test observable results and collaborator calls,
not private implementation details.

## Dependency mocking

Nest services should be created through `TestingModule`. Replace database and
external dependencies with controlled mocks:

```ts
const module = await Test.createTestingModule({
  providers: [
    IncomeService,
    { provide: IncomeRepository, useValue: mockIncomeRepository },
    { provide: UserRepository, useValue: mockUserRepository },
    { provide: DataSource, useValue: mockDataSource },
  ],
}).compile();
```

Call `jest.clearAllMocks()` before each test so call history cannot leak between
tests.

## Important unit-test cases

- Happy path returns the expected response.
- Optional bonus defaults to zero.
- Missing user or income throws the correct not-found exception.
- A user cannot read, update or delete another user's income.
- Repository methods receive the correct IDs and calculated values.
- Failed deletion produces the expected exception.
- Controller passes authenticated user data and DTOs to the service correctly.

## E2E testing

E2E tests boot `AppModule`, apply the same global validation behavior and call
the HTTP server with Supertest:

```ts
const response = await request(app.getHttpServer())
  .post('/auth/login')
  .send({ email, password })
  .expect(200);
```

The E2E script explicitly selects the test environment:

```json
"test:e2e": "NODE_ENV=test jest --config ./test/jest-e2e.json"
```

Test data must use a separate database such as `bd_tax_test`. Never point an
automated test suite at development or production data.

## Authentication scenarios covered

- Invalid credentials return `401`.
- Missing access token returns `401`.
- A logged-in user can access an allowed protected endpoint.
- A normal user receives `403` from an admin-only endpoint.
- A missing token receives `401` before role authorization runs.
- Refreshing rotates the refresh token.
- Reusing the old refresh token returns `401`.

## Refresh-token rotation lesson

Do not hash long JWT strings with bcrypt. Bcrypt considers only the first 72
bytes, and refresh tokens for the same user may share that prefix. This can
allow an old token to match a newer token hash.

Use a SHA-256 digest for a high-entropy refresh token and compare digests with
`timingSafeEqual()`. Continue using bcrypt for user passwords.

Each refresh token also needs a unique JWT ID:

```ts
{ ...payload, jti: randomUUID() }
```

Without `jti`, identical payloads signed within the same second can produce the
same JWT, which means no actual rotation occurred.

## Test database setup

- `.env.test` contains only test configuration.
- The TypeORM CLI loads `.env.test` when `NODE_ENV=test`.
- `synchronize` remains disabled in production.
- This recovered project has no original initial-schema migration. Its
  disposable test schema was therefore initialized from entities with
  `schema:sync`.
- Do not use `schema:sync` against production.

Useful commands:

```bash
npm test
npm test -- income.service.spec.ts --runInBand
npm run test:e2e
NODE_ENV=test npm run typeorm -- schema:sync -d src/database/data-source.ts
psql -d bd_tax_test -c '\dt'
```

## Interview questions and short answers

### 1. What is the difference between unit and E2E testing?

A unit test isolates one class and mocks its dependencies. An E2E test starts
the application and verifies the complete HTTP flow with real modules and
infrastructure.

### 2. Why mock a repository in a service unit test?

Mocking makes the test fast and deterministic and verifies service logic
without depending on a real database.

### 3. What does `TestingModule` do?

It creates a Nest dependency-injection container for tests and allows real
providers to be replaced with mocks.

### 4. Why use Arrange, Act, Assert?

It separates setup, execution and verification, making a test easier to read
and diagnose.

### 5. What is the difference between `401` and `403`?

`401 Unauthorized` means valid authentication is missing. `403 Forbidden`
means the user is authenticated but lacks permission for the action.

### 6. Why use a separate test database?

Tests can create, change and delete data without damaging development or
production data, and their state can be reset predictably.

### 7. Why should tests avoid shared state?

Shared state makes results depend on execution order and causes flaky tests.
Each test should arrange its own data and clean up afterward.

### 8. Why is refresh-token rotation tested?

Rotation limits replay attacks. After a refresh succeeds, the previously used
token must no longer be accepted.

### 9. Why can bcrypt be unsuitable for hashing JWT refresh tokens?

Bcrypt truncates input after 72 bytes. Long tokens with the same prefix can be
treated as equivalent. A cryptographic digest is appropriate for random,
high-entropy tokens.

### 10. What makes an E2E test production-like but not a production test?

It uses the real application pipeline, but runs with isolated configuration,
controlled test data and non-production infrastructure.

## Production testing checklist

### Test isolation

- [ ] Tests use a dedicated test database and test credentials.
- [ ] No test command can target the production database.
- [ ] Test data is unique, repeatable and cleaned up or reset.
- [ ] Tests do not depend on execution order.

### Unit and integration coverage

- [ ] Critical service happy paths are covered.
- [ ] Validation, not-found, conflict and forbidden paths are covered.
- [ ] Repository and external-service failures are covered.
- [ ] Transaction success and rollback behavior are tested.
- [ ] Mocks are reset between tests.

### Authentication and authorization

- [ ] Login failure and success are tested.
- [ ] Missing, invalid and expired access tokens return `401`.
- [ ] Ownership, roles and permissions return the correct `403` behavior.
- [ ] Refresh-token rotation rejects reuse of an old token.
- [ ] Logout invalidates the stored refresh token.
- [ ] Tokens contain unique `jti` values where rotation is required.
- [ ] Secrets and real tokens never appear in fixtures or logs.

### E2E and API behavior

- [ ] The application boots with production-like global pipes, filters and
      interceptors.
- [ ] Important endpoints verify status code and response shape.
- [ ] Pagination limits and invalid query parameters are tested.
- [ ] Database constraints and migrations are tested on a fresh database.
- [ ] External APIs are stubbed or use safe sandbox accounts.

### CI/CD readiness

- [ ] Formatting, lint, build, unit tests and E2E tests run in CI.
- [ ] CI fails immediately when a required environment variable is missing.
- [ ] Tests have reasonable timeouts and no open handles.
- [ ] Flaky tests are fixed rather than blindly retried.
- [ ] Coverage is monitored for critical code, not treated as the only quality
      metric.
- [ ] Deployment is blocked when required checks fail.

## Day 20 completion criteria

- Unit tests use dependency mocks and cover success and error behavior.
- Controller behavior and authorization boundaries are tested.
- E2E tests run against `NODE_ENV=test` and an isolated database.
- Login, protected routes, admin access and refresh-token rotation are covered.
- The build and relevant test suites pass.

## Key lesson

Good tests protect behavior, security boundaries and contracts. A passing test
suite is useful only when it runs in isolation, exercises meaningful failure
paths and reproduces the way the application is actually used.
