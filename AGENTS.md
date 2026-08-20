# AGENTS.md

Educational demo: NGINX as a reverse proxy / load balancer in front of multiple Node.js/Express containers.

## Sources of truth — read these first
- `prd.md` — product requirements and hard constraints. Follow it; conflicts default to prd.md.
- `PHASES.md` — source of truth for implementation order. Read it at the start of every phase.

## Non-negotiable process rules
- Work **one phase at a time**, sequentially. **Never skip a phase. Never implement future phases early** (e.g., no NGINX before its phase, no multi-container before Phase 3). This is the core purpose of the project.
- At the end of each phase, report: `Phase: / Implemented: / Files changed: / How to run: / How to verify: / System-design concept: / What to observe:`, then **STOP and wait** — do not start the next phase proactively.
- Keep changes small and educational, not production-grade. Prefer junior-readable code and demonstrate concepts directly (no unnecessary abstractions, libraries, or hidden behavior).

## Tech constraints
- Only: Node.js, Express, NGINX, Docker, Docker Compose. No databases, queues, ORMs, cloud services, Kubernetes, Redis, or extra infrastructure.
- One application image; multiple instances differ only by `INSTANCE_ID` env var (e.g., `api-1/2/3`). Never create three separate apps.
- NGINX must use default round-robin upstream behavior. No least-connections, IP hash, weighted, or advanced algorithms.
- Do **not** claim active health checks are implemented. Be precise: this demo only demonstrates passive failure detection (NGINX discovering an unavailable backend on contact). Don't expose backend ports publicly unless required for the direct-vs-NGINX comparison, and document why if you do.

## Common verification commands (per PHASES.md)
- `docker compose stop api-2` / `docker compose start api-2` — simulate/restore backend failure.
- `docker compose logs` — observe which instance handled each request (logs should look like `[api-1] GET / 200`).
- Send repeated requests through `http://localhost` to observe round-robin distribution.

## State
- Repository currently contains only docs (`prd.md`, `PHASES.md`); no code or tooling exists yet. Phase 1 is next.
- Not a git repository.