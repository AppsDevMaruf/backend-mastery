অবশ্যই। নিচেরটা **একবারে পুরোটা copy করে `Day-10.md` file-এ paste** করতে পারো।

````md
# Day 10 — PostgreSQL + TypeORM + CRUD Integration

## Goal

আজকের লক্ষ্য ছিল:

- PostgreSQL fundamentals বোঝা
- Relational database basics শেখা
- Table / Row / Column / Primary Key বোঝা
- PostgreSQL install এবং run করা
- `psql` দিয়ে database connect করা
- `bd_tax` database তৈরি/ব্যবহার করা
- `incomes` table তৈরি করা
- SQL CRUD manually practice করা
- NULL vs 0 বোঝা
- PostgreSQL sequence / SERIAL বোঝা
- MySQL vs PostgreSQL difference বোঝা
- ORM concept বোঝা
- TypeORM + PostgreSQL driver install করা
- NestJS → PostgreSQL connection করা
- Entity mapping করা
- Repository-কে in-memory থেকে real DB-backed করা
- Promise / async / await বোঝা
- DTO vs Entity পরিষ্কার করা
- `save()` vs `update()` বোঝা
- PATCH vs PUT বোঝা
- Full CRUD PostgreSQL-এ complete করা

---

# 1. PostgreSQL কী?

PostgreSQL একটি relational database management system — RDBMS।

এখানে data table আকারে রাখা হয়।

Example:

```text
incomes

id | annual_income | bonus | total_income
---+---------------+-------+-------------
1  | 1200000       | 100000| 1300000
````

PostgreSQL persistent storage ব্যবহার করে।

Meaning:

```text
Server restart
↓
App restart
↓
Data still exists
```

---

# 2. In-Memory vs PostgreSQL

আগে:

```text
IncomeRepository
↓
Array in RAM
↓
Server restart
↓
Data lost
```

এখন:

```text
IncomeRepository
↓
TypeORM
↓
PostgreSQL
↓
Persistent Data
```

---

# 3. Database Basic Terms

## Table

Related data collection।

Example:

```text
incomes
users
```

---

## Column

Table-এর field।

Example:

```text
id
annual_income
bonus
total_income
```

---

## Row

একটা complete record।

Example:

```text
id = 1
annual_income = 1200000
bonus = 100000
total_income = 1300000
```

---

# 4. Primary Key

Primary Key একটি row uniquely identify করে।

Example:

```text
id
```

Primary Key:

```text
unique
not null
stable identity
```

---

# 5. Foreign Key Intro

Foreign Key অন্য table-এর Primary Key reference করে।

Example:

```text
incomes.user_id
↓
users.id
```

এই topic Day 11-এ detail করা হয়েছে।

---

# 6. SQL CRUD Mapping

REST API এবং SQL-এর mapping:

```text
POST
→ INSERT

GET
→ SELECT

PATCH / PUT
→ UPDATE

DELETE
→ DELETE
```

---

# 7. Homebrew

Homebrew macOS package manager।

Example:

```bash
brew install postgresql@17
```

Useful commands:

```bash
brew install
brew list
brew upgrade
brew uninstall
```

---

# 8. PostgreSQL Install

Command:

```bash
brew install postgresql@17
```

Installed PostgreSQL version:

```text
PostgreSQL 17
```

---

# 9. PostgreSQL Service Start

Installed software আর running service এক জিনিস না।

Start:

```bash
brew services start postgresql@17
```

Check:

```bash
brew services list
```

Expected:

```text
postgresql@17 started
```

---

# 10. PostgreSQL Version Check

```bash
psql --version
```

Example:

```text
psql (PostgreSQL) 17.x
```

---

# 11. psql কী?

`psql` হলো PostgreSQL command-line client।

Flow:

```text
Terminal
↓
psql
↓
PostgreSQL Server
↓
Database
```

---

# 12. PostgreSQL Connect

```bash
psql postgres
```

Prompt:

```text
postgres=#
```

---

# 13. psql Meta Commands

Database list:

```sql
\l
```

Connect database:

```sql
\c bd_tax
```

Table list:

```sql
\dt
```

Describe table:

```sql
\d incomes
```

Exit:

```sql
\q
```

Important:

```text
\l
\c
\dt
\d
\q
```

এগুলো SQL না।

এগুলো `psql` meta-command।

---

# 14. Database Connection

`bd_tax` database connect:

```sql
\c bd_tax
```

Expected:

```text
You are now connected to database "bd_tax"
```

Prompt:

```text
bd_tax=#
```

---

# 15. incomes Table Create

```sql
CREATE TABLE incomes (
  id SERIAL PRIMARY KEY,
  annual_income NUMERIC NOT NULL,
  bonus NUMERIC,
  total_income NUMERIC NOT NULL
);
```

---

# 16. Table Structure Explanation

```text
id SERIAL PRIMARY KEY
→ auto-generated unique ID

