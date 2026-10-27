<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RADIX Talent Match — Profile Builder

## Run locally

Prerequisites: Node.js and Python.

1. Install frontend dependencies with `npm.cmd install`.
2. In a first terminal, start the FastAPI backend from the repository root:

   ```powershell
   cd backend
   python -m pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --port 8000
   ```

3. In a second terminal, start the Vite frontend from the repository root:

   ```powershell
   npm.cmd run dev
   ```

Open `http://localhost:3000`. During local development, Vite proxies `/api` requests
to `http://127.0.0.1:8000`. The API base can be overridden with
`VITE_API_BASE_URL` in `.env.local` (see [.env.example](./.env.example)); use a
public API URL only when intentionally deploying the frontend.

Save sends the RADIX shared profile JSON to `POST /api/profiles`; loading a saved
profile uses `GET /api/profiles/{id}`. The API returns a record ID only after
confirming a save. Saved profiles can also be updated with `PUT /api/profiles/{id}`
and deleted with `DELETE /api/profiles/{id}`. Profile entry and saving do not
require a CV. A selected PDF/DOCX stays in browser memory for local preview; the
file is not uploaded or parsed. Resume parsing and parser-based prefill are
pending implementation of Role 2. Manual profile entry remains available.

The backend uses in-memory storage when Supabase is not configured, so those
records are lost when its process stops. See [backend/README.md](./backend/README.md)
for Supabase setup and the health endpoint.
