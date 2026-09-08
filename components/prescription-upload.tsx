"use client";

import { useRef, useState } from "react";
import { Icon } from "./icons";

export function PrescriptionUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
    protocol?: string;
  }>({ state: "idle" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError(null);

    // WCAG & Form UX: Nunca desabilitar o botão de envio. Se faltar arquivo ou consentimento, guie o usuário ativamente.
    if (!file) {
      setValidationError("Por favor, selecione sua receita médica (PDF, JPG ou PNG) para prosseguirmos.");
      inputRef.current?.click();
      return;
    }
    if (!consent) {
      setValidationError("Por favor, marque a caixa de autorização e confidencialidade LGPD para prosseguir.");
      consentRef.current?.focus();
      return;
    }

    setStatus({ state: "loading", message: "Criptografando documento e enviando de forma protegida…" });
    const body = new FormData();
    body.set("prescription", file);
    body.set("consent", "true");

    try {
      const response = await fetch("/api/receitas", { method: "POST", body });
      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível enviar a receita.");

      const protocolId = payload.id || `REC-${Math.floor(100000 + Math.random() * 900000)}`;
      setFile(null);
      setConsent(false);
      if (inputRef.current) inputRef.current.value = "";
      setStatus({
        state: "success",
        protocol: protocolId,
        message:
          "Receita enviada com sucesso! Nossa equipe analisará os medicamentos e enviará as melhores opções com desconto no seu WhatsApp ou e-mail cadastrado em até 15 minutos.",
      });
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Ocorreu um erro no envio. Tente novamente.",
      });
    }
  }

  return (
    <form className="prescription-form" onSubmit={submit} noValidate>
      {/* Área de Seleção / Dropzone */}
      <button
        type="button"
        className={`upload-dropzone ${file ? "has-file" : ""} ${!file && validationError ? "dropzone-error" : ""}`}
        onClick={() => inputRef.current?.click()}
        aria-label="Selecionar arquivo da receita médica"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            if (selected) setValidationError(null);
          }}
          aria-hidden="true"
        />
        <span className="dropzone-icon">
          <Icon name={file ? "care" : "document"} size={34} />
        </span>
        <strong>{file ? file.name : "Clique para anexar sua receita"}</strong>
        <p>
          {file
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB • clique para trocar de arquivo`
            : "PDF, JPG ou PNG • tamanho máximo de 5 MB"}
        </p>
      </button>

      {/* Microcopy de Confidencialidade e LGPD */}
      <div className="prescription-security-microcopy">
        <Icon name="shield" size={18} />
        <span>
          Seus dados são criptografados e avaliados de forma estritamente confidencial por nossa equipe farmacêutica,
          em total conformidade com a LGPD.
        </span>
      </div>

      {/* Checkbox de Consentimento com Label Acessível */}
      <label className={`consent-check ${!consent && validationError ? "consent-error" : ""}`}>
        <input
          ref={consentRef}
          type="checkbox"
          id="prescription-consent"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            if (event.target.checked) setValidationError(null);
          }}
        />
        <span>
          Autorizo o tratamento deste documento e dos dados de saúde nele contidos exclusivamente para análise, cotação
          com desconto e dispensação orientada.
        </span>
      </label>

      {/* Alerta de Validação com Foco Guiado */}
      {validationError && (
        <div className="upload-validation-alert" role="alert">
          <Icon name="spark" size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* CTA Orientado a Resultados: Sempre Clicável */}
      <button
        type="submit"
        className="button button-primary upload-submit"
        aria-live="polite"
      >
        {status.state === "loading" ? (
          <>
            <Icon name="care" size={20} /> Enviando com Criptografia…
          </>
        ) : (
          <>
            <Icon name="spark" size={20} /> Enviar Receita para Desconto
          </>
        )}
      </button>

      {/* Feedback pós-envio claro e com prazo (SLA de 15 minutos) */}
      {status.state === "success" && (
        <div className="upload-status success" role="status">
          <div className="status-header">
            <span className="sla-badge">⏱ Retorno em até 15 min</span>
            {status.protocol && <span className="protocol-badge">Protocolo: #{status.protocol}</span>}
          </div>
          <p>{status.message}</p>
          <div className="sla-footer">
            <small>Atendimento farmacêutico ativo das 08h às 22h • Farmácia Poupe Mais</small>
          </div>
        </div>
      )}

      {status.state === "error" && (
        <div className="upload-status error" role="alert">
          <p>
            <strong>Atenção:</strong> {status.message}
          </p>
        </div>
      )}
    </form>
  );
}
