import { ImageResponse } from "next/og";

export const alt = "Trusted Roofing & Exteriors in Calgary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0f1e38, #2f4e8c)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "80px",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
          <div style={{ color: "#f0c96a", fontSize: 28, fontWeight: 700, letterSpacing: 5 }}>
            CALGARY ROOFING &amp; EXTERIORS
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08, marginTop: 24 }}>
            Trusted Roofing &amp; Exteriors
          </div>
          <div style={{ color: "#dbeafe", fontSize: 34, marginTop: 28 }}>
            Roof replacement, repairs and exterior estimates
          </div>
        </div>
      </div>
    ),
    size
  );
}
