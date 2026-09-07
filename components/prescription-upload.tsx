"use client";

import { useRef, useState } from "react";
import { Icon } from "./icons";

export function PrescriptionUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<{ state: "idle" | "loading" | "success" | "error"; message?: string }>({ state: "idle" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !consent) return;
    setStatus({ state: "loading", message: "Enviando de forma protegida…" });
    const body = new FormData(); body.set("prescription", file); body.set("consent", "true");
    try {
      const response = await fetch("/api/receitas", { method: "POST", body });
      const payload = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível enviar.");
      setFile(null); setConsent(false); if (inputRef.current) inputRef.current.value = "";
      setStatus({ state: "success", message: `Receita ${payload.id ?? ""} recebida. A equipe farmacêutica fará a análise.` });
    } catch (error) { setStatus({ state: "error", message: error instanceof Error ? error.message : "Tente novamente." }); }
  }

  return (
    <form className="prescription-form" onSubmit={submit}>
      <button type="button" className={`upload-dropzone ${file ? "has-file" : ""}`} onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <span><Icon name={file ? "care" : "document"} size={34} /></span>
        <strong>{file ? file.name : "Selecione sua receita"}</strong>
        <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • clique para trocar` : "PDF, JPG ou PNG • máximo de 5 MB"}</p>
      </button>
      <label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Autorizo o tratamento deste documento e dos dados de saúde nele contidos exclusivamente para análise e dispensação, conforme a política de privacidade.</span></label>
      <button className="button button-primary upload-submit" disabled={!file || !consent || status.state === "loading"}>{status.state === "loading" ? "Enviando…" : "Enviar para análise"}</button>
      {status.state !== "idle" && <div className={`upload-status ${status.state}`}>{status.message}</div>}
    </form>
  );
}
