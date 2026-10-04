import pg from "pg";
import { startTestPostgres } from "./testing";

const postgres = await startTestPostgres();
let failed = false;
try {
  const client = new pg.Client({ connectionString: postgres.adminUrl });
  await client.connect();
  try {
    const encoding = await client.query<{ server_encoding: string }>("show server_encoding");
    const collation = await client.query(
      "select collname from pg_collation where collname = 'und-x-icu'",
    );
    const serverEncoding = encoding.rows[0]?.server_encoding;
    if (serverEncoding !== "UTF8" || collation.rowCount !== 1) {
      console.error(
        JSON.stringify({ serverEncoding: serverEncoding ?? null, collations: collation.rowCount }),
      );
      failed = true;
    } else {
      console.log(JSON.stringify({ serverEncoding, collations: collation.rowCount }));
    }
  } finally {
    await client.end();
  }
} finally {
  await postgres.stop();
}

if (failed) process.exitCode = 1;
