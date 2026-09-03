অবশ্যই। নিচেরটা **একবারে পুরোটা copy করে `Day-11.md` file-এ paste** করতে পারো।

````md
# Day 11 — Relationships, Foreign Keys & JOIN

## Goal

আজকের লক্ষ্য ছিল:

- Relational database relationship বোঝা
- Primary Key vs Foreign Key
- One-to-Many relationship
- Many-to-One relationship
- Referential Integrity
- ON DELETE CASCADE
- users ↔ incomes relation
- TypeORM relation mapping
- `@OneToMany`
- `@ManyToOne`
- `@JoinColumn`
- Relation-aware POST request
- JOIN fundamentals
- INNER JOIN
- LEFT JOIN
- RIGHT JOIN
- FULL OUTER JOIN
- TypeORM relation loading
- Explicit relation loading
- Eager loading
- N+1 Query Problem
- PostgreSQL `NUMERIC` runtime type issue

---

# 1. কেন Database Relationship দরকার?

ধরো আমাদের দুইটা table আছে:

```text
users

id | name
---+------
1  | Maruf
2  | Rahim
````

এবং:

```text
incomes

id | user_id | annual_income
---+---------+--------------
10 | 1       | 800000
11 | 1       | 500000
12 | 2       | 600000
```

এখানে `user_id` বলে দেয় কোন income কোন user-এর।

Example:

```text
income id = 10
user_id = 1
```

মানে:

```text
users.id = 1
→ Maruf
```

তাই ওই income Maruf-এর।

---

# 2. Primary Key

Primary Key নিজের table-এর row uniquely identify করে।

Example:

```text
users.id
```

```text
users

id | name
---+------
1  | Maruf
2  | Rahim
```

এখানে:

```text
id
→ Primary Key
```

Primary Key সাধারণত:

```text
unique
not null
stable identity
```

---

# 3. Foreign Key

Foreign Key অন্য table-এর Primary Key reference করে।

আমাদের case:

```text
incomes.user_id
↓
users.id
```

এখানে:

```text
users.id
→ Primary Key

incomes.user_id
→ Foreign Key
```

---

# 4. Foreign Key Visual

```text
users

id | name
---+------
1  | Maruf
       ▲
       │
       │ reference
       │
incomes

id | user_id | annual_income
---+---------+--------------
10 |    1    | 800000
11 |    1    | 500000
```

`user_id = 1` মানে:

```text
এই income
→ users.id = 1
→ Maruf-এর
```

---

# 5. Referential Integrity

Foreign Key-এর সবচেয়ে important কাজ হলো invalid relation prevent করা।

ধরো:

```text
users table-এ আছে:

id = 1
id = 2
```

কিন্তু আমরা income insert করতে চাই:

```text
user_id = 999
```

যেহেতু:

```text
users.id = 999
```

exist করে না, database request reject করবে।

এটাই:

```text
Referential Integrity
```

Meaning:

```text
Child row
→ valid Parent row reference করতে হবে
```

---

# 6. Parent Table vs Child Table

আমাদের relation:

```text
users
→ parent table

incomes
→ child table
```

কারণ:

```text
incomes.user_id
→ users.id কে reference করছে
```

---

# 7. One-to-Many

একজন User-এর অনেক Income থাকতে পারে।

Visual:

```text
User #1
   │
   ├── Income #10
   ├── Income #11
   └── Income #15
