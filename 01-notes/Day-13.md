নিচেরটা **একবারে পুরোটা copy করে `Day-13.md` file-এ paste** করতে পারো।

````md
# Day 13 — Authentication Fundamentals

## Goal

আজকের লক্ষ্য ছিল:

- Authentication vs Authorization বোঝা
- Login flow বোঝা
- Password plain text-এ কেন রাখা যাবে না
- Password hashing
- Hashing vs Encryption
- Salt concept
- Login-এর সময় password verify কীভাবে হয়
- JWT কী
- JWT কেন দরকার
- JWT structure
- JWT payload
- JWT signature
- JWT expiry
- Access Token
- Refresh Token
- JWT Guard
- Role / Permission Guard
- 401 Unauthorized
- 403 Forbidden
- Protected route flow

---

# 1. Authentication কী?

Authentication-এর প্রশ্ন:

```text
"তুমি কে?"
````

Example:

```text
Email + Password
↓
Backend verify
↓
Valid user?
├── Yes → Authentication successful
└── No  → Reject
```

Login হলো Authentication-এর common example।

---

# 2. Authorization কী?

Authorization-এর প্রশ্ন:

```text
"তুমি কী করতে পারো?"
```

Example:

```text
User authenticated ✅
↓
Admin-only endpoint
↓
Role / Permission check
↓
Permission আছে?
├── Yes → Allow
└── No  → 403 Forbidden
```

---

# 3. Authentication vs Authorization

```text
Authentication
→ তুমি কে?

Authorization
→ তুমি কী করতে পারো?
```

Visual:

```text
Login
↓
Authentication
↓
Identity পাওয়া গেল
↓
Authorization
↓
Permission check
↓
Allowed / Forbidden
```

---

# 4. Example

ধরো user:

```text
Correct email/password দিয়েছে
JWT valid
```

কিন্তু Admin-only endpoint call করেছে।

Result:

```text
Authentication ✅
Authorization ❌
↓
403 Forbidden
```

---

# 5. Plain Text Password Storage

Bad design:

```text
email              password
-----------------  --------
maruf@example.com  123456
```

এটা dangerous।

কারণ database leak হলে actual password দেখা যাবে।

---

# 6. Password Hashing

Correct flow:

```text
Plain Password
↓
Hash Function
↓
One-way Hash
↓
Database
```

Example:

```text
123456
↓
$2b$12$...
```

Database-এ original password না, hash রাখা হয়।

---

# 7. Hashing vs Encryption

```text
Encryption
→ reversible
→ decrypt করা যায়

Hashing
→ one-way
→ original password directly ফেরত পাওয়া যায় না
```

Password-এর জন্য:

```text
Hashing ✅
Encryption ❌
```

---

# 8. Password Hashing কেন?

কারণ:

```text
Database leak
↓
Plain password পাওয়া যাবে না
```

Hashing password storage-এর security improve করে।

---

# 9. Salt কী?

Salt হলো random value যা password hashing-এর সাথে use হয়।

Example:

```text
Password = 123456
```

User A:

```text
123456 + Salt A
↓
Hash X
```

User B:

```text
123456 + Salt B
↓
Hash Y
```

Same password হলেও hash different হতে পারে।

---

# 10. Salt কেন Important?

Without proper salt:

```text
Same Password
→ Same Hash হওয়ার risk
```

With salt:

```text
Same Password
+
Different Salt
→ Different Hash
```

এটা precomputed attacks কঠিন করে।

---

# 11. Login-এর সময় Password কীভাবে Check হয়?

Backend stored hash decrypt করে না।

Flow:

```text
Login Password
↓
Hashing Library Compare
↓
Stored Password Hash
↓
Match?
├── Yes → Valid Credentials
└── No  → Invalid Credentials
```

Conceptually:

```ts
const isMatch = await bcrypt.compare(
  loginPassword,
  storedPasswordHash,
);
```

---

# 12. Password Direct Compare করা যাবে না

Wrong:

```ts
loginPassword === storedPasswordHash
```

কারণ:

```text
Plain Password
≠
Password Hash
```

Correct:

```ts
bcrypt.compare(...)
```

অথবা অন্য secure password hashing library-এর verify function।

---

# 13. Invalid Password

Example:

```ts
if (!isMatch) {
  throw new UnauthorizedException(
    'Invalid email or password',
  );
}
```

HTTP:

```text
401 Unauthorized
```

---

# 14. Register Flow

```text
POST /auth/register
↓
Email + Password
↓
DTO Validation
↓
Check existing user
↓
Hash password
↓
Save user
↓
Database
```

Database:

```text
email
password_hash
```

---

# 15. Login Flow

```text
POST /auth/login
↓
Email + Password
↓
Find user by email
↓
Verify password
↓
Credentials valid?
├── No → 401
└── Yes
      ↓
    JWT generate
      ↓
    Return token
