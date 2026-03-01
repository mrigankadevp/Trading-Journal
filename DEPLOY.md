# Trading Journal — Deployment Guide
## 100% browser-based. No installations. No admin rights needed.
## Tools: GitHub + Vercel + Supabase (all free)

---

## PART 1 — Create your accounts (do these first, all free)

### A) GitHub
1. Go to https://github.com
2. Click Sign up — use any email, create a username and password
3. Verify your email

### B) Supabase
1. Go to https://supabase.com
2. Click Start your project → sign up with GitHub (easiest) or email
3. Click New Project
4. Name it trading-journal
5. Set a strong database password — save it somewhere
6. Choose the region closest to you (e.g. Australia → ap-southeast-2)
7. Click Create new project and wait ~2 minutes

### C) Vercel
1. Go to https://vercel.com
2. Click Sign Up → Continue with GitHub
3. Authorise Vercel to access your GitHub

---

## PART 2 — Set up the Supabase database

1. In Supabase, click your trading-journal project
2. In the left sidebar click SQL Editor
3. Click New query (top right)
4. Open the file supabase-schema.sql from the zip in Notepad or any text editor
5. Select all (Ctrl+A), copy (Ctrl+C)
6. Paste into the Supabase SQL editor
7. Click Run (green button, or Ctrl+Enter)
8. You should see "Success. No rows returned" — that means it worked

Get your API keys:
9. In Supabase left sidebar go to Settings (gear icon) → API
10. Copy and save these two values somewhere (Notepad is fine):
    - Project URL — looks like https://abcdefgh.supabase.co
    - anon public key — long string starting with eyJ...

---

## PART 3 — Upload the project to GitHub

1. Go to https://github.com and sign in
2. Click the + icon (top right) → New repository
3. Name it trading-journal
4. Leave everything else as default
5. Click Create repository
6. On the next page, click the link that says "uploading an existing file"
7. Unzip the project zip on your computer
8. Open the trading-journal folder — you should see index.html, package.json, etc.
9. Select ALL files and folders inside it and drag them into the GitHub upload area
10. Scroll down and click Commit changes

---

## PART 4 — Build using GitHub Codespaces (free browser terminal)

This replaces needing a laptop with admin rights.

1. Go to your trading-journal repository on GitHub
2. Click the green Code button
3. Click the Codespaces tab
4. Click Create codespace on main
5. A browser-based editor opens (like VS Code) — wait ~1 minute

In the terminal at the bottom, run these one at a time:

    npm install

Press Enter. Wait ~30 seconds for it to finish.

    npm run build

Press Enter. Wait for "build complete". This creates a dist/ folder.

6. Close the Codespaces tab — you don't need it anymore.

---

## PART 5 — Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click Add New → Project
3. Find trading-journal in the list → click Import
4. Vercel will auto-detect Vite settings. If not, set:
   - Build Command: npm run build
   - Output Directory: dist
5. Expand Environment Variables and add these two:

   Name                      Value
   VITE_SUPABASE_URL         https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY    eyJ... (your anon public key)

6. Click Deploy
7. Wait ~1 minute. You'll get a live URL like https://trading-journal-yourname.vercel.app

---

## PART 6 — First login

1. Open your Vercel URL
2. Click "Don't have an account? Sign up"
3. Enter your email and a password
4. Check your email for a confirmation link from Supabase and click it
5. Sign in — you're live!

TIP: If no confirmation email arrives, go to Supabase → Authentication → Settings
and turn off "Enable email confirmations" to skip that step.

---

## Future updates

If you want to change something in the app later:
- Edit files directly in GitHub (click a file, then the pencil icon)
- Vercel auto-redeploys within 1-2 minutes, no action needed

---

## Troubleshooting

Blank white screen:
  Environment variables are missing. Go to Vercel → Settings → Environment Variables,
  check both values, then go to Deployments → Redeploy.

"Invalid API key" error:
  Make sure you copied the anon public key, not the service_role key.

Can't log in after signup:
  Check spam for the Supabase confirmation email. Or disable email confirmations
  in Supabase → Authentication → Settings.

Terminal not visible in Codespaces:
  Press Ctrl + ` (the backtick key, top-left of keyboard) to open it.
