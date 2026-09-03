নিচেরটা **একবারে পুরোটা copy করে `Day-12.md` file-এ paste** করতে পারো।

````md
# Day 12 — Database Constraints, Transactions & Data Integrity

## Goal

আজকের লক্ষ্য ছিল:

- Database Constraint কী বোঝা
- DTO validation vs Database constraint
- NOT NULL
- UNIQUE
- CHECK
- Foreign Key constraint recap
- Data integrity concept
- Transaction কী
- BEGIN / COMMIT / ROLLBACK
- ACID properties
- PostgreSQL transaction manually practice
- NestJS + TypeORM transaction
- `DataSource.transaction()`
- Transaction manager
- Success path + rollback path verify করা

---

# 1. Database Constraint কী?

Constraint মানে database-level rule।

Database-এ data save হওয়ার সময় PostgreSQL কিছু rules enforce করতে পারে।

Example:

```sql
annual_income NUMERIC NOT NULL
````

এখানে `NOT NULL` একটি constraint।

Meaning:

```text
annual_income value ছাড়া row save করা যাবে না
```

---

# 2. DTO Validation vs Database Constraint

DTO validation application/API layer-এ কাজ করে।

Example:

```ts
@IsNumber()
@Min(0)
annualIncome!: number;
```

এটা client request validate করে।

Flow:

```text
Client
↓
DTO Validation
↓
Controller
↓
Service
↓
Repository
↓
Database
```

কিন্তু DTO validation bypass হতে পারে।

Example:

* কেউ সরাসরি SQL চালালো
* backend bug হলো
* অন্য service database access করলো
* migration/script ভুল data insert করতে চাইলো

তাই database constraint final protection layer হিসেবে কাজ করে।

Mental model:

```text
DTO Validation
→ API-level protection

Service Business Rule
→ application-level protection

Database Constraint
→ final database-level protection
```

এটাকে defense in depth বলা যায়।

---

# 3. NOT NULL Constraint

`NOT NULL` মানে field required।

Example:

```sql
annual_income NUMERIC NOT NULL
```

Invalid:

```text
annual_income = NULL ❌
```

Valid:

```text
annual_income = 0 ✅
annual_income = 500000 ✅
```

আমাদের `user_id`-ও:

```sql
user_id INTEGER NOT NULL
```

Meaning:

```text
user ছাড়া income create করা যাবে না
```

---

# 4. CHECK Constraint

CHECK constraint database value-এর ওপর condition enforce করে।

Example:

```sql
CHECK (annual_income >= 0)
```

Meaning:

```text
annual_income negative হতে পারবে না
```

Existing table-এ constraint add:

```sql
ALTER TABLE incomes
ADD CONSTRAINT chk_annual_income_non_negative
CHECK (annual_income >= 0);
```

Bonus-এর জন্য:

```sql
ALTER TABLE incomes
ADD CONSTRAINT chk_bonus_non_negative
CHECK (bonus >= 0);
```

Valid examples:

```text
annual_income = 1000 ✅
annual_income = 0 ✅
annual_income = -100 ❌
```

Bonus nullable হওয়ায়:

```text
bonus = NULL ✅
bonus = 0 ✅
bonus = 500 ✅
bonus = -10 ❌
```

---

# 5. NULL এবং CHECK

PostgreSQL CHECK constraint-এর ক্ষেত্রে NULL value condition false হিসেবে fail করে না।

Example:

```sql
CHECK (bonus >= 0)
```

যদি:

```text
bonus = NULL
```

তাহলে row allowed হতে পারে।

কারণ bonus optional।

---

# 6. COALESCE

`COALESCE()` প্রথম non-null value return করে।

Example:

```sql
COALESCE(bonus, 0)
```

Meaning:

```text
bonus value থাকলে
→ bonus

bonus NULL হলে
→ 0
```

Examples:

```text
bonus = 200
COALESCE(bonus, 0)
→ 200
```

```text
bonus = NULL
COALESCE(bonus, 0)
→ 0
```

---

# 7. total_income Consistency

আমাদের business rule:

```text
total_income = annual_income + bonus
```

কিন্তু bonus NULL হতে পারে।

তাই database rule:

```sql
CHECK (
  total_income = annual_income + COALESCE(bonus, 0)
)
```

Existing table-এ constraint:

```sql
ALTER TABLE incomes
ADD CONSTRAINT chk_total_income_matches
CHECK (
  total_income = annual_income + COALESCE(bonus, 0)
);
```

এতে incorrect data database reject করবে।

Example:

```text
annual_income = 1000
bonus = 200
total_income = 1200 ✅
```

Invalid:

```text
annual_income = 1000
bonus = 200
total_income = 5000 ❌
```

---

# 8. Derived Value

`total_income` হলো derived value।

```text
annual_income
      +
