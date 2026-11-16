# Supabase client convention

Do **not** add new inline `createClient(...)` in pages, hooks, or API routes.

| Context | Import |
|---------|--------|
| Browser / client components | `@/lib/supabase/browser` |
| Server (anon / user-scoped) | `getSupabaseServer` from `@/lib/supabaseServer` |
| Privileged server merges / admin | `getSupabaseAdmin` from `@/lib/supabaseAdmin` (fail closed if service role missing) |

Existing local clients should be migrated when the file is touched.
