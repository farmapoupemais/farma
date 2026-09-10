/**
 * Motor Local de Consulta a Bulas Oficiais (ANVISA) - Zero Custo de API
 * 
 * Regras Éticas e Regulatórias Invioláveis:
 * 1. NUNCA orienta condutas, prescrições ou tratamentos clínicos.
 * 2. NUNCA realiza diagnósticos de sintomas.
 * 3. Utiliza EXCLUSIVAMENTE o texto literal extraído das bulas oficiais de pacientes aprovadas pela ANVISA.
 * 4. Intercepta e bloqueia ativamente qualquer tentativa de obter orientação médica ou prescrição direta.
 */

import { BULAS_DATABASE, BulaOficial, PORTAIS_OFICIAIS_ANVISA } from "./bulas-data.ts";

export type IntencaoBula =
  | "INDICACAO"
  | "POSOLOGIA"
  | "CONTRAINDICACAO"
  | "GRAVIDEZ_LACTACAO"
  | "REACOES_ADVERSAS"
  | "SUPERDOSE"
  | "INTERACOES"
  | "ARMAZENAMENTO"
  | "BULA_COMPLETA"
  | "EMERGENCIA_DIAGNOSTICO"
  | "SEGURANCA_JAILBREAK"
  | "DESCONHECIDA";

export interface RespostaChatbot {
  tipo: "resposta_bula" | "bloqueio_regulatorio" | "bloqueio_seguranca" | "selecao_medicamento" | "ajuda_geral";
  medicamento?: BulaOficial;
  secaoTitulo?: string;
  conteudoLiteral: string;
  rodapeRegulatorio: string;
  sugestoesRapidas?: string[];
  linkFonteOficial?: string;
  nomeFonteOficial?: string;
}

/**
 * Normaliza o texto removendo diacríticos, pontuação e múltiplos espaços.
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s]/gi, " ") // remove pontuação
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detecta tentativas de engenharia social, manipulação de regras,
 * cenários fictícios (roleplay), jailbreak e comandos de injeção de prompt.
 */
export function detectarAtaqueEngenhariaSocialOuJailbreak(textoNorm: string): boolean {
  const padroesJailbreak = [
    "ignore all previous",
    "ignore previous",
    "ignore as instrucoes",
    "ignore as regras",
    "ignore suas instrucoes",
    "ignore suas regras",
    "esqueça as regras",
    "esqueca as regras",
    "esqueça todas",
    "esqueca todas",
    "desconsidere as regras",
    "desconsidere as instrucoes",
    "modo desenvolvedor",
    "developer mode",
    "dan mode",
    "jailbreak",
    "system prompt",
    "prompt de sistema",
    "suas instrucoes internas",
    "seu prompt inicial",
    "quais sao suas regras",
    "quais sao suas instrucoes",
    "finja que",
    "faca de conta",
    "atue como",
    "simule que",
    "seja um medico",
    "se voce fosse um medico",
    "personagem medico",
    "roteiro ficticio",
    "historia ficticia",
    "cenario hipotetico",
    "estudo hipotetico",
    "estudo academico sobre dose letal",
    "vida ou morte me diga o que tomar",
    "meu filho vai morrer",
    "pelo amor de deus me receite",
    "socorro me receite",
    "sou o dono da farmacia",
    "sou auditor da anvisa",
    "sou medico me responda",
    "bypass",
    "override"
  ];

  return padroesJailbreak.some((padrao) => textoNorm.includes(padrao));
}

/**
 * Detecta se a mensagem do usuário configura solicitação de diagnóstico clínico,
 * prescrição ou emergência médica, ativando a salvaguarda sanitária mandatória.
 */
export function detectarTentativaPrescricaoOuDiagnostico(textoNorm: string): boolean {
  const padroesEmergencia = [
    "o que tomo",
    "o que eu tomo",
    "o que tomar",
    "o que voce me recomenda",
    "o que me recomenda",
    "o que devo tomar",
    "qual remedio devo tomar",
    "o que e bom para",
    "o que e bom pra",
    "qual remedio e bom",
    "qual o melhor remedio",
    "qual remedio cura",
    "como curar",
    "me receite",
    "me prescreva",
    "estou com dor no peito",
    "dor no peito",
    "falta de ar",
    "dificuldade para respirar",
    "desmaio",
    "sangramento grave",
    "vomitando sangue",
    "convulsao",
    "estou passando muito mal",
    "o que eu faco agora",
    "me cure",
    "diagnostico",
    "estou com sintomas de",
    "me sinto mal o que tomar",
    "qual dosagem devo tomar para mim",
    "posso tomar o dobro para fazer efeito mais rapido"
  ];

  return padroesEmergencia.some((padrao) => textoNorm.includes(padrao));
}

