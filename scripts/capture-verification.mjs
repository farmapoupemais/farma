import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = "C:\\Users\\User\\.gemini\\antigravity\\brain\\139a5373-18c1-48b2-985f-426589c8c215\\scratch";
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function getWsUrl() {
  const res = await fetch("http://localhost:9222/json/new?http://localhost:3000", { method: "PUT" });
  const data = await res.json();
  return { wsUrl: data.webSocketDebuggerUrl, targetId: data.id };
}

function connectCdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();

    ws.onopen = () => {
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const reqId = id++;
            pending.set(reqId, { res, rej });
            ws.send(JSON.stringify({ id: reqId, method, params }));
          });
        },
        close() {
          ws.close();
        },
      });
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    ws.onerror = reject;
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function capture() {
  const { wsUrl, targetId } = await getWsUrl();
  console.log("Connected to target:", targetId);
  const cdp = await connectCdp(wsUrl);

  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");

  // 1. Desktop Home
  console.log("Capturing Desktop Home...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 860,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(2500);
  let snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-storefront-official.png"), Buffer.from(snap.data, "base64"));

  // 2. Mobile Home
  console.log("Capturing Mobile Home...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(1500);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-mobile-official.png"), Buffer.from(snap.data, "base64"));

  // Reset to Desktop
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 860,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Seed cart with realistic products
  await cdp.send("Runtime.evaluate", {
    expression: `
      localStorage.setItem("poupe-mais-cart", JSON.stringify([
        { id: "prod_protetor_fps50", name: "Protetor Solar Facial FPS 50 Antioleosidade 50g", priceCents: 5990, quantity: 1, slug: "protetor-solar-facial-fps-50-antioleosidade-50g", icon: "sun", tone: "tone-sand" },
        { id: "prod_omega_3", name: "Ômega 3 1.000 mg Concentrado 120 Cápsulas", priceCents: 4490, quantity: 2, slug: "omega-3-1000-mg-concentrado-120-capsulas", icon: "capsule", tone: "tone-coral" }
      ]));
      window.dispatchEvent(new Event("poupe-mais-cart-updated"));
    `,
  });

  // 3. Cart View
  console.log("Capturing Cart View...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/carrinho" });
  await sleep(2000);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-cart-checkout-button.png"), Buffer.from(snap.data, "base64"));

  // 4. Checkout Step 1 (Identificação & Entrega)
  console.log("Capturing Checkout Step 1...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/checkout" });
  await sleep(2000);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-checkout-step1.png"), Buffer.from(snap.data, "base64"));

  // Fill in Step 1 form and advance to Step 2
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        function setVal(el, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const inputs = document.querySelectorAll('.checkout-form-grid input');
        if (inputs.length >= 4) {
          setVal(inputs[0], "Ana Carolina Silva");
          setVal(inputs[1], "anacarolina@email.com");
          setVal(inputs[2], "51981834039");
          setVal(inputs[3], "12345678901");
        }

        const addrInputs = document.querySelectorAll('.address-form-block input');
        if (addrInputs.length >= 5) {
          setVal(addrInputs[0], "90010000");
          setVal(addrInputs[1], "Av. Borges de Medeiros");
          setVal(addrInputs[2], "500");
          setVal(addrInputs[3], "Apto 402");
          setVal(addrInputs[4], "Centro Histórico");
          setVal(addrInputs[5], "Porto Alegre");
        }
      })()
    `,
  });
  await sleep(1000);

  // Click "Avançar para Pagamento"
  await cdp.send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const advBtn = btns.find(b => b.textContent.includes('Avançar para Pagamento'));
      if (advBtn) advBtn.click();
    `,
  });
  await sleep(2000);

  // 5. Checkout Step 2 (Pagamento Pix com 5% OFF)
  console.log("Capturing Checkout Step 2 (Pix)...");
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-checkout-step2-pix.png"), Buffer.from(snap.data, "base64"));

  // Select Credit Card in Step 2
  await cdp.send("Runtime.evaluate", {
    expression: `
      const tabs = Array.from(document.querySelectorAll('.pm-tab'));
      const cardTab = tabs.find(t => t.textContent.includes('Cartão de Crédito'));
      if (cardTab) cardTab.click();
    `,
  });
  await sleep(1000);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-checkout-step2-card.png"), Buffer.from(snap.data, "base64"));

  // Switch back to Pix and finalize order to reach Step 3
  await cdp.send("Runtime.evaluate", {
    expression: `
      const tabs = Array.from(document.querySelectorAll('.pm-tab'));
      const pixTab = tabs.find(t => t.textContent.includes('Pix'));
      if (pixTab) pixTab.click();
    `,
  });
  await sleep(500);

  await cdp.send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const finBtn = btns.find(b => b.textContent.includes('Finalizar Compra'));
      if (finBtn) finBtn.click();
    `,
  });
  await sleep(2000);

  // 6. Checkout Step 3 (Pedido Finalizado com Sucesso e QR Code Pix)
  console.log("Capturing Checkout Step 3 (Confirmação)...");
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-checkout-step3-success.png"), Buffer.from(snap.data, "base64"));

  // 7. Admin Panel: Financeiro & Caixa
  console.log("Capturing Admin Panel - Financeiro...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/painel/demo" });
  await sleep(2000);

  // Click tab "Financeiro & Caixa"
  await cdp.send("Runtime.evaluate", {
    expression: `
      const navBtns = Array.from(document.querySelectorAll('.dashboard-sidebar nav button'));
      const finNav = navBtns.find(b => b.textContent.includes('Financeiro'));
      if (finNav) finNav.click();
    `,
  });
  await sleep(1500);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-admin-financial.png"), Buffer.from(snap.data, "base64"));

  // 8. Admin Panel: Auditoria Interna
  console.log("Capturing Admin Panel - Auditoria Interna...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const navBtns = Array.from(document.querySelectorAll('.dashboard-sidebar nav button'));
        const auditNav = navBtns.find(b => b.innerText.includes('Auditoria') || b.textContent.includes('Auditoria'));
        if (auditNav) {
          auditNav.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      })()
    `,
  });
  await sleep(2000);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-admin-internal-audit.png"), Buffer.from(snap.data, "base64"));

  cdp.close();
  await fetch(`http://localhost:9222/json/close/${targetId}`);
  console.log("All captures completed successfully!");
}

capture().catch(console.error);
