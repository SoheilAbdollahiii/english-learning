# english-learning# Smart English Learning Web App (AI Tutor)

An advanced, AI-powered web application designed to act as a personal English tutor. It provides personalized learning paths and real-time grammar analysis.

## Key Features
- **Writing Analysis (LLM + RAG):** Analyzes user text, detects grammatical errors, and provides corrections backed by actual grammar rules stored in a Vector Database (ChromaDB).
- **Smart Vocabulary:** Tracks user levels (A1-C2) and suggests appropriate words.
- **Reading Comprehension:** Graded reading articles tailored to the user's proficiency.

## Tech Stack
- **Backend:** Python, Django, Django REST Framework
- **AI Integration:** Groq API (LLaMA-3), ChromaDB (Vector Database for RAG)
- **Frontend:** Django Templates, Bootstrap 5
- **Database:** SQLite (Development) / PostgreSQL (Production ready)

## How to Run Locally
1. Clone the repository.
2. Create a virtual environment: `python3 -m venv venv` and activate it.
3. Install dependencies: `pip install -r requirements.txt`.
4. Add your `.env` file with `SECRET_KEY` and `GROQ_API_KEY`.
5. Run migrations: `python manage.py migrate`.
6. Start the server: `python manage.py runserver`.