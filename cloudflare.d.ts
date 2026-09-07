declare module "cloudflare:workers" {
  export const env: {
    DB?: any;
    BUCKET?: any;
    PHARMACY_OWNER_EMAIL?: string;
    [key: string]: any;
  };
}