annual_income NUMERIC NOT NULL
→ required numeric value

bonus NUMERIC
→ optional / nullable

total_income NUMERIC NOT NULL
→ required numeric value
```

---

# 17. Table Verify

```sql
\dt
```

Expected:

```text
public | incomes | table
```

Structure:

```sql
\d incomes
```

---

# 18. SERIAL কী?

`SERIAL` PostgreSQL-এ auto-increment-like behavior দেয়।

Behind the scenes sequence use করে।

Example:

```text
incomes_id_seq
```

Database schema-তে দেখা যায়:

```text
nextval('incomes_id_seq'::regclass)
```

---

# 19. Sequence

Insert attempt হলে sequence next value দেয়।

Example:

```text
first insert
→ id 1

second insert
→ id 2

third insert
→ id 3
```

---

# 20. First INSERT

```sql
INSERT INTO incomes (
  annual_income,
  bonus,
  total_income
)
VALUES (
  1200000,
  100000,
  1300000
);
```

Expected:

```text
INSERT 0 1
```

Meaning:

```text
1 row inserted
```

---

# 21. SELECT

```sql
SELECT * FROM incomes;
```

Example result:

```text
id | annual_income | bonus  | total_income
---+---------------+--------+-------------
1  | 1200000       | 100000 | 1300000
```

---

# 22. Specific Row SELECT

```sql
SELECT * FROM incomes
WHERE id = 1;
```

`WHERE` condition matching row select করে।

---

# 23. Optional bonus

Insert:

```sql
INSERT INTO incomes (
  annual_income,
  total_income
)
VALUES (
  800000,
  800000
);
```

এখানে bonus দেওয়া হয়নি।

Result:

```text
bonus = NULL
```

---

# 24. NULL কী?

NULL মানে:

```text
value নেই
unknown
not provided
```

NULL এবং 0 এক নয়।

---

# 25. NULL vs 0

```text
bonus = NULL
→ bonus দেওয়া হয়নি

bonus = 0
→ bonus value explicitly zero
```

---

# 26. NULL Query

```sql
SELECT * FROM incomes
WHERE bonus IS NULL;
```

Bonus থাকা rows:

```sql
SELECT * FROM incomes
WHERE bonus IS NOT NULL;
```

Wrong:

```sql
bonus = NULL
```

Correct:

```sql
bonus IS NULL
```

---

# 27. UPDATE

```sql
UPDATE incomes
SET bonus = 50000,
    total_income = 850000
WHERE id = 2;
```

---

# 28. UPDATE Warning

এইটা dangerous:

```sql
UPDATE incomes
SET bonus = 50000;
```

কারণ:

```text
WHERE নেই
↓
সব row update হতে পারে
```

Production habit:

```text
UPDATE / DELETE
→ WHERE double-check
```

---

# 29. DELETE

```sql
DELETE FROM incomes
WHERE id = 2;
```

Expected:

```text
DELETE 1
```

Meaning:

```text
1 row deleted
```

---

# 30. DELETE Warning

Dangerous:

```sql
DELETE FROM incomes;
```

Meaning:

```text
সব row delete
```

---

# 31. SQL CRUD Complete

```text
INSERT ✅
SELECT ✅
UPDATE ✅
DELETE ✅
```

---

# 32. REST → SQL Mental Mapping

```text
POST /incomes
→ INSERT INTO incomes

