import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Production-Ready Seed (Snake Case Schema)...");

  const passwordHash = bcrypt.hashSync("password123", 10);

  // 0. SEED TENANTS
  console.log("Seeding Tenants...");
  const zenvixTenant = await prisma.tenants.upsert({
    where: { code: "ZENVIX" },
    update: {},
    create: {
      id: "zenvix-tenant",
      name: "Zenvix Core",
      code: "ZENVIX",
      status: "active",
    },
  });

  const bambuTenant = await prisma.tenants.upsert({
    where: { code: "BAMBUSILVER" },
    update: {},
    create: {
      id: "bambu-tenant",
      name: "BambuSilver",
      code: "BAMBUSILVER",
      status: "active",
    },
  });

  // 1. SEED ZENVIX (Main Company)
  console.log("Seeding Zenvix Company...");
  const zenvix = await prisma.companies.upsert({
    where: { code: "ZENVIX" },
    update: {},
    create: {
      name: "Zenvix",
      code: "ZENVIX",
      industry: "it",
      tenant_id: zenvixTenant.id, 
    },
  });

  const superadmin = await prisma.users.upsert({
    where: { email: "superadmin@zenvix.id" },
    update: {},
    create: {
      email: "superadmin@zenvix.id",
      password_hash: passwordHash,
      first_name: "Zenvix",
      last_name: "Superadmin",
      status: "active",
      tenant_id: zenvixTenant.id,
      user_companies: {
        create: {
          tenant_id: zenvixTenant.id,
          company_id: zenvix.id,
          role: "SUPERADMIN",
        },
      },
    },
  });

  // dev-user for bypass
  console.log("Seeding dev-user...");
  await prisma.users.upsert({
    where: { id: "dev-user" },
    update: {},
    create: {
      id: "dev-user",
      email: "dev@zenvix.id",
      password_hash: passwordHash,
      first_name: "Dev",
      last_name: "User",
      status: "active",
      tenant_id: zenvixTenant.id,
      user_companies: {
        create: {
          tenant_id: zenvixTenant.id,
          company_id: zenvix.id,
          role: "ADMIN",
        },
      },
    },
  });

  // Zenvix Departments
  const zenvixIT = await prisma.departments.upsert({
    where: { tenant_id_code: { tenant_id: zenvixTenant.id, code: "ZVX-IT" } },
    update: {},
    create: {
      tenant_id: zenvixTenant.id,
      name: "IT Department",
      code: "ZVX-IT",
      status: "active",
    },
  });

  // Zenvix Locations
  const zenvixOffice = await prisma.locations.upsert({
    where: { tenant_id_code: { tenant_id: zenvixTenant.id, code: "ZVX-OFF-01" } },
    update: {},
    create: {
      tenant_id: zenvixTenant.id,
      name: "Ubud - Bali (Office)",
      code: "ZVX-OFF-01",
      type: "office",
      country: "ID",
      currency: "IDR",
    },
  });

  const zenvixRetailLoc = await prisma.locations.upsert({
    where: { tenant_id_code: { tenant_id: zenvixTenant.id, code: "ZVX-RET-01" } },
    update: {},
    create: {
      tenant_id: zenvixTenant.id,
      name: "(Retail) Ubud - Bali",
      code: "ZVX-RET-01",
      type: "branch",
      country: "ID",
      currency: "IDR",
    },
  });

  // Create Store for Retail Branch
  await prisma.stores.upsert({
    where: { tenant_id_code: { tenant_id: zenvixTenant.id, code: "ZVX-RET-01" } },
    update: {},
    create: {
      tenant_id: zenvixTenant.id,
      location_id: zenvixRetailLoc.id,
      name: "(Retail) Ubud - Bali",
      code: "ZVX-RET-01",
      type: "flagship",
      status: "active",
    },
  });

  // 2. SEED BAMBUSILVER (Client Company)
  console.log("Seeding BambuSilver Company...");
  const bambu = await prisma.companies.upsert({
    where: { code: "BAMBUSILVER" },
    update: {},
    create: {
      name: "BambuSilver by EstelaGea",
      code: "BAMBUSILVER",
      industry: "retail",
      tenant_id: bambuTenant.id,
    },
  });

  await prisma.users.upsert({
    where: { email: "estelagea@gmail.com" },
    update: {},
    create: {
      email: "estelagea@gmail.com",
      password_hash: passwordHash,
      first_name: "Estela",
      last_name: "Gea",
      status: "active",
      tenant_id: bambuTenant.id,
      user_companies: {
        create: {
          tenant_id: bambuTenant.id,
          company_id: bambu.id,
          role: "OWNER",
        },
      },
    },
  });

  const bambuSeminyakLoc = await prisma.locations.upsert({
    where: { tenant_id_code: { tenant_id: bambuTenant.id, code: "BS-BR-01" } },
    update: {},
    create: {
      tenant_id: bambuTenant.id,
      name: "Seminyak - Bali",
      code: "BS-BR-01",
      type: "branch",
      country: "ID",
      currency: "IDR",
    },
  });

  // Create Store for Seminyak Branch
  await prisma.stores.upsert({
    where: { tenant_id_code: { tenant_id: bambuTenant.id, code: "BS-BR-01" } },
    update: {},
    create: {
      tenant_id: bambuTenant.id,
      location_id: bambuSeminyakLoc.id,
      name: "Seminyak - Bali",
      code: "BS-BR-01",
      type: "boutique",
      status: "active",
    },
  });

  // 3. SEED INFRASTRUCTURE & AUDIT (for Command Center)
  console.log("Seeding Infrastructure & Audit Logs...");
  
  const lb = await prisma.retail_load_balancers.upsert({
    where: { id: "zvx-lb-01" },
    update: {},
    create: {
      id: "zvx-lb-01",
      tenant_id: "zenvix-tenant",
      name: "Global Edge Load Balancer",
      virtual_ip: "10.0.0.1",
      algorithm: "ROUND_ROBIN",
      status: "ONLINE",
    },
  });

  const gatewayNodes = [
    { id: "zvx-gw-alpha", name: "ZVX-GW-ALPHA", region: "ID-JKT-01" },
    { id: "zvx-gw-beta", name: "ZVX-GW-BETA", region: "ID-DPS-01" },
    { id: "zvx-gw-gamma", name: "ZVX-GW-GAMMA", region: "SG-SIN-01" },
  ];

  for (const node of gatewayNodes) {
    await prisma.retail_gateway_nodes.upsert({
      where: { id: node.id },
      update: {},
      create: {
        id: node.id,
        tenant_id: "zenvix-tenant",
        load_balancer_id: lb.id,
        node_name: node.name,
        ip_address: `192.168.1.${Math.floor(Math.random() * 254)}`,
        port: 3001,
        status: "ACTIVE",
        health_score: 95 + Math.floor(Math.random() * 5),
        region: node.region,
        version: "v4.2-stable",
      },
    });
  }

  // Seed Audit Logs
  const auditActions = [
    { action: "SHIFT_OPEN", module: "RETAIL", severity: "INFO" },
    { action: "ORDER_COMPLETED", module: "RETAIL", severity: "INFO" },
    { action: "INVENTORY_OPNAME_SYNC", module: "RETAIL", severity: "WARNING" },
    { action: "GATEWAY_FAILOVER_TRIGGER", module: "INFRA", severity: "CRITICAL" },
  ];

  for (let i = 0; i < 10; i++) {
    const act = auditActions[i % auditActions.length];
    await prisma.audit_logs.create({
      data: {
        tenant_id: "zenvix-tenant",
        module: act.module,
        action: act.action,
        entity_type: "SYSTEM",
        entity_id: "global",
        user_id: superadmin.id,
        severity: act.severity,
        ip_address: "127.0.0.1",
        metadata: {
          context: "Production Seed",
          iteration: i
        }
      }
    });
  }

  console.log("Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