bonus
      ↓
total_income
```

এখানে দুই ধরনের database design possible:

## Option A

Store:

```text
annual_income
bonus
total_income
```

তাহলে CHECK constraint দিয়ে consistency enforce করতে হবে।

## Option B

Store:

```text
annual_income
bonus
```

আর `total_income` যখন দরকার তখন calculate করা।

আমাদের learning project-এ `total_income` store করছি।

---

# 9. Manual SQL Update Inconsistency

আমরা manually চালিয়েছিলাম:

```sql
UPDATE incomes
SET bonus = 999
WHERE id = 15;
```

এতে শুধু bonus update হয়েছিল।

`total_income` automatically update হয়নি।

Example:

```text
annual_income = 55
bonus = 999
total_income = 75 ❌
```

কারণ PostgreSQL নিজে business calculation জানে না।

NestJS Service-এ আমরা manually calculate করি:

```ts
const totalIncome = annualIncome + bonus;
```

তারপর একসাথে update করি।

---

# 10. Existing Incorrect Data Fix

সব existing row-এর total income recalculate:

```sql
UPDATE incomes
SET total_income =
  annual_income + COALESCE(bonus, 0);
```

তারপর constraint add করা যায়।

---

# 11. UNIQUE Constraint

UNIQUE duplicate value prevent করে।

Example:

```sql
email VARCHAR(255) UNIQUE
```

Valid:

```text
maruf@example.com ✅
rahim@example.com ✅
```

Invalid:

```text
maruf@example.com
maruf@example.com ❌
```

Existing table:

```sql
ALTER TABLE users
ADD CONSTRAINT uq_users_email
UNIQUE (email);
```

---

# 12. UNIQUE vs PRIMARY KEY

```text
PRIMARY KEY
→ row uniquely identify করে
→ UNIQUE
→ NOT NULL

UNIQUE
→ duplicate prevent করে
→ row identity হওয়া জরুরি না
```

Example:

```text
users.id
→ PRIMARY KEY

users.email
→ UNIQUE
```

---

# 13. UNIQUE + NOT NULL

যদি email required হয়, তাহলে:

```sql
email VARCHAR(255) NOT NULL UNIQUE
```

কারণ:

```text
UNIQUE
→ duplicate আটকায়

NOT NULL
→ missing value আটকায়
```

PostgreSQL-এ সাধারণ UNIQUE constraint multiple NULL values allow করতে পারে।

তাই mandatory email-এর জন্য:

```text
NOT NULL + UNIQUE
```

better।

---

# 14. Foreign Key Constraint Recap

Example:

```sql
FOREIGN KEY (user_id)
REFERENCES users(id)
```

Meaning:

```text
incomes.user_id
↓
users.id
```

Invalid:

```text
user_id = 999
কিন্তু users.id = 999 নেই
→ reject
```

এতে Referential Integrity maintain হয়।

---

# 15. Data Integrity

Data Integrity মানে database-এর data:

```text
valid
consistent
reliable
```

থাকা।

Examples:

```text
negative annual income না থাকা
duplicate email না থাকা
invalid user_id না থাকা
total_income calculation correct থাকা
```

Database constraint data integrity protect করে।

---

# 16. Transaction কী?

Transaction একাধিক database operation-কে এক unit of work হিসেবে চালায়।

Rule:

```text
সব operation success
→ COMMIT

critical operation fail
→ ROLLBACK
```

Example:

```text
Step 1 → Income create
Step 2 → History create
```

আমরা চাই:

```text
Income ✅
History ✅
→ COMMIT
```

কিন্তু:

```text
Income ✅
History ❌
→ ROLLBACK
```

তাহলে income-ও persist হবে না।

---

# 17. BEGIN

Transaction শুরু:

```sql
BEGIN;
```

এরপরের database changes transaction-এর অংশ।

Example:

```sql
BEGIN;

