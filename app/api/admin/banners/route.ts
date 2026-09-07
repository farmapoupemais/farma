import { getDb } from "@/db";
import { auditLogs, banners } from "@/db/schema";
import { authorize } from "@/lib/access";
import { auditEntry } from "@/lib/audit";
import { cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, safeInternalPath } from "@/lib/validation";

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("banner:write"); if (!auth.ok) return auth.response;
  try {
    const body = await readJsonBody<Record<string, unknown>>(request, 12_000);
    const title = cleanText(body.title, 100), subtitle = cleanText(body.subtitle, 180), ctaLabel = cleanText(body.ctaLabel, 40), ctaHref = safeInternalPath(body.ctaHref, "/catalogo");
    if (!title || !subtitle || !ctaLabel) return Response.json({ error: "Preencha os campos do banner." }, { status: 400 });
    const id = `banner_${crypto.randomUUID()}`;
    const db = getDb();
    const [created] = await db.batch([
      db.insert(banners).values({ id, title, subtitle, ctaLabel, ctaHref, tone: "sage" }).returning({ id: banners.id }),
      db.insert(auditLogs).values(auditEntry(auth.actor.email, "banner.create", "banner", id)),
    ]);
    return Response.json({ banner: created[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível salvar o banner." }, { status: 500 });
  }
}
