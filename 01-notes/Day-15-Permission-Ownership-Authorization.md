# Day 15 — Permission-Based Authorization & Resource Ownership

## 🎯 Today's Goal

Day 14-এ আমরা Role-Based Authorization শিখেছিলাম:

```text
USER
ADMIN
```

আজ আমরা authorization-কে আরও granular করেছি:

```text
Role
↓
Permissions
↓
Resource Ownership
```

আজকের মূল বিষয়:

- Role vs Permission
- Permission Enum
- Role → Permission Mapping
- `@Permissions()` Decorator
- `PermissionsGuard`
- Multiple Permissions
- `every()` vs `some()`
- Real API Permission Protection
- Resource Ownership
- Secure GET
- Secure POST
- Secure PATCH
- Secure PUT
- Secure DELETE
- `401` vs `403`
- Authentication → Permission → Ownership

---

# 1. Role vs Permission

Role হচ্ছে user-এর broad category।

Example:

```text
ADMIN
USER
```

Permission হচ্ছে user ঠিক কোন action করতে পারবে।

Example:

```text
income:read-own
income:create-own
income:update-own
income:delete-own

user:read
user:delete
```

Mental Model:

```text
Role
= তুমি কোন group-এর member?

Permission
= তুমি কোন specific action করতে পারবে?
```

Example:

```text
ADMIN
├── user:read
├── user:delete
├── income:read-own
├── income:create-own
├── income:update-own
└── income:delete-own

USER
├── income:read-own
├── income:create-own
├── income:update-own
└── income:delete-own
```

---

# 2. Permission Enum

File:

```text
src/auth/permissions/permission.enum.ts
```

```ts
export enum Permission {
  INCOME_READ_OWN = 'income:read-own',
  INCOME_CREATE_OWN = 'income:create-own',
  INCOME_UPDATE_OWN = 'income:update-own',
  INCOME_DELETE_OWN = 'income:delete-own',

  USER_READ = 'user:read',
  USER_DELETE = 'user:delete',
}
```

Enum ব্যবহারের সুবিধা:

```text
Permission.INCOME_READ_OWN
```

ব্যবহার করা যায়।

String typo হওয়ার chance কমে।

Wrong:

```ts
'incom:read-own'
```

Better:

```ts
Permission.INCOME_READ_OWN
```

---

# 3. Role → Permission Mapping

আমাদের permission এখন database-এ আলাদা table হিসেবে নেই।

প্রথম implementation-এ code-এর মধ্যে mapping করেছি।

File:

```text
src/auth/permissions/role-permissions.ts
```

```ts
import { UserRole } from '../../user/user.entity';
import { Permission } from './permission.enum';

export const ROLE_PERMISSIONS:
  Record<UserRole, Permission[]> = {

  [UserRole.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_DELETE,

    Permission.INCOME_READ_OWN,
    Permission.INCOME_CREATE_OWN,
    Permission.INCOME_UPDATE_OWN,
    Permission.INCOME_DELETE_OWN,
  ],

  [UserRole.USER]: [
    Permission.INCOME_READ_OWN,
    Permission.INCOME_CREATE_OWN,
    Permission.INCOME_UPDATE_OWN,
    Permission.INCOME_DELETE_OWN,
  ],
};
```

Flow:

```text
JWT
↓
role = user
↓
ROLE_PERMISSIONS[user]
↓
[
  income:read-own,
  income:create-own,
  income:update-own,
  income:delete-own
]
```

---

# 4. @Permissions() Decorator

File:

```text
src/auth/decorators/permissions.decorator.ts
```

```ts
import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions/permission.enum';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (
  ...permissions: Permission[]
) =>
  SetMetadata(
    PERMISSIONS_KEY,
    permissions,
  );
```

Usage:

```ts
@Permissions(
  Permission.USER_DELETE,
)
```

Important:

`@Permissions()` নিজে permission check করে না।

এটা শুধু route metadata-তে required permission রাখে।

Flow:

```text
@Permissions(USER_DELETE)
↓
Metadata
↓
PermissionsGuard
↓
Actual checking
```

