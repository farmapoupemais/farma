"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, X, RotateCcw, Send, ExternalLink } from "lucide-react";
import {
  processarConsultaBula,
  RespostaChatbot
} from "@/lib/bula-chatbot-engine";
import { BulaOficial, PORTAIS_OFICIAIS_ANVISA } from "@/lib/bulas-data";

interface MensagemChat {
  id: string;
  autor: "usuario" | "bot";
  texto: string;
  resposta?: RespostaChatbot;
  timestamp: string;
}

const MENSAGEM_INICIAL: MensagemChat = {
  id: "msg_intro",
  autor: "bot",
  texto:
    "Olá! Como posso ajudar você hoje?\n\n" +
    "Estou aqui para tirar dúvidas com base exclusivamente nas bulas oficiais aprovadas pela ANVISA:\n\n" +
    "• Se você está sentindo algo, diga o que você sente (ex: 'estou com dor de cabeça', 'febre', 'azia', 'tosse'), e eu indicarei os remédios que na bula oficial dizem tratar, reforçando a procura de um médico pois podem haver outras causas que só ele sabe identificar.\n\n" +
    "• Se você quer saber sobre um remédio, diga o nome dele (ex: 'Dipirona', 'Paracetamol', 'Omeprazol', 'Ibuprofeno'), e eu trarei o que a bula diz para que ele serve.",
  timestamp: "Oficial",
  resposta: {
    tipo: "ajuda_geral",
    conteudoLiteral: "",
    rodapeRegulatorio:
      "Fonte Oficial: Bulário Eletrônico da ANVISA (RDC nº 47/2009). Informação estritamente literal não prescritiva.",
    linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
    nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome
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
          "Conversa reiniciada. Como posso ajudar você agora?\n\n" +
          "• Diga o que você está sentindo (para eu indicar os remédios que na bula oficial dizem tratar, reforçando a procura de um médico pois podem haver outras causas que só ele sabe identificar);\n" +
          "• Ou informe o nome do remédio para ver para que ele serve.",
        timestamp: "Oficial",
        resposta: {
          tipo: "ajuda_geral",
          conteudoLiteral: "",
          rodapeRegulatorio:
            "Fonte Oficial: Bulário Eletrônico da ANVISA (RDC nº 47/2009). Informação estritamente literal não prescritiva.",
          linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
          nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome
        }
      }
    ]);
  }

  return (
    <>
      {/* BOTÃO FLUTUANTE ÚNICO: 'Você precisa de ajuda?' */}
      {!aberto && (
        <div className="bula-floating-wrapper">
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="bula-floating-trigger-btn"
            aria-label="Você precisa de ajuda?"
            title="Você precisa de ajuda? Consulte informações oficiais de bulas de remédios da ANVISA"
          >
            <HelpCircle size={18} className="bula-help-icon" />
            <span className="bula-help-text">Você precisa de ajuda?</span>
          </button>
        </div>
      )}

      {/* JANELA FLUTUANTE DO ASSISTENTE DE AJUDA */}
      {aberto && (
        <aside
          className="bula-chat-window animate-fadeInUp"
          role="dialog"
          aria-label="Assistente de Ajuda e Consulta a Bulas ANVISA"
        >
          {/* Header do Chat */}
          <header className="bula-chat-header">
            <div className="flex items-center gap-2.5">
              <div className="bula-chat-avatar">
                <HelpCircle size={18} className="text-emerald-700" />
              </div>
              <div>
                <h3 className="bula-chat-title">Assistente de Ajuda &amp; Bulas</h3>
                <p className="bula-chat-subtitle">Bulas Oficiais ANVISA • Sem Prescrição</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reiniciarChat}
                className="bula-btn-header-action"
                title="Limpar conversa"
                aria-label="Limpar conversa"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="bula-btn-header-action"
                title="Fechar janela de ajuda"
                aria-label="Fechar janela"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Corpo de Mensagens */}
          <div className="bula-chat-body">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`bula-msg-row ${msg.autor === "usuario" ? "bula-msg-row-user" : "bula-msg-row-bot"}`}
              >
                <div className={`bula-msg-bubble ${msg.autor === "usuario" ? "bula-bubble-user" : "bula-bubble-bot"}`}>
                  {/* Título da Seção se aplicável */}
                  {msg.autor === "bot" && msg.resposta?.secaoTitulo && (
                    <div className="bula-card-section-header">
                      <span className="bula-card-section-title">{msg.resposta.secaoTitulo}</span>
                    </div>
                  )}

                  {/* Texto da Mensagem */}
                  <div className="bula-msg-text whitespace-pre-line leading-relaxed">
                    {msg.texto}
                  </div>

                  {/* Link Oficial Governamental ANVISA */}
                  {msg.resposta?.linkFonteOficial && (
                    <div className="bula-official-source-box">
                      <a
                        href={msg.resposta.linkFonteOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bula-official-link"
                        title="Consultar registro governamental oficial da ANVISA em nova aba"
                      >
                        <span>Consultar registro oficial na ANVISA</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}

                  {/* Rodapé Regulatório */}
                  {msg.resposta?.rodapeRegulatorio && (
                    <div className="bula-msg-footer-legal">
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
                placeholder="Digite o que está sentindo ou o nome de um remédio..."
                className="bula-text-input"
                aria-label="Digite o que está sentindo ou o nome de um remédio"
              />
              <button
                type="submit"
                disabled={!mensagemInput.trim()}
                className="bula-send-btn"
                aria-label="Enviar pergunta"
                title="Enviar"
              >
                <Send size={15} />
                <span>Enviar</span>
              </button>
            </form>
          </footer>
        </aside>
      )}
    </>
  );
}
