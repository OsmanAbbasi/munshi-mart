import { getProductsByIds } from "../../../../lib/catalog";
import { isPublicId } from "../../../../lib/catalog-model";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (
      !Array.isArray(body.ids) ||
      body.ids.length > 100 ||
      body.ids.some((id: unknown) => typeof id !== "string" || !isPublicId(id))
    ) {
      return Response.json(
        { error: "Send up to 100 valid product IDs." },
        { status: 400 },
      );
    }
    const result = await getProductsByIds([...new Set<string>(body.ids)]);
    return Response.json(result, {
      status: result.error ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Could not refresh saved products. Please retry." },
      { status: 400 },
    );
  }
}
