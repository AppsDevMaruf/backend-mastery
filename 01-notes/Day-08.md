# Day 08

## Topic

NestJS CRUD Foundation, DTO Validation, Service and Repository Pattern

---

## Objectives

- Create feature-based NestJS modules
- Understand Controller, Service and Repository responsibilities
- Receive and validate request bodies
- Use path parameters
- Return proper HTTP status codes
- Store data temporarily using an in-memory repository

---

## NestJS Request Flow

```text
HTTP Request
↓
Route Matching
↓
ValidationPipe / Parameter Pipe
↓
Controller
↓
Service
↓
Repository
↓
Data Source
↓
HTTP Response
```

---

## Module

A module groups related feature components.

Example:

```typescript
@Module({
  controllers: [IncomesController],
  providers: [IncomeService, IncomeRepository],
})
export class IncomeModule {}
```

Responsibilities:

- Registers controllers
- Registers providers
- Groups a feature
- Allows NestJS Dependency Injection to manage dependencies

---

## Controller

The Controller handles the HTTP layer.

Responsibilities:

- Receive HTTP requests
- Read request body
- Read path parameters
- Read query parameters
- Call the Service
- Return the result

Example:

```typescript
@Controller('incomes')
export class IncomesController {
  constructor(
    private readonly incomeService: IncomeService,
  ) {}

  @Post()
  createIncome(
    @Body() body: CreateIncomeDto,
  ) {
    return this.incomeService.createIncome(body);
  }
}
```

Controller should not contain business logic.

---

## Service

The Service contains application and business logic.

Example:

```typescript
createIncome(data: CreateIncomeDto) {
  const totalIncome =
    data.annualIncome + (data.bonus ?? 0);

  const income = {
    ...data,
    totalIncome,
  };

  return this.incomeRepository.save(income);
}
```

Responsibilities:

- Calculations
- Business rules
- Decisions
- Data processing
- Communicating with Repository

---

## Repository

The Repository handles data access.

```typescript
@Injectable()
export class IncomeRepository {
  private readonly incomes: Income[] = [];
  private nextId = 1;

  save(data: Omit<Income, 'id'>): Income {
    const income: Income = {
      id: this.nextId,
      ...data,
    };

    this.nextId += 1;
    this.incomes.push(income);

    return income;
  }

  findAll(): Income[] {
    return this.incomes;
  }

  findById(id: number): Income | undefined {
    return this.incomes.find(
      (income) => income.id === id,
    );
  }
}
```

Current repository uses an in-memory array.

The data will be lost when the server restarts.

---

## Dependency Injection

NestJS creates and manages provider instances.

```typescript
constructor(
  private readonly incomeService: IncomeService,
) {}
```

We do not need:

```typescript
const incomeService = new IncomeService();
```

NestJS injects the registered dependency.

---

## DTO

DTO means Data Transfer Object.

It defines the expected shape of incoming data.

```typescript
export class CreateIncomeDto {
  annualIncome!: number;
  bonus?: number;
}
```

TypeScript types alone do not provide runtime validation.

---

## DTO Validation

```typescript
import {
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateIncomeDto {
  @IsNumber({}, {
    message: 'Annual income must be a number',
  })
  @Min(0, {
    message: 'Annual income cannot be negative',
  })
  annualIncome!: number;

  @IsOptional()
  @IsNumber({}, {
    message: 'Bonus must be a number',
  })
  @Min(0, {
    message: 'Bonus cannot be negative',
  })
  bonus?: number;
}
```

### Decorators

```text
@IsNumber()
→ The value must be a number

@Min(0)
→ The value cannot be less than zero

@IsOptional()
→ The property may be omitted
```

---

## ValidationPipe

Global validation is enabled in `main.ts`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
);
```

Flow:

```text
Incoming Request
↓
ValidationPipe
↓
DTO validation rules
├── Invalid → 400 Bad Request
└── Valid → Controller
```

---

## Optional vs Nullable

```typescript
bonus?: number;
```

Means the field is optional.

```typescript
bonus: number | null;
```

Means the field must exist, but its value may be null.

```typescript
bonus?: number | null;
```

Means optional and nullable.

---

## Nullish Coalescing Operator

```typescript
data.bonus ?? 0
```

Meaning:

```text
If bonus is not null or undefined
→ use bonus

Otherwise
→ use 0
```

Example:

```typescript
const totalIncome =
  data.annualIncome + (data.bonus ?? 0);
