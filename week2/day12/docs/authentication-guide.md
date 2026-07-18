# Authentication & Authorization Guide

This guide details the security architecture, token lifecycle operations, social authentication bridges, and role-based permissions matrix implemented for Day 12.

---

## 🔐 Token Lifecycle & Password Security

We implement a stateless **Access & Refresh Token** schema:

```
                  ┌──────────────────────────────┐
                  │      POST /auth/login        │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                     Generate Access & Refresh
                                 │
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
   Access Token (7 days)                     Refresh Token (30 days)
   - Used for resource requests              - Kept secure
   - Payload: userId, email, role            - Used to rotate access tokens
```

### 1. Token Lifetime & Payload:
- **Access Token**: Expires in `7d`. Contains basic user details (`userId`, `email`, `role`) with standard JWT parameters (`iss`: `sda-training-api`, `aud`: `sda-training-client`).
- **Refresh Token**: Expires in `30d`. Contains ONLY the user ID and `type: 'refresh'` tag. Used exclusively via `POST /api/v1/auth/refresh` to mint a new access/refresh pair (token rotation).

### 2. Password Policies:
Passwords must satisfy:
- Minimum length: `8` characters.
- At least 1 uppercase letter.
- At least 1 lowercase letter.
- At least 1 number.
- At least 1 special character (`[!@#$%^&*...]`).
- Hashing is performed using **bcryptjs** with a cost factor of `12` rounds.

---

## 🌐 OAuth2 & Social Logins

We orchestrate social logins using **Passport.js** with session management configurations:

```
User ──► GET /auth/github ──► Redirect GitHub Auth ──► Consent ──► Callback /auth/github/callback
                                                                               │
                                                                               ▼
                                                                     Generate JWT pair
```

### Strategies Configured:
1. **Google Strategy**: Binds user details to Mongoose via `googleId`. Falls back to email query lookup to unify accounts.
2. **Facebook Strategy**: Queries fields `['id', 'emails', 'name', 'picture']` and maps user profile.
3. **GitHub Strategy**: Resolves access scopes (`user:email`) to record user details.

---

## 🚦 Role-Based Access Control (RBAC)

We implement fine-grained permissions mapping to target actions. Instead of checking roles directly on endpoints, we assert action permissions:

```
[Request] ──► [requirePermission('products:write')] ──► Roles array check ──► Allow/Deny
```

### Permissions Matrix:

| Permission | Description | Allowed Roles |
|---|---|---|
| `users:read` / `users:write` | Administrative User operations | `admin`, `moderator` (read-only) |
| `products:read` | Catalog read access | `admin`, `moderator`, `user` |
| `products:write` | Catalog update/create | `admin`, `moderator` |
| `products:delete` | Catalog deletions | `admin` |
| `orders:read` / `orders:write` | Transaction operations | `admin`, `moderator`, `user` |
| `analytics:read` | Aggregation statistics | `admin`, `moderator` |
| `system:*` | System configurations | `admin` |

### Special Authorization Guards:
- **`requireOwnership(field)`**: Confirms resource ownership (e.g. standard user updates their own profile details, but cannot edit another user's profile). Admins automatically bypass this check.
- **`requireRole(...roles)`**: Restricts actions directly by matching the user's role.
