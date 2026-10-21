/**
 * Hostinger Node.js app #2 entrypoint.
 * Start command: node worker/judge.mjs
 *
 * Requires the same env as the Next app (Supabase service role + Judge0 + webhook secret).
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const mod = await import(
  pathToFileURL(resolve(root, 'src/features/coding-contests/worker/startWorker.js')).href
);
await mod.startWorker();
