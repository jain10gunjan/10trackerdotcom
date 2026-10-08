This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Vendor practice-tests (multi-tenant)

Institute portals live at `/practice-tests/[slug]` (e.g. `/practice-tests/ips-academy-indore`). Existing `/tests/[category]` practice routes are unchanged.

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (service_role JWT — server only).
2. Run `supabase/migrations/setup_vendor_practice_tests.sql` (or `scripts/setup_vendor_practice_tests.sql`) in the Supabase SQL Editor.
3. Reload the PostgREST schema (Dashboard → Settings → API → Reload).
4. Open `/admin/vendors` as a platform admin to list/create vendors.
5. Domain access uses Google `email_verified` from the Auth.js session. Default mode is domain + allowlist; exact domain match only.

Domain unit tests: `npm run test:vendor-domain`.

**Vendor admin (after SQL):** `/practice-tests/[slug]/admin` → Settings, Members, **Questions** (manual / CSV / import from examtracker), **Tests** (draft/publish, pin questions, seed sample).  
**Platform admin:** `/admin/vendors` → create, suspend/activate, assign admins.

CSV template: `GET /api/practice-tests/[slug]/questions/csv`  
Columns: `topic,category,subject,chapter,difficulty,year,question,options_A,options_B,options_C,options_D,correct_option,solution,directionHTML,questionImage` (max 500 rows).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
