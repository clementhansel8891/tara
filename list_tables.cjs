const { Client } = require("pg");

async function main() {
  const url =
    "postgresql://zenvix:zenvix_dev_password@localhost:5433/zenvix_dev?schema=public";
  const client = new Client({ connectionString: url });
  await client.connect();

  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log("Tables in DB:");
  console.log(res.rows.map((r) => r.table_name).join(", "));

  await client.end();
}

main().catch(console.error);
