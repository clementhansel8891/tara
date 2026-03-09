import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Production-Ready Seed...");

  // 1. CLEAR EXISTING DATA (already handled by migrate reset, but good for safety)

  const passwordHash = bcrypt.hashSync("password123", 10);

  // 2. SEED ZENVIX (Main Company)
  console.log("Seeding Zenvix...");
  const zenvix = await prisma.company.upsert({
    where: { code: "ZENVIX" },
    update: {},
    create: {
      name: "Zenvix",
      code: "ZENVIX",
      industry: "it",
    },
  });

  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@zenvix.id" },
    update: {},
    create: {
      email: "superadmin@zenvix.id",
      passwordHash,
      firstName: "Zenvix",
      lastName: "Superadmin",
      status: "active",
      userCompanies: {
        create: {
          tenantId: zenvix.id,
          role: "SUPERADMIN",
        },
      },
    },
  });

  // dev-user for bypass
  console.log("Seeding dev-user...");
  await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: {
      id: "dev-user",
      email: "dev@zenvix.id",
      passwordHash,
      firstName: "Dev",
      lastName: "User",
      status: "active",
      userCompanies: {
        create: {
          tenantId: zenvix.id,
          role: "ADMIN",
        },
      },
    },
  });

  // Zenvix Departments
  const zenvixIT = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: zenvix.id, code: "ZVX-IT" } },
    update: {},
    create: {
      tenantId: zenvix.id,
      name: "IT Department",
      code: "ZVX-IT",
      status: "active",
    },
  });

  const zenvixRetailDept = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: zenvix.id, code: "ZVX-RET" } },
    update: {},
    create: {
      tenantId: zenvix.id,
      name: "Retail Department",
      code: "ZVX-RET",
      status: "active",
    },
  });

  // Zenvix Locations
  const zenvixOffice = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: zenvix.id, code: "ZVX-OFF-01" } },
    update: {},
    create: {
      tenantId: zenvix.id,
      name: "Ubud - Bali (Office)",
      code: "ZVX-OFF-01",
      type: "office",
      country: "ID",
      currency: "IDR",
    },
  });

  const zenvixRetail = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: zenvix.id, code: "ZVX-RET-01" } },
    update: {},
    create: {
      tenantId: zenvix.id,
      name: "(Retail) Ubud - Bali",
      code: "ZVX-RET-01",
      type: "branch",
      country: "ID",
      currency: "IDR",
    },
  });

  // Create Store for Retail Branch
  await prisma.store.upsert({
    where: { tenantId_code: { tenantId: zenvix.id, code: "ZVX-RET-01" } },
    update: {},
    create: {
      tenantId: zenvix.id,
      locationId: zenvixRetail.id,
      name: "(Retail) Ubud - Bali",
      code: "ZVX-RET-01",
      type: "flagship",
      status: "active",
    },
  });

  // 3. SEED BAMBUSILVER (Client Company)
  console.log("Seeding BambuSilver...");
  const bambu = await prisma.company.upsert({
    where: { code: "BAMBUSILVER" },
    update: {},
    create: {
      name: "BambuSilver by EstelaGea",
      code: "BAMBUSILVER",
      industry: "retail",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "estelagea@gmail.com" },
    update: {},
    create: {
      email: "estelagea@gmail.com",
      passwordHash,
      firstName: "Estela",
      lastName: "Gea",
      status: "active",
      userCompanies: {
        create: {
          tenantId: bambu.id,
          role: "OWNER",
        },
      },
    },
  });

  // Bambu Departments
  const bambuRetailDept = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: bambu.id, code: "BS-RET" } },
    update: {},
    create: {
      tenantId: bambu.id,
      name: "Retail Operations",
      code: "BS-RET",
      status: "active",
    },
  });

  const bambuAdminDept = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: bambu.id, code: "BS-ADM" } },
    update: {},
    create: {
      tenantId: bambu.id,
      name: "Administration",
      code: "BS-ADM",
      status: "active",
    },
  });

  // Bambu Locations
  const bambuOffice = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: bambu.id, code: "BS-OFFICE" } },
    update: {},
    create: {
      tenantId: bambu.id,
      name: "Kedonganan - Bali",
      code: "BS-OFFICE",
      type: "office",
      country: "ID",
      currency: "IDR",
    },
  });

  const bambuSeminyak = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: bambu.id, code: "BS-BR-01" } },
    update: {},
    create: {
      tenantId: bambu.id,
      name: "Seminyak - Bali",
      code: "BS-BR-01",
      type: "branch",
      country: "ID",
      currency: "IDR",
    },
  });

  // Create Store for Seminyak Branch
  await prisma.store.upsert({
    where: { tenantId_code: { tenantId: bambu.id, code: "BS-BR-01" } },
    update: {},
    create: {
      tenantId: bambu.id,
      locationId: bambuSeminyak.id,
      name: "Seminyak - Bali",
      code: "BS-BR-01",
      type: "boutique",
      status: "active",
    },
  });

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