GET /incomes
→ SELECT * FROM incomes

PATCH /incomes/:id
→ UPDATE incomes

DELETE /incomes/:id
→ DELETE FROM incomes
```

---

# 33. Failed Insert এবং ID Gap

Important:

Failed insert হলেও sequence ID consume হতে পারে।

Example:

```text
id 1
→ success

id 2
→ failed

id 3
→ failed

id 4
→ success
```

Table-এ দেখা যাবে:

```text
1
4
```

---

# 34. কেন ID Gap হয়?

Insert attempt-এর সময়:

```text
nextval(...)
```

sequence value consume করে।

পরে insert fail হলেও সেই sequence value rollback নাও হয়।

---

# 35. Primary Key Continuous হওয়া দরকার?

না।

Primary Key-এর কাজ:

```text
unique হওয়া
stable identity হওয়া
```

Continuous হওয়া mandatory না।

Valid IDs:

```text
1
13
14
20
31
```

---

# 36. Database ID vs Display Serial

Database ID:

```text
technical identifier
```

Display serial:

```text
1
2
3
4
```

UI serial database ID হতে হবে এমন না।

---

# 37. MySQL vs PostgreSQL

দুটোই relational database।

Common concepts:

```text
SELECT
INSERT
UPDATE
DELETE
JOIN
WHERE
GROUP BY
ORDER BY
INDEX
TRANSACTION
```

---

# 38. PostgreSQL Strength

PostgreSQL strong in:

```text
advanced SQL
constraints
relationships
transactions
JSONB
complex queries
extensibility
data integrity
```

আমাদের backend learning-এর জন্য PostgreSQL use করা হয়েছে।

---

# 39. ORM

ORM = Object Relational Mapper।

Meaning:

```text
TypeScript Object/Class
↕
Relational Database
```

---

# 40. ORM Mapping

```text
Class
↔ Table

Object
↔ Row

Property
↔ Column

Relation
↔ Foreign Key

Repository method
↔ SQL query
```

---

# 41. ORM Example

TypeORM:

```ts
repository.find()
```

Conceptually:

```sql
SELECT * FROM incomes;
```

---

# 42. ORM Raw SQL-এর Replacement?

না।

Correct mental model:

```text
ORM
→ Raw SQL abstraction
```

SQL knowledge এখনও important।

---

# 43. TypeORM Install

Project folder থেকে:

```bash
npm install @nestjs/typeorm typeorm pg
```

Packages:

```text
@nestjs/typeorm
→ NestJS + TypeORM integration

typeorm
→ ORM library

pg
→ PostgreSQL driver
```

---

# 44. Full DB Flow

```text
NestJS
↓
@nestjs/typeorm
↓
TypeORM
↓
pg
↓
PostgreSQL
```

---

# 45. npm audit

Security issues check:

```bash
npm audit
```

Fix:

```bash
npm audit fix
```

Avoid blindly:

```bash
npm audit fix --force
```

---

# 46. EADDRINUSE

Error:

```text
EADDRINUSE: address already in use :::3000
```

Meaning:

```text
Port 3000 already occupied
```

Check:

```bash
lsof -i :3000
```

Kill:

```bash
kill PID
```

Better:

```text
running server terminal
→ Ctrl + C
```

---

# 47. PostgreSQL Connection in AppModule

```ts
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'marufalam',
  database: 'bd_tax',
  password: '',
  autoLoadEntities: true,
  synchronize: false,
})
```

---

# 48. Connection Config Meaning

```text
type
→ database type

host
→ database server

port
→ PostgreSQL default port 5432

username
→ DB user

database
→ bd_tax

autoLoadEntities
→ registered entities load