UPDATE incomes
SET bonus = 999
WHERE id = 15;
```

এখন change transaction-এর ভিতরে হয়েছে।

---

# 18. ROLLBACK

Transaction-এর সব uncommitted changes cancel করে।

Example:

```sql
BEGIN;

UPDATE incomes
SET bonus = 999
WHERE id = 15;

ROLLBACK;
```

Final result:

```text
bonus আবার আগের value
```

Flow:

```text
BEGIN
↓
UPDATE
↓
temporary change
↓
ROLLBACK
↓
change cancelled
```

---

# 19. COMMIT

Transaction changes permanently save করে।

Example:

```sql
BEGIN;

UPDATE incomes
SET bonus = 999
WHERE id = 15;

COMMIT;
```

Flow:

```text
BEGIN
↓
UPDATE
↓
COMMIT
↓
change permanently persisted
```

---

# 20. COMMIT vs ROLLBACK

```text
COMMIT
→ changes permanently save

ROLLBACK
→ current transaction-এর changes cancel
```

Memory:

```text
Success
→ COMMIT

Failure
→ ROLLBACK
```

---

# 21. Manual PostgreSQL Transaction Practice

Rollback test:

```sql
BEGIN;

UPDATE incomes
SET bonus = 999
WHERE id = 15;

SELECT *
FROM incomes
WHERE id = 15;

ROLLBACK;

SELECT *
FROM incomes
WHERE id = 15;
```

First SELECT-এ temporary updated value দেখা যায়।

ROLLBACK-এর পর দ্বিতীয় SELECT-এ old value ফিরে আসে।

---

# 22. Manual COMMIT Practice

```sql
BEGIN;

UPDATE incomes
SET bonus = 999
WHERE id = 15;

COMMIT;

SELECT *
FROM incomes
WHERE id = 15;
```

এবার updated value database-এ permanently থাকে।

---

# 23. ACID

Database transaction-এর important properties:

```text
A = Atomicity
C = Consistency
I = Isolation
D = Durability
```

---

# 24. Atomicity

Meaning:

```text
All or Nothing
```

Example:

```text
Operation 1 ✅
Operation 2 ✅
Operation 3 ❌
↓
ROLLBACK
↓
Operation 1 এবং 2-ও cancel
```

যদি 5টা operation-এর 4টা success হয় কিন্তু শেষটা fail:

```text
সব rollback
```

---

# 25. Consistency

Database transaction-এর আগে এবং পরে valid state-এ থাকবে।

Flow:

```text
Valid State
↓
Transaction
↓
Valid State
```

Constraint break করলে transaction commit করা যাবে না।

Example:

```text
incomes.user_id = 999
users.id = 999 নেই
```

Foreign Key violation:

```text
REJECT
```

---

# 26. Isolation

একই সময়ে multiple transaction safely run করতে সাহায্য করে।

Example:

```text
Account balance = 1000
```

Transaction A:

```text
withdraw 700
```

Transaction B:

```text
withdraw 500
```

দুটো একই old balance দেখে decision নিলে race condition হতে পারে।

Example:

```text
A reads 1000
B reads 1000

A calculates 300
B calculates 500
```

Proper isolation ছাড়া wrong final state হতে পারে।

Isolation concurrent transactions coordinate করতে সাহায্য করে।

---

# 27. Durability

Transaction COMMIT হয়ে গেলে data persist থাকে।

Flow:

```text
Transaction
↓
COMMIT
↓
Database persists data
↓
App restart
↓
Server restart
↓
Data still exists
```

---

# 28. ACID Memory Rule

```text
Atomicity
→ সব হবে, না হলে কিছুই হবে না

Consistency
→ database rules valid থাকবে

Isolation
→ concurrent transactions safely চলবে

Durability
→ commit হলে data থাকবে
```

---

# 29. pgAdmin

PostgreSQL GUI হিসেবে pgAdmin install করা হয়েছে।

আমাদের existing local PostgreSQL server connect করা হয়েছে:

```text
Host: localhost
Port: 5432
Username: marufalam
Database: bd_tax
```

Visual structure:

```text
Servers
└── Local PostgreSQL
    └── Databases
        └── bd_tax
            └── Schemas
                └── public
                    └── Tables
                        ├── users
                        └── incomes
```

pgAdmin নতুন database না।

এটা PostgreSQL-এর GUI client।

```text
psql ─────┐
          ├── PostgreSQL Server
