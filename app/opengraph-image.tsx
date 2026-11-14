import { ImageResponse } from "next/og";
import { BRAND, TAGLINE } from "../lib/brand";

export const alt = "Munshi Mart — Pakistan's WhatsApp-native marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand share card. Uses the system font stack so no font file is fetched
// at build or request time.
export default async function Image() {
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
          background: "linear-gradient(135deg, #0a2d23 0%, #123e31 55%, #205540 100%)",
          color: "#fffef2",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: "26px",
            letterSpacing: "4px",
            color: "#f2d34f",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#f2d34f",
            }}
          />
          GOOD FINDS. LOCAL STORES.
        </div>
        <div
          style={{
            fontSize: "104px",
            fontWeight: 800,
            lineHeight: 1.03,
            marginTop: "28px",
            display: "flex",
          }}
        >
          {BRAND}
        </div>
        <div
          style={{
            fontSize: "35px",
            color: "#d4e0d3",
            marginTop: "26px",
            maxWidth: "860px",
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          Independent Pakistani stores in one marketplace. Listed and updated
          over WhatsApp.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontSize: "25px",
            color: "#f2d34f",
            fontWeight: 600,
          }}
        >
          {TAGLINE}
        </div>
      </div>
    ),
    { ...size },
  );
}
