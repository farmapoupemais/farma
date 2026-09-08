"use client";

import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "5551981834039";
const DEFAULT_MESSAGE = "Olá! Gostaria de fazer um pedido para tele-entrega na Farmácia Poupe Mais.";

export function WhatsAppFloatingButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno atraso para entrada suave sem impactar LCP inicial
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-floating-btn"
      aria-label="Fazer pedido de tele-entrega pelo WhatsApp"
      title="Tele-entrega rápida pelo WhatsApp (51) 98183-4039"
    >
      <div className="whatsapp-icon-wrap">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.115-.533-1.422-.596-2.339-2.039-2.41-2.133-.071-.095-.572-.76-.572-1.448 0-.688.358-1.026.486-1.168.127-.142.277-.178.369-.178.092 0 .185.002.266.006.085.005.199-.033.311.237.116.282.396.967.432 1.038.035.07.059.153.012.247-.047.094-.07.153-.141.235-.07.082-.148.184-.211.247-.071.07-.145.147-.062.289.083.141.369.608.791.984.544.484 1.002.634 1.144.705.142.07.226.059.31-.037.085-.094.364-.424.461-.57.097-.146.194-.122.327-.073.133.048.847.399.992.472.146.073.243.109.279.171.036.062.036.36-.108.765z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2 22l4.957-1.397A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.15 8.15 0 0 1-4.226-1.177l-.303-.18-2.937.828.824-2.884-.197-.314A8.158 8.158 0 0 1 3.8 12c0-4.522 3.678-8.2 8.2-8.2 4.522 0 8.2 3.678 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z" />
        </svg>
      </div>
      <div className="whatsapp-floating-label">
        <small>Tele-Entrega 90 min</small>
        <strong>Pedir no WhatsApp</strong>
      </div>
    </a>
  );
}
