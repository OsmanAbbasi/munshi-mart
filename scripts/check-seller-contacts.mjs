// Read-only check using the storefront anonymous credentials. Never print contacts.
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../lib/catalog-model.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { normalizeWhatsAppNumber } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { data, error } = await db.from("sellers").select("id,contact_number").limit(1000).abortSignal(AbortSignal.timeout(20000));
if (error) {
  console.log(JSON.stringify({ readable: false, code: error.code }));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ readable: true, sampledSellers: data.length, validInternationalContacts: data.filter(row => normalizeWhatsAppNumber(row.contact_number)).length, missingContacts: data.filter(row => !row.contact_number).length, invalidContacts: data.filter(row => row.contact_number && !normalizeWhatsAppNumber(row.contact_number)).length }));
  const products = await db.from("products").select("id,seller_id,sellers(id,contact_number)").eq("status", "active").limit(1000).abortSignal(AbortSignal.timeout(20000));
  if (products.error) {
    console.log(JSON.stringify({ productSellerJoinReadable: false, code: products.error.code }));
    process.exitCode = 1;
  } else {
    const linked = products.data.filter(row => {
      const seller = Array.isArray(row.sellers) ? row.sellers[0] : row.sellers;
      return seller?.id === row.seller_id && normalizeWhatsAppNumber(seller.contact_number);
    });
    console.log(JSON.stringify({ productSellerJoinReadable: true, sampledActiveProducts: products.data.length, productsWithValidSellerContact: linked.length }));
  }
}
