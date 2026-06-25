import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../persistence/prisma.service';
import { EventBusService, TaraEvent } from '../hr/services/event-bus.service';

/**
 * SOP Agent — Document Lifecycle Tracker
 *
 * Responsibilities:
 * 1. Emit events to Event Bus on every SOP document change (create, update, delete, bulk upload)
 * 2. Log all SOP activities in audit trail
 * 3. Provide SOP context to Hermes AI agents for knowledge-aware responses
 * 4. Listen for Hermes queries about available SOPs and respond with current catalog
 *
 * Event Types Emitted:
 * - sop.document.uploaded     — single document uploaded
 * - sop.document.bulk_uploaded — multiple documents uploaded at once
 * - sop.document.updated      — metadata edited (title, description, category)
 * - sop.document.deleted      — document removed
 * - sop.document.viewed       — document accessed/downloaded
 *
 * Event Types Listened:
 * - hermes.query.sop_catalog  — Hermes requests SOP list for context
 */
@Injectable()
export class SopAgentService {
  private readonly logger = new Logger(SopAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {}

  // =========================================================================
  // Event Emission — called by SopController actions
  // =========================================================================

  /**
   * Emit event when a single SOP document is uploaded.
   */
  async emitDocumentUploaded(doc: {
    id: string;
    title: string;
    category?: string;
    file_name: string;
    file_size: number;
    uploaded_by?: string;
  }): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: 'sop.document.uploaded',
        event_version: '1.0',
        actor: {
          id: doc.uploaded_by || 'system',
          type: doc.uploaded_by ? 'employee' : 'system',
        },
        entity: {
          id: doc.id,
          type: 'sop_document',
        },
        payload: {
          title: doc.title,
          category: doc.category,
          file_name: doc.file_name,
          file_size: doc.file_size,
          action: 'uploaded',
        },
      });
      this.logger.log(`[SOP Agent] Event emitted: sop.document.uploaded — "${doc.title}"`);
    } catch (error) {
      this.logger.error(`[SOP Agent] Failed to emit upload event: ${error.message}`);
    }
  }

  /**
   * Emit event when multiple SOP documents are uploaded at once.
   */
  async emitBulkUploaded(docs: Array<{
    id: string;
    title: string;
    category?: string;
    file_name: string;
    file_size: number;
  }>, uploadedBy?: string): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: 'sop.document.bulk_uploaded',
        event_version: '1.0',
        actor: {
          id: uploadedBy || 'system',
          type: uploadedBy ? 'employee' : 'system',
        },
        entity: {
          id: docs[0]?.id || 'bulk',
          type: 'sop_document',
        },
        payload: {
          count: docs.length,
          documents: docs.map(d => ({ id: d.id, title: d.title, category: d.category })),
          action: 'bulk_uploaded',
        },
      });
      this.logger.log(`[SOP Agent] Event emitted: sop.document.bulk_uploaded — ${docs.length} documents`);
    } catch (error) {
      this.logger.error(`[SOP Agent] Failed to emit bulk upload event: ${error.message}`);
    }
  }

  /**
   * Emit event when SOP metadata is updated.
   */
  async emitDocumentUpdated(doc: {
    id: string;
    title: string;
    category?: string;
  }, changes: Record<string, any>, updatedBy?: string): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: 'sop.document.updated',
        event_version: '1.0',
        actor: {
          id: updatedBy || 'system',
          type: updatedBy ? 'employee' : 'system',
        },
        entity: {
          id: doc.id,
          type: 'sop_document',
        },
        payload: {
          title: doc.title,
          category: doc.category,
          changes,
          action: 'updated',
        },
      });
      this.logger.log(`[SOP Agent] Event emitted: sop.document.updated — "${doc.title}"`);
    } catch (error) {
      this.logger.error(`[SOP Agent] Failed to emit update event: ${error.message}`);
    }
  }

  /**
   * Emit event when a SOP document is deleted.
   */
  async emitDocumentDeleted(doc: {
    id: string;
    title: string;
    category?: string;
    file_name: string;
  }, deletedBy?: string): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: 'sop.document.deleted',
        event_version: '1.0',
        actor: {
          id: deletedBy || 'system',
          type: deletedBy ? 'employee' : 'system',
        },
        entity: {
          id: doc.id,
          type: 'sop_document',
        },
        payload: {
          title: doc.title,
          category: doc.category,
          file_name: doc.file_name,
          action: 'deleted',
        },
      });
      this.logger.log(`[SOP Agent] Event emitted: sop.document.deleted — "${doc.title}"`);
    } catch (error) {
      this.logger.error(`[SOP Agent] Failed to emit delete event: ${error.message}`);
    }
  }

  /**
   * Emit event when a SOP document is viewed/downloaded.
   */
  async emitDocumentViewed(doc: {
    id: string;
    title: string;
    category?: string;
  }, viewedBy?: string): Promise<void> {
    try {
      await this.eventBusService.emit({
        event_type: 'sop.document.viewed',
        event_version: '1.0',
        actor: {
          id: viewedBy || 'system',
          type: viewedBy ? 'employee' : 'system',
        },
        entity: {
          id: doc.id,
          type: 'sop_document',
        },
        payload: {
          title: doc.title,
          category: doc.category,
          action: 'viewed',
        },
      });
    } catch (error) {
      // View events are lower priority — silently log
      this.logger.debug(`[SOP Agent] Failed to emit view event: ${error.message}`);
    }
  }

  // =========================================================================
  // Hermes Context Provider — provides SOP catalog for AI knowledge
  // =========================================================================

  /**
   * Respond to Hermes queries for SOP catalog.
   * Hermes can use this to give employees contextual answers about company procedures.
   */
  @OnEvent('hermes.query.sop_catalog')
  async handleHermesSopCatalogQuery(event: TaraEvent | any): Promise<void> {
    try {
      const documents = await this.prisma.sopDocument.findMany({
        where: { is_active: true },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          file_name: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      });

      // Emit response event so Hermes can consume the SOP catalog
      await this.eventBusService.emit({
        event_type: 'sop.catalog.response',
        event_version: '1.0',
        actor: { id: 'sop_agent', type: 'agent' },
        entity: { id: 'sop_catalog', type: 'sop_document' },
        payload: {
          requested_by: event?.actor?.id || 'hermes',
          correlation_id: event?.event_id || null,
          total_documents: documents.length,
          categories: [...new Set(documents.map(d => d.category).filter(Boolean))],
          documents: documents.map(d => ({
            id: d.id,
            title: d.title,
            description: d.description,
            category: d.category,
            file_name: d.file_name,
            available_at: `/api/sop/${d.id}/file`,
          })),
        },
      });

      this.logger.log(`[SOP Agent] Responded to Hermes catalog query — ${documents.length} documents`);
    } catch (error) {
      this.logger.error(`[SOP Agent] Failed to handle catalog query: ${error.message}`);
    }
  }

  /**
   * Listen for general Hermes context requests that mention SOP.
   * This provides Hermes with awareness of what SOPs exist.
   */
  @OnEvent('hermes.context.requested')
  async handleHermesContextRequest(event: TaraEvent | any): Promise<void> {
    const topic = event?.payload?.topic || '';
    if (!topic.toLowerCase().includes('sop') && !topic.toLowerCase().includes('prosedur')) {
      return; // Not SOP-related, ignore
    }

    try {
      const documents = await this.prisma.sopDocument.findMany({
        where: { is_active: true },
        select: { id: true, title: true, category: true, description: true },
        orderBy: { created_at: 'desc' },
      });

      await this.eventBusService.emit({
        event_type: 'sop.context.provided',
        event_version: '1.0',
        actor: { id: 'sop_agent', type: 'agent' },
        entity: { id: 'sop_catalog', type: 'sop_document' },
        payload: {
          correlation_id: event?.event_id,
          context_type: 'sop_awareness',
          summary: `Perusahaan memiliki ${documents.length} dokumen SOP aktif.`,
          categories: [...new Set(documents.map(d => d.category).filter(Boolean))],
          documents: documents.map(d => ({
            id: d.id,
            title: d.title,
            category: d.category,
            description: d.description,
          })),
        },
      });

      this.logger.log(`[SOP Agent] Provided SOP context to Hermes — ${documents.length} docs`);
    } catch (error) {
      this.logger.error(`[SOP Agent] Failed to provide context: ${error.message}`);
    }
  }

  // =========================================================================
  // Utility — Get SOP summary for dashboard/reporting
  // =========================================================================

  /**
   * Returns a summary of SOP documents (for dashboard or agent health checks).
   */
  async getSopSummary(): Promise<{
    total_documents: number;
    categories: string[];
    last_uploaded_at: string | null;
  }> {
    const docs = await this.prisma.sopDocument.findMany({
      where: { is_active: true },
      select: { category: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });

    return {
      total_documents: docs.length,
      categories: [...new Set(docs.map(d => d.category).filter(Boolean))] as string[],
      last_uploaded_at: docs.length > 0 ? docs[0].created_at.toISOString() : null,
    };
  }
}
