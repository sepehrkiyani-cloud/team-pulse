# نبض تیم — نسخهٔ Render

Persian RTL team task dashboard, password-based accounts, shared PostgreSQL storage.

## Deployment
- Node 22 or later; `npm ci --omit=dev`; start with `npm start`.
- Required private environment variables: `DATABASE_URL` and `SETUP_TOKEN` (at least 32 random bytes).
- Render provides `PORT` and `RENDER_EXTERNAL_URL` automatically.
- Connect a PostgreSQL database in the same region. Schema initializes on startup.
- Open `/setup`, supply the setup token, and choose the first administrator's username and password.
- `/account` lets the administrator create member accounts. Members can change their own passwords.
- All task records are shared among authenticated members. There is no public registration.
- PostgreSQL storage is required; filesystem and in-memory storage are not used for task records.
- Render free Postgres is temporary and may expire; review the current plan before relying on it for permanent team data.
- The original Sites deployment remains separate. Existing task records are not automatically copied.

## Verification
`npm ci` then `npm test`. Integration tests use an in-memory PostgreSQL-compatible emulator. Real hosted PostgreSQL verification follows deployment.
