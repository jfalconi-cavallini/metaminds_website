# MetaMinds Website

The MetaMinds STEM Academy platform — student, tutor, and admin portals built on Next.js 15, Supabase, and Tailwind CSS.

**Before writing any code, read [`CLAUDE.md`](./CLAUDE.md) and [`PRODUCT_BIBLE.md`](./PRODUCT_BIBLE.md).**

---

## New Machine Setup

This project uses **two repositories** that must both be cloned as siblings:

```
C:\Software Engineering\
├── metaminds_website\     ← this repo (the app)
└── Metaminds-vault\       ← curriculum knowledge base (separate repo)
```

### 1. Clone both repos

```bash
cd "C:\Software Engineering"
git clone https://github.com/jfalconi-cavallini/metaminds_website.git
git clone https://github.com/jfalconi-cavallini/Metaminds-vault.git
```

### 2. Install app dependencies

```bash
cd metaminds_website
npm install
```

### 3. Set up environment variables

Create `metaminds_website/.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=...
```

Get these values from Jose or from the Supabase dashboard. Never commit this file.

### 4. Build the vault MCP server

The vault MCP server lets Claude read curriculum content during dev sessions.

```bash
cd "C:\Software Engineering\Metaminds-vault\mcp-server"
npm install
npm run build
```

### 5. Register the vault with Claude Code

Run this from inside `metaminds_website` (adjust the path if your drive letter differs):

```bash
claude mcp add metaminds-vault -s local \
  -e VAULT_PATH="C:\Software Engineering\Metaminds-vault" \
  -- node "C:\Software Engineering\Metaminds-vault\mcp-server\dist\index.js"
```

Verify it worked:

```bash
claude mcp get metaminds-vault
# Should show: Status: ✔ Connected
```

This is registered at local scope — it's private to your machine and not committed to either repo. Every contributor runs this once.

### 6. Install GitHub CLI

```bash
winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
```

Open a new terminal, then authenticate:

```bash
gh auth login
# Choose: GitHub.com → HTTPS → Login with a web browser
```

### 7. Start the dev server

```bash
cd "C:\Software Engineering\metaminds_website"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Keeping both repos up to date

Always pull both repos when starting a new session:

```bash
cd "C:\Software Engineering\metaminds_website"
git checkout main && git pull

cd "C:\Software Engineering\Metaminds-vault"
git pull
```

If the vault's MCP server source changed (check `Metaminds-vault/mcp-server/src/`), rebuild it:

```bash
cd "C:\Software Engineering\Metaminds-vault\mcp-server"
npm install && npm run build
```

---

## Before you commit

Run these in order from `metaminds_website`:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three must pass. See [`CLAUDE.md`](./CLAUDE.md) for full collaboration rules.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Email | Resend |
| Deployment | Vercel |

Full architecture, schema, and roadmap live in [`docs/`](./docs/).
