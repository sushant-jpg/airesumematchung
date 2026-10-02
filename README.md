# HireMatch AI

HireMatch AI is a production-style job marketplace that explains *why* a candidate and role fit. It combines a polished Next.js experience, a secure Express/MongoDB API, and a self-contained FastAPI resume parser and matching engine. It does not require a paid AI provider and never invents skills that were not present in confirmed candidate data.

> AI scores are decision support. They never automatically accept or reject a candidate.

## Highlights

- Candidate, recruiter, and admin workspaces with role-based API authorization
- PDF resume validation, private storage, grounded extraction, and candidate-editable structured data
- Deterministic 100-point scoring with a complete factor breakdown and plain-language reasons
- Search, filtering, saving, recommendations, duplicate-safe applications, and validated status transitions
- Applicant ranking, recruiter funnel, persistent notifications, and Socket.IO delivery
- Access tokens, rotating opaque refresh cookies, email verification/reset tokens, lockout, rate limiting, audit logs, and request IDs
- Strict TypeScript, shared Zod contracts, OpenAPI, tests, Docker Compose, health checks, seed data, and CI

## Architecture

```text
Browser / Next.js :3000
       │ REST + Socket.IO
       ▼
Express API :4000 ───── MongoDB :27017
       │ private service call
       ▼
FastAPI AI service :8000
```

The TypeScript monorepo shares canonical domain types, validation, skill normalization, and scoring contracts through `packages/`. Controllers remain thin; matching, notification, authentication, and persistence concerns are separated. See [Architecture](docs/ARCHITECTURE.md).

## Repository layout

```text
apps/web          Next.js App Router UI
apps/api          Express REST API, Socket.IO, Mongoose
apps/ai-service   FastAPI PDF parsing and matching service
packages/types    Cross-application TypeScript contracts
packages/validation  Zod request validation
packages/shared   Skill normalization and deterministic scoring
docs              Architecture, API, security, and scoring notes
```

## Quick start with Docker

```bash
docker compose up --build
```

Then open:

- Web: http://localhost:3000
- Swagger UI: http://localhost:4000/api/docs
- API readiness: http://localhost:4000/health/ready
- AI OpenAPI: http://localhost:8000/docs

The Compose secrets are local-development values only. Supply secret-manager values and TLS-aware cookie settings in production.

## Local development

Requirements: Node.js 20+, npm 10+, Python 3.12+, and MongoDB 7+.

```bash
cp .env.example .env
npm install
python -m venv .venv
# Windows: .venv\Scripts\python -m pip install -r apps\ai-service\requirements.txt
# macOS/Linux: .venv/bin/python -m pip install -r apps/ai-service/requirements.txt
npm run dev
```

Seed realistic accounts after MongoDB is running:

```bash
npm run seed
```

Seed password: `Portfolio123!` for `admin@hirematch.dev`, `maya@northstar.dev`, and `alex@candidate.dev`. Never use these credentials outside local development.

## Commands

```bash
npm run typecheck        # strict TypeScript checks
npm run lint             # ESLint, zero warnings allowed
npm test                 # API, shared engine, and UI tests
npm run build            # packages + API + production Next.js build

# From apps/ai-service with the virtual environment active
pytest -q
```

## Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Private MongoDB connection string |
| `JWT_ACCESS_SECRET` | Access-token signing key, minimum 32 characters |
| `JWT_REFRESH_SECRET` | Reserved independent refresh/session key |
| `WEB_URL` | Exact allowed browser origin |
| `AI_SERVICE_URL` | Internal FastAPI base URL |
| `COOKIE_SECURE` | Must be `true` behind production HTTPS |
| `RESUME_STORAGE_DIR` | Non-public private resume volume |
| `MAX_RESUME_SIZE_MB` | Upload ceiling, default 5 MB |
| `NEXT_PUBLIC_API_URL` | Browser-visible versioned API URL |

See [.env.example](.env.example) for the complete development set.

## Matching model

| Factor | Weight |
|---|---:|
| Required skills | 40% |
| Preferred skills | 10% |
| Experience | 20% |
| Education | 10% |
| Semantic/text similarity | 15% |
| Location/work preference | 5% |

Every result includes component scores, matched and missing skills, the experience gap, and human-readable reasons. Aliases such as `JS`, `ReactJS`, `Node`, `Mongo`, and `TS` are canonicalized before comparison. Details are in [Matching Engine](docs/MATCHING_ENGINE.md).

## API and security

All business routes are under `/api/v1`. Errors have a stable `{ success, error: { code, message, requestId } }` envelope, and `X-Request-ID` is returned on every request. Swagger is available at `/api/docs`; the route summary is in [API](docs/API.md).

Private resume paths, password hashes, refresh tokens, and internal errors are never serialized. See [Security](docs/SECURITY.md) for the threat model and production checklist.

## Screenshots

Add portfolio screenshots here after running the application locally:

- Landing and explainable match card
- Candidate recommendations and application tracker
- Recruiter applicant ranking and hiring funnel
- Admin system overview

## Current scope and future work

The repository supplies the complete architectural foundation and principal end-to-end workflows. Production extensions include an email provider adapter, S3-compatible encrypted object storage, Redis-backed Socket.IO fan-out, richer embedding providers behind the semantic interface, antivirus/CDR scanning, and browser-level Playwright journeys. These are explicit extension points rather than hidden mock production behavior.

## License

Portfolio and educational use.
