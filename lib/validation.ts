export function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function cleanEmail(value: unknown) {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function cleanSlug(value: unknown) {
  const slug = cleanText(value, 120).toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : "";
}

export function toSafeInteger(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

export function safeInternalPath(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  try {
    const url = new URL(value, "https://app.local");
    return url.origin === "https://app.local" ? `${url.pathname}${url.search}` : fallback;
  } catch {
    return fallback;
  }
}

export function mutationOriginAllowed(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export class RequestBodyError extends Error {
  readonly status: 400 | 413;

  constructor(message: string, status: 400 | 413) {
    super(message);
    this.status = status;
  }
}

export async function readRequestBytes(request: Request, maxBytes: number) {
  const declared = request.headers.get("content-length");
  if (declared) {
    const length = Number(declared);
    if (!Number.isFinite(length) || length < 0) throw new RequestBodyError("Tamanho de solicitação inválido.", 400);
    if (length > maxBytes) throw new RequestBodyError("Solicitação muito grande.", 413);
  }

  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new RequestBodyError("Solicitação muito grande.", 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T> {
  const bytes = await readRequestBytes(request, maxBytes);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    throw new RequestBodyError("JSON inválido.", 400);
  }
}

export async function readFormDataBody(request: Request, maxBytes: number) {
  const bytes = await readRequestBytes(request, maxBytes);
  try {
    const bounded = new Request(request.url, { method: request.method, headers: request.headers, body: bytes });
    return await bounded.formData();
  } catch {
    throw new RequestBodyError("Formulário inválido.", 400);
  }
}