```

---

# 16. JWT কী?

JWT = JSON Web Token।

Login-এর পরে backend user-কে token দিতে পারে।

Flow:

```text
Login successful
↓
Backend generates JWT
↓
Client receives JWT
↓
Future API requests-এ token পাঠায়
```

---

# 17. JWT কেন দরকার?

প্রতি protected API call-এ email/password পাঠানো উচিত না।

Instead:

```text
Login once
↓
JWT receive
↓
Future requests
↓
JWT দিয়ে identity prove
```

---

# 18. Android Client Flow

```text
Login Screen
↓
POST /auth/login
↓
Access Token
↓
Secure Storage / DataStore
↓
Future API Request
↓
Authorization Header
```

Example:

```http
Authorization: Bearer <access-token>
```

---

# 19. Protected API Flow

```text
GET /incomes
↓
Authorization: Bearer <token>
↓
Backend verifies token
↓
User identity পাওয়া গেল
↓
Request continue
```

Email/password আবার লাগবে না।

---

# 20. JWT Structure

JWT সাধারণত ৩টি অংশ:

```text
HEADER.PAYLOAD.SIGNATURE
```

Shape:

```text
xxxxx.yyyyy.zzzzz
```

---

# 21. JWT Header

Header-এ token-related metadata থাকে।

Conceptually:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

---

# 22. JWT Payload

Payload-এ claims থাকে।

Example:

```json
{
  "sub": 1,
  "email": "maruf@example.com",
  "role": "USER"
}
```

---

# 23. sub কী?

`sub` = subject।

Meaning:

```text
Token কার জন্য issue হয়েছে
```

Example:

```json
{
  "sub": 1
}
```

মানে token User ID 1-এর জন্য।

---

# 24. JWT Payload-এ কী রাখা যায়?

Common claims:

```text
userId / sub
email
role
small permission-related claims
token metadata
```

---

# 25. JWT Payload-এ কী রাখা উচিত না?

```text
password ❌
passwordHash ❌
secret key ❌
card information ❌
sensitive personal data ❌
large profile object ❌
```

---

# 26. JWT Payload Secret Storage না

Important:

```text
JWT Signed
≠
JWT Encrypted
```

JWT payload সাধারণত decode করা যায়।

তাই sensitive data রাখা উচিত না।

---

# 27. Password Hash JWT-তে কেন রাখা যাবে না?

যদিও password hash plain password না, এটা still security-sensitive।

কারণ:

```text
JWT payload decode করা যায়
↓
Hash leak হতে পারে
↓
Offline password cracking attempt হতে পারে
```

তাই:

```text
Minimum necessary claims only
```

---

# 28. JWT Signature

JWT:

```text
HEADER.PAYLOAD.SIGNATURE
```

Signature token integrity protect করে।

Conceptually:

```text
Header + Payload
↓
Signing Secret / Private Key
↓
Signature
```

---

# 29. Signature-এর কাজ

Signature verify করে:

```text
Token trusted issuer থেকে এসেছে?
+
Token modify করা হয়েছে?
```

---

# 30. Token Tampering Example

Original:

```json
{
  "sub": 1,
  "role": "USER"
}
```

Attacker change করল:

```json
{
  "sub": 1,
  "role": "ADMIN"
}
```

কিন্তু পুরনো signature আর match করবে না।

Flow:

```text
Modified Payload
↓
Backend verifies signature
↓
Signature mismatch
↓
Token invalid
↓
401 Unauthorized
```

---

# 31. Attacker কেন New Signature বানাতে পারবে না?

কারণ signing secret/private key তার কাছে নেই।

```text
Payload modify করা সহজ হতে পারে
↓
Valid signature বানানো যাবে না
↓
Backend reject করবে
```

---

# 32. Signature vs Encryption

```text
Signature
→ integrity
→ tampering detect করে

