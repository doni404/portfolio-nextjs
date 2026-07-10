import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/metadata";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = truncate(searchParams.get("title") ?? siteConfig.shortName, 86);
  const description = truncate(searchParams.get("description") ?? siteConfig.description, 150);
  const label = searchParams.get("label") ?? "Portfolio";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0b1120",
          color: "#f8fafc",
          fontFamily: "Inter, Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 20%, rgba(0, 229, 255, 0.32), transparent 34%), radial-gradient(circle at 82% 12%, rgba(37, 99, 235, 0.42), transparent 28%), linear-gradient(135deg, #081020 0%, #0f1b33 58%, #07111f 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -90,
            top: -80,
            width: 420,
            height: 420,
            borderRadius: 999,
            border: "2px solid rgba(96, 165, 250, 0.24)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 78,
            bottom: 76,
            display: "flex",
            gap: 18,
          }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: index % 2 ? "#38bdf8" : "#2563eb",
                opacity: 0.75,
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "70px 82px",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 24,
                background: "#020617",
                border: "2px solid rgba(147, 197, 253, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 20px 70px rgba(37, 99, 235, 0.32)",
              }}
            >
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  letterSpacing: -4,
                  color: "#f8fafc",
                  display: "flex",
                }}
              >
                DP
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div
                style={{
                  color: "#38bdf8",
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 8,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 28, fontWeight: 600 }}>
                {siteConfig.name}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                fontSize: title.length > 58 ? 58 : 68,
                fontWeight: 850,
                letterSpacing: -2,
                lineHeight: 1.04,
                maxWidth: 940,
              }}
            >
              {title}
            </div>
            <div
              style={{
                maxWidth: 880,
                color: "#cbd5e1",
                fontSize: 30,
                lineHeight: 1.35,
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#93c5fd",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex" }}>
              Cloud Architect & Senior Backend Engineer | AWS, Fintech, Cloud & AI
            </div>
            <div style={{ display: "flex" }}>doniputra.com</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
