# Day 18 — Error Handling and API Standardization

## Learning goals

- Handle application errors in one place
- Return a consistent error response
- Hide unexpected internal error details from clients
- Log unexpected errors on the server
- Standardize successful API responses
- Create stable application error codes

## Request lifecycle

Successful requests and failed requests follow different global components:

```text
Successful controller result
  -> ResponseInterceptor
  -> standardized success response

Thrown exception
  -> HttpExceptionFilter
  -> standardized error response
```

## Global exception filter

`HttpExceptionFilter` uses `@Catch()` so it can handle both NestJS HTTP
exceptions and unexpected runtime errors.

Known HTTP exceptions retain their status and safe message. Unknown errors
return status `500` and the generic message `Internal server error` so internal
implementation details are not exposed.

Example validation response:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-09-04T19:15:01.144Z",
  "path": "/incomes?page=0&limit=500",
  "message": [
    "page must not be less than 1",
    "limit must not be greater than 100"
  ]
}
```

## Server-side logging

Unexpected errors are logged with the HTTP method, request URL and stack trace:

```ts
if (!isHttpException) {
  const errorDetails =
    exception instanceof Error ? exception.stack : String(exception);

  this.logger.error(`${request.method} ${request.url}`, errorDetails);
}
```

Expected client errors such as `400`, `401`, `403` and `404` do not need an
error-level stack trace for every request.

## Success response interceptor

`ResponseInterceptor` runs after a controller succeeds. It adds common fields
without forcing every controller and service to repeat them:

```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2026-09-04T19:42:05.937Z",
  "path": "/incomes?page=1&limit=100",
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 100,
    "totalPages": 0
  }
}
```

The interceptor recognizes an existing structured response containing `data`,
`message` or `meta`. A raw controller result is wrapped inside `data`.

## Custom application exception

`AppException` carries three pieces of information:

```text
message     -> human-readable explanation
statusCode  -> HTTP meaning
errorCode   -> stable application meaning
```

`IncomeNotFoundException` produces:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Income with id 999999 not found",
  "errorCode": "INCOME_NOT_FOUND"
}
```

A frontend or mobile client should branch on `errorCode`, not the English
message. Messages may later be reworded or translated, while the error code can
remain stable.

## Global registration

The global pipe, filter and interceptor are registered once in `main.ts`:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new ResponseInterceptor());
```

## Key lesson

Services should throw meaningful domain exceptions. Global infrastructure is
responsible for logging and converting results or exceptions into the public API
contract. This keeps controllers and services focused on business logic.