Encryption
→ confidentiality
→ data hide করে
```

JWT সাধারণত signed হয়, encrypted না।

---

# 33. JWT Expiry

JWT-এর expiry থাকতে পারে।

Example payload:

```json
{
  "sub": 1,
  "exp": 1787050000
}
```

`exp` মানে token কত সময় পর্যন্ত valid।

---

# 34. Expired JWT

```text
Signature valid ✅
Expiry passed ❌
↓
Token invalid
↓
401 Unauthorized
```

---

# 35. Expired Token মানে Permission হারানো না

Important distinction:

```text
Token expired
≠
User account permission removed
```

Meaning:

```text
এই specific authentication credential আর valid না
```

---

# 36. Access Token

Access Token:

```text
Short-lived token
```

Use:

```text
Protected API call
```

Example:

```http
Authorization: Bearer <access-token>
```

---

# 37. Access Token Flow

```text
Login
↓
Access Token
↓
GET /incomes
↓
Token valid?
├── Yes → API continue
└── No  → 401
```

---

# 38. Refresh Token

Refresh Token:

```text
Longer-lived credential
```

Purpose:

```text
New Access Token নেওয়া
```

---

# 39. Access vs Refresh Token

```text
Access Token
→ short-lived
→ protected API calls

Refresh Token
→ longer-lived
→ new Access Token issue করার জন্য
```

---

# 40. Token Response

Example:

```json
{
  "accessToken": "short-lived-token",
  "refreshToken": "long-lived-token"
}
```

---

# 41. Access Token Expired Flow

```text
GET /incomes
↓
Access Token expired
↓
401
↓
POST /auth/refresh
↓
Refresh Token verify
↓
New Access Token
↓
Retry API
```

---

# 42. Refresh Token Valid থাকলে

User-কে আবার email/password দিতে হয় না।

```text
Access Token Expired
↓
Refresh Token Valid
↓
New Access Token
```

---

# 43. Refresh Token Invalid হলে

```text
Refresh Token expired / invalid / revoked
↓
New token issue হবে না
↓
User must login again
```

---

# 44. JWT Guard

NestJS Guard route execute হওয়ার আগে request check করতে পারে।

Visual:

```text
Request
↓
JWT Guard
↓
Token exists?
↓
Token valid?
↓
User authenticated?
├── No → 401
└── Yes
      ↓
Controller
```

---

# 45. Protected Route

Conceptually:

```ts
@UseGuards(JwtAuthGuard)
@Get('incomes')
getIncomes() {
  return this.incomeService.findAll();
}
```

---

# 46. JWT Guard Flow

```text
HTTP Request
↓
JwtAuthGuard
↓
Authorization Header
↓
Bearer Token extract
↓
JWT verify
↓
Valid?
├── No → 401
└── Yes
      ↓
request.user
      ↓
Controller
```

---

# 47. request.user

JWT verify করার পর user identity request-এর সাথে attach করা যেতে পারে।

Example:

```ts
request.user = {
  userId: 1,
  email: 'maruf@example.com',
  role: 'USER',
};
```

---

# 48. Missing Token

```text
GET /incomes
↓
No Authorization Header
↓
JWT Guard
↓
Authentication fail
↓
401 Unauthorized
```

---

# 49. Invalid Token

```text
Invalid Signature
↓
JWT Guard
↓
Reject
↓
401 Unauthorized
```

---

# 50. Expired Token

```text
Expired Access Token
↓
JWT Guard
↓
Reject
↓
401 Unauthorized
```

---

# 51. Role / Permission Guard

JWT Guard authentication handle করে।

Role / Permission Guard authorization handle করে।

```text
JwtAuthGuard
→ Authentication

