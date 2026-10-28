import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
const root = existsSync("./db/schema.ts") ? "." : "./product";
export default defineConfig({
  out: root + "/drizzle",
  schema: root + "/db/schema.ts",
  dialect: "sqlite",
});
