# Day 12 Learnings: Authentication and RBAC

## What I Learned

Today I learned how to design and secure backend authentication and authorization flows for production-style APIs.

1. I learned how to implement JWT-based authentication in a structured service layer.
- create access and refresh tokens with clear payloads
- verify token validity and handle expiration cleanly
- enforce token issuer and audience checks
- use refresh token flow to avoid forcing repeated logins

2. I learned how to create strong password security rules.
- enforce length, uppercase, lowercase, number, and special character requirements
- hash passwords with bcrypt and proper salt rounds
- compare passwords securely during login
- return clear validation errors without exposing sensitive details

3. I learned how to build Role-Based Access Control (RBAC).
- protect routes with authentication middleware first
- apply role checks for admin, moderator, and user permissions
- reject unauthorized actions with proper HTTP status codes (`401` vs `403`)
- keep authorization logic reusable through middleware composition

4. I learned the OAuth2 and social login integration flow.
- configure provider strategies (Google, Facebook, GitHub)
- map provider profiles to existing users or create new users safely
- support account linking when the same email exists
- keep callback handling and user serialization clean for session usage

5. I learned practical session and token management patterns.
- track login/logout lifecycle
- invalidate sessions/tokens when needed
- reduce security risk with token expiration and rotation
- support optional authentication for mixed public/private endpoints

6. I learned API security hardening practices around auth.
- apply input validation before auth business logic
- avoid leaking internal details in auth error responses
- keep secrets in environment variables
- add audit-friendly logging for security-sensitive events

## Key Technical Concepts I Practiced

- JWT access token and refresh token lifecycle
- Authentication middleware and optional authentication
- RBAC authorization middleware pattern
- OAuth2 provider strategy setup and callback flow
- Password policy enforcement and bcrypt hashing
- Secure error handling for auth-related failures

## Summary

Day 12 helped me move from basic login logic to a full authentication architecture with JWT, OAuth2, RBAC, and secure session practices suitable for real backend systems.