RoleGuard
→ Authorization
```

---

# 52. Full Guard Flow

```text
Request
↓
JWT Guard
↓
Token valid?
├── No
│   ↓
│  401 Unauthorized
│
└── Yes
    ↓
Authentication Successful
    ↓
Role / Permission Guard
    ↓
Permission আছে?
├── No
│   ↓
│  403 Forbidden
│
└── Yes
    ↓
Controller
```

---

# 53. JWT Valid but Wrong Role

Example:

```text
Token valid ✅
User authenticated ✅
Role = USER
Required role = ADMIN
```

JWT Guard:

```text
PASS ✅
```

Authorization Guard:

```text
FAIL ❌
```

Response:

```text
403 Forbidden
```

---

# 54. 401 Unauthorized

401 generally means Authentication failed।

Examples:

```text
Token missing
Token invalid
Token expired
Wrong login credentials
```

Mental model:

```text
"আমি verify করতে পারিনি তুমি কে"
```

---

# 55. 403 Forbidden

403 generally means Authorization failed।

Example:

```text
Token valid
User authenticated
Required permission নেই
```

Mental model:

```text
"আমি জানি তুমি কে,
কিন্তু এই কাজের permission তোমার নেই"
```

---

# 56. 401 vs 403

```text
401 Unauthorized
→ Authentication Failure

403 Forbidden
→ Authorization Failure
```

---

# 57. Controller-এর আগে 401 / 403

NestJS Guards Controller method execute হওয়ার আগেই request block করতে পারে।

Flow:

```text
Request
↓
Guard
↓
Failure?
├── Yes → Error Response
└── No  → Controller
```

তাই 401/403 অনেক সময় Controller-এ পৌঁছানোর আগেই return হয়।

---

# 58. Complete Authentication Flow

```text
REGISTER
↓
Email + Password
↓
Password Hash
↓
Database
```

তারপর:

```text
LOGIN
↓
Email + Password
↓
Find User
↓
Password Compare
↓
Valid?
├── No → 401
└── Yes
      ↓
    JWT Generate
      ↓
    Access Token
    Refresh Token
```

তারপর:

```text
Protected Request
↓
Access Token
↓
JWT Guard
↓
Authentication
↓
Role Guard
↓
Authorization
↓
Controller
↓
Service
```

---

# 59. Full Architecture Visual

```text
Android / Client
      │
      │ POST /auth/login
      ▼
Auth Controller
      │
      ▼
Auth Service
      │
      ├── Find User
      │
      ├── Compare Password
      │
      └── Generate JWT
      │
      ▼
Access + Refresh Token
      │
      ▼
Client stores token
      │
      │ GET /incomes
      │ Authorization: Bearer ...
      ▼
JWT Guard
      │
      ├── Invalid → 401
      │
      ▼
Authenticated User
      │
      ▼
Role / Permission Guard
      │
      ├── No Permission → 403
      │
      ▼
Controller
      │
      ▼
Service
      │
      ▼
Repository
      │
      ▼
PostgreSQL
```

---

# 60. Authentication Layers

```text
Password
→ Initial login authentication

Access Token
→ Future request authentication

JWT Guard
→ Access Token verification

Role Guard
→ Authorization

Refresh Token
→ New Access Token generation
```

---

# 61. Security Mental Model

```text
Password
→ never store plain

Password Hash
→ database

JWT Payload
→ minimum claims

JWT Signature
→ integrity

Access Token
→ short-lived

Refresh Token
→ longer-lived

JWT Guard
→ authentication

