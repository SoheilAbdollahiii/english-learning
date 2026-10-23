# Security and deployment baseline

This project is a development-stage learning application. Passing automated tests is not a substitute for a production security review.

## Repository hygiene

- Never commit .env files, API keys, database files, Chroma indexes, Python bytecode, or generated build output.
- .env.example is a local-development template, not a production configuration.
- CI runs scripts/check_repo_hygiene.py to reject tracked local databases, generated retrieval indexes, bytecode, and environment/secret files.
- Removing a file from the latest commit does not erase it from Git history. If a public history ever contained credentials, revoke/rotate them. If it contained private data, assess whether a coordinated history purge is required.

## Before production

- Set a unique, high-entropy SECRET_KEY through the hosting provider's secret manager.
- Set DEBUG=False, exact ALLOWED_HOSTS, and exact CORS_ALLOWED_ORIGINS / CSRF_TRUSTED_ORIGINS for the deployed domains.
- Serve the app behind correctly configured HTTPS. Ensure SECURE_SSL_REDIRECT=True, secure session and CSRF cookies, and HSTS are appropriate for the real deployment and trusted proxy setup.
- Configure DATABASE_URL for a managed production database and verify backups and restoration.
- Keep GROQ_API_KEY server-side only; test provider failures and rate limits without exposing prompts or secrets in logs.
- Run python manage.py check --deploy, migrations, backend tests, frontend lint, and the production frontend build.
- Review dependency advisories, authentication throttling, account recovery, data retention, and privacy disclosures before public launch.

## Known limitations to close before launch

- Email verification and password recovery are not implemented in the current starter release.
- Live Groq behavior requires a valid key and cannot be verified by CI without credentials.
- Local development SQLite and the local retrieval index are not production persistence/backups.