/**
 * Identifica o medicamento mencionado na consulta.
 */
export function identificarMedicamento(texto: string): BulaOficial | null {
  const textoNorm = normalizarTexto(texto);

  for (const bula of BULAS_DATABASE) {
    const nomeNorm = normalizarTexto(bula.nomeComercial);
    const principioNorm = normalizarTexto(bula.principioAtivo);

    if (textoNorm.includes(nomeNorm) || textoNorm.includes(principioNorm)) {
      return bula;
    }

    for (const sinonimo of bula.sinonimos) {
      const sinNorm = normalizarTexto(sinonimo);
      // Correspondência com limite de palavra
      const regex = new RegExp(`\\b${sinNorm}\\b`, "i");
      if (regex.test(textoNorm)) {
        return bula;
      }
    }
  }

  return null;
}

/**
 * Classifica a intenção da pergunta com base em vocabulário farmacológico padronizado.
 */
export function classificarIntencao(texto: string): IntencaoBula {
  const textoNorm = normalizarTexto(texto);

  if (detectarAtaqueEngenhariaSocialOuJailbreak(textoNorm)) {
    return "SEGURANCA_JAILBREAK";
  }

  if (detectarTentativaPrescricaoOuDiagnostico(textoNorm)) {
    return "EMERGENCIA_DIAGNOSTICO";
  }

  if (
    textoNorm.includes("gravid") ||
    textoNorm.includes("gestant") ||
    textoNorm.includes("amament") ||
    textoNorm.includes("lactant") ||
    /\bbebes?\b/i.test(textoNorm) ||
    textoNorm.includes("leite materno") ||
    textoNorm.includes("parto")
  ) {
    return "GRAVIDEZ_LACTACAO";
  }

  if (
    textoNorm.includes("sono") ||
    textoNorm.includes("da sono") ||
    textoNorm.includes("efeito colateral") ||
    textoNorm.includes("efeitos colaterais") ||
    textoNorm.includes("reacao") ||
    textoNorm.includes("reacoes adversas") ||
    textoNorm.includes("males") ||
    textoNorm.includes("faz mal") ||
    textoNorm.includes("enjoo") ||
    textoNorm.includes("tontura")
  ) {
    return "REACOES_ADVERSAS";
  }

  if (
    textoNorm.includes("tomei demais") ||
    textoNorm.includes("superdose") ||
    textoNorm.includes("superdosagem") ||
    textoNorm.includes("excesso") ||
    textoNorm.includes("intoxicacao") ||
    textoNorm.includes("tomei muito") ||
    textoNorm.includes("ingestao acidental") ||
    textoNorm.includes("dobro")
  ) {
    return "SUPERDOSE";
  }

  if (
    textoNorm.includes("como tomar") ||
    textoNorm.includes("como usar") ||
    textoNorm.includes("como aplicar") ||
    textoNorm.includes("modo de uso") ||
    textoNorm.includes("reaplicar") ||
    textoNorm.includes("reaplicacao") ||
    textoNorm.includes("passar") ||
    textoNorm.includes("espalhar") ||
    textoNorm.includes("quantas gotas") ||
    textoNorm.includes("quantos comprimidos") ||
    textoNorm.includes("posologia") ||
    textoNorm.includes("dose") ||
    textoNorm.includes("dosagem") ||
    textoNorm.includes("de quantas em quantas horas") ||
    textoNorm.includes("horario") ||
    textoNorm.includes("jejum") ||
    textoNorm.includes("antes ou depois")
  ) {
    return "POSOLOGIA";
  }

  if (
    textoNorm.includes("para que serve") ||
    textoNorm.includes("serve para") ||
    textoNorm.includes("indicacao") ||
    textoNorm.includes("indicado para") ||
    textoNorm.includes("finalidade") ||
    textoNorm.includes("beneficio") ||
    textoNorm.includes("beneficios") ||
    textoNorm.includes("alivio") ||
    textoNorm.includes("funciona")
  ) {
    return "INDICACAO";
  }

  if (
    textoNorm.includes("quem nao pode") ||
    textoNorm.includes("contraindic") ||
    textoNorm.includes("contra indic") ||
    textoNorm.includes("quando nao devo") ||
    textoNorm.includes("restricoes") ||
    textoNorm.includes("alergia") ||
    textoNorm.includes("perigoso") ||
    textoNorm.includes("pressao alta") ||
    textoNorm.includes("diabetico")
  ) {
    return "CONTRAINDICACAO";
  }

  if (
    textoNorm.includes("alcool") ||
    textoNorm.includes("cerveja") ||
    textoNorm.includes("bebida") ||
    textoNorm.includes("misturar") ||
    textoNorm.includes("outro remedio") ||
    textoNorm.includes("interacao") ||
    textoNorm.includes("compatibilidade")
  ) {
    return "INTERACOES";
  }

  if (
    textoNorm.includes("como guardar") ||
    textoNorm.includes("geladeira") ||
    textoNorm.includes("armazen") ||
    textoNorm.includes("conservacao") ||
    textoNorm.includes("validade") ||
    textoNorm.includes("temperatura")
  ) {
    return "ARMAZENAMENTO";
  }

  if (
    textoNorm.includes("bula completa") ||
    textoNorm.includes("ver bula") ||
    textoNorm.includes("tudo sobre") ||
    textoNorm.includes("bula inteira") ||
    textoNorm.includes("rotulo completo") ||
    textoNorm.includes("rotulagem completa")
  ) {
    return "BULA_COMPLETA";
  }

  return "DESCONHECIDA";
}

