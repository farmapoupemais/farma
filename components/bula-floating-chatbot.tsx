"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  X,
  RotateCcw,
  Send,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Info,
  ExternalLink
} from "lucide-react";
import {
  processarConsultaBula,
  RespostaChatbot
} from "@/lib/bula-chatbot-engine";
import { BULAS_DATABASE, BulaOficial, PORTAIS_OFICIAIS_ANVISA } from "@/lib/bulas-data";

interface MensagemChat {
  id: string;
  autor: "usuario" | "bot";
  texto: string;
  resposta?: RespostaChatbot;
  timestamp: string;
}

export const SINTOMAS_RAPIDOS = [
  { label: "🌡️ Febre", query: "Quais remédios dizem na bula para febre?" },
  { label: "🤕 Dor de Cabeça", query: "Quais remédios dizem na bula para dor de cabeça?" },
  { label: "🫄 Azia & Queimação", query: "Quais remédios dizem na bula para azia e má digestão?" },
  { label: "🫁 Tosse com Catarro", query: "Quais remédios dizem na bula para tosse com catarro?" },
  { label: "🩸 Cólica Menstrual", query: "Quais remédios dizem na bula para cólica menstrual?" },
  { label: "🌿 Alergia & Rinite", query: "Quais remédios dizem na bula para alergia e rinite?" },
  { label: "💧 Desidratação / Diarreia", query: "O que diz a bula para desidratação e diarreia?" },
  { label: "🦟 Repelente / Dengue", query: "Repelente protege contra mosquito da dengue?" },
  { label: "☀️ Protetor Solar", query: "Protetor solar para proteção contra queimadura de sol" }
];

const MENSAGEM_INICIAL: MensagemChat = {
  id: "msg_intro",
  autor: "bot",
  texto:
    "Olá! Sou o Assistente de Consulta a Bulas e Rotulagens Oficiais (ANVISA) da Farmácia Poupe Mais.\n\n" +
    "Aqui você pode:\n" +
    "1. 💊 Digitar o NOME DO REMÉDIO para ver a bula oficial registrada na ANVISA (ex: Paracetamol, Dipirona, Ibuprofeno, Omeprazol);\n" +
    "2. 📋 Digitar seu PROBLEMA OU SINTOMA para consultar quais remédios dizem na bula oficial a indicação para a queixa (ex: febre, dor de cabeça, azia, tosse com catarro, cólica, refluxo).\n\n" +
    "⚠️ ALERTA SANITÁRIO OBRIGATÓRIO (ANVISA / CFM / CFF):\n" +
    "NUNCA tome medicamentos sem consultar seu médico ou farmacêutico habilitado! A automedicação é extremamente perigosa devido a INTERAÇÕES MEDICAMENTOSAS GRAVES (com outros remédios ou álcool) e contraindicações severas.",
  timestamp: "Oficial",
  resposta: {
    tipo: "ajuda_geral",
    conteudoLiteral: "",
    rodapeRegulatorio:
      "Fonte Oficial: Bulário Eletrônico & Consulta de Cosméticos da ANVISA. Informação estritamente literal não prescritiva. Não substitui consulta médica presencial.",
    linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
    nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome,
    sugestoesRapidas: [
      "Remédios para Febre",
      "Remédios para Dor de Cabeça",
      "Remédios para Azia",
      "Remédios para Tosse",
      "Cólica Menstrual",
      "Bula Paracetamol",
      "Bula Dipirona",
      "Bula Ibuprofeno"
    ]
  }
};

