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

export type TipoRespostaChatbot =
  | "resposta_bula"
  | "consulta_problema"
  | "bloqueio_regulatorio"
  | "bloqueio_seguranca"
  | "selecao_medicamento"
  | "ajuda_geral";

export interface RespostaChatbot {
  tipo: TipoRespostaChatbot;
  medicamento?: BulaOficial;
  medicamentosRelacionados?: BulaOficial[];
  problemaIdentificado?: string;
  secaoTitulo?: string;
  conteudoLiteral: string;
  rodapeRegulatorio: string;
  sugestoesRapidas?: string[];
  linkFonteOficial?: string;
  nomeFonteOficial?: string;
}

export interface DefinicaoProblemaSintoma {
  chave: string;
  termoPrincipal: string;
  padroes: string[];
  medicamentosIds: string[];
  alertaEspecificoInteracoes?: string;
}

export interface ResultadoProblema {
  problema: DefinicaoProblemaSintoma;
  medicamentos: BulaOficial[];
}

/**
 * Mapeamento clínico-regulatório de queixas e problemas de saúde comuns
 * associados aos medicamentos da base oficial registrada na ANVISA.
 */
export const PROBLEMAS_E_SINTOMAS: DefinicaoProblemaSintoma[] = [
  {
    chave: "febre",
    termoPrincipal: "Febre e Estados Febris",
    padroes: ["febre", "febril", "temperatura alta", "estado febril", "calafrios"],
    medicamentosIds: ["paracetamol", "dipirona"],
    alertaEspecificoInteracoes:
      "Atenção: Nunca associe múltiplos antitérmicos contendo paracetamol ou dipirona sem controle médico, pois o paracetamol em excesso causa hepatotoxicidade (dano grave e irreversível ao fígado) e a dipirona pode provocar hipotensão (queda de pressão) e reações alérgicas graves."
  },
  {
    chave: "dor_cabeca",
    termoPrincipal: "Dor de Cabeça, Cefaleia e Enxaqueca",
    padroes: ["dor de cabeca", "dor na cabeca", "cefaleia", "enxaqueca", "cabeca doendo"],
    medicamentosIds: ["paracetamol", "dipirona", "ibuprofeno"],
    alertaEspecificoInteracoes:
      "Atenção: O uso abusivo de analgésicos para dor de cabeça pode causar 'cefaleia por rebote'. O ibuprofeno não deve ser usado por pacientes com úlcera, problemas renais ou hipertensão não controlada. A mistura de paracetamol com bebidas alcoólicas eleva severamente o risco de lesão hepática."
  },
  {
    chave: "dor_corpo_muscular",
    termoPrincipal: "Dor no Corpo, Dores Musculares e Lombalgia",
    padroes: [
      "dor no corpo",
      "dor muscular",
      "dores musculares",
      "dor nas costas",
      "lombalgia",
      "dor na coluna",
      "dor pos traumatica",
      "artrite",
      "torcicolo"
    ],
    medicamentosIds: ["paracetamol", "ibuprofeno", "dipirona"],
    alertaEspecificoInteracoes:
      "Atenção: Anti-inflamatórios como o ibuprofeno interagem perigosamente com anticoagulantes (risco de hemorragia grave) e reduzem o efeito de remédios de pressão alta (anti-hipertensivos)."
  },
  {
    chave: "dor_dente",
    termoPrincipal: "Dor de Dente e Processos Inflamatórios Dentários",
    padroes: ["dor de dente", "dente doendo", "inflamacao no dente", "dor dentaria"],
    medicamentosIds: ["paracetamol", "ibuprofeno", "dipirona"],
    alertaEspecificoInteracoes:
      "Atenção: A dor de dente geralmente decorre de infecção ou cárie profunda que exige avaliação do cirurgião-dentista. O uso de analgésicos apenas mascara o problema e não combate infecções bacterianas."
  },
  {
    chave: "colica",
    termoPrincipal: "Cólicas Menstruais e Espasmos Dolorosos",
    padroes: ["colica", "colica menstrual", "colicas", "dor menstrual"],
    medicamentosIds: ["ibuprofeno", "paracetamol"],
    alertaEspecificoInteracoes:
      "Atenção: O ibuprofeno é contraindicado no terceiro trimestre da gestação e para quem tem gastrite ou úlcera. Cólicas abdominais intensas e súbitas nunca devem ser medicadas sem avaliação médica para descartar apendicite ou abdômen agudo."
  },
  {
    chave: "azia_acidez",
    termoPrincipal: "Azia, Queimação Estomacal, Acidez e Má Digestão",
    padroes: [
      "azia",
      "queimacao",
      "queimacao no estomago",
      "acidez",
      "acidez estomacal",
      "ma digestao",
      "desconforto epigastrico",
      "dor no estomago",
      "empachamento",
      "estomago pesado"
    ],
    medicamentosIds: ["antiacido", "omeprazol"],
    alertaEspecificoInteracoes:
      "Atenção: Antiácidos diminuem drasticamente a absorção de antibióticos e outros medicamentos orais; tome sempre com intervalo de pelo menos 2 horas. O omeprazol pode interferir em anticoagulantes e antifúngicos. Sintomas persistentes por mais de 14 dias exigem endoscopia médica."
  },
  {
    chave: "refluxo",
    termoPrincipal: "Refluxo Gastroesofágico, Esofagite e Gastrite",
    padroes: ["refluxo", "refluxo esofagico", "esofagite", "retorno acido", "gastrite", "ulcera"],
    medicamentosIds: ["omeprazol", "antiacido"],
    alertaEspecificoInteracoes:
      "Atenção: O omeprazol atua inibindo a bomba de prótons e não deve ser mastigado nem aberto. O tratamento de refluxo deve ser diagnosticado e acompanhado por gastroenterologista. Se houver perda de peso, dificuldade para engolir ou vômito com sangue, procure pronto atendimento imediatamente."
  },
  {
    chave: "tosse_catarro",
    termoPrincipal: "Tosse com Catarro e Expectoração (Afecções Respiratórias)",
    padroes: [
      "tosse",
      "tosse com catarro",
      "catarro",
      "peito cheio",
      "expectoracao",
      "tosse produtiva",
      "bronquite leve"
    ],
    medicamentosIds: ["guaco"],
    alertaEspecificoInteracoes:
      "Atenção: O xarope de guaco contém cumarinas naturais e É CONTRAINDICADO para pacientes que tomam anticoagulantes (varfarina, heparina) pelo risco de hemorragias. Contraindicado para crianças menores de 2 anos e mulheres grávidas sem autorização médica expressa."
  },
  {
    chave: "alergia_rinite",
    termoPrincipal: "Alergias, Rinite Alérgica, Coriza e Urticária",
    padroes: [
      "alergia",
      "rinite",
      "rinite alergica",
      "coriza",
      "espirros",
      "prurido nasal",
      "coceira no nariz",
      "coceira nos olhos",
      "urticaria",
      "alergia na pele"
    ],
    medicamentosIds: ["loratadina", "soro_fisiologico"],
    alertaEspecificoInteracoes:
      "Atenção: A loratadina não deve ser associada a outros anti-histamínicos sem indicação. O uso deve ser suspenso 48 horas antes de testes alérgicos na pele. A lavagem com soro fisiológico auxilia na remoção mecânica de alérgenos sem causar efeitos sistêmicos."
  },
  {
    chave: "congestao_nasal",
    termoPrincipal: "Nariz Entupido, Congestão e Ressecamento Nasal",
    padroes: ["nariz entupido", "congestao nasal", "lavagem nasal", "nariz seco", "umidificacao nasal", "inalacao"],
    medicamentosIds: ["soro_fisiologico"],
    alertaEspecificoInteracoes:
      "Atenção: Prefira sempre solução fisiológica isotônica 0,9% para lavagem nasal e inalação. Evite descongestionantes nasais vasoconstritores tópicos (que causam dependência e elevação da pressão arterial)."
  },
  {
    chave: "desidratacao",
    termoPrincipal: "Desidratação por Diarreia ou Vômitos",
    padroes: [
      "desidratacao",
      "diarreia",
      "vomito",
      "vomitos",
      "desidratado",
      "perda de liquidos",
      "soro caseiro",
      "reidratacao"
    ],
    medicamentosIds: ["sais_reidratacao"],
    alertaEspecificoInteracoes:
      "Atenção: Os sais de reidratação oral devem ser diluídos EXATAMENTE no volume de água filtrada ou fervida indicado na embalagem. Diluir com pouca água pode provocar excesso de sódio no sangue (hipernatremia grave em crianças). Se houver vômitos persistentes ou prostração, procure socorro médico imediato."
  },
  {
    chave: "repelente_dengue",
    termoPrincipal: "Proteção contra Picadas de Mosquitos e Dengue",
    padroes: ["mosquito", "pernilongo", "dengue", "zika", "chikungunya", "picada de inseto", "mordida de inseto", "repelente"],
    medicamentosIds: ["repelente"],
    alertaEspecificoInteracoes:
      "Atenção: O repelente de icaridina 20% não deve ser aplicado em crianças menores de 2 anos sem orientação médica. Quando usado junto com protetor solar, passe o protetor primeiro, espere secar por 15 minutos e somente depois aplique o repelente."
  },
  {
    chave: "queimadura_sol",
    termoPrincipal: "Proteção contra Queimaduras Solares e Radiação UV",
    padroes: [
      "queimadura de sol",
      "queimaduras solares",
      "sol forte",
      "protecao solar",
      "raios uv",
      "fotoenvelhecimento",
      "protetor solar"
    ],
    medicamentosIds: ["protetor_fps50"],
    alertaEspecificoInteracoes:
      "Atenção: Protetores solares ajudam a prevenir queimaduras, mas não protegem contra insolação térmica. A reaplicação a cada 2 a 3 horas ou após nadar ou suar intensamente é estritamente necessária para manter a eficácia declarada."
  },
  {
    chave: "pele_seca",
    termoPrincipal: "Pele Seca, Ressecamento Intenso e Barreira Danificada",
    padroes: ["pele seca", "pele ressecada", "ressecamento", "pele aspera", "coceira por ressecamento", "hidratacao corporal"],
    medicamentosIds: ["hidratante_ceramidas"],
    alertaEspecificoInteracoes:
      "Atenção: Loções hidratantes com ceramidas restauram a barreira cutânea. Havendo fissuras com sinais de infecção (pus, calor e rubor), o uso cosmético deve ser suspenso e o paciente deve consultar um médico dermatologista."
  },
  {
    chave: "oleosidade_poros",
    termoPrincipal: "Controle de Oleosidade Facial e Poros Dilatados",
    padroes: ["oleosidade", "poros dilatados", "pele oleosa", "brilho excessivo", "viço", "manchas superficiais"],
    medicamentosIds: ["serum_niacinamida"],
    alertaEspecificoInteracoes:
      "Atenção: Faça um teste de contato antes do primeiro uso. Não aplique concomitantemente no mesmo horário com ácidos esfoliantes de alta concentração para evitar dermatite de contato."
  }
];