Role Guard
→ authorization
```

---

# 62. Important Practical Rules

1. Password plain text-এ store করা যাবে না।
2. Password encrypt না করে secure password hashing ব্যবহার করা উচিত।
3. Stored password hash decrypt করা হয় না।
4. Login password hashing library দিয়ে verify করা হয়।
5. JWT payload secret storage না।
6. Password বা password hash JWT payload-এ রাখা যাবে না।
7. JWT signature token tampering detect করে।
8. JWT signature encryption না।
9. Access token short-lived রাখা ভালো।
10. Refresh token access token-এর তুলনায় longer-lived।
11. Expired access token দিয়ে protected API access করা যাবে না।
12. Refresh token valid থাকলে new access token নেওয়া যায়।
13. JWT Guard authentication check করে।
14. Role/Permission Guard authorization check করে।
15. Missing/invalid/expired token → 401।
16. Valid token but insufficient permission → 403।
17. Guard request Controller-এ যাওয়ার আগেই block করতে পারে।

---

# 63. Common Mistakes

## Mistake 1

```text
Database-এ plain password রাখা
```

❌

---

## Mistake 2

JWT payload-এ:

```json
{
  "password": "123456"
}
```

❌

---

## Mistake 3

JWT payload-এ:

```json
{
  "passwordHash": "$2b$..."
}
```

❌

---

## Mistake 4

Token valid হলেই:

```text
Authorization successful
```

ধরা।

Wrong।

Correct:

```text
Token valid
→ Authentication successful

Permission valid
→ Authorization successful
```

---

## Mistake 5

401 এবং 403 একই মনে করা।

Correct:

```text
401
→ Authentication

403
→ Authorization
```

---

# 64. Interview Questions

## Q1. Authentication এবং Authorization-এর difference কী?

Answer:

```text
Authentication verifies identity.
Authorization verifies permission.
```

---

## Q2. Password plain text-এ রাখা উচিত না কেন?

কারণ database leak হলে user-এর actual password expose হয়ে যাবে।

---

## Q3. Hashing এবং Encryption-এর difference কী?

```text
Hashing
→ one-way

Encryption
→ reversible
```

---

## Q4. Login-এর সময় password hash decrypt করা হয়?

না।

Password verification function দিয়ে supplied password stored hash-এর বিরুদ্ধে verify করা হয়।

---

## Q5. JWT-এর 3টি part কী?

```text
Header
Payload
Signature
```

---

## Q6. JWT payload encrypted?

সাধারণ JWT payload encrypted না।

---

## Q7. JWT Signature-এর কাজ কী?

Token integrity verify করা এবং tampering detect করা।

---

## Q8. Access Token এবং Refresh Token-এর difference?

```text
Access Token
→ API access
→ short-lived

Refresh Token
→ new Access Token
→ longer-lived
```

---

## Q9. Token expired হলে status code?

```text
401 Unauthorized
```

---

## Q10. Token valid কিন্তু role নেই?

```text
403 Forbidden
```

---

# 65. Quick Revision

```text
Authentication
→ Who are you?

Authorization
→ What can you do?

Password
→ Hash before storage

JWT
→ Future request identity

Payload
→ Claims, not secrets

Signature
→ Integrity

Access Token
→ Short-lived API credential

Refresh Token
→ New Access Token

JWT Guard
→ Authentication

Role Guard
→ Authorization

401
→ Authentication fail

403
→ Authorization fail
```

---

# 66. Day 13 Status

Completed:

* Authentication ✅
* Authorization ✅
* Authentication vs Authorization ✅
* Plain Password Risk ✅
* Password Hashing ✅
* Hashing vs Encryption ✅
* Salt Concept ✅
* Password Compare / Verify ✅
* Register Flow ✅
* Login Flow ✅
* JWT Introduction ✅
* JWT Structure ✅
* JWT Payload ✅
* JWT Claims ✅
* `sub` Claim ✅
* JWT Sensitive Data Rules ✅
* JWT Signature ✅
* Token Tampering ✅
* JWT Expiry ✅
* Access Token ✅
* Refresh Token ✅
* Access vs Refresh Flow ✅
* JWT Guard ✅
* Protected Route ✅
* request.user Concept ✅
* Role / Permission Guard ✅
* 401 Unauthorized ✅
* 403 Forbidden ✅
* Full Auth Flow ✅

---

# Next

## Day 14 — NestJS Authentication Implementation

Topics:

* AuthModule
* Register DTO
* Login DTO
* Add email/passwordHash to UserEntity
* Database schema update
* Password hashing library
* Register API
* Duplicate email handling
* Login API
* Password verification
* JWT Module
* JWT Secret
* Access Token generation
* JWT Strategy / Guard
* Protected API
* request.user
* Test with curl/Postman

```

এটাই **Day-13.md complete copy-paste note**। 
```
