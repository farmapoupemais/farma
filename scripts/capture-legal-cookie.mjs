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

async function run() {
  const { wsUrl, targetId } = await getWsUrl();
  console.log("Connected to target:", targetId);
  const cdp = await connectCdp(wsUrl);

  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1400,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 1. Clear cookie consent in localStorage so the banner displays
  console.log("Navigating to home with clean cookie storage...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(2500);
  await cdp.send("Runtime.evaluate", {
    expression: `
      localStorage.removeItem("poupe-mais-cookie-consent");
      window.location.reload();
    `,
  });
  await sleep(2500);

  // Capture Home with Cookie Banner
  console.log("Capturing Home with Cookie Banner...");
  let snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-cookie-banner-desktop.png"), Buffer.from(snap.data, "base64"));

  // 2. Click "Personalizar" to open Modal
  console.log("Opening Cookie Modal...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('.cookie-btn'));
        const customBtn = btns.find(b => b.textContent && b.textContent.includes('Personalizar'));
        if (customBtn) customBtn.click();
      })()
    `,
  });
  await sleep(1500);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-cookie-modal.png"), Buffer.from(snap.data, "base64"));

  // 3. Click "Apenas Necessários" to close modal and save choice
  console.log("Selecting 'Apenas Necessários'...");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('.cookie-modal-actions .cookie-btn'));
        const necBtn = btns.find(b => b.textContent && b.textContent.includes('Apenas Necessários'));
        if (necBtn) necBtn.click();
      })()
    `,
  });
  await sleep(1500);

  // Capture with Floating Privacy Button visible at bottom
  console.log("Capturing Floating Privacy Trigger...");
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-cookie-floating-button.png"), Buffer.from(snap.data, "base64"));

  // 4. Navigate to /termos
  console.log("Navigating to /termos...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/termos" });
  await sleep(2500);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-legal-termos.png"), Buffer.from(snap.data, "base64"));

  // 5. Navigate to /privacidade
  console.log("Navigating to /privacidade...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/privacidade" });
  await sleep(2500);
  snap = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "live-legal-privacidade.png"), Buffer.from(snap.data, "base64"));

  cdp.close();
  await fetch(`http://localhost:9222/json/close/${targetId}`);
  console.log("All legal & cookie screenshots captured successfully!");
}

run().catch(console.error);