synchronize: false
→ TypeORM schema automatically change করবে না
```

---

# 49. Why synchronize false?

Learning / production-style approach:

```text
Entity change
≠
automatic DB schema change
```

Later:

```text
Migration
```

শেখা হবে।

---

# 50. Entity কী?

Entity হলো TypeScript class যেটা database table-এর সাথে map করা থাকে।

Entity নিজে table না।

---

# 51. IncomeEntity

```ts
@Entity('incomes')
export class IncomeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'numeric',
    name: 'annual_income',
  })
  annualIncome!: number;

  @Column({
    type: 'numeric',
    name: 'bonus',
    nullable: true,
  })
  bonus?: number;

  @Column({
    type: 'numeric',
    name: 'total_income',
  })
  totalIncome!: number;
}
```

---

# 52. Entity Mapping

```text
IncomeEntity
↔ incomes

id
↔ id

annualIncome
↔ annual_income

bonus
↔ bonus

totalIncome
↔ total_income
```

---

# 53. @PrimaryGeneratedColumn

```ts
@PrimaryGeneratedColumn()
id!: number;
```

Meaning:

```text
Primary Key
+
Database-generated ID
```

---

# 54. @Column name Mapping

TypeScript:

```ts
annualIncome
```

Database:

```text
annual_income
```

Mapping:

```ts
@Column({
  name: 'annual_income',
})
```

---

# 55. Definite Assignment Assertion

```ts
id!: number;
```

`!` TypeScript-কে বলে:

```text
এই property constructor-এ manually assign করছি না
কিন্তু runtime/framework populate করবে
```

---

# 56. forRoot vs forFeature

Global database connection:

```ts
TypeOrmModule.forRoot(...)
```

Feature-specific Entity registration:

```ts
TypeOrmModule.forFeature([
  IncomeEntity,
])
```

---

# 57. Architecture

```text
AppModule
└── forRoot()
    └── PostgreSQL Connection

IncomeModule
└── forFeature([IncomeEntity])
    └── IncomeEntity Repository Access
```

---

# 58. TypeORM Repository

Built-in:

```ts
Repository<IncomeEntity>
```

Custom:

```ts
IncomeRepository
```

Difference:

```text
Repository<IncomeEntity>
→ TypeORM built-in repository

IncomeRepository
→ আমাদের custom data-access layer
```

---

# 59. Repository Injection

```ts
constructor(
  @InjectRepository(IncomeEntity)
  private readonly incomeRepository:
    Repository<IncomeEntity>,
) {}
```

---

# 60. Real Database Repository

```ts
@Injectable()
export class IncomeRepository {
  constructor(
    @InjectRepository(IncomeEntity)
    private readonly incomeRepository:
      Repository<IncomeEntity>,
  ) {}

  saveIncome(
    data: Omit<IncomeEntity, 'id'>,
  ): Promise<IncomeEntity> {
    const income =
      this.incomeRepository.create(data);

    return this.incomeRepository.save(
      income,
    );
  }

  findAll(): Promise<IncomeEntity[]> {
    return this.incomeRepository.find();
  }

  findById(
    id: number,
  ): Promise<IncomeEntity | null> {
    return this.incomeRepository.findOne({
      where: { id },
    });
  }

  async delete(
    id: number,
  ): Promise<boolean> {
    const result =
      await this.incomeRepository.delete(id);

    return (result.affected ?? 0) > 0;
  }

  async update(
    id: number,
    data: Partial<
      Omit<IncomeEntity, 'id'>
    >,
  ): Promise<IncomeEntity | null> {
    await this.incomeRepository.update(
      id,
      data,
    );

    return this.incomeRepository.findOne({
      where: { id },
    });
  }
}
```

---

# 61. Promise

Promise future async result represent করে।

Example:

```ts
Promise<IncomeEntity[]>
```

Meaning:

```text
এখন result ready না
↓
future-এ IncomeEntity[] আসবে
```

---

# 62. Promise States

```text
pending
→ কাজ চলছে

fulfilled
→ success

