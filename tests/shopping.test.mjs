import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const url = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
const modelUrl = url(
  await readFile(new URL("../lib/catalog-model.ts", import.meta.url), "utf8"),
);
const model = await import(modelUrl);
const catalogSource = (await readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"))
  .replace('import "server-only";', "")
  .replace('import { createClient } from "@supabase/supabase-js";', 'const createClient = () => { throw new Error("Unexpected network request"); };')
  .replace('import { cache } from "react";', 'const cache = (fn) => fn;')
  .replace('"./catalog-model"', JSON.stringify(modelUrl));
const catalogAdapter = await import(url(`${catalogSource}\nexport { sellerFromRow };`));

test("live seller contact adapter publishes only normalized approved contact_number", () => {
  const previous = process.env.MUNSHI_CATALOG_FIXTURES;
  delete process.env.MUNSHI_CATALOG_FIXTURES;
  try {
    const row = { id: "10000000-0000-4000-8000-000000000001", store_name: "Shop", contact_number: "+92 (300) 123-4567", whatsapp_number: "private@lid" };
    const seller = catalogAdapter.sellerFromRow(row);
    assert.equal(seller.public_whatsapp_number, "923001234567");
    assert.equal("contact_number" in seller, false);
    assert.equal("whatsapp_number" in seller, false);
    for (const contact_number of [null, "", "03001234567", "12345@lid", "invalid"]) {
      assert.equal(catalogAdapter.sellerFromRow({ ...row, contact_number }).public_whatsapp_number, undefined);
    }
  } finally {
    if (previous === undefined) delete process.env.MUNSHI_CATALOG_FIXTURES;
    else process.env.MUNSHI_CATALOG_FIXTURES = previous;
  }
});
const shoppingUrl = url(
  (
    await readFile(new URL("../lib/shopping.ts", import.meta.url), "utf8")
  ).replace(/["']\.\/catalog-model["']/, JSON.stringify(modelUrl)),
);
const shopping = await import(shoppingUrl);
const sellerId = "10000000-0000-4000-8000-000000000001";
const sellerB = "10000000-0000-4000-8000-000000000002";
const id = "20000000-0000-4000-8000-000000000001";
const idB = "20000000-0000-4000-8000-000000000002";
const seller = {
  id: sellerId,
  store_name: "Shop & Sons",
  public_whatsapp_number: "+1 (202) 555-0101",
};
const product = {
  id,
  seller_id: sellerId,
  sellers: seller,
  product_name: "Tote & scarf / سبز",
  retail_price: 1200,
  quantity: 2,
  image_urls: [],
  category: "Fashion",
  description: "",
  created_at: "",
};

test("legacy saved cart survives parsing without retaining private seller fields", () => {
  const raw = [
    {
      id,
      product_name: "Old name",
      retail_price: 900,
      quantity: 50,
      cartQty: 4,
      sellers: { store_name: "Old store", whatsapp_number: "private@lid" },
    },
  ];
  const saved = shopping.parseSavedItems(JSON.stringify(raw));
  assert.equal(saved[0].cartQty, 4);
  assert.equal(saved[0].id, id);
  assert.equal(JSON.stringify(saved).includes("private"), false);
  assert.equal(
    shopping.parseSavedItems(JSON.stringify([...raw, ...raw])).length,
    1,
  );
});
test("malformed storage is distinguishable from an empty list", () => {
  assert.throws(() => shopping.parseSavedItems("{bad"));
  assert.throws(() => shopping.parseSavedItems("{}"));
  assert.deepEqual(shopping.parseSavedItems(null), []);
});
test('canonical snapshot storage roundtrips do not cause cross-tab write churn', () => {
  const saved = [shopping.savedProduct(product, 2)];
  const serialized = JSON.stringify(saved);
  assert.equal(JSON.stringify(shopping.parseSavedItems(serialized)), serialized);
  assert.equal(JSON.stringify(shopping.reconcileSaved(shopping.parseSavedItems(serialized), [product])), serialized);
});
test("saved items refresh current identity, stock and price without deleting stale IDs", () => {
  const old = {
    ...shopping.savedProduct(product, 8),
    seller_id: sellerB,
    retail_price: 10,
  };
  const missing = { ...old, id: idB };
  const refreshed = shopping.reconcileSaved([old, missing], [product]);
  assert.equal(refreshed[0].cartQty, 2);
  assert.equal(refreshed[0].retail_price, 1200);
  assert.equal(refreshed[0].seller_id, sellerId);
  assert.equal(refreshed[1].id, idB);
  const items = shopping.shoppingItems(
    refreshed,
    { [id]: product, [idB]: null },
    "ready",
  );
  assert.equal(items[0].availability, "available");
  assert.equal(items[1].availability, "unavailable");
  assert.equal(
    shopping.shoppingItems(refreshed, { [id]: product }, "error")[0]
      .availability,
    "error",
  );
});
test("stock limits distinguish zero and unknown stock and reject fractional quantities", () => {
  assert.equal(shopping.clampQuantity(4, 2), 2);
  assert.equal(shopping.clampQuantity(4, 0), 0);
  assert.equal(shopping.clampQuantity(4, null), 4);
  assert.equal(shopping.clampQuantity(2.8, 20), 2);
});
test("groups use current seller relation instead of untrusted saved seller", () => {
  const item = {
    ...shopping.savedProduct(product),
    seller_id: sellerB,
    product,
    availability: "available",
  };
  assert.equal(shopping.groupCart([item])[0].sellerId, sellerId);
});
test("public WhatsApp contact requires explicit approval and valid international syntax", () => {
  assert.equal(
    model.normalizeWhatsAppNumber(" +1 (202) 555-0101 "),
    "12025550101",
  );
  assert.equal(
    model.normalizeWhatsAppNumber("001 202 555 0102"),
    "12025550102",
  );
  for (const number of [
    "03001234567",
    "9234@lid",
    "+00123456789",
    "+12",
    "+1234567890123456",
    "+1 202 ext 4",
  ])
    assert.equal(model.normalizeWhatsAppNumber(number), null);
  assert.equal(
    model.approvedPublicContact({
      contact_number: "+12025550101",
      whatsapp_number: "private@lid",
    }),
    null,
  );
  assert.equal(
    model.approvedPublicContact({
      public_whatsapp_number: "+12025550101",
      public_whatsapp_inquiries_enabled: false,
    }),
    null,
  );
  assert.equal(
    model.approvedPublicContact({
      public_whatsapp_number: "+12025550101",
      public_whatsapp_inquiries_enabled: true,
    }),
    "12025550101",
  );
});
test("seller checkout encodes names, quantities and current-origin absolute URLs", () => {
  const link = new URL(
    shopping.checkoutLink(
      seller,
      [{ product, quantity: 2 }],
      "https://mart.example.test",
    ),
  );
  assert.equal(link.origin + link.pathname, "https://wa.me/12025550101");
  const message = link.searchParams.get("text");
  assert.ok(message.includes("Tote & scarf / سبز × 2"));
  assert.ok(message.includes(`https://mart.example.test/products/${id}`));
  assert.equal(
    shopping.checkoutLink(
      { ...seller, public_whatsapp_number: undefined },
      [{ product, quantity: 1 }],
      "https://mart.example.test",
    ),
    null,
  );
  assert.equal(
    shopping.checkoutLink(
      { ...seller, id: sellerB },
      [{ product, quantity: 1 }],
      "https://mart.example.test",
    ),
    null,
  );
});

let sequence = 0;
async function checkoutRoute(products, publicSeller = seller, error = null) {
  globalThis.__shoppingTestCatalog = {
    getProductsByIds: async () => ({ data: products, error }),
    getSeller: async () => ({ data: publicSeller, error }),
  };
  const source = (
    await readFile(
      new URL("../app/api/checkout/prepare/route.ts", import.meta.url),
      "utf8",
    )
  )
    .replace(
      /import\s*\{[^}]+\}\s*from\s*["']\.\.\/\.\.\/\.\.\/\.\.\/lib\/catalog["'];/,
      "const { getProductsByIds, getSeller } = globalThis.__shoppingTestCatalog;",
    )
    .replace(
      /["']\.\.\/\.\.\/\.\.\/\.\.\/lib\/catalog-model["']/,
      JSON.stringify(modelUrl),
    )
    .replace(
      /["']\.\.\/\.\.\/\.\.\/\.\.\/lib\/shopping["']/,
      JSON.stringify(shoppingUrl),
    );
  const routeModule = await import(`${url(source)}#${++sequence}`);
  delete globalThis.__shoppingTestCatalog;
  return async (items = [{ id, quantity: 1 }], sellerIdValue = sellerId) =>
    routeModule.POST(
      new Request("https://store.example.test/api/checkout/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: sellerIdValue, items }),
      }),
    );
}
test("checkout route excludes stale and different-seller products, with no cross-group contact", async () => {
  const other = {
    ...product,
    id: idB,
    seller_id: sellerB,
    sellers: { ...seller, id: sellerB },
  };
  const post = await checkoutRoute([product, other]);
  const response = await post([
    { id, quantity: 2 },
    { id: idB, quantity: 1 },
  ]);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.excluded, [idB]);
  assert.deepEqual(body.productIds, [id]);
  const message = new URL(body.url).searchParams.get("text");
  assert.ok(message.includes(`https://store.example.test/products/${id}`));
  assert.equal(message.includes(idB), false);
});
test("checkout route blocks stock changes and rejects duplicates", async () => {
  const post = await checkoutRoute([product]);
  assert.equal((await post([{ id, quantity: 3 }])).status, 409);
  assert.equal(
    (
      await post([
        { id, quantity: 1 },
        { id, quantity: 1 },
      ])
    ).status,
    400,
  );
});
test("missing approved seller contact and catalog errors are distinct retryable states", async () => {
  const missing = await checkoutRoute([product], {
    ...seller,
    public_whatsapp_number: undefined,
  });
  assert.equal((await missing()).status, 422);
  const failed = await checkoutRoute([], seller, "Unavailable");
  assert.equal((await failed()).status, 503);
});
