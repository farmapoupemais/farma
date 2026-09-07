import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
export default function NotFound() { return <><SiteHeader /><main className="page-shell not-found"><span><Icon name="search" size={40} /></span><p className="eyebrow">Página não encontrada</p><h1>Esse cuidado mudou de endereço.</h1><p>Volte ao início ou procure o produto no nosso catálogo.</p><div><Link href="/" className="button button-primary">Ir para o início</Link><Link href="/catalogo" className="button button-ghost">Abrir catálogo</Link></div></main><SiteFooter /></>; }
