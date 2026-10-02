# API

Base URL: `/api/v1`. Interactive OpenAPI documentation: `/api/docs`.

## Conventions

Successful calls return `{ "success": true, "data": ... }`. Failures return:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "requestId": "3eac..."
  }
}
```

Every response includes `X-Request-ID`. Pagination responses add `pagination: { page, limit, total, pages }`.

## Route groups

| Group | Selected operations |
|---|---|
| `/auth` | register, login, refresh, logout, verify email, forgot/reset password |
| `/candidates` | get/update profile, upload/read/edit/delete resume |
| `/companies` | browse, recruiter create/update |
| `/jobs` | search/detail, recruiter create/update/close/reopen |
| `/matches` | job match breakdown, ranked recommendations |
| `/applications` | apply, candidate tracker, recruiter ranking, status transition |
| `/saved-jobs` | list, save, remove |
| `/notifications` | paginated list, mark one/all read |
| `/admin` | statistics, users, suspension, audits, skill taxonomy |

## Application state machine

`APPLIED → REVIEWING → SHORTLISTED → INTERVIEW → OFFERED → HIRED`

Rejection is allowed from active review stages; candidate withdrawal is allowed until terminal states. `HIRED`, `REJECTED`, and `WITHDRAWN` are terminal. Invalid transitions return `APPLICATION_TRANSITION_INVALID` with HTTP 409.

## Authentication

Send the short-lived access JWT as `Authorization: Bearer <token>`. Refresh tokens are high-entropy opaque values stored only as hashes server-side and delivered in an HTTP-only same-site cookie. Each refresh revokes and replaces its predecessor; reuse revokes the session family.