const PALAVRAS_IGNORADAS = new Set([
  "para",
  "como",
  "onde",
  "qual",
  "quais",
  "remedio",
  "remedios",
  "medicamento",
  "medicamentos",
  "bula",
  "bulas",
  "tomar",
  "usar",
  "servir",
  "serve",
  "estou",
  "sinto",
  "minha",
  "meu",
  "sobre",
  "quando",
  "tenho",
  "dizer",
  "dizem",
  "pessoa",
  "posso",
  "queria",
  "saber",
  "deles",
  "delas"
]);

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
 * Detecta emergências médicas graves com risco à vida (necessidade imediata de SAMU 192 ou pronto-socorro).
 */
export function detectarEmergenciaMedicaGrave(textoNorm: string): boolean {
  const padroesEmergenciaGrave = [
    "dor no peito",
    "dor forte no peito",
    "falta de ar",
    "dificuldade para respirar",
    "dificuldade de respirar",
    "asfixia",
    "desmaio",
    "perda de consciencia",
    "sangramento grave",
    "hemorragia",
    "vomitando sangue",
    "vomito com sangue",
    "convulsao",
    "ataque convulsivo",
    "estou tendo um infarto",
    "infarto",
    "sintomas de avc",
    "avc",
    "boca torta",
    "paralisia subita",
    "tentativa de suicidio",
    "ingeriu veneno",
    "overdose aguda",
    "parada cardiaca"
  ];

  return padroesEmergenciaGrave.some((padrao) => textoNorm.includes(padrao));
}

