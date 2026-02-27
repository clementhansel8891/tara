import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenantId = "04bbc0e0-213d-4af4-9ce8-0e4674a58a90";
  const locationId = "loc-jakarta"; // We will use a mock location ID if one doesn't exist, though typically it relates to a real location. For this seed, we assume it's valid or we'll create a dummy one.
  const baliLocationId = "loc-bali";

  console.log(`Seeding Universal Inventory for tenant: ${tenantId}`);

  // 1. Ensure Tenant (Company) Exists
  const company = await prisma.company.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: "Zenvix",
      code: "ZENVIX",
    },
  });

  // 1b. Ensure Superadmin User Exists
  const user = await prisma.user.upsert({
    where: { email: "superadmin@zenvix.com" },
    update: {},
    create: {
      id: "usr-superadmin-001",
      email: "superadmin@zenvix.com",
      passwordHash: bcrypt.hashSync("password123", 10),
      firstName: "Superadmin",
      lastName: "Zenvix",
      status: "active",
      userCompanies: {
        create: {
          tenantId: tenantId,
          role: "owner",
        },
      },
    },
  });

  // 1c. Ensure Jakarta Location Exists
  const location = await prisma.location.upsert({
    where: { id: locationId },
    update: {},
    create: {
      id: locationId,
      tenantId,
      name: "Jakarta HQ",
      code: "JKT-01",
      address: "123 Main St",
      type: "headquarters",
      country: "ID",
      currency: "IDR",
    },
  });

  // 1d. Ensure Bali Location & Store Exists
  const baliStore = await prisma.location.upsert({
    where: { id: baliLocationId },
    update: {},
    create: {
      id: baliLocationId,
      tenantId,
      name: "Bali Store",
      code: "BL-01",
      address: "123 Sunset Road",
      type: "branch",
      country: "ID",
      currency: "IDR",
    },
  });

  const baliStoreRecord = await prisma.store.upsert({
    where: { tenantId_code: { tenantId: tenantId, code: "BL-01" } },
    update: {},
    create: {
      id: "sto-bali-001",
      tenantId,
      locationId: baliLocationId,
      name: "Bali Store",
      code: "BL-01",
      type: "flagship",
      country: "ID",
      currency: "IDR",
      status: "active",
      timezone: "Asia/Makassar",
    },
  });

  // 2. Ensure Categories Exist
  const servicesCat = await prisma.productCategory.upsert({
    where: { tenantId_name: { tenantId, name: "Services" } },
    update: {},
    create: { tenantId, name: "Services" },
  });

  const materialsCat = await prisma.productCategory.upsert({
    where: { tenantId_name: { tenantId, name: "Raw Materials" } },
    update: {},
    create: { tenantId, name: "Raw Materials" },
  });

  const jewelryCat = await prisma.productCategory.upsert({
    where: { tenantId_name: { tenantId, name: "Jewelry" } },
    update: {},
    create: { tenantId, name: "Jewelry" },
  });

  // 3. Insert 'Service' Item
  const serviceItem = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId, sku: "SRV-WED-001" } },
    update: { type: $Enums.ItemType.SERVICE },
    create: {
      tenantId,
      sku: "SRV-WED-001",
      barcode: "B-SRV-WED-001",
      name: "Wedding Catering",
      description: "Full service wedding catering package",
      categoryId: servicesCat.id,
      unit: "Package",
      basePrice: 5000,
      type: $Enums.ItemType.SERVICE,
    },
  });

  // 4. Insert 'Material' Item
  const materialItem = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId, sku: "RWM-SLV-001" } },
    update: { type: $Enums.ItemType.RAW_MATERIAL },
    create: {
      tenantId,
      sku: "RWM-SLV-001",
      barcode: "B-RWM-SLV-001",
      name: "Silver Wire (99.9%)",
      description: "High purity silver wire for manufacturing",
      categoryId: materialsCat.id,
      unit: "Gram",
      basePrice: 1.5,
      type: $Enums.ItemType.RAW_MATERIAL,
    },
  });

  // 5. Insert 'Product' Item with Projection
  const productItem = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId, sku: "PRD-ER-001" } },
    update: { type: $Enums.ItemType.ITEM },
    create: {
      tenantId,
      sku: "PRD-ER-001",
      barcode: "B-PRD-ER-001",
      name: "E.FLOWER Earrings (Base)",
      description: "Base silver flower earrings",
      categoryId: jewelryCat.id,
      unit: "Pair",
      basePrice: 150,
      type: $Enums.ItemType.ITEM,
    },
  });

  // Projection for the product
  await prisma.productProjection
    .upsert({
      where: {
        itemMasterId_tenantId_locationId_moduleType: {
          itemMasterId: productItem.id,
          tenantId,
          locationId: "null", // Use null string temporarily if optional unique constraint requires a string. Actually Prisma maps null literally for unique indices depending on postgres version. Wait, actually we can just use the ID. Let's not provide locationId to make it a global module projection.
          moduleType: "RETAIL",
        },
        // Workaround composite unique constraint with optional fields:
        // In Prisma, we often have to findFirst and update, but upsert might be tricky if locationId is null.
      } as any,
      update: {
        customName: "Premium Floral Earrings",
        customDescription:
          "Beautiful handcrafted silver floral earrings for retail",
        price: 199.99,
      },
      create: {
        itemMasterId: productItem.id,
        tenantId,
        moduleType: "RETAIL",
        customName: "Premium Floral Earrings",
        customDescription:
          "Beautiful handcrafted silver floral earrings for retail",
        price: 199.99,
      },
    })
    .catch(async (e) => {
      // Upsert with null unique constraint might fail on Prisma, let's do findFirst/create
      const existing = await prisma.productProjection.findFirst({
        where: {
          itemMasterId: productItem.id,
          tenantId,
          moduleType: "RETAIL",
          locationId: null,
        },
      });
      if (existing) {
        await prisma.productProjection.update({
          where: { id: existing.id },
          data: { customName: "Premium Floral Earrings", price: 199.99 },
        });
      } else {
        await prisma.productProjection.create({
          data: {
            itemMasterId: productItem.id,
            tenantId,
            moduleType: "RETAIL",
            customName: "Premium Floral Earrings",
            customDescription:
              "Beautiful handcrafted silver floral earrings for retail",
            price: 199.99,
          },
        });
      }
    });

  // 6. Label Configs
  await prisma.labelConfig
    .upsert({
      where: {
        tenantId_locationId_moduleType: {
          tenantId,
          locationId: "null",
          moduleType: "RETAIL",
        },
      } as any,
      update: {
        labels: {
          item_name: "Product Name",
          item_sku: "Retail SKU",
          description: "Marketing Copy",
        },
      },
      create: {
        tenantId,
        moduleType: "RETAIL",
        labels: {
          item_name: "Product Name",
          item_sku: "Retail SKU",
          description: "Marketing Copy",
        },
      },
    })
    .catch(async () => {
      // Fallback for null unique constraint issue
      const existing = await prisma.labelConfig.findFirst({
        where: { tenantId, moduleType: "RETAIL", locationId: null },
      });
      if (existing) {
        await prisma.labelConfig.update({
          where: { id: existing.id },
          data: {
            labels: {
              item_name: "Product Name",
              item_sku: "Retail SKU",
              description: "Marketing Copy",
            },
          },
        });
      } else {
        await prisma.labelConfig.create({
          data: {
            tenantId,
            moduleType: "RETAIL",
            labels: {
              item_name: "Product Name",
              item_sku: "Retail SKU",
              description: "Marketing Copy",
            },
          },
        });
      }
    });

  await prisma.labelConfig
    .upsert({
      where: {
        tenantId_locationId_moduleType: {
          tenantId,
          locationId: "null",
          moduleType: "MANUFACTURING",
        },
      } as any,
      update: {
        labels: {
          item_name: "Raw Material",
          item_sku: "Internal Part No",
        },
      },
      create: {
        tenantId,
        moduleType: "MANUFACTURING",
        labels: {
          item_name: "Raw Material",
          item_sku: "Internal Part No",
        },
      },
    })
    .catch(async () => {
      // Fallback for null unique constraint issue
      const existing = await prisma.labelConfig.findFirst({
        where: { tenantId, moduleType: "MANUFACTURING", locationId: null },
      });
      if (existing) {
        await prisma.labelConfig.update({
          where: { id: existing.id },
          data: {
            labels: {
              item_name: "Raw Material",
              item_sku: "Internal Part No",
            },
          },
        });
      } else {
        await prisma.labelConfig.create({
          data: {
            tenantId,
            moduleType: "MANUFACTURING",
            labels: {
              item_name: "Raw Material",
              item_sku: "Internal Part No",
            },
          },
        });
      }
    });

  console.log("Seeding Complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
