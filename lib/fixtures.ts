// Local QA data only. Activated explicitly by MUNSHI_CATALOG_FIXTURES=1 on the server.
// These are illustrations, not actual products or seller claims.
export const fixtureSellers = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    store_name: "Everyday Goods · Demo",
    public_whatsapp_inquiries_enabled: true,
    public_whatsapp_number: "+1 (202) 555-0101",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    store_name: "The Local Edit · Demo",
    public_whatsapp_inquiries_enabled: true,
    public_whatsapp_number: "001 202 555 0102",
  },
  { id: "10000000-0000-4000-8000-000000000003", store_name: "New Shop · Demo" },
  {
    id: "10000000-0000-4000-8000-000000000004",
    store_name: "Contact Pending · Demo",
    public_whatsapp_inquiries_enabled: true,
    public_whatsapp_number: "not-a-number@lid",
  },
];
const seed = [
  ["Canvas Everyday Tote", 1800, "Fashion", 12, "tote", 0],
  ["Studio Wireless Headphones", 6500, "Electronics", 3, "headphones", 1],
  ["Handcrafted Ceramic Mug", 1200, "Home & Living", 8, "mug", 0],
  ["Botanical Notebook", 850, "Books", 0, "notebook", 1],
  ["Canvas Weekend Bag", 3400, "Fashion", 6, "tote", 1],
  ["Everyday Essentials Box", 2400, null, null, null, 0],
  ["Cotton Tea Towel", 900, "Home & Living", 5, null, 3],
] as const;
export const fixtureProducts = seed.map(
  ([product_name, retail_price, category, quantity, image, seller], i) => ({
    id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    seller_id: fixtureSellers[seller].id,
    product_name,
    retail_price: String(retail_price),
    price_numeric: retail_price,
    description: `A thoughtfully chosen ${product_name.toLowerCase()} for your everyday. This is a local demonstration listing, not an item for sale.`,
    category,
    quantity,
    status: "active",
    created_at: `2026-10-${String(20 - i).padStart(2, "0")}T10:00:00Z`,
    image_urls: image
      ? [
          `/fixtures/${image}.svg`,
          ...(i === 0 ? ["/fixtures/tote-detail.svg"] : []),
        ]
      : [],
    sellers: fixtureSellers[seller],
  }),
);
export const fixtureHiddenProducts = [
  {
    ...fixtureProducts[0],
    id: "20000000-0000-4000-8000-000000000099",
    product_name: "Hidden inactive fixture",
    status: "inactive",
  },
  {
    ...fixtureProducts[0],
    id: "20000000-0000-4000-8000-000000000098",
    product_name: "Legacy null-status fixture",
    status: null,
  },
];
