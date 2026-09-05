# Day 19 — Configuration and Environment

## Learning goals

- Keep credentials and secrets outside source code
- Load configuration with NestJS `ConfigModule`
- Validate environment variables during application startup
- Configure TypeORM and JWT asynchronously
- Support development, test and production environments
- Commit a safe `.env.example` without committing real secrets

## Why environment variables matter

Source code should describe application behavior. Deployment-specific values
belong outside the source:

```text
Application code
  -> reads configuration keys

Environment
  -> supplies database credentials, secrets and ports
```

Hardcoded database credentials or JWT secrets are difficult to rotate and can
be exposed through Git history.

## Environment files

```text
.env                  local fallback values
.env.development      development values
.env.test             test values
.env.production       production values when used locally
.env.example          safe list of required keys
```

Real environment files are ignored by Git. `.env.example` is tracked and must
contain placeholders rather than real secrets.

Environment-specific files are loaded in priority order:

```text
.env.<environment>.local
  -> .env.<environment>
  -> .env
```

## ConfigModule

The root configuration is global and cached:

```ts
ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  envFilePath: [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, ".env"],
  validationSchema: envValidationSchema,
});
```

`ConfigService.getOrThrow()` makes a missing required value fail explicitly
instead of allowing the application to continue with `undefined`.

## Joi validation

Configuration is validated before the application starts. The schema checks:

- `NODE_ENV` is development, test or production.
- `PORT` and `DB_PORT` are valid ports.
- Required database settings are present.
- JWT secrets contain at least 32 characters.
- Token expiry settings have defaults.

Fail-fast validation turns configuration mistakes into clear startup errors.

## Async database configuration

`TypeOrmModule.forRootAsync()` allows Nest to inject `ConfigService` while
creating the database connection:

```ts
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: "postgres",
    host: configService.getOrThrow<string>("DB_HOST"),
    port: configService.getOrThrow<number>("DB_PORT"),
    username: configService.getOrThrow<string>("DB_USERNAME"),
    password: configService.get<string>("DB_PASSWORD") ?? "",
    database: configService.getOrThrow<string>("DB_NAME"),
    autoLoadEntities: true,
    synchronize: false,
  }),
});
```

The TypeORM CLI does not bootstrap the Nest application. Its standalone data
source therefore loads environment values directly and validates its required
database keys.

## Async JWT configuration

`JwtModule.registerAsync()` configures the access-token secret from the same
environment source used by `AuthService`:

```text
AuthService signs access token
  -> JWT_ACCESS_SECRET

JwtAuthGuard verifies access token
  -> JWT_ACCESS_SECRET
```

Refresh-token signing and verification use the separate
`JWT_REFRESH_SECRET`. Separating the secrets allows independent rotation.

## Secret rotation

When a JWT secret changes, tokens signed with the previous secret become
invalid. Users must log in again to receive tokens signed with the new secret.

Secrets should be long, random and never pasted into source code, Git commits,
screenshots or chat messages.

## Environment commands

```bash
NODE_ENV=development npm run start:dev
NODE_ENV=test npm test
NODE_ENV=production npm run start:prod
```

In production, a hosting platform normally supplies environment variables
through its secure configuration dashboard instead of a committed file.

## Key lesson

Configuration is part of application correctness. Loading, validating and
separating configuration prevents silent mistakes and makes the same codebase
safe to run in multiple environments.
