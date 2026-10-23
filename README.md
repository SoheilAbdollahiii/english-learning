# English Learning Studio

An English-learning application with a Django REST API, a React learning interface, and a private writing journal with LLM-assisted correction.

## Stage 2 features

- **LLM writing correction:** Uses the Groq API to return corrected text, concise feedback, and a 0–100 writing score. The score is model-generated guidance, not an official proficiency or exam score.
- **Document-grounded RAG:** Retrieves a relevant rule from the local grammar reference at `rag/knowledge/grammar_rules.md` and supplies it to the model as context. Retrieval runs locally and does not download embedding models at runtime. If no relevant rule is found, the model is told that no matching reference was retrieved.
- **Honest fallback:** If the API key is missing or the provider fails, the original writing is saved, but the app does not invent a correction or score.
- **Bilingual interface:** The React interface supports English and Persian, including right-to-left layout for Persian. Language choice is saved in the browser.
- **Light and dark themes:** Theme choice is persisted in the browser.
- **Private submissions:** Writing submissions and their feedback are scoped to the authenticated user.

## Stage 3 learning features

- **Responsive learning interface:** Search and level filters for Reading and Vocabulary, plus responsive navigation and the existing Persian/English and light/dark controls.
- **Personal vocabulary:** Learners can save words from a reading passage or from the curated bank, add their own translation, review saved words, and delete personal entries. The curated bank is expanded with 280+ English–Persian words across A1, B1, and C1. The added editorially authored entries use CEFR-informed level estimates; source methodology is documented in the vocabulary migration. Personal words are isolated by account; they are not added to the shared bank.
- **Spaced repetition:** Saved words have a private review schedule. Learners reveal the translation, report whether they remembered it, and receive a next-review interval. Correct recall grows the interval (1, 3, 7, then doubling up to 60 days); missed recall schedules a retry in 10 minutes. This is a transparent starter heuristic, not a validated adaptive learning model.
- **Personal learning plan:** The authenticated learner can save a preferred CEFR level, a daily word target (1–100), and a learning goal (general English, travel, work, or exam preparation). The goal now changes the dashboard's suggested next activity and the writing prompt in both English and Persian.
- **Reading progress:** The reading library contains 24 original articles across A1, B1, and C1, including nine additional passages in the expanded content migration. Articles can be searched and filtered by level, and read/unread status is persisted per learner.
- **Skill quizzes:** Vocabulary, reading, and grammar quizzes now have an expanded bank of 72 questions across A1, B1, and C1, with answer explanations and balanced answer positions. The learner's preferred CEFR level selects the quiz, submitted answers are checked against that level, and history records both skill and level.
- **Progress data:** The dashboard chart is based on saved quiz sessions, not a fabricated activity curve.

### Learner onboarding

The React login screen supports self-service registration. `POST /api/register/` validates the username and password, applies a five-requests-per-hour per-IP registration limit, creates the account, and returns JWT tokens. Password login is limited to twenty attempts per hour per IP. AI writing calls are capped at 30 per day per learner. Email is optional in this initial release; email verification and password recovery remain launch requirements.

### Stage 3 API routes

- `GET /vocabulary/api/words/` — curated shared vocabulary (authenticated)
- `GET|POST /vocabulary/api/my-words/` — list or save the current user's words
- `PATCH|DELETE /vocabulary/api/my-words/<id>/` — update translation/level/mastery or remove an owned word
- `GET /vocabulary/api/review/queue/` — return the total due count and the next batch of up to 20 personal words
- `POST /vocabulary/api/my-words/<id>/review/` with `{"remembered": true|false}` — record recall and schedule the next review
- `POST /vocabulary/api/my-words/<id>/practice/` — backwards-compatible shortcut that records a successful recall
- `GET /reading/api/articles/?q=<search>&level=A1` — search and filter reading content
- `GET|POST /reading/api/progress/` — read or update per-user article progress
- `GET|PATCH /learning/api/preferences/` — retrieve or update personal learning settings
- `GET /quiz/api/questions/?type=vocabulary|reading|grammar&level=A1|B1|C1` — fetch five questions at a CEFR level (answers are not exposed)
- `POST /quiz/api/submit/`, `GET /quiz/api/history/`, and `GET /quiz/api/stats/` — submit answers, view recent results, and retrieve per-user streak plus seven-day quiz activity
- `POST /api/register/` — create a learner account with validated password and receive JWT tokens

