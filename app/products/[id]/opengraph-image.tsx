import { ImageResponse } from "next/og";
import { getProduct } from "../../../lib/catalog";
import { formatPrice } from "../../../lib/catalog-model";
import { placeProduct } from "../../../lib/taxonomy";
import { BRAND } from "../../../lib/brand";

export const alt = "Product on Munshi Mart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-product share card, so a WhatsApp or Facebook link preview shows the
// actual product and store instead of plain text. Only public DTO fields are
// used; no seller contact number is ever drawn.
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await getProduct(id);

  const frame = {
    width: "100%",
    height: "100%",
    display: "flex",
    background: "linear-gradient(135deg, #0a2d23 0%, #123e31 55%, #205540 100%)",
    color: "#fffef2",
    fontFamily: "Arial, Helvetica, sans-serif",
  } as const;

  if (!data)
    return new ImageResponse(
      (
        <div
          style={{
            ...frame,
            alignItems: "center",
            justifyContent: "center",
            fontSize: "64px",
            fontWeight: 800,
          }}
        >
          {BRAND}
        </div>
      ),
      { ...size },
    );

  const placed = placeProduct(data);
  const image = data.image_urls[0];
  return new ImageResponse(
    (
      <div style={frame}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "66px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "23px",
              letterSpacing: "3px",
              color: "#f2d34f",
              fontWeight: 700,
            }}
          >
            {placed.subcategory.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: data.product_name.length > 46 ? "52px" : "66px",
              fontWeight: 800,
              lineHeight: 1.1,
              marginTop: "22px",
            }}
          >
            {data.product_name.slice(0, 84)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "50px",
              fontWeight: 700,
              color: "#f2d34f",
              marginTop: "26px",
            }}
          >
            {formatPrice(data.retail_price)}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {data.sellers && (
              <div style={{ display: "flex", fontSize: "27px", color: "#d4e0d3" }}>
                {data.sellers.store_name}
              </div>
            )}
            <div
              style={{
                display: "flex",
                fontSize: "21px",
                color: "#9fb8a3",
                letterSpacing: "2px",
              }}
            >
              {BRAND.toUpperCase()}
            </div>
          </div>
        </div>
        {image && (
          <div
            style={{
              width: "470px",
              display: "flex",
              background: "#fffef9",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              width={470}
              height={630}
              style={{ width: "470px", height: "630px", objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
