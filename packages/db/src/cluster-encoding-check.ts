import pg from "pg";
import { startTestPostgres } from "./testing";

const postgres = await startTestPostgres();
let failed = false;
try {
  const client = new pg.Client({ connectionString: postgres.adminUrl });
  await client.connect();
  try {
    const encoding = await client.query<{ server_encoding: string }>("show server_encoding");
    const serverEncoding = encoding.rows[0]?.server_encoding;
    let icuCollationOk = false;
    if (serverEncoding === "UTF8") {
      try {
        await client.query(`select 'a' < 'b' collate "und-x-icu"`);
        icuCollationOk = true;
      } catch {
        icuCollationOk = false;
      }
    }
    if (serverEncoding !== "UTF8" || !icuCollationOk) {
      console.error(JSON.stringify({ serverEncoding: serverEncoding ?? null, icuCollationOk }));
      failed = true;
    } else {
      console.log(JSON.stringify({ serverEncoding, icuCollationOk }));
    }
  } finally {
    await client.end();
  }
} finally {
  await postgres.stop();
}

if (failed) process.exitCode = 1;
