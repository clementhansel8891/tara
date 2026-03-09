"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs = require("fs");
var path = require("path");
var prisma = new client_1.PrismaClient();
function main() {
  return __awaiter(this, void 0, void 0, function () {
    var targetTenantId,
      locationId,
      jsonRaw,
      data,
      taxonomy_nodes,
      item_masters,
      item_variants,
      defaultCategoryId,
      _i,
      taxonomy_nodes_1,
      node,
      _a,
      taxonomy_nodes_2,
      node,
      e_1,
      masterMap,
      _b,
      item_masters_1,
      m,
      BATCH_SIZE,
      productsBatch,
      projectionsBatch,
      inserted,
      _c,
      item_variants_1,
      variant,
      master,
      attrs,
      variantSuffix,
      name_1,
      catId,
      itemType,
      sku,
      barcode;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          targetTenantId = "comp-demo-a";
          locationId = "loc-bali-demo";
          console.log(
            "Starting massive 9K seed for tenant: ".concat(targetTenantId),
          );
          jsonRaw = fs.readFileSync(
            path.join(__dirname, "../seed-trial/universal_tenant_seed.json"),
            "utf-8",
          );
          data = JSON.parse(jsonRaw);
          ((taxonomy_nodes = data.taxonomy_nodes),
            (item_masters = data.item_masters),
            (item_variants = data.item_variants));
          // 1. Map Taxonomy -> ProductCategory
          console.log(
            "Seeding ".concat(taxonomy_nodes.length, " Categories..."),
          );
          defaultCategoryId = "";
          ((_i = 0), (taxonomy_nodes_1 = taxonomy_nodes));
          _d.label = 1;
        case 1:
          if (!(_i < taxonomy_nodes_1.length)) return [3 /*break*/, 4];
          node = taxonomy_nodes_1[_i];
          if (!defaultCategoryId) defaultCategoryId = node.id;
          return [
            4 /*yield*/,
            prisma.productCategory.upsert({
              where: { id: node.id },
              update: { tenantId: targetTenantId }, // Ensure tenant is correct
              create: {
                id: node.id,
                tenantId: targetTenantId,
                name: node.name || "Unnamed Category",
              },
            }),
          ];
        case 2:
          _d.sent();
          _d.label = 3;
        case 3:
          _i++;
          return [3 /*break*/, 1];
        case 4:
          ((_a = 0), (taxonomy_nodes_2 = taxonomy_nodes));
          _d.label = 5;
        case 5:
          if (!(_a < taxonomy_nodes_2.length)) return [3 /*break*/, 10];
          node = taxonomy_nodes_2[_a];
          if (!node.parent_id) return [3 /*break*/, 9];
          _d.label = 6;
        case 6:
          _d.trys.push([6, 8, , 9]);
          return [
            4 /*yield*/,
            prisma.productCategory.update({
              where: { id: node.id },
              data: { parentId: node.parent_id },
            }),
          ];
        case 7:
          _d.sent();
          return [3 /*break*/, 9];
        case 8:
          e_1 = _d.sent();
          return [3 /*break*/, 9];
        case 9:
          _a++;
          return [3 /*break*/, 5];
        case 10:
          masterMap = new Map();
          for (
            _b = 0, item_masters_1 = item_masters;
            _b < item_masters_1.length;
            _b++
          ) {
            m = item_masters_1[_b];
            masterMap.set(m.id, m);
          }
          // 2. Map Variants -> Product & ProductProjection
          console.log(
            "Seeding ".concat(
              item_variants.length,
              " Products and Projections...",
            ),
          );
          BATCH_SIZE = 500;
          productsBatch = [];
          projectionsBatch = [];
          inserted = 0;
          ((_c = 0), (item_variants_1 = item_variants));
          _d.label = 11;
        case 11:
          if (!(_c < item_variants_1.length)) return [3 /*break*/, 15];
          variant = item_variants_1[_c];
          master = masterMap.get(variant.item_master_id) || {};
          attrs = [];
          if (variant.variant_attributes) {
            if (variant.variant_attributes.size)
              attrs.push(variant.variant_attributes.size);
            if (variant.variant_attributes.color)
              attrs.push(variant.variant_attributes.color);
          }
          variantSuffix = attrs.length > 0 ? " - ".concat(attrs.join(" ")) : "";
          name_1 = (master.name || "Unknown Product") + variantSuffix;
          catId =
            master.taxonomy_node_ids && master.taxonomy_node_ids.length > 0
              ? master.taxonomy_node_ids[0]
              : defaultCategoryId;
          itemType = client_1.$Enums.ItemType.ITEM;
          if (master.type === "SERVICE")
            itemType = client_1.$Enums.ItemType.SERVICE;
          if (master.type === "RAW_MATERIAL")
            itemType = client_1.$Enums.ItemType.RAW_MATERIAL;
          sku = String(variant.sku || variant.id);
          barcode = String(variant.barcode || sku);
          productsBatch.push({
            id: String(variant.id),
            tenantId: targetTenantId,
            categoryId: String(catId),
            name: String(name_1.substring(0, 100)),
            sku: sku,
            barcode: barcode,
            description: String(master.description || name_1),
            unit: String(master.uom || "EACH"),
            basePrice: Number(variant.price || 0),
            taxRate: 0.11,
            type: itemType,
            status: variant.is_active ? "active" : "inactive",
          });
          projectionsBatch.push({
            id: "proj-".concat(variant.id),
            itemMasterId: variant.id,
            tenantId: targetTenantId,
            locationId: locationId,
            moduleType: "RETAIL",
            customName: name_1,
            customDescription: master.description || name_1,
            price: variant.price || 0,
            isActive: variant.is_active || true,
          });
          if (!(productsBatch.length >= BATCH_SIZE)) return [3 /*break*/, 14];
          // @ts-ignore
          return [
            4 /*yield*/,
            prisma.product.createMany({
              data: productsBatch,
              skipDuplicates: true,
            }),
          ];
        case 12:
          // @ts-ignore
          _d.sent();
          // @ts-ignore
          return [
            4 /*yield*/,
            prisma.productProjection.createMany({
              data: projectionsBatch,
              skipDuplicates: true,
            }),
          ];
        case 13:
          // @ts-ignore
          _d.sent();
          inserted += productsBatch.length;
          console.log(
            "Inserted "
              .concat(inserted, "/")
              .concat(item_variants.length, " items..."),
          );
          productsBatch = [];
          projectionsBatch = [];
          _d.label = 14;
        case 14:
          _c++;
          return [3 /*break*/, 11];
        case 15:
          if (!(productsBatch.length > 0)) return [3 /*break*/, 18];
          // @ts-ignore
          return [
            4 /*yield*/,
            prisma.product.createMany({
              data: productsBatch,
              skipDuplicates: true,
            }),
          ];
        case 16:
          // @ts-ignore
          _d.sent();
          // @ts-ignore
          return [
            4 /*yield*/,
            prisma.productProjection.createMany({
              data: projectionsBatch,
              skipDuplicates: true,
            }),
          ];
        case 17:
          // @ts-ignore
          _d.sent();
          inserted += productsBatch.length;
          console.log(
            "Inserted "
              .concat(inserted, "/")
              .concat(item_variants.length, " items..."),
          );
          _d.label = 18;
        case 18:
          console.log("Massive seed completed successfully!");
          return [2 /*return*/];
      }
    });
  });
}
main()
  .catch(function (e) {
    console.error(e);
    process.exit(1);
  })
  .finally(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, prisma.$disconnect()];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
