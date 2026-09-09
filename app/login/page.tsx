"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark, Icon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!configured || !supabase) {
      setError(
        "Supabase ainda não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local ou nas variáveis do Netlify."
      );
      setLoading(false);
      return;
    }

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Acesso Administrativo para Apresentação
      if (
        (cleanEmail === "admin@poupemais.com" ||
          cleanEmail === "demo@poupemais.com" ||
          cleanEmail === "apresentacao@poupemais.com") &&
        (password === "PoupeMais@2026" || password === "admin123")
      ) {
        setSuccess("Acesso de Administrador (Owner) autorizado! Entrando no painel...");
        setTimeout(() => {
          router.push("/painel/demo");
        }, 800);
        return;
      }

      if (mode === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          setSuccess(
            "Conta criada com sucesso! Redirecionando para o painel..."
          );
          setTimeout(() => {
            router.push("/painel");
          }, 1500);
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (signInData.session) {
          setSuccess("Login realizado com sucesso! Acessando painel...");
          setTimeout(() => {
            router.push("/painel");
          }, 1000);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGitHubLogin() {
    setError("");
    setLoading(true);
    if (!configured || !supabase) {
      setError("Supabase ainda não configurado.");
      setLoading(false);
      return;
    }
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/painel` : undefined,
        },
      });
      if (oAuthError) throw oAuthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao conectar com GitHub.");
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="inner-main">
        <div className="page-shell" style={{ maxWidth: "480px", margin: "60px auto" }}>
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: "20px",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <BrandMark size={48} />
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-3xl)", fontWeight: "var(--font-bold)", margin: "14px 0 6px" }}>
                {mode === "login" ? "Acesse sua conta" : "Criar sua conta"}
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)", margin: 0 }}>
                Farmácia Poupe Mais • Acesso seguro
              </p>
            </div>

            <div
              style={{
                display: "flex",
                background: "var(--cream)",
                padding: "4px",
                borderRadius: "12px",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "9px",
                  border: "none",
                  fontWeight: mode === "login" ? 800 : 500,
                  background: mode === "login" ? "#fff" : "transparent",
                  color: mode === "login" ? "var(--teal)" : "var(--muted)",
                  boxShadow: mode === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                }}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "9px",
                  border: "none",
                  fontWeight: mode === "signup" ? 800 : 500,
                  background: mode === "signup" ? "#fff" : "transparent",
                  color: mode === "signup" ? "var(--teal)" : "var(--muted)",
                  boxShadow: mode === "signup" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                }}
              >
                Cadastre-se
              </button>
            </div>

            {mode === "signup" && (
              <div
                style={{
                  background: "var(--sage-2)",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "14px",
                  marginBottom: "20px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  fontSize: "var(--text-xs)",
                  color: "var(--teal-deep)",
                }}
              >
                <Icon name="spark" size={24} />
                <span>
                  <strong>Primeiro cadastro:</strong> O primeiro usuário cadastrado nesta farmácia será promovido automaticamente a <strong>Proprietário (Owner)</strong> com acesso a todas as permissões.
                </span>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "var(--coral-soft)",
                  color: "#9c4c40",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "var(--text-xs)",
                  marginBottom: "18px",
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  background: "#e6f4ea",
                  color: "#1e7e34",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  fontSize: "var(--text-xs)",
                  marginBottom: "18px",
                  lineHeight: 1.4,
                }}
              >
                {success}
              </div>
            )}

            <button
              type="button"
              onClick={handleGitHubLogin}
              disabled={loading}
              style={{
                width: "100%",
                height: "46px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                background: "#24292e",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                transition: "background 0.2s",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Continuar com GitHub
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted)", textTransform: "uppercase", fontWeight: "var(--font-bold)" }}>
                ou entre com e-mail
              </span>
              <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {mode === "signup" && (
                <div>
                  <label htmlFor="login-name" style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                    Nome Completo
                  </label>
                  <input
                    id="login-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--line)",
                      outline: "none",
                      fontSize: "var(--text-xs)",
                    }}
                  />
                </div>
              )}

              <div>
                <label htmlFor="login-email" style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    outline: "none",
                    fontSize: "var(--text-xs)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="login-password" style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                  Senha
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    outline: "none",
                    fontSize: "var(--text-xs)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="button button-primary"
                style={{ width: "100%", marginTop: "10px", fontSize: "var(--text-sm)" }}
              >
                {loading ? "Processando..." : mode === "login" ? "Entrar no Painel" : "Cadastrar e Acessar"}
              </button>
            </form>

            <div
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                background: "#f0fdf4",
                border: "1px dashed #16a34a",
                borderRadius: "12px",
                fontSize: "var(--text-xs)",
                color: "#166534",
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔑</span> Acesso Rápido de Administrador (Owner):
              </div>
              <div style={{ marginBottom: "2px" }}><strong>E-mail:</strong> <code>admin@poupemais.com</code></div>
              <div style={{ marginBottom: "10px" }}><strong>Senha:</strong> <code>admin123</code></div>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@poupemais.com");
                  setPassword("admin123");
                  setSuccess("Acesso de Administrador (Owner) autorizado! Entrando no painel...");
                  setTimeout(() => router.push("/painel/demo"), 500);
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "var(--text-xs)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                ⚡ Entrar como Administrador com 1 Clique
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
              <Link href="/painel/demo" style={{ color: "var(--teal)", fontSize: "var(--text-xs)", fontWeight: "var(--font-bold)" }}>
                Ou acesse diretamente a demonstração interativa →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
