/**
 * MÓDULO DE SEGURANÇA, SANITIZAÇÃO E LGPD
 * Farmácia Poupe Mais
 */

/**
 * Remove tags HTML perigosas, scripts e potenciais vetores de injeção XSS
 */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "") // Remove todas as tags HTML remanescentes
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "") // Remove event handlers como onload, onerror, onclick
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "") // Remove caracteres de controle ASCII
    .trim()
    .slice(0, maxLength);
}

/**
 * Remove apenas tags perigosas mantendo quebras de linha limpas para descrições longas
 */
export function sanitizeRichDescription(input: unknown, maxLength = 5000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validação algorítmica matemática do CPF brasileiro (dígitos verificadores)
 */
export function validateCPF(cpfRaw: unknown): boolean {
  if (typeof cpfRaw !== "string") return false;
  const digits = cpfRaw.replace(/\D/g, "");
  if (digits.length !== 11) return false;

  // Rejeita sequências de dígitos idênticos conhecidos (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

/**
 * Limpa e formata CPF
 */
export function cleanCPF(cpfRaw: unknown): string {
  if (typeof cpfRaw !== "string") return "";
  return cpfRaw.replace(/\D/g, "").slice(0, 11);
}

/**
 * Mascaramento de CPF para conformidade com a LGPD (exibe apenas os dígitos centrais)
 * Exemplo: 123.456.789-01 -> ***.456.789-**
 */
export function maskCPF(cpfRaw: unknown): string {
  const digits = cleanCPF(cpfRaw);
  if (digits.length !== 11) return "***.***.***-**";
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

/**
 * Validação de telefone brasileiro (DDD + 8 ou 9 dígitos)
 */
export function validatePhone(phoneRaw: unknown): boolean {
  if (typeof phoneRaw !== "string") return false;
  const digits = phoneRaw.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

/**
 * Mascaramento de telefone para logs e LGPD
 * Exemplo: (11) 98765-4321 -> (11) 9****-4321
 */
export function maskPhone(phoneRaw: unknown): string {
  if (typeof phoneRaw !== "string") return "";
  const digits = phoneRaw.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(6)}`;
  }
  return "***";
}

/**
 * Mascaramento de e-mail para auditoria e logs seguros
 * Exemplo: raulgdc91@gmail.com -> r*****1@gmail.com
 */
export function maskEmail(emailRaw: unknown): string {
  if (typeof emailRaw !== "string" || !emailRaw.includes("@")) return "anônimo";
  const [local, domain] = emailRaw.trim().toLowerCase().split("@");
  if (!domain) return "anônimo";
  if (local.length <= 2) return `${local[0] || "*"}*@${domain}`;
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${"*".repeat(Math.min(5, local.length - 2))}${last}@${domain}`;
}

/**
 * Sanitização de metadados para salvar em audit_logs
 * Garante que senhas, tokens, números de cartão ou chaves de API nunca sejam persistidos
 */
export function sanitizeAuditMetadata(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const forbiddenKeys = new Set([
    "password",
    "senha",
    "token",
    "secret",
    "apikey",
    "api_key",
    "authorization",
    "cardnumber",
    "card_number",
    "cvv",
    "securitycode",
    "session",
    "cookie",
  ]);

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenKeys.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      if (lowerKey.includes("cpf")) {
        sanitized[key] = maskCPF(value);
      } else if (lowerKey.includes("email")) {
        sanitized[key] = maskEmail(value);
      } else if (lowerKey.includes("phone") || lowerKey.includes("tel")) {
        sanitized[key] = maskPhone(value);
      } else {
        sanitized[key] = sanitizeText(value, 200);
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 10).map((item) =>
        typeof item === "object" ? sanitizeAuditMetadata(item) : item
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeAuditMetadata(value);
    }
  }

  return sanitized;
}
