# Supabase Setup (Database + JWT)

1. Open your Supabase project dashboard.
2. Go to SQL Editor and run:
   - `backend/supabase/schema.sql`
3. In Supabase -> Project Settings -> API, copy:
   - Project URL
   - `anon` key
   - `service_role` key
4. Put them in `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

JWT token flow in this app:
- `POST /auth/login` returns:
  - `access_token` (JWT)
  - `refresh_token`
  - `token_type`
  - `expires_in`
- Frontend stores `access_token` in `localStorage` and sends `Authorization: Bearer <token>` automatically via `Frontend/src/api/axios.ts`.
- Protected backend routes validate the token using Supabase Auth (`dependencies.py`).

Notes:
- Backend now prefers `SUPABASE_SERVICE_ROLE_KEY` for reliable server-side DB writes.
- User-scoped filtering still happens in routes using authenticated `user_id`.
