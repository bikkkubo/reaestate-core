import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// 共有データベースURL（取引台帳システムと同じDB）
const SHARED_DATABASE_URL = "postgresql://neondb_owner:npg_wQhWar78EpUJ@ep-tiny-hall-a5u7jgqk.us-east-2.aws.neon.tech/neondb?sslmode=require";

const databaseUrl = SHARED_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });