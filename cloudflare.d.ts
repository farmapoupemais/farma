declare module "cloudflare:workers" {
  export const env: {
    DB?: unknown;
    BUCKET?: unknown;
    PHARMACY_OWNER_EMAIL?: string;
    [key: string]: unknown;
  };
}
