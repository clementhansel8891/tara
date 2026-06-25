import { Injectable, Logger } from '@nestjs/common';

/**
 * Onboarding External Integrations
 *
 * The Onboarding_Agent's 7-step workflow depends on several external systems
 * (email provider, calendar, identity/account provisioning, document storage
 * and an e-signature provider). Those systems are environment-specific and are
 * frequently not configured in development / CI, so the workflow talks to them
 * exclusively through the {@link OnboardingIntegrations} interface below.
 *
 * This keeps the agent:
 * - testable: tests inject a mock implementation and assert the workflow calls
 *   each integration in the right order with the right data;
 * - pluggable: a real implementation (SMTP/Google Workspace, Google/Microsoft
 *   Calendar, an IdP, DocuSign, etc.) can be bound to {@link ONBOARDING_INTEGRATIONS}
 *   later without touching the agent;
 * - safe: the default {@link StubOnboardingIntegrations} never performs real
 *   network calls that would fail at runtime in an unconfigured environment.
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */

/**
 * Minimal employee context handed to each integration. Kept deliberately small
 * so integrations only receive what they need to act.
 */
export interface OnboardingEmployeeContext {
  id: string;
  full_name: string;
  email: string;
  employee_code?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  supervisor_id?: string | null;
}

/** Result of provisioning the new employee's email account (step 1). */
export interface EmailAccountResult {
  email: string;
  account_id?: string;
  temporary_password_set?: boolean;
}

/** Result of scheduling the orientation session (step 3). */
export interface OrientationScheduleResult {
  event_id: string;
  scheduled_at: Date;
  location?: string;
}

/** Result of provisioning tools / system access (step 5). */
export interface SystemAccessResult {
  account_id: string;
  provisioned_tools: string[];
}

/** Result of dispatching a document bundle (welcome kit / SOP). */
export interface DocumentDeliveryResult {
  delivery_id: string;
  documents: string[];
}

/** Result of sending the employment contract for signature (step 7). */
export interface SignatureRequestResult {
  envelope_id: string;
  signing_url?: string;
  status: string;
}

/**
 * The contract every onboarding integration backend must satisfy. Each method
 * maps to one externally-dependent action in the 7-step workflow.
 */
export interface OnboardingIntegrations {
  /** Step 1: create a corporate email account for the new employee. */
  createEmailAccount(
    employee: OnboardingEmployeeContext,
  ): Promise<EmailAccountResult>;

  /** Step 2: deliver the welcome kit (email + onboarding documents). */
  sendWelcomeKit(
    employee: OnboardingEmployeeContext,
  ): Promise<DocumentDeliveryResult>;

  /** Step 3: schedule the orientation session on the company calendar. */
  scheduleOrientation(
    employee: OnboardingEmployeeContext,
  ): Promise<OrientationScheduleResult>;

  /** Step 5: provision tools and system access (identity / SSO accounts). */
  provisionSystemAccess(
    employee: OnboardingEmployeeContext,
  ): Promise<SystemAccessResult>;

  /** Step 6: deliver Standard Operating Procedure (SOP) documentation. */
  deliverSopDocumentation(
    employee: OnboardingEmployeeContext,
  ): Promise<DocumentDeliveryResult>;

  /** Step 7: send the employment contract to the e-signature provider. */
  sendContractForSignature(
    employee: OnboardingEmployeeContext,
  ): Promise<SignatureRequestResult>;
}

/**
 * Injection token for {@link OnboardingIntegrations}. Bind a real provider to
 * this token in a module to plug live integrations in; otherwise the default
 * {@link StubOnboardingIntegrations} is used.
 */
export const ONBOARDING_INTEGRATIONS = Symbol('ONBOARDING_INTEGRATIONS');

/**
 * Default, side-effect-free implementation of {@link OnboardingIntegrations}.
 *
 * It simulates each external action with deterministic, logged results and
 * performs NO real network I/O, so the onboarding workflow runs end-to-end in
 * any environment (dev, CI, demo) without external configuration. Replace the
 * binding on {@link ONBOARDING_INTEGRATIONS} with a real implementation to wire
 * up actual providers.
 */
@Injectable()
export class StubOnboardingIntegrations implements OnboardingIntegrations {
  private readonly logger = new Logger(StubOnboardingIntegrations.name);

  async createEmailAccount(
    employee: OnboardingEmployeeContext,
  ): Promise<EmailAccountResult> {
    this.logger.log(
      `[STUB] Creating email account for ${employee.full_name} (${employee.email})`,
    );
    return {
      email: employee.email,
      account_id: `stub-email-${employee.id}`,
      temporary_password_set: true,
    };
  }

  async sendWelcomeKit(
    employee: OnboardingEmployeeContext,
  ): Promise<DocumentDeliveryResult> {
    this.logger.log(`[STUB] Sending welcome kit to ${employee.email}`);
    return {
      delivery_id: `stub-welcome-${employee.id}`,
      documents: ['welcome_letter.pdf', 'employee_handbook.pdf', 'benefits_guide.pdf'],
    };
  }

  async scheduleOrientation(
    employee: OnboardingEmployeeContext,
  ): Promise<OrientationScheduleResult> {
    // Default to an orientation the next day at 09:00 (placeholder logic).
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(9, 0, 0, 0);
    this.logger.log(
      `[STUB] Scheduling orientation for ${employee.full_name} at ${scheduledAt.toISOString()}`,
    );
    return {
      event_id: `stub-orientation-${employee.id}`,
      scheduled_at: scheduledAt,
      location: 'HR Meeting Room',
    };
  }

  async provisionSystemAccess(
    employee: OnboardingEmployeeContext,
  ): Promise<SystemAccessResult> {
    this.logger.log(`[STUB] Provisioning system access for ${employee.full_name}`);
    return {
      account_id: `stub-access-${employee.id}`,
      provisioned_tools: ['email', 'hris', 'chat', 'vpn'],
    };
  }

  async deliverSopDocumentation(
    employee: OnboardingEmployeeContext,
  ): Promise<DocumentDeliveryResult> {
    this.logger.log(`[STUB] Delivering SOP documentation to ${employee.email}`);
    return {
      delivery_id: `stub-sop-${employee.id}`,
      documents: ['company_sop.pdf', 'department_sop.pdf'],
    };
  }

  async sendContractForSignature(
    employee: OnboardingEmployeeContext,
  ): Promise<SignatureRequestResult> {
    this.logger.log(
      `[STUB] Sending employment contract for signature to ${employee.email}`,
    );
    return {
      envelope_id: `stub-contract-${employee.id}`,
      signing_url: `https://e-sign.local/stub/${employee.id}`,
      status: 'sent',
    };
  }
}