Day 14-এর `@Roles()`-এর মতো একই concept।

---

# 5. PermissionsGuard

File:

```text
src/auth/guards/permissions.guard.ts
```

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { JwtPayload } from '../types/jwt-payload.interface';

import {
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';

import {
  Permission,
} from '../permissions/permission.enum';

import {
  ROLE_PERMISSIONS,
} from '../permissions/role-permissions';

@Injectable()
export class PermissionsGuard
  implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {

    const requiredPermissions =
      this.reflector
        .getAllAndOverride<Permission[]>(
          PERMISSIONS_KEY,
          [
            context.getHandler(),
            context.getClass(),
          ],
        );

    if (!requiredPermissions) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{
        user?: JwtPayload;
      }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'User information is missing',
      );
    }

    const userPermissions =
      ROLE_PERMISSIONS[user.role] ?? [];

    const hasPermission =
      requiredPermissions.every(
        (permission) =>
          userPermissions.includes(
            permission,
          ),
      );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have the required permission',
      );
    }

    return true;
  }
}
```

---

# 6. PermissionsGuard Flow

```text
Request
↓
PermissionsGuard
↓
Route-এর required permissions বের করে
↓
request.user বের করে
↓
user.role বের করে
↓
ROLE_PERMISSIONS থেকে permissions বের করে
↓
Required permissions match?
├── YES → true
└── NO  → 403
```

Important:

PermissionsGuard ধরে নিচ্ছে authentication আগে হয়ে গেছে।

তাই সাধারণত:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
```

লিখি।

---

# 7. Guard Order

```text
Request
↓
JwtAuthGuard
↓
JWT valid?
├── NO → 401
└── YES
      ↓
request.user = payload
      ↓
PermissionsGuard
↓
Permission আছে?
├── NO → 403
└── YES
      ↓
Controller
```

এই order খুব গুরুত্বপূর্ণ।

`PermissionsGuard`-এর প্রয়োজন:

```ts
request.user
```

আর সেটা তৈরি করছে:

```text
JwtAuthGuard
```

---

# 8. Permission Test Endpoint

আমরা test endpoint বানিয়েছিলাম:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.USER_DELETE,
)
@Get('permission-test')
permissionTest(
  @CurrentUser() user: JwtPayload,
) {
  return {
    success: true,
    message: 'Permission granted',
    data: user,
  };
}
```

---

# 9. USER Permission Test

Normal USER-এর permission:

```text
income:read-own
income:create-own
income:update-own
income:delete-own
```

কিন্তু route require করছে:

```text
user:delete
```

তাই:

```text
USER
↓
JWT valid ✅
↓
PermissionsGuard
↓
USER_DELETE নেই ❌
↓
403 Forbidden
```

Actual response:

```json
{
  "message": "You do not have the required permission",
  "error": "Forbidden",
  "statusCode": 403
}
```

Test Passed ✅

---

# 10. ADMIN Permission Test

ADMIN-এর permission list-এ:

```text
user:delete
```

আছে।

তাই:

```text
ADMIN
↓
JWT valid ✅
↓
PermissionsGuard
↓
USER_DELETE আছে ✅
↓
Controller
↓
200 OK
```

Response:

```json
{
  "success": true,
  "message": "Permission granted",
  "data": {
    "sub": 2,
    "name": "Rahim",
    "email": "rahim@example.com",
    "role": "admin"
  }
}
```

Test Passed ✅

---

# 11. Multiple Permissions

আমাদের Guard-এ:

```ts
requiredPermissions.every(
  (permission) =>
    userPermissions.includes(permission),
);
```

ব্যবহার করেছি।

`every()` মানে সব required permission থাকতে হবে।

Example:

```ts
@Permissions(
  Permission.USER_READ,
  Permission.USER_DELETE,
)
```

তাহলে:

```text
USER_READ   ✅
USER_DELETE ✅
----------------
ACCESS      ✅
```

কিন্তু:

```text
USER_READ   ✅
USER_DELETE ❌
----------------
ACCESS      ❌
403
```

---

# 12. every() vs some()

## every()

```ts
requiredPermissions.every(...)
```

মানে:

```text
A AND B AND C
```

সবগুলো permission দরকার।

---

## some()

```ts
requiredPermissions.some(...)
```

মানে:

```text
A OR B OR C
```

যেকোনো একটা permission থাকলেই access পাওয়া যাবে।

Example:

```text
Required:
USER_READ
INCOME_READ_OWN

