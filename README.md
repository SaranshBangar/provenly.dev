# Provenly — Verifiable Certificates

Design beautiful certificates, issue them one-by-one or in bulk, and give every
recipient a **public verification page** with a real QR code. Verifying a
certificate is always free and open to everyone; issuing uses credits.

- **Stack:** Next.js 15 (App Router) on Cloudflare Workers via `@opennextjs/cloudflare`
- **DB:** Cloudflare D1 (SQLite) + Drizzle ORM
- **Storage:** Cloudflare R2 (logos, signatures, generated PDF/PNG)
- **Auth:** Better Auth (email/password + Google), sessions in D1
- **Payments:** Cashfree (INR) — dynamic top-up, ₹1 = 1 credit, ₹50 minimum
- **Currency:** INR

## Pages

| Route | What it does | Auth |
|-------|--------------|------|
| `/` | Landing + CTA (animated seal, floating certs) | public |
| `/login` | Sign up / log in (email + Google) | public |
| `/dashboard` | Issued certificates, shareable verify links, credits + plan | required |
| `/customize` | Build a certificate (5 templates, live preview, QR, custom fields) | required |
| `/upload` | Bulk-issue from CSV: upload → map columns → review → issue | required |
| `/preview` | Finished certificate → issue (1 credit), download PDF/PNG to R2 | required |
| `/billing` | Buy credits (Cashfree, INR, ₹50 min) | required |
| `/verify/[certId]` | **Public** verification: "Verified ✓ by Provenly" + confetti, or not-found | public |

## Credits & plans

- **Free:** new accounts get **5 credits**, plan `free`. One company per account.
- **Pro:** any INR top-up (min **₹50**); **₹1 = 1 credit**. First top-up flips the plan to `pro`.
- Issuing a certificate (single or per CSV row) costs **1 credit** and is **blocked at 0**.
- **Verification is always free and unlimited — for everyone, forever.**

The ₹50 minimum is enforced on **both** the client and the server (order
creation **and** the settle/webhook path).

---

## Setup

### 0. Install

```bash
npm install
```

### 1. Create the D1 database

```bash
npx wrangler d1 create provenly-db
```

Copy the returned `database_id` into **`wrangler.jsonc`** (replace
`REPLACE_WITH_YOUR_D1_DATABASE_ID`).

### 2. Create the R2 bucket

```bash
npx wrangler r2 bucket create provenly-assets
```

(The binding name `BUCKET` and bucket name `provenly-assets` are already set in `wrangler.jsonc`.)

### 3. Generate & apply migrations

The initial migration is already generated in `drizzle/migrations`. To regenerate
after changing `src/db/schema.ts`:

```bash
npm run db:generate
```

Apply:

```bash
npm run db:migrate:local     # local dev (.wrangler/state)
npm run db:migrate:remote    # production D1
```

### 4. Configure secrets

**Local dev** — edit `.dev.vars` (already created, git-ignored). See `.env.example`.

**Production** — set each as a Worker secret:

```bash
npx wrangler secret put BETTER_AUTH_SECRET      # openssl rand -base64 32
npx wrangler secret put BETTER_AUTH_URL         # e.g. https://provenly.dev
npx wrangler secret put GOOGLE_CLIENT_ID        # optional
npx wrangler secret put GOOGLE_CLIENT_SECRET    # optional
npx wrangler secret put CASHFREE_APP_ID         # optional (mock mode if unset)
npx wrangler secret put CASHFREE_SECRET_KEY     # optional
npx wrangler secret put CASHFREE_WEBHOOK_SECRET # optional
```

Public, non-secret vars (`NEXT_PUBLIC_APP_URL`, `CASHFREE_ENV`) live in
`wrangler.jsonc` → `vars` (update `NEXT_PUBLIC_APP_URL` to your real domain).

### 5. Run

```bash
npm run dev                  # next dev with Cloudflare bindings
npm run preview              # build + run the real Worker locally
npm run deploy               # build + deploy to Cloudflare
```

---

## Required environment variables / bindings

### Cloudflare bindings (`wrangler.jsonc`)

| Binding | Type | Name | Purpose |
|---------|------|------|---------|
| `DB` | D1 | `provenly-db` | all data |
| `BUCKET` | R2 | `provenly-assets` | logos, signatures, generated PDF/PNG |
| `ASSETS` | Assets | (auto) | OpenNext static assets |

### Secrets / vars

| Name | Required | Notes |
|------|----------|-------|
| `BETTER_AUTH_SECRET` | ✅ | session signing key (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | ✅ | public base URL (auth callbacks + verify links) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | enables "Continue with Google" |
| `CASHFREE_ENV` | ✅ (var) | `sandbox` or `production` |
| `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` | optional | live payments; **unset → mock billing mode** |
| `CASHFREE_WEBHOOK_SECRET` | optional | webhook signature verification (falls back to secret key) |

### Cashfree webhook

Point your Cashfree dashboard webhook at:

```
https://<your-domain>/api/billing/webhook
```

It verifies the `x-webhook-signature` (HMAC-SHA256 of `timestamp + body`), and on
`PAYMENT_SUCCESS` re-validates the ₹50 minimum, then credits the account exactly
once (idempotent on the order).

**Mock mode:** when `CASHFREE_APP_ID`/`CASHFREE_SECRET_KEY` are unset, `/billing`
simulates a successful payment via `/api/billing/mock` so the full credit flow is
testable without live keys. Mock is automatically disabled once keys are present.

---

## Notes

- Certificate IDs look like `PRV-2026-XXXX-XXXX` and double as the verify path.
- QR codes are real, scannable codes (the `qrcode` library) pointing at the verify URL.
- PDF/PNG are rendered client-side (`html-to-image` + `jspdf`) and stored in R2.
- The full certificate design (5 templates, seal, signatures, custom fields) is
  stored as JSON on each certificate so the verify page renders it exactly.