rejected
→ failed
```

---

# 63. Promise Forward করা

```ts
findAll(): Promise<IncomeEntity[]> {
  return this.incomeRepository.find();
}
```

এখানে:

```text
TypeORM Promise
↓
Repository
↓
Caller
```

Repository result modify করছে না।

Promise direct forward করছে।

---

# 64. Caller কী?

Caller = যে function অন্য function-কে call করে।

Example:

```text
IncomeService
↓ calls
IncomeRepository.findAll()
↓ calls
TypeORM repository.find()
```

Service হলো `findAll()`-এর caller।

---

# 65. async / await

Rule:

```text
Promise direct forward
→ await দরকার নেই

Promise result current function-এ use
→ await দরকার
```

---

# 66. No await Example

```ts
findAll(): Promise<IncomeEntity[]> {
  return this.incomeRepository.find();
}
```

Result modify/check করছি না।

তাই:

```text
async/await unnecessary
```

---

# 67. await Example

```ts
async delete(
  id: number,
): Promise<boolean> {
  const result =
    await this.incomeRepository.delete(id);

  return (result.affected ?? 0) > 0;
}
```

এখানে resolved result দরকার।

কারণ:

```text
result.affected
```

check করছি।

---

# 68. Why async?

`await` ব্যবহার করতে function `async` হতে হয়।

Example:

```ts
async function example() {
  const result =
    await somethingAsync();
}
```

---

# 69. async Function Return

```ts
async function getNumber():
  Promise<number> {
  return 10;
}
```

Caller পায়:

```text
Promise<number>
```

---

# 70. Android Analogy

Kotlin:

```kotlin
suspend fun getIncomes():
    List<Income>
```

TypeScript:

```ts
async getIncomes():
  Promise<IncomeEntity[]>
```

Conceptually:

```text
I/O result async
```

---

# 71. Delete Result

```ts
return (result.affected ?? 0) > 0;
```

Meaning:

```text
affected = 1
→ true

affected = 0
→ false

affected = undefined
→ 0
→ false
```

---

# 72. ?? Operator

`??` = nullish coalescing।

Example:

```ts
result.affected ?? 0
```

Meaning:

```text
affected value থাকলে
→ use it

null / undefined হলে
→ 0
```

---

# 73. DTO

DTO = Data Transfer Object।

API request contract হিসেবে কাজ করে।

Example:

```ts
export class CreateIncomeDto {
  @IsNumber()
  @Min(0)
  annualIncome!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;
}
```

---

# 74. DTO Responsibility

DTO বলে:

```text
Client কী field পাঠাতে পারবে
Required field কী
Optional field কী
Validation কী
```

---

# 75. Entity Responsibility

Entity বলে:

```text
Database table mapping
Column name
Column type
Nullable
Primary Key
Relation
```

---

# 76. DTO vs Entity

```text
DTO
→ বাইরে থেকে কী আসবে

Entity
→ database-এ কীভাবে represent হবে
```

---

# 77. Why Entity Request Body হিসেবে use না করি?

Bad:

```ts
@Body() body: IncomeEntity
```

Better:

```ts
@Body() body: CreateIncomeDto
```

কারণ:

```text
Request Contract
≠
Database Model
```

---

# 78. Service Business Logic

Client:

```json
{
  "annualIncome": 80,
  "bonus": 20
}
```

Service:

```ts
const bonus = data.bonus ?? 0;

const totalIncome =
  data.annualIncome + bonus;
```

---

# 79. Why totalIncome Client পাঠায় না?

কারণ:

```text
totalIncome
→ derived business value
```

Backend calculate করবে।

---

# 80. Repository Save

```ts
saveIncome(
  data: Omit<IncomeEntity, 'id'>,
): Promise<IncomeEntity> {
  const income =
    this.incomeRepository.create(data);

  return this.incomeRepository.save(
    income,
  );
}
```

---

# 81. create() vs save()

```ts
this.incomeRepository.create(data)
```

শুধু entity object তৈরি করে।

DB hit করে না।

```ts
this.incomeRepository.save(income)
```

database operation করে।

---

# 82. save() Behavior

TypeORM `save()`:

```text
ID না থাকলে
→ INSERT

