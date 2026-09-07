import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const runtimeEnv = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};
const runtimeContext = { waitUntil() {}, passThroughOnException() {} };

test("renders the branded storefront", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), runtimeEnv, runtimeContext);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /Farmácia Poupe Mais/);
  assert.match(html, /Sua saúde, no seu ritmo/);
  assert.match(html, /Ofertas para você/);
  assert.doesNotMatch(html, /Starter Project/);
});

test("adds baseline browser security headers", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("https://localhost/", { headers: { accept: "text/html" } }), runtimeEnv, runtimeContext);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
});

test("renders the expanded storefront catalog", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/catalogo", { headers: { accept: "text/html" } }), runtimeEnv, runtimeContext);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /48.*produtos encontrados/s);
  assert.match(html, /Aparelho de Pressão Digital/);
  assert.match(html, /Sérum de Niacinamida/);
});
