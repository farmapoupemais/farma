export type ProductColor = {
  id: string;
  name: string;
  hex: string;
  stock: number;
  sku?: string;
  available: boolean;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  brand: string;
  barcode?: string;
  images?: string[];
  colors?: ProductColor[];
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  requiresPrescription: boolean;
  badge?: string;
  tone: "teal" | "coral" | "blue" | "sand" | "plum" | "mint";
  icon: "capsule" | "drop" | "sun" | "heart" | "baby" | "care" | "thermo" | "spark";
};

export function generateEan(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const digits = Math.abs(hash).toString().padStart(9, "0").slice(0, 9);
  const base = `789${digits}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base}${checkDigit}`;
}

const categoryPresentation = {
  Medicamentos: { tone: "teal", icon: "capsule" },
  Dermocosméticos: { tone: "sand", icon: "sun" },
  Vitaminas: { tone: "coral", icon: "spark" },
  "Mamãe e bebê": { tone: "blue", icon: "baby" },
  "Cuidados pessoais": { tone: "mint", icon: "heart" },
  "Saúde e bem-estar": { tone: "plum", icon: "thermo" },
  "Primeiros socorros": { tone: "teal", icon: "care" },
  "Higiene oral": { tone: "blue", icon: "spark" },
} as const;

type CatalogCategory = keyof typeof categoryPresentation;

function item(
  id: string,
  slug: string,
  name: string,
  shortDescription: string,
  description: string,
  category: CatalogCategory,
  brand: string,
  priceCents: number,
  compareAtCents: number | null,
  stock: number,
  badge?: string,
  customColors?: ProductColor[],
  customBarcode?: string,
  customImages?: string[],
): CatalogProduct {
  return {
    id,
    slug,
    name,
    shortDescription,
    description,
    category,
    brand,
    barcode: customBarcode || generateEan(id),
    images: customImages || [],
    colors: customColors || [],
    priceCents,
    compareAtCents,
    stock,
    requiresPrescription: false,
    badge,
    ...categoryPresentation[category],
  };
}

