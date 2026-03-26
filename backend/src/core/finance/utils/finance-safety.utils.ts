export enum FinanceExecutionMode {
  DATABASE = 'database',
  MOCK = 'mock',
}

/**
 * Validates that the Finance module is running in a safe execution mode
 * for the current environment. 
 * 
 * Rules:
 * - PRODUCTION/STAGING: MUST use DATABASE mode.
 * - DEVELOPMENT/TEST: May use MOCK or DATABASE.
 * 
 * Throws a CRITICAL error if safety requirements are violated to prevent
 * accidental data loss or silent mock usage in production.
 */
export function assertFinanceExecutionSafety() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mode = process.env.FINANCE_EXECUTION_MODE || (process.env.USE_MOCK === 'true' ? 'mock' : 'database');
  
  const isProd = nodeEnv === 'production' || nodeEnv === 'staging';
  
  console.log(`[FINANCE SAFETY] Validating Environment: ${nodeEnv}`);
  console.log(`[FINANCE SAFETY] Current Execution Mode: ${mode.toUpperCase()}`);

  if (isProd) {
    if (mode === FinanceExecutionMode.MOCK) {
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('!! CRITICAL SECURITY FAILURE: FINANCE MOCK MODE IN PROD !!');
      console.error('!! DEPLOYMENT BLOCKED FOR FINANCIAL SAFETY             !!');
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      throw new Error('CRITICAL: Mock repositories are not allowed in production or staging environments.');
    }
    
    if (process.env.USE_MOCK === 'true') {
      throw new Error('CRITICAL: USE_MOCK=true is forbidden in production/staging. Use FINANCE_EXECUTION_MODE=database.');
    }
  }

  // Double check if USE_MOCK is still lurking
  if (process.env.USE_MOCK === 'true' && mode === FinanceExecutionMode.DATABASE) {
    console.warn('[FINANCE SAFETY] WARNING: Conflicting flags found (FINANCE_EXECUTION_MODE=database AND USE_MOCK=true). Respecting FINANCE_EXECUTION_MODE=database.');
  }
}

export function getFinanceExecutionMode(): FinanceExecutionMode {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    return FinanceExecutionMode.DATABASE;
  }
  return (process.env.FINANCE_EXECUTION_MODE as FinanceExecutionMode) || (process.env.USE_MOCK === 'true' ? FinanceExecutionMode.MOCK : FinanceExecutionMode.DATABASE);
}
