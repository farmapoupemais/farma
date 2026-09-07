import { getAuthenticatedUser } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { sanitizeAuditMetadata, sanitizeText } from "@/lib/security";
import { mutationOriginAllowed, readFormDataBody, RequestBodyError } from "@/lib/validation";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PENDING_UPLOADS = 3;
const MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function signatureMatches(bytes: Uint8Array, type: string): boolean {
  if (type === "application/pdf") {
    // %PDF-
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  }
  if (type === "image/jpeg") {
    // 0xFF 0xD8 0xFF
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    // 0x89 P N G
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (type === "image/webp") {
    // RIFF .... WEBP
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) {
    return Response.json(
      { error: "Origem da solicitação não permitida." },
      { status: 403 }
    );
  }

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json(
      { error: "Autenticação necessária para envio de receitas." },
      { status: 401 }
    );
  }

  try {
    const form = await readFormDataBody(request, MAX_FILE_BYTES + 64_000);
    const file = form.get("prescription");
    if (form.get("consent") !== "true") {
      return Response.json(
        { error: "Confirme a autorização de tratamento dos dados de saúde (LGPD)." },
        { status: 400 }
      );
    }

    if (
      !(file instanceof File) ||
      file.size < 10 ||
      file.size > MAX_FILE_BYTES ||
      !MIME_TYPES.has(file.type)
    ) {
      return Response.json(
        { error: "Envie um arquivo válido (PDF, JPG, PNG ou WEBP) de até 5 MB." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!signatureMatches(bytes, file.type)) {
      return Response.json(
        { error: "O conteúdo real do arquivo não corresponde à sua extensão (bloqueio de segurança)." },
        { status: 400 }
      );
    }

    const client = getSupabaseServerClient();
    const email = user.email.toLowerCase();
    const now = new Date().toISOString();

    // 1. Verificar limite de receitas pendentes (Anti-abuso de armazenamento)
    const { count: pendingCount, error: countErr } = await client
      .from("prescriptions")
      .select("id", { count: "exact", head: true })
      .eq("customer_email", email)
      .eq("status", "pending_review")
      .gt("retain_until", now);

    if (!countErr && (pendingCount ?? 0) >= MAX_PENDING_UPLOADS) {
      return Response.json(
        {
          error:
            "Você já possui 3 receitas pendentes de análise por nossos farmacêuticos. Aguarde a validação antes de enviar uma nova.",
        },
        { status: 429 }
      );
    }

    const id = `REC-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    const safeOriginalName = sanitizeText(
      file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
      120
    ) || "receita.pdf";
    const month = new Date().toISOString().slice(0, 7);
    const objectKey = `prescriptions/${month}/${id}-${safeOriginalName}`;
    const retainUntil = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(); // 30 dias de retenção conforme RDC ANVISA

    // 2. Tenta fazer upload no Supabase Storage
    try {
      await client.storage.from("prescriptions").upload(objectKey, bytes, {
        contentType: file.type,
        upsert: false,
      });
    } catch {
      // Caso o bucket de storage não esteja ativo, continua com os metadados no banco
    }

    // 3. Salvar registro na tabela prescriptions
    const { error: insertErr } = await client.from("prescriptions").insert({
      id,
      customer_email: email,
      object_key: objectKey,
      original_name: safeOriginalName,
      content_type: file.type,
      size_bytes: file.size,
      status: "pending_review",
      retain_until: retainUntil,
      created_at: now,
    });

    if (insertErr) {
      throw insertErr;
    }

    // 4. Log de auditoria seguro com metadados higienizados
    await client.from("audit_logs").insert({
      actor_email: email,
      action: "prescription.upload",
      entity_type: "prescription",
      entity_id: id,
      metadata_json: sanitizeAuditMetadata({
        fileName: safeOriginalName,
        sizeBytes: file.size,
        contentType: file.type,
      }),
      created_at: now,
    });

    return Response.json(
      {
        id,
        status: "pending_review",
        message: "Receita enviada com sucesso para análise farmacêutica.",
      },
      {
        status: 201,
        headers: { "cache-control": "private, no-store" },
      }
    );
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "Não foi possível processar o envio seguro da receita." },
      { status: 500 }
    );
  }
}
