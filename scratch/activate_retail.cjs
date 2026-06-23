const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function activateModule(url, name, tenantId) {
  console.log(`Connecting to ${name}...`);
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`Connected to ${name} successfully!`);

    // Verify tenant exists
    const tenantRes = await client.query(
      `SELECT id, name FROM tenants WHERE id = $1`,
      [tenantId]
    );
    console.log(`Tenant details in ${name}:`, tenantRes.rows);

    if (tenantRes.rows.length === 0) {
      console.log(`Warning: Tenant ${tenantId} not found in ${name}.`);
    }

    // List existing module statuses for this tenant
    const existingStatuses = await client.query(
      `SELECT module_key, enabled FROM admin_module_statuses WHERE tenant_id = $1`,
      [tenantId]
    );
    console.log(`Current active modules for ${tenantId} in ${name}:`, existingStatuses.rows);

    // Modules to enable
    const modules = [
      'retail', 'finance', 'hr', 'it', 'it-settings', 'settings',
      'admin', 'procurement', 'sales', 'inventory', 'marketing', 'payment'
    ];

    for (const mod of modules) {
      // Check if it exists
      const checkRes = await client.query(
        `SELECT id FROM admin_module_statuses WHERE tenant_id = $1 AND module_key = $2`,
        [tenantId, mod]
      );

      if (checkRes.rows.length > 0) {
        // Update
        await client.query(
          `UPDATE admin_module_statuses SET enabled = true, updated_at = NOW(), updated_by = 'system' WHERE tenant_id = $1 AND module_key = $2`,
          [tenantId, mod]
        );
        console.log(`Updated module status: ${mod} -> enabled = true`);
      } else {
        // Insert
        const id = uuidv4();
        await client.query(
          `INSERT INTO admin_module_statuses (id, tenant_id, module_key, enabled, updated_by, updated_at) VALUES ($1, $2, $3, true, 'system', NOW())`,
          [id, tenantId, mod]
        );
        console.log(`Created and enabled module status: ${mod}`);
      }
    }

    // Verify updated status
    const updatedStatuses = await client.query(
      `SELECT module_key, enabled FROM admin_module_statuses WHERE tenant_id = $1`,
      [tenantId]
    );
    console.log(`Updated active modules for ${tenantId} in ${name}:`, updatedStatuses.rows);

    await client.end();
  } catch (err) {
    console.error(`Operation on ${name} failed:`, err.message);
    try { client.end(); } catch (e) {}
  }
}

async function run() {
  const localUrl = "postgresql://zenvix:zenvix_secure_2026!@localhost:5432/zenvix_prod?schema=public";
  const prodUrl = "postgresql://zenvix:zenvix_secure_2026!@150.109.15.108:5433/zenvix_prod?schema=public";
  const tenantId = "tnt-3rlhko";

  await activateModule(localUrl, "Local Database (5432)", tenantId);
  console.log('\n-----------------------------------------\n');
  await activateModule(prodUrl, "Production VPS Database (5433)", tenantId);
}

run();
