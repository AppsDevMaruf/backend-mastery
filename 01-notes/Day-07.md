
---

# Day-07.md

````markdown
# Day 07

# NestJS Introduction

## Objective

Understand why NestJS exists before writing any code.

Learn the architecture behind a modern backend application.

---

# What is NestJS?

NestJS is a progressive Node.js framework for building scalable backend applications.

It is built on top of:

- Node.js
- Express (default)
- Fastify (optional)
- TypeScript

---

# Why NestJS?

Without a framework:

```
main.js

5000+ lines
```

Everything becomes difficult to maintain.

NestJS separates responsibilities into different layers.

---

# NestJS Architecture

```
Client

↓

Controller

↓

Service

↓

Repository / Database

↓

Response
```

Every layer has one responsibility.

---

# Request Flow

Android

↓

HTTP Request

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Controller

↓

JSON Response

↓

Android

---

# Responsibilities

## Controller

Receives HTTP Requests.

Returns HTTP Responses.

Should NOT contain business logic.

---

## Service

Contains business logic.

Examples:

- Calculate Tax
- Validate User
- Generate JWT

---

## Repository

Responsible for communicating with the Database.

Examples:

- Save User
- Fetch Profile
- Delete Income

---

# Why Separate Layers?

Bad

```
Controller

↓

Database
```

Everything becomes tightly coupled.

Good

```
Controller

↓

Service

↓

Repository
```

Easy to maintain.

Easy to test.

Easy to scale.

---

# NestJS Folder Structure

```
src/

main.ts

app.module.ts

users/

users.controller.ts

users.service.ts

users.module.ts
```

---

# main.ts

Application Entry Point.

Responsible for starting the application.

---

# Module

A Module groups related Controllers and Services together.

Example

```
Auth Module

Controller

Service
```

---

# Controller

Example Endpoint

GET /profile

Controller receives the request.

Calls the Service.

Returns JSON.

---

# Service

Contains all business logic.

Example

```
calculateTax()

login()

validateUser()
```

---

# Repository

Responsible only for Database operations.

Examples

```
save()

find()

update()

delete()
```

---

# Android Mapping

| Android | NestJS |
| -------- | ------ |
| Activity / Screen | Controller |
| ViewModel | Service |
| Repository | Repository |
| Retrofit | HTTP Client |
| Room | PostgreSQL |

---

# SOLID Principle

NestJS follows Single Responsibility Principle.

Each class should have only one responsibility.

---

# Benefits

- Scalable
- Testable
- Modular
- Easy to Maintain
- Dependency Injection
- TypeScript Support

---

# Key Learning

Controller receives requests.

Service processes business logic.

Repository communicates with the database.

Database stores the data.

---

# My Notes

- Never write business logic inside Controller.
- Controller should be lightweight.
- Service is the brain of the application.
- Repository handles data access.
- NestJS promotes clean architecture.

---

# Interview Notes

Q: What is NestJS?

A:

NestJS is a TypeScript-based backend framework built on top of Node.js that follows a modular architecture and supports Dependency Injection.

---

Q: What is the responsibility of a Controller?

A:

Receive HTTP requests and return HTTP responses.

---

Q: Where should business logic be written?

A:

Inside the Service layer.

---

Q: Why use Repository?

A:

To isolate database operations from business logic and improve maintainability.