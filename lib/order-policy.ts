import type { Role } from "./permissions";

export type RequestedOrderItem = { id: string; quantity: number };
export type ApprovedPrescriptionItem = { productId: string; maxQuantity: number };

export function aggregateOrderItems(items: RequestedOrderItem[], maxPerProduct = 10): RequestedOrderItem[] | null {
  const grouped = new Map<string, number>();
  for (const item of items) {
    const aggregate = (grouped.get(item.id) ?? 0) + item.quantity;
    if (aggregate > maxPerProduct) return null;
    grouped.set(item.id, aggregate);
  }
  return [...grouped].map(([id, quantity]) => ({ id, quantity }));
}

export function prescriptionCovers(lines: { productId: string; quantity: number }[], approvedItems: ApprovedPrescriptionItem[]) {
  const allowed = new Map(approvedItems.map((item) => [item.productId, item.maxQuantity]));
  return lines.every((line) => (allowed.get(line.productId) ?? 0) >= line.quantity);
}

export const orderTransitions: Record<string, readonly string[]> = {
  awaiting_payment: ["cancelled"],
  paid: ["separating", "cancelled"],
  separating: ["ready_for_pickup", "out_for_delivery", "cancelled"],
  ready_for_pickup: ["delivered", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function isKnownOrderStatus(value: unknown): value is string {
  return typeof value === "string" && Object.hasOwn(orderTransitions, value);
}

export function canTransitionOrder(role: Role, current: string, next: string) {
  if (!isKnownOrderStatus(current) || !isKnownOrderStatus(next) || next === "paid") return false;
  if (role === "support" && next !== "cancelled") return false;
  return orderTransitions[current].includes(next);
}
