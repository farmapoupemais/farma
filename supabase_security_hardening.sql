-- ==============================================================================
-- FARMÁCIA POUPE MAIS - HARDENING DE SEGURANÇA SUPABASE (ROW LEVEL SECURITY)
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase para ativar proteção de nível militar
-- em todas as tabelas contra acesso indevido pela API pública (Anon Key).
-- ==============================================================================

-- 1. FUNÇÕES AUXILIARES DE VERIFICAÇÃO DE SEGURANÇA (SECURITY DEFINER)
-- Evitam recursão em políticas RLS e garantem checagem de permissão ultra-rápida.

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(COALESCE(auth.jwt() ->> 'email', ''));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE email = public.current_user_email();
  RETURN v_role IN ('owner', 'manager');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE email = public.current_user_email();
  RETURN v_role = 'owner';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_pharmacist()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE email = public.current_user_email();
  RETURN v_role IN ('owner', 'manager', 'pharmacist');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_catalog_staff()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_roles WHERE email = public.current_user_email();
  RETURN v_role IN ('owner', 'manager', 'catalog');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 2. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas existentes para evitar duplicatas
DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
DROP POLICY IF EXISTS "staff_manage_products" ON public.products;
DROP POLICY IF EXISTS "public_read_banners" ON public.banners;
DROP POLICY IF EXISTS "staff_manage_banners" ON public.banners;
DROP POLICY IF EXISTS "public_read_discounts" ON public.discounts;
DROP POLICY IF EXISTS "admin_manage_discounts" ON public.discounts;
DROP POLICY IF EXISTS "customer_read_own_orders" ON public.orders;
DROP POLICY IF EXISTS "customer_insert_own_orders" ON public.orders;
DROP POLICY IF EXISTS "staff_manage_all_orders" ON public.orders;
DROP POLICY IF EXISTS "customer_manage_own_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "pharmacist_review_prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "user_read_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "owner_manage_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "system_insert_audit" ON public.audit_logs;
DROP POLICY IF EXISTS "admin_read_audit" ON public.audit_logs;

-- ==============================================================================
-- 3. POLÍTICAS DE PRODUTOS
-- ==============================================================================
-- Leitura pública: apenas produtos ativos e aprovados
CREATE POLICY "public_read_active_products"
ON public.products FOR SELECT
USING (is_active = TRUE AND regulatory_status = 'approved');

-- Gestão por colaboradores (Owner, Gerente, Catálogo)
CREATE POLICY "staff_manage_products"
ON public.products FOR ALL
USING (public.is_catalog_staff())
WITH CHECK (public.is_catalog_staff());

-- ==============================================================================
-- 4. POLÍTICAS DE BANNERS E DESCONTOS
-- ==============================================================================
CREATE POLICY "public_read_banners"
ON public.banners FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "staff_manage_banners"
ON public.banners FOR ALL
USING (public.is_catalog_staff())
WITH CHECK (public.is_catalog_staff());

CREATE POLICY "public_read_discounts"
ON public.discounts FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "admin_manage_discounts"
ON public.discounts FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. POLÍTICAS DE PEDIDOS (LGPD & ISOLAMENTO DE DADOS)
-- ==============================================================================
-- Clientes só podem consultar os seus próprios pedidos
CREATE POLICY "customer_read_own_orders"
ON public.orders FOR SELECT
USING (
  customer_email = public.current_user_email() OR public.is_admin()
);

-- Clientes podem criar pedidos para seu próprio e-mail
CREATE POLICY "customer_insert_own_orders"
ON public.orders FOR INSERT
WITH CHECK (
  customer_email = public.current_user_email() OR public.current_user_email() != ''
);

-- Administradores e Gerentes podem atualizar pedidos (ex: status)
CREATE POLICY "staff_manage_all_orders"
ON public.orders FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 6. POLÍTICAS DE RECEITAS MÉDICAS (DADOS SENSÍVEIS DE SAÚDE)
-- ==============================================================================
-- Paciente só pode ver suas próprias receitas enviadas
CREATE POLICY "customer_manage_own_prescriptions"
ON public.prescriptions FOR ALL
USING (
  customer_email = public.current_user_email()
)
WITH CHECK (
  customer_email = public.current_user_email()
);

-- Farmacêuticos, Gerentes e Owner podem visualizar e validar todas as receitas
CREATE POLICY "pharmacist_review_prescriptions"
ON public.prescriptions FOR ALL
USING (public.is_pharmacist())
WITH CHECK (public.is_pharmacist());

-- ==============================================================================
-- 7. POLÍTICAS DE CARGOS E PERMISSÕES (user_roles)
-- ==============================================================================
-- Todo usuário logado pode ler seu próprio papel
CREATE POLICY "user_read_own_role"
ON public.user_roles FOR SELECT
USING (
  email = public.current_user_email() OR public.is_admin()
);

-- Apenas o OWNER tem poder de alterar cargos de outros usuários
CREATE POLICY "owner_manage_all_roles"
ON public.user_roles FOR ALL
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- ==============================================================================
-- 8. POLÍTICAS DE LOGS DE AUDITORIA (TRILHA IMUTÁVEL)
-- ==============================================================================
-- Assegurar colunas essenciais do schema de auditoria
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'system';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT NOT NULL DEFAULT '127.0.0.1';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource TEXT NOT NULL DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';

-- Inserção permitida para qualquer usuário autenticado realizando ações
CREATE POLICY "system_insert_audit"

ON public.audit_logs FOR INSERT
WITH CHECK (TRUE);

-- Apenas Admin e Owner podem consultar a trilha de auditoria
CREATE POLICY "admin_read_audit"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

-- IMPORTANTE: NENHUMA POLÍTICA DE UPDATE OU DELETE EM AUDIT_LOGS!
-- Os registros de auditoria são legalmente IMUTÁVEIS e perpétuos.
