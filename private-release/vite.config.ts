import vinext from 'vinext';
import { defineConfig } from 'vite';
import { sites } from './build/sites-vite-plugin';
import { readFileSync } from 'node:fs';

const profile = JSON.parse(readFileSync('private-release/release-profile.json', 'utf8'));
if (!profile || Array.isArray(profile) || Object.keys(profile).length !== 1 || !['candidate', 'rollback'].includes(profile.mode)) throw Error('Invalid tracked private release profile');
const mode = profile.mode;
if (process.env.FABRYA_PRIVATE_RELEASE_MODE !== undefined && process.env.FABRYA_PRIVATE_RELEASE_MODE !== mode) throw Error('FABRYA_PRIVATE_RELEASE_MODE differs from tracked private profile');
const local = process.env.FABRYA_PRIVATE_LOCAL_REVIEW === 'true';
export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS = 'false';
  process.env.WRANGLER_LOG_PATH = '.wrangler/logs';
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    define: { __FABRYA_PRIVATE_MODE__: JSON.stringify(mode), __FABRYA_LOCAL_REVIEW__: JSON.stringify(local), __FABRYA_PRIVATE_SITE_ID__: JSON.stringify('appgprj_6acaa0a0fc588191b73beeb33eb23f88') },
    server: { host: '127.0.0.1', allowedHosts: ['127.0.0.1'] },
    plugins: [vinext(), sites(), cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] }, inspectorPort: false,
      config: { main: './private-release/worker.ts', compatibility_flags: ['nodejs_compat'],
        d1_databases: [{ binding: 'DB', database_name: 'fabrya-private-review', database_id: '00000000-0000-4000-8000-000000000000' }],
        // No workflows, cron triggers, external dispatch or paid bindings.
      },
    })],
  };
});
