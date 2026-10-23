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
- **Personal vocabulary:** Learners can save words from a reading passage or from the curated bank, add their own translation, practice saved words to increase mastery, and delete personal entries. Personal words are isolated by account; they are not added to the shared bank.
- **Personal learning plan:** The authenticated learner can save a preferred CEFR level, a daily word target (1–100), and a learning goal (general English, travel, work, or exam preparation).
- **Reading progress:** Articles can be searched and filtered by level, and read/unread status is persisted per learner.
- **Skill quizzes:** Separate vocabulary, reading, and grammar quizzes are seeded by a data migration. Results include explanations and are saved to a private per-user history.
- **Progress data:** The dashboard chart is based on saved quiz sessions, not a fabricated activity curve.

### Learner onboarding

The React login screen supports self-service registration. `POST /api/register/` validates the username and password, applies a five-requests-per-hour per-IP registration limit, creates the account, and returns JWT tokens. Password login is limited to twenty attempts per hour per IP. Email is optional in this initial release; email verification and password recovery remain launch requirements.

### Stage 3 API routes

- `GET /vocabulary/api/words/` — curated shared vocabulary (authenticated)
- `GET|POST /vocabulary/api/my-words/` — list or save the current user's words
- `PATCH|DELETE /vocabulary/api/my-words/<id>/` — update translation/level/mastery or remove an owned word
- `POST /vocabulary/api/my-words/<id>/practice/` — increase personal word mastery by 20 points, capped at 100
- `GET /reading/api/articles/?q=<search>&level=A1` — search and filter reading content
- `GET|POST /reading/api/progress/` — read or update per-user article progress
- `GET|PATCH /learning/api/preferences/` — retrieve or update personal learning settings
- `GET /quiz/api/questions/?type=vocabulary|reading|grammar` — fetch a quiz (answers are not exposed)
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
   python manage.py test
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

### Product-readiness notes

- The dashboard's streak and seven-day activity chart use per-user quiz-session statistics from the API, not login dates or a capped recent-history list. They measure quiz sessions, not every possible learning action.
- Before public launch, configure HTTPS and review Django's deployment checks, token storage/XSS exposure, add rate limiting for AI correction, backups, privacy/retention terms, monitoring, and the current npm audit findings.
- A passing CI build validates the automated checks; it does not replace a real-browser acceptance test with a configured API key and production-like environment.