```

Meaning:

```text
One User
→ Many Incomes
```

তাই `UserEntity` side:

```ts
@OneToMany(
  () => IncomeEntity,
  (income) => income.user,
)
incomes!: IncomeEntity[];
```

---

# 8. কেন IncomeEntity[]?

User side-এ:

```ts
incomes!: IncomeEntity[];
```

কারণ:

```text
একজন user
→ একটা income না
→ অনেক income
```

তাই array:

```ts
IncomeEntity[]
```

---

# 9. Many-to-One

Income-এর perspective থেকে relation:

```text
Income #10 ──┐
Income #11 ──┼──► User #1
Income #15 ──┘
```

Meaning:

```text
Many Incomes
→ One User
```

তাই `IncomeEntity` side:

```ts
@ManyToOne(
  () => UserEntity,
  (user) => user.incomes,
)
user!: UserEntity;
```

---

# 10. One-to-Many এবং Many-to-One একই Relation

একই relationship দুই direction থেকে দেখা হয়।

```text
User perspective:
One → Many

Income perspective:
Many → One
```

Visual:

```text
UserEntity
@OneToMany
     │
     ▼
IncomeEntity[]

IncomeEntity
@ManyToOne
     │
     ▼
UserEntity
```

---

# 11. Foreign Key কোন Side-এ থাকে?

One-to-Many relation-এ Foreign Key সাধারণত Many side-এ থাকে।

আমাদের case:

```text
One User
→ Many Incomes
```

তাই Foreign Key:

```text
incomes.user_id
```

Visual:

```text
ONE SIDE                    MANY SIDE

users                       incomes
id = 1   ◄──────────────    user_id = 1
                            user_id = 1
                            user_id = 1
```

---

# 12. কেন users Table-এ income_ids রাখি না?

Relational design-এ সাধারণত:

```text
users
id = 1
```

এর মধ্যে এমন:

```text
income_ids = [10, 11, 12]
```

store করি না।

বরং child table-এ parent ID রাখি:

```text
incomes

id | user_id
---+--------
10 | 1
11 | 1
12 | 1
```

এতে relation clean এবং scalable থাকে।

---

# 13. users Table Create

SQL:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);
```

Insert:

```sql
INSERT INTO users (name)
VALUES ('Maruf');
```

Check:

```sql
SELECT * FROM users;
```

---

# 14. Existing incomes Table-এ user_id Add

```sql
ALTER TABLE incomes
ADD COLUMN user_id INTEGER;
```

Initially nullable রাখা হয়েছিল কারণ পুরনো income rows already ছিল।

---

# 15. Foreign Key Constraint Add

```sql
ALTER TABLE incomes
ADD CONSTRAINT fk_incomes_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;
```

Meaning:

```text
incomes.user_id
→ users.id
```

---

# 16. ON DELETE CASCADE

`ON DELETE CASCADE` মানে:

```text
Parent delete
↓
related child rows delete
```

Example:

```text
User #1
   │
   ├── Income #10
   ├── Income #11
   └── Income #12
```

User #1 delete হলে:

```text
Income #10 delete
Income #11 delete
Income #12 delete
```

---

# 17. Other Delete Strategies

Foreign Key relation-এ common options:

```text
CASCADE
→ parent delete হলে child delete

RESTRICT / NO ACTION
→ child থাকলে parent delete block

SET NULL
→ parent delete হলে child FK NULL
```

আমাদের learning project-এ:

```text
ON DELETE CASCADE
```

use করা হয়েছে।

---

# 18. Existing Income Rows-এ User Assign

Existing income rows-এ:

```sql
UPDATE incomes
SET user_id = 1
WHERE user_id IS NULL;
```

তারপর strict rule:

```sql
ALTER TABLE incomes
ALTER COLUMN user_id SET NOT NULL;
```

এখন:

```text
user ছাড়া income create করা যাবে না
```

---

# 19. UserEntity

```ts
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { IncomeEntity } from '../income/income.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @OneToMany(
    () => IncomeEntity,
    (income) => income.user,
  )
  incomes!: IncomeEntity[];
}
```

---

# 20. IncomeEntity Relation

```ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../user/user.entity';

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

  @ManyToOne(
    () => UserEntity,
    (user) => user.incomes,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: UserEntity;
}
```

---

# 21. @ManyToOne

```ts
@ManyToOne(
  () => UserEntity,
  (user) => user.incomes,
)
```

