# Zenvix Business Flow Suite — User Manuals

> **Platform:** Zenvix Business Flow Suite v2  
> **Version:** 1.0  
> **Audience:** End-users, Department Heads, Administrators

---

## 📚 Manual Index

| # | Manual | Department | URL Path |
|---|--------|-----------|---------|
| 0 | [Getting Started Guide](./00_GETTING_STARTED.md) | Platform-wide | `/core/dashboard` |
| 1 | [Finance Command](./01_FINANCE.md) | Finance & Treasury | `/core/finance/*` |
| 2 | [H.R. Command](./02_HR.md) | Human Resources | `/core/hr/*` |
| 3 | [Sales Command](./03_SALES.md) | Sales & Revenue | `/core/sales/*` |
| 4 | [Inventory Command](./04_INVENTORY.md) | Inventory & Stock | `/core/inventory/*` |
| 5 | [Marketing Command](./05_MARKETING.md) | Marketing & Growth | `/core/marketing/*` |
| 6 | [Procurement Command](./06_PROCUREMENT.md) | Procurement & Sourcing | `/core/procurement/*` |
| 7 | [I.T. Command](./07_IT.md) | Information Technology | `/core/it/*` |
| 8 | [Admin Workspace](./08_ADMIN.md) | Administration | `/core/admin/*` |

---

## 🔑 Role Access Matrix

| Role | Finance | HR | Sales | Inventory | Marketing | Procurement | IT | Admin |
|------|---------|----|-------|-----------|-----------|-------------|----|-------|
| **Owner** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Company Admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Finance Manager** | ✅ Full | 👁 View | 👁 View | 👁 View | ❌ | 👁 View | ❌ | ✅ |
| **HR Manager** | ❌ | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Sales Manager** | ❌ | ❌ | ✅ Full | 👁 View | 👁 View | ❌ | ❌ | ✅ |
| **Procurement Officer** | ❌ | ❌ | ❌ | 👁 View | ❌ | ✅ Full | ❌ | ✅ |
| **IT Admin** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Full | ✅ |
| **Staff** | ❌ | 👁 Self | 👁 Own | ❌ | ❌ | ❌ | ❌ | ✅ Submit |

> **Legend:** ✅ Full Access | 👁 View / Limited | ❌ No Access

---

## 🧭 Quick Navigation

- **New to Zenvix?** → Start with [Getting Started](./00_GETTING_STARTED.md)
- **Finance team?** → [Finance Command Manual](./01_FINANCE.md)
- **HR team?** → [H.R. Command Manual](./02_HR.md)
- **Sales team?** → [Sales Command Manual](./03_SALES.md)
- **Warehouse/Stock team?** → [Inventory Manual](./04_INVENTORY.md)
- **Marketing team?** → [Marketing Command Manual](./05_MARKETING.md)
- **Purchasing/Sourcing team?** → [Procurement Manual](./06_PROCUREMENT.md)
- **IT team?** → [I.T. Command Manual](./07_IT.md)
- **Need to submit a request?** → [Admin Workspace Manual](./08_ADMIN.md)

---

## 📘 Glossary of Key Terms

| Term | Definition |
|------|-----------|
| **FlowGate** | The cross-department approval routing system |
| **WorkQueue** | Quick-action button strip at the top of each record |
| **Tenant** | Your company's isolated workspace within Zenvix |
| **Session** | Your active login context (user + company + role) |
| **Audit Log** | Immutable record of all actions taken in the system |
| **Period** | A fiscal accounting period (month/quarter) |
| **Snapshot** | A locked financial ledger state at a point in time |
| **PR** | Purchase Requisition |
| **PO** | Purchase Order |
| **GRN** | Goods Receipt Note |
| **ATS** | Applicant Tracking System (in Talent Flow) |
| **SKU** | Stock Keeping Unit — a unique inventory item code |
| **IoT** | Internet of Things — sensor-driven inventory automation |

---

*Zenvix Business Flow Suite is designed to be consistent, auditable, and safe under enterprise compliance rules.*
