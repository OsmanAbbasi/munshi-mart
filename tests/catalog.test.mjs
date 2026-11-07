import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Exercise the actual shared catalog model without introducing a test runner.
const source = await readFile(
  new URL("../lib/catalog-model.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const model = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const products = [
  {
    id: "a",
    product_name: "Canvas tote",
    retail_price: 1800,
    category: "Fashion",
    description: "",
    created_at: "2026-10-20",
    sellers: { store_name: "Everyday Goods" },
  },
  {
    id: "b",
    product_name: "Canvas bag",
    retail_price: 950,
    category: "Fashion",
    description: "",
    created_at: "2026-10-18",
    sellers: { store_name: "Other store" },
  },
  {
    id: "c",
    product_name: "Canvas notebook",
    retail_price: 500,
    category: "Books",
    description: "",
    created_at: "2026-10-21",
    sellers: null,
  },
  {
    id: "d",
    product_name: "Canvas scarf",
    retail_price: null,
    category: "Fashion",
    description: "",
    created_at: "2026-10-15",
    sellers: null,
  },
];
test("combined search, category and numeric price sorting", () => {
  assert.deepEqual(
    model
      .filterProducts(products, {
        search: "canvas",
        category: "Fashion",
        sort: "price-asc",
      })
      .map((p) => p.id),
    ["b", "a", "d"],
  );
  assert.deepEqual(
    model
      .filterProducts(products, {
        search: "canvas",
        category: "Fashion",
        sort: "price-desc",
      })
      .map((p) => p.id),
    ["a", "b", "d"],
  );
  assert.deepEqual(
    model
      .filterProducts(products, {
        search: "CANVAS",
        category: "fashion",
        sort: "newest",
      })
      .map((p) => p.id),
    ["a", "b", "d"],
  );
});
test("seller name search and explicit empty results", () => {
  assert.deepEqual(
    model.filterProducts(products, { search: "everyday" }).map((p) => p.id),
    ["a"],
  );
  assert.equal(model.filterProducts(products, { search: "missing" }).length, 0);
});
test("categories normalize legacy blanks and preserve newly added values", () => {
  assert.equal(model.normalizeCategory(null), "Other");
  assert.equal(model.normalizeCategory("  "), "Other");
  assert.equal(model.normalizeCategory(" electronics "), "Electronics");
  assert.equal(model.normalizeCategory("Garden"), "Garden");
  assert.ok(
    model
      .categoryOptions([...products, { category: "Garden" }])
      .includes("Garden"),
  );
});
test("inactive and ambiguous legacy status fail closed", () => {
  for (const status of ["inactive", null, undefined, "", "published", "Active"])
    assert.equal(model.isPublicProduct(status), false);
  assert.equal(model.isPublicProduct("active"), true);
});
test("public store identifiers never accept phone numbers or WhatsApp JIDs", () => {
  assert.equal(model.isPublicId("10000000-0000-4000-8000-000000000001"), true);
  for (const id of [
    "923460392313",
    "923460392313@s.whatsapp.net",
    "../test",
    "test@lid",
    "",
  ])
    assert.equal(model.isPublicId(id), false);
  assert.equal(
    model.sellerHref("10000000-0000-4000-8000-000000000001"),
    "/seller/10000000-0000-4000-8000-000000000001",
  );
});
