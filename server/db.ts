import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// 데이터베이스 연결 설정
// 실제 환경에서는 process.env.DATABASE_URL을 사용해야 합니다.
if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Database connection will fail.");
}

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/ai_vision_db";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

