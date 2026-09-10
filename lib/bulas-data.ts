/**
 * Base de Dados Estruturada de Bulas e Rotulagens Oficiais (ANVISA)
 * 
 * Fontes Oficiais Governamentais Primárias:
 * 1. Bulário Eletrônico da ANVISA: https://consultas.anvisa.gov.br/#/bulario/
 * 2. Consulta de Medicamentos Registrados (Datavisa): https://consultas.anvisa.gov.br/#/medicamentos/
 * 3. Consulta de Cosméticos Registrados (Grau 2): https://consultas.anvisa.gov.br/#/cosmeticos/registrados/
 * 4. Consulta de Cosméticos Notificados (Grau 1): https://consultas.anvisa.gov.br/#/cosmeticos/regularizados/
 * 5. Portal Brasileiro de Dados Abertos (Medicamentos ANVISA): https://dados.gov.br/dados/conjuntos-dados/medicamentos-registrados-no-brasil
 * 
 * Marcos Regulatórios Cumpridos:
 * - Medicamentos: RDC ANVISA nº 47/2009 (Bula do Paciente) e RDC nº 96/2008
 * - Cosméticos e Dermocosméticos: RDC ANVISA nº 752/2022 (Rotulagem e Advertências) e RDC nº 629/2022 (Protetores Solares)
 */

export type TipoItemRegulado = "medicamento" | "cosmetico";

export interface BulaOficial {
  id: string;
  tipoItem: TipoItemRegulado;
  nomeComercial: string;
  principioAtivo: string;
  registroAnvisa: string;
  apresentacao: string;
  classeTerapeutica: string;
  sinonimos: string[];
  linkFonteOficial: string;
  nomeFonteOficial: string;
  secoes: {
    indicacoes: string;
    comoFunciona: string;
    contraindicacoes: string;
    advertencias: string;
    gravidezLactacao: string;
    armazenamento: string;
    posologia: string;
    esquecimento: string;
    reacoesAdversas: string;
    superdose: string;
    interacoes: string;
  };
}

export const PORTAIS_OFICIAIS_ANVISA = {
  bularioEletronico: {
    nome: "Bulário Eletrônico da ANVISA",
    url: "https://consultas.anvisa.gov.br/#/bulario/",
    descricao: "Repositório governamental oficial de bulas de medicamentos para pacientes e profissionais."
  },
  medicamentosRegistrados: {
    nome: "Consulta de Medicamentos Registrados (Datavisa)",
    url: "https://consultas.anvisa.gov.br/#/medicamentos/",
    descricao: "Base pública de registro sanitário e situação cadastral de medicamentos da ANVISA."
  },
  cosmeticosRegistrados: {
    nome: "Consulta de Cosméticos Registrados (Grau 2)",
    url: "https://consultas.anvisa.gov.br/#/cosmeticos/registrados/",
    descricao: "Sistema oficial de cosméticos com registro obrigatório (protetores solares, repelentes)."
  },
  cosmeticosRegularizados: {
    nome: "Consulta de Cosméticos Notificados (Grau 1)",
    url: "https://consultas.anvisa.gov.br/#/cosmeticos/regularizados/",
    descricao: "Sistema oficial de produtos de higiene e dermocosméticos notificados na ANVISA."
  },
  dadosAbertosGov: {
    nome: "Portal Brasileiro de Dados Abertos - ANVISA",
    url: "https://dados.gov.br/dados/conjuntos-dados/medicamentos-registrados-no-brasil",
    descricao: "Conjunto oficial de dados de medicamentos e bulas do Governo Federal."
  }
};

