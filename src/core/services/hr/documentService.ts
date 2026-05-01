import { listDocuments, createDocument } from "@/core/documents/documentService";
import type { DocumentRecord } from "@/core/documents/documentTypes";
import type { SessionContext } from "@/core/security/session";
import { Roles } from "@/core/security/roles";
import { audit } from "@/core/logging/audit";

const ensureTenantAccess = (tenantId: string, actor: SessionContext) => {
  if (actor.role === Roles.SUPERADMIN) return;
  if (actor.tenant_id !== tenantId) throw new Error("Tenant access denied");
};

export const documentService = {
  listVaultItems(tenantId: string, actor: SessionContext): DocumentRecord[] {
    ensureTenantAccess(tenantId, actor);
    return listDocuments(tenantId);
  },

  createVaultItem(tenantId: string, actor: SessionContext, input: { title: string; type: DocumentRecord["type"] }) {
    ensureTenantAccess(tenantId, actor);
    const record = createDocument({ tenantId, title: input.title, type: input.type, ownerId: actor.user_id });
    audit.log({
      tenantId,
      actorId: actor.user_id,
      action: "document.create",
      entityType: "document",
      entityId: record.id,
    });
    return record;
  },

  exportVault(tenantId: string, actor: SessionContext) {
    ensureTenantAccess(tenantId, actor);
    const items = listDocuments(tenantId);
    audit.log({
      tenantId,
      actorId: actor.user_id,
      action: "document.export",
      entityType: "document",
      entityId: "export",
      after: { count: items.length },
    });
    return items;
  },

  attachDocument(
    tenantId: string,
    actor: SessionContext,
    input: { title: string; type: DocumentRecord["type"]; metadata?: Record<string, string> },
  ) {
    ensureTenantAccess(tenantId, actor);
    const record = createDocument({
      tenantId,
      title: input.title,
      type: input.type,
      ownerId: actor.user_id,
      metadata: input.metadata,
    });
    audit.log({
      tenantId,
      actorId: actor.user_id,
      action: "document.attach",
      entityType: "document",
      entityId: record.id,
    });
    return record;
  },
};