// Catálogo integralmente fictício para demonstrar a operação do painel e da loja.
export const catalogProducts: CatalogProduct[] = [
  item("prod_paracetamol_750", "paracetamol-750mg-20-comprimidos", "Paracetamol 750 mg", "20 comprimidos • Medicamento genérico", "Medicamento isento de prescrição para alívio temporário de dores leves a moderadas e febre. Leia a bula e procure orientação profissional em caso de dúvida.", "Medicamentos", "Genérico", 1290, 1690, 42, "Oferta"),
  item("prod_dipirona_gotas", "dipirona-500mg-ml-20ml", "Dipirona 500 mg/ml", "Solução oral • Frasco 20 ml", "Medicamento isento de prescrição para alívio de dor e febre. Use somente conforme a bula e a orientação de um profissional habilitado.", "Medicamentos", "Poupe+ Genéricos", 1090, null, 31),
  item("prod_soro_fisiologico", "solucao-fisiologica-09-100ml", "Solução Fisiológica 0,9%", "Frasco 100 ml • Uso externo", "Solução estéril para higiene e cuidados cotidianos conforme as instruções da embalagem.", "Medicamentos", "BemViver", 790, 990, 76, "20% OFF"),
  item("prod_antisseptico_spray", "antisseptico-spray-50ml", "Antisséptico em Spray", "Frasco 50 ml • Aplicação prática", "Produto para higiene da pele íntegra. Siga o modo de uso e as precauções indicadas na embalagem.", "Medicamentos", "Poupe+ Care", 1490, null, 38),
  item("prod_pastilhas_mel", "pastilhas-mel-limao-12-unidades", "Pastilhas de Mel e Limão", "Cartela com 12 unidades", "Pastilhas com sabor de mel e limão para conforto da garganta. Consulte as informações da embalagem.", "Medicamentos", "Sereno", 1190, 1490, 52, "Oferta"),
  item("prod_balsamo_refrescante", "balsamo-refrescante-30g", "Bálsamo Refrescante", "Pote 30 g • Uso externo", "Bálsamo aromático de uso externo para uma sensação refrescante. Não aplicar em pele lesionada.", "Medicamentos", "ArVivo", 1790, null, 24),
  item("prod_sais_reidratacao", "sais-reidratacao-4-envelopes", "Sais para Reidratação", "Caixa com 4 envelopes", "Preparado em pó para solução de reidratação oral. Utilize conforme a orientação da embalagem e de profissional habilitado.", "Medicamentos", "HidraBem", 1390, null, 45),
  item("prod_antiacido", "antiacido-mastigavel-20-comprimidos", "Antiácido Mastigável", "20 comprimidos • Sabor menta", "Medicamento isento de prescrição. Leia a bula, respeite as contraindicações e evite o uso prolongado sem orientação.", "Medicamentos", "LeveDia", 1690, 2090, 34, "Oferta"),
  item("prod_xarope_guaco", "xarope-guaco-mel-120ml", "Xarope de Guaco e Mel", "Frasco 120 ml • Uso adulto", "Produto tradicional à base de guaco e mel. Consulte as advertências e o modo de uso antes de consumir.", "Medicamentos", "Bosque", 2290, null, 27),
  item("prod_gel_arnica", "gel-arnica-refrescante-60g", "Gel de Arnica Refrescante", "Bisnaga 60 g • Uso externo", "Gel cosmético de massagem com sensação refrescante. Não aplicar em mucosas ou pele lesionada.", "Medicamentos", "MoviBem", 1990, 2490, 29, "Oferta"),

  item("prod_vitamina_c", "vitamina-c-1g-10-comprimidos", "Vitamina C 1 g", "10 comprimidos efervescentes", "Suplemento alimentar em comprimidos efervescentes. Não substitui uma alimentação equilibrada.", "Vitaminas", "Vitta", 1890, 2490, 58, "24% OFF"),
  item("prod_multivitaminico", "multivitaminico-a-z-60-comprimidos", "Multivitamínico A–Z", "Frasco com 60 comprimidos", "Suplemento alimentar com vitaminas e minerais para complementar a rotina nutricional.", "Vitaminas", "VitaMais", 3790, 4590, 41, "Mais vendido"),
  item("prod_vitamina_d3", "vitamina-d3-2000ui-30-capsulas", "Vitamina D3 2.000 UI", "30 cápsulas • Uso adulto", "Suplemento alimentar de vitamina D. Consuma conforme a recomendação indicada na embalagem.", "Vitaminas", "VitaMais", 2490, null, 47),
  item("prod_magnesio", "magnesio-quelato-60-capsulas", "Magnésio Quelato", "Frasco com 60 cápsulas", "Suplemento alimentar de magnésio para complementar a ingestão diária de adultos.", "Vitaminas", "Nutrivale", 3290, 3990, 36, "Oferta"),
  item("prod_omega_3", "omega-3-1000mg-60-capsulas", "Ômega 3 1.000 mg", "60 cápsulas • Óleo de peixe", "Suplemento alimentar em cápsulas. Pessoas com restrições alimentares devem consultar os ingredientes.", "Vitaminas", "Nutrivale", 4490, 5290, 33, "15% OFF"),
  item("prod_colageno", "colageno-hidrolisado-300g", "Colágeno Hidrolisado", "Pote 300 g • Sabor neutro", "Suplemento alimentar em pó para diluição. Não substitui uma alimentação equilibrada.", "Vitaminas", "Vitta", 5490, 6490, 22, "Oferta"),

  item("prod_protetor_fps50", "protetor-solar-facial-fps50-40g", "Protetor Solar FPS 50", "Facial • Toque seco • 40 g", "Proteção facial de amplo espectro, acabamento confortável e resistente à água. Reaplique conforme as instruções da embalagem.", "Dermocosméticos", "Solarium", 5990, 7490, 19, "Mais vendido"),
  item("prod_gel_limpeza", "gel-limpeza-facial-suave-200ml", "Gel de Limpeza Facial", "Pele mista a oleosa • 200 ml", "Gel de limpeza suave para remover impurezas sem ressecar a pele. Uso diário.", "Dermocosméticos", "DermaLeve", 3890, 4490, 31, "Oferta"),
  item("prod_serum_niacinamida", "serum-niacinamida-10-30ml", "Sérum de Niacinamida 10%", "Conta-gotas 30 ml • Sem fragrância", "Sérum facial de textura leve para a rotina de cuidados. Realize teste de contato antes do primeiro uso.", "Dermocosméticos", "Lumina", 5290, 6190, 26, "14% OFF"),
  item("prod_agua_micelar", "agua-micelar-suave-200ml", "Água Micelar Suave", "Limpeza facial • 200 ml", "Solução de limpeza para remover resíduos e maquiagem de forma delicada.", "Dermocosméticos", "DermaLeve", 2790, null, 43),
  item("prod_creme_reparador", "creme-reparador-barreira-50g", "Creme Reparador de Barreira", "Pele sensível • 50 g", "Creme sem fragrância para hidratar e ajudar a proteger a barreira cutânea.", "Dermocosméticos", "CalmaPele", 6490, 7290, 18, "Oferta"),
  item("prod_protetor_infantil", "protetor-solar-infantil-fps60-120ml", "Protetor Solar Infantil FPS 60", "Loção resistente à água • 120 ml", "Proteção solar infantil de amplo espectro. Reaplique com frequência e siga a faixa etária indicada.", "Dermocosméticos", "Solarium Kids", 7990, 8990, 16, "11% OFF"),

  item("prod_hidratante", "hidratante-corporal-ceramidas-400ml", "Hidratante com Ceramidas", "Corpo e rosto • 400 ml", "Loção hidratante sem fragrância, formulada para reforçar a barreira da pele e proporcionar hidratação prolongada.", "Cuidados pessoais", "DermaLeve", 4990, null, 23),
  item("prod_shampoo_neutro", "shampoo-neutro-400ml", "Shampoo Neutro", "Limpeza suave • 400 ml", "Shampoo de uso diário com fragrância delicada e espuma suave.", "Cuidados pessoais", "Essenza", 2190, 2690, 55, "Oferta"),
  item("prod_condicionador", "condicionador-hidratacao-350ml", "Condicionador Hidratação", "Maciez e desembaraço • 350 ml", "Condicionador para o cuidado diário dos fios, com enxágue fácil.", "Cuidados pessoais", "Essenza", 2290, null, 49),
  item("prod_sabonete_liquido", "sabonete-liquido-suave-500ml", "Sabonete Líquido Suave", "Refil econômico • 500 ml", "Sabonete líquido para mãos e corpo com fórmula de limpeza delicada.", "Cuidados pessoais", "CasaLeve", 1690, 1990, 68, "Economize"),
  item("prod_desodorante", "desodorante-roll-on-sem-alcool-50ml", "Desodorante Roll-on", "Sem álcool • 50 ml", "Desodorante de uso diário com fragrância suave. Consulte os ingredientes em caso de sensibilidade.", "Cuidados pessoais", "Brisa", 1190, null, 61),
  item("prod_absorvente", "absorvente-cobertura-suave-16-unidades", "Absorvente Cobertura Suave", "Com abas • 16 unidades", "Absorvente com cobertura suave e canais de proteção para o conforto diário.", "Cuidados pessoais", "LeveEla", 1490, 1790, 72, "Oferta"),
  item("prod_creme_maos", "creme-para-maos-75g", "Creme para as Mãos", "Hidratação rápida • 75 g", "Creme de rápida absorção para manter as mãos macias ao longo do dia.", "Cuidados pessoais", "CalmaPele", 1890, null, 37),
  item("prod_repelente", "repelente-corporal-locao-100ml", "Repelente Corporal", "Loção de longa duração • 100 ml", "Repelente corporal para uso conforme faixa etária e instruções da embalagem.", "Cuidados pessoais", "ArLivre", 3190, 3790, 32, "Oferta"),

  item("prod_fralda_m", "fralda-infantil-conforto-m-32", "Fralda Conforto M", "Pacote com 32 unidades", "Fralda infantil com canais de absorção, laterais elásticas e cobertura respirável para o cuidado diário.", "Mamãe e bebê", "Nuvem", 4490, 5290, 28, "Leve 2, economize"),
  item("prod_lencos_bebe", "lencos-umedecidos-bebe-96-unidades", "Lenços Umedecidos para Bebê", "Pacote com 96 unidades", "Lenços sem álcool, com toque macio para a higiene cotidiana do bebê.", "Mamãe e bebê", "Nuvem", 1890, 2290, 64, "Oferta"),
  item("prod_pomada_bebe", "pomada-protetora-bebe-60g", "Pomada Protetora para Bebê", "Bisnaga 60 g • Uso diário", "Pomada de barreira para auxiliar na proteção da pele durante as trocas.", "Mamãe e bebê", "BebêLeve", 2390, null, 44),
  item("prod_sabonete_bebe", "sabonete-liquido-bebe-200ml", "Sabonete Líquido para Bebê", "Da cabeça aos pés • 200 ml", "Sabonete infantil de limpeza suave, desenvolvido para a rotina de banho.", "Mamãe e bebê", "BebêLeve", 2590, 2990, 39, "Oferta"),
  item("prod_fralda_g", "fralda-infantil-conforto-g-28", "Fralda Conforto G", "Pacote com 28 unidades", "Fralda infantil com ajuste confortável, canais de absorção e cobertura respirável.", "Mamãe e bebê", "Nuvem", 4690, 5490, 35, "Economize"),
  item("prod_mamadeiras", "kit-mamadeiras-150-250ml", "Kit de Mamadeiras", "2 unidades • 150 ml e 250 ml", "Kit demonstrativo de mamadeiras com tampa protetora. Esterilize conforme as instruções do fabricante.", "Mamãe e bebê", "BebêLeve", 3990, null, 21),

  item(
    "prod_termometro",
    "termometro-digital-flexivel",
    "Termômetro Digital",
    "Ponta flexível • Alerta sonoro",
    "Termômetro digital de uso doméstico com leitura rápida, memória da última medição e desligamento automático.",
    "Saúde e bem-estar",
    "MediCasa",
    2990,
    3490,
    15,
    "Oferta",
    [
      { id: "term-azul", name: "Azul Bebê", hex: "#38bdf8", stock: 6, sku: "TERM-AZUL", available: true },
      { id: "term-branco", name: "Branco Neve", hex: "#f8fafc", stock: 5, sku: "TERM-BRANCO", available: true },
      { id: "term-rosa", name: "Rosa Pastel", hex: "#f472b6", stock: 4, sku: "TERM-ROSA", available: true },
    ]
  ),
  item("prod_pressao", "aparelho-pressao-digital-braco", "Aparelho de Pressão Digital", "Braçadeira ajustável • Memória", "Monitor digital de pressão para uso doméstico. A medição não substitui avaliação profissional.", "Saúde e bem-estar", "MediCasa", 14990, 17990, 12, "Mais vendido"),
  item("prod_oximetro", "oximetro-digital-de-dedo", "Oxímetro Digital de Dedo", "Visor colorido • Estojo", "Aparelho doméstico para leitura indicativa. Siga o manual e procure orientação diante de resultados incomuns.", "Saúde e bem-estar", "PulsoBem", 8990, 10990, 17, "18% OFF"),
  item(
    "prod_bolsa_gel",
    "bolsa-gel-quente-fria-media",
    "Bolsa de Gel Quente e Fria",
    "Tamanho médio • Reutilizável",
    "Bolsa reutilizável para aplicação térmica conforme instruções de segurança.",
    "Saúde e bem-estar",
    "MoviBem",
    2490,
    null,
    30,
    undefined,
    [
      { id: "bolsa-azul", name: "Azul Cobalto", hex: "#1d4ed8", stock: 16, sku: "BGEL-AZUL", available: true },
      { id: "bolsa-verde", name: "Verde Menta", hex: "#059669", stock: 14, sku: "BGEL-VERDE", available: true },
    ]
  ),
  item(
    "prod_organizador",
    "organizador-semanal-medicamentos",
    "Organizador Semanal",
    "7 dias • Quatro períodos",
    "Estojo organizador para auxiliar na rotina. Não altera nem substitui a orientação de uso dos medicamentos.",
    "Saúde e bem-estar",
    "CasaSaúde",
    2790,
    3290,
    46,
    "Oferta",
    [
      { id: "org-colorido", name: "Arco-íris Translúcido", hex: "#38bdf8", stock: 20, sku: "ORG-COLOR", available: true },
      { id: "org-fume", name: "Cinza Fumê", hex: "#475569", stock: 16, sku: "ORG-FUME", available: true },
      { id: "org-cristal", name: "Cristal Transparente", hex: "#e2e8f0", stock: 10, sku: "ORG-CRISTAL", available: true },
    ]
  ),

  item("prod_curativos", "kit-primeiros-cuidados-30-itens", "Kit Primeiros Cuidados", "Curativos, gaze e fita • 30 itens", "Conjunto compacto para pequenos cuidados do dia a dia. Mantenha fora do alcance de crianças.", "Primeiros socorros", "Poupe+ Care", 2390, null, 36),
  item("prod_gaze", "gaze-esteril-10-pacotes", "Gaze Estéril", "10 pacotes • 7,5 × 7,5 cm", "Compressas de gaze estéril embaladas individualmente para pequenos cuidados.", "Primeiros socorros", "Poupe+ Care", 1290, 1590, 59, "Oferta"),
  item("prod_fita_microporosa", "fita-microporosa-25mm-10m", "Fita Microporosa", "Rolo 25 mm × 10 m", "Fita hipoalergênica para fixação de curativos, conforme as instruções da embalagem.", "Primeiros socorros", "CuraLeve", 890, null, 67),
  item("prod_hidrocoloide", "curativo-hidrocoloide-6-unidades", "Curativo Hidrocoloide", "Caixa com 6 unidades", "Curativos hidrocoloides para proteção de pequenas áreas, seguindo o modo de uso do fabricante.", "Primeiros socorros", "CuraLeve", 2490, 2990, 25, "Oferta"),

  item(
    "prod_escova_dental",
    "escova-dental-macia-3-unidades",
    "Escova Dental Macia",
    "Leve 3 • Cerdas arredondadas",
    "Conjunto de escovas com cerdas macias para a higiene oral diária.",
    "Higiene oral",
    "Sorriso+",
    1690,
    2090,
    73,
    "Leve 3",
    [
      { id: "escova-turquesa", name: "Verde Turquesa", hex: "#0d9488", stock: 28, sku: "ESC-TURQ", available: true },
      { id: "escova-coral", name: "Coral Suave", hex: "#f87171", stock: 25, sku: "ESC-CORAL", available: true },
      { id: "escova-lilas", name: "Lilás Pastel", hex: "#c084fc", stock: 20, sku: "ESC-LILAS", available: true },
    ]
  ),
  item("prod_creme_dental", "creme-dental-dentes-sensiveis-90g", "Creme Dental para Dentes Sensíveis", "Proteção diária • 90 g", "Creme dental para higiene diária. Escove conforme a orientação do profissional de saúde bucal.", "Higiene oral", "Sorriso+", 1890, null, 54),
  item("prod_enxaguante", "enxaguante-bucal-sem-alcool-500ml", "Enxaguante Bucal sem Álcool", "Sabor menta suave • 500 ml", "Enxaguante para complementar a higiene oral. Não ingerir e manter fora do alcance de crianças.", "Higiene oral", "Sorriso+", 2390, 2890, 40, "Oferta"),
];

export const categories = [
  { name: "Medicamentos", icon: "capsule", description: "Dor, febre, gripe e cuidados diários" },
  { name: "Dermocosméticos", icon: "sun", description: "Proteção, limpeza e hidratação" },
  { name: "Vitaminas", icon: "spark", description: "Suplementos e nutrição" },
  { name: "Mamãe e bebê", icon: "baby", description: "Cuidado em cada fase" },
  { name: "Cuidados pessoais", icon: "heart", description: "Higiene, beleza e bem-estar" },
  { name: "Saúde e bem-estar", icon: "thermo", description: "Aparelhos, testes e monitoramento" },
  { name: "Primeiros socorros", icon: "care", description: "Curativos e cuidados para ter por perto" },
  { name: "Higiene oral", icon: "spark", description: "Escovas, cremes e proteção diária" },
];

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function getProductBySlug(slug: string) {
  return catalogProducts.find((product) => product.slug === slug);
}
