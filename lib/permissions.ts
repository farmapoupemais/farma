export const roles = [
  "owner",
  "manager",
  "pharmacist",
  "catalog",
  "support",
  "customer",
] as const;

export type Role = (typeof roles)[number];
export type Permission =
  | "catalog:write"
  | "banner:write"
  | "discount:write"
  | "order:read"
  | "order:update"
  | "prescription:review"
  | "catalog:regulatory"
  | "user:manage"
  | "audit:read";

const grants: Record<Role, Permission[]> = {
  owner: ["catalog:write", "banner:write", "discount:write", "order:read", "order:update", "user:manage", "audit:read"],
  manager: ["catalog:write", "banner:write", "discount:write", "order:read", "order:update", "audit:read"],
  pharmacist: ["order:read", "prescription:review", "catalog:regulatory"],
  catalog: ["catalog:write", "banner:write", "discount:write"],
  support: ["order:read", "order:update"],
  customer: [],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function can(role: Role, permission: Permission) {
  return grants[role].includes(permission);
}
