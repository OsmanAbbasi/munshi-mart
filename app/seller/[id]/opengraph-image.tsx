import { ImageResponse } from "next/og";
import { getProducts, getSeller } from "../../../lib/catalog";
import { placeProduct } from "../../../lib/taxonomy";
import { BRAND } from "../../../lib/brand";

export const alt = "Store on Munshi Mart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-store share card: store name, how much it stocks and in which
// departments. Public listing data only — never the seller's contact number.
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [seller, products] = await Promise.all([
    getSeller(id),
    getProducts(id),
  ]);
  const name = seller.data?.store_name || BRAND;
  const count = products.data.length;
  const departments = [
    ...new Set(products.data.map((p) => placeProduct(p).family.name)),
  ].slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a2d23 0%, #123e31 55%, #205540 100%)",
          color: "#fffef2",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "23px",
            letterSpacing: "4px",
            color: "#f2d34f",
            fontWeight: 700,
          }}
        >
          AN INDEPENDENT STORE ON {BRAND.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: name.length > 28 ? "72px" : "92px",
            fontWeight: 800,
            lineHeight: 1.06,
            marginTop: "26px",
          }}
        >
          {name.slice(0, 48)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "34px",
            color: "#d4e0d3",
            marginTop: "28px",
          }}
        >
          {count > 0
            ? `${count} active ${count === 1 ? "listing" : "listings"}`
            : "Store profile"}
        </div>
        {departments.length > 0 && (
          <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
            {departments.map((department) => (
              <div
                key={department}
                style={{
                  display: "flex",
                  padding: "11px 22px",
                  borderRadius: "999px",
                  border: "2px solid #f2d34f",
                  color: "#f2d34f",
                  fontSize: "23px",
                  fontWeight: 600,
                }}
              >
                {department}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
