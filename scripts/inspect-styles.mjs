const res = await fetch("http://localhost:9222/json");
const targets = await res.json();
const target = targets.find(t => t.url.includes("localhost:3000")) || targets[0];

const ws = new WebSocket(target.webSocketDebuggerUrl);
ws.onopen = () => {
  ws.send(JSON.stringify({
    id: 1,
    method: "Runtime.evaluate",
    params: {
      expression: `
        (() => {
          const header = document.querySelector(".site-header");
          const sheets = Array.from(document.styleSheets);
          const matched = [];
          for (const sheet of sheets) {
            try {
              for (const rule of sheet.cssRules) {
                if (rule.selectorText && header.matches(rule.selectorText) && rule.style.backgroundColor) {
                  matched.push({
                    selector: rule.selectorText,
                    cssText: rule.cssText,
                    href: sheet.href,
                    ownerNode: sheet.ownerNode ? sheet.ownerNode.outerHTML.slice(0, 100) : null
                  });
                }
              }
            } catch (e) {}
          }
          return matched;
        })()
      `,
      returnByValue: true
    }
  }));
};
ws.onmessage = (e) => {
  console.log(JSON.stringify(JSON.parse(e.data).result?.result?.value, null, 2));
  ws.close();
};