Existing ID থাকলে
→ UPDATE করতে পারে
```

---

# 83. save() দিয়ে Update Problem

আমরা একবার update-এর সময়:

```ts
saveIncome({
  annualIncome,
  bonus,
  totalIncome,
});
```

call করেছিলাম।

এখানে `id` ছিল না।

TypeORM বুঝেছিল:

```text
new entity
```

তাই:

```text
INSERT
→ new ID
```

---

# 84. update()

Explicit update:

```ts
repository.update(id, data)
```

Meaning:

```text
specific existing row update করো
```

---

# 85. Repository Update

```ts
async update(
  id: number,
  data: Partial<
    Omit<IncomeEntity, 'id'>
  >,
): Promise<IncomeEntity | null> {
  await this.incomeRepository.update(
    id,
    data,
  );

  return this.incomeRepository.findOne({
    where: { id },
  });
}
```

---

# 86. Why await in update()?

দুইটা DB operation:

```text
1. UPDATE
2. SELECT
```

Second operation-এর আগে first complete হওয়া দরকার।

তাই:

```ts
await this.incomeRepository.update(...)
```

---

# 87. Partial

```ts
Partial<T>
```

সব property optional করে।

Example:

```ts
{
  annualIncome?: number;
  bonus?: number;
  totalIncome?: number;
}
```

PATCH-এর জন্য useful।

---

# 88. Omit

```ts
Omit<IncomeEntity, 'id'>
```

মানে:

```text
IncomeEntity-এর সব field
except id
```

---

# 89. Partial + Omit

```ts
Partial<
  Omit<IncomeEntity, 'id'>
>
```

Meaning:

```text
id remove
+
remaining fields optional
```

---

# 90. Why id Omit?

Primary Key caller update data-এর অংশ হিসেবে modify করবে না।

```text
id
→ resource identity
```

---

# 91. PATCH

PATCH = partial update।

Example:

Existing:

```json
{
  "annualIncome": 1000,
  "bonus": 200,
  "totalIncome": 1200
}
```

PATCH:

```json
{
  "bonus": 300
}
```

Result:

```json
{
  "annualIncome": 1000,
  "bonus": 300,
  "totalIncome": 1300
}
```

---

# 92. PUT

PUT conceptually full resource replacement।

Example:

```json
{
  "annualIncome": 2000,
  "bonus": 500
}
```

Existing resource-এর new representation হিসেবে treat করা হয়।

---

# 93. PATCH vs PUT

```text
PATCH
→ partial update

PUT
→ full replacement semantics
```

---

# 94. UpdateIncomeDto

PATCH-এর জন্য fields optional হওয়া উচিত।

Conceptually:

```ts
export class UpdateIncomeDto {
  annualIncome?: number;
  bonus?: number;
}
```

---

# 95. ReplaceIncomeDto

PUT-এর জন্য complete representation expect করা যায়।

Conceptually:

```ts
export class ReplaceIncomeDto {
  annualIncome!: number;
  bonus!: number;
}
```

---

# 96. Service Update Logic

```ts
const existingIncome =
  await this.getIncomeById(id);

const annualIncome =
  data.annualIncome ??
  existingIncome.data.annualIncome;

const bonus =
  data.bonus ??
  existingIncome.data.bonus ??
  0;

const totalIncome =
  annualIncome + bonus;
