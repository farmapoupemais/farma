declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    PHARMACY_OWNER_EMAIL?: string;
    [key: string]: unknown;
  };
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface D1Database {
  prepare(query: string): unknown;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: unknown[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
}

interface R2Bucket {
  delete(key: string | string[]): Promise<void>;
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown, options?: Record<string, unknown>): Promise<unknown>;
  head(key: string): Promise<unknown>;
  list(options?: Record<string, unknown>): Promise<unknown>;
}
