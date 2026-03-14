# HR Integration Architecture

This document defines the infrastructure extensions and integration patterns for the Zenvix HR module within the global ERP ecosystem.

## 1. Chat Entity Quoting System

Chat is a user-initiated conversation layer designed for discussing business objects. It is NOT an automated event feed.

### Data Structure

The `ChatMessage` model supports structured entity references:

- **messageType**: `TEXT` | `FILE` | `QUOTE`
- **refModule**: e.g., `HR`, `Finance`, `Retail`
- **refEntityType**: e.g., `Employee`, `ExpenseClaim`, `Order`
- **refEntityId**: UUID of the target entity
- **refLabel**: Human-readable label (e.g., "Loan Request #LR-102")

### Behavior

- When `messageType` is `QUOTE`, the UI renders a clickable reference card.
- Clicking the card invokes a deep-link to the entity page.

### Security

- **RBAC Enforcement**: The UI and API must verify permissions before opening the entity.
- If unauthorized, the system MUST return "Access Denied" and prevent navigation.

---

## 2. Notification Preference Model

Users can granularly control their notification subscriptions.

### UserNotificationPreference Model

- **tenantId**: Multi-tenant isolation (REQUIRED).
- **userId**: Target user.
- **module**: Origin module (e.g., `HR`).
- **eventType**: Specific event (e.g., `employee.created`) or `ALL`.
- **channel**: `IN_APP`, `EMAIL`, `PUSH` (via `NotificationChannel` enum).
- **enabled**: Boolean flag.

### Rules

- `NotificationService` must query preferences before dispatching alerts.
- Default preferences are generated for new users; existing users were backfilled via `backend/scripts/backfill-notification-preferences.ts`.

---

## 3. Audit Immutability Policy

Audit logs are the source of truth for all system mutations and are strictly immutable.

### Policy

- **INSERT ONLY**: Records cannot be updated or deleted.
- **Traceability**: Every record links an actor to an entity mutation.
- **Integrity**: Optional `hashChain` ensures the sequence of logs has not been tampered with.

### Schema Fields

- `id`, `tenantId`, `userId`, `module`, `action`, `entityType`, `entityId`, `changes`, `metadata`, `sourceModule`, `hashChain`, `createdAt`, `ipAddress`, `severity`, `userAgent`.

---

## 4. Global Entity Reference Standard

Across all modules, entities are referenced using a consistent triple:

1. **refModule**: Canonical module name (e.g., `HR`).
2. **refEntityType**: Model name (e.g., `Employee`).
3. **refEntityId**: UUID.

This standard is enforced in `ChatMessage`, `Notification`, and `AuditLog` to ensure seamless cross-module traceability.

---

## 5. Database Schema (Prisma)

### UserNotificationPreference

```prisma
model UserNotificationPreference {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  userId    String   @map("user_id")
  module    String
  eventType String   @map("event_type")
  channel   NotificationChannel
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  company   Company  @relation(fields: [tenantId], references: [id])
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([tenantId, userId])
  @@index([tenantId, module, eventType])
  @@unique([tenantId, userId, module, eventType, channel])
  @@map("user_notification_preferences")
}

enum NotificationChannel {
  IN_APP
  EMAIL
  PUSH
}
```

### ChatMessage Extensions

```prisma
model ChatMessage {
  // ...
  type         ChatMessageType @default(TEXT)
  refModule    String?        @map("ref_module")
  refEntityType String?       @map("ref_entity_type")
  refEntityId  String?        @map("ref_entity_id")
  refLabel     String?        @map("ref_label")
  // ...
}

enum ChatMessageType {
  TEXT
  FILE
  QUOTE
}
```

### AuditLog Extensions

```prisma
model AuditLog {
  // ...
  sourceModule String? @map("source_module")
  hashChain    String? @map("hash_chain")
  // ...
}
```

---

## 6. Migration & Backfill

### applied migration: `20260313143410_hr_integration_infrastructure`

- Created `UserNotificationPreference` table.
- Extended `ChatMessage` and `AuditLog` tables.
- Added required enums and indexes.

### Backfill Execution

- **Script**: `backend/scripts/backfill-notification-preferences.ts`
- **Result**: Initialized default preferences (IN_APP/EMAIL: enabled, PUSH: disabled) for all existing user-company pairs.
- **Modules Coverage**: HR, FINANCE, IT, PROCUREMENT, SALES, RETAIL, INVENTORY, MARKETING, COMMS, PROJECT.
