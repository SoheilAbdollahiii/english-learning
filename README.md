# English Learning Studio

An English-learning application with a Django REST API, a React learning interface, and a private writing journal with LLM-assisted correction.

## Stage 2 features

- **LLM writing correction:** Uses the Groq API to return corrected text, concise feedback, and a 0–100 writing score. The score is model-generated guidance, not an official proficiency or exam score.
- **Document-grounded RAG:** Retrieves a relevant rule from the local grammar reference at `rag/knowledge/grammar_rules.md` and supplies it to the model as context. Retrieval runs locally and does not download embedding models at runtime. If no relevant rule is found, the model is told that no matching reference was retrieved.
- **Honest fallback:** If the API key is missing or the provider fails, the original writing is saved, but the app does not invent a correction or score.
- **Bilingual interface:** The React interface supports English and Persian, including right-to-left layout for Persian. Language choice is saved in the browser.
- **Light and dark themes:** Theme choice is persisted in the browser.
- **Private submissions:** Writing submissions and their feedback are scoped to the authenticated user.

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
