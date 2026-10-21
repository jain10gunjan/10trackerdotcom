/**
 * Sync Judge0 /languages into coding_languages.
 * Usage: node scripts/seed_judge0_languages.mjs
 * Enables a small default set (C++, Python, Java, JS, C).
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const DEFAULT_ENABLE_NAMES = [
  'c++',
  'python',
  'java',
  'javascript',
  'c ',
  'c(',
];

const { getLanguages } = await import(
  pathToFileURL(resolve(root, 'src/lib/judge0/client.js')).href
);
const { getSupabaseServer, isValidServiceRoleKey } = await import(
  pathToFileURL(resolve(root, 'src/lib/supabaseServer.js')).href
);

if (!isValidServiceRoleKey()) {
  console.error('SUPABASE_SERVICE_ROLE_KEY (service_role) required');
  process.exit(1);
}

const supabase = getSupabaseServer(true);
const languages = await getLanguages();
console.log(`Fetched ${languages.length} languages from Judge0`);

let upserted = 0;
for (const lang of languages) {
  const name = String(lang.name || '').trim();
  const judge0Id = Number(lang.id);
  if (!name || !Number.isFinite(judge0Id)) continue;

  const lower = name.toLowerCase();
  const enabled = DEFAULT_ENABLE_NAMES.some((n) => lower.startsWith(n.trim()));

  const { error } = await supabase.from('coding_languages').upsert(
    {
      name,
      judge0_language_id: judge0Id,
      enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'judge0_language_id' }
  );
  if (error) {
    console.error('Upsert failed', judge0Id, error.message);
  } else {
    upserted += 1;
  }
}

console.log(`Upserted ${upserted} languages (defaults enabled for common CP langs)`);