const AVISO_REGULATORIO_PADRAO =
  "⚠️ Fonte Oficial: Bula do Paciente / Rotulagem aprovada pela ANVISA (RDC nº 47/2009 e RDC nº 752/2022). Informação estritamente literal não prescritiva. Não substitui consulta médica ou orientação presencial com o farmacêutico responsável.";

/**
 * Processa a mensagem do usuário e retorna uma resposta estritamente literal da bula,
 * respeitando os limites éticos e regulatórios sanitários.
 */
export function processarConsultaBula(mensagemUsuario: string, medicamentoAtivo?: BulaOficial | null): RespostaChatbot {
  const textoNorm = normalizarTexto(mensagemUsuario);

  // 1. Blindagem contra Engenharia Social, Roleplay, Prompt Injection e Jailbreaks
  if (detectarAtaqueEngenhariaSocialOuJailbreak(textoNorm)) {
    return {
      tipo: "bloqueio_seguranca",
      conteudoLiteral:
        "⚠️ SALVAGUARDA DE SEGURANÇA E CONFORMIDADE REGULATÓRIA (ANVISA / CFM / CFF):\n\n" +
        "Este assistente opera sob diretrizes éticas e sanitárias imutáveis (Art. 282 do Código Penal Brasileiro, RDC ANVISA nº 96/2008 e Resoluções CFF nº 727/2022 e 10/2024).\n\n" +
        "• Não são aceitos comandos de alteração de regras, personas clínicas fictícias (roleplay), simulações, cenários hipotéticos ou comandos de desenvolvedor/jailbreak.\n" +
        "• O assistente atua EXCLUSIVAMENTE transcrevendo trechos literais de bulas e rotulagens oficiais registradas na ANVISA, sem realizar diagnósticos ou prescrições médicas.\n\n" +
        "Para consultar a bula ou rotulagem oficial de um produto registrado, basta informar o nome do item (ex: Paracetamol, Dipirona, Ibuprofeno, Omeprazol, Protetor Solar FPS 50, Repelente).",
      rodapeRegulatorio: "Farmácia Poupe Mais • Segurança Sanitária Inviolável • Art. 282 do Código Penal",
      linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
      nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome,
      sugestoesRapidas: ["Ver Bula Paracetamol", "Ver Bula Dipirona", "Protetor Solar FPS 50", "Repelente Icaridina"]
    };
  }

  // 2. Salvaguarda Regulatória de Emergência ou Pedido de Diagnóstico/Prescrição
  if (detectarTentativaPrescricaoOuDiagnostico(textoNorm)) {
    return {
      tipo: "bloqueio_regulatorio",
      conteudoLiteral:
        "⚠️ AVISO REGULATÓRIO DE SAÚDE (ANVISA / CFM / CRF):\n\n" +
        "Este assistente digital tem caráter EXCLUSIVAMENTE INFORMATIVO de consulta de textos de bulas oficiais e NÃO REALIZA diagnósticos, prescrições de medicamentos ou orientação de condutas terapêuticas.\n\n" +
        "Se você estiver apresentando sintomas agudos, desconforto grave, dor torácica, falta de ar ou qualquer situação de emergência:\n" +
        "• Procure imediatamente um Pronto Atendimento ou ligue 192 (SAMU);\n" +
        "• Consulte presencialmente seu médico ou o farmacêutico responsável da Farmácia Poupe Mais.\n\n" +
        "Para consultar a bula oficial de um medicamento ou cosmético específico, informe o nome do produto (ex: Paracetamol, Dipirona, Ibuprofeno, Omeprazol, Protetor Solar, Repelente).",
      rodapeRegulatorio: "Farmácia Poupe Mais • RT Farmacêutico Dr. Raul da Costa CRF/RS 14.892",
      linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.medicamentosRegistrados.url,
      nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.medicamentosRegistrados.nome,
      sugestoesRapidas: ["Ver Bula Paracetamol", "Ver Bula Dipirona", "Protetor Solar FPS 50", "Repelente Icaridina"]
    };
  }

  // 3. Identificação do Medicamento ou Cosmético Regulamentado
  const medicamento = identificarMedicamento(mensagemUsuario) || medicamentoAtivo || null;

  if (!medicamento) {
    return {
      tipo: "selecao_medicamento",
      conteudoLiteral:
        "Olá! Sou o Assistente de Consulta a Bulas e Rotulagens Oficiais (ANVISA) da Farmácia Poupe Mais.\n\n" +
        "Para garantir sua segurança sanitária, reproduzo EXATAMENTE os textos literais aprovados e registrados na ANVISA (Bula do Paciente RDC nº 47/2009 e Rotulagem de Cosméticos RDC nº 752/2022), sem realizar diagnósticos ou orientar tratamentos.\n\n" +
        "Qual medicamento ou cosmético registrado você deseja consultar?",
      rodapeRegulatorio: AVISO_REGULATORIO_PADRAO,
      linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
      nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome,
      sugestoesRapidas: BULAS_DATABASE.map((b) => b.nomeComercial.split(" ")[0])
    };
  }

  // 4. Identificação da Seção
  const intencao = classificarIntencao(mensagemUsuario);
  const isCosmetico = medicamento.tipoItem === "cosmetico";

  let secaoTitulo = "";
  let conteudoLiteral = "";

  switch (intencao) {
    case "INDICACAO":
      secaoTitulo = isCosmetico
        ? "1. INDICAÇÃO E FINALIDADE (Rótulo Oficial ANVISA RDC nº 752/2022)"
        : "1. PARA QUE ESTE MEDICAMENTO É INDICADO?";
      conteudoLiteral = medicamento.secoes.indicacoes;
      break;

    case "POSOLOGIA":
      secaoTitulo = isCosmetico
        ? "6. MODO DE USO (Rotulagem Oficial ANVISA RDC nº 752/2022)"
        : "6. COMO DEVO USAR ESTE MEDICAMENTO? (Posologia da Bula)";
      conteudoLiteral = medicamento.secoes.posologia;
      break;

    case "CONTRAINDICACAO":
      secaoTitulo = isCosmetico
        ? "3. RESTRIÇÕES DE USO E PRECAUÇÕES"
        : "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?";
      conteudoLiteral = medicamento.secoes.contraindicacoes;
      break;

    case "GRAVIDEZ_LACTACAO":
      secaoTitulo = isCosmetico
        ? "4. USO EM GESTANTES E LACTANTES (Registro ANVISA)"
        : "4. ADVERTÊNCIAS - GRAVIDEZ E AMAMENTAÇÃO";
      conteudoLiteral = medicamento.secoes.gravidezLactacao;
      break;

    case "REACOES_ADVERSAS":
      secaoTitulo = isCosmetico
        ? "8. PRECAUÇÕES E POSSÍVEIS REAÇÕES INDESEJADAS"
        : "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR? (Reações Adversas)";
      conteudoLiteral = medicamento.secoes.reacoesAdversas;
      break;

    case "SUPERDOSE":
      secaoTitulo = isCosmetico
        ? "9. EM CASO DE INGESTÃO OU ACIDENTE"
        : "9. O QUE FAZER EM CASO DE SUPERDOSAGEM?";
      conteudoLiteral = medicamento.secoes.superdose;
      break;

    case "INTERACOES":
      secaoTitulo = isCosmetico
        ? "10. COMPATIBILIDADE E ASSOCIAÇÃO COM OUTROS PRODUTOS"
        : "10. INTERAÇÕES MEDICAMENTOSAS DA BULA";
      conteudoLiteral = medicamento.secoes.interacoes;
      break;

    case "ARMAZENAMENTO":
      secaoTitulo = isCosmetico
        ? "5. CONSERVAÇÃO E CUIDADOS (Registro ANVISA)"
        : "5. ONDE E COMO GUARDAR ESTE MEDICAMENTO?";
      conteudoLiteral = medicamento.secoes.armazenamento;
      break;

    case "BULA_COMPLETA":
      secaoTitulo = isCosmetico
        ? `Rotulagem e Dizeres Oficiais • ${medicamento.nomeComercial}`
        : `Bula Oficial Completa do Paciente • ${medicamento.nomeComercial}`;
      conteudoLiteral =
        `${medicamento.secoes.indicacoes}\n\n` +
        `${medicamento.secoes.contraindicacoes}\n\n` +
        `${medicamento.secoes.advertencias}\n\n` +
        `${medicamento.secoes.gravidezLactacao}\n\n` +
        `${medicamento.secoes.posologia}\n\n` +
        `${medicamento.secoes.reacoesAdversas}\n\n` +
        `${medicamento.secoes.superdose}\n\n` +
        `${medicamento.secoes.interacoes}`;
      break;

    default:
      // Se não especificou o tópico, traz a apresentação e as opções de navegação
      secaoTitulo = isCosmetico
        ? `Rotulagem Oficial ANVISA • ${medicamento.nomeComercial} (${medicamento.registroAnvisa})`
        : `Bula Oficial • ${medicamento.nomeComercial} (${medicamento.registroAnvisa})`;
      conteudoLiteral =
        `Apresentação Oficial: ${medicamento.apresentacao}\n` +
        `Princípio Ativo: ${medicamento.principioAtivo}\n` +
        `Categoria / Classe: ${medicamento.classeTerapeutica}\n\n` +
        `O que você deseja consultar no texto oficial registrado na ANVISA para este ${isCosmetico ? "cosmético" : "medicamento"}? Selecione uma das seções abaixo ou digite sua dúvida:`;
      break;
  }

  const nomeCurto = medicamento.nomeComercial.split(" ")[0];

  const sugestoesRapidas = isCosmetico
    ? [
        `Para que serve ${nomeCurto}?`,
        `Como usar ${nomeCurto}?`,
        `Precauções ${nomeCurto}`,
        `Reações ${nomeCurto}`,
        `${nomeCurto} na gravidez`,
        `Rotulagem completa ${nomeCurto}`
      ]
    : [
        `Para que serve ${nomeCurto}?`,
        `Como tomar ${nomeCurto}?`,
        `Contraindicações ${nomeCurto}`,
        `Efeitos colaterais ${nomeCurto}`,
        `${nomeCurto} na gravidez`,
        `Bula completa ${nomeCurto}`
      ];

  const rodapeRegulatorio = isCosmetico
    ? `Fonte Oficial: Consulta de Cosméticos da ANVISA (${medicamento.registroAnvisa}) • RDC nº 752/2022. Texto literal do registro sanitário.`
    : `Fonte Oficial: Bula do Paciente de ${medicamento.nomeComercial} (${medicamento.registroAnvisa}) • Aprovada pela ANVISA. Texto literal não prescritivo.`;

  return {
    tipo: "resposta_bula",
    medicamento,
    secaoTitulo,
    conteudoLiteral,
    rodapeRegulatorio,
    linkFonteOficial: medicamento.linkFonteOficial,
    nomeFonteOficial: medicamento.nomeFonteOficial,
    sugestoesRapidas
  };
}
