# Authentication & Authorization Documentation (AUTH)

This document describes the security architecture of the SIA POS system.

## 1. Authentication Flow
The system uses **NextAuth.js** with a JWT strategy.

### Login Flow:
1. User enters email/password in `/auth/login`.
2. `CredentialsProvider` hashes and compares the password with `PrismaAdapter` (PostgreSQL).
3. If successful:
   - `failedAttempts` is reset to 0.
   - `lastLogin` is updated.
   - A JWT is issued containing `id`, `role`, and `permissions`.
4. If failed:
   - `failedAttempts` is incremented.
   - If >= 5 attempts, `lockoutUntil` is set to +15 minutes.
   - Event is logged in `AuditLog`.

## 2. Authorization (RBAC)
We use a role-based access control system defined in the `Role` and `Permission` models.

### Role -> Permission Matrix
| Role | Recommended Permissions |
| :--- | :--- |
| **ADMIN** | `MANAGE_PRODUCTS`, `MANAGE_SETTINGS`, `VIEW_REPORTS`, `VIEW_USERS`, etc. |
| **CASHIER** | `CREATE_SALE`, `VIEW_SALES`, `VIEW_PRODUCT`. |

### Client-side Protection:
- Hook: `usePermissions()`
- Component: `<RequirePermission permission="CREATE_SALE">`
- Route: `ProtectedRoute` wrapper.

### Server-side Protection:
- Middleware: Protects `/pos`, `/api/products`, etc.
- API Checks: `getServerSession(authOptions)` + dynamic permission check.

## 3. Account Lifecycle
- **Password Reset**: Tokens expire in 1 hour. Uses HMAC-SHA256 generation.
- **Email Verification**: Required for sensitive account changes.
- **Session Management**: Users can view and revoke sessions via `/api/auth/sessions`.

## 4. Security Measures
- **Hashing**: Bcrypt (10 rounds).
- **Session Tokens**: HttpOnly, Secure, SameSite: Lax.
- **Audit Logging**: Every login result and session revocation is recorded in the `AuditLog` table.
- **Rate Limiting**: Integrated into the `authorize` callback via failed attempt tracking.
