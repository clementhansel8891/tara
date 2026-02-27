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

  const tables = res.rows.map((r) => r.table_name);
  console.log("Tables in DB:", tables.join(", "));

  for (const table of tables) {
    if (
      [
        "products",
        "stock_levels",
        "inventory_stocks",
        "item_masters",
        "item_variants",
      ].includes(table)
    ) {
      const countRes = await client.query(`SELECT count(*) FROM "${table}"`);
      console.log(`Count for ${table}: ${countRes.rows[0].count}`);
    }
  }

  await client.end();
}

main().catch(console.error);