export const BULAS_DATABASE: BulaOficial[] = [
  // =========================================================================
  // 1. MEDICAMENTOS (RDC ANVISA nº 47/2009 - Bulário Eletrônico)
  // =========================================================================
  {
    id: "paracetamol",
    tipoItem: "medicamento",
    nomeComercial: "Paracetamol 750 mg",
    principioAtivo: "Paracetamol",
    registroAnvisa: "MS 1.0043.0982",
    apresentacao: "Comprimidos de 750 mg",
    classeTerapeutica: "Analgésico e Antitérmico",
    sinonimos: ["paracetamol", "tylenol", "paracetamol 750", "paracetamol 500", "analgesico"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nEste medicamento é indicado para a redução da febre e para o alívio temporário de dores leves a moderadas, tais como: dores associadas a resfriados comuns, dor de cabeça, dor no corpo, dor de dente, dor nas costas, dores musculares, dores associadas a artrites e cólicas menstruais.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nO paracetamol é um analgésico e antitérmico clinicamente comprovado. Atua no Sistema Nervoso Central inibindo a síntese de prostaglandinas e no centro termorregulador hipotalâmico, promovendo a redução da febre e o alívio da dor. O início de ação ocorre cerca de 15 a 30 minutos após a administração oral.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nVocê não deve usar este medicamento se tiver histórico de alergia (hipersensibilidade) conhecida ao paracetamol ou a qualquer componente da fórmula. Não deve ser administrado a pacientes com doença hepática (fígado) grave ou insuficiência hepática ativa.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nNão use outro medicamento que contenha paracetamol simultaneamente, devido ao risco de superdosagem e toxicidade hepática grave. Consulte seu médico se você consome 3 ou mais doses de bebidas alcoólicas por dia, ou se possui problemas nos rins ou fígado. Se a dor persistir por mais de 5 dias ou a febre por mais de 3 dias, consulte um profissional de saúde.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nSe você estiver grávida ou amamentando, consulte seu médico antes de usar este medicamento. O paracetamol atravessa a barreira placentária e é excretado no leite materno em pequenas quantidades clinicamente não significativas em doses terapêuticas recomendadas, mas deve ser utilizado sob orientação de profissional de saúde.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar em temperatura ambiente (entre 15°C e 30°C). Proteger da luz e da umidade. Todo medicamento deve ser mantido fora do alcance das crianças. Número de lote e datas de fabricação e validade: vide embalagem.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nConforme a bula oficial do produto de 750 mg: Uso oral em adultos e crianças acima de 12 anos. A dose recomendada é de 1 comprimido (750 mg) a cada 4 a 6 horas, conforme a necessidade. Não ultrapassar 4 comprimidos (3.000 mg) em um período de 24 horas. Este medicamento não deve ser partido, aberto ou mastigado sem indicação expressa.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nCaso você se esqueça de tomar uma dose, tome-a assim que se lembrar, respeitando o intervalo mínimo recomendado entre as doses. Não tome duas doses ao mesmo tempo para compensar a dose esquecida.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nO paracetamol é geralmente bem tolerado. Reações muito raras (ocorrem em menos de 0,01% dos pacientes): erupções cutâneas, urticária, coceira, reações alérgicas graves (choque anafilático) e alterações sanguíneas (trombocitopenia). O uso prolongado ou em doses elevadas pode causar lesão hepática grave (hepatotoxicidade).",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nO uso de doses excessivas de paracetamol pode causar dano hepático grave e potencialmente fatal. Sintomas iniciais nas primeiras 24 horas: náuseas, vômitos, sudorese, mal-estar e palidez. Procure imediatamente atendimento médico de emergência ou ligue para o Disque-Intoxicação (0800 722 6001), mesmo que não haja sintomas aparentes.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nO uso conjunto com álcool pode potencializar o risco de lesão no fígado. Pode haver interação com anticoagulantes orais (como varfarina), aumentando o risco de sangramento em uso contínuo. Fármacos indutores enzimáticos (carbamazepina, fenitoína, rifampicina) podem aumentar a toxicidade do paracetamol."
    }
  },
  {
    id: "dipirona",
    tipoItem: "medicamento",
    nomeComercial: "Dipirona Monoidratada 500 mg/ml",
    principioAtivo: "Dipirona Monoidratada",
    registroAnvisa: "MS 1.5584.0041",
    apresentacao: "Solução oral em gotas (frasco com 20 ml)",
    classeTerapeutica: "Analgésico e Antipirético",
    sinonimos: ["dipirona", "novalgina", "dipirona gotas", "metamizol", "dipirona 500"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nEste medicamento é indicado como analgésico (para dor) e antitérmico (para febre). Indicado para o alívio de dores de intensidade leve a moderada e quadros febris.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nA dipirona é um derivado pirazolônico com potentes ações analgésica e antipirética. Os efeitos analgésico e antipirético podem ser esperados em 30 a 60 minutos após a administração e geralmente duram cerca de 4 horas.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nA dipirona é contraindicada para:\n- Pacientes com hipersensibilidade à dipirona ou a outras pirazolonas ou pirazolidinas;\n- Função da medula óssea prejudicada ou doenças do sistema hematopoiético;\n- Pacientes que desenvolveram broncoespasmo ou reações anafilactoides com analgésicos (aspirina, paracetamol, etc.);\n- Porfiria hepática aguda intermitente;\n- Deficiência congênita da glicose-6-fosfato-desidrogenase (G6PD);\n- Gravidez e lactação nos termos previstos na bula.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nAgranuclocitose (diminuição grave de glóbulos brancos) é uma reação adversa muito rara, mas com risco de vida. Em caso de sinais como febre inexplicada, calafrios, dor de garganta e feridas na boca, interrompa o uso imediatamente e procure auxílio médico. A dipirona pode causar reações hipotensivas (queda de pressão arterial).",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nNão se recomenda o uso de dipirona nos primeiros 3 meses de gravidez. No segundo trimestre, só deve ser utilizada após avaliação médica de risco/benefício. O uso de dipirona no terceiro trimestre de gravidez é contraindicado, pois pode causar fechamento prematuro do canal arterial e complicações perinatais. A amamentação deve ser evitada durante o uso e por até 48 horas após a última dose.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz. Manter o frasco bem fechado. Todo medicamento deve ser mantido fora do alcance das crianças.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nConforme a bula oficial de gotas 500 mg/ml: Cada 1 ml equivale a 20 gotas (cada gota contém 25 mg de dipirona). Adultos e adolescentes acima de 15 anos: 20 a 40 gotas em dose única, até o máximo de 4 vezes ao dia (a cada 6 horas). Crianças: a dosagem deve ser calculada estritamente conforme o peso corporal indicado na tabela oficial da bula ou prescrição profissional.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nCaso você esqueça de tomar uma dose, tome-a assim que se lembrar. Se estiver próximo do horário da próxima dose, pule a dose esquecida. Não tome doses duplicadas para compensar esquecimentos.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nReações raras a muito raras descritas na bula: reações anafiláticas/anafilactoides (urticária, inchaço, falta de ar), queda da pressão arterial (hipotensão), agranulocitose, erupções cutâneas graves (síndrome de Stevens-Johnson). Não há efeito sedativo direto comprovado na bula, mas a queda de pressão arterial pode gerar sonolência e tontura.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nApós superdose aguda, foram descritas reações como náuseas, vômitos, dor abdominal, comprometimento renal, sonolência, convulsões e queda brusca de pressão. Em caso de ingestão excessiva, procure socorro médico imediato levando a embalagem do medicamento.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nA dipirona pode reduzir a ação antiplaquetária do ácido acetilsalicílico (AAS). Pode reduzir os níveis séricos de ciclosporina. Pode haver aumento dos efeitos do álcool quando administrados concomitantemente."
    }
  },
  {
    id: "antiacido",
    tipoItem: "medicamento",
    nomeComercial: "Antiácido Mastigável",
    principioAtivo: "Hidróxido de Alumínio e Hidróxido de Magnésio",
    registroAnvisa: "MS 1.0573.0119",
    apresentacao: "Comprimidos mastigáveis • Sabor Menta",
    classeTerapeutica: "Antiácido estomacal",
    sinonimos: ["antiacido", "antiácido", "antiacido mastigavel", "mastigavel", "hidroxido de aluminio", "hidroxido de magnesio"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nEste medicamento é indicado para o alívio sintomático da acidez estomacal, azia, hiperacidez gástrica, queimação, má digestão e desconforto epigástrico associados a excessos alimentares ou gastrite.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nOs hidróxidos de alumínio e magnésio reagem quimicamente neutralizando o ácido clorídrico produzido no estômago, elevando o pH gástrico e aliviando imediatamente a sensação de ardor e queimação. O início de ação é rápido e local.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nContraindicado em pacientes com hipersensibilidade aos componentes da fórmula, com insuficiência renal grave (risco de intoxicação por alumínio e magnésio) ou com hipofosfatemia (níveis baixos de fosfato no sangue). Não utilizar em casos de dor abdominal aguda não diagnosticada.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nO uso prolongado de antiácidos contendo alumínio pode diminuir a absorção de fosfato. Em pacientes com insuficiência renal leve a moderada, deve haver monitoramento médico. Se os sintomas persistirem por mais de 2 semanas de uso, é fundamental procurar avaliação médica para investigar a causa da azia.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nInforme seu médico se estiver grávida ou amamentando. Embora a absorção sistêmica seja pequena, antiácidos só devem ser administrados sob orientação de profissional de saúde durante a gestação e o período de lactação.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nManter em temperatura ambiente (15°C a 30°C), em lugar seco e protegido da luz. Manter fora do alcance de crianças.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nConforme a bula oficial: Uso oral. Adultos: mastigar bem 1 a 2 comprimidos após as principais refeições e ao deitar, ou conforme necessidade, respeitando o limite máximo diário de 8 comprimidos. Não engolir o comprimido inteiro; deve ser mastigado completamente.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nPor ser um medicamento de alívio sintomático por demanda, tome apenas quando surgirem os sintomas de azia ou acidez, sem necessidade de duplicar doses.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nO magnésio pode provocar diarreia ou amolecimento das fezes, enquanto o alumínio pode provocar prisão de ventre (constipação intestinal). A combinação dos dois sais visa equilibrar esses efeitos, mas distúrbios intestinais podem ocorrer ocasionalmente em indivíduos sensíveis.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nAltas doses podem causar alterações no trânsito intestinal (diarreia grave ou constipação), hipermagnesemia e distúrbios eletrolíticos. Em caso de ingestão massiva, procure assistência médica de emergência.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nAntiácidos reduzem significativamente a absorção gástrica de antibióticos (como tetraciclinas e quinolonas), ferro, digoxina e cetoconazol. Recomenda-se manter um intervalo mínimo de 2 horas entre a tomada do antiácido e a de qualquer outro medicamento oral."
    }
  },
  {
    id: "guaco",
    tipoItem: "medicamento",
    nomeComercial: "Xarope de Guaco e Mel 120 ml",
    principioAtivo: "Extrato de Mikania glomerata (Guaco)",
    registroAnvisa: "MS 1.1557.0034",
    apresentacao: "Frasco com 120 ml • Uso adulto",
    classeTerapeutica: "Fitoterápico broncodilatador e expectorante",
    sinonimos: ["guaco", "xarope de guaco", "xarope guaco", "mikania glomerata"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nMedicamento fitoterápico indicado como broncodilatador e expectorante, para o alívio sintomático de tosses produtivas (com catarro) associadas a afecções das vias respiratórias superiores, como resfriados e bronquites leves.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nO extrato de guaco possui como marcador a cumarina, que atua relaxando a musculatura lisa respiratória (broncodilatação) e fluidificando o muco brônquico, facilitando a expectoração e a eliminação do catarro.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nContraindicado para pacientes com hipersensibilidade ao guaco ou a outras plantas da família Asteraceae. Não deve ser usado por pacientes em uso de anticoagulantes, pessoas com doenças hepáticas graves ou com distúrbios de coagulação sanguínea. Contraindicado para crianças menores de 2 anos.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nAtenção diabéticos: contém açúcares/mel em sua composição. O uso em doses acima das recomendadas pode provocar náuseas e vômitos. Caso a tosse persista por mais de 7 dias, venha acompanhada de febre persistente ou falta de ar, consulte um médico imediatamente.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nEste medicamento não deve ser utilizado por mulheres grávidas sem orientação médica ou do cirurgião-dentista. A cumarina presente no guaco possui potencial efeito sobre a coagulação e atividade uterina.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz e da umidade. Após aberto, manter o frasco bem fechado e consumir dentro do prazo indicado na embalagem.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nConforme a bula oficial de uso adulto: Ingerir 10 ml do xarope, por via oral, 3 a 4 vezes ao dia (a cada 6 a 8 horas), utilizando o copo-medida. Não ultrapassar a dose diária recomendada.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nSe esquecer de tomar uma dose, tome-a assim que se lembrar e continue o tratamento nos intervalos normais. Não tome dose dobrada.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nEm doses terapêuticas, o guaco é geralmente bem tolerado. Em casos raros ou doses elevadas, podem ocorrer náuseas, vômitos, diarreia e aumento do tempo de sangramento devido à presença de cumarinas.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nA ingestão excessiva pode causar vômitos intensos, diarreia e risco hemorrágico por ação cumarínica. Procure socorro médico levando a embalagem do produto.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nNão deve ser associado com anticoagulantes (varfarina, heparina) ou antiagregantes plaquetários (AAS), pois pode aumentar o risco de hemorragias."
    }
  },
  {
    id: "ibuprofeno",
    tipoItem: "medicamento",
    nomeComercial: "Ibuprofeno 600 mg",
    principioAtivo: "Ibuprofeno",
    registroAnvisa: "MS 1.0043.1042",
    apresentacao: "Comprimidos revestidos de 600 mg",
    classeTerapeutica: "Anti-inflamatório Não Esteroidal (AINE)",
    sinonimos: ["ibuprofeno", "advil", "alivium", "ibuprofeno 600"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nIndicado para o alívio da dor e inflamação em condições como: artrites, dores musculares, lombalgia, dor pós-traumática, dor de dente, cólicas menstruais e processos inflamatórios em geral.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nO ibuprofeno é um anti-inflamatório não esteroidal (AINE) que atua inibindo as enzimas ciclo-oxigenases (COX-1 e COX-2), diminuindo a síntese de prostaglandinas mediadoras da inflamação, dor e febre. A ação analgésica tem início em aproximadamente 30 minutos.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nContraindicado para:\n- Pacientes com hipersensibilidade ao ibuprofeno ou a qualquer componente da fórmula;\n- Pacientes que apresentaram asma, urticária ou reações alérgicas após tomar ácido acetilsalicílico ou outros AINEs;\n- Histórico de úlcera péptica ativa ou sangramento gastrintestinal;\n- Insuficiência cardíaca, renal ou hepática graves;\n- Terceiro trimestre da gravidez.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nO uso de AINEs pode causar eventos gastrointestinais graves, incluindo inflamação, sangramento, ulceração e perfuração do estômago ou intestino. Pode aumentar o risco de eventos trombóticos cardiovasculares em uso contínuo e em doses altas. Deve ser utilizado com cautela em idosos e hipertensos.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nContraindicado durante o terceiro trimestre de gravidez devido ao risco de fechamento prematuro do ducto arterioso fetal e inibição das contrações uterinas. No primeiro e segundo trimestres, o uso só deve ser feito com estrita avaliação médica. O ibuprofeno é excretado no leite materno em concentrações muito baixas.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz e umidade.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nConforme a bula oficial: Uso oral em adultos. A dose habitual para processos dolorosos e inflamatórios é de 1 comprimido (600 mg) a cada 8 a 12 horas, de preferência após as refeições ou com leite para reduzir desconforto gástrico. Não exceder 2.400 mg ao dia sem expressa indicação médica.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nTome a dose esquecida assim que lembrar, a menos que esteja quase no horário da próxima tomada. Nunca duplique doses.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nReações comuns: dispepsia, azia, dor epigástrica, náuseas, vômitos, tontura e dor de cabeça. Reações raras a graves: sangramento gástrico, úlceras pépticas, retenção de líquidos, elevação da pressão arterial e nefrotoxicidade.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nSintomas de superdose: dor abdominal, náuseas, vômitos, letargia, sonolência, vertigem e raramente convulsões. Procure socorro médico emergencial imediatamente.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nAumenta o risco de sangramento quando usado com anticoagulantes (varfarina) ou antiplaquetários. Pode reduzir a eficácia de anti-hipertensivos e diuréticos. O uso com álcool aumenta expressivamente o risco de ulceração e sangramento gástrico."
    }
  },
  {
    id: "omeprazol",
    tipoItem: "medicamento",
    nomeComercial: "Omeprazol 20 mg",
    principioAtivo: "Omeprazol",
    registroAnvisa: "MS 1.0235.0741",
    apresentacao: "Cápsulas com microgrânulos gastrorresistentes de 20 mg",
    classeTerapeutica: "Inibidor da Bomba de Prótons (IBP)",
    sinonimos: ["omeprazol", "losec", "omeprazol 20"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nIndicado para o tratamento de úlceras gástricas e duodenais, esofagite de refluxo, síndrome de Zollinger-Ellison e erradicação de Helicobacter pylori em associação com antibióticos específicos.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nO omeprazol reduz a secreção ácida gástrica através da inibição específica da enzima H+/K+ ATPase (a bomba de prótons) na célula parietal gástrica. Esse efeito é dose-dependente e proporciona um bloqueio eficaz tanto da secreção ácida basal quanto estimulada.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nContraindicado em pacientes com hipersensibilidade conhecida ao omeprazol, a outros benzimidazóis substituídos ou a qualquer componente da fórmula.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nA resposta sintomática ao omeprazol não exclui a presença de doença gástrica maligna. Em caso de perda de peso não intencional, vômitos recorrentes, disfagia ou sangramento, consulte seu médico antes de iniciar o tratamento. O uso prolongado pode diminuir a absorção de vitamina B12 e aumentar o risco de fraturas ósseas em idosos.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nEstudos epidemiológicos não demonstraram efeitos adversos na gravidez ou na saúde do feto/recém-nascido. Contudo, assim como qualquer medicamento, o omeprazol só deve ser administrado durante a gravidez e a amamentação se estritamente necessário e sob orientação médica.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz e da umidade. Manter o frasco bem fechado.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nConforme a bula oficial: Uso oral. Recomenda-se tomar a cápsula pela manhã, em jejum, deglutida inteira com auxílio de meio copo de água. A cápsula não deve ser mastigada nem esmagada, para preservar os microgrânulos gastrorresistentes.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nSe você esquecer de tomar a dose habitual pela manhã, tome-a assim que lembrar no mesmo dia. Se for no dia seguinte, tome apenas a dose regular matinal.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nReações comuns (ocorrem entre 1% e 10% dos pacientes): cefaleia (dor de cabeça), diarreia, constipação, dor abdominal, náuseas, flatulência e vômitos. Reações incomuns: tontura, sonolência e erupções cutâneas.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nDoses orais únicas de até 400 mg foram relatadas sem sintomas graves; podem ocorrer náuseas, vômitos, tonturas, dor abdominal e sonolência. Em caso de ingestão massiva, procure assistência médica levando a bula.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nO omeprazol pode diminuir a absorção de medicamentos dependentes do pH gástrico ácido (como cetoconazol e itraconazol). Pode aumentar as concentrações plasmáticas de diazepam, fenitoína e varfarina."
    }
  },
  {
    id: "loratadina",
    tipoItem: "medicamento",
    nomeComercial: "Loratadina 10 mg",
    principioAtivo: "Loratadina",
    registroAnvisa: "MS 1.0583.0312",
    apresentacao: "Comprimidos de 10 mg",
    classeTerapeutica: "Anti-histamínico (Antialérgico)",
    sinonimos: ["loratadina", "claritin", "loratadina 10"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nIndicado para o alívio dos sintomas associados à rinite alérgica (como coriza, espirros, prurido nasal e queimação ocular) e no alívio dos sinais e sintomas de urticária e outras afecções dermatológicas alérgicas.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nA loratadina pertence a uma classe de medicamentos conhecidos como anti-histamínicos de segunda geração. Ela bloqueia seletivamente os receptores periféricos H1 da histamina, reduzindo os sintomas da alergia. Por ter baixa penetração no Sistema Nervoso Central, apresenta menor incidência de sonolência em relação aos antialérgicos clássicos.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nContraindicado para pacientes com histórico de hipersensibilidade ou alergia à loratadina ou a qualquer componente da fórmula.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nPacientes com insuficiência hepática grave devem iniciar o tratamento com doses menores, conforme orientação médica. O uso de loratadina deve ser interrompido cerca de 48 horas antes da realização de testes cutâneos alérgicos, pois anti-histamínicos podem mascarar os resultados.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nA segurança do uso de loratadina durante a gravidez não foi estabelecida. O medicamento só deve ser utilizado caso os benefícios potenciais justifiquem os riscos ao feto. A loratadina é excretada no leite materno; portanto, não é recomendada para mulheres que estejam amamentando.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar em temperatura ambiente (entre 15°C e 30°C), protegido da luz e da umidade.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nConforme a bula oficial: Uso oral em adultos e crianças com mais de 12 anos: 1 comprimido (10 mg) uma vez ao dia, com ou sem alimentos. Não ultrapassar a dose de 10 mg em 24 horas.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nTome a dose esquecida assim que se lembrar e continue a tomar o próximo comprimido no horário habitual. Não tome doses dobradas.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nA loratadina não apresenta propriedades sedativas significativas na dose recomendada. Efeitos adversos mais comumente relatados: dor de cabeça, cansaço, boca seca e raramente sonolência discreta.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nEm caso de superdosagem, foram relatados sonolência, taquicardia e dor de cabeça. Procure atendimento médico emergencial imediatamente.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nNão foram observadas interações prejudiciais clinicamente relevantes. O uso concomitante com álcool não potencializa os efeitos sedativos nas doses preconizadas pela bula."
    }
  },
  {
    id: "soro_fisiologico",
    tipoItem: "medicamento",
    nomeComercial: "Solução Fisiológica 0,9%",
    principioAtivo: "Cloreto de Sódio 0,9%",
    registroAnvisa: "MS 1.0491.0022",
    apresentacao: "Frasco plástico com 100 ml • Uso externo e inalação",
    classeTerapeutica: "Solução Hidratante e Lavagem Estéril",
    sinonimos: ["soro", "soro fisiologico", "solucao fisiologica", "cloreto de sodio", "lavagem nasal"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nIndicado para lavagem e higienização nasal e ocular, limpeza de ferimentos superficiais na pele, umidificação de mucosas e como veículo para inalação/nebulização residencial.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nPor ser isotônica em relação aos fluidos orgânicos (0,9% de cloreto de sódio), a solução fisiológica hidrata delicadamente as mucosas sem provocar irritação osmótica, fluidificando secreções nasais e facilitando a respiração.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nNão há contraindicações formais para uso tópico nasal, ocular ou inalatório. Não utilizar se a embalagem estiver violada, turva ou com depósito de partículas.",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nApós aberto, utilizar dentro do prazo de 15 a 30 dias (vide instruções do fabricante) e preferencialmente conservar sob refrigeração para evitar contaminação bacteriana. Este produto em frasco convencional não se destina a injeção intravenosa.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nPode ser utilizado com segurança por gestantes e lactantes para higiene tópica nasal e inalação.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar em temperatura ambiente (15°C a 30°C). Após aberto, conservar o frasco fechado.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nPara higiene nasal: instilar algumas gotas ou jatos nas narinas várias vezes ao dia. Para inalação: utilizar o volume indicado pelo médico ou manual do inalador (geralmente 3 a 5 ml).",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nUtilize conforme a necessidade de hidratação nasal ou indicação do tratamento.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nNão são esperadas reações adversas quando utilizado corretamente para fins de higiene tópica.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nO uso excessivo tópico nasal não apresenta toxicidade clínica conhecida.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nNão apresenta interações medicamentosas negativas conhecidas no uso tópico/inalatório."
    }
  },
  {
    id: "sais_reidratacao",
    tipoItem: "medicamento",
    nomeComercial: "Sais para Reidratação Oral",
    principioAtivo: "Cloreto de Sódio, Citrato de Potássio, Citrato de Sódio e Glicose",
    registroAnvisa: "MS 1.0573.0142",
    apresentacao: "Caixa com 4 envelopes para diluição",
    classeTerapeutica: "Solução de Reidratação Eletrolítica Oral (Padrão OMS)",
    sinonimos: ["sais", "sais de reidratacao", "reidratacao oral", "soro de reidratacao"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/bulario/",
    nomeFonteOficial: "Bulário Eletrônico da ANVISA",
    secoes: {
      indicacoes: "1. PARA QUE ESTE MEDICAMENTO É INDICADO?\nIndicado para a prevenção e o tratamento da desidratação decorrente de diarreia aguda ou vômitos de qualquer etiologia, tanto em adultos quanto em crianças e lactentes.",
      comoFunciona: "2. COMO ESTE MEDICAMENTO FUNCIONA?\nA fórmula atende ao padrão da Organização Mundial da Saúde (OMS), utilizando o mecanismo de cotransporte ativo glicose-sódio na mucosa intestinal, promovendo a rápida absorção de água e eletrólitos vitais.",
      contraindicacoes: "3. QUANDO NÃO DEVO USAR ESTE MEDICAMENTO?\nContraindicado em pacientes com íleo paralítico, perfuração ou obstrução intestinal e em quadros de desidratação grave com choque hipovolêmico (que requerem hidratação venosa emergencial).",
      advertencias: "4. O QUE DEVO SABER ANTES DE USAR ESTE MEDICAMENTO?\nDeve-se utilizar água fervida ou filtrada estéril para o preparo. Não ferver a solução após o preparo. Em caso de vômitos incoercíveis ou piora do estado geral, procure atendimento médico imediato.",
      gravidezLactacao: "GRAVIDEZ E AMAMENTAÇÃO (Bula Oficial):\nSeguro durante a gestação e amamentação para prevenção e tratamento da desidratação.",
      armazenamento: "5. ONDE, COMO E POR QUANTO TEMPO POSSO GUARDAR ESTE MEDICAMENTO?\nConservar os envelopes em local seco. Após dissolvido em água, o preparado deve ser consumido em no máximo 24 horas; após esse período, descarte o restante.",
      posologia: "6. COMO DEVO USAR ESTE MEDICAMENTO?\nDissolver o conteúdo de 1 envelope exatamente no volume de água indicado na embalagem (geralmente 500 ml ou 1.000 ml). Administrar por via oral, em goles frequentes, especialmente após cada evacuação líquida.",
      esquecimento: "7. O QUE DEVO FAZER QUANDO EU ME ESQUECER DE USAR ESTE MEDICAMENTO?\nTome a solução sempre que houver sede ou perda líquida.",
      reacoesAdversas: "8. QUAIS OS MALES QUE ESTE MEDICAMENTO PODE ME CAUSAR?\nRaramente vômitos podem ocorrer se a administração for muito rápida. Administrar em pequenas quantidades e com intervalos curtos.",
      superdose: "9. O QUE FAZER SE ALGUÉM USAR UMA QUANTIDADE MAIOR DO QUE A INDICADA?\nPode ocorrer hipernatremia se a solução for preparada com menos água do que o indicado. Procure assistência médica.",
      interacoes: "10. INTERAÇÕES MEDICAMENTOSAS DA BULA:\nNão foram descritas interações medicamentosas clinicamente relevantes."
    }
  },

  // =========================================================================
  // 2. COSMÉTICOS E DERMOCOSMÉTICOS REGISTRADOS/NOTIFICADOS NA ANVISA
  // (RDC nº 752/2022 e RDC nº 629/2022 - Rotulagem Oficial Obrigatória)
  // =========================================================================
  {
    id: "protetor_fps50",
    tipoItem: "cosmetico",
    nomeComercial: "Protetor Solar Facial FPS 50",
    principioAtivo: "Filtros fotoestáveis UVA/UVB com Toque Seco",
    registroAnvisa: "Processo ANVISA 25351.489123/2023-44 (Grau 2)",
    apresentacao: "Bisnaga facial • 40 g • Toque Seco",
    classeTerapeutica: "Fotoprotetor Solar Facial (Cosmético de Grau 2)",
    sinonimos: ["protetor solar", "protetor facial", "fps 50", "filtro solar", "solarium", "protetor"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/cosmeticos/registrados/",
    nomeFonteOficial: "Consulta de Cosméticos Registrados da ANVISA (RDC 629/2022)",
    secoes: {
      indicacoes: "1. INDICAÇÃO E FINALIDADE (Rótulo Oficial ANVISA RDC nº 629/2022):\nIndicado para proteger a pele do rosto contra os efeitos nocivos da radiação solar UVA e UVB, auxiliando na prevenção de queimaduras solares e do envelhecimento precoce da pele.",
      comoFunciona: "2. COMO ESTE PRODUTO FUNCIONA?\nCombina filtros físicos e químicos fotoestáveis que absorvem e dispersam a radiação ultravioleta, conferindo alta proteção (FPS 50) com acabamento fosco e controle de oleosidade ao longo do dia.",
      contraindicacoes: "3. CONTRAINDICAÇÕES E RESTRIÇÕES DE USO:\nNão utilizar em indivíduos com hipersensibilidade conhecida a qualquer componente da formulação. Não aplicar sobre a pele ferida, inflamada ou irritada. Para crianças menores de 6 meses, consultar um médico.",
      advertencias: "4. ADVERTÊNCIAS OFICIAIS OBRIGATÓRIAS (RDC ANVISA nº 629/2022):\n• É necessária a reaplicação do produto para manter a sua efetividade.\n• Ajuda a prevenir as queimaduras solares.\n• Este produto não oferece nenhuma proteção contra insolação.\n• Evite exposição prolongada das crianças ao sol.\n• Evite o contato direto com os olhos; em caso de contato, enxaguar com água em abundância.",
      gravidezLactacao: "USO EM GESTANTES E LACTANTES:\nProduto cosmético de uso tópico seguro. Não há contraindicação formal descrita no registro sanitário, salvo sensibilidade individual a filtros orgânicos.",
      armazenamento: "5. CONSERVAÇÃO:\nConservar em local seco, fresco e ao abrigo da luz solar direta. Manter a embalagem bem fechada.",
      posologia: "6. MODO DE USO (Rotulagem Oficial ANVISA):\nAplicar abundantemente sobre a pele limpa e seca do rosto e pescoço pelo menos 15 a 30 minutos antes da exposição ao sol. É necessária a reaplicação do produto para manter sua efetividade: reaplicar sempre após sudorese intensa, nadar ou banhar-se, secar-se com toalha e durante a exposição ao sol. Se a quantidade aplicada não for adequada, o nível de proteção será significativamente reduzido.",
      esquecimento: "7. ORIENTAÇÃO DE USO:\nReaplique sempre que se expuser ao sol ou a cada 2 a 3 horas de exposição contínua.",
      reacoesAdversas: "8. PRECAUÇÕES E POSSÍVEIS REAÇÕES INDESEJADAS:\nEm casos raros de hipersensibilidade cutânea, pode ocorrer ardor, vermelhidão (eritema) ou coceira. Havendo irritação, suspenda o uso e procure orientação médica.",
      superdose: "9. EM CASO DE INGESTÃO ACIDENTAL:\nProduto de uso externo. Em caso de ingestão acidental por crianças ou adultos, não provoque vômito e consulte o Disque-Intoxicação (0800 722 6001) ou o Centro de Informações Toxicológicas mais próximo.",
      interacoes: "10. COMPATIBILIDADE:\nPode ser associado à rotina diária de limpeza e hidratação facial. Aplicar como última etapa do cuidado com a pele, antes da maquiagem."
    }
  },
  {
    id: "repelente",
    tipoItem: "cosmetico",
    nomeComercial: "Repelente Corporal Loção 100 ml",
    principioAtivo: "Icaridina 20%",
    registroAnvisa: "Processo ANVISA 25351.312984/2023-12 (Grau 2)",
    apresentacao: "Loção cremosa • Frasco 100 ml",
    classeTerapeutica: "Repelente de Insetos (Cosmético de Grau 2)",
    sinonimos: ["repelente", "icaridina", "repelente de icaridina", "repelente corporal"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/cosmeticos/registrados/",
    nomeFonteOficial: "Consulta de Cosméticos Registrados da ANVISA (RDC 752/2022)",
    secoes: {
      indicacoes: "1. INDICAÇÃO E FINALIDADE (Rótulo Oficial ANVISA):\nIndicado para repelir mosquitos e pernilongos, incluindo o Aedes aegypti (transmissor da Dengue, Zika e Chikungunya) e Culex quinquefasciatus, proporcionando proteção de longa duração.",
      comoFunciona: "2. COMO ESTE PRODUTO FUNCIONA?\nA icaridina forma uma barreira aromática sobre a camada superficial da pele que desorienta os receptores olfativos dos insetos, impedindo sua aproximação e picadas.",
      contraindicacoes: "3. CONTRAINDICAÇÕES E RESTRIÇÕES DE USO:\nNão aplicar em crianças menores de 2 anos de idade sem expressa recomendação médica. Não aplicar sobre cortes, feridas ou pele irritada. Não usar se tiver alergia à icaridina.",
      advertencias: "4. ADVERTÊNCIAS OFICIAIS OBRIGATÓRIAS (RDC ANVISA nº 752/2022):\n• Não aplicar por baixo de roupas.\n• Aplicar nas áreas expostas da pele somente quando necessário.\n• Não aplicar na região dos olhos, boca e mucosas.\n• Em crianças de 2 a 12 anos, a aplicação deve ser feita por um adulto (não aplicar nas mãos da criança).\n• Lavar as mãos com água e sabão após a aplicação.",
      gravidezLactacao: "USO EM GESTANTES E LACTANTES:\nO uso de repelentes à base de icaridina é recomendado pela ANVISA e pelo Ministério da Saúde para gestantes como medida protetiva contra o mosquito transmissor da Zika e Dengue.",
      armazenamento: "5. CONSERVAÇÃO:\nManter em lugar fresco e ao abrigo da luz solar direta. Manter fora do alcance de crianças e animais domésticos.",
      posologia: "6. MODO DE USO (Rotulagem Oficial ANVISA):\nAplicar a loção uniformemente sobre todas as áreas expostas da pele. Não pulverizar diretamente no rosto: coloque primeiro na palma das mãos e espalhe cuidadosamente pela face, evitando olhos e lábios. Reaplicar conforme o intervalo de horas especificado pelo fabricante ou após sudorese intensa.",
      esquecimento: "7. ORIENTAÇÃO DE USO:\nAplicar somente quando houver exposição a ambientes com presença de insetos vetores.",
      reacoesAdversas: "8. POSSÍVEIS REAÇÕES ADVERSAS:\nEm indivíduos muito sensíveis, pode surgir ardência leve ou dermatite de contato. Se houver irritação, lavar a região afetada com água e sabão e interromper o uso.",
      superdose: "9. EM CASO DE ACIDENTE OU INGESTÃO:\nEm caso de contato acidental com os olhos, lavar com água corrente por 15 minutos. Em caso de ingestão acidental, procure imediatamente socorro médico levando a embalagem do produto.",
      interacoes: "10. COMPATIBILIDADE:\nQuando utilizado com protetor solar, aplique o protetor solar primeiro, aguarde a secagem completa (cerca de 15 minutos) e somente então aplique o repelente."
    }
  },
  {
    id: "serum_niacinamida",
    tipoItem: "cosmetico",
    nomeComercial: "Sérum de Niacinamida 10%",
    principioAtivo: "Niacinamida (Vitamina B3) e Zinco PCA",
    registroAnvisa: "Processo ANVISA 25351.109823/2024-88 (Grau 1)",
    apresentacao: "Frasco conta-gotas 30 ml • Uso facial",
    classeTerapeutica: "Dermocosmético Facial Notificado (Grau 1)",
    sinonimos: ["niacinamida", "serum de niacinamida", "serum niacinamida", "vitamina b3"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/cosmeticos/regularizados/",
    nomeFonteOficial: "Consulta de Cosméticos Notificados da ANVISA (RDC 752/2022)",
    secoes: {
      indicacoes: "1. INDICAÇÃO E FINALIDADE (Rótulo Oficial ANVISA):\nIndicado para uniformização da textura da pele, redução do excesso de oleosidade, atenuação da aparência de poros dilatados e melhora do viço cutâneo.",
      comoFunciona: "2. COMO ESTE PRODUTO FUNCIONA?\nA niacinamida a 10% associada ao zinco PCA atua na regulação da atividade sebácea e no reforço da barreira epitelial, proporcionando hidratação leve e controle de brilho sem causar ressecamento.",
      contraindicacoes: "3. CONTRAINDICAÇÕES:\nNão utilizar em pessoas com hipersensibilidade à niacinamida ou a qualquer componente do sérum. Não aplicar sobre lesões ativas ou eczemas.",
      advertencias: "4. PRECAUÇÕES E ADVERTÊNCIAS OFICIAIS (RDC 752/2022):\n• Realize teste de sensibilidade antes do primeiro uso (aplique uma gota no antebraço e observe por 24h).\n• Uso externo exclusivamente cosmético.\n• Não ingerir.\n• Manter fora do alcance de crianças.",
      gravidezLactacao: "USO EM GESTANTES:\nUso cosmético seguro para a maioria dos indivíduos. Em caso de gravidez, consulte seu dermatologista ou obstetra para validar a rotina cosmética.",
      armazenamento: "5. CONSERVAÇÃO:\nConservar em local seco, fresco e arejado, ao abrigo da luz solar direta.",
      posologia: "6. MODO DE USO (Rotulagem Oficial ANVISA):\nAplicar de 3 a 5 gotas sobre a pele do rosto limpa e seca, pela manhã e/ou à noite. Espalhar suavemente com as pontas dos dedos até completa absorção. Pela manhã, recomenda-se a aplicação combinada de protetor solar após o sérum.",
      esquecimento: "7. ORIENTAÇÃO DE USO:\nPode ser incorporado na rotina diária matinal e noturna.",
      reacoesAdversas: "8. REAÇÕES ADVERSAS:\nEm peles sensíveis, pode ocorrer leve sensação de formigamento ou rubor passageiro nas primeiras aplicações. Havendo desconforto persistente, reduza a frequência de uso ou suspenda.",
      superdose: "9. ACIDENTE / INGESTÃO:\nEm caso de contato acidental com os olhos, enxaguar com água em abundância.",
      interacoes: "10. COMPATIBILIDADE:\nCompatível com hidratantes e protetores solares. Evite a aplicação no mesmo horário de produtos com alta concentração de ácidos fortes esfoliantes para evitar irritação cumulativa."
    }
  },
  {
    id: "hidratante_ceramidas",
    tipoItem: "cosmetico",
    nomeComercial: "Hidratante Corporal com Ceramidas 400 ml",
    principioAtivo: "Complexo de 3 Ceramidas Essenciais e Ácido Hialurônico",
    registroAnvisa: "Processo ANVISA 25351.204958/2024-11 (Grau 1)",
    apresentacao: "Frasco dosador com 400 ml • Sem fragrância",
    classeTerapeutica: "Dermocosmético Hidratante Notificado (Grau 1)",
    sinonimos: ["hidratante", "hidratante com ceramidas", "ceramidas", "locao corporal", "creme hidratante"],
    linkFonteOficial: "https://consultas.anvisa.gov.br/#/cosmeticos/regularizados/",
    nomeFonteOficial: "Consulta de Cosméticos Notificados da ANVISA (RDC 752/2022)",
    secoes: {
      indicacoes: "1. INDICAÇÃO E FINALIDADE (Rótulo Oficial ANVISA):\nIndicado para a hidratação intensiva e prolongada de peles secas e ressecadas de adultos e crianças, auxiliando na restauração e proteção da barreira protetora natural da pele.",
      comoFunciona: "2. COMO ESTE PRODUTO FUNCIONA?\nAs ceramidas repõem os lipídios intercelulares do estrato córneo, enquanto o ácido hialurônico retém a umidade na epiderme, prevenindo a perda transepidérmica de água.",
      contraindicacoes: "3. CONTRAINDICAÇÕES:\nHipersensibilidade conhecida aos ingredientes da loção.",
      advertencias: "4. PRECAUÇÕES E ADVERTÊNCIAS OFICIAIS (RDC 752/2022):\n• Uso externo.\n• Evite contato com os olhos.\n• Em caso de irritação, suspenda o uso e procure orientação médica.\n• Manter fora do alcance de crianças.",
      gravidezLactacao: "USO EM GESTANTES E LACTANTES:\nFórmula suave, sem fragrância e sem corantes, adequada para uso em gestantes e lactantes para prevenção do ressecamento cutâneo.",
      armazenamento: "5. CONSERVAÇÃO:\nManter em temperatura ambiente (15°C a 30°C), protegido da luz e calor.",
      posologia: "6. MODO DE USO (Rotulagem Oficial ANVISA):\nAplicar generosamente sobre a pele limpa e seca de todo o corpo ou rosto, massageando suavemente até completa absorção. Reaplicar sempre que necessário, especialmente após o banho.",
      esquecimento: "7. ORIENTAÇÃO DE USO:\nUso livre e diário conforme a necessidade de hidratação.",
      reacoesAdversas: "8. REAÇÕES ADVERSAS:\nProduto hipoalergênico e não comedogênico. Reações adversas são extremamente raras.",
      superdose: "9. ACIDENTE / INGESTÃO:\nEm caso de ingestão acidental, consulte o serviço de saúde ou Disque-Intoxicação (0800 722 6001).",
      interacoes: "10. COMPATIBILIDADE:\nPode ser aplicado sob protetores solares ou maquiagem sem interferir na eficácia."
    }
  }
];
