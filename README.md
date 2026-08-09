AERO-SENSE — Company-Based Authentication
==========================================

WHAT THIS ADDS
- Real, company-scoped authentication in place of the old mock/demo login.
- Exactly one platform Super Admin account per deployment. It signs in with
  the same three fields as everyone else: Company Name, Email, Password --
  using the fixed Company Name "Super Admin".
- The Super Admin creates companies and provisions each company's first
  Company Admin. From there, each Company Admin creates and manages their
  own company's employees and roles.
- Login has no role selector and no demo/quick-login buttons -- the backend
  resolves the account's role and company from the validated credentials
  alone, and the frontend redirects to the right dashboard automatically.
- Every company-scoped API route enforces tenant isolation server-side
  (via the authenticated user's own company_id), so one company's data is
  never reachable by another company's users.
- Passwords are hashed with Argon2 and only ever handled by the backend;
  the frontend never stores or transmits anything but what the user typed.

HOW LOGIN WORKS NOW
Login requires three fields: Company Name, Email, Password.
- The Super Admin's Company Name is always "Super Admin" (case-insensitive).
- Every other account's Company Name must match its company's real name
  exactly as onboarded by the Super Admin.
- The backend checks all three together. On success, it also determines the
  user's role and company purely from its own database record -- the
  request never gets to choose or override that. A wrong company name is
  rejected exactly like a wrong password.

SETTING UP A DEPLOYMENT
1. Copy backend/.env.example to backend/.env and fill in real values:
       SUPER_ADMIN_EMAIL     -- the email for your one platform Super Admin
       SUPER_ADMIN_PASSWORD  -- a strong password (min 8 characters)
   These two are required -- the server refuses to start without them.
   JWT_SECRET is optional: leave it unset and the server generates a random
   one on first run, saving it to backend/.jwt_secret (gitignored) so
   restarts reuse the same key. Set it explicitly only if you're running
   more than one backend instance behind a load balancer.
2. From backend/: cargo run
   On first startup this creates the Super Admin account from the
   SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD you set -- nothing else is
   seeded. No demo companies, users, or sample credentials are created.
3. From frontend/: npm run dev (if not already running)
4. Log in with Company Name "Super Admin" and the email/password from step 1.
   From the Companies page, create your first real company and its admin.
   That Company Admin can then log in with their company's real name and
   add their own employees.

NOTE ON SECURITY
backend/.env and backend/.jwt_secret are already in .gitignore, so neither
will be committed. Treat SUPER_ADMIN_PASSWORD, and JWT_SECRET if you set one,
as real production secrets: generate them freshly for every environment and
never reuse the placeholder values from backend/.env.example.
