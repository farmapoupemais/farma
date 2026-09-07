CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`cta_label` text NOT NULL,
	`cta_href` text NOT NULL,
	`tone` text DEFAULT 'sage' NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`min_subtotal_cents` integer DEFAULT 0 NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discounts_code_unique` ON `discounts` (`code`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_email` text NOT NULL,
	`status` text DEFAULT 'awaiting_payment' NOT NULL,
	`fulfillment` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`shipping_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`items_json` text NOT NULL,
	`address_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_email` text NOT NULL,
	`object_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`reviewer_email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prescriptions_object_key_unique` ON `prescriptions` (`object_key`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`brand` text NOT NULL,
	`price_cents` integer NOT NULL,
	`compare_at_cents` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`requires_prescription` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `products` (`id`, `slug`, `name`, `short_description`, `description`, `category`, `brand`, `price_cents`, `compare_at_cents`, `stock`, `requires_prescription`, `is_active`) VALUES
('prod_paracetamol_750', 'paracetamol-750mg-20-comprimidos', 'Paracetamol 750 mg', '20 comprimidos • Medicamento genérico', 'Medicamento isento de prescrição indicado para alívio temporário de dores leves a moderadas e febre. Leia a bula e, em caso de dúvida, consulte o farmacêutico.', 'Medicamentos', 'Genérico', 1290, 1690, 42, 0, 1),
('prod_dipirona_gotas', 'dipirona-500mg-ml-20ml', 'Dipirona 500 mg/ml', 'Solução oral • Frasco 20 ml', 'Medicamento isento de prescrição para alívio de dor e febre. Use somente conforme a bula e orientação profissional.', 'Medicamentos', 'Essencial Genéricos', 1090, NULL, 31, 0, 1),
('prod_vitamina_c', 'vitamina-c-1g-10-comprimidos', 'Vitamina C 1 g', '10 comprimidos efervescentes', 'Suplemento alimentar em comprimidos efervescentes. Não substitui uma alimentação equilibrada.', 'Vitaminas', 'Vitta', 1890, 2490, 58, 0, 1),
('prod_protetor_fps50', 'protetor-solar-facial-fps50-40g', 'Protetor Solar FPS 50', 'Facial • Toque seco • 40 g', 'Proteção facial de amplo espectro, acabamento confortável e resistente à água. Reaplique conforme as instruções da embalagem.', 'Dermocosméticos', 'Solarium', 5990, 7490, 19, 0, 1),
('prod_hidratante', 'hidratante-corporal-ceramidas-400ml', 'Hidratante com Ceramidas', 'Corpo e rosto • 400 ml', 'Loção hidratante sem fragrância, formulada para reforçar a barreira da pele e proporcionar hidratação prolongada.', 'Cuidados pessoais', 'DermaLeve', 4990, NULL, 23, 0, 1),
('prod_termometro', 'termometro-digital-flexivel', 'Termômetro Digital', 'Ponta flexível • Alerta sonoro', 'Termômetro digital de uso doméstico com leitura rápida, memória da última medição e desligamento automático.', 'Saúde e bem-estar', 'MediCasa', 2990, 3490, 15, 0, 1),
('prod_fralda_m', 'fralda-infantil-conforto-m-32', 'Fralda Conforto M', 'Pacote com 32 unidades', 'Fralda infantil com canais de absorção, laterais elásticas e cobertura respirável para o cuidado diário.', 'Mamãe e bebê', 'Nuvem', 4490, 5290, 28, 0, 1),
('prod_curativos', 'kit-primeiros-cuidados-30-itens', 'Kit Primeiros Cuidados', 'Curativos, gaze e fita • 30 itens', 'Conjunto compacto para pequenos cuidados do dia a dia. Mantenha fora do alcance de crianças.', 'Primeiros socorros', 'Essencial Care', 2390, NULL, 36, 0, 1);
--> statement-breakpoint
INSERT INTO `banners` (`id`, `title`, `subtitle`, `cta_label`, `cta_href`, `tone`, `is_active`) VALUES
('banner_home_main', 'Cuidar do dia a dia pode ser mais simples.', 'Encontre o que precisa e conte com nossa equipe farmacêutica.', 'Ver produtos', '/catalogo', 'sage', 1);
--> statement-breakpoint
INSERT INTO `discounts` (`id`, `name`, `code`, `kind`, `amount`, `min_subtotal_cents`, `is_active`) VALUES
('discount_welcome_10', 'Boas-vindas', 'BEMVINDO10', 'fixed', 1000, 5000, 1);
