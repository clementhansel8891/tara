# Inventory Command — User Manual

> **Department:** Inventory & Stock Control  
> **Workspace:** Inventory Command — Dynamic Stock Control & Supply Chain Visibility Matrix  
> **URL Base:** `/core/inventory`

---

## Role Access

| Role | Dashboard | Stock Hub | Receiving | Transfers | Warehouse | IoT | Adjustments | Audit |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Owner / Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Warehouse Staff | 👁 | 👁 | ✅ | ✅ | 👁 | 👁 | ✅ | ❌ |
| Other Depts | ❌ | 👁 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Sidebar Navigation

```
Inventory Command
├── INTELLIGENCE
│   ├── Inventory Command     (/core/inventory)
│   └── Stock Insights        (/core/inventory/insights)
├── OPERATIONS
│   ├── Stock Hub             (/core/inventory/stock)
│   ├── Receiving Desk        (/core/inventory/receiving)
│   ├── Transfer Desk         (/core/inventory/transfers)
│   └── Warehouse Map         (/core/inventory/warehouse)
├── AUTOMATION
│   ├── IoT Feed              (/core/inventory/iot)
│   └── Adjustments           (/core/inventory/adjustments)
└── GOVERNANCE
    ├── Audit Vault           (/core/inventory/audit)
    └── Administration        (/core/inventory/admin)
```

---

## 1. Inventory Command Dashboard (`/core/inventory`)

**Purpose:** Real-time overview of stock levels, reorder alerts, and inventory health across all locations.

### Reading the Dashboard
1. Navigate to **Inventory Command**.
2. The dashboard shows:
   - **Total SKUs** — number of unique products managed
   - **Low Stock Alerts** — items below their reorder threshold
   - **Out of Stock Items** — items with zero quantity
   - **Pending Receiving** — purchase orders awaiting physical receipt
   - **Open Transfers** — stock currently in transit between locations
3. Click any metric card to jump to the related tool.

### Alert Types
| Alert | Action Required |
|-------|----------------|
| 🔴 Out of Stock | Create a Purchase Requisition immediately |
| 🟡 Low Stock | Review reorder point and create PR if needed |
| 🟠 Pending Receiving | Check Receiving Desk for PO receipts |
| 🔵 In Transit | Monitor Transfer Desk for arrival confirmation |

---

## 2. Stock Insights (`/core/inventory/insights`)

**Purpose:** Inventory analytics — ABC analysis, demand forecasting, and slow-mover identification.

### Key Panels
- **ABC Analysis** — categorizes products by revenue contribution (A = high, B = medium, C = low)
- **Demand Forecast** — predicted stock needs for the next 30/60/90 days
- **Slow Movers** — items with low turnover rate (risk of obsolescence)
- **Stock Turnover Ratio** — how quickly inventory is sold/used vs. held
- **Inventory Valuation** — total stock value at cost and market price

### Steps
1. Navigate to **Inventory Command → Stock Insights**.
2. Select a **Location** or **All Locations** from the filter.
3. Select a **Time Period** (monthly or quarterly).
4. Review each analytics panel.
5. Click **Export Analysis** → download as Excel.
6. Click **Flag for Reorder** on any slow-mover to create a review request.

---

## 3. Stock Hub (`/core/inventory/stock`)

**Purpose:** The complete product catalog — every SKU, quantity, location, and pricing.

### 3.1 Viewing Stock Levels
1. Navigate to **Inventory Command → Stock Hub**.
2. The **Stock Table** shows all SKUs with:
   - SKU Code, Product Name, Category
   - Current Quantity on Hand
   - Reorder Point (minimum before restocking)
   - Unit Cost and Selling Price
   - Location (warehouse or branch)
3. Use the **FilterBar** to search by SKU code, name, or category.
4. Click any row to view the **Product Detail Panel**.

### 3.2 Adding a New Product / SKU
1. Click **New Product** in the WorkQueue.
2. Fill in:
   - **Product Name** (full descriptive name)
   - **SKU Code** (system can auto-generate — click **Generate SKU**)
   - **Category** (Electronics, Food & Beverage, Raw Materials, etc.)
   - **Unit of Measure** (pcs, kg, liter, box, etc.)
   - **Unit Cost** (purchase price per unit)
   - **Selling Price**
   - **Reorder Point** (minimum quantity before alert triggers)
   - **Reorder Quantity** (how many to order when restocking)
   - **Warehouse Location** (bin/shelf code)
   - **Barcode** (optional — can be scanned or manually entered)
3. Upload a **Product Image** (optional).
4. Click **Save Product**.

### 3.3 Editing a Product
1. Click the product row in the Stock Table.
2. Click **Edit** in the Product Detail Panel.
3. Update the relevant fields.
4. Click **Save Changes**.