Meaning:

```text
Many IncomeEntity
→ One UserEntity
```

---

# 22. @OneToMany

```ts
@OneToMany(
  () => IncomeEntity,
  (income) => income.user,
)
```

Meaning:

```text
One UserEntity
→ Many IncomeEntity
```

---

# 23. @JoinColumn

```ts
@JoinColumn({
  name: 'user_id',
})
```

TypeORM-কে বলে:

```text
IncomeEntity.user
↓
database foreign-key column
↓
incomes.user_id
```

---

# 24. Owning Side

`IncomeEntity` relation-এর owning side।

কারণ Foreign Key:

```text
incomes.user_id
```

Income table-এ আছে।

Mental model:

```text
Foreign Key যেখানে
→ relation ownership সাধারণত সেখানে
```

---

# 25. Relation Bug — ManyToMany ভুল ছিল

আমরা একবার ভুল করে লিখেছিলাম:

```ts
@ManyToMany(...)
```

কিন্তু relation আসলে:

```text
Many Incomes
→ One User
```

তাই correct:

```ts
@ManyToOne(...)
```

Wrong relation থাকার কারণে generated INSERT query-তে:

```text
user_id
```

ছিল না।

---

# 26. user_id NULL Error

Error:

```text
null value in column "user_id"
violates not-null constraint
```

Generated SQL ছিল roughly:

```sql
INSERT INTO incomes (
  annual_income,
  bonus,
  total_income
)
VALUES (...)
```

Problem:

```text
user_id missing
```

Correct relation mapping করার পর TypeORM:

```text
user_id
```

save করতে পারে।

---

# 27. UserRepository

```ts
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository:
      Repository<UserEntity>,
  ) {}

  findById(
    id: number,
  ): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}
```

---

# 28. Important Import Fix

Correct:

```ts
import { Repository } from 'typeorm';
```

Wrong:

```ts
import {
  Repository
} from 'typeorm/browser/repository/Repository.js';
```

NestJS backend-এ:

```text
typeorm
```

package থেকে import করা উচিত।

---

# 29. UserModule

```ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
    ]),
  ],
  providers: [
    UserRepository,
  ],
  exports: [
    UserRepository,
  ],
})
export class UserModule {}
```

---

# 30. কেন UserRepository Export করি?

`IncomeService` থেকে:

```ts
UserRepository
```

use করতে হবে।

তাই:

```ts
exports: [UserRepository]
```

দেওয়া হয়েছে।

তারপর `IncomeModule`:

```ts
imports: [
  TypeOrmModule.forFeature([
    IncomeEntity,
  ]),
  UserModule,
]
```

---

# 31. CreateIncomeDto-তে userId

```ts
export class CreateIncomeDto {
  @IsNumber()
  @Min(0)
  annualIncome!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @IsNumber()
  @Min(1)
  userId!: number;
}
```

Client relation হিসেবে পাঠায়:

```text
userId
```

Entity directly userId store করে না।

Entity relation property:

```ts
user!: UserEntity;
```

---

# 32. userId থেকে UserEntity

Flow:

```text
Client
↓
userId = 1
↓
Service
↓
UserRepository.findById(1)
↓
UserEntity
↓
IncomeEntity.user
```

---

# 33. Relation-Aware POST

Request:

```json
{
  "annualIncome": 55,
  "bonus": 60,
  "userId": 1
}
```

Service:

```ts
const user =
  await this.userRepository.findById(
    data.userId,
  );

if (!user) {
  throw new NotFoundException(
    `User with id ${data.userId} not found`,
  );
}
```

Then:

```ts
const bonus = data.bonus ?? 0;

const totalIncome =
  data.annualIncome + bonus;
```

Save:

```ts
const income =
  await this.incomeRepository.saveIncome({
    annualIncome: data.annualIncome,
    bonus,
    totalIncome,
    user,
  });
```

---

# 34. Full Relation-Aware POST Flow

