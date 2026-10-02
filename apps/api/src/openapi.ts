export const openapi = {
  openapi: "3.1.0", info: { title: "HireMatch AI API", version: "1.0.0", description: "Versioned REST API for explainable resume-to-job matching." },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: { Error: { type: "object", properties: { success: { const: false }, error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" }, requestId: { type: "string" } } } } } }
  },
  paths: {
    "/auth/register": { post: { summary: "Create a candidate or recruiter account", responses: { "201": { description: "Registered" }, "422": { description: "Invalid input" } } } },
    "/auth/login": { post: { summary: "Sign in and begin a rotating refresh session", responses: { "200": { description: "Authenticated" }, "401": { description: "Invalid credentials" } } } },
    "/jobs": { get: { summary: "Search active jobs", responses: { "200": { description: "Paginated jobs" } } }, post: { summary: "Create a recruiter job", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } },
    "/applications": { post: { summary: "Apply to a job", security: [{ bearerAuth: [] }], responses: { "201": { description: "Applied" }, "409": { description: "Duplicate application" } } } },
    "/matches/jobs/{jobId}": { get: { summary: "Get an explainable candidate/job match", security: [{ bearerAuth: [] }], parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Match breakdown" } } } }
  }
} as const;
