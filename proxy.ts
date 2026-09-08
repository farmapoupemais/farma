import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ==============================================================================
// 1. RATE LIMITER EM MEMÓRIA (SLIDING WINDOW)
// ==============================================================================
type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const ipLimiters = new Map<string, RateLimitRecord>();

// Limpeza automática a cada 2 minutos para evitar vazamento de memória
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of ipLimiters.entries()) {
    if (val.resetAt <= now) {
      ipLimiters.delete(key);
    }
  }
}, 120_000);

function checkRateLimit(
  ip: string,
  category: "auth" | "api_mutation" | "general"
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const windowMs = 60_000; // Janela de 1 minuto

  const limits: Record<"auth" | "api_mutation" | "general", number> = {
    auth: 15,          // Máx 15 tentativas de login por minuto por IP (anti-brute-force)
    api_mutation: 45,  // Máx 45 mutações/pedidos por minuto
    general: 200,      // Máx 200 requisições gerais por minuto
  };

  const maxRequests = limits[category];
  const key = `${ip}:${category}`;
  const record = ipLimiters.get(key);

  if (!record || record.resetAt <= now) {
    ipLimiters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// ==============================================================================
// 2. WAF & INSPEÇÃO DE VETORES DE ATAQUE
// ==============================================================================
const SUSPICIOUS_PATTERNS = [
  /\.\.\//,                // Path traversal ../
  /\.\.\\/,                // Path traversal ..\
  /%2e%2e/i,               // URL-encoded path traversal ..
  /\x00|%00/,              // Null byte
  /<script[\s>]/i,         // Script injection <script
  /javascript\s*:/i,       // JavaScript URI
  /union(\s|\+)+(all(\s|\+)+)?select/i, // SQL injection UNION SELECT
  /waitfor(\s|\+)+delay/i, // SQL injection timing
  /information_schema/i,   // SQL injection schema probing
];

function isMaliciousPayload(input: string): boolean {
  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    return true; // Malformed percent-encoding is blocked
  }
  const combined = `${input} ${decoded}`;
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(combined));
}

// ==============================================================================
// 3. MIDDLEWARE PRINCIPAL
// ==============================================================================
export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const method = request.method;

  // Ignora arquivos estáticos do Next.js e assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 1. Extração do IP do Cliente
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  // 2. Inspeção WAF (Path Traversal, XSS, SQLi em URLs/Query strings)
  const fullPathAndQuery = `${pathname}${search}`;
  if (isMaliciousPayload(fullPathAndQuery)) {
    return new NextResponse(
      JSON.stringify({ error: "Requisição bloqueada por segurança." }),
      {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      }
    );
  }

  // 3. Rate Limiting Baseado na Rota
  let rateCategory: "auth" | "api_mutation" | "general" = "general";
  if (pathname.includes("/login") || pathname.includes("/auth")) {
    rateCategory = "auth";
  } else if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    pathname.startsWith("/api")
  ) {
    rateCategory = "api_mutation";
  }

  const { allowed, retryAfter } = checkRateLimit(clientIp, rateCategory);
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Muitas tentativas. Por favor, aguarde alguns instantes.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "retry-after": String(retryAfter),
        },
      }
    );
  }

  // 4. Proteção Anti-CSRF para Mutações de Estado
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite === "cross-site") {
      return new NextResponse(
        JSON.stringify({ error: "Origem da solicitação não permitida (CSRF)." }),
        {
          status: 403,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      );
    }

    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const host = request.headers.get("host") || "";
        if (originUrl.host !== host) {
          return new NextResponse(
            JSON.stringify({ error: "Origem cruzada não autorizada." }),
            {
              status: 403,
              headers: { "content-type": "application/json; charset=utf-8" },
            }
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "Origem inválida." }),
          {
            status: 403,
            headers: { "content-type": "application/json; charset=utf-8" },
          }
        );
      }
    }
  }

  // 5. Injeção de Headers de Segurança na Resposta
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  return response;
}

export { proxy as middleware };

export const config = {
  matcher: [
    /*
     * Aplica o middleware a todas as rotas exceto arquivos estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