```text
POST /incomes
↓
Controller
↓
CreateIncomeDto
↓
Service
↓
userId
↓
UserRepository.findById()
↓
UserEntity
↓
totalIncome calculate
↓
IncomeRepository.saveIncome()
↓
TypeORM
↓
PostgreSQL
↓
user_id saved
```

---

# 35. POST Response with Relation

Example:

```json
{
  "success": true,
  "message": "Income created successfully",
  "data": {
    "id": 32,
    "annualIncome": 55,
    "bonus": 60,
    "totalIncome": 115,
    "user": {
      "id": 1,
      "name": "Maruf"
    }
  }
}
```

---

# 36. JOIN কী?

JOIN দুই বা তার বেশি related table-এর matching data combine করে।

আমাদের case:

```text
incomes.user_id
      =
users.id
```

Visual:

```text
incomes

id | user_id | annual_income
---+---------+--------------
32 |    1    | 800000
       │
       │ match
       ▼

users

id | name
---+------
1  | Maruf
```

Combined result:

```text
Income + User
```

---

# 37. JOIN Condition

```sql
ON incomes.user_id = users.id
```

Meaning:

```text
Income-এর user_id
এবং
User-এর id

যেখানে equal
→ সেই rows match
```

---

# 38. Basic JOIN SQL

```sql
SELECT
  incomes.id,
  incomes.annual_income,
  users.id,
  users.name
FROM incomes
JOIN users
  ON incomes.user_id = users.id;
```

---

# 39. JOIN কেন দরকার?

Tables আলাদা রাখা হয়:

```text
users
incomes
```

কিন্তু response-এ চাইতে পারি:

```json
{
  "id": 32,
  "annualIncome": 800000,
  "user": {
    "id": 1,
    "name": "Maruf"
  }
}
```

JOIN related tables combine করে এই data আনতে সাহায্য করে।

---

# 40. Relation vs JOIN

Important distinction:

```text
Relation
→ কে কার সাথে connected সেটা define করে

JOIN
→ query করার সময় related data combine করে
```

---

# 41. INNER JOIN

INNER JOIN শুধু matching rows return করে।

Example:

```text
users

1 Maruf
2 Rahim
3 Karim
```

```text
incomes

id | user_id
---+--------
10 | 2
```

Query:

```sql
FROM incomes
INNER JOIN users
  ON incomes.user_id = users.id
```

Result:

```text
Income #10
→ Rahim
```

Maruf/Karim আসে না কারণ matching income নেই।

---

# 42. INNER JOIN Memory

```text
INNER JOIN
→ only match
```

---

# 43. LEFT JOIN

Rule:

```text
LEFT JOIN
→ left table-এর সব row
→ right table-এর matching rows
→ match না থাকলে right-side NULL
```

Example:

```sql
FROM users
LEFT JOIN incomes
  ON users.id = incomes.user_id
```

যদি Maruf-এর income না থাকে:

```text
user_id | name  | income_id
--------+-------+----------
1       | Maruf | NULL
```

Maruf থাকবে।

কারণ:

```text
users
→ LEFT table
```

---

# 44. LEFT JOIN Memory

```text
LEFT
→ left table কখনও হারায় না
```

---

# 45. RIGHT JOIN

```text
RIGHT JOIN
→ right table-এর সব row
→ left table-এর matching rows
```

Example:

```sql
FROM incomes
RIGHT JOIN users
  ON incomes.user_id = users.id
```

তাহলে সব users result-এ থাকবে।

Matching income না থাকলে income-side NULL।

---

# 46. RIGHT JOIN Note

অনেক সময়:

```text
RIGHT JOIN
```

এর বদলে table order reverse করে:

```text
LEFT JOIN
```

use করা যায়।

---

# 47. FULL OUTER JOIN

FULL OUTER JOIN দুই table-এর সব rows রাখে।