User has:
INCOME_READ_OWN
```

`every()`:

```text
false
→ 403
```

`some()`:

```text
true
→ access
```

আমাদের current design:

```text
every()
= ALL permissions required
```

---

# 13. Permission vs Ownership

আজকের সবচেয়ে গুরুত্বপূর্ণ conceptগুলোর একটি।

Permission check এবং ownership check এক জিনিস নয়।

## Permission

প্রশ্ন:

```text
User কি এই action করতে পারবে?
```

Example:

```text
INCOME_DELETE_OWN
```

মানে user নিজের income delete করার capability রাখে।

---

## Ownership

প্রশ্ন:

```text
যে income delete করতে যাচ্ছে,
সেটা কি আসলেই তার নিজের?
```

Example:

```text
Current user id = 3

Income id = 42
Income owner id = 2
```

User-এর:

```text
INCOME_DELETE_OWN
```

permission থাকলেও income 42 delete করতে পারবে না।

কারণ:

```text
3 !== 2
```

---

# 14. Permission Does NOT Mean Ownership

এটা মনে রাখা খুব গুরুত্বপূর্ণ:

```text
INCOME_DELETE_OWN
```

এর অর্থ:

```text
নিজের income delete করতে পারবে
```

এর অর্থ এটা নয়:

```text
যেকোনো income delete করতে পারবে
```

তাই security-এর দুই layer:

```text
Permission
↓
Ownership
```

---

# 15. Secure GET /incomes

Controller:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.INCOME_READ_OWN,
)
@Get()
findAll(
  @CurrentUser() user: JwtPayload,
) {
  return this.incomeService
    .findAllByUserId(
      user.sub,
    );
}
```

এখানে client থেকে:

```text
userId
```

নিচ্ছি না।

বরং JWT থেকে:

```ts
user.sub
```

নিচ্ছি।

এটা গুরুত্বপূর্ণ security practice।

Wrong design:

```text
GET /incomes?userId=2
```

কারণ user potentially:

```text
userId=3
```

দিয়ে অন্য user-এর data চাইতে পারে।

Better:

```text
JWT
↓
user.sub
↓
findAllByUserId(user.sub)
```

---

# 16. Secure POST /incomes

Controller:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.INCOME_CREATE_OWN,
)
@Post()
createIncome(
  @CurrentUser() user: JwtPayload,
  @Body() body: CreateIncomeDto,
) {
  return this.incomeService
    .createIncome(
      user.sub,
      body,
    );
}
```

Again:

```text
userId client body থেকে না
```

বরং:

```text
JWT → user.sub
```

---

# 17. Secure POST /incomes/with-history

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.INCOME_CREATE_OWN,
)
@Post('with-history')
createIncomeWithHistory(
  @CurrentUser() user: JwtPayload,
  @Body() body: CreateIncomeDto,
) {
  return this.incomeService
    .createIncomeWithHistory(
      user.sub,
      body,
    );
}
```

Security:

```text
JWT
↓
Permission
↓
Current user ID
↓
Create own income
```

---

# 18. Repository — Find Income with Owner

Ownership check করার জন্য income-এর সাথে user relation দরকার।

Example:

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

তখন পাওয়া যায়:

```text
income.id
income.annualIncome
income.user.id
```

Ownership check:

```ts
income.user.id === userId
```

---

# 19. Secure DELETE /incomes/:id