export function BulaFloatingChatbot() {
  const [aberto, setAberto] = useState(false);
  const [mensagemInput, setMensagemInput] = useState("");
  const [medicamentoSelecionado, setMedicamentoSelecionado] = useState<BulaOficial | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([MENSAGEM_INICIAL]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgCounter = useRef(1);

  // Rola para a mensagem mais recente
  useEffect(() => {
    if (aberto) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, aberto]);

  // Foco no input ao abrir
  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [aberto]);

  function enviarMensagem(textoParaEnviar?: string) {
    const texto = (textoParaEnviar || mensagemInput).trim();
    if (!texto) return;

    const count = msgCounter.current++;
    const horaAtual = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Mensagem do usuário
    const novaMensagemUsuario: MensagemChat = {
      id: `user_${count}`,
      autor: "usuario",
      texto,
      timestamp: horaAtual
    };

    // Processamento estritamente local pela engine de bulas
    const resposta = processarConsultaBula(texto, medicamentoSelecionado);

    // Se a resposta identificou um medicamento, atualiza o ativo
    if (resposta.medicamento) {
      setMedicamentoSelecionado(resposta.medicamento);
    }

    const novaMensagemBot: MensagemChat = {
      id: `bot_${count}_resp`,
      autor: "bot",
      texto: resposta.conteudoLiteral,
      resposta,
      timestamp: horaAtual
    };

    setMensagens((prev) => [...prev, novaMensagemUsuario, novaMensagemBot]);
    setMensagemInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      enviarMensagem();
    }
  }

  function reiniciarChat() {
    setMedicamentoSelecionado(null);
    msgCounter.current++;
    setMensagens([
      {
        id: `msg_reset_${msgCounter.current}`,
        autor: "bot",
        texto:
          "Conversa reiniciada. Selecione um medicamento ou produto cosmético registrado para consultar o texto oficial da ANVISA:",
        timestamp: "Oficial",
        resposta: {
          tipo: "ajuda_geral",
          conteudoLiteral: "",
          rodapeRegulatorio:
            "Fonte Oficial: Bulário Eletrônico & Consulta de Cosméticos da ANVISA. Informação estritamente literal não prescritiva.",
          linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
          nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome,
          sugestoesRapidas: [
            "Paracetamol",
            "Dipirona",
            "Ibuprofeno",
            "Protetor Solar FPS 50",
            "Repelente Icaridina",
            "Sérum Niacinamida"
          ]
        }
      }
    ]);
  }

  function selecionarMedicamento(medicamento: BulaOficial) {
    setMedicamentoSelecionado(medicamento);
    enviarMensagem(`Bula de ${medicamento.nomeComercial}`);
  }

  return (
    <>
      {/* 1. BOTÃO FLUTUANTE DE ACESSO AO CHATBOT DE BULAS (Sobreposto e flutuante na rolagem) */}
      {!aberto && (
        <div className="bula-floating-wrapper">
          <div className="bula-floating-hint-badge">
            <span>💬 Dúvidas sobre remédios? Consulte a Bula</span>
          </div>
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="bula-floating-trigger-btn group"
            aria-label="Abrir assistente de consulta a bulas de medicamentos da ANVISA"
            title="Tire dúvidas sobre medicamentos ou consulte quais remédios tratam seu sintoma segundo a bula oficial ANVISA"
          >
            <div className="bula-floating-icon-wrap">
              <FileText size={22} className="text-white group-hover:scale-110 transition-transform" />
            </div>
            <div className="bula-floating-text-wrap text-left">
              <span className="bula-floating-badge">Oficial ANVISA</span>
              <strong className="bula-floating-title">Bulas & Sintomas</strong>
            </div>
          </button>
        </div>
      )}

      {/* 2. JANELA FLUTUANTE DO CHATBOT */}
      {aberto && (
        <aside
          className="bula-chat-window animate-fadeInUp"
          role="dialog"
          aria-label="Chatbot de Consulta a Bulas de Medicamentos Oficiais ANVISA"
        >
          {/* Header do Chat */}
          <header className="bula-chat-header">
            <div className="flex items-center gap-3">
              <div className="bula-chat-avatar">
                <FileText size={20} className="text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="bula-chat-title">Bulas Oficiais ANVISA</h3>
                  <span className="bula-header-tag">Sem Prescrição</span>
                </div>
                <p className="bula-chat-subtitle">
                  Textos literais aprovados • RDC ANVISA nº 47/2009
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reiniciarChat}
                className="bula-btn-header-action"
                title="Reiniciar conversa e limpar histórico"
                aria-label="Reiniciar conversa"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="bula-btn-header-action"
                title="Fechar assistente de bulas"
                aria-label="Fechar janela"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Banner de Salvaguarda Regulatória Obrigatória */}
          <div className="bula-regulatory-banner">
            <AlertTriangle size={15} className="flex-shrink-0 text-amber-700 mt-0.5" />
            <p>
              <strong>Aviso Sanitário Obrigatório:</strong> Este assistente reproduz
              estritamente o texto oficial da bula registrada na ANVISA.{" "}
              <strong>Não substitui consulta médica nem orienta automedicação.</strong>
            </p>
          </div>

          {/* Seletor rápido de Sintomas e Medicamentos */}
          <div className="bula-quick-med-bar flex flex-col gap-1.5">
            <div className="flex items-center gap-2 overflow-hidden w-full">
              <span className="bula-quick-label">Sintomas:</span>
              <div className="bula-quick-chips-scroll">
                {SINTOMAS_RAPIDOS.map((sintoma, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => enviarMensagem(sintoma.query)}
                    className="bula-chip-item bula-chip-symptom"
                    title={`Consultar remédios indicados na bula para ${sintoma.label}`}
                  >
                    <span>{sintoma.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-hidden w-full">
              <span className="bula-quick-label">Remédios:</span>
              <div className="bula-quick-chips-scroll">
                {BULAS_DATABASE.map((bula) => {
                  const ativo = medicamentoSelecionado?.id === bula.id;
                  const isCosmetico = bula.tipoItem === "cosmetico";
                  return (
                    <button
                      key={bula.id}
                      type="button"
                      onClick={() => selecionarMedicamento(bula)}
                      className={`bula-chip-item ${ativo ? "bula-chip-active" : ""} ${isCosmetico ? "bula-chip-cosmetic" : ""}`}
                      title={`${isCosmetico ? "Cosmético" : "Medicamento"}: ${bula.nomeComercial}`}
                    >
                      <span>{isCosmetico ? "🧴" : "💊"}</span>
                      <span>{bula.nomeComercial.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Corpo de Mensagens */}
          <div className="bula-chat-body">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`bula-msg-row ${msg.autor === "usuario" ? "bula-msg-row-user" : "bula-msg-row-bot"}`}
              >
                <div className={`bula-msg-bubble ${msg.autor === "usuario" ? "bula-bubble-user" : "bula-bubble-bot"}`}>
                  {/* Cabeçalho do Card Bot com Título da Seção */}
                  {msg.autor === "bot" && msg.resposta?.secaoTitulo && (
                    <div className="bula-card-section-header">
                      <ShieldCheck size={14} className="text-emerald-700 flex-shrink-0" />
                      <span className="bula-card-section-title">{msg.resposta.secaoTitulo}</span>
                    </div>
                  )}

                  {/* Conteúdo da Mensagem */}
                  <div className="bula-msg-text whitespace-pre-line leading-relaxed">
                    {msg.texto}
                  </div>

                  {/* Alerta de Segurança para Consulta por Problema/Sintoma */}
                  {msg.resposta?.tipo === "consulta_problema" && (
                    <div className="bula-problem-alert-box">
                      <div className="flex items-center gap-2 font-bold text-amber-950 text-xs mb-1.5">
                        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                        Alerta Sanitário: Consulta Estritamente não Prescritiva
                      </div>
                      <p className="text-[11.5px] text-amber-900 leading-normal mb-1.5 font-medium">
                        <strong>NUNCA tome medicamentos sem consultar seu médico ou farmacêutico.</strong> A automedicação é perigosa porque existem <strong>interações medicamentosas graves</strong> (que anulam efeitos ou geram toxicidade), além de contraindicações severas.
                      </p>
                      <div className="text-[10px] text-amber-800 bg-amber-100/80 p-1.5 rounded border border-amber-300 font-semibold flex items-center gap-1">
                        <span>⚖️</span>
                        <span>Texto literal do Item 1 da Bula Oficial ANVISA (RDC nº 47/2009 e Art. 282 do CP)</span>
                      </div>
                    </div>
                  )}

                  {/* Link Oficial Governamental ANVISA */}
                  {msg.resposta?.linkFonteOficial && (
                    <div className="bula-official-source-box">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10.5px] font-semibold text-emerald-950 flex items-center gap-1 truncate">
                          🏛️ {msg.resposta.nomeFonteOficial || "Base Oficial ANVISA"}
                        </span>
                        <a
                          href={msg.resposta.linkFonteOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bula-official-link"
                          title="Consultar registro governamental oficial da ANVISA em nova aba"
                        >
                          <span>Consultar registro ANVISA</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Alerta de Bloqueio Regulatório se aplicável */}
                  {msg.resposta?.tipo === "bloqueio_regulatorio" && (
                    <div className="bula-alert-emergency-box">
                      <div className="flex items-center gap-2 font-bold text-red-900 text-xs mb-1">
                        <AlertTriangle size={15} className="text-red-600" />
                        Atendimento Clínico Presencial Necessário
                      </div>
                      <p className="text-[11px] text-red-800 leading-normal">
                        Para avaliação de sintomas, diagnóstico e prescrição individualizada,
                        consulte seu médico ou o farmacêutico responsável.
                      </p>
                    </div>
                  )}

                  {/* Alerta de Blindagem contra Engenharia Social / Jailbreak */}
                  {msg.resposta?.tipo === "bloqueio_seguranca" && (
                    <div className="bula-alert-security-box">
                      <div className="flex items-center gap-2 font-bold text-amber-900 text-xs mb-1">
                        <ShieldCheck size={15} className="text-amber-700" />
                        Salvaguarda Sanitária Ativada (ANVISA / CFM / CFF)
                      </div>
                      <p className="text-[11px] text-amber-800 leading-normal">
                        Este assistente não aceita comandos de modificação de regras, simulação de papéis (roleplay)
                        ou solicitações de orientação clínica. Consulta estritamente documental de bulas ANVISA.
                      </p>
                    </div>
                  )}

                  {/* Botões de Ação Rápida sugeridos */}
                  {msg.resposta?.sugestoesRapidas && msg.resposta.sugestoesRapidas.length > 0 && (
                    <div className="bula-suggestions-container mt-3 pt-2 border-t border-emerald-100">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Consultar tópicos oficiais:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.resposta.sugestoesRapidas.map((sugestao, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => enviarMensagem(sugestao)}
                            className="bula-suggestion-btn"
                          >
                            <span>{sugestao}</span>
                            <ChevronRight size={11} className="text-emerald-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rodapé Regulatório */}
                  {msg.resposta?.rodapeRegulatorio && (
                    <div className="bula-msg-footer-legal">
                      <Info size={11} className="flex-shrink-0 text-emerald-700" />
                      <span>{msg.resposta.rodapeRegulatorio}</span>
                    </div>
                  )}

                  <span className="bula-msg-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Campo de Entrada de Mensagem */}
          <footer className="bula-chat-footer">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviarMensagem();
              }}
              className="bula-input-form"
            >
              <input
                ref={inputRef}
                type="text"
                value={mensagemInput}
                onChange={(e) => setMensagemInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  medicamentoSelecionado
                    ? medicamentoSelecionado.tipoItem === "cosmetico"
                      ? `Pergunte sobre a rotulagem de ${medicamentoSelecionado.nomeComercial.split(" ")[0]}...`
                      : `Pergunte sobre a bula de ${medicamentoSelecionado.nomeComercial.split(" ")[0]}...`
                    : "Ex: Dipirona dá sono? / Protetor solar reaplicação..."
                }
                className="bula-text-input"
                aria-label="Digite sua pergunta sobre a bula ou rotulagem oficial ANVISA"
              />
              <button
                type="submit"
                disabled={!mensagemInput.trim()}
                className="bula-send-btn"
                aria-label="Enviar pergunta"
                title="Consultar texto oficial aprovado pela ANVISA"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="bula-input-disclaimer">
              100% Gratuito • Base Local ANVISA • Sem chaves de API externas
            </div>
          </footer>
        </aside>
      )}
    </>
  );
}
