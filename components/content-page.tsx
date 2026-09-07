import Link from "next/link";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function ContentPage({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: React.ReactNode }) {
  return <><SiteHeader /><main className="inner-main"><section className="page-hero"><div className="page-shell"><div className="breadcrumbs"><Link href="/">Início</Link><span>/</span><span>{title}</span></div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></section><article className="page-shell prose-content">{children}</article></main><SiteFooter /></>;
}