Controller:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.INCOME_DELETE_OWN,
)
@Delete(':id')
deleteIncome(
  @CurrentUser() user: JwtPayload,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.incomeService
    .deleteOwnIncome(
      user.sub,
      id,
    );
}
```

---

# 20. Delete Ownership Check

Service:

```ts
async deleteOwnIncome(
  userId: number,
  incomeId: number,
) {
  const income =
    await this.incomeRepository
      .findById(incomeId);

  if (!income) {
    throw new NotFoundException(
      `Income with id ${incomeId} not found`,
    );
  }

  if (income.user.id !== userId) {
    throw new ForbiddenException(
      "You cannot delete another user's income",
    );
  }

  const deleted =
    await this.incomeRepository
      .delete(incomeId);

  if (!deleted) {
    throw new NotFoundException(
      `Income with id ${incomeId} not found`,
    );
  }

  return {
    success: true,
    message: 'Income deleted successfully',
  };
}
```

---

# 21. DELETE Security Flow

```text
DELETE /incomes/42
↓
JwtAuthGuard
↓
JWT valid?
├── NO → 401
└── YES
      ↓
PermissionsGuard
↓
INCOME_DELETE_OWN?
├── NO → 403
└── YES
      ↓
Find income 42
↓
Exists?
├── NO → 404
└── YES
      ↓
income.user.id === currentUser.id?
├── NO → 403
└── YES
      ↓
DELETE
↓
200
```

---

# 22. Actual Ownership Test

আমরা অন্য user-এর income delete করার চেষ্টা করেছি।

Result:

```json
{
  "message": "You cannot delete another user's income",
  "error": "Forbidden",
  "statusCode": 403
}
```

এটা confirm করেছে:

```text
JWT valid ✅
Permission valid ✅
Ownership invalid ❌
↓
403
```

Test Passed ✅

---

# 23. Secure GET /incomes/:id

Service:

```ts
async findOwnIncomeById(
  userId: number,
  incomeId: number,
) {
  const income =
    await this.incomeRepository
      .findById(incomeId);

  if (!income) {
    throw new NotFoundException(
      `Income with id ${incomeId} not found`,
    );
  }

  if (income.user.id !== userId) {
    throw new ForbiddenException(
      "You cannot access another user's income",
    );
  }

  return income;
}
```

Controller:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.INCOME_READ_OWN,
)
@Get(':id')
findOne(
  @CurrentUser() user: JwtPayload,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.incomeService
    .findOwnIncomeById(
      user.sub,
      id,
    );
}
```

---

# 24. Secure PATCH /incomes/:id

Update-এর জন্য নতুন permission:

```ts
INCOME_UPDATE_OWN =
  'income:update-own',
```

Role mapping-এ add:

```ts
Permission.INCOME_UPDATE_OWN,
```

Controller:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.INCOME_UPDATE_OWN,
)
@Patch(':id')
updateIncome(
  @CurrentUser() user: JwtPayload,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: UpdateIncomeDto,
) {
  return this.incomeService
    .updateOwnIncome(
      user.sub,
      id,
      body,
    );
}
```

---

# 25. PATCH Ownership Check

Service pattern:

```ts
async updateOwnIncome(
  userId: number,
  incomeId: number,
  data: UpdateIncomeDto,
) {
  const existingIncome =
    await this.incomeRepository
      .findById(incomeId);

  if (!existingIncome) {
    throw new NotFoundException(
      `Income with id ${incomeId} not found`,
    );
  }

  if (
    existingIncome.user.id !== userId
  ) {
    throw new ForbiddenException(
      "You cannot update another user's income",
    );
  }

  // update business logic...
}
```

Flow:

```text
PATCH
↓
Authentication
↓
INCOME_UPDATE_OWN
↓
Ownership
↓
Update
```

---

# 26. Secure PUT /incomes/:id

PUT-ও secure করতে হবে।

কারণ PATCH secure কিন্তু PUT insecure থাকলে attacker PUT ব্যবহার করে ownership bypass করতে পারে।

Controller:

```ts
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@Permissions(
  Permission.INCOME_UPDATE_OWN,
)
@Put(':id')
replaceIncome(
  @CurrentUser() user: JwtPayload,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: ReplaceIncomeDto,
) {
  return this.incomeService
    .replaceOwnIncome(
      user.sub,
      id,
      body,
    );
}
```

Service-এর শুরুতে:

```text
Find income
↓
404 if missing
↓
Check owner
↓
403 if another user
↓
Replace
```

---

# 27. Why Every Endpoint Must Be Protected

ধরো:

```text
PATCH /incomes/:id
```

secure।

কিন্তু:

```text
PUT /incomes/:id
```

secure না।

তাহলে attacker শুধু method change করে:

```text
PATCH ❌

