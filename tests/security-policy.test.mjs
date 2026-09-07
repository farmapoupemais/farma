import assert from "node:assert/strict";
import test from "node:test";
import { can } from "../lib/permissions.ts";
import { aggregateOrderItems, canTransitionOrder, prescriptionCovers } from "../lib/order-policy.ts";
import { readFormDataBody, readJsonBody, RequestBodyError } from "../lib/validation.ts";

test("somente farmacêuticos recebem permissão clínica", () => {
  assert.equal(can("pharmacist", "prescription:review"), true);
  assert.equal(can("owner", "prescription:review"), false);
  assert.equal(can("manager", "prescription:review"), false);
});

test("linhas duplicadas são agregadas e respeitam o limite total", () => {
  assert.deepEqual(aggregateOrderItems([{ id: "p1", quantity: 4 }, { id: "p1", quantity: 6 }]), [{ id: "p1", quantity: 10 }]);
  assert.equal(aggregateOrderItems([{ id: "p1", quantity: 6 }, { id: "p1", quantity: 5 }]), null);
});

test("receita cobre somente produtos e quantidades aprovados", () => {
  const approved = [{ productId: "rx-a", maxQuantity: 2 }];
  assert.equal(prescriptionCovers([{ productId: "rx-a", quantity: 2 }], approved), true);
  assert.equal(prescriptionCovers([{ productId: "rx-a", quantity: 3 }], approved), false);
  assert.equal(prescriptionCovers([{ productId: "rx-b", quantity: 1 }], approved), false);
});

test("máquina de estados bloqueia pagamento manual e saltos", () => {
  assert.equal(canTransitionOrder("manager", "awaiting_payment", "paid"), false);
  assert.equal(canTransitionOrder("manager", "awaiting_payment", "delivered"), false);
  assert.equal(canTransitionOrder("manager", "paid", "separating"), true);
  assert.equal(canTransitionOrder("support", "paid", "separating"), false);
  assert.equal(canTransitionOrder("support", "paid", "cancelled"), true);
});

test("JSON sem Content-Length é limitado pelos bytes reais", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"a":"'));
      controller.enqueue(new TextEncoder().encode("1234567890"));
      controller.enqueue(new TextEncoder().encode('"}'));
      controller.close();
    },
  });
  const request = new Request("https://farmacia.test/api", { method: "POST", body: stream, duplex: "half", headers: { "content-type": "application/json" } });
  await assert.rejects(() => readJsonBody(request, 8), (error) => error instanceof RequestBodyError && error.status === 413);
});

test("JSON e multipart legítimos continuam aceitos", async () => {
  const json = new Request("https://farmacia.test/api", { method: "POST", body: JSON.stringify({ ok: true }), headers: { "content-type": "application/json" } });
  assert.deepEqual(await readJsonBody(json, 128), { ok: true });

  const form = new FormData();
  form.set("consent", "true");
  form.set("prescription", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "receita.pdf", { type: "application/pdf" }));
  const multipart = new Request("https://farmacia.test/api", { method: "POST", body: form });
  const parsed = await readFormDataBody(multipart, 2_048);
  assert.equal(parsed.get("consent"), "true");
  assert.equal(parsed.get("prescription") instanceof File, true);
});
