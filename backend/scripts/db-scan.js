import dotenv from "dotenv";
import pg from "pg";
const { Client } = pg;

dotenv.config({ path: "./.env" });

const cfg = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
};

async function run() {
  const admin = new Client({ ...cfg, database: "postgres" });
  await admin.connect();
  const dbs = (
    await admin.query(
      "select datname from pg_database where datistemplate=false order by datname"
    )
  ).rows.map((r) => r.datname);

  for (const db of dbs) {
    const c = new Client({ ...cfg, database: db });
    try {
      await c.connect();
      const hasClients = (
        await c.query("select to_regclass('public.clients') as t")
      ).rows[0].t;
      const hasSuppliers = (
        await c.query("select to_regclass('public.suppliers') as t")
      ).rows[0].t;

      let clients = "-";
      let suppliers = "-";
      if (hasClients) {
        clients = (await c.query("select count(*)::int as c from clients")).rows[0].c;
      }
      if (hasSuppliers) {
        suppliers = (await c.query("select count(*)::int as c from suppliers")).rows[0].c;
      }
      console.log(`${db}\tclients=${clients}\tsuppliers=${suppliers}`);
    } catch (err) {
      console.log(`${db}\terror=${err.message}`);
    } finally {
      try {
        await c.end();
      } catch {}
    }
  }

  await admin.end();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