PUT ✅
```

security bypass করতে পারে।

তাই resource-এর সব mutation path review করতে হবে।

---

# 28. Final Income Authorization Matrix

```text
GET /incomes
→ INCOME_READ_OWN
→ own records only

GET /incomes/:id
→ INCOME_READ_OWN
→ ownership check

POST /incomes
→ INCOME_CREATE_OWN

POST /incomes/with-history
→ INCOME_CREATE_OWN

PATCH /incomes/:id
→ INCOME_UPDATE_OWN
→ ownership check

PUT /incomes/:id
→ INCOME_UPDATE_OWN
→ ownership check

DELETE /incomes/:id
→ INCOME_DELETE_OWN
→ ownership check
```

---

# 29. Three Security Layers

আজকের সবচেয়ে গুরুত্বপূর্ণ architecture:

```text
Request
↓
1. Authentication
↓
2. Permission
↓
3. Ownership
↓
Business Logic
```

### Layer 1 — Authentication

```text
Who are you?
```

Handled by:

```text
JwtAuthGuard
```

Fail:

```text
401 Unauthorized
```

### Layer 2 — Permission

```text
Can you perform this action?
```

Handled by:

```text
PermissionsGuard
```

Fail:

```text
403 Forbidden
```

### Layer 3 — Ownership

```text
Can you perform the action
on THIS specific resource?
```

Handled by service/business logic।

Fail:

```text
403 Forbidden
```

---

# 30. Full Security Flow

```text
CLIENT
  ↓
Bearer Access Token
  ↓
JwtAuthGuard
  ↓
Token valid?
├── NO
│    ↓
│   401 Unauthorized
│
└── YES
     ↓
request.user
     ↓
PermissionsGuard
     ↓
Required permission?
├── Missing
│    ↓
│   403 Forbidden
│
└── Granted
     ↓
Controller
     ↓
Service
     ↓
Load Resource
     ↓
Ownership Check
├── Wrong Owner
│    ↓
│   403 Forbidden
│
└── Correct Owner
     ↓
Business Logic
     ↓
Repository
     ↓
Database
     ↓
Response
```

---

# 31. 401 vs 403 vs 404

## 401 Unauthorized

Authentication problem।

Example:

```text
No token
Invalid token
Expired token
```

---

## 403 Forbidden

User authenticated, কিন্তু action/resource access allowed না।

Example:

```text
USER tries USER_DELETE

or

User 3 tries to delete User 2's income
```

---

## 404 Not Found

Requested resource নেই।

Example:

```text
DELETE /incomes/999999
```

যদি income না থাকে:

```text
404 Not Found
```

---

# 32. Important Security Lesson — Never Trust Client userId

Bad:

```json
{
  "annualIncome": 1000000,
  "userId": 2
}
```

Client যদি change করে:

```json
{
  "userId": 3
}
```

তাহলে ownership vulnerability তৈরি হতে পারে।

Better:

```text
JWT
↓
request.user
↓
user.sub
```

Controller:

```ts
@CurrentUser() user: JwtPayload
```

তারপর:

```ts
user.sub
```

কে trusted authenticated identity হিসেবে ব্যবহার করি।

---

# 33. Role, Permission & Ownership Comparison

```text
ROLE
"What type of user are you?"

Example:
ADMIN
USER
```

```text
PERMISSION
"What action are you allowed to perform?"

Example:
INCOME_DELETE_OWN
USER_DELETE
```

```text
OWNERSHIP
"Does this particular resource belong to you?"

