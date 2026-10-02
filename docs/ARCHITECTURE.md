# Architecture

## Principles

HireMatch separates user experience, transactional business rules, and document intelligence. The API owns authorization and persisted truth. The AI service receives document bytes over the private service network and returns grounded structure; it does not authenticate users or write the database. Shared TypeScript packages keep request validation and score semantics consistent.

## Components

### Web (`apps/web`)

Next.js App Router renders public discovery, authentication, and three role-specific workspaces. Client components are limited to interactions such as filtering, forms, and upload validation. Loading, empty, error, and responsive states are intentional parts of the UI.

### API (`apps/api`)

Express exposes `/api/v1`, owns Mongoose models, enforces RBAC, rotates refresh sessions, validates application transitions, and emits persisted notifications through Socket.IO. Request IDs cross logs, errors, and audit events. Service modules hold matching and notification behavior; controllers focus on HTTP translation.

### AI service (`apps/ai-service`)

FastAPI validates PDF structure, extracts text with `pypdf`, identifies only observable data, canonicalizes skills, and produces explainable scores. The initial semantic strategy is local token similarity. The endpoint contract permits a future embedding implementation without changing API callers.

### Data

MongoDB collections include users, candidate/recruiter profiles, companies, jobs, resumes, applications, skills, saved jobs, notifications, refresh sessions, one-time action tokens, and audit logs. Compound unique indexes prevent duplicate applications and saved jobs. TTL indexes remove expired sessions and action tokens.

## Core flows

1. A candidate uploads a PDF to the authenticated API.
2. The API validates declared MIME, size, non-empty bytes, and PDF magic bytes.
3. FastAPI validates and parses the document; corrupted/encrypted/no-text PDFs fail closed.
4. The API writes the file to a non-public volume with a random name and mode `0600`; only metadata and parsed/confirmed structures enter MongoDB.
5. A match uses confirmed profile data, normalized skills, job requirements, and explicit weights.
6. Application creation snapshots the score and relies on a unique database index for race-safe duplicate prevention.

## Scaling

Run stateless web/API/AI replicas behind a load balancer. Move private files to encrypted object storage, Socket.IO fan-out to Redis, and logs/audits to dedicated retention systems. MongoDB replica-set transactions can wrap multi-document workflows requiring stronger atomicity.
