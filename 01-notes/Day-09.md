# Day 09

## Topic

Complete In-Memory CRUD, Path Parameters, Update/Delete Flow, Error Handling, and Response Design

---

## Objectives

- Complete CRUD operations for incomes
- Understand PATCH vs PUT
- Use path parameters correctly
- Use `ParseIntPipe`
- Implement update and delete in Repository
- Handle `404 Not Found`
- Understand `findIndex()`
- Understand arrow function syntax
- Understand `Omit`, `Partial`, and explicit return types
- Keep Controller, Service, and Repository responsibilities separated

---

# Current CRUD Endpoints

```http
POST   /incomes
GET    /incomes
GET    /incomes/:id
PATCH  /incomes/:id
DELETE /incomes/:id
```

CRUD mapping:

```text
Create → POST
Read   → GET
Update → PATCH
Delete → DELETE
```

---

# Current Architecture

```text
HTTP Request
↓
ValidationPipe / ParseIntPipe
↓
Controller
↓
Service
↓
Repository
↓
In-Memory Array
```

Responsibilities:

```text
Controller
→ HTTP request handling

Service
→ Business logic and decisions

Repository
→ Data access

DTO
→ Request data shape

Pipe
→ Runtime validation and transformation
```

---

# Path Parameter

Example:

```http
GET /incomes/6
```

Here:

```text
6
→ Path parameter
```

Controller:

```typescript
@Get(':id')
getIncomeById(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.incomeService.getIncomeById(id);
}
```

---

# Query Parameter vs Path Parameter

Path parameter:

```http
GET /incomes/6
```

Used to identify a specific resource.

Query parameter:

```http
GET /incomes?year=2026
```

Used for filtering, searching, sorting, or options.

---

# ParseIntPipe

URL parameters initially arrive as strings.

Example:

```text
/incomes/6
↓
id = "6"
```

`ParseIntPipe` converts it:

```text
"6"
↓
ParseIntPipe
↓
6
```

Invalid:

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

# 400 vs 404

```text
/incomes/abc
→ Invalid ID format
→ 400 Bad Request
```

```text
/incomes/999
→ Valid numeric ID
→ Resource not found
→ 404 Not Found
```

---

# NotFoundException

Service:

```typescript
getIncomeById(id: number): Income {
  const income = this.incomeRepository.findById(id);

  if (!income) {
    throw new NotFoundException(
      `Income with id ${id} not found`,
    );
  }

  return income;
}
```

The Service makes the decision:

```text
Record exists
→ return it

Record does not exist
→ throw 404
```

---

# PATCH vs PUT

PATCH:

```text
Partial update
```

Example:

```http
PATCH /incomes/6
```

```json
{
  "bonus": 50000
}
```

Only the bonus is updated.

PUT usually represents replacing/updating the complete resource.

---

# UpdateIncomeDto

```typescript
import {
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateIncomeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualIncome?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;
}
```

Both properties are optional because PATCH may update only one field.

---

# Partial

TypeScript:

```typescript
Partial<Income>
```

Means all properties become optional.

Example:

```typescript
type Income = {
  id: number;
  annualIncome: number;
  bonus?: number;
  totalIncome: number;
};
```

After:

```typescript
Partial<Income>
```

Conceptually:

```typescript
{
  id?: number;
  annualIncome?: number;
  bonus?: number;
  totalIncome?: number;
}
```

Useful for partial updates.

---

# Omit

Example:

```typescript
Omit<Income, 'id'>
```

Meaning:

> Use the `Income` type but remove the `id` property.

If:

```typescript
type Income = {
  id: number;
  annualIncome: number;
  bonus?: number;
  totalIncome: number;
};
```

Then:

```typescript
Omit<Income, 'id'>
```

becomes:

```typescript
{
  annualIncome: number;
  bonus?: number;
  totalIncome: number;
}
```

Why?

When creating a new record, the client or Service should not need to provide a server-generated ID.

Flow:

```text
Service
↓
annualIncome, bonus, totalIncome
↓
Repository
↓
Repository generates id
↓
Complete Income
```

---

# Auto Increment ID

Current in-memory implementation:

```typescript
private nextId = 1;
```

When saving:

```typescript
const income: Income = {
  id: this.nextId,
  ...data,
};

this.nextId += 1;
```

Later with a real database, ID generation will normally be handled by the ORM/database.

Examples:

```text
TypeORM
→ @PrimaryGeneratedColumn()

Prisma
→ @id @default(autoincrement())
```

---

# findIndex()

Example:

```typescript
const index = this.incomes.findIndex(
  (income) => income.id === id,
);
```

`findIndex()` searches an array and returns the index of the first matching item.

Example:

```typescript
[
  { id: 1 },
  { id: 2 },
  { id: 3 },
]
```

Searching for ID 2:

```text
index = 1
```

Because array indexes start at 0.

If no item is found:

```text
index = -1
```

---

# Why Check `index === -1`?

```typescript
if (index === -1) {
  return false;
}
```

Meaning:

```text
No matching record found
↓
Nothing can be deleted
↓
Return false
```