```

---

## Spread Operator

```typescript
{
  ...data,
  totalIncome,
}
```

`...data` copies all properties from the original object.

Example:

```typescript
const data = {
  annualIncome: 1200000,
  bonus: 100000,
};
```

Result:

```typescript
{
  ...data,
  totalIncome: 1300000,
}
```

Becomes:

```json
{
  "annualIncome": 1200000,
  "bonus": 100000,
  "totalIncome": 1300000
}
```

---

## POST /incomes

Request:

```http
POST /incomes
Content-Type: application/json
```

```json
{
  "annualIncome": 1200000,
  "bonus": 100000
}
```

Response:

```json
{
  "id": 1,
  "annualIncome": 1200000,
  "bonus": 100000,
  "totalIncome": 1300000
}
```

NestJS uses `201 Created` by default for successful POST requests.

---

## GET /incomes

```http
GET /incomes
```

Returns all saved income records.

```json
[
  {
    "id": 1,
    "annualIncome": 1200000,
    "bonus": 100000,
    "totalIncome": 1300000
  }
]
```

---

## Path Parameter

```http
GET /incomes/1
```

Here, `1` is a path parameter.

```typescript
@Get(':id')
getIncomeById(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.incomeService.getIncomeById(id);
}
```

---

## ParseIntPipe

URL parameters initially arrive as strings.

```text
/incomes/6
→ id = "6"
```

`ParseIntPipe` converts the value to a number.

```text
"6"
↓
ParseIntPipe
↓
6
```

Invalid value:

```http
GET /incomes/abc
```

Response:

```json
{
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 400 vs 404

```text
GET /incomes/abc
→ ID format is invalid
→ 400 Bad Request
```

```text
GET /incomes/999
→ ID is valid but the record does not exist
→ 404 Not Found
```

---

## NotFoundException

```typescript
getIncomeById(id: number): Income {
  const income =
    this.incomeRepository.findById(id);

  if (!income) {
    throw new NotFoundException(
      `Income with ID ${id} not found`,
    );
  }

  return income;
}
```

NestJS converts the exception into an HTTP 404 response.

---

## Source and Dist Folder

```text
src/
→ TypeScript source code written by the developer

dist/
→ Generated JavaScript created after compilation
```

Always edit files inside `src`.

Do not manually edit `dist`.

---

## Save and Watch Mode

`npm run start:dev` watches saved file changes.

```text
Edit code
↓
Save with Cmd + S
↓
Watcher detects change
↓
NestJS recompiles
↓
Updated code runs
```

Unsaved changes are not compiled.

---

## HTTP Success Status Codes

```text
GET
→ 200 OK

POST
→ 201 Created by default in NestJS

PATCH / PUT
→ Usually 200 OK

DELETE
→ Usually 200 OK or 204 No Content
```

The status code can be changed with:

```typescript
@HttpCode(HttpStatus.OK)
```

---

## Current API Endpoints

```http
GET /profile

POST /incomes

GET /incomes

GET /incomes/:id
```

---

## Current Architecture

```text
Client
↓
ValidationPipe / ParseIntPipe
↓
IncomesController
↓
IncomeService
↓
IncomeRepository
↓
In-memory array
```

---

## Key Learnings

- Controller handles HTTP concerns.
- Service handles business logic.
- Repository handles data access.
- DTO defines incoming data shape.
- ValidationPipe enforces DTO rules at runtime.
- ParseIntPipe validates and converts numeric path parameters.
- An in-memory array is temporary and is cleared after a server restart.
- TypeScript `any` should be avoided where possible.
- Files must be saved before the development watcher recompiles them.

---

## Interview Notes

### What is a DTO?

A DTO defines the expected structure of data transferred between the client and server.

### Does a TypeScript type validate HTTP data?

No. TypeScript types work at compile time. Runtime validation requires tools such as `class-validator` and `ValidationPipe`.

### What is Dependency Injection?

Dependency Injection allows NestJS to create and provide class dependencies instead of developers manually creating their instances.

### Why use a Repository?

A Repository separates database or data-access operations from business logic.

### Why use ParseIntPipe?

It converts a string path parameter to a number and rejects invalid numeric values with a 400 response.

---

## My Notes

- Business logic stays in Service.
- Database access stays in Repository.
- Invalid input should be rejected before Controller logic executes.
- `400` means the request itself is invalid.
- `404` means the requested resource does not exist.