### 3.4 Generating a Product Label
1. Open the product record.
2. Click **Generate Label**.
3. Select the label template (standard barcode label, shelf label, etc.).
4. Click **Print Label** or **Download PDF**.

### 3.5 Setting Stock Alerts
1. In the Product Detail Panel, click **Edit Alert Settings**.
2. Set:
   - **Low Stock Threshold** — alert at this quantity
   - **Out of Stock Threshold** — usually 0
   - **Alert Recipients** — notify specific users via email
3. Click **Save Alerts**.

---

## 4. Receiving Desk (`/core/inventory/receiving`)

**Purpose:** Process incoming stock from suppliers. Every delivery is matched to a Purchase Order (PO) and a Goods Receipt Note (GRN) is created.

### 4.1 Creating a Goods Receipt Note (GRN)
1. Navigate to **Inventory Command → Receiving Desk**.
2. Click **New GRN**.
3. Select the related **Purchase Order** (PO) from the dropdown.
   - The PO details auto-populate (vendor, expected items, quantities).
4. For each line item, enter the **Quantity Received** (may differ from ordered).
5. Note any **discrepancies**:
   - Short delivery → enter actual received quantity
   - Damaged goods → check **Damaged** and enter quantity
   - Rejected items → check **Rejected** and enter reason
6. Set the **Delivery Date** (date the goods physically arrived).
7. Enter the **Delivery Note / Waybill Number** from the supplier.
8. Click **Post GRN**.
9. Stock levels are automatically updated in the Stock Hub.

### 4.2 Handling Discrepancies
If received quantity differs from PO quantity:
1. The system flags the discrepancy after posting the GRN.
2. Click **Report Discrepancy** → creates a notification to Procurement.
3. Procurement will contact the vendor for a credit note or replacement delivery.

### 4.3 Returning Goods to Supplier
1. Open the GRN that contains the goods to return.
2. Click **Return to Supplier**.
3. Select the items and quantities to return.
4. Enter the **Return Reason**.
5. Click **Confirm Return**.
6. A **Return Note** is generated and stock is deducted.

---

## 5. Transfer Desk (`/core/inventory/transfers`)

**Purpose:** Manage inter-location stock transfers — moving goods between warehouses, stores, or branches.

### 5.1 Creating a Stock Transfer
1. Navigate to **Inventory Command → Transfer Desk**.
2. Click **New Transfer**.
3. Fill in:
   - **From Location** (origin warehouse/store)
   - **To Location** (destination)
   - **Expected Transfer Date**
4. Add **Transfer Line Items**:
   - Select **SKU** from the product list
   - Enter **Quantity to Transfer**
5. Click **Save Transfer** → saves as draft.
6. Click **Submit for Approval** → routes to Inventory Manager for sign-off.

### 5.2 Confirming Transfer Dispatch
After approval:
1. Open the approved transfer.
2. Click **Confirm Dispatch** → marks goods as "In Transit".
3. Stock is deducted from the source location at this point.

### 5.3 Confirming Transfer Receipt
At the destination location:
1. Open the **In Transit** transfer.
2. Click **Confirm Receipt**.
3. Enter the **Actual Quantities Received** (may differ if items were damaged in transit).
4. Click **Post Receipt**.
5. Stock is added to the destination location.

### 5.4 Transfer Status Meanings
| Status | Meaning |
|--------|---------|
| Draft | Created but not yet submitted |
| Pending Approval | Awaiting Inventory Manager sign-off |
| Approved | Ready for dispatch |
| In Transit | Dispatched from source |
| Received | Arrived and confirmed at destination |
| Discrepant | Received quantity differs from dispatched |

---

## 6. Warehouse Map (`/core/inventory/warehouse`)

**Purpose:** Physical warehouse layout — bin locations, zone management, and space utilization.

### Reading the Warehouse Map
1. Navigate to **Inventory Command → Warehouse Map**.
2. The map shows a visual layout of:
   - **Zones** (e.g., Zone A — Raw Materials, Zone B — Finished Goods)
   - **Aisles** and **Bin/Shelf** locations
   - **Occupancy Rate** per zone (color-coded)
3. Click any zone or bin to see what's currently stored there.

### Adding a New Bin Location
1. Click **New Location** in the WorkQueue.
2. Fill in: **Zone**, **Aisle**, **Rack**, **Bin Code** (e.g., A-01-R3-B2).
3. Set the **Capacity** (max quantity or weight).
4. Click **Save Location**.

### Assigning a Product to a Bin
1. Open a product in Stock Hub.
2. Click **Assign Location**.
3. Select the **Bin Code** from the Warehouse Map.
4. Click **Confirm Assignment**.

