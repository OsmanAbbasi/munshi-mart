import { getProductsByIds, getSeller } from "../../../../lib/catalog";
import {
  isPublicId,
  normalizeWhatsAppNumber,
} from "../../../../lib/catalog-model";
import { checkoutLink, MAX_QUANTITY } from "../../../../lib/shopping";
export const dynamic = "force-dynamic";
const respond = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (
      typeof body.sellerId !== "string" ||
      !isPublicId(body.sellerId) ||
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 100 ||
      body.items.some(
        (item: { id?: unknown; quantity?: number }) =>
          !item ||
          typeof item.id !== "string" ||
          !isPublicId(item.id) ||
          !Number.isInteger(item.quantity) ||
          (item.quantity ?? 0) < 1 ||
          (item.quantity ?? 0) > MAX_QUANTITY,
      )
    )
      return respond({ error: "Invalid seller or cart items." }, 400);
    if (
      new Set(body.items.map((item: { id: string }) => item.id)).size !==
      body.items.length
    )
      return respond({ error: "Duplicate product IDs are not allowed." }, 400);
    const [catalog, seller] = await Promise.all([
      getProductsByIds(body.items.map((item: { id: string }) => item.id)),
      getSeller(body.sellerId),
    ]);
    if (catalog.error || seller.error)
      return respond(
        { error: "Could not verify the current catalog. Please retry." },
        503,
      );
    if (
      !seller.data ||
      !normalizeWhatsAppNumber(seller.data.public_whatsapp_number)
    )
      return respond(
        {
          error:
            "This seller has no approved public WhatsApp contact available.",
        },
        422,
      );
    const excluded: string[] = [];
    const eligible = [];
    for (const item of body.items as { id: string; quantity: number }[]) {
      const p = catalog.data.find((p) => p.id === item.id);
      if (
        !p ||
        p.seller_id !== seller.data.id ||
        p.sellers?.id !== seller.data.id ||
        p.quantity === 0 ||
        p.retail_price === null
      ) {
        excluded.push(item.id);
        continue;
      }
      if (p.quantity !== null && item.quantity > p.quantity)
        return respond(
          {
            error:
              "Stock changed. Refresh your cart and review the adjusted quantities before ordering.",
          },
          409,
        );
      eligible.push({ product: p, quantity: item.quantity });
    }
    const url = checkoutLink(
      seller.data,
      eligible,
      new URL(request.url).origin,
    );
    if (!url)
      return respond(
        { error: "No currently available products in this seller group." },
        422,
      );
    return respond({
      url,
      excluded,
      productIds: eligible.map((item) => item.product.id),
    });
  } catch {
    return respond(
      { error: "Unable to prepare WhatsApp checkout. Please retry." },
      400,
    );
  }
}
