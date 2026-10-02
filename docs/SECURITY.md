# Security

## Implemented controls

- bcrypt cost 12; hashes are excluded from queries and serialization
- short-lived JWT access tokens and hashed, rotating, HTTP-only refresh sessions
- one-time hashed verification/reset tokens with TTL indexes
- account lockout after five failed attempts and non-enumerating password-reset responses
- role-based route middleware plus resource ownership checks
- Helmet, exact-origin credentialed CORS, auth rate limiting, body-size limits, and Zod validation
- recursive rejection of MongoDB operator/dotted keys
- PDF MIME, size, magic-byte, corruption, encryption, and extractable-text validation
- random private filenames, non-public storage, mode `0600`, and hidden storage paths
- race-safe unique indexes for applications and saved jobs
- request IDs, stable error envelopes, no production stack traces, and sensitive-data-safe audits

## Production deployment checklist

- Generate independent secrets with a secrets manager; never use Compose defaults.
- Set `COOKIE_SECURE=true`, terminate TLS, and enforce HSTS at the edge.
- Add CSRF tokens if browser endpoints expand beyond same-site refresh/logout semantics.
- Put MongoDB on a private network with authentication, TLS, backups, and least-privilege users.
- Replace local resume storage with encrypted object storage, short-lived signed access, malware scanning, and retention/deletion jobs.
- Put the AI service on a private network and enforce workload identity or mTLS.
- Add distributed rate limits and Socket.IO fan-out with Redis.
- Forward structured logs without tokens, passwords, or resume content; restrict audit access and define retention.
- Run dependency, container, secret, and SAST scanning in CI.

## Reporting

Do not include a real resume, token, or secret in a vulnerability report. Include the request ID, route, timestamp, expected behavior, and sanitized reproduction steps.
