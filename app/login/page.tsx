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
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setSuccess(
            "Conta criada com sucesso! Se você for o primeiro usuário, seu perfil foi definido como Proprietário (Owner) automaticamente. Redirecionando..."
          );
          setTimeout(() => {
            router.push("/painel");
          }, 2000);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          setSuccess("Login realizado com sucesso! Acessando painel...");
          setTimeout(() => {
            router.push("/painel");
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
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
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.9rem", margin: "14px 0 6px" }}>
                {mode === "login" ? "Acesse sua conta" : "Criar sua conta"}
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
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
                  fontSize: "0.78rem",
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
                  fontSize: "0.82rem",
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
                  fontSize: "0.82rem",
                  marginBottom: "18px",
                  lineHeight: 1.4,
                }}
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {mode === "signup" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
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
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  required
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
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>
                  Senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
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
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="button button-primary"
                style={{ width: "100%", marginTop: "10px", fontSize: "0.95rem" }}
              >
                {loading ? "Processando..." : mode === "login" ? "Entrar no Painel" : "Cadastrar e Acessar"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
              <Link href="/painel/demo" style={{ color: "var(--teal)", fontSize: "0.8rem", fontWeight: 700 }}>
                Ou veja o modo demonstrativo sem login →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
