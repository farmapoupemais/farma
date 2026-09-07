import { getDb } from "@/db";
import { auditLogs, discounts } from "@/db/schema";
import { authorize } from "@/lib/access";
import { auditEntry } from "@/lib/audit";
import { cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, toSafeInteger } from "@/lib/validation";

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("discount:write"); if (!auth.ok) return auth.response;
  try {
    const body = await readJsonBody<Record<string, unknown>>(request, 12_000);
    const name = cleanText(body.name, 80), code = cleanText(body.code, 24).toUpperCase(), kind = body.kind === "fixed" ? "fixed" : body.kind === "percent" ? "percent" : "";
    const amount = toSafeInteger(body.amount, 1, kind === "percent" ? 100 : 1_000_000), minSubtotalCents = toSafeInteger(body.minSubtotalCents ?? 0, 0, 10_000_000);
    if (!name || !/^[A-Z0-9_-]{3,24}$/.test(code) || !kind || amount === null || minSubtotalCents === null) return Response.json({ error: "Revise os dados do desconto." }, { status: 400 });
    const id = `discount_${crypto.randomUUID()}`;
    const db = getDb();
    const [created] = await db.batch([
      db.insert(discounts).values({ id, name, code, kind, amount, minSubtotalCents }).returning({ id: discounts.id, code: discounts.code }),
      db.insert(auditLogs).values(auditEntry(auth.actor.email, "discount.create", "discount", id, { code, kind })),
    ]);
    return Response.json({ discount: created[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    const conflict = error instanceof Error && /unique|constraint/i.test(error.message);
    return Response.json({ error: conflict ? "Este código já existe." : "Não foi possível salvar o desconto." }, { status: conflict ? 409 : 500 });
  }
}