```text
Matched
→ combine

Left unmatched
→ right side NULL

Right unmatched
→ left side NULL
```

---

# 48. JOIN Memory Rule

```text
INNER
→ শুধু match

LEFT
→ left-এর সব + match

RIGHT
→ right-এর সব + match

FULL
→ দুই পাশের সব
```

---

# 49. TypeORM Relation Loading

শুধু income load:

```ts
findAll(): Promise<IncomeEntity[]> {
  return this.incomeRepository.find();
}
```

এখানে user relation automatically আসবে না।

---

# 50. Income + User Load

```ts
findAll(): Promise<IncomeEntity[]> {
  return this.incomeRepository.find({
    relations: {
      user: true,
    },
  });
}
```

Meaning:

```text
Income fetch করো
+
related user-ও load করো
```

---

# 51. Single Income + User

```ts
findById(
  id: number,
): Promise<IncomeEntity | null> {
  return this.incomeRepository.findOne({
    where: { id },
    relations: {
      user: true,
    },
  });
}
```

---

# 52. relations: { user: true }

এখানে:

```ts
user
```

database column থেকে আসে না।

এটা `IncomeEntity` property:

```ts
user!: UserEntity;
```

Meaning:

```text
এই relation property-র data load করো
```

---

# 53. User Side Relation Loading

`UserEntity`:

```ts
@OneToMany(
  () => IncomeEntity,
  (income) => income.user,
)
incomes!: IncomeEntity[];
```

তাই:

```ts
relations: {
  incomes: true,
}
```

use করা যায়।

---

# 54. UserRepository — User + Incomes

```ts
findByIdWithIncomes(
  id: number,
): Promise<UserEntity | null> {
  return this.userRepository.findOne({
    where: { id },
    relations: {
      incomes: true,
    },
  });
}
```

---

# 55. GET /users/:id

Flow:

```text
GET /users/1
↓
UserController
↓
UserService
↓
UserRepository
↓
User + Incomes
↓
Response
```

---

# 56. User + Incomes Response

Example:

```json
{
  "success": true,
  "message": "User with id 1 found",
  "data": {
    "id": 1,
    "name": "Maruf",
    "incomes": [
      {
        "id": 1,
        "annualIncome": "1200000",
        "bonus": "100000",
        "totalIncome": "1300000"
      },
      {
        "id": 15,
        "annualIncome": "55",
        "bonus": "20",
        "totalIncome": "75"
      }
    ]
  }
}
```

---

# 57. Relation Define vs Relation Load

Relation define:

```ts
@OneToMany(...)
@ManyToOne(...)
```

Meaning:

```text
TypeORM-কে relation structure জানানো
```

Relation load:

```ts
relations: {
  incomes: true,
}
```

Meaning:

```text
actual related data fetch করা
```

Memory:

```text
Decorator
→ relation define

relations: true
→ relation load
```

---

# 58. Explicit Relation Loading

Example:

```ts
relations: {
  user: true,
}
```

অথবা:

```ts
relations: {
  incomes: true,
}
```

এটাকে explicit loading বলা যায়।

Meaning:

```text
এই specific query-তে relation চাই
```

Benefit:

```text
more control
unnecessary relation load কম
```

---

# 59. Eager Loading

Entity relation-এ:

```ts
@OneToMany(
  () => IncomeEntity,
  (income) => income.user,
  {
    eager: true,
  },
)
```

দিলে TypeORM relation automatically load করতে পারে।

---

# 60. Eager Loading Problem

ধরো User-এর 500 income আছে।

শুধু:

```text
id
name
```

দরকার ছিল।

কিন্তু eager loading হলে:

```text
500 income
```

ও চলে আসতে পারে।

Problem:

```text
larger query
larger response
more memory
unnecessary data
```

তাই আমাদের project-এ explicit relation loading preferred।

---

# 61. N+1 Query Problem

ধরো 3 users আছে।

প্রথম query:

