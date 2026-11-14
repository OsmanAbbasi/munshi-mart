import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Exercise the actual shared catalog model without introducing a test runner.
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(compile(source)).toString("base64")}`;
// catalog-model imports the taxonomy, so that dependency is compiled first and
// its data URL substituted for the relative specifier.
const taxonomyUrl = moduleUrl(
  await readFile(new URL("../lib/taxonomy.ts", import.meta.url), "utf8"),
);
const source = (
  await readFile(new URL("../lib/catalog-model.ts", import.meta.url), "utf8")
).replace(/["']\.\/taxonomy["']/, JSON.stringify(taxonomyUrl));
const model = await import(moduleUrl(source));
const taxonomy = await import(taxonomyUrl);
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

test("taxonomy places legacy, ad-hoc and plural category labels", () => {
  // The old 9-item list the bot still writes.
  assert.equal(taxonomy.placeCategory("Electronics").family.slug, "consumer-electronics");
  assert.equal(taxonomy.placeCategory("Toys").family.slug, "toys");
  assert.equal(taxonomy.placeCategory("Home & Living").family.slug, "home-living");
  // Plurals must resolve, since stored labels are plural but keywords singular.
  assert.equal(taxonomy.placeCategory("Mobiles").family.slug, "mobiles");
  assert.equal(taxonomy.placeCategory("Groceries").family.slug, "groceries");
  // Ad-hoc AI labels seen in live data.
  assert.equal(taxonomy.placeCategory("Gaming Monitor").family.slug, "pc-hardware");
  assert.equal(taxonomy.placeCategory("Gaming Monitor").subcategory, "Monitors");
  assert.equal(taxonomy.placeCategory("50k-100k Pc Build").subcategory, "Prebuilt PCs");
  assert.equal(taxonomy.placeCategory("Mechanical Keyboard").family.slug, "computer-accessories");
  // Mobiles and computer accessories stay separate families, as required.
  assert.notEqual(
    taxonomy.placeCategory("Mobile Phones").family.slug,
    taxonomy.placeCategory("Keyboards").family.slug,
  );
  // Unknown and empty values fail safe into Other rather than throwing.
  assert.equal(taxonomy.placeCategory("Zzz Unknown").family.slug, "other");
  assert.equal(taxonomy.placeCategory("").family.slug, "other");
  assert.equal(taxonomy.placeCategory(null).subcategory, "Other");
  assert.equal(taxonomy.placeCategory(undefined).family.slug, "other");
});

test("product name refines only a vague stored category", () => {
  // "Electronics" is too broad, so the name decides: hobby-grade, not consumer.
  const esc = { category: "Electronics", product_name: "320A Brushed ESC" };
  assert.equal(taxonomy.placeProduct(esc).family.slug, "hobby-electronics");
  assert.equal(taxonomy.placeProduct(esc).subcategory, "ESC & Speed Controllers");
  assert.equal(
    taxonomy.placeProduct({ category: "Electronics", product_name: "2205 2300KV Brushless Motor" }).subcategory,
    "Brushless Motors",
  );
  // A specific stored category always wins over the name.
  assert.equal(
    taxonomy.placeProduct({ category: "Mechanical Keyboard", product_name: "RC Drone Motor" }).family.slug,
    "computer-accessories",
  );
  // Nothing recognisable in either field stays in Other.
  assert.equal(
    taxonomy.placeProduct({ category: "Other", product_name: "Mystery item" }).family.slug,
    "other",
  );
});

test("family and subcategory filters narrow products; legacy category filter still works", () => {
  const rows = [
    { id: "1", product_name: "320A Brushed ESC", category: "Electronics", description: "", created_at: "2026-10-20", retail_price: 3000, sellers: null },
    { id: "2", product_name: "Gaming Monitor 24in", category: "Gaming Monitor", description: "", created_at: "2026-10-21", retail_price: 40000, sellers: null },
    { id: "3", product_name: "Emax ES08 Servo", category: "Electronics", description: "", created_at: "2026-10-22", retail_price: 1200, sellers: null },
  ];
  assert.deepEqual(
    model.filterProducts(rows, { family: "hobby-electronics" }).map((p) => p.id).sort(),
    ["1", "3"],
  );
  assert.deepEqual(
    model.filterProducts(rows, { family: "hobby-electronics", sub: "Servos" }).map((p) => p.id),
    ["3"],
  );
  assert.equal(model.filterProducts(rows, { family: "pc-hardware" }).length, 1);
  // Derived names are searchable even though no row stores them.
  assert.equal(model.filterProducts(rows, { search: "hobby" }).length, 2);
  // The pre-existing category filter is unchanged.
  assert.equal(model.filterProducts(rows, { category: "Electronics" }).length, 2);
  // An unknown family yields nothing rather than everything.
  assert.equal(model.filterProducts(rows, { family: "no-such-family" }).length, 0);
});

test("store directory summarises only stores with active listings", () => {
  const storeA = { id: "10000000-0000-4000-8000-00000000000a", store_name: "RC Depot", public_whatsapp_number: "923001234567" };
  const storeB = { id: "10000000-0000-4000-8000-00000000000b", store_name: "Alpha Gaming" };
  const rows = [
    { id: "1", product_name: "Brushless Motor", category: "Electronics", description: "", created_at: "2026-10-20", retail_price: 3000, quantity: 4, image_urls: ["https://x/1.jpg"], sellers: storeA },
    { id: "2", product_name: "Servo", category: "Electronics", description: "", created_at: "2026-10-25", retail_price: 1200, quantity: 0, image_urls: [], sellers: storeA },
    { id: "3", product_name: "Gaming Monitor", category: "Gaming Monitor", description: "", created_at: "2026-10-21", retail_price: 40000, quantity: 2, image_urls: [], sellers: storeB },
    // A product with no seller relation must not invent a store.
    { id: "4", product_name: "Orphan", category: "Toys", description: "", created_at: "2026-10-22", retail_price: 100, quantity: 1, image_urls: [], sellers: null },
  ];
  const directory = model.buildStoreDirectory(rows);
  assert.equal(directory.length, 2);
  const rc = directory.find((s) => s.seller.id === storeA.id);
  assert.equal(rc.productCount, 2);
  assert.equal(rc.inStock, 1, "zero-stock listing is excluded from inStock");
  assert.equal(rc.lowestPrice, 1200);
  assert.equal(rc.latest, "2026-10-25");
  assert.equal(rc.hasContact, true);
  assert.equal(directory.find((s) => s.seller.id === storeB.id).hasContact, false);
  assert.ok(rc.families.includes("Hobby & RC Electronics"));

  // Sorting and filtering are independent of the product filters.
  assert.deepEqual(
    model.filterStores(directory, { sort: "name" }).map((s) => s.seller.store_name),
    ["Alpha Gaming", "RC Depot"],
  );
  assert.deepEqual(
    model.filterStores(directory, { sort: "listings" }).map((s) => s.seller.store_name),
    ["RC Depot", "Alpha Gaming"],
  );
  assert.deepEqual(
    model.filterStores(directory, { q: "rc dep" }).map((s) => s.seller.store_name),
    ["RC Depot"],
  );
  assert.deepEqual(
    model.filterStores(directory, { family: "pc-hardware" }).map((s) => s.seller.store_name),
    ["Alpha Gaming"],
  );
  assert.equal(model.filterStores(directory, { q: "nothing matches" }).length, 0);
});

test("store directory never exposes private seller fields", () => {
  const rows = [
    {
      id: "1", product_name: "Item", category: "Toys", description: "", created_at: "2026-10-20",
      retail_price: 100, quantity: 1, image_urls: [],
      sellers: { id: "10000000-0000-4000-8000-00000000000a", store_name: "Shop" },
    },
  ];
  const [summary] = model.buildStoreDirectory(rows);
  // Only the public DTO travels into the directory.
  assert.deepEqual(Object.keys(summary.seller).sort(), ["id", "store_name"]);
  assert.equal("whatsapp_number" in summary.seller, false);
  assert.equal("contact_number" in summary.seller, false);
});

test("related products prefer same subcategory and exclude the same store", () => {
  const storeA = { id: "10000000-0000-4000-8000-00000000000a", store_name: "A" };
  const storeB = { id: "10000000-0000-4000-8000-00000000000b", store_name: "B" };
  const row = (id, name, seller, created) => ({
    id, product_name: name, category: "Electronics", description: "",
    created_at: created, retail_price: 100, quantity: 1, image_urls: [],
    seller_id: seller.id, sellers: seller,
  });
  const subject = row("1", "Emax ES08 Servo Motor", storeA, "2026-10-20");
  const catalogue = [
    subject,
    row("2", "Another Servo Motor", storeB, "2026-10-21"),
    row("3", "Brushless Motor 2205", storeB, "2026-10-22"),
    row("4", "Same store Servo", storeA, "2026-10-23"),
    row("5", "Gaming Monitor 27in", storeB, "2026-10-24"),
  ];
  const related = model.relatedProducts(subject, catalogue, 4);
  const ids = related.map((p) => p.id);
  assert.equal(ids.includes("1"), false, "excludes the product itself");
  assert.equal(ids.includes("4"), false, "excludes the same store");
  assert.equal(ids.includes("5"), false, "excludes a different family");
  assert.equal(ids[0], "2", "same subcategory ranks first");
  assert.ok(ids.includes("3"), "same family still included");
  // Honours the limit.
  assert.equal(model.relatedProducts(subject, catalogue, 1).length, 1);
  // No candidates is an empty list, not an error.
  assert.deepEqual(model.relatedProducts(subject, [subject], 4), []);
});

test("pagination clamps the page parameter and reports a stable window", () => {
  const items = Array.from({ length: 50 }, (_, i) => i + 1);
  const first = model.paginate(items, {});
  assert.equal(first.items.length, model.PAGE_SIZE);
  assert.equal(first.page, 1);
  assert.equal(first.pageCount, Math.ceil(50 / model.PAGE_SIZE));
  assert.equal(first.total, 50);
  assert.equal(first.from, 1);
  assert.equal(first.to, model.PAGE_SIZE);
  assert.equal(first.items[0], 1);

  const second = model.paginate(items, { page: "2" });
  assert.equal(second.page, 2);
  assert.equal(second.items[0], model.PAGE_SIZE + 1);
  // No overlap between consecutive pages.
  assert.equal(first.items.filter((n) => second.items.includes(n)).length, 0);

  // Out-of-range, zero, negative and junk values all clamp instead of throwing.
  assert.equal(model.paginate(items, { page: "999" }).page, first.pageCount);
  assert.equal(model.paginate(items, { page: "0" }).page, 1);
  assert.equal(model.paginate(items, { page: "-3" }).page, 1);
  assert.equal(model.paginate(items, { page: "abc" }).page, 1);
  assert.equal(model.paginate(items, { page: "" }).page, 1);

  // The last page holds the remainder, and an empty list stays valid.
  const last = model.paginate(items, { page: String(first.pageCount) });
  assert.equal(last.to, 50);
  const empty = model.paginate([], {});
  assert.deepEqual([empty.total, empty.from, empty.to, empty.pageCount], [0, 0, 0, 1]);
});
