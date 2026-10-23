# Architecture and code-quality review

## Current structure

- `core/` owns Django settings, URL routing, registration, JWT login throttling, and shared API throttles.
- `vocabulary/`, `reading/`, `quiz/`, and `personalization/` own their domain models, API views, serializers, and tests. User-owned records are filtered by the authenticated user in their endpoints.
- `writing/` owns writing submissions and the session-authenticated workspace plus JWT API. It calls the correction service instead of calling the provider directly.
- `rag/` owns local grammar retrieval and the Groq-backed correction service. `rag/knowledge/grammar_rules.md` is the source corpus; retrieval is local lexical overlap, not embedding-based semantic search.
- `frontend-react/src/api.js` owns API URL construction and authenticated fetch/JWT refresh behavior. `App.jsx` still orchestrates most learning screens and application state.
- `.github/workflows/ci.yml` checks repository hygiene, dependency consistency, Django configuration and production security, migrations, backend tests, frontend lint, and frontend build.

## Request and correction flow

1. The React client sends an authenticated request through `src/api.js`.
2. The writing API validates the submitted text and applies the per-user correction throttle.
3. `rag.services.correct_writing()` retrieves a relevant local grammar section and sends it with the learner's text to Groq.
4. The service validates the structured response and returns a corrected draft, feedback, score, and the retrieved reference. Invalid provider output or unavailable dependencies become `CorrectionUnavailable`.
5. The writing view saves the original draft even when automated correction is unavailable, but does not invent a correction or score.

## Boundaries to preserve

- Keep provider calls and model-output validation out of HTTP views.
- Keep user-owned queries scoped to the authenticated user and assign ownership on the server.
- Keep API credentials and production secrets server-side.
- Keep production HTTPS/security settings separate from `core/test_settings.py`; test settings disable only the redirect that prevents Django's HTTP test client from exercising views.
- Preserve independent tests for malformed input, permission boundaries, provider failures, and the no-fabricated-feedback behavior.

## Improvements completed in this review

- Centralized the frontend API transport and JWT refresh helper in `frontend-react/src/api.js`, reducing networking/authentication concerns inside the main React component.
- Tightened LLM output validation so fractional model scores are rejected rather than silently truncated to an integer; out-of-range integer scores remain clamped to 0–100.
- Tightened saved-vocabulary translation updates to reject non-string values and text longer than the model's 100-character field instead of coercing or silently truncating input.
- Represented unavailable writing scores as `NULL` instead of zero, added a data migration to clear misleading scores on uncorrected drafts, and hid the score badge when no score exists.
- Added regression tests for the new validation rules.

## Remaining technical debt and launch risks

- **JWT storage:** access and refresh tokens currently live in `localStorage`. This makes token theft possible if an XSS vulnerability is introduced. A future authentication hardening task should evaluate HttpOnly secure cookies with CSRF protection, or an explicitly threat-modeled token strategy; changing this requires coordinated backend and frontend work.
- **Frontend size and test coverage:** `App.jsx` remains a large component with most screen orchestration and state. Decompose it into feature components/hooks incrementally and add frontend component/integration tests before broad UI refactors.
- **Shared throttling:** without `REDIS_URL`, Django's local-memory cache is not shared between workers. Production must configure a shared cache before relying on account/IP limits at scale.
- **Retrieval quality:** the current RAG retriever uses token overlap against a small local corpus. Evaluate retrieval against representative learner errors before expanding the corpus or claiming semantic retrieval; consider embeddings only if evaluation demonstrates a need.
- **Operational observability:** provider failures are surfaced to users as a generic unavailable response, but the application does not yet have structured, privacy-safe metrics and alerting for provider latency/failures.
- **Production validation:** CI cannot prove live Groq behavior, production database backup/restore, real-browser UX, token-storage safety, or deployment proxy/HTTPS configuration. Complete the checklist in `SECURITY.md` before public launch.

This document records the current architecture and known limitations; it is not a claim that the application is production-ready.