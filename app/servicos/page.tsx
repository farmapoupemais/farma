import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Serviços Farmacêuticos | Farmácia Poupe Mais",
  description: "Serviços de saúde e orientação farmacêutica com atendimento humanizado e ambiente reservado.",
};

const services = [
  {
    icon: "heart" as const,
    name: "Aferição de Pressão Arterial",
    time: "15 min",
    text: "Medição precisa com esfigmomanômetro calibrado e registro na sua carteirinha de saúde.",
  },
  {
    icon: "drop" as const,
    name: "Teste de Glicemia Capilar",
    time: "15 min",
    text: "Acompanhamento dos níveis de glicose no sangue com orientação nutricional e preventiva.",
  },
  {
    icon: "shield" as const,
    name: "Orientação Farmacêutica",
    time: "20 min",
    text: "Atendimento reservado para tirar dúvidas sobre horários, posologia e possíveis interações.",
  },
  {
    icon: "thermo" as const,
    name: "Aplicação de Injetáveis e Curativos",
    time: "15 min",
    text: "Procedimentos executados por profissional habilitado em sala própria e com biossegurança.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="inner-main">
        <section className="page-hero">
          <div className="page-shell">
            <div className="breadcrumbs">
              <Link href="/">Início</Link>
              <span>/</span>
              <span>Serviços Farmacêuticos</span>
            </div>
            <span className="eyebrow">Cuidado além do balcão</span>
            <h1>Serviços de saúde perto de você.</h1>
            <p>
              Atendimentos realizados por farmacêuticos habilitados em ambiente reservado, com conforto e segurança.
            </p>
          </div>
        </section>
        <div className="page-shell inner-content">
          <div className="services-grid">
            {services.map((service) => (
              <article key={service.name}>
                <span>
                  <Icon name={service.icon} size={31} />
                </span>
                <small>{service.time}</small>
                <h2>{service.name}</h2>
                <p>{service.text}</p>
                <a
                  href={`https://wa.me/5551981834039?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20o%20servi%C3%A7o%20de%20${encodeURIComponent(service.name)}%20na%20Farm%C3%A1cia%20Poupe%20Mais.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-ghost"
                >
                  Agendar no WhatsApp
                </a>
              </article>
            ))}
          </div>
          <section className="service-note">
            <Icon name="care" size={42} />
            <div>
              <h2>Precisa falar com um farmacêutico agora?</h2>
              <p>
                Nossa equipe está disponível todos os dias para tirar dúvidas de posologia e cuidados com a sua saúde.
                Para sintomas intensos ou emergências, procure imediatamente uma unidade de pronto atendimento.
              </p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