```

---

# 97. Controller

Controller-এর কাজ:

```text
HTTP request receive
Body / Param / Query read
Service call
Response return
```

Example:

```ts
@Post()
createIncome(
  @Body() body: CreateIncomeDto,
) {
  return this.incomeService
    .createIncome(body);
}
```

---

# 98. Service

Service-এর কাজ:

```text
Business logic
Calculation
Decision making
Application rules
Orchestration
```

Example:

```text
totalIncome calculate
```

---

# 99. Repository

Repository-এর কাজ:

```text
Database access
Insert
Select
Update
Delete
TypeORM interaction
```

---

# 100. TypeORM

TypeORM-এর কাজ:

```text
Entity ↔ Table mapping
Object ↔ Row mapping
Repository API
SQL abstraction
```

---

# 101. PostgreSQL

PostgreSQL-এর কাজ:

```text
Actual persistent storage
SQL execution
Constraints
Indexes
Transactions
```

---

# 102. Full Request Flow

```text
Client / Postman
↓
HTTP Request
↓
Controller
↓
DTO Validation
↓
Service
↓
Business Logic
↓
Repository
↓
TypeORM
↓
PostgreSQL
↓
Result
↓
Repository
↓
Service
↓
Controller
↓
HTTP JSON Response
↓
Client / UI
```

---

# 103. POST Flow

```text
POST /incomes
↓
CreateIncomeDto
↓
Controller
↓
Service
↓
totalIncome calculate
↓
Repository.saveIncome()
↓
TypeORM save()
↓
PostgreSQL INSERT
↓
Response
```

---

# 104. GET Flow

```text
GET /incomes
↓
Controller
↓
Service
↓
Repository.findAll()
↓
TypeORM find()
↓
PostgreSQL SELECT
↓
Response
```

---

# 105. PATCH Flow

```text
PATCH /incomes/:id
↓
Controller
↓
Service
↓
existing income load
↓
new total calculate
↓
Repository.update()
↓
PostgreSQL UPDATE
↓
updated row
```

---

# 106. DELETE Flow

```text
DELETE /incomes/:id
↓
Controller
↓
Service
↓
Repository.delete()
↓
TypeORM delete()
↓
PostgreSQL DELETE
↓
affected check
↓
true / false
```

---

# 107. NotFoundException

Existing row না থাকলে:

```ts
throw new NotFoundException(
  `Income with id ${id} not found`,
);
```

HTTP:

```text
404 Not Found
```

---

# 108. ParseIntPipe

Controller:

```ts
@Param('id', ParseIntPipe)
id: number
```

Meaning:

```text
/incomes/abc
→ 400

/incomes/999
→ valid integer
→ service check
→ maybe 404
```

---

# 109. 201 vs 200

NestJS POST default:

```text
201 Created
```

GET:

```text
200 OK
```

PATCH:

```text
200 OK
```

DELETE:

```text
200 OK
```

or API design অনুযায়ী:

```text
204 No Content
```

---

# 110. Response Design

Example:

```json
{
  "success": true,
  "message": "Income created successfully",
  "data": {}
}
```

Repository raw DB data দেয়।

Service response structure বানাতে পারে।

---

# 111. Current Architecture

```text
Controller
↓
Service
↓
Custom IncomeRepository
↓
TypeORM Repository<IncomeEntity>
↓
PostgreSQL
```

---

# 112. CRUD Completed

Create:

```text
POST /incomes
```

Read all:

```text
GET /incomes
```

Read one:

```text
GET /incomes/:id
```

Update:

```text
PATCH /incomes/:id
```

Replace:

```text
PUT /incomes/:id
```

Delete:

```text
DELETE /incomes/:id
```

---

# 113. CRUD SQL Mapping

```text
Create
POST
INSERT

Read
GET
SELECT

Update
PATCH / PUT
UPDATE

Delete
DELETE
DELETE
```

---

# 114. CRUD Recap — DTO vs Entity

```text
CreateIncomeDto
→ Client request contract

IncomeEntity
→ Database mapping
```

---

# 115. CRUD Recap — Promise Rule

```text
Promise শুধু forward করছি
→ await না

Promise result নিয়ে logic করছি
→ await
```

---

# 116. CRUD Recap — save vs update

```text
save()
→ insert/update depending on entity identity

update()
→ explicit existing row update
```

---

# 117. CRUD Recap — NULL

```text
NULL
→ value নেই

