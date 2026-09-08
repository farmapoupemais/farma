"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/catalog";
import type { CartItem } from "./product-card";
import { Icon } from "./icons";

export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "boleto" | "cash_on_delivery";

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
};

export type DeliveryAddress = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  instructions?: string;
};

export type CreditCardData = {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  installments: number;
  saveCard: boolean;
};

export type CompletedOrder = {
  id: string;
  status: string;
  createdAt: string;
  fulfillment: "delivery" | "pickup";
  paymentMethod: PaymentMethod;
  gatewayProvider: string; // ex: "stripe_ready", "simulated"
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items: CartItem[];
  customer: CustomerInfo;
  address?: DeliveryAddress | null;
  pixPayload?: {
    qrCodeText: string;
    copiaECola: string;
    expiresInMinutes: number;
  };
  boletoPayload?: {
    linhaDigitavel: string;
    vencimento: string;
  };
  cashChangeFor?: number;
};

function cleanDigits(val: string) {
  return val.replace(/\D/g, "");
}

function maskCpf(val: string) {
  const digits = cleanDigits(val).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskPhone(val: string) {
  const digits = cleanDigits(val).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskCep(val: string) {
  const digits = cleanDigits(val).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function maskCardNumber(val: string) {
  const digits = cleanDigits(val).slice(0, 16);
  return digits.replace(/(\d{4})/g, "$1 ").trim();
}

function maskExpiry(val: string) {
  const digits = cleanDigits(val).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectCardBrand(num: string): string {
  const digits = cleanDigits(num);
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^4011|^4389|^5041|^6362/.test(digits)) return "Elo";
  if (/^3841|^60/.test(digits)) return "Hipercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Cartão";
}

export function CheckoutWizard() {
  const [lines, setLines] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "success">("details");

  // Step 1 - Fulfillment & Customer
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [address, setAddress] = useState<DeliveryAddress>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "RS",
    instructions: "",
  });
  const [cepLoading, setCepLoading] = useState(false);

  // Coupon
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  // Step 2 - Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [creditCard, setCreditCard] = useState<CreditCardData>({
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    installments: 1,
    saveCard: false,
  });
  const [cashChangeFor, setCashChangeFor] = useState<string>("");
  const [onDeliveryType, setOnDeliveryType] = useState<"money" | "pos_machine">("money");

  // Submission & Result
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [boletoCopied, setBoletoCopied] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("poupe-mais-cart") ?? "[]") as CartItem[];
        setLines(stored);
      } catch {
        setLines([]);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Autofill CEP using ViaCEP
  async function handleCepBlur(rawCep: string) {
    const digits = cleanDigits(rawCep);
    if (digits.length === 8) {
      try {
        setCepLoading(true);
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddress((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch {
        // Fallback gracefully
      } finally {
        setCepLoading(false);
      }
    }
  }

  // Financial Calculations
  const subtotalCents = useMemo(
    () => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
    [lines]
  );
  const couponDiscountCents = couponApplied ? Math.min(1000, subtotalCents) : 0;
  // 5% additional discount on Pix
  const pixDiscountCents =
    paymentMethod === "pix"
      ? Math.round((subtotalCents - couponDiscountCents) * 0.05)
      : 0;
  const totalDiscountCents = couponDiscountCents + pixDiscountCents;
  const shippingCents =
    fulfillment === "delivery" && subtotalCents > 0 && subtotalCents < 14900
      ? 990
      : 0;
  const finalTotalCents = Math.max(0, subtotalCents - totalDiscountCents + shippingCents);

  // Step 1 Validation
  function validateDetails(): boolean {
    setErrorMessage(null);
    if (!customer.name.trim() || customer.name.trim().split(" ").length < 2) {
      setErrorMessage("Por favor, informe seu nome completo.");
      return false;
    }
    if (!customer.email.includes("@") || !customer.email.includes(".")) {
      setErrorMessage("Por favor, informe um e-mail válido para confirmação.");
      return false;
    }
    if (cleanDigits(customer.phone).length < 10) {
      setErrorMessage("Por favor, informe um telefone/WhatsApp válido com DDD.");
      return false;
    }
    if (cleanDigits(customer.cpf).length !== 11) {
      setErrorMessage("Por favor, informe um CPF válido com 11 dígitos para emissão da nota fiscal.");
      return false;
    }
    if (fulfillment === "delivery") {
      if (cleanDigits(address.cep).length !== 8) {
        setErrorMessage("Por favor, informe um CEP válido com 8 dígitos.");
        return false;
      }
      if (!address.street.trim() || !address.number.trim()) {
        setErrorMessage("Por favor, informe a rua e o número para a tele-entrega.");
        return false;
      }
      if (!address.city.trim()) {
        setErrorMessage("Por favor, informe a cidade de entrega.");
        return false;
      }
    }
    return true;
  }

  function goToPayment() {
    if (validateDetails()) {
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function validatePayment(): boolean {
    setErrorMessage(null);
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const cardDigits = cleanDigits(creditCard.cardNumber);
      if (cardDigits.length < 13 || cardDigits.length > 19) {
        setErrorMessage("Número de cartão inválido. Verifique os 16 dígitos.");
        return false;
      }
      if (!creditCard.cardName.trim()) {
        setErrorMessage("Informe o nome do titular como impresso no cartão.");
        return false;
      }
      if (cleanDigits(creditCard.cardExpiry).length !== 4) {
        setErrorMessage("Informe a data de validade (MM/AA).");
        return false;
      }
      if (cleanDigits(creditCard.cardCvv).length < 3) {
        setErrorMessage("Informe o código de segurança (CVV).");
        return false;
      }
    }
    if (paymentMethod === "cash_on_delivery" && onDeliveryType === "money") {
      if (cashChangeFor.trim()) {
        const changeVal = parseFloat(cashChangeFor.replace(",", "."));
        if (isNaN(changeVal) || changeVal * 100 < finalTotalCents) {
          setErrorMessage(
            `O valor para troco deve ser maior ou igual ao total do pedido (${formatCurrency(finalTotalCents)}).`
          );
          return false;
        }
      }
    }
    return true;
  }

  async function handleFinalizeOrder() {
    if (!validatePayment()) return;

    setSubmitting(true);
    setErrorMessage(null);

    const orderId = "PM-" + Math.floor(100000 + Math.random() * 900000);
    const createdAt = new Date().toISOString();

    const orderData: CompletedOrder = {
      id: orderId,
      status:
        paymentMethod === "pix"
          ? "Aguardando Pagamento Pix"
          : paymentMethod === "credit_card"
          ? "Pagamento Aprovado (Simulação - Stripe Ready)"
          : paymentMethod === "debit_card"
          ? "Pagamento Aprovado (Simulação)"
          : paymentMethod === "boleto"
          ? "Aguardando Compensação Bancária"
          : "Confirmado (Pagamento na Entrega)",
      createdAt,
      fulfillment,
      paymentMethod,
      gatewayProvider: "stripe_ready", // Arquitetura pronta para plugar Stripe Elements / Intent
      subtotalCents,
      discountCents: totalDiscountCents,
      shippingCents,
      totalCents: finalTotalCents,
      items: lines,
      customer,
      address: fulfillment === "delivery" ? address : null,
      pixPayload:
        paymentMethod === "pix"
          ? {
              qrCodeText: `00020126580014BR.GOV.BCB.PIX0136poupemais-pix-${orderId}520400005303986540${(
                finalTotalCents / 100
              ).toFixed(2)}5802BR5920FARMACIA POUPE MAIS6009PORTO AL62070503***6304ABCD`,
              copiaECola: `00020126580014BR.GOV.BCB.PIX0136poupemais-pix-${orderId}520400005303986540${(
                finalTotalCents / 100
              ).toFixed(2)}5802BR5920FARMACIA POUPE MAIS6009PORTO AL62070503***6304ABCD`,
              expiresInMinutes: 15,
            }
          : undefined,
      boletoPayload:
        paymentMethod === "boleto"
          ? {
              linhaDigitavel: `23793.38128 60000.123456 78000.987654 1 ${Math.floor(
                1000000000 + Math.random() * 9000000000
              )}`,
              vencimento: new Date(Date.now() + 3 * 86400 * 1000).toLocaleDateString("pt-BR"),
            }
          : undefined,
      cashChangeFor:
        paymentMethod === "cash_on_delivery" && onDeliveryType === "money" && cashChangeFor
          ? parseFloat(cashChangeFor.replace(",", ".")) * 100
          : undefined,
    };

    // Attempt to notify API backend
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map(({ id, quantity }) => ({ id, quantity })),
          fulfillment,
          coupon: couponApplied ? coupon : "",
          guestEmail: customer.email,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_cpf: customer.cpf,
          payment_method: paymentMethod,
          address: fulfillment === "delivery" ? address : null,
        }),
      });
    } catch {
      // Backend mock fallback
    }

    // Persist to local order history
    try {
      const existing = JSON.parse(localStorage.getItem("poupe-mais-orders") ?? "[]");
      localStorage.setItem("poupe-mais-orders", JSON.stringify([orderData, ...existing]));
    } catch {
      // ignore
    }

    // Clear cart
    localStorage.setItem("poupe-mais-cart", "[]");
    window.dispatchEvent(new Event("poupe-mais-cart-updated"));

    setCompletedOrder(orderData);
    setStep("success");
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCopyPix() {
    if (completedOrder?.pixPayload?.copiaECola) {
      navigator.clipboard.writeText(completedOrder.pixPayload.copiaECola);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  }

  function handleCopyBoleto() {
    if (completedOrder?.boletoPayload?.linhaDigitavel) {
      navigator.clipboard.writeText(completedOrder.boletoPayload.linhaDigitavel);
      setBoletoCopied(true);
      setTimeout(() => setBoletoCopied(false), 3000);
    }
  }

  if (!ready) {
    return (
      <div className="cart-loading" style={{ textAlign: "center", padding: "60px 0" }}>
        <p>Carregando etapa de pagamento…</p>
      </div>
    );
  }

  if (!lines.length && step !== "success") {
    return (
      <div className="empty-state cart-empty" style={{ textAlign: "center", padding: "60px 20px" }}>
        <span>
          <Icon name="cart" size={42} />
        </span>
        <h2 style={{ margin: "16px 0 8px", fontSize: "1.6rem" }}>Seu carrinho está vazio</h2>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          Adicione produtos ao carrinho antes de finalizar seu pedido.
        </p>
        <Link href="/catalogo" className="button button-primary">
          Explorar catálogo da Poupe Mais
        </Link>
      </div>
    );
  }

  // ==========================================
  // STEP 3: TELA DE CONFIRMAÇÃO DO PEDIDO (ESQUELETO COMPLETO)
  // ==========================================
  if (step === "success" && completedOrder) {
    return (
      <div className="checkout-success-container">
        <div className="checkout-success-header">
          <div className="success-icon-badge">
            <Icon name="check" size={32} />
          </div>
          <h1>Pedido Realizado com Sucesso!</h1>
          <p className="order-number-line">
            Número do Pedido: <strong>{completedOrder.id}</strong>
          </p>
          <span className="order-status-badge">{completedOrder.status}</span>
        </div>

        {/* Integration Readiness Notice */}
        <div className="stripe-skeleton-alert">
          <Icon name="spark" size={20} />
          <div>
            <strong>Esqueleto de Pagamento Pronto para Integração:</strong>
            <p>
              Fluxo completo validado! Quando for plugar o gateway (Stripe, Pagar.me ou outro), basta conectar
              as chaves no painel administrativo e ativar a chamada de checkout.
            </p>
          </div>
        </div>

        {/* Timeline do Pedido */}
        <div className="order-timeline-card">
          <h3>Acompanhamento do Pedido</h3>
          <div className="order-timeline">
            <div className="timeline-step completed">
              <span className="step-circle"><Icon name="check" size={14} /></span>
              <div className="step-content">
                <strong>1. Pedido Criado</strong>
                <small>Recebido no sistema</small>
              </div>
            </div>
            <div className={`timeline-step ${completedOrder.paymentMethod === "credit_card" || completedOrder.paymentMethod === "debit_card" ? "completed" : "active"}`}>
              <span className="step-circle">2</span>
              <div className="step-content">
                <strong>2. Pagamento</strong>
                <small>
                  {completedOrder.paymentMethod === "pix"
                    ? "Aguardando Pix"
                    : completedOrder.paymentMethod === "credit_card"
                    ? "Aprovado na operadora"
                    : completedOrder.paymentMethod === "boleto"
                    ? "Compensação em 1 dia"
                    : "No ato da entrega"}
                </small>
              </div>
            </div>
            <div className="timeline-step">
              <span className="step-circle">3</span>
              <div className="step-content">
                <strong>3. Separação</strong>
                <small>Conferência farmacêutica</small>
              </div>
            </div>
            <div className="timeline-step">
              <span className="step-circle">4</span>
              <div className="step-content">
                <strong>4. {completedOrder.fulfillment === "delivery" ? "Tele-Entrega" : "Pronto na Loja"}</strong>
                <small>{completedOrder.fulfillment === "delivery" ? "Em rota com motoboy" : "Balcão central"}</small>
              </div>
            </div>
            <div className="timeline-step">
              <span className="step-circle">5</span>
              <div className="step-content">
                <strong>5. Concluído</strong>
                <small>Entregue ao cliente</small>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco específico de Pix se método for Pix */}
        {completedOrder.paymentMethod === "pix" && completedOrder.pixPayload && (
          <div className="pix-instruction-card">
            <div className="pix-card-header">
              <Icon name="qr-code" size={26} />
              <div>
                <h3>Pague via Pix para despacho imediato</h3>
                <p>Abra o app do seu banco, escolha Pix e escaneie o código ou copie a chave.</p>
              </div>
            </div>
            <div className="pix-card-body">
              <div className="pix-qr-frame">
                <svg viewBox="0 0 160 160" width="160" height="160" className="pix-qr-svg">
                  <rect width="160" height="160" fill="#ffffff" rx="8" />
                  <rect x="15" y="15" width="35" height="35" fill="#00874e" rx="4" />
                  <rect x="23" y="23" width="19" height="19" fill="#ffffff" />
                  <rect x="28" y="28" width="9" height="9" fill="#00874e" />
                  <rect x="110" y="15" width="35" height="35" fill="#00874e" rx="4" />
                  <rect x="118" y="23" width="19" height="19" fill="#ffffff" />
                  <rect x="123" y="28" width="9" height="9" fill="#00874e" />
                  <rect x="15" y="110" width="35" height="35" fill="#00874e" rx="4" />
                  <rect x="23" y="118" width="19" height="19" fill="#ffffff" />
                  <rect x="28" y="123" width="9" height="9" fill="#00874e" />
                  <rect x="60" y="20" width="8" height="8" fill="#1b1948" />
                  <rect x="75" y="15" width="12" height="6" fill="#1b1948" />
                  <rect x="92" y="22" width="6" height="12" fill="#1b1948" />
                  <rect x="60" y="38" width="15" height="6" fill="#1b1948" />
                  <rect x="85" y="36" width="10" height="10" fill="#1b1948" />
                  <rect x="20" y="65" width="10" height="6" fill="#1b1948" />
                  <rect x="40" y="60" width="8" height="14" fill="#1b1948" />
                  <rect x="65" y="55" width="30" height="30" fill="#0070ba" rx="6" />
                  <text x="80" y="74" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">PIX</text>
                  <rect x="110" y="65" width="12" height="10" fill="#1b1948" />
                  <rect x="130" y="60" width="14" height="6" fill="#1b1948" />
                  <rect x="60" y="95" width="8" height="14" fill="#1b1948" />
                  <rect x="80" y="100" width="18" height="8" fill="#1b1948" />
                  <rect x="105" y="95" width="10" height="10" fill="#1b1948" />
                  <rect x="125" y="105" width="15" height="6" fill="#1b1948" />
                  <rect x="65" y="125" width="14" height="14" fill="#1b1948" />
                  <rect x="90" y="130" width="16" height="8" fill="#1b1948" />
                  <rect x="115" y="125" width="8" height="18" fill="#1b1948" />
                  <rect x="135" y="135" width="10" height="10" fill="#1b1948" />
                </svg>
                <div className="pix-timer">
                  <Icon name="clock" size={16} /> Expira em 15 minutos
                </div>
              </div>
              <div className="pix-copy-area">
                <label>Pix Copia e Cola:</label>
                <div className="pix-input-group">
                  <input readOnly value={completedOrder.pixPayload.copiaECola} />
                  <button type="button" onClick={handleCopyPix} className="btn-copy-pix">
                    <Icon name={pixCopied ? "check" : "copy"} size={18} />
                    {pixCopied ? "Copiado!" : "Copiar código"}
                  </button>
                </div>
                <ul className="pix-bullet-points">
                  <li>O pagamento é reconhecido automaticamente em segundos.</li>
                  <li>Não é necessário enviar comprovante.</li>
                  <li>Economia de 5% já computada no valor final: <strong>{formatCurrency(completedOrder.totalCents)}</strong>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bloco de Boleto se for boleto */}
        {completedOrder.paymentMethod === "boleto" && completedOrder.boletoPayload && (
          <div className="boleto-instruction-card">
            <div className="boleto-header">
              <Icon name="document" size={24} />
              <div>
                <h3>Boleto Bancário Gerado</h3>
                <p>Vencimento em: <strong>{completedOrder.boletoPayload.vencimento}</strong></p>
              </div>
            </div>
            <div className="boleto-code-row">
              <input readOnly value={completedOrder.boletoPayload.linhaDigitavel} />
              <button type="button" onClick={handleCopyBoleto}>
                <Icon name={boletoCopied ? "check" : "copy"} size={16} />
                {boletoCopied ? "Copiado!" : "Copiar Linha"}
              </button>
            </div>
            <p className="boleto-note">
              Você pode pagar pelo internet banking, app do banco ou agências lotéricas.
            </p>
          </div>
        )}

        {/* Resumo do Pedido Realizado */}
        <div className="order-details-grid">
          <div className="order-details-box">
            <h4>Endereço de {completedOrder.fulfillment === "delivery" ? "Entrega" : "Retirada"}</h4>
            {completedOrder.fulfillment === "delivery" && completedOrder.address ? (
              <p>
                {completedOrder.address.street}, {completedOrder.address.number}
                {completedOrder.address.complement ? ` - ${completedOrder.address.complement}` : ""}
                <br />
                {completedOrder.address.neighborhood} • {completedOrder.address.city} - {completedOrder.address.state}
                <br />
                CEP: {completedOrder.address.cep}
              </p>
            ) : (
              <p>
                <strong>Farmácia Poupe Mais — Loja Central</strong>
                <br />
                Rua das Flores, 120 • Centro
                <br />
                Pronto para retirada em até 30 minutos após confirmação.
              </p>
            )}
          </div>

          <div className="order-details-box">
            <h4>Forma de Pagamento</h4>
            <p>
              <strong>
                {completedOrder.paymentMethod === "pix"
                  ? "Pix (Desconto de 5% aplicado)"
                  : completedOrder.paymentMethod === "credit_card"
                  ? "Cartão de Crédito"
                  : completedOrder.paymentMethod === "debit_card"
                  ? "Cartão de Débito"
                  : completedOrder.paymentMethod === "boleto"
                  ? "Boleto Bancário"
                  : "Dinheiro / Maquininha na Entrega"}
              </strong>
              <br />
              Total: <strong>{formatCurrency(completedOrder.totalCents)}</strong>
            </p>
          </div>
        </div>

        {/* Lista de Itens Comprados */}
        <div className="order-items-summary-card">
          <h4>Itens do Pedido ({completedOrder.items.length})</h4>
          <div className="summary-items-list">
            {completedOrder.items.map((item) => (
              <div key={item.id} className="summary-item-line">
                <span>{item.quantity}x {item.name}</span>
                <strong>{formatCurrency(item.priceCents * item.quantity)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Ações Finais */}
        <div className="checkout-success-actions">
          <Link href="/painel" className="button button-primary">
            Ver meus pedidos no Painel
          </Link>
          <a
            href="https://wa.me/5551981834039?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20meu%20pedido%20Farm%C3%A1cia%20Poupe%20Mais"
            target="_blank"
            rel="noreferrer"
            className="button button-ghost"
          >
            Falar com Tele-Entrega no WhatsApp
          </a>
          <button
            type="button"
            className="button button-light"
            onClick={() => window.print()}
          >
            <Icon name="download" size={16} /> Imprimir Comprovante
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEPS 1 & 2: WIZARD DE CHECKOUT
  // ==========================================
  return (
    <div className="checkout-wizard-wrapper">
      {/* Stepper Header */}
      <nav className="checkout-stepper" aria-label="Progresso da compra">
        <div className={`step-item ${step === "details" ? "current" : "done"}`}>
          <span className="step-num">1</span>
          <div className="step-text">
            <strong>Identificação e Entrega</strong>
            <small>Seus dados e endereço</small>
          </div>
        </div>
        <div className="step-divider" />
        <div className={`step-item ${step === "payment" ? "current" : ""}`}>
          <span className="step-num">2</span>
          <div className="step-text">
            <strong>Forma de Pagamento</strong>
            <small>Pix, Cartão, Boleto ou Dinheiro</small>
          </div>
        </div>
        <div className="step-divider" />
        <div className="step-item">
          <span className="step-num">3</span>
          <div className="step-text">
            <strong>Confirmação</strong>
            <small>Pedido finalizado</small>
          </div>
        </div>
      </nav>

      {errorMessage && (
        <div className="checkout-error-banner" role="alert">
          <Icon name="alert" size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="checkout-columns">
        {/* Main Column */}
        <div className="checkout-main-panel">
          {step === "details" && (
            <section className="checkout-step-section">
              <div className="step-section-heading">
                <h2>1. Dados para Contato e Entrega</h2>
                <p>Usaremos estas informações para a nota fiscal e rastreamento da tele-entrega.</p>
              </div>

              {/* Customer Details Form */}
              <div className="checkout-form-grid">
                <label className="field-full">
                  <span>Nome Completo *</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria dos Santos Silva"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                </label>

                <label>
                  <span>E-mail para Confirmação *</span>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                </label>

                <label>
                  <span>WhatsApp / Telefone *</span>
                  <input
                    type="tel"
                    required
                    placeholder="(51) 98183-4039"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: maskPhone(e.target.value) })}
                  />
                </label>

                <label>
                  <span>CPF (para Nota Fiscal) *</span>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={customer.cpf}
                    onChange={(e) => setCustomer({ ...customer, cpf: maskCpf(e.target.value) })}
                  />
                </label>
              </div>

              {/* Fulfillment Selection */}
              <div className="fulfillment-selection-block">
                <h3>Escolha a Modalidade de Recebimento</h3>
                <div className="fulfillment-options">
                  <button
                    type="button"
                    className={`fulfillment-box ${fulfillment === "delivery" ? "selected" : ""}`}
                    onClick={() => setFulfillment("delivery")}
                  >
                    <div className="box-header">
                      <Icon name="truck" size={24} />
                      <strong>Tele-Entrega Farmácia Poupe Mais</strong>
                    </div>
                    <p>Entrega expressa na sua porta em até 90 minutos.</p>
                    <span className="box-price">
                      {subtotalCents >= 14900 ? "Frete Grátis" : "R$ 9,90"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`fulfillment-box ${fulfillment === "pickup" ? "selected" : ""}`}
                    onClick={() => setFulfillment("pickup")}
                  >
                    <div className="box-header">
                      <Icon name="store" size={24} />
                      <strong>Retirada Expressa na Loja</strong>
                    </div>
                    <p>Retire gratuitamente na Loja Central em 30 min.</p>
                    <span className="box-price free">Grátis</span>
                  </button>
                </div>
              </div>

              {/* Delivery Address Fields */}
              {fulfillment === "delivery" ? (
                <div className="address-form-block">
                  <h3>Endereço de Entrega</h3>
                  <div className="checkout-form-grid">
                    <label>
                      <span>CEP * {cepLoading && <small>(buscando...)</small>}</span>
                      <input
                        type="text"
                        required
                        placeholder="00000-000"
                        maxLength={9}
                        value={address.cep}
                        onChange={(e) => {
                          const val = maskCep(e.target.value);
                          setAddress({ ...address, cep: val });
                          if (cleanDigits(val).length === 8) handleCepBlur(val);
                        }}
                      />
                    </label>

                    <label className="field-full">
                      <span>Rua / Avenida *</span>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Av. Flores da Cunha"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Número *</span>
                      <input
                        type="text"
                        required
                        placeholder="120"
                        value={address.number}
                        onChange={(e) => setAddress({ ...address, number: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Complemento / Apto</span>
                      <input
                        type="text"
                        placeholder="Apto 302, Bloco B"
                        value={address.complement}
                        onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Bairro *</span>
                      <input
                        type="text"
                        required
                        placeholder="Centro"
                        value={address.neighborhood}
                        onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Cidade *</span>
                      <input
                        type="text"
                        required
                        placeholder="Porto Alegre"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                    </label>

                    <label className="field-full">
                      <span>Ponto de Referência ou Instruções para o Motoboy</span>
                      <input
                        type="text"
                        placeholder="Ex: Próximo à praça central, tocar campainha preta"
                        value={address.instructions}
                        onChange={(e) => setAddress({ ...address, instructions: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="pickup-address-card">
                  <Icon name="store" size={32} />
                  <div>
                    <strong>Ponto de Retirada Oficial:</strong>
                    <p>Farmácia Poupe Mais — Unidade Central</p>
                    <small>Rua das Flores, 120, Centro • Aberto até 22:00</small>
                  </div>
                </div>
              )}

              <div className="checkout-action-row">
                <Link href="/carrinho" className="button button-ghost">
                  ← Voltar ao Carrinho
                </Link>
                <button type="button" className="button button-primary" onClick={goToPayment}>
                  Avançar para Pagamento →
                </button>
              </div>
            </section>
          )}

          {step === "payment" && (
            <section className="checkout-step-section">
              <div className="step-section-heading">
                <h2>2. Escolha como Deseja Pagar</h2>
                <p>Estrutura pronta para conectar com Stripe, Mercado Pago ou outro gateway.</p>
              </div>

              {/* Payment Methods Selector Tabs */}
              <div className="payment-method-selector">
                <button
                  type="button"
                  className={`pm-tab ${paymentMethod === "pix" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("pix")}
                >
                  <div className="pm-tab-top">
                    <Icon name="qr-code" size={22} />
                    <strong>Pix</strong>
                  </div>
                  <span className="pm-tag discount-tag">−5% OFF</span>
                  <small>Aprovação Imediata</small>
                </button>

                <button
                  type="button"
                  className={`pm-tab ${paymentMethod === "credit_card" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("credit_card")}
                >
                  <div className="pm-tab-top">
                    <Icon name="credit-card" size={22} />
                    <strong>Cartão de Crédito</strong>
                  </div>
                  <span className="pm-tag">Até 6x</span>
                  <small>Sem juros</small>
                </button>

                <button
                  type="button"
                  className={`pm-tab ${paymentMethod === "debit_card" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("debit_card")}
                >
                  <div className="pm-tab-top">
                    <Icon name="credit-card" size={22} />
                    <strong>Débito Online</strong>
                  </div>
                  <span className="pm-tag">À vista</span>
                  <small>Cartão Virtual</small>
                </button>

                <button
                  type="button"
                  className={`pm-tab ${paymentMethod === "boleto" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("boleto")}
                >
                  <div className="pm-tab-top">
                    <Icon name="document" size={22} />
                    <strong>Boleto</strong>
                  </div>
                  <span className="pm-tag">Bancário</span>
                  <small>1-2 dias úteis</small>
                </button>

                <button
                  type="button"
                  className={`pm-tab ${paymentMethod === "cash_on_delivery" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("cash_on_delivery")}
                >
                  <div className="pm-tab-top">
                    <Icon name="banknote" size={22} />
                    <strong>Na Entrega</strong>
                  </div>
                  <span className="pm-tag">Dinheiro/Cartão</span>
                  <small>Pague ao receber</small>
                </button>
              </div>

              {/* Payment Details Body */}
              <div className="payment-body-container">
                {/* 1. PIX */}
                {paymentMethod === "pix" && (
                  <div className="pm-details-box pix-box">
                    <div className="pix-banner-callout">
                      <Icon name="spark" size={24} />
                      <div>
                        <strong>Desconto de 5% aplicado no Pix!</strong>
                        <p>
                          Você economiza{" "}
                          <strong>{formatCurrency(pixDiscountCents)}</strong> pagando com Pix.
                          O QR Code dinâmico será gerado logo ao clicar no botão abaixo.
                        </p>
                      </div>
                    </div>
                    <div className="pix-how-it-works">
                      <h4>Como funciona:</h4>
                      <ol>
                        <li>Clique em <strong>Finalizar Pedido com Pix</strong> abaixo.</li>
                        <li>Escaneie o QR Code ou use a chave Copia e Cola no app do seu banco.</li>
                        <li>O pagamento é reconhecido na hora e seu pedido é separado imediatamente!</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* 2. CARTÃO DE CRÉDITO */}
                {paymentMethod === "credit_card" && (
                  <div className="pm-details-box card-box">
                    <div className="card-brand-indicator">
                      <span>Bandeira detectada: <strong>{detectCardBrand(creditCard.cardNumber)}</strong></span>
                    </div>

                    <div className="checkout-form-grid">
                      <label className="field-full">
                        <span>Número do Cartão *</span>
                        <input
                          type="text"
                          required
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={creditCard.cardNumber}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              cardNumber: maskCardNumber(e.target.value),
                            })
                          }
                        />
                      </label>

                      <label className="field-full">
                        <span>Nome Impresso no Cartão *</span>
                        <input
                          type="text"
                          required
                          placeholder="Como está gravado no cartão"
                          value={creditCard.cardName}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              cardName: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </label>

                      <label>
                        <span>Validade (MM/AA) *</span>
                        <input
                          type="text"
                          required
                          placeholder="MM/AA"
                          maxLength={5}
                          value={creditCard.cardExpiry}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              cardExpiry: maskExpiry(e.target.value),
                            })
                          }
                        />
                      </label>

                      <label>
                        <span>Código de Segurança (CVV) *</span>
                        <input
                          type="password"
                          required
                          placeholder="123"
                          maxLength={4}
                          value={creditCard.cardCvv}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              cardCvv: cleanDigits(e.target.value).slice(0, 4),
                            })
                          }
                        />
                      </label>

                      <label className="field-full">
                        <span>Parcelamento *</span>
                        <select
                          value={creditCard.installments}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              installments: Number(e.target.value),
                            })
                          }
                        >
                          <option value={1}>
                            1x de {formatCurrency(finalTotalCents)} sem juros
                          </option>
                          <option value={2}>
                            2x de {formatCurrency(Math.round(finalTotalCents / 2))} sem juros
                          </option>
                          <option value={3}>
                            3x de {formatCurrency(Math.round(finalTotalCents / 3))} sem juros
                          </option>
                          <option value={4}>
                            4x de {formatCurrency(Math.round(finalTotalCents / 4))} sem juros
                          </option>
                          <option value={5}>
                            5x de {formatCurrency(Math.round(finalTotalCents / 5))} sem juros
                          </option>
                          <option value={6}>
                            6x de {formatCurrency(Math.round(finalTotalCents / 6))} sem juros
                          </option>
                        </select>
                      </label>
                    </div>

                    <label className="save-card-checkbox">
                      <input
                        type="checkbox"
                        checked={creditCard.saveCard}
                        onChange={(e) =>
                          setCreditCard({ ...creditCard, saveCard: e.target.checked })
                        }
                      />
                      <span>Salvar este cartão com segurança para compras futuras</span>
                    </label>
                  </div>
                )}

                {/* 3. DÉBITO ONLINE */}
                {paymentMethod === "debit_card" && (
                  <div className="pm-details-box card-box">
                    <p style={{ marginBottom: "16px", color: "var(--muted)", fontSize: "0.9rem" }}>
                      Aceitamos cartões de débito Elo, Mastercard, Visa e Cartão de Débito Virtual Caixa.
                    </p>
                    <div className="checkout-form-grid">
                      <label className="field-full">
                        <span>Número do Cartão de Débito *</span>
                        <input
                          type="text"
                          required
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={creditCard.cardNumber}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              cardNumber: maskCardNumber(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>Validade (MM/AA) *</span>
                        <input
                          type="text"
                          required
                          placeholder="MM/AA"
                          maxLength={5}
                          value={creditCard.cardExpiry}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              cardExpiry: maskExpiry(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>CVV *</span>
                        <input
                          type="password"
                          required
                          placeholder="123"
                          maxLength={4}
                          value={creditCard.cardCvv}
                          onChange={(e) =>
                            setCreditCard({
                              ...creditCard,
                              cardCvv: cleanDigits(e.target.value).slice(0, 4),
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. BOLETO */}
                {paymentMethod === "boleto" && (
                  <div className="pm-details-box boleto-box">
                    <div className="boleto-info-block">
                      <Icon name="document" size={28} />
                      <div>
                        <strong>Boleto Bancário</strong>
                        <p>
                          O boleto é gerado após a finalização da compra. Você pode imprimir ou pagar pelo celular
                          com a linha digitável.
                        </p>
                        <small>Atenção: A compensação do boleto pode levar de 24h a 48h úteis.</small>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. NA ENTREGA */}
                {paymentMethod === "cash_on_delivery" && (
                  <div className="pm-details-box delivery-pay-box">
                    <h4>Como você prefere pagar ao entregador?</h4>
                    <div className="delivery-method-radios">
                      <label className="radio-pill">
                        <input
                          type="radio"
                          name="onDeliveryType"
                          checked={onDeliveryType === "money"}
                          onChange={() => setOnDeliveryType("money")}
                        />
                        <span>Dinheiro em Espécie</span>
                      </label>
                      <label className="radio-pill">
                        <input
                          type="radio"
                          name="onDeliveryType"
                          checked={onDeliveryType === "pos_machine"}
                          onChange={() => setOnDeliveryType("pos_machine")}
                        />
                        <span>Maquininha (Crédito, Débito ou Refeição)</span>
                      </label>
                    </div>

                    {onDeliveryType === "money" && (
                      <div className="cash-change-block">
                        <label>
                          <span>Precisa de troco para quanto?</span>
                          <input
                            type="text"
                            placeholder="Ex: 50,00 ou 100,00"
                            value={cashChangeFor}
                            onChange={(e) => setCashChangeFor(e.target.value)}
                          />
                          <small>Deixe em branco se tiver o valor exato.</small>
                        </label>
                      </div>
                    )}

                    {onDeliveryType === "pos_machine" && (
                      <p className="pos-machine-note">
                        O motoboy levará a maquininha sem fio com suporte a aproximação (NFC), chip, Pix na tela da maquininha e vouchers.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="checkout-action-row">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setStep("details")}
                >
                  ← Voltar aos Dados
                </button>
                <button
                  type="button"
                  className="button button-primary finalize-button"
                  disabled={submitting}
                  onClick={handleFinalizeOrder}
                >
                  {submitting
                    ? "Finalizando Pedido…"
                    : `Finalizar Compra (${formatCurrency(finalTotalCents)}) →`}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Order Summary */}
        <aside className="checkout-summary-sidebar">
          <div className="sidebar-summary-box">
            <h3>Resumo da Sua Compra</h3>
            <div className="sidebar-items-list">
              {lines.map((item) => (
                <div key={item.id} className="sidebar-item-row">
                  <div className="item-info">
                    <span className="item-qty">{item.quantity}x</span>
                    <span className="item-title">{item.name}</span>
                  </div>
                  <span className="item-price">
                    {formatCurrency(item.priceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cupom */}
            <div className="coupon-row" style={{ marginTop: "16px" }}>
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase().slice(0, 24))}
                placeholder="Cupom de desconto"
              />
              <button
                type="button"
                onClick={() => setCouponApplied(coupon === "BEMVINDO10" || coupon === "POUPEMAIS")}
              >
                Aplicar
              </button>
            </div>
            {coupon && !couponApplied && (
              <small className="coupon-help">Dica: use BEMVINDO10 ou POUPEMAIS</small>
            )}

            {/* Totais */}
            <dl className="order-totals" style={{ marginTop: "16px" }}>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(subtotalCents)}</dd>
              </div>
              {couponApplied && (
                <div>
                  <dt>Cupom</dt>
                  <dd className="discount">− {formatCurrency(couponDiscountCents)}</dd>
                </div>
              )}
              {paymentMethod === "pix" && pixDiscountCents > 0 && (
                <div>
                  <dt>Desconto Pix (5%)</dt>
                  <dd className="discount">− {formatCurrency(pixDiscountCents)}</dd>
                </div>
              )}
              <div>
                <dt>{fulfillment === "delivery" ? "Tele-Entrega" : "Retirada"}</dt>
                <dd>{shippingCents ? formatCurrency(shippingCents) : "Grátis"}</dd>
              </div>
              <div className="total">
                <dt>Total a Pagar</dt>
                <dd>{formatCurrency(finalTotalCents)}</dd>
              </div>
            </dl>

            <div className="security-guarantee-badge">
              <Icon name="shield" size={20} />
              <div>
                <strong>Compra 100% Protegida</strong>
                <p>Procedência farmacêutica com nota fiscal e garantia.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