/**
 * Detecta quando o usuário exige que o bot aja como médico prescrevendo remédios
 * de forma arbitrária ou individualizada sem consulta a bulas.
 */
export function detectarTentativaPrescricaoDireta(textoNorm: string): boolean {
  const padroesPrescricao = [
    "me receite",
    "me prescreva",
    "faca minha receita",
    "me passe uma receita",
    "qual receita voce me da",
    "o que voce me receita",
    "me cure",
    "diagnostico definitivo",
    "qual dosagem devo tomar para mim",
    "posso tomar o dobro para fazer efeito mais rapido"
  ];

  return padroesPrescricao.some((padrao) => textoNorm.includes(padrao));
}

/**
 * Compatibilidade reversa com o método anterior para testes existentes.
 */
export function detectarTentativaPrescricaoOuDiagnostico(textoNorm: string): boolean {
  return detectarEmergenciaMedicaGrave(textoNorm) || detectarTentativaPrescricaoDireta(textoNorm);
}

/**
 * Busca quais medicamentos possuem indicação descrita na Seção 1 da bula oficial
 * registrada na ANVISA para o problema ou sintoma relatado pelo usuário.
 */
export function buscarMedicamentosPorProblema(texto: string): ResultadoProblema | null {
  const textoNorm = normalizarTexto(texto);

  // 1. Busca no mapeamento padronizado de problemas/sintomas clínicos
  for (const def of PROBLEMAS_E_SINTOMAS) {
    const match = def.padroes.some((padrao) => {
      const padraoNorm = normalizarTexto(padrao);
      return textoNorm.includes(padraoNorm);
    });

    if (match) {
      const medicamentos = BULAS_DATABASE.filter((b) => def.medicamentosIds.includes(b.id));
      if (medicamentos.length > 0) {
        return { problema: def, medicamentos };
      }
    }
  }

  // 2. Busca dinâmica nos termos literais da Seção 1 (Indicações) das bulas
  const palavrasRelevantes = textoNorm
    .split(" ")
    .filter((palavra) => palavra.length >= 4 && !PALAVRAS_IGNORADAS.has(palavra));

  for (const palavra of palavrasRelevantes) {
    const medsCorrespondentes = BULAS_DATABASE.filter((bula) => {
      const indicacoesNorm = normalizarTexto(bula.secoes.indicacoes);
      return indicacoesNorm.includes(palavra);
    });

    if (medsCorrespondentes.length > 0) {
      return {
        problema: {
          chave: `busca_${palavra}`,
          termoPrincipal: palavra.charAt(0).toUpperCase() + palavra.slice(1),
          padroes: [palavra],
          medicamentosIds: medsCorrespondentes.map((m) => m.id),
          alertaEspecificoInteracoes:
            "Atenção: Consulte a bula oficial e não utilize nenhum medicamento sem a prévia avaliação e diagnóstico do seu médico ou farmacêutico."
        },
        medicamentos: medsCorrespondentes
      };
    }
  }

  return null;
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
 * Monta a resposta para consultas focadas em um medicamento ou cosmético específico.
 */
function responderBulaMedicamento(medicamento: BulaOficial, mensagemUsuario: string): RespostaChatbot {
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
        `Interações ${nomeCurto}`,
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

/**
 * Monta a resposta para consultas de sintomas ou problemas, citando quais medicamentos
 * possuem a indicação em sua bula oficial registrada na ANVISA (Item 1), e reforçando com máxima
 * firmeza que a automedicação é vedada e que existem graves interações e contraindicações.
 */
function responderConsultaProblema(resultado: ResultadoProblema): RespostaChatbot {
  const { problema, medicamentos } = resultado;

  let texto =
    `⚠️ ALERTA SANITÁRIO OBRIGATÓRIO (ANVISA / CFM / CFF):\n` +
    `As informações a seguir foram extraídas ESTRITAMENTE do Item 1 ("Para que este medicamento é indicado?") das bulas oficiais de pacientes aprovadas pela ANVISA.\n\n` +
    `🛑 NUNCA TOME MEDICAMENTOS SEM CONSULTAR UM MÉDICO OU FARMACÊUTICO HABILITADO!\n` +
    `A automedicação é extremamente perigosa pelos seguintes motivos comprovados nas bulas:\n` +
    `• INTERAÇÕES MEDICAMENTOSAS GRAVES: Combinar medicamentos entre si, com álcool ou com outros fármacos pode anular o efeito do tratamento ou provocar toxicidade severa (lesão hepática, hemorragias digestivas graves, arritmias ou queda perigosa da pressão arterial).\n` +
    `• CONTRAINDICAÇÕES CRÍTICAS: Medicamentos indicados para um sintoma podem ser contraindicados para quem tem pressão alta, diabetes, histórico de úlceras gástricas, insuficiência renal ou hepática, asma ou para gestantes e lactantes.\n` +
    `• MASCARAMENTO DE DOENÇAS: Aliviar sintomas sem acompanhamento médico pode atrasar o diagnóstico de condições clínicas graves que requerem intervenção imediata.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 REMÉDIOS COM INDICAÇÃO NA BULA OFICIAL ANVISA PARA: ${problema.termoPrincipal.toUpperCase()}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (problema.alertaEspecificoInteracoes) {
    texto += `⚡ ALERTA ESPECÍFICO DE INTERAÇÕES E CUIDADOS:\n${problema.alertaEspecificoInteracoes}\n\n`;
  }

  for (const med of medicamentos) {
    const isCosmetico = med.tipoItem === "cosmetico";
    texto +=
      `${isCosmetico ? "🧴" : "💊"} ${med.nomeComercial.toUpperCase()} (${med.principioAtivo})\n` +
      `• Registro Sanitário ANVISA: ${med.registroAnvisa}\n` +
      `• Categoria / Classe: ${med.classeTerapeutica}\n\n` +
      `📖 O QUE DIZ A BULA OFICIAL (Item 1 - Indicação Literal):\n` +
      `"${med.secoes.indicacoes.replace(/^1\..*?\n/, "").trim()}"\n\n` +
      `⚠️ PRINCIPAIS CONTRAINDICAÇÕES DA BULA (Item 3):\n` +
      `"${med.secoes.contraindicacoes.replace(/^3\..*?\n/, "").trim()}"\n\n` +
      `⚠️ INTERAÇÕES PERIGOSAS DESCRITAS NA BULA (Item 10):\n` +
      `"${med.secoes.interacoes.replace(/^10\..*?\n/, "").trim()}"\n\n` +
      `────────────────────────────────\n\n`;
  }

  texto +=
    `💬 ORIENTAÇÃO DE CONDUTA ÉTICA:\n` +
    `Antes de iniciar qualquer uso, consulte presencialmente o farmacêutico responsável da Farmácia Poupe Mais (Dr. Raul da Costa CRF/RS 14.892) ou seu médico assistente.`;

  const sugestoes: string[] = [];
  for (const med of medicamentos.slice(0, 3)) {
    const nomeCurto = med.nomeComercial.split(" ")[0];
    sugestoes.push(`Contraindicações ${nomeCurto}`);
    sugestoes.push(`Interações ${nomeCurto}`);
  }
  sugestoes.push("Consultar Bulário ANVISA");

  return {
    tipo: "consulta_problema",
    problemaIdentificado: problema.termoPrincipal,
    medicamentosRelacionados: medicamentos,
    secaoTitulo: `Bulas Oficiais ANVISA • Indicação para ${problema.termoPrincipal}`,
    conteudoLiteral: texto,
    rodapeRegulatorio:
      "⚠️ Fonte Oficial: Bula do Paciente aprovada pela ANVISA (RDC nº 47/2009). Informação estritamente literal não prescritiva. Não substitui consulta médica ou farmacêutica.",
    linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
    nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome,
    sugestoesRapidas: sugestoes
  };
}

/**
 * Processa a mensagem do usuário e retorna uma resposta estritamente literal da bula,
 * respeitando os limites éticos e regulatórios sanitários.
 */
export function processarConsultaBula(
  mensagemUsuario: string,
  medicamentoAtivo?: BulaOficial | null
): RespostaChatbot {
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
        "Para consultar a bula ou rotulagem oficial de um produto registrado, basta informar o nome do item (ex: Paracetamol, Dipirona, Ibuprofeno, Omeprazol, Protetor Solar FPS 50, Repelente) ou o problema/sintoma para verificação de indicação oficial.",
      rodapeRegulatorio: "Farmácia Poupe Mais • Segurança Sanitária Inviolável • Art. 282 do Código Penal",
      linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
      nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome,
      sugestoesRapidas: ["Ver Bula Paracetamol", "Ver Bula Dipirona", "Febre", "Dor de cabeça", "Azia"]
    };
  }

  // 2. Salvaguarda Regulatória de Emergência com Risco de Vida (Encaminhamento Imediato SAMU 192)
  if (detectarEmergenciaMedicaGrave(textoNorm)) {
    return {
      tipo: "bloqueio_regulatorio",
      conteudoLiteral:
        "⚠️ AVISO REGULATÓRIO DE SAÚDE (ANVISA / CFM / CRF):\n\n" +
        "Os sintomas descritos (como dor no peito, falta de ar grave, perda de consciência, vômito com sangue ou convulsão) configuram emergência médica com risco iminente à vida!\n\n" +
        "Este assistente digital tem caráter EXCLUSIVAMENTE INFORMATIVO de consulta de textos de bulas oficiais e NÃO REALIZA diagnósticos, prescrições de medicamentos ou orientação de condutas terapêuticas.\n\n" +
        "• Procure imediatamente um Pronto Atendimento ou ligue 192 (SAMU);\n" +
        "• Não tente tomar medicamentos por conta própria sem avaliação médica emergencial.",
      rodapeRegulatorio: "Farmácia Poupe Mais • RT Farmacêutico Dr. Raul da Costa CRF/RS 14.892",
      linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.medicamentosRegistrados.url,
      nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.medicamentosRegistrados.nome,
      sugestoesRapidas: ["Ligue 192 SAMU", "Procurar Pronto Socorro", "Ver Bula Paracetamol"]
    };
  }

  // 3. Identificação de Medicamento ou Cosmético Específico
  const medicamento = identificarMedicamento(mensagemUsuario);

  // Se o usuário especificou um medicamento conhecido
  if (medicamento) {
    return responderBulaMedicamento(medicamento, mensagemUsuario);
  }

  // Se o usuário tem um medicamento ativo e não mencionou um sintoma/problema diferente
  if (medicamentoAtivo && !buscarMedicamentosPorProblema(mensagemUsuario)) {
    return responderBulaMedicamento(medicamentoAtivo, mensagemUsuario);
  }

  // 4. Verificação de Busca Reversa por Problema/Sintoma ("quais remédios dizem na bula o problema da pessoa")
  const resultadoProblema = buscarMedicamentosPorProblema(mensagemUsuario);
  if (resultadoProblema) {
    return responderConsultaProblema(resultadoProblema);
  }

  // 5. Prescrição direta arbitrária sem sintoma reconhecido
  if (detectarTentativaPrescricaoDireta(textoNorm)) {
    return {
      tipo: "bloqueio_regulatorio",
      conteudoLiteral:
        "⚠️ AVISO REGULATÓRIO DE SAÚDE (ANVISA / CFM / CRF):\n\n" +
        "Este assistente digital tem caráter EXCLUSIVAMENTE INFORMATIVO de consulta de textos de bulas oficiais e NÃO REALIZA diagnósticos, prescrições de medicamentos ou indicação de tratamentos clínicos personalizados.\n\n" +
        "• Para prescrições e dosagens individualizadas, consulte seu médico ou o farmacêutico responsável da Farmácia Poupe Mais.\n" +
        "• Para consultar quais medicamentos possuem indicação oficial registrada na ANVISA para um determinado sintoma, informe a queixa (ex: 'febre', 'dor de cabeça', 'azia', 'tosse com catarro', 'cólica').\n" +
        "• Para consultar a bula de um remédio específico, informe o nome (ex: Paracetamol, Dipirona, Ibuprofeno, Omeprazol).",
      rodapeRegulatorio: "Farmácia Poupe Mais • RT Farmacêutico Dr. Raul da Costa CRF/RS 14.892",
      linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.medicamentosRegistrados.url,
      nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.medicamentosRegistrados.nome,
      sugestoesRapidas: ["Febre", "Dor de cabeça", "Azia e Queimação", "Tosse com catarro", "Bula Paracetamol"]
    };
  }

  // 6. Mensagem de Ajuda e Seleção de Medicamento ou Sintoma
  return {
    tipo: "selecao_medicamento",
    conteudoLiteral:
      "Olá! Sou o Assistente de Consulta a Bulas e Rotulagens Oficiais (ANVISA) da Farmácia Poupe Mais.\n\n" +
      "Para garantir sua segurança sanitária, reproduzo EXATAMENTE os textos literais aprovados e registrados na ANVISA (Bula do Paciente RDC nº 47/2009 e Rotulagem de Cosméticos RDC nº 752/2022), sem realizar diagnósticos ou prescrever tratamentos.\n\n" +
      "Você pode consultar de duas formas:\n" +
      "1. Digite o NOME DO MEDICAMENTO (ex: Paracetamol, Dipirona, Ibuprofeno, Omeprazol, Protetor Solar, Repelente);\n" +
      "2. Digite o PROBLEMA OU SINTOMA (ex: Febre, Dor de cabeça, Azia, Tosse com catarro, Cólica) para ver quais remédios dizem na bula oficial a indicação para a sua queixa e quais as contraindicações e riscos de interações.",
    rodapeRegulatorio: AVISO_REGULATORIO_PADRAO,
    linkFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.url,
    nomeFonteOficial: PORTAIS_OFICIAIS_ANVISA.bularioEletronico.nome,
    sugestoesRapidas: [
      "Febre",
      "Dor de cabeça",
      "Azia e Queimação",
      "Tosse com catarro",
      "Cólica menstrual",
      "Paracetamol",
      "Dipirona",
      "Ibuprofeno"
    ]
  };
}
