-- ==============================================================================
-- FARMÁCIA POUPE MAIS - SETUP COMPLETO DO SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. TABELA DE PAPÉIS E PERMISSÕES DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.user_roles (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'customer',
  created_by TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  compare_at_cents INTEGER,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,
  regulatory_status TEXT NOT NULL DEFAULT 'approved',
  regulatory_reviewer_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE BANNERS
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  cta_label TEXT NOT NULL,
  cta_href TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'sage',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE DESCONTOS E CUPONS
CREATE TABLE IF NOT EXISTS public.discounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  amount INTEGER NOT NULL,
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE RESGATE DE CUPONS
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
  discount_id TEXT NOT NULL REFERENCES public.discounts(id),
  customer_email TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (discount_id, customer_email)
);

-- 6. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  fulfillment TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  prescription_id TEXT,
  discount_id TEXT,
  items_json JSONB NOT NULL,
  address_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE RESERVAS DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.order_inventory_reservations (
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, product_id)
);

-- 8. TABELA DE RECEITAS MÉDICAS
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  reviewer_email TEXT,
  approved_items_json JSONB,
  expires_at TIMESTAMPTZ,
  retain_until TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA DE USO DE RECEITAS
CREATE TABLE IF NOT EXISTS public.prescription_usages (
  prescription_id TEXT PRIMARY KEY,
  customer_email TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA DE AUDITORIA IMUTÁVEL (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'admin',
  user_role TEXT NOT NULL DEFAULT 'system',
  ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
  user_agent TEXT NOT NULL DEFAULT 'internal',
  resource TEXT NOT NULL DEFAULT '',
  resource_id TEXT NOT NULL DEFAULT '',
  old_values JSONB NOT NULL DEFAULT '{}',
  new_values JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'success',
  metadata_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrações seguras idempotentes caso a tabela já exista
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'system';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT NOT NULL DEFAULT '127.0.0.1';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource TEXT NOT NULL DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';


-- ==============================================================================
-- DESATIVAR RLS (Permitir leitura/escrita pública e segura pela aplicação)
-- ==============================================================================
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_inventory_reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_usages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- TRIGGER INTELIGENTE: O 1º USUÁRIO VIRA OWNER + AUTO-CONFIRMA E-MAILS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger AS 
BEGIN
  -- Confirma automaticamente o e-mail no auth.users para permitir login imediato
  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = NEW.id;

  -- Se for o primeiro usuário da história do sistema, ele vira OWNER (Proprietário)
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (email, role, created_by)
    VALUES (LOWER(NEW.email), 'owner', 'system')
    ON CONFLICT (email) DO UPDATE SET role = 'owner';
  ELSE
    INSERT INTO public.user_roles (email, role, created_by)
    VALUES (LOWER(NEW.email), 'customer', 'system')
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();

-- Confirmar retroativamente usuários já criados
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- ==============================================================================
-- SEED DOS 48 PRODUTOS DA FARMÁCIA POUTE MAIS
-- ==============================================================================
INSERT INTO public.products (id, slug, name, short_description, description, category, brand, price_cents, compare_at_cents, stock, requires_prescription, regulatory_status, is_active) VALUES
('prod_paracetamol_750', 'paracetamol-750mg-20-comprimidos', 'Paracetamol 750 mg', '20 comprimidos • Medicamento genérico', 'Medicamento isento de prescrição para alívio temporário de dores leves a moderadas e febre. Leia a bula e procure orientação profissional em caso de dúvida.', 'Medicamentos', 'Genérico', 1290, 1690, 42, false, 'approved', true),
('prod_dipirona_gotas', 'dipirona-500mg-ml-20ml', 'Dipirona 500 mg/ml', 'Solução oral • Frasco 20 ml', 'Medicamento isento de prescrição para alívio de dor e febre. Use somente conforme a bula e a orientação de um profissional habilitado.', 'Medicamentos', 'Poupe+ Genéricos', 1090, NULL, 31, false, 'approved', true),
('prod_soro_fisiologico', 'solucao-fisiologica-09-100ml', 'Solução Fisiológica 0,9%', 'Frasco 100 ml • Uso externo', 'Solução estéril para higiene e cuidados cotidianos conforme as instruções da embalagem.', 'Medicamentos', 'BemViver', 790, 990, 76, false, 'approved', true),
('prod_antisseptico_spray', 'antisseptico-spray-50ml', 'Antisséptico em Spray', 'Frasco 50 ml • Aplicação prática', 'Produto para higiene da pele íntegra. Siga o modo de uso e as precauções indicadas na embalagem.', 'Medicamentos', 'Poupe+ Care', 1490, NULL, 38, false, 'approved', true),
('prod_pastilhas_mel', 'pastilhas-mel-limao-12-unidades', 'Pastilhas de Mel e Limão', 'Cartela com 12 unidades', 'Pastilhas com sabor de mel e limão para conforto da garganta. Consulte as informações da embalagem.', 'Medicamentos', 'Sereno', 1190, 1490, 52, false, 'approved', true),
('prod_balsamo_refrescante', 'balsamo-refrescante-30g', 'Bálsamo Refrescante', 'Pote 30 g • Uso externo', 'Bálsamo aromático de uso externo para uma sensação refrescante. Não aplicar em pele lesionada.', 'Medicamentos', 'ArVivo', 1790, NULL, 24, false, 'approved', true),
('prod_sais_reidratacao', 'sais-reidratacao-4-envelopes', 'Sais para Reidratação', 'Caixa com 4 envelopes', 'Preparado em pó para solução de reidratação oral. Utilize conforme a orientação da embalagem e de profissional habilitado.', 'Medicamentos', 'HidraBem', 1390, NULL, 45, false, 'approved', true),
('prod_antiacido', 'antiacido-mastigavel-20-comprimidos', 'Antiácido Mastigável', '20 comprimidos • Sabor menta', 'Medicamento isento de prescrição. Leia a bula, respeite as contraindicações e evite o uso prolongado sem orientação.', 'Medicamentos', 'LeveDia', 1690, 2090, 34, false, 'approved', true),
('prod_xarope_guaco', 'xarope-guaco-mel-120ml', 'Xarope de Guaco e Mel', 'Frasco 120 ml • Uso adulto', 'Produto tradicional à base de guaco e mel. Consulte as advertências e o modo de uso antes de consumir.', 'Medicamentos', 'Bosque', 2290, NULL, 27, false, 'approved', true),
('prod_gel_arnica', 'gel-arnica-refrescante-60g', 'Gel de Arnica Refrescante', 'Bisnaga 60 g • Uso externo', 'Gel cosmético de massagem com sensação refrescante. Não aplicar em mucosas ou pele lesionada.', 'Medicamentos', 'MoviBem', 1990, 2490, 29, false, 'approved', true),
('prod_vitamina_c', 'vitamina-c-1g-10-comprimidos', 'Vitamina C 1 g', '10 comprimidos efervescentes', 'Suplemento alimentar em comprimidos efervescentes. Não substitui uma alimentação equilibrada.', 'Vitaminas', 'Vitta', 1890, 2490, 58, false, 'approved', true),
('prod_multivitaminico', 'multivitaminico-a-z-60-comprimidos', 'Multivitamínico A–Z', 'Frasco com 60 comprimidos', 'Suplemento alimentar com vitaminas e minerais para complementar a rotina nutricional.', 'Vitaminas', 'VitaMais', 3790, 4590, 41, false, 'approved', true),
('prod_vitamina_d3', 'vitamina-d3-2000ui-30-capsulas', 'Vitamina D3 2.000 UI', '30 cápsulas • Uso adulto', 'Suplemento alimentar de vitamina D. Consuma conforme a recomendação indicada na embalagem.', 'Vitaminas', 'VitaMais', 2490, NULL, 47, false, 'approved', true),
('prod_magnesio', 'magnesio-quelato-60-capsulas', 'Magnésio Quelato', 'Frasco com 60 cápsulas', 'Suplemento alimentar de magnésio para complementar a ingestão diária de adultos.', 'Vitaminas', 'Nutrivale', 3290, 3990, 36, false, 'approved', true),
('prod_omega_3', 'omega-3-1000mg-60-capsulas', 'Ômega 3 1.000 mg', '60 cápsulas • Óleo de peixe', 'Suplemento alimentar em cápsulas. Pessoas com restrições alimentares devem consultar os ingredientes.', 'Vitaminas', 'Nutrivale', 4490, 5290, 33, false, 'approved', true),
('prod_colageno', 'colageno-hidrolisado-300g', 'Colágeno Hidrolisado', 'Pote 300 g • Sabor neutro', 'Suplemento alimentar em pó para diluição. Não substitui uma alimentação equilibrada.', 'Vitaminas', 'Vitta', 5490, 6490, 22, false, 'approved', true),
('prod_protetor_fps50', 'protetor-solar-facial-fps50-40g', 'Protetor Solar FPS 50', 'Facial • Toque seco • 40 g', 'Proteção facial de amplo espectro, acabamento confortável e resistente à água. Reaplique conforme as instruções da embalagem.', 'Dermocosméticos', 'Solarium', 5990, 7490, 19, false, 'approved', true),
('prod_gel_limpeza', 'gel-limpeza-facial-suave-200ml', 'Gel de Limpeza Facial', 'Pele mista a oleosa • 200 ml', 'Gel de limpeza suave para remover impurezas sem ressecar a pele. Uso diário.', 'Dermocosméticos', 'DermaLeve', 3890, 4490, 31, false, 'approved', true),
('prod_serum_niacinamida', 'serum-niacinamida-10-30ml', 'Sérum de Niacinamida 10%', 'Conta-gotas 30 ml • Sem fragrância', 'Sérum facial de textura leve para a rotina de cuidados. Realize teste de contato antes do primeiro uso.', 'Dermocosméticos', 'Lumina', 5290, 6190, 26, false, 'approved', true),
('prod_agua_micelar', 'agua-micelar-suave-200ml', 'Água Micelar Suave', 'Limpeza facial • 200 ml', 'Solução de limpeza para remover resíduos e maquiagem de forma delicada.', 'Dermocosméticos', 'DermaLeve', 2790, NULL, 43, false, 'approved', true),
('prod_creme_reparador', 'creme-reparador-barreira-50g', 'Creme Reparador de Barreira', 'Pele sensível • 50 g', 'Creme sem fragrância para hidratar e ajudar a proteger a barreira cutânea.', 'Dermocosméticos', 'CalmaPele', 6490, 7290, 18, false, 'approved', true),
('prod_protetor_infantil', 'protetor-solar-infantil-fps60-120ml', 'Protetor Solar Infantil FPS 60', 'Loção resistente à água • 120 ml', 'Proteção solar infantil de amplo espectro. Reaplique com frequência e siga a faixa etária indicada.', 'Dermocosméticos', 'Solarium Kids', 7990, 8990, 16, false, 'approved', true),
('prod_hidratante', 'hidratante-corporal-ceramidas-400ml', 'Hidratante com Ceramidas', 'Corpo e rosto • 400 ml', 'Loção hidratante sem fragrância, formulada para reforçar a barreira da pele e proporcionar hidratação prolongada.', 'Cuidados pessoais', 'DermaLeve', 4990, NULL, 23, false, 'approved', true),
('prod_shampoo_neutro', 'shampoo-neutro-400ml', 'Shampoo Neutro', 'Limpeza suave • 400 ml', 'Shampoo de uso diário com fragrância delicada e espuma suave.', 'Cuidados pessoais', 'Essenza', 2190, 2690, 55, false, 'approved', true),
('prod_condicionador', 'condicionador-hidratacao-350ml', 'Condicionador Hidratação', 'Maciez e desembaraço • 350 ml', 'Condicionador para o cuidado diário dos fios, com enxágue fácil.', 'Cuidados pessoais', 'Essenza', 2290, NULL, 49, false, 'approved', true),
('prod_sabonete_liquido', 'sabonete-liquido-suave-500ml', 'Sabonete Líquido Suave', 'Refil econômico • 500 ml', 'Sabonete líquido para mãos e corpo com fórmula de limpeza delicada.', 'Cuidados pessoais', 'CasaLeve', 1690, 1990, 68, false, 'approved', true),
('prod_desodorante', 'desodorante-roll-on-sem-alcool-50ml', 'Desodorante Roll-on', 'Sem álcool • 50 ml', 'Desodorante de uso diário com fragrância suave. Consulte os ingredientes em caso de sensibilidade.', 'Cuidados pessoais', 'Brisa', 1190, NULL, 61, false, 'approved', true),
('prod_absorvente', 'absorvente-cobertura-suave-16-unidades', 'Absorvente Cobertura Suave', 'Com abas • 16 unidades', 'Absorvente com cobertura suave e canais de proteção para o conforto diário.', 'Cuidados pessoais', 'LeveEla', 1490, 1790, 72, false, 'approved', true),
('prod_creme_maos', 'creme-para-maos-75g', 'Creme para as Mãos', 'Hidratação rápida • 75 g', 'Creme de rápida absorção para manter as mãos macias ao longo do dia.', 'Cuidados pessoais', 'CalmaPele', 1890, NULL, 37, false, 'approved', true),
('prod_repelente', 'repelente-corporal-locao-100ml', 'Repelente Corporal', 'Loção de longa duração • 100 ml', 'Repelente corporal para uso conforme faixa etária e instruções da embalagem.', 'Cuidados pessoais', 'ArLivre', 3190, 3790, 32, false, 'approved', true),
('prod_fralda_m', 'fralda-infantil-conforto-m-32', 'Fralda Conforto M', 'Pacote com 32 unidades', 'Fralda infantil com canais de absorção, laterais elásticas e cobertura respirável para o cuidado diário.', 'Mamãe e bebê', 'Nuvem', 4490, 5290, 28, false, 'approved', true),
('prod_lencos_bebe', 'lencos-umedecidos-bebe-96-unidades', 'Lenços Umedecidos para Bebê', 'Pacote com 96 unidades', 'Lenços sem álcool, com toque macio para a higiene cotidiana do bebê.', 'Mamãe e bebê', 'Nuvem', 1890, 2290, 64, false, 'approved', true),
('prod_pomada_bebe', 'pomada-protetora-bebe-60g', 'Pomada Protetora para Bebê', 'Bisnaga 60 g • Uso diário', 'Pomada de barreira para auxiliar na proteção da pele durante as trocas.', 'Mamãe e bebê', 'BebêLeve', 2390, NULL, 44, false, 'approved', true),
('prod_sabonete_bebe', 'sabonete-liquido-bebe-200ml', 'Sabonete Líquido para Bebê', 'Da cabeça aos pés • 200 ml', 'Sabonete infantil de limpeza suave, desenvolvido para a rotina de banho.', 'Mamãe e bebê', 'BebêLeve', 2590, 2990, 39, false, 'approved', true),
('prod_fralda_g', 'fralda-infantil-conforto-g-28', 'Fralda Conforto G', 'Pacote com 28 unidades', 'Fralda infantil com ajuste confortável, canais de absorção e cobertura respirável.', 'Mamãe e bebê', 'Nuvem', 4690, 5490, 35, false, 'approved', true),
('prod_mamadeiras', 'kit-mamadeiras-150-250ml', 'Kit de Mamadeiras', '2 unidades • 150 ml e 250 ml', 'Kit demonstrativo de mamadeiras com tampa protetora. Esterilize conforme as instruções do fabricante.', 'Mamãe e bebê', 'BebêLeve', 3990, NULL, 21, false, 'approved', true),
('prod_termometro', 'termometro-digital-flexivel', 'Termômetro Digital', 'Ponta flexível • Alerta sonoro', 'Termômetro digital de uso doméstico com leitura rápida, memória da última medição e desligamento automático.', 'Saúde e bem-estar', 'MediCasa', 2990, 3490, 15, false, 'approved', true),
('prod_pressao', 'aparelho-pressao-digital-braco', 'Aparelho de Pressão Digital', 'Braçadeira ajustável • Memória', 'Monitor digital de pressão para uso doméstico. A medição não substitui avaliação profissional.', 'Saúde e bem-estar', 'MediCasa', 14990, 17990, 12, false, 'approved', true),
('prod_oximetro', 'oximetro-digital-de-dedo', 'Oxímetro Digital de Dedo', 'Visor colorido • Estojo', 'Aparelho doméstico para leitura indicativa. Siga o manual e procure orientação diante de resultados incomuns.', 'Saúde e bem-estar', 'PulsoBem', 8990, 10990, 17, false, 'approved', true),
('prod_bolsa_gel', 'bolsa-gel-quente-fria-media', 'Bolsa de Gel Quente e Fria', 'Tamanho médio • Reutilizável', 'Bolsa reutilizável para aplicação térmica conforme instruções de segurança.', 'Saúde e bem-estar', 'MoviBem', 2490, NULL, 30, false, 'approved', true),
('prod_organizador', 'organizador-semanal-medicamentos', 'Organizador Semanal', '7 dias • Quatro períodos', 'Estojo organizador para auxiliar na rotina. Não altera nem substitui a orientação de uso dos medicamentos.', 'Saúde e bem-estar', 'CasaSaúde', 2790, 3290, 46, false, 'approved', true),
('prod_curativos', 'kit-primeiros-cuidados-30-itens', 'Kit Primeiros Cuidados', 'Curativos, gaze e fita • 30 itens', 'Conjunto compacto para pequenos cuidados do dia a dia. Mantenha fora do alcance de crianças.', 'Primeiros socorros', 'Poupe+ Care', 2390, NULL, 36, false, 'approved', true),
('prod_gaze', 'gaze-esteril-10-pacotes', 'Gaze Estéril', '10 pacotes • 7,5 × 7,5 cm', 'Compressas de gaze estéril embaladas individualmente para pequenos cuidados.', 'Primeiros socorros', 'Poupe+ Care', 1290, 1590, 59, false, 'approved', true),
('prod_fita_microporosa', 'fita-microporosa-25mm-10m', 'Fita Microporosa', 'Rolo 25 mm × 10 m', 'Fita hipoalergênica para fixação de curativos, conforme as instruções da embalagem.', 'Primeiros socorros', 'CuraLeve', 890, NULL, 67, false, 'approved', true),
('prod_hidrocoloide', 'curativo-hidrocoloide-6-unidades', 'Curativo Hidrocoloide', 'Caixa com 6 unidades', 'Curativos hidrocoloides para proteção de pequenas áreas, seguindo o modo de uso do fabricante.', 'Primeiros socorros', 'CuraLeve', 2490, 2990, 25, false, 'approved', true),
('prod_escova_dental', 'escova-dental-macia-3-unidades', 'Escova Dental Macia', 'Leve 3 • Cerdas arredondadas', 'Conjunto de escovas com cerdas macias para a higiene oral diária.', 'Higiene oral', 'Sorriso+', 1690, 2090, 73, false, 'approved', true),
('prod_creme_dental', 'creme-dental-dentes-sensiveis-90g', 'Creme Dental para Dentes Sensíveis', 'Proteção diária • 90 g', 'Creme dental para higiene diária. Escove conforme a orientação do profissional de saúde bucal.', 'Higiene oral', 'Sorriso+', 1890, NULL, 54, false, 'approved', true),
('prod_enxaguante', 'enxaguante-bucal-sem-alcool-500ml', 'Enxaguante Bucal sem Álcool', 'Sabor menta suave • 500 ml', 'Enxaguante para complementar a higiene oral. Não ingerir e manter fora do alcance de crianças.', 'Higiene oral', 'Sorriso+', 2390, 2890, 40, false, 'approved', true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  brand = EXCLUDED.brand,
  price_cents = EXCLUDED.price_cents,
  compare_at_cents = EXCLUDED.compare_at_cents,
  stock = EXCLUDED.stock,
  is_active = EXCLUDED.is_active;

-- Banner Inicial
INSERT INTO public.banners (id, title, subtitle, cta_label, cta_href, tone, is_active)
VALUES ('banner_home_main', 'Cuidar do dia a dia pode ser mais simples.', 'Encontre o que precisa e conte com nossa equipe farmacêutica.', 'Ver produtos', '/catalogo', 'sage', true)
ON CONFLICT (id) DO NOTHING;

-- Cupom de Boas-Vindas
INSERT INTO public.discounts (id, name, code, kind, amount, min_subtotal_cents, is_active)
VALUES ('discount_welcome_10', 'Boas-vindas', 'BEMVINDO10', 'fixed', 1000, 5000, true)
ON CONFLICT (id) DO NOTHING;
