import { env } from "cloudflare:workers";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { prescriptions } from "@/db/schema";
import { cleanupExpiredPrescriptions } from "@/lib/prescription-retention";
import { mutationOriginAllowed, readFormDataBody, RequestBodyError } from "@/lib/validation";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PENDING_UPLOADS = 3;
const MAX_RETAINED_BYTES = 20 * 1024 * 1024;
const MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function signatureMatches(bytes: Uint8Array, type: string) {
  if (type === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  return false;
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem da solicitação não permitida." }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Autenticação necessária." }, { status: 401 });

  let objectKey: string | null = null;
  try {
    const form = await readFormDataBody(request, MAX_FILE_BYTES + 64_000);
    const file = form.get("prescription");
    if (form.get("consent") !== "true") return Response.json({ error: "Confirme a autorização de tratamento dos dados." }, { status: 400 });
    if (!(file instanceof File) || file.size < 10 || file.size > MAX_FILE_BYTES || !MIME_TYPES.has(file.type)) return Response.json({ error: "Envie um PDF, JPG ou PNG válido de até 5 MB." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!signatureMatches(bytes, file.type)) return Response.json({ error: "O conteúdo do arquivo não corresponde ao formato informado." }, { status: 400 });

    const runtimeEnv = env as unknown as { BUCKET?: R2Bucket };
    if (!runtimeEnv.BUCKET) return Response.json({ error: "O armazenamento protegido está indisponível." }, { status: 503 });
    await cleanupExpiredPrescriptions().catch(() => undefined);
    const db = getDb();
    const email = user.email.toLowerCase();
    const now = new Date().toISOString();
    const [pending] = await db.select({ total: count(prescriptions.id) }).from(prescriptions).where(and(eq(prescriptions.customerEmail, email), eq(prescriptions.status, "pending_review"), gt(prescriptions.retainUntil, now)));
    const [retained] = await db.select({ bytes: sql<number>`coalesce(sum(${prescriptions.sizeBytes}), 0)` }).from(prescriptions).where(and(eq(prescriptions.customerEmail, email), gt(prescriptions.retainUntil, now)));
    if (pending.total >= MAX_PENDING_UPLOADS || Number(retained.bytes) + file.size > MAX_RETAINED_BYTES) {
      return Response.json({ error: "Você atingiu o limite de receitas pendentes ou armazenadas. Aguarde a análise antes de enviar outra." }, { status: 429 });
    }
    const id = `REC-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const month = new Date().toISOString().slice(0, 7);
    const retainUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    objectKey = `prescriptions/${month}/${crypto.randomUUID()}`;
    await runtimeEnv.BUCKET.put(objectKey, bytes, { httpMetadata: { contentType: file.type, cacheControl: "private, no-store" } });
    await db.insert(prescriptions).values({ id, customerEmail: email, objectKey, originalName: file.name.replace(/[\r\n\\/]/g, "_").slice(0, 160) || "receita", contentType: file.type, sizeBytes: file.size, retainUntil });
    return Response.json({ id, status: "pending_review" }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (objectKey) {
      try { const runtimeEnv = env as unknown as { BUCKET?: R2Bucket }; await runtimeEnv.BUCKET?.delete(objectKey); } catch { /* best-effort cleanup */ }
    }
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível armazenar a receita com segurança." }, { status: 500 });
  }
}
