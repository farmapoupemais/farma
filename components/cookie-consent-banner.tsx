"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";

export type CookiePreferences = {
  necessary: boolean; // Sempre true
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const COOKIE_STORAGE_KEY = "poupe-mais-cookie-consent";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("poupe-mais-cookies-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("poupe-mais-cookies-changed", callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "__server__";
  try {
    return localStorage.getItem(COOKIE_STORAGE_KEY) ?? "__unset__";
  } catch {
    return "__unset__";
  }
}

function getServerSnapshot(): string {
  return "__server__";
}

export function CookieConsentBanner() {
  const rawConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [showModal, setShowModal] = useState(false);
  const [customAnalytics, setCustomAnalytics] = useState(false);
  const [customMarketing, setCustomMarketing] = useState(false);

  // Still rendering on server
  if (rawConsent === "__server__") return null;

  const hasDecided = rawConsent !== "__unset__";
  const showBanner = !hasDecided;

  function saveAndApply(nextPrefs: { analytics: boolean; marketing: boolean }) {
    const updated: CookiePreferences = {
      necessary: true,
      analytics: nextPrefs.analytics,
      marketing: nextPrefs.marketing,
      decidedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("poupe-mais-cookies-changed", { detail: updated }));
    } catch {
      // ignore
    }
    setShowModal(false);
  }

  function handleAcceptAll() {
    saveAndApply({ analytics: true, marketing: true });
  }

  function handleAcceptNecessaryOnly() {
    saveAndApply({ analytics: false, marketing: false });
  }

  function handleOpenModal() {
    if (hasDecided) {
      try {
        const parsed = JSON.parse(rawConsent) as CookiePreferences;
        setCustomAnalytics(Boolean(parsed.analytics));
        setCustomMarketing(Boolean(parsed.marketing));
      } catch {
        setCustomAnalytics(false);
        setCustomMarketing(false);
      }
    } else {
      setCustomAnalytics(false);
      setCustomMarketing(false);
    }
    setShowModal(true);
  }

  function handleSaveCustom() {
    saveAndApply({
      analytics: customAnalytics,
      marketing: customMarketing,
    });
  }

  return (
    <>
      {/* 1. BANNER FLUTUANTE INICIAL (Apenas exibido na primeira visita antes da escolha) */}
      {showBanner && !showModal && (
        <div
          className="cookie-consent-banner"
          role="region"
          aria-label="Aviso de Cookies e Privacidade LGPD"
        >
          <div className="cookie-banner-content">
            <div className="cookie-banner-icon">
              <Icon name="shield" size={26} />
            </div>
            <div className="cookie-banner-text">
              <h4>Privacidade e Controle de Dados (LGPD)</h4>
              <p>
                Na <strong>Farmácia Poupe Mais</strong>, seus dados e receitas médicas são protegidos com sigilo e
                segurança. Utilizamos cookies indispensáveis para o funcionamento e finalização de pedidos, e
                cookies analíticos opcionais para aprimorar sua experiência. Você tem a liberdade de ceder tudo ou
                manter apenas os estritamente necessários.
              </p>
              <div className="cookie-banner-links">
                <Link href="/privacidade">Política de Privacidade (LGPD)</Link>
                <span>•</span>
                <Link href="/termos">Termos de Uso Sanitários</Link>
              </div>
            </div>
          </div>

          <div className="cookie-banner-actions">
            <button
              type="button"
              className="cookie-btn cookie-btn-outline"
              onClick={handleAcceptNecessaryOnly}
              title="Permitir apenas os cookies essenciais para o funcionamento seguro da farmácia"
            >
              Apenas Cookies Necessários
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-primary"
              onClick={handleAcceptAll}
              title="Aceitar todos os cookies incluindo análises e melhorias"
            >
              Aceitar Todos os Cookies
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-link"
              onClick={handleOpenModal}
            >
              Personalizar
            </button>
          </div>
        </div>
      )}

      {/* 2. MODAL DE PREFERÊNCIAS DETALHADAS */}
      {showModal && (
        <div className="cookie-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-cookie-title">
          <div className="cookie-modal-card">
            <div className="cookie-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="cookie-modal-shield-icon">
                  <Icon name="shield" size={22} />
                </span>
                <h3 id="modal-cookie-title">Gerenciador de Privacidade & Cookies</h3>
              </div>
              <button
                type="button"
                className="cookie-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Fechar preferências"
              >
                ✕
              </button>
            </div>

            <div className="cookie-modal-body">
              <p className="cookie-modal-intro">
                Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong> e as
                diretrizes da ANPD, você pode configurar abaixo as categorias de cookies que autoriza em seu
                dispositivo:
              </p>

              {/* Categoria 1: Necessários */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <strong>1. Cookies Estritamente Necessários</strong>
                    <span className="cookie-badge-always-active">Sempre Ativo (Obrigatório)</span>
                  </div>
                  <p>
                    Essenciais para a segurança, autenticação de login, funcionamento do carrinho de compras,
                    prevenção a fraudes e cumprimento de obrigações legais da ANVISA. Não podem ser desativados.
                  </p>
                </div>
                <div className="cookie-toggle disabled">
                  <input type="checkbox" checked disabled readOnly aria-label="Cookies Necessários (obrigatórios)" />
                  <span className="slider"></span>
                </div>
              </div>

              {/* Categoria 2: Analíticos */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <strong>2. Cookies Analíticos e de Desempenho</strong>
                    <span className="cookie-badge-optional">Opcional</span>
                  </div>
                  <p>
                    Nos ajudam a compreender como as páginas são navegadas, medindo tempos de resposta e
                    estabilidade técnica para aprimorar os serviços da farmácia. Todos os dados são agregados e
                    anonimizados.
                  </p>
                </div>
                <label className="cookie-toggle" htmlFor="toggle-analytics">
                  <input
                    id="toggle-analytics"
                    type="checkbox"
                    checked={customAnalytics}
                    onChange={(e) => setCustomAnalytics(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {/* Categoria 3: Marketing e Personalização */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <strong>3. Cookies de Marketing e Personalização</strong>
                    <span className="cookie-badge-optional">Opcional</span>
                  </div>
                  <p>
                    Permitem lembrar preferências de produtos e evitar que você veja cupons de itens de perfumaria
                    já visualizados. <em>Aviso importante: a Farmácia Poupe Mais jamais utiliza esses dados para publicidade de medicamentos controlados.</em>
                  </p>
                </div>
                <label className="cookie-toggle" htmlFor="toggle-marketing">
                  <input
                    id="toggle-marketing"
                    type="checkbox"
                    checked={customMarketing}
                    onChange={(e) => setCustomMarketing(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="cookie-modal-footer-note">
                Consulte nossa <Link href="/privacidade" onClick={() => setShowModal(false)}>Política de Privacidade</Link> para saber mais sobre o canal direto com o nosso Encarregado de Dados (DPO).
              </div>
            </div>

            <div className="cookie-modal-actions">
              <button
                type="button"
                className="cookie-btn cookie-btn-outline"
                onClick={handleAcceptNecessaryOnly}
              >
                Apenas Necessários
              </button>
              <button
                type="button"
                className="cookie-btn cookie-btn-save"
                onClick={handleSaveCustom}
              >
                Salvar Minhas Escolhas
              </button>
              <button
                type="button"
                className="cookie-btn cookie-btn-primary"
                onClick={handleAcceptAll}
              >
                Aceitar Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTÃO FLUTUANTE PERMANENTE (Permite gerenciar/revogar consentimento a qualquer instante) */}
      {!showBanner && !showModal && (
        <button
          type="button"
          className="floating-cookie-trigger-btn"
          onClick={handleOpenModal}
          title="Gerenciar suas preferências de Cookies e Privacidade (LGPD)"
          aria-label="Gerenciar preferências de Privacidade e Cookies"
        >
          <span className="floating-cookie-icon">
            <Icon name="shield" size={19} />
          </span>
          <span className="floating-cookie-label">Privacidade & Cookies</span>
        </button>
      )}
    </>
  );
}