pgAdmin ──┘
```

---

# 30. pgAdmin Query Tool

SQL execute করতে:

```text
bd_tax
→ Query Tool
```

Example:

```sql
SELECT * FROM incomes;
```

Transaction practice-ও Query Tool দিয়ে করা হয়েছে।

---

# 31. NestJS + TypeORM Transaction

TypeORM transaction-এর জন্য:

```ts
DataSource
```

use করা যায়।

Import:

```ts
import { DataSource } from 'typeorm';
```

Service constructor:

```ts
constructor(
  private readonly incomeRepository: IncomeRepository,
  private readonly userRepository: UserRepository,
  private readonly dataSource: DataSource,
) {}
```

---

# 32. History Entity

Transaction practice-এর জন্য history entity তৈরি করা হয়েছে।

Example:

```ts
@Entity('income_history')
export class IncomeHistoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  message!: string;
}
```

Purpose:

```text
Income create
+
History create
```

দুটো এক transaction-এর মধ্যে test করা।

---

# 33. History Module

History module:

```ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      IncomeHistoryEntity,
    ]),
  ],
})
export class HistoryModule {}
```

`AppModule`-এ register করা হয়েছে।

---

# 34. synchronize: false

আমাদের TypeORM config:

```ts
synchronize: false
```

তাই Entity বানালেই PostgreSQL table automatically create হয় না।

History table manually create:

```sql
CREATE TABLE income_history (
  id SERIAL PRIMARY KEY,
  message VARCHAR(255) NOT NULL
);
```

---

# 35. TypeORM Transaction Example

```ts
async createIncomeWithHistory(
  data: CreateIncomeDto,
): Promise<IncomeEntity> {
  const user =
    await this.userRepository.findById(
      data.userId,
    );

  if (!user) {
    throw new NotFoundException(
      `User with id ${data.userId} not found`,
    );
  }

  return this.dataSource.transaction(
    async (manager) => {
      const bonus = data.bonus ?? 0;

      const totalIncome =
        data.annualIncome + bonus;

      const income = manager.create(
        IncomeEntity,
        {
          annualIncome: data.annualIncome,
          bonus,
          totalIncome,
          user,
        },
      );

      const savedIncome =
        await manager.save(income);

      const history = manager.create(
        IncomeHistoryEntity,
        {
          message:
            `Income ${savedIncome.id} created`,
        },
      );

      await manager.save(history);

      return savedIncome;
    },
  );
}
```

---

# 36. DataSource.transaction()

```ts
this.dataSource.transaction(
  async (manager) => {
    // database operations
  },
);
```

Flow:

```text
TypeORM
↓
BEGIN TRANSACTION
↓
callback execute
↓
সব success?
   ├── Yes → COMMIT
   └── Error → ROLLBACK
```

---

# 37. Transaction Manager

Transaction-এর ভিতরে:

```ts
manager.save(...)
manager.create(...)
manager.find(...)
```

use করা হয়।

Reason:

```text
সব operation
→ same transaction context
```

Important rule:

```text
Transaction-এর ভিতরের DB operations
→ transaction manager দিয়ে করা ভালো
```

---

# 38. Transaction Success Flow

```text
POST /incomes/with-history
↓
Service
↓
DataSource.transaction()
↓
BEGIN
↓
Income save ✅
↓
History save ✅
↓
COMMIT
↓
Response
```

---

# 39. Transaction Endpoint

Controller:

```ts
@Post('with-history')
createIncomeWithHistory(
  @Body() body: CreateIncomeDto,
) {
  return this.incomeService
    .createIncomeWithHistory(body);
}
```

Full route:

```text
@Controller('incomes')
+
@Post('with-history')
↓
POST /incomes/with-history
```

Correct curl:

```bash
curl --location 'http://localhost:3000/incomes/with-history' \
--header 'Content-Type: application/json' \
--data '{
  "annualIncome": 500000,
  "bonus": 50000,
  "userId": 1
}'
```

---

# 40. Transaction Success Verification

Income check:

```sql
SELECT *
FROM incomes
ORDER BY id DESC;
```

History check:

```sql
SELECT *
FROM income_history
ORDER BY id DESC;
```

Successful transaction-এ:

```text
income row exists ✅
history row exists ✅
```

---

# 41. Rollback Testing

Transaction সত্যি কাজ করছে কিনা test করার জন্য intentional error:

```ts
const savedIncome =
  await manager.save(income);