---

# Arrow Function

Example:

```typescript
(income) => income.id === id
```

This is an arrow function.

Equivalent normal function:

```typescript
function (income) {
  return income.id === id;
}
```

Meaning:

```text
Take an income
↓
Compare income.id with requested id
↓
Return true or false
```

Short form:

```typescript
(income) => income.id === id
```

Long form:

```typescript
(income) => {
  return income.id === id;
}
```

---

# Delete Repository Method

```typescript
delete(id: number): boolean {
  const index = this.incomes.findIndex(
    (income) => income.id === id,
  );

  if (index === -1) {
    return false;
  }

  this.incomes.splice(index, 1);

  return true;
}
```

`splice(index, 1)` means:

```text
Start from this index
↓
Remove one item
```

---

# Delete Service Method

```typescript
deleteIncome(
  id: number,
): {
  message: string;
  deleted: boolean;
} {
  const result = this.incomeRepository.delete(id);

  if (!result) {
    throw new NotFoundException(
      `Income with id ${id} not found`,
    );
  }

  return {
    message: `Income with id ${id} successfully deleted`,
    deleted: result,
  };
}
```

---

# Explicit Return Type

Example:

```typescript
deleteIncome(
  id: number,
): {
  message: string;
  deleted: boolean;
}
```

The part:

```typescript
{
  message: string;
  deleted: boolean;
}
```

defines the expected return type.

Without it, TypeScript can infer the return type automatically.

Both work:

```typescript
deleteIncome(id: number) {
  return {
    message: 'Deleted',
    deleted: true,
  };
}
```

But explicit return types improve:

- Readability
- Type safety
- Refactoring safety
- Method contracts

---

# Update Business Logic

When annual income or bonus changes, total income must be recalculated.

```typescript
const annualIncome =
  data.annualIncome ?? existingIncome.annualIncome;

const bonus =
  data.bonus ?? existingIncome.bonus ?? 0;

const totalIncome =
  annualIncome + bonus;
```

This logic belongs in the Service because it is business logic.

---

# Repository Responsibility

Repository should not calculate total income.

Repository should only:

```text
save
find
update
delete
```

Service decides what needs to happen.

Repository decides how data is accessed.

---

# Success Status Codes

Typical success status codes:

```text
GET
→ 200 OK

POST
→ 201 Created

PATCH
→ 200 OK

DELETE
→ 200 OK or 204 No Content
```

NestJS gives POST a default `201 Created`.

Status codes can be overridden using:

```typescript
@HttpCode(HttpStatus.OK)
```

---

# Response Design

A predictable response structure is easier for clients to consume.

Example:

```json
{
  "success": true,
  "message": "Income created successfully",
  "data": {
    "id": 1,
    "annualIncome": 1200000,
    "totalIncome": 1200000
  }
}
```

Repository should normally return raw data.

Service can build an application-friendly response.

---

# Important TypeScript Concepts Learned

```text
?
→ Optional property

??
→ Nullish coalescing

...
→ Spread operator

Omit<T, K>
→ Remove selected fields from a type

Partial<T>
→ Make all fields optional

find()
→ Find matching item

findIndex()
→ Find matching item's index

splice()
→ Remove or modify array items

=>
→ Arrow function
```

---

# Current In-Memory CRUD

```http
POST /incomes
GET /incomes
GET /incomes/:id
PATCH /incomes/:id
DELETE /incomes/:id
```

At this stage the application can:

- Create income
- Read all incomes
- Read one income
- Update income
- Delete income
- Validate request data
- Validate path parameters
- Return 400 errors
- Return 404 errors

---

# Limitation

Current data is stored in:

```typescript
private readonly incomes: Income[] = [];
```

This is memory only.

Therefore:

```text
Server running
→ data exists

Server restart
→ data disappears
```

A real database will solve this problem.

---

# Key Learnings

- CRUD is now complete.
- Business logic belongs in Service.
- Data access belongs in Repository.
- Path parameters identify resources.
- `ParseIntPipe` validates numeric IDs.
- `400` means invalid request.
- `404` means resource does not exist.
- `Omit` helps exclude server-generated fields such as IDs.
- `Partial` is useful for partial updates.
- Repository may return simple results such as true/false.
- Service can translate those results into business decisions and HTTP exceptions.

---

# Interview Notes

## Why should SQL/database logic not be written directly in a Service?

Because Service should focus on business logic while Repository isolates data-access concerns.

## What does `findIndex()` return when no match exists?

```text
-1
```

## Why use `Omit<Income, 'id'>`?

Because the ID is generated by the persistence layer and should not be required when creating a new record.

## What is the difference between PATCH and PUT?

PATCH updates part of a resource, while PUT generally represents replacing/updating the entire resource.

## Why use an explicit return type?

To make the method contract clear and allow TypeScript to catch incompatible return values.

---

# My Notes

- Controller should remain thin.
- Service makes business decisions.
- Repository handles data persistence.
- Do not blindly copy code; understand new syntax and type utilities.
- In-memory storage is useful for learning, but real applications need persistent databases.