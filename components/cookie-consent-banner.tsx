"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  MapPin,
  Pill,
  BarChart3,
  MessageSquare,
  X,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";

export type DataConsentPreferences = {
  necessary: boolean; // Sempre true (Obrigações sanitárias ANVISA e fiscais)
  geolocation: boolean; // CEP e tele-entrega expressa em 90 min
  pharmacotherapy: boolean; // Lembretes e perfil de uso contínuo (Art. 11)
  telemetry: boolean; // Telemetria e diagnóstico técnico
  communications: boolean; // Alertas de receita e WhatsApp
  protocol: string; // Identificador unívoco do consentimento
  decidedAt: string; // Timestamp ISO
};

const CONSENT_STORAGE_KEY = "poupe-mais-lgpd-data-consent";

function generateConsentProtocol(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `LGPD-${dateStr}-${randomSuffix}`;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("poupe-mais-lgpd-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("poupe-mais-lgpd-changed", callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "__server__";
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) ?? "__unset__";
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
  const [customGeo, setCustomGeo] = useState(true);
  const [customPharmaco, setCustomPharmaco] = useState(false);
  const [customTelemetry, setCustomTelemetry] = useState(false);
  const [customComm, setCustomComm] = useState(true);

  // Servidor não renderiza para evitar mismatch de hidratação
  if (rawConsent === "__server__") return null;

  const hasDecided = rawConsent !== "__unset__";
  const showBanner = !hasDecided;

  let currentPrefs: DataConsentPreferences | null = null;
  if (hasDecided) {
    try {
      currentPrefs = JSON.parse(rawConsent) as DataConsentPreferences;
    } catch {
      currentPrefs = null;
    }
  }

  function saveAndApply(prefs: {
    geolocation: boolean;
    pharmacotherapy: boolean;
    telemetry: boolean;
    communications: boolean;
  }) {
    const protocol = currentPrefs?.protocol ?? generateConsentProtocol();
    const updated: DataConsentPreferences = {
      necessary: true,
      geolocation: prefs.geolocation,
      pharmacotherapy: prefs.pharmacotherapy,
      telemetry: prefs.telemetry,
      communications: prefs.communications,
      protocol,
      decidedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("poupe-mais-lgpd-changed", { detail: updated }));
    } catch {
      // ignore
    }
    setShowModal(false);
  }

  function handleAcceptAll() {
    saveAndApply({
      geolocation: true,
      pharmacotherapy: true,
      telemetry: true,
      communications: true,
    });
  }

  function handleAcceptNecessaryOnly() {
    saveAndApply({
      geolocation: false,
      pharmacotherapy: false,
      telemetry: false,
      communications: false,
    });
  }

  function handleOpenModal() {
    if (currentPrefs) {
      setCustomGeo(Boolean(currentPrefs.geolocation));
      setCustomPharmaco(Boolean(currentPrefs.pharmacotherapy));
      setCustomTelemetry(Boolean(currentPrefs.telemetry));
      setCustomComm(Boolean(currentPrefs.communications));
    } else {
      setCustomGeo(true);
      setCustomPharmaco(false);
      setCustomTelemetry(false);
      setCustomComm(true);
    }
    setShowModal(true);
  }

  function handleSaveCustom() {
    saveAndApply({
      geolocation: customGeo,
      pharmacotherapy: customPharmaco,
      telemetry: customTelemetry,
      communications: customComm,
    });
  }

  return (
    <>
      {/* 1. BANNER FLUTUANTE INICIAL (Aparece no rodapé até a manifestação do usuário) */}
      {showBanner && !showModal && (
        <aside
          className="cookie-consent-banner"
          role="region"
          aria-label="Privacidade e Proteção de Dados Pessoais (LGPD)"
        >
          <div className="cookie-banner-content">
            <div className="cookie-banner-icon">
              <Shield size={18} className="text-[#00874e]" />
            </div>
            <div className="cookie-banner-text">
              <h4>Privacidade e Dados Pessoais (LGPD)</h4>
              <p>
                Tratamos dados mínimos essenciais para notas fiscais e normas da ANVISA. Você pode personalizar suas preferências a qualquer momento.
              </p>
              <div className="cookie-banner-links">
                <Link href="/privacidade" className="hover:underline">
                  Política de Privacidade
                </Link>
                <span>•</span>
                <Link href="/termos" className="hover:underline">
                  Termos de Uso
                </Link>
              </div>
            </div>
          </div>

          <div className="cookie-banner-actions">
            <button
              type="button"
              onClick={handleAcceptNecessaryOnly}
              className="cookie-btn cookie-btn-necessary"
              title="Autoriza apenas os dados estritamente obrigatórios por lei"
            >
              Apenas Obrigatórios
            </button>
            <button
              type="button"
              onClick={handleOpenModal}
              className="cookie-btn cookie-btn-customize flex items-center justify-center gap-1"
              title="Personalizar quais dados pessoais você autoriza"
            >
              <SlidersHorizontal size={13} /> Personalizar
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="cookie-btn cookie-btn-accept"
              title="Autoriza todas as preferências de conveniência e tele-entrega"
            >
              Aceitar Todos
            </button>
          </div>
        </aside>
      )}

      {/* 2. MODAL FLUTUANTE DA CENTRAL DE ESCOLHA DE CESSÃO DE DADOS (LGPD) */}
      {showModal && (
        <div
          className="cookie-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lgpd-modal-title"
        >
          <div className="cookie-modal-card max-w-2xl animate-fadeIn">
            {/* Header do Modal */}
            <div className="cookie-modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00874e]">
                  <Shield size={22} />
                </div>
                <div>
                  <h3 id="lgpd-modal-title" className="text-base font-black text-gray-900 leading-tight">
                    Central de Escolha de Cessão de Dados Pessoais
                  </h3>
                  <p className="text-xs text-gray-500">
                    Governança e Autodeterminação Informativa • Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="cookie-modal-close"
                aria-label="Fechar Central de Privacidade"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal com Categorias Granulares de Dados */}
            <div className="cookie-modal-body space-y-4 max-h-[62vh] overflow-y-auto pr-1">
              <div className="bg-[#f0fdf4] border border-emerald-200 rounded-xl p-3.5 text-xs text-[#005a34] leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#00874e] flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Cláusula Pétrea de Vedação Comercial (Art. 11, § 4º da LGPD):</strong> Seus dados de saúde e prescrições médicas <strong>nunca serão vendidos ou repassados</strong> a operadoras de planos de saúde, bancos, seguradoras ou terceiros anunciantes.
                </div>
              </div>

              {/* 1. Dados Obrigatórios por Lei Sanitária */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-[#00874e]" />
                      <strong>1. Dados Sanitários, Cadastrais e Fiscais Obrigatórios</strong>
                    </div>
                    <span className="cookie-badge-always-active">OBRIGATÓRIO POR LEI</span>
                  </div>
                  <p>
                    Nome completo, CPF e endereço necessários para emissão compulsória de Nota Fiscal Eletrônica (SEFAZ), prevenção a fraudes e cumprimento das normas sanitárias de rastreabilidade de medicamentos da ANVISA (RDC nº 44/2009 e SNGPC).
                    <br />
                    <em>Base Legal: Art. 7º, II (Obrigação Legal) e Art. 11, II, &quot;a&quot; e &quot;f&quot; (Tutela da Saúde).</em>
                  </p>
                </div>
                <label className="cookie-toggle disabled" title="Este tratamento decorre de imposição legal e sanitária">
                  <input type="checkbox" checked disabled readOnly />
                  <span className="slider" />
                </label>
              </div>

              {/* 2. Dados de Localização e CEP para Tele-Entrega */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#00874e]" />
                      <strong>2. Dados de Geolocalização e CEP (Tele-Entrega Expressa 90 min)</strong>
                    </div>
                    <span className="cookie-badge-optional">OPCIONAL</span>
                  </div>
                  <p>
                    Permite salvar seu CEP e calcular automaticamente o estoque em tempo real na loja física mais próxima em Porto Alegre e o prazo de entrega expressa em até 90 minutos por motoboy.
                    <br />
                    <em>Base Legal: Consentimento (Art. 7º, I da LGPD).</em>
                  </p>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={customGeo}
                    onChange={(e) => setCustomGeo(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* 3. Perfil Farmacoterapêutico & Lembretes de Uso Contínuo */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <div className="flex items-center gap-2">
                      <Pill size={16} className="text-[#00874e]" />
                      <strong>3. Perfil Farmacoterapêutico & Lembretes de Uso Contínuo</strong>
                    </div>
                    <span className="cookie-badge-optional">DADOS DE SAÚDE (ART. 11)</span>
                  </div>
                  <p>
                    Armazenamento consentido de receitas anteriores para habilitar lembretes programados de reposição de medicamentos de uso contínuo (hipertensão, diabetes, colesterol) antes do término da caixa, prevenindo interrupções terapêuticas.
                    <br />
                    <em>Base Legal: Consentimento Específico e Destacado para Dados Sensíveis (Art. 11, I da LGPD).</em>
                  </p>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={customPharmaco}
                    onChange={(e) => setCustomPharmaco(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* 4. Telemetria Analítica e Desempenho do Site */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#00874e]" />
                      <strong>4. Métricas de Navegação e Diagnóstico Técnico</strong>
                    </div>
                    <span className="cookie-badge-optional">OPCIONAL</span>
                  </div>
                  <p>
                    Métricas anônimas de tempo de resposta, velocidade de busca e páginas visitadas para detecção de instabilidades e aperfeiçoamento contínuo da loja digital.
                    <br />
                    <em>Base Legal: Legítimo Interesse (Art. 7º, IX da LGPD).</em>
                  </p>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={customTelemetry}
                    onChange={(e) => setCustomTelemetry(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* 5. Alertas de Receita e Tele-Entrega via WhatsApp */}
              <div className="cookie-category-box">
                <div className="cookie-category-info">
                  <div className="cookie-category-title-row">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-[#00874e]" />
                      <strong>5. Notificações de Saúde e Alertas via WhatsApp / E-mail</strong>
                    </div>
                    <span className="cookie-badge-optional">OPCIONAL</span>
                  </div>
                  <p>
                    Envio de aviso telemático quando sua receita médica for conferida e aprovada pelo farmacêutico em 15 minutos, além do link de rastreamento do motoboy em trânsito.
                    <br />
                    <em>Base Legal: Consentimento (Art. 7º, I da LGPD).</em>
                  </p>
                </div>
                <label className="cookie-toggle">
                  <input
                    type="checkbox"
                    checked={customComm}
                    onChange={(e) => setCustomComm(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              {/* Registro e Protocolo de Consentimento */}
              <div className="cookie-modal-footer-note pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <strong>Protocolo do Titular:</strong>{" "}
                  <code>{currentPrefs?.protocol ?? "Novo Registro Imediato"}</code>
                  {currentPrefs?.decidedAt && (
                    <span className="block text-[11px] text-gray-500">
                      Última atualização em: {new Date(currentPrefs.decidedAt).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
                <div className="text-gray-500">
                  DPO: <a href="mailto:dpo@poupemais.com.br" className="text-[#00874e] underline font-bold">dpo@poupemais.com.br</a>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="cookie-modal-actions flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAcceptNecessaryOnly}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Ceder Apenas o Mínimo Legal
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#005a34] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  Ceder Todos os Dados
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="py-2.5 px-5 rounded-xl text-xs font-black bg-[#00874e] hover:bg-[#005a34] text-white shadow-md transition-all"
                >
                  Salvar Minhas Escolhas de Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTÃO FLUTUANTE PERMANENTE DE GESTÃO LGPD (Canto Inferior Esquerdo) */}
      {hasDecided && (
        <button
          type="button"
          onClick={handleOpenModal}
          className="floating-cookie-trigger-btn group"
          title="Privacidade e Dados Pessoais (LGPD)"
          aria-label="Abrir Preferências de Privacidade e Dados LGPD"
        >
          <span className="floating-cookie-icon text-[#00874e] group-hover:scale-110 transition-transform">
            <Shield size={13} />
          </span>
          <span>Privacidade &amp; LGPD</span>
        </button>
      )}
    </>
  );
}
