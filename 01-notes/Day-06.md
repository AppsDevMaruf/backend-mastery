# Day 06

# API Contract Design

## Objective

Understand what an API Contract is and why it is the foundation of communication between Client and Backend.

---

# What is an API Contract?

An API Contract is a written agreement between the Client (Android/iOS/Web) and the Backend.

It defines:

- Endpoint
- HTTP Method
- Request Body
- Response Body
- Error Response
- Status Codes

Both Client and Backend must follow this contract.

---

# Why is API Contract Important?

Without an API Contract:

- Android developers don't know what to send.
- Backend developers don't know what to return.
- Different implementations create bugs.

A stable API Contract allows backend implementation to change without breaking the client.

---

# Example

## Login API

### Endpoint

POST /auth/login

### Request

```json
{
  "email": "maruf@gmail.com",
  "password": "123456"
}