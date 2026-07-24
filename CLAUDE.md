# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project overview

Resale is a multivendor marketplace web app for Mauritius (currency: MUR). Vendors register, subscribe (via Peach Payments) to publish products, and chat with customers; customers browse vendors/products and message vendors. Built with Next.js (App Router), NextAuth v5, Prisma 7 with a libSQL/SQLite adapter, and Tailwind v4.

## Commands

```bash
npm run dev     # start dev server (localhost:3000)
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint (flat config, eslint-config-next)
npm run seed    # seed dev.db with demo admin/vendors/products/conversation (see prisma/seed.ts)
```

There is no test suite in this repo currently.

### Database (Prisma 7 + libSQL)

- Schema: `prisma/schema.prisma` (sqlite provider, driven through `@prisma/adapter-libsql`).
- Default local DB: `dev.db` at the repo root (`DATABASE_URL` env var overrides this; falls back to `file:./dev.db` — see `src/lib/db.ts`).
- Config lives in `prisma.config.ts` (not `schema.prisma`'s `datasource` block) — migrations path and seed command are declared there. The seed command uses `tsconfig.seed.json` (CommonJS) rather than the app's ESM `tsconfig.json`.
- Common Prisma CLI commands: `npx prisma migrate dev`, `npx prisma generate`, `npx prisma studio`.
- After changing `schema.prisma`, run `npx prisma migrate dev` and `npx prisma generate` before the app will type-check/run correctly.

## Architecture

### Auth

- NextAuth v5 (`beta`), configured in `src/lib/auth.ts` with a single Credentials provider (email/password checked via `bcryptjs` against `User.password`). JWT session strategy.
- The session's `id`, `role`, and `vendorProfileId` are threaded through the `jwt`/`session` callbacks and typed via module augmentation in `src/types/next-auth.d.ts`. Any code reading `session.user.role` or `session.user.vendorProfileId` relies on this augmentation.
- Route handler: `src/app/api/auth/[...nextauth]/route.ts` exports the NextAuth `handlers`.
- Registration: `src/app/api/auth/register/route.ts` (creates `User`, hashes password).

### Route protection — `src/proxy.ts`, not `middleware.ts`

This Next.js version renames the middleware convention to **`src/proxy.ts`** (see AGENTS.md — this is a breaking change from the Next.js you may know). It wraps `auth()` from `src/lib/auth.ts` and gates `/dashboard/*` (VENDOR or ADMIN) and `/admin/*` (ADMIN only), redirecting unauthenticated/unauthorized requests. The `matcher` config at the bottom controls which paths run it. Do not create a `middleware.ts` file expecting it to be picked up — check `node_modules/next/dist/docs/` for the current routing/proxy conventions before assuming standard Next.js behavior.

### Data model (`prisma/schema.prisma`)

- `User` (`role`: CUSTOMER | VENDOR | ADMIN) — 1:1 with `VendorProfile` for vendors.
- `VendorProfile` — holds `subscriptionStatus` (ACTIVE/INACTIVE/CANCELLED/PAST_DUE), `subscriptionPlan`, `subscriptionEndsAt`, and Peach Payments identifiers (`peachRegistrationId`, `peachMerchantTransId`). Owns `Product[]`.
- `Product` — belongs to a `VendorProfile`; `isPublished` gates public visibility.
- `Conversation` — links one `VendorProfile`, one customer `User`, and optionally one `Product`; unique on `(vendorId, customerId, productId)` so a customer gets one thread per vendor+product. Holds `Message[]`.
- `Message` — sender/receiver are both `User` (vendor side is the vendor's `User`, not `VendorProfile`).

**Key invariant enforced throughout the API layer:** a product is only publicly visible/purchasable when `isPublished && vendor.subscriptionStatus === "ACTIVE"`. See the `where` clause in `src/app/api/products/route.ts` GET, and the publish-gating logic in the POST handler (`isPublished` is forced false unless the vendor's subscription is active). Any new vendor-facing product logic should preserve this gate.

### API routes (`src/app/api/**/route.ts`)

Route handlers follow a consistent shape: parse `searchParams` for list/pagination (`page`, `limit`, `search`), call `auth()` for session/role checks, validate bodies with `zod` schemas defined inline at the top of the file, and return `NextResponse.json(...)` with explicit status codes. Errors from `z.ZodError` are caught and returned as 400 with `details: error.issues`; unexpected errors are logged and returned as 500. Follow this pattern (inline zod schema, `auth()` role check, `Promise.all` for paired list+count queries) when adding new routes rather than introducing a different validation/response convention.

- `api/vendors`, `api/vendors/[id]` — public vendor listing/detail.
- `api/products`, `api/products/[id]` — public product listing/detail; vendor-only create/update, gated by subscription (see above).
- `api/conversations`, `api/conversations/[id]/messages` — messaging between customers and vendors.
- `api/admin` — ADMIN-only aggregate stats (`get_me`-style dashboard counts).
- `api/admin/vendors/[id]` — ADMIN vendor management.
- `api/peach/create-checkout`, `api/peach/cancel-subscription`, `api/peach/webhook` — subscription billing (see below).

### Payments — Peach Payments (`src/lib/peach-payments.ts`)

- Currency is **MUR** (Mauritian Rupees) throughout — do not reintroduce ZAR.
- `PEACH_PLANS` defines the monthly/yearly price points; `createCheckoutSession()` posts to Peach's `/v2/checkout` and returns a `checkoutId` + hosted `redirectUrl`.
- `merchantTransactionId` is constructed as `sub_{vendorId}_{plan}_{timestamp}` and is the mechanism used to recover `vendorId`/`plan` in the webhook when `customParameters` isn't echoed back — keep this format in sync between `createCheckoutSession` and `api/peach/webhook/route.ts`.
- The webhook (`api/peach/webhook/route.ts`) updates `VendorProfile.subscriptionStatus`/`subscriptionEndsAt` on success codes (`isSuccessCode`), and flags known failure codes as `PAST_DUE`. Subscription end dates are computed as now + 30 days (monthly) or + 365 days (yearly), not driven by Peach-provided expiry data.
- Relevant env vars: `PEACH_BASE_URL`, `PEACH_PAYMENTS_ENTITY_ID`, `PEACH_PAYMENTS_SECRET_KEY`, `PEACH_PAYMENTS_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`. There is no `.env.example` in the repo — check `src/lib/peach-payments.ts` and `src/lib/auth.ts`/`src/lib/db.ts` for the full set of variables read from `process.env` (also `NEXTAUTH_SECRET`, `DATABASE_URL`).

### Frontend structure

- App Router pages under `src/app/**`; role-scoped areas are `src/app/dashboard/**` (vendor) and `src/app/admin/**` (admin), both gated by `src/proxy.ts`.
- Shared UI in `src/components/**` (e.g. `ProductCard`, `VendorCard`, `ChatBox`, `SubscriptionCard`, `Navbar`, `Footer`). `Providers.tsx` wraps the app in NextAuth's `SessionProvider` and mounts the global `react-hot-toast` `Toaster`.
- Interactive dashboard widgets (`PublishToggle`, `EditProductForm`, `CancelSubscriptionButton`, `AdminVendorActions`, `MessagesClient`) are client components that call the `api/*` routes directly via `fetch`.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).

## Conventions

- TypeScript `strict: true`; ESLint via flat config (`eslint.config.mjs`) extending `eslint-config-next` (core-web-vitals + typescript).
- Zod (`v4`) is the validation layer for all API route bodies — mirror existing schemas' style (top-of-file `const xSchema = z.object({...})`) rather than validating ad hoc.
- Prisma client is a lazy singleton on `globalThis` (`src/lib/db.ts`) to avoid connection exhaustion in dev — reuse `db` from `@/lib/db`, don't instantiate `PrismaClient` elsewhere (the seed script is the one intentional exception, since it runs standalone).
