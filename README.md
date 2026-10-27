<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RADIX Talent Match — Profile Builder

## Run locally

Prerequisites: Node.js and Python.

1. Install frontend dependencies with `npm.cmd install`.
2. In a first terminal, start the Role 3 FastAPI backend:

   ```powershell
   cd backend
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
   ```

3. In a second terminal, install and start the isolated Role 2 parser:

   ```powershell
   cd backend\resume_parser
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe -m uvicorn api:app --reload --host 127.0.0.1 --port 8002
   ```

   The integrated parser uses its offline heuristic by default. LLM parsing is
   opt-in: set `RESUME_PARSER_USE_LLM=true` and `ANTHROPIC_API_KEY` in the parser
   process environment. LLM mode sends resume text to Anthropic; the default
   heuristic mode keeps extraction local. Never put that key in frontend variables.

4. In a third terminal, start the Vite frontend from the Role 3 repository root:

   ```powershell
   npm.cmd run dev
   ```

Open `http://localhost:3000`. During local development, Vite proxies `/api` requests
to Role 3 at `http://127.0.0.1:8000` and `/parser` requests to Role 2 at
`http://127.0.0.1:8002`. The API base can be overridden with
`VITE_API_BASE_URL` in `.env.local` (see [.env.example](./.env.example)); use a
public API URL only when intentionally deploying the frontend.

Save sends the RADIX shared profile JSON to `POST /api/profiles`; loading a saved
profile uses `GET /api/profiles/{id}`. The API returns a record ID only after
confirming a save. Saved profiles can also be updated with `PUT /api/profiles/{id}`
and deleted with `DELETE /api/profiles/{id}`. Profile entry and saving do not
require a CV. Select a PDF/DOCX (maximum 10 MiB) and explicitly choose
**Parse resume** to send it to Role 2 at `POST /parse-resume` using multipart
field `file`. The parser returns the Role 2 contract: candidate (name/email/phone),
skills (name/category/evidence/confidence), education (institution/degree/field/
start/end year/grade), projects (title/description/technologies), experience
(company/role/duration/description/technologies), and certifications (strings).
Candidate, education, skills, projects, and certification names are mapped into
the existing editable form. Conflicting non-empty contact details are preserved
and reported. Experience remains review-only because the Role 2 duration string
does not match Role 3's separate internship date fields. Parsing never saves
automatically. The profile API stores only the selected CV filename, not file
contents. Manual entry remains available if parsing fails or no CV is selected.

The backend uses in-memory storage when Supabase is not configured, so those
records are lost when its process stops. See [backend/README.md](./backend/README.md)
for Supabase setup and the health endpoints. No real resume sample files are
included in either repository; parser checks use generated, non-personal PDF and
DOCX test documents.

The `/parser` Vite proxy is for local development. For deployment, configure a
same-origin reverse proxy to the Role 2 parser and apply equivalent access and
upload-size limits; do not expose the unauthenticated parser directly to the
public internet.
