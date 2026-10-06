export interface IdempotencyRecord {
  status: "IN_PROGRESS" | "COMPLETED";
  response?: {
    success: boolean;
    orderIds: string[];
    primaryOrderId: string;
  };
  timestamp: number;
}

// In-memory idempotency fallback cache for tests & zero-redis environments
export const inMemoryIdempotencyCache = new Map<string, IdempotencyRecord>();
