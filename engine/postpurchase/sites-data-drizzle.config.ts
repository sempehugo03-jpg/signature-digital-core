import {defineConfig} from 'drizzle-kit';
export default defineConfig({schema:'./engine/postpurchase/sites-data-db/schema.ts',out:'./engine/postpurchase/sites-data-drizzle',dialect:'sqlite'});