```sql
SELECT * FROM users;
```

এটা:

```text
1 query
```

তারপর:

```sql
SELECT * FROM incomes
WHERE user_id = 1;

SELECT * FROM incomes
WHERE user_id = 2;

SELECT * FROM incomes
WHERE user_id = 3;
```

আর:

```text
3 queries
```

Total:

```text
1 + 3 = 4
```

---

# 62. N+1 Formula

```text
N users
+
1 parent query
=
N + 1 queries
```

Example:

```text
50 users
→ 1 + 50
→ 51 queries
```

1000 users:

```text
1001 queries
```

---

# 63. N+1 Problem কেন Important?

Too many database queries:

```text
slower response
higher DB load
more network overhead
poor scalability
```

তাই relation loading strategy গুরুত্বপূর্ণ।

---

# 64. N+1 Memory

```text
1 query
→ parent list

N queries
→ প্রতিটি parent-এর child

Total
→ N + 1
```

---

# 65. PostgreSQL NUMERIC Issue

Entity:

```ts
@Column({
  type: 'numeric',
  name: 'annual_income',
})
annualIncome!: number;
```

TypeScript-এ type:

```text
number
```

কিন্তু PostgreSQL `NUMERIC` field TypeORM/pg runtime-এ string হিসেবে return করতে পারে।

Example:

```ts
bonus = "11";
```

---

# 66. PATCH Bug

Service:

```ts
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

ধরো:

```text
annualIncome = 333
bonus = "11"
```

JavaScript:

```ts
333 + "11"
```

Result:

```text
"33311"
```

এটা string concatenation।

---

# 67. NUMERIC Conversion Fix

Calculation-এর আগে:

```ts
const annualIncome = Number(
  data.annualIncome ??
  existingIncome.data.annualIncome,
);

const bonus = Number(
  data.bonus ??
  existingIncome.data.bonus ??
  0,
);

const totalIncome =
  annualIncome + bonus;
```

এখন:

```text
333 + 11
→ 344
```

---

# 68. TypeScript Type vs Runtime Type

Important:

```ts
annualIncome!: number;
```

TypeScript-কে compile-time information দেয়।

কিন্তু runtime-এ database driver কী value return করছে, সেটা আলাদা concern।

Mental model:

```text
TypeScript type
→ compile-time

Database driver value
→ runtime
```

---

# 69. Full Architecture after Day 11

```text
Client
↓
Controller
↓
DTO
↓
Service
├── Business Logic
├── User validation
└── Relation resolution
↓
Repository
↓
TypeORM
↓
PostgreSQL
```

Database:

```text
users
   1
   │
   │ One-to-Many
   ▼
incomes
   many
```

---

# 70. User → Income Mental Model

```text
User
↓
@OneToMany
↓
IncomeEntity[]
```

---

# 71. Income → User Mental Model

```text
Income
↓
@ManyToOne
↓
UserEntity
```

---

# 72. Relation Visual Summary

```text
             UserEntity
             id = 1
             name = Maruf
                  │
                  │ @OneToMany
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   Income 1   Income 2   Income 3
       │          │          │
       └──────────┴──────────┘
             @ManyToOne
                  │
                  ▼
             UserEntity
```

---

# 73. Foreign Key Visual Summary

```text
users
+----+-------+
| id | name  |
+----+-------+
| 1  | Maruf |
+----+-------+
   ▲
   │
   │ incomes.user_id
   │
+----+---------+---------------+
| id | user_id | annual_income |
+----+---------+---------------+
| 10 | 1       | 800000        |
| 11 | 1       | 500000        |
+----+---------+---------------+
```

---

# 74. JOIN Visual Summary

```text
Income row
user_id = 1
      │
      │ JOIN
      ▼
User row
id = 1
name = Maruf
      │
      ▼
Combined Result
```

---

# 75. Simple Memory Cheat Sheet

```text
Primary Key
→ নিজের row identify

