export const LEDGER_WORKER_CONSTANTS = {
  BATCH_SIZE: 50,
  POLL_INTERVAL_MS: 1000,
  BACKPRESSURE_THRESHOLD: 100000, // E.g., slow down if pending queue hits 100k
  BACKPRESSURE_POLL_INTERVAL_MS: 5000, // Slowed down polling
  MAX_RETRY_ATTEMPTS: 4,
};

export const getBackoffSeconds = (retryCount: number): number => {
  // Exponential backoff strategy: 1m, 5m, 15m, 1h
  const delays = [60, 300, 900, 3600];
  if (retryCount >= delays.length) {
    return delays[delays.length - 1]; // Cap at 1h
  }
  return delays[retryCount];
};