0
→ value আছে, zero
```

---

# 118. CRUD Recap — Sequence

```text
Failed insert
→ ID consume হতে পারে
→ gap normal
```

---

# 119. CRUD Recap — Layers

```text
Controller
→ HTTP

Service
→ Business Logic

Repository
→ Database Access

TypeORM
→ ORM Mapping

PostgreSQL
→ Storage
```

---

# 120. Simple Architecture Memory

```text
Controller request নেয়
Service বুঝে
Repository database-এ কাজ করে
Database data রাখে
```

---

# 121. Day 10 Key Takeaways

1. PostgreSQL একটি relational persistent database।
2. Table related records store করে।
3. Row একটি record।
4. Column field represent করে।
5. Primary Key row uniquely identify করে।
6. SQL CRUD REST CRUD-এর underlying DB operation।
7. `INSERT` create করে।
8. `SELECT` read করে।
9. `UPDATE` modify করে।
10. `DELETE` remove করে।
11. `NULL` এবং `0` এক নয়।
12. `SERIAL` sequence-based ID generate করে।
13. Failed insert ID gap তৈরি করতে পারে।
14. Primary Key continuous হওয়া জরুরি না।
15. ORM application object এবং relational DB map করে।
16. TypeORM SQL abstraction দেয়।
17. `@nestjs/typeorm` NestJS integration।
18. `pg` PostgreSQL driver।
19. `TypeOrmModule.forRoot()` DB connection configure করে।
20. `TypeOrmModule.forFeature()` Entity repository feature module-এ register করে।
21. Entity database table-এর TypeScript mapping।
22. DTO request contract।
23. DTO এবং Entity আলাদা responsibility।
24. Repository data access handle করে।
25. Service business logic handle করে।
26. Promise future async result represent করে।
27. `await` resolved result দরকার হলে use হয়।
28. `async` function Promise return করে।
29. `save()` ID না থাকলে new row insert করতে পারে।
30. `update()` explicit existing row update করে।
31. `Partial` fields optional করে।
32. `Omit` specified field remove করে।
33. PATCH partial update।
34. PUT full replacement semantics।
35. Controller → Service → Repository → TypeORM → PostgreSQL flow complete।
36. NestJS + PostgreSQL CRUD complete।

---

# 122. Day 10 Status

Completed:

* PostgreSQL Intro ✅
* RDBMS Concept ✅
* Table / Row / Column ✅
* Primary Key ✅
* PostgreSQL Install ✅
* PostgreSQL Service ✅
* psql ✅
* bd_tax Database ✅
* incomes Table ✅
* SERIAL / Sequence ✅
* INSERT ✅
* SELECT ✅
* UPDATE ✅
* DELETE ✅
* NULL vs 0 ✅
* Failed Insert ID Gap ✅
* MySQL vs PostgreSQL ✅
* ORM Concept ✅
* TypeORM Install ✅
* pg Driver ✅
* NestJS DB Connection ✅
* TypeORM forRoot ✅
* Entity Mapping ✅
* forFeature ✅
* Custom Repository ✅
* TypeORM Repository ✅
* Promise ✅
* async / await ✅
* Caller Concept ✅
* DTO vs Entity ✅
* Service Business Logic ✅
* Repository Responsibility ✅
* save() vs update() ✅
* Partial ✅
* Omit ✅
* PATCH ✅
* PUT ✅
* ParseIntPipe ✅
* NotFoundException ✅
* Full CRUD with PostgreSQL ✅
* CRUD Recap Quiz ✅

---

# Next

## Day 11 — Relationships, Foreign Keys & JOIN

Topics:

* Foreign Key
* Referential Integrity
* One-to-Many
* Many-to-One
* User ↔ Income Relationship
* @OneToMany
* @ManyToOne
* @JoinColumn
* ON DELETE CASCADE
* JOIN
* INNER JOIN
* LEFT JOIN
* RIGHT JOIN
* FULL OUTER JOIN
* Relation Loading
* Eager Loading
* N+1 Query Problem

```

এটাই **Day-10.md complete copy-paste version**। 
```