Run `python manage.py migrate` after pulling the changes so the personal data tables and starter quiz questions are created. The new endpoints require the same JWT login used by the React client.

## Requirements

- Python 3.12 (used by CI)
- Node.js 22 and npm (for the React frontend)
- A Groq API key for live AI correction

## Run the Django backend

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # macOS/Linux
   source .venv/bin/activate
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and set a strong `SECRET_KEY`. Set `GROQ_API_KEY` to your own key to enable real corrections. Do not commit `.env` or share the API key.
4. Apply migrations and run the backend:
   ```bash
   python manage.py migrate
   python manage.py check
   python manage.py test --settings=core.test_settings
   python manage.py runserver
   ```

Without `GROQ_API_KEY`, the site still saves drafts but clearly reports that automated correction is unavailable.

## Run the React frontend

In another terminal:
```bash
cd frontend-react
npm ci
npm run dev
```

The current React client calls the Django API at `http://127.0.0.1:8000`; run the backend on that address for local development.

Build the frontend for production:
```bash
npm run build
```

## Configuration

See [Security and deployment baseline](SECURITY.md) for the production release checklist. `.env.example` is for local development only; do not deploy it unchanged.


See `.env.example` for the environment variables. In production, use a strong secret key, set `DEBUG=False`, configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` for your real domains, use HTTPS, and keep API credentials in your hosting provider's secret manager.

## CI checks

GitHub Actions checks Django configuration, migration consistency, backend tests, dependency consistency, and the React production build for pull requests and pushes to `main`.


## Deployment configuration

The React app does not assume that the Django API runs on the same machine as the learner's browser.

- For local development, the frontend defaults to `http://127.0.0.1:8000`; Django-rendered landing/dashboard links use `FRONTEND_URL` (default `http://127.0.0.1:5173`).
- For a same-origin deployment (frontend and API served behind the same domain), leave `VITE_API_BASE_URL` unset in the production build.
- For a separate API origin, set `VITE_API_BASE_URL` to the public API origin before building the frontend, for example `https://api.example.com` (replace this example with your actual API URL).
- Add the frontend's public origin to Django's `CORS_ALLOWED_ORIGINS`, and configure `ALLOWED_HOSTS` for the API host. Do not use wildcard origins for authenticated production traffic.
- Keep `SECRET_KEY` and `GROQ_API_KEY` on the server only. Never put either secret in a `VITE_*` variable or commit a real `.env` file.
- Set `DATABASE_URL` to a managed PostgreSQL connection string for production; SQLite remains the default for local development. PostgreSQL connections require SSL by default when `DEBUG=False`; set `DATABASE_SSL_REQUIRE=False` only for a trusted local database that does not support SSL.
- Set `REDIS_URL` to a shared Redis instance in production so registration, login, and writing throttles are consistent across workers. Without it, Django uses its local in-process cache and limits are not shared between app instances.
- Before serving real users over HTTPS, set `SECURE_SSL_REDIRECT=True`, `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`, and `SECURE_HSTS_SECONDS=31536000`. Enable HSTS subdomains/preload only when every relevant subdomain is HTTPS-ready.

### Product-readiness notes

- The dashboard's streak and seven-day activity chart use per-user quiz-session statistics from the API, not login dates or a capped recent-history list. They measure quiz sessions, not every possible learning action.
- Before public launch, configure HTTPS and review Django's deployment checks, token storage/XSS exposure, configure a shared production cache (such as Redis) so throttles work across multiple workers, backups, privacy/retention terms, monitoring, and the current npm audit findings.
- A passing CI build validates the automated checks; it does not replace a real-browser acceptance test with a configured API key and production-like environment.
