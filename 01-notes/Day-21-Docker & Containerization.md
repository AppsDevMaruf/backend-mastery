Day 21 --- Docker & Containerization

1. আমরা কেন Docker শিখলাম?

Local machine-এ application চললেও production/server-এ একই environment
থাকবে---এটার guarantee নেই।

Docker আমাদের application + runtime + dependencies-কে একটি reproducible
package বা Image হিসেবে তৈরি করতে সাহায্য করে।

NestJS Source Code
      ↓
Dockerfile
      ↓
Docker Image
      ↓
Docker Container
      ↓
Running NestJS API

মূল ধারণা: Build once, run consistently across environments.

2. Image vs Container vs Volume

Docker Image --- application-এর packaged blueprint/template;
code, runtime ও dependencies থাকে।

Docker Container --- Image-এর running instance; এখানেই NestJS
process চলে।

Docker Volume --- persistent storage; container remove/recreate
হলেও database data রাখতে পারে।

PostgreSQL volume:

volumes:
  - postgres_data:/var/lib/postgresql/data

docker compose down করলে volume থাকে। docker compose down -v করলে
volume-ও remove হয় এবং database data হারাতে পারে।

3. Docker Compose

Docker Compose
│
├── api
│    └── NestJS
│
└── db
     └── PostgreSQL

Compose একই network-এ services চালায় এবং service name DNS hostname
হিসেবে ব্যবহার করা যায়।

4. localhost:5433 vs db:5432

ports:
  - "5433:5432"

Mac থেকে Docker PostgreSQL:

localhost:5433

API container থেকে:

DB_HOST=db
DB_PORT=5432

localhost API container-এর ভিতরে API container-কেই বোঝায়; PostgreSQL
container-কে নয়।

5. PostgreSQL Healthcheck

healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d ${DB_NAME}"]
  interval: 5s
  timeout: 5s
  retries: 5

API:

depends_on:
  db:
    condition: service_healthy

Container start হওয়া আর PostgreSQL connection নেওয়ার জন্য ready হওয়া একই
বিষয় নয়। service_healthy ব্যবহার করলে DB healthy হওয়ার পরে API start
হয়।

6. Database Migration

Production-minded TypeORM setup:

synchronize: false

Fresh database-এর initial structure তৈরি করতে InitialSchema migration
দরকার।

InitialSchema
      ↓
AddIncomeQueryIndex
      ↓
Future migrations...

CREATE TABLE নতুন table তৈরি করে, আর ALTER TABLE existing table
modify করে। তাই fresh DB-তে table না থাকলে শুধু ALTER TABLE users ...
migration fail করবে।

7. Migration Tracking

TypeORM migrations table-এ executed migrations track করে।

npm run migration:run

সব migration apply করা থাকলে:

No migrations are pending

8. Docker Volume Persistence Test

INSERT INTO income_history (message)
VALUES ('Docker volume persistence test');

তারপর docker compose down এবং docker compose up -d করার পরেও record
ছিল। অর্থাৎ container lifecycle এবং database data lifecycle আলাদা; data
volume-এ persist করে।

9. Multi-stage Docker Build

Builder Stage
    ↓
npm ci
    ↓
NestJS build
    ↓
dist/

Production Stage
    ↓
production dependencies
    ↓
copy dist
    ↓
run application

এতে production image cleaner হয়।

10. Non-root Container

Dockerfile:

USER node

Verification:

docker compose exec api whoami

Expected:

node

এটি Principle of Least Privilege: application-এর যতটুকু permission
প্রয়োজন, শুধু ততটুকুই দেওয়া।

11. Useful Commands

docker compose build api
docker compose up -d
docker compose ps
docker compose logs api
docker compose down
docker compose down -v
docker exec -it first-api-db psql -U marufalam -d bd_tax
docker compose run --rm migrate
docker compose exec api whoami
curl http://localhost:3000
docker images
docker ps -a

Day 21 Mental Model

Dockerfile
    ↓
  IMAGE
    ↓
CONTAINER
    ↓
NestJS API
    │
Docker Network
    │
    ↓
PostgreSQL
    │
    ↓
  VOLUME
    │
    ↓
Persistent Data

Production deployment thinking:

Code
 ↓
Test
 ↓
Build Docker Image
 ↓
Run Migration
 ↓
Migration Success
 ↓
Deploy New API

Day 21 Recap

Docker Image = packaged blueprint/template

Docker Container = running instance

Docker Volume = persistent storage

Mac → Docker PostgreSQL = localhost:5433

API container → PostgreSQL = db:5432

service_healthy ensures PostgreSQL is ready before API starts

InitialSchema creates the starting database structure

synchronize: false + migrations keeps schema changes controlled

USER node applies the Principle of Least Privilege

Production-minded order: migration succeeds before deploying the new
API