---

## 7. IoT Feed (`/core/inventory/iot`)

**Purpose:** Displays real-time events from connected IoT sensors — RFID readers, weight scales, temperature monitors, and barcode scanners.

### Reading the IoT Event Feed
1. Navigate to **Inventory Command → IoT Feed**.
2. Events appear in a live stream sorted by timestamp.
3. Each event shows:
   - **Device ID** — which sensor triggered the event
   - **Event Type** — SCAN, WEIGHT_CHANGE, TEMP_ALERT, etc.
   - **SKU** — the product involved (if identified)
   - **Quantity Change** — how much stock moved
   - **Location** — where the sensor is installed
4. Filter by **Device**, **Event Type**, or **Date range**.

### Acting on IoT Alerts
- **TEMP_ALERT** — Temperature out of range for cold-storage items. Click **Escalate to Warehouse** to alert the floor team.
- **WEIGHT_DISCREPANCY** — Scale reading differs from system record. Click **Trigger Recount** to initiate a physical count.
- **SCAN_UNRECOGNIZED** — Barcode not in the system. Click **Create Product** to onboard the new SKU.

---

## 8. Adjustments (`/core/inventory/adjustments`)

**Purpose:** Manual stock adjustments for physical count variances, spoilage, damage, and corrections.

### 8.1 Creating a Stock Adjustment
1. Navigate to **Inventory Command → Adjustments**.
2. Click **New Adjustment**.
3. Fill in:
   - **Adjustment Type**: 
     - **Increase** — found extra stock during count
     - **Decrease** — stock is missing, damaged, or expired
   - **SKU**
   - **Quantity** (the adjustment amount, not the final quantity)
   - **Reason**: PHYSICAL_COUNT, DAMAGE, EXPIRY, THEFT, CORRECTION
   - **Reference** (physical count sheet number or incident report)
4. Click **Save Adjustment** → saves as draft.
5. Click **Submit for Approval** → routes to Inventory Manager.
6. Once approved, the adjustment is posted and stock levels are updated.

### 8.2 Bulk Adjustments (After Physical Count)
1. Click **Import Count Sheet** in the WorkQueue.
2. Download the **Count Template** CSV.
3. Fill in: SKU Code, Location, Counted Quantity.
4. Upload the completed CSV.
5. The system calculates variances automatically.
6. Review the variance report.
7. Click **Submit All Adjustments** → sends all variances for approval.

### Adjustment Reason Codes
| Code | Description |
|------|-------------|
| PHYSICAL_COUNT | Regular stock count variance |
| DAMAGE | Items physically damaged |
| EXPIRY | Expired perishable goods |
| THEFT | Suspected theft loss |
| CORRECTION | System data entry error correction |
| RETURN | Customer return |

---

## 9. Audit Vault (`/core/inventory/audit`)

**Purpose:** Complete immutable log of all inventory movements and changes.

### Viewing Inventory Audit Logs
1. Navigate to **Inventory Command → Audit Vault**.
2. Filter by:
   - **Date range**
   - **Event Type** (GRN_POSTED, TRANSFER_DISPATCHED, ADJUSTMENT_APPROVED, etc.)
   - **SKU** — track movements of a specific product
   - **Location** — events at a specific warehouse
   - **User** — who performed the action
3. Click any row to see full event details.
4. Click **Export** → download as CSV for auditor submission.

### Common Audit Events
| Event | Trigger |
|-------|---------|
| `STOCK_RECEIVED` | GRN posted, stock added |
| `TRANSFER_DISPATCHED` | Stock left source location |
| `TRANSFER_RECEIVED` | Stock arrived at destination |
| `ADJUSTMENT_POSTED` | Manual stock adjustment approved and committed |
| `PRODUCT_CREATED` | New SKU added to catalog |

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Stock level not updating after GRN | Verify GRN was posted (not just saved as draft) |
| Transfer stuck as "In Transit" | Destination must click "Confirm Receipt" |
| Adjustment rejected | Ensure you selected a valid Reason Code |
| IoT events not appearing | Check sensor connectivity — contact IT Department |
| SKU not found in receiving | Add the product in Stock Hub first, then retry GRN |

---

## Best Practices

- ✅ Always match a GRN to a PO — never receive stock without a matching purchase order.
- ✅ Perform physical stock counts at least quarterly and reconcile using bulk adjustments.
- ✅ Set reorder points for all critical SKUs to prevent stockouts.
- ✅ Confirm transfer receipts within 24 hours of expected arrival.
- ✅ Use the IoT Feed daily to catch temperature or weight anomalies early.

---

*Return to [Master Index](./README.md)*
