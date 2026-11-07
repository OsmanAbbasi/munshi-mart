import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(compile(source)).toString("base64")}`;
const modelUrl = moduleUrl(
  await readFile(new URL("../lib/catalog-model.ts", import.meta.url), "utf8"),
);
const source = (
  await readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8")
)
  .replace(/import ["']server-only["'];/, "")
  .replace(
    /import \{ createClient \} from ["']@supabase\/supabase-js["'];/,
    "const createClient = globalThis.__munshiCatalogTestClient;",
  )
  .replace(/import \{ cache \} from ["']react["'];/, "const cache = fn => fn;")
  .replaceAll("process.env.NEXT_PUBLIC_SUPABASE_URL", "'https://test.invalid'")
  .replaceAll("process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY", "'public-test-key'")
  .replaceAll("process.env.MUNSHI_CATALOG_FIXTURES", "undefined")
  .replace(/["']\.\/catalog-model["']/, JSON.stringify(modelUrl));
let sequence = 0;
async function catalogWith(rows, error = null) {
  globalThis.__munshiCatalogTestClient = () => ({
    from() {
      const query = {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order() {
          return this;
        },
        range() {
          return this;
        },
        abortSignal() {
          return this;
        },
        maybeSingle() {
          return Promise.resolve({ data: rows[0] ?? null, error });
        },
        then(resolve) {
          return Promise.resolve({ data: rows, error }).then(resolve);
        },
      };
      return query;
    },
  });
  const catalog = await import(`${moduleUrl(source)}#${++sequence}`);
  delete globalThis.__munshiCatalogTestClient;
  return catalog;
}
const sellerId = "10000000-0000-4000-8000-000000000001";
const productId = "20000000-0000-4000-8000-000000000001";
const row = {
  id: productId,
  seller_id: sellerId,
  product_name: "Test product",
  retail_price: "1,800",
  price_numeric: null,
  quantity: "23",
  category: null,
  description: "Public description",
  status: "active",
  created_at: "2026-10-01",
  image_urls: ["https://example.com/item.jpg", "javascript:alert(1)", null],
  wholesale_price: "private-price",
  sellers: {
    id: sellerId,
    store_name: "Public shop",
    whatsapp_number: "private@lid",
    contact_number: "private-phone",
  },
};
test("server DTO normalizes legacy fields and removes private fields and unsafe image URLs", async () => {
  const catalog = await catalogWith([row]);
  const result = await catalog.getProduct(productId);
  assert.equal(result.error, null);
  assert.equal(result.data.quantity, 23);
  assert.equal(result.data.retail_price, 1800);
  assert.equal(result.data.category, "Other");
  assert.deepEqual(result.data.image_urls, ["https://example.com/item.jpg"]);
  assert.deepEqual(result.data.sellers, {
    id: sellerId,
    store_name: "Public shop",
  });
  assert.equal(JSON.stringify(result.data).includes("private"), false);
});
test("inactive and legacy rows remain excluded even if returned by a backend", async () => {
  for (const status of ["inactive", null, "unknown"]) {
    const catalog = await catalogWith([{ ...row, status }]);
    const list = await catalog.getProducts();
    const detail = await catalog.getProduct(productId);
    assert.equal(list.error, null);
    assert.equal(detail.error, null);
    assert.deepEqual(list.data, []);
    assert.equal(detail.data, null);
  }
});
test("catalog failures show an error instead of fake empty results or raw backend details", async () => {
  const catalog = await catalogWith([], {
    message: "private backend diagnostic",
  });
  for (const result of [
    await catalog.getProducts(),
    await catalog.getProduct(productId),
    await catalog.getSeller(sellerId),
  ]) {
    assert.ok(result.error);
    assert.equal(result.error.includes("private"), false);
  }
});
