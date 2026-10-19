# Fieldnote poultry operations

## Run locally

Open PowerShell in this folder and run:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000>. Do not expose the local server to the public internet.

## Supabase setup

The browser client is configured in `supabase-config.js` with this project's URL and publishable key. A publishable key is intended for browser use; row-level security protects the database. Never put a Supabase secret/service-role key in browser code.

The initial schema and live-operation changes are in:

- `supabase/migrations/202609300001_initial_schema.sql`
- `supabase/migrations/202609300002_record_daily_log.sql`
- `supabase/migrations/202609300003_sync_batch_population.sql`
- `supabase/migrations/202609300004_attendance_membership_guard.sql`
- `supabase/migrations/202610030001_manage_daily_logs.sql`

The first four migrations have been applied to the `famrn management` project. Migration 2 adds the atomic daily-log RPC, first-login password flag, and Leader assignment visibility policy. Migration 3 synchronizes batch bird counts and restricts daily-log writes to the RPC. Migration 4 ensures attendance can only be written for a worker assigned to that farm. Migration 5 adds safe daily-log editing/deletion and links automatically-created daily-log cashbook entries so they stay in sync; it has been applied to the live project through the Supabase SQL Editor. This project does not have Supabase CLI migration history initialized, so do not run `supabase db push` until the existing applied migrations have been baselined; otherwise the CLI could attempt to rerun the initial schema. Do not rerun migration 1 against this already-initialized project.

### Initial Admin

The initial approved Admin account has been created in this project with login ID `admin`. Its profile requires a password change on first sign-in. The Auth identity uses the internal address `admin@login.fieldnote.invalid` so the username-only login works without exposing an email address.

That internal address cannot receive password-reset email. If the Admin forgets the password, reset it from **Supabase → Authentication → Users**. For a different/new project, follow the one-time procedure in `supabase/bootstrap_admin.example.sql` instead; do not rerun it in this project.

After `create-user` is deployed, use **Team access** to create other login IDs. Their generated temporary passwords are shown once; share them directly with each person. New accounts remain pending until approved, and approved accounts must change the temporary password on first access.

### Deploy account provisioning

Install Scoop from <https://scoop.sh>, then open PowerShell and install the Supabase CLI:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Then run these commands in this folder. `supabase login` opens a browser for sign-in; `supabase link` may ask for the database password in the terminal. Enter secrets only there, never in chat or source files.

```powershell
supabase login
supabase link --project-ref ucauizvnpgzsccmhrpwx
supabase functions deploy create-user --use-api
```

The function verifies the caller is an approved Admin. Supabase injects the project keys into the Edge Function runtime; the secret key is never copied into the frontend. Deploy this function before using **Team access** to create accounts.

## Deploy the website

`netlify.toml` configures this no-build static site. This workspace has no Git remote, so use the Netlify CLI. Install Node.js 20 or later, then install and sign in to Netlify:

```powershell
npm install --global netlify-cli
netlify login
netlify deploy --prod --dir .
```

The frontend and Edge Function deploy separately. The app is not ready for real team records until `create-user` is deployed and farm/account records are set up. Confirm the site uses HTTPS before sharing it.