Foreign Key
→ অন্য table reference

One-to-Many
→ একজনের অনেক child

Many-to-One
→ অনেক child এক parent-এর

@JoinColumn
→ FK column mapping

JOIN
→ related data combine

relations: true
→ related data load

N+1
→ too many repeated queries
```

---

# 76. Layer Responsibility with Relation

```text
DTO
→ userId নেয়

Service
→ user খুঁজে
→ business logic চালায়

UserRepository
→ UserEntity fetch করে

IncomeRepository
→ income save/read করে

TypeORM
→ relation mapping করে

PostgreSQL
→ FK enforce করে
```

---

# 77. Day 11 Key Takeaways

1. Primary Key নিজের table-এর row uniquely identify করে।
2. Foreign Key অন্য table-এর Primary Key reference করে।
3. Foreign Key Referential Integrity enforce করে।
4. Invalid `user_id` database reject করে।
5. One User-এর Many Incomes থাকতে পারে।
6. User side-এ `@OneToMany`।
7. Income side-এ `@ManyToOne`।
8. Foreign Key Many side-এ থাকে।
9. `@JoinColumn` foreign-key column map করে।
10. `ON DELETE CASCADE` parent delete হলে related child delete করে।
11. Client `userId` পাঠায়।
12. Service `userId` দিয়ে `UserEntity` resolve করে।
13. Entity relation property `user` database relation represent করে।
14. JOIN দুই related table-এর data combine করে।
15. INNER JOIN শুধু matching rows।
16. LEFT JOIN left table-এর সব row রাখে।
17. RIGHT JOIN right table-এর সব row রাখে।
18. FULL OUTER JOIN দুই side-এর সব row রাখে।
19. `relations: { user: true }` related user load করে।
20. `relations: { incomes: true }` related incomes load করে।
21. Relation decorator relation define করে।
22. `relations: true` relation data load করে।
23. Explicit loading বেশি control দেয়।
24. Eager loading unnecessary data আনতে পারে।
25. N+1 pattern অনেক database query তৈরি করতে পারে।
26. 50 user হলে N+1 = 51 queries হতে পারে।
27. PostgreSQL `NUMERIC` runtime-এ string হিসেবে আসতে পারে।
28. Numeric calculation-এর আগে `Number()` conversion দরকার হতে পারে।

---

# 78. Day 11 Status

Completed:

* Primary Key recap ✅
* Foreign Key ✅
* Parent / Child table ✅
* Referential Integrity ✅
* users table ✅
* user_id column ✅
* Foreign Key constraint ✅
* user_id NOT NULL ✅
* ON DELETE CASCADE ✅
* One-to-Many ✅
* Many-to-One ✅
* UserEntity relation ✅
* IncomeEntity relation ✅
* JoinColumn ✅
* Owning side concept ✅
* UserRepository ✅
* UserModule ✅
* Relation-aware CreateIncomeDto ✅
* Relation-aware POST ✅
* Invalid user handling ✅
* JOIN concept ✅
* INNER JOIN ✅
* LEFT JOIN ✅
* RIGHT JOIN ✅
* FULL OUTER JOIN ✅
* Income → User relation loading ✅
* User → Incomes relation loading ✅
* Explicit relation loading ✅
* Eager loading ✅
* N+1 Query Problem ✅
* N+1 calculation ✅
* PostgreSQL NUMERIC runtime issue ✅
* PATCH numeric bug fix ✅

---

# Next

## Day 12 — Database Constraints, Transactions & Data Integrity

Topics:

* NOT NULL
* UNIQUE
* CHECK
* Foreign Key constraint recap
* Data Integrity
* COALESCE
* Derived data consistency
* Transaction
* BEGIN
* COMMIT
* ROLLBACK
* ACID
* TypeORM DataSource transaction
* Transaction Manager
* Rollback testing

```

এটাই **Day-11.md complete copy-paste version**। 
```
