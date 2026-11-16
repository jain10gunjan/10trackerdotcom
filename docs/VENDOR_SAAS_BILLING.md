# Vendor SaaS billing

## One-time DB setup

Run in Supabase SQL Editor:

`supabase/migrations/setup_vendor_saas_billing.sql`

Then reload the PostgREST schema.

## Surfaces

| Path | Purpose |
|------|---------|
| `/vendors/start` | Institute self-serve create (14-day trial) |
| `POST /api/vendors/self-serve` | Creates vendor + admin membership |
| `POST /api/vendor-billing/create-order` | Razorpay order for paid plans |
| `POST /api/vendor-billing/verify` | Activates plan on vendor after payment |
| `/admin/vendors` | Platform admin create (unchanged) |

Plans are defined in `src/features/vendor-tests/lib/vendorPlans.js` (trial, monthly, test pack, coding add-on).
