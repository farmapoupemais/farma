import assert from "node:assert/strict";
import test from "node:test";
import { catalogProducts } from "../lib/catalog.ts";

test("catálogo demonstrativo contém 48 produtos fictícios consistentes", () => {
  assert.equal(catalogProducts.length, 48);
  assert.equal(new Set(catalogProducts.map((product) => product.id)).size, 48);
  assert.equal(new Set(catalogProducts.map((product) => product.slug)).size, 48);
  assert.ok(catalogProducts.every((product) => product.priceCents > 0 && product.stock >= 0));
  assert.ok(catalogProducts.every((product) => product.requiresPrescription === false));
});

test("catálogo cobre oito categorias e usa a nova marca própria", () => {
  assert.equal(new Set(catalogProducts.map((product) => product.category)).size, 8);
  assert.equal(catalogProducts.some((product) => product.brand === "Poupe+ Care"), true);
  assert.equal(catalogProducts.some((product) => /Essencial/i.test(product.brand)), false);
});