Example:
income.user.id === user.sub
```

Combined:

```text
Role
↓
Permission
↓
Ownership
```

---

# 34. Day 14 vs Day 15

Day 14:

```text
Authentication
+
Role-Based Authorization
```

Example:

```ts
@Roles(UserRole.ADMIN)
```

Day 15:

```text
Permission-Based Authorization
+
Resource Ownership
```

Example:

```ts
@Permissions(
  Permission.INCOME_DELETE_OWN,
)
```

তারপর:

```ts
if (income.user.id !== userId) {
  throw new ForbiddenException();
}
```

---

# 35. Quick Recall Questions

### Q1. Role কী?

Broad user category।

```text
USER / ADMIN
```

### Q2. Permission কী?

Specific action capability।

```text
income:delete-own
```

### Q3. `@Permissions()` কি permission check করে?

না।

শুধু metadata store করে।

### Q4. Actual permission কে check করে?

```text
PermissionsGuard
```

### Q5. `every()` মানে কী?

সব required permission থাকতে হবে।

```text
A AND B
```

### Q6. `some()` মানে কী?

যেকোনো একটি থাকলেই হবে।

```text
A OR B
```

### Q7. Permission থাকলেই কি যেকোনো income delete করা যাবে?

না।

Ownership check করতে হবে।

### Q8. Ownership কীভাবে check করছি?

```ts
income.user.id === user.sub
```

### Q9. অন্য user-এর income delete করলে?

```text
403 Forbidden
```

### Q10. Invalid JWT হলে?

```text
401 Unauthorized
```

### Q11. Income না থাকলে?

```text
404 Not Found
```

### Q12. userId body/query থেকে নেওয়া ভালো?

নিজের resource-এর ক্ষেত্রে না।

Authenticated identity:

```ts
user.sub
```

থেকে নেওয়া safer।

---

# 36. Day 15 Final Mental Model

```text
                    REQUEST
                       ↓
                 JwtAuthGuard
                       ↓
              Authentication
                       ↓
               JWT Payload
                       ↓
                 request.user
                       ↓
              PermissionsGuard
                       ↓
                 Permission
                       ↓
                  Controller
                       ↓
                    Service
                       ↓
               Load Resource
                       ↓
                  Ownership
                       ↓
               Business Logic
                       ↓
                  Repository
                       ↓
                   Database
```

Errors:

```text
Invalid identity
→ 401

Valid identity
but permission missing
→ 403

Permission exists
but wrong resource owner
→ 403

Resource doesn't exist
→ 404

Everything valid
→ 200 / 201
```

---

# 37. Day 15 Status

Completed:

- [x] Permission enum
- [x] Role → Permission mapping
- [x] `@Permissions()` decorator
- [x] `PermissionsGuard`
- [x] Reflector metadata reading
- [x] `every()` permission checking
- [x] `every()` vs `some()`
- [x] USER permission failure test
- [x] ADMIN permission success test
- [x] `403 Forbidden` permission test
- [x] Permission applied to real Income API
- [x] `INCOME_READ_OWN`
- [x] `INCOME_CREATE_OWN`
- [x] `INCOME_UPDATE_OWN`
- [x] `INCOME_DELETE_OWN`
- [x] Resource ownership concept
- [x] Secure GET
- [x] Secure POST
- [x] Secure PATCH pattern
- [x] Secure PUT pattern
- [x] Secure DELETE
- [x] Cross-user DELETE blocked
- [x] Authentication vs Permission vs Ownership

---

# Day 15 Complete ✅

## Key Takeaway

```text
Authentication
→ Who are you?

Role
→ What group are you in?

Permission
→ What action can you perform?

Ownership
→ Can you perform it on THIS resource?
```

Final security pipeline:

```text
JWT
↓
Authentication
↓
Permission
↓
Ownership
↓
Business Logic
↓
Database
```

## Next — Day 16

```text
Database Schema Management
↓
TypeORM Migrations
↓
Entity Change
↓
Migration Generate
↓
Migration Run
↓
Rollback
↓
Production-safe Database Changes
```