throw new Error(
  'Testing transaction rollback',
);
```

Flow:

```text
BEGIN
↓
Income save ✅
↓
Intentional Error ❌
↓
ROLLBACK
```

Request response:

```text
500 Internal Server Error
```

কিন্তু database check করলে failed request-এর income row থাকবে না।

এটাই Atomicity practical proof।

---

# 42. Transaction Rollback Verification

After failed API:

```sql
SELECT *
FROM incomes
ORDER BY id DESC;
```

Expected:

```text
failed transaction-এর row নেই
```

কারণ:

```text
save হয়েছিল
কিন্তু COMMIT হয়নি
↓
ROLLBACK
```

---

# 43. Important Transaction Rule

Transaction-এর ভিতরে শুধু:

```ts
manager.save(...)
```

না, manager-এর মাধ্যমে সব transaction-dependent DB operation চালানো উচিত।

কারণ normal injected repository অন্য transaction context ব্যবহার করতে পারে।

Mental model:

```text
Normal Repository
→ normal DB context

Transaction Manager
→ current transaction context
```

---

# 44. Current Database Safety Layers

আমাদের project-এ এখন multiple protection layer আছে:

```text
Client
↓
DTO Validation
↓
Service Business Logic
↓
Repository
↓
TypeORM
↓
Database Constraints
↓
PostgreSQL
```

এতে invalid data save হওয়ার chance কমে।

---

# 45. Important Practical Lesson

Application logic alone enough না।

Example:

NestJS Service:

```ts
const totalIncome =
  annualIncome + bonus;
```

Correct data তৈরি করে।

Database CHECK:

```sql
CHECK (
  total_income =
  annual_income +
  COALESCE(bonus, 0)
)
```

incorrect data persist হওয়া আটকায়।

Mental model:

```text
Service
→ correct data তৈরি করে

Database
→ wrong data reject করে
```

---

# 46. Day 12 Key Takeaways

1. Constraint = database rule।
2. DTO validation API layer-এ কাজ করে।
3. Database constraint final safety layer।
4. NOT NULL required value enforce করে।
5. CHECK business/data rules enforce করে।
6. UNIQUE duplicate prevent করে।
7. Mandatory unique field হলে NOT NULL + UNIQUE useful।
8. Foreign Key referential integrity maintain করে।
9. COALESCE NULL-এর fallback value দেয়।
10. Derived values store করলে consistency enforce করা দরকার।
11. Transaction multiple DB operation-কে one unit বানায়।
12. BEGIN transaction শুরু করে।
13. COMMIT changes permanently save করে।
14. ROLLBACK uncommitted changes cancel করে।
15. Atomicity = all or nothing।
16. Consistency = valid state → valid state।
17. Isolation = concurrent transaction safety।
18. Durability = committed data persists।
19. pgAdmin PostgreSQL-এর GUI client।
20. TypeORM `DataSource.transaction()` transaction manage করতে পারে।
21. Transaction manager same transaction context maintain করে।
22. Error throw হলে TypeORM transaction rollback করতে পারে।
23. Income + History transaction successfully tested।
24. Intentional failure দিয়ে rollback practically verified হয়েছে।

---

# 47. Day 12 Status

Completed:

* Database Constraints ✅
* NOT NULL ✅
* CHECK ✅
* UNIQUE ✅
* Foreign Key recap ✅
* COALESCE ✅
* Data consistency ✅
* Derived data discussion ✅
* Manual PostgreSQL transaction ✅
* BEGIN ✅
* COMMIT ✅
* ROLLBACK ✅
* ACID ✅
* Atomicity ✅
* Consistency ✅
* Isolation ✅
* Durability ✅
* pgAdmin setup ✅
* pgAdmin Query Tool ✅
* History Entity ✅
* History Module ✅
* TypeORM DataSource ✅
* TypeORM transaction manager ✅
* Transaction API ✅
* Success path ✅
* Rollback test ✅

---

# Next

## Day 13 — Authentication & Authorization Fundamentals

Possible topics:

* Authentication vs Authorization
* Password hashing
* bcrypt / Argon2 concept
* Login flow
* JWT
* Access Token
* Refresh Token
* Guards
* Protected routes
* 401 vs 403
* User identity inside request
* Production authentication architecture

```

এটাই **Day-12.md complete final note**। একবারে পুরোটা copy করে save করতে পারবে। 
```
