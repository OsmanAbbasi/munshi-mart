import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";

// Read-only anonymous queries. Never load the bot's .env or service-role key.
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);
const projection =
  "id,seller_id,product_name,retail_price,price_numeric,quantity,description,category,image_urls,created_at,status,sellers(id,store_name)";
const [products, sellers, statuses] = await Promise.all([
  client
    .from("products")
    .select(projection)
    .eq("status", "active")
    .limit(50)
    .abortSignal(AbortSignal.timeout(20000)),
  client
    .from("sellers")
    .select("id,store_name")
    .limit(10)
    .abortSignal(AbortSignal.timeout(20000)),
  client
    .from("products")
    .select("id,status")
    .limit(50)
    .abortSignal(AbortSignal.timeout(20000)),
]);
const error = (result) =>
  result.error
    ? { code: result.error.code, message: result.error.message }
    : null;
const report = {
  productsError: error(products),
  sellersError: error(sellers),
  statusesError: error(statuses),
  activeProducts: products.data || [],
  sellers: sellers.data || [],
  statuses: statuses.data || [],
};
await mkdir(".qa", { recursive: true });
await writeFile(".qa/live-catalog-probe.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    productsError: report.productsError,
    sellersError: report.sellersError,
    statusesError: report.statusesError,
    activeProducts: report.activeProducts.length,
    sellers: report.sellers.length,
    statuses: report.statuses.map((row) => row.status),
  }),
);
