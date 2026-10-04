import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/metadata";
import portrait from "@/public/brand/doni-portrait.png";

export const runtime = "edge";

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = truncate(searchParams.get("title") ?? siteConfig.shortName, 86);
  const description = truncate(
    searchParams.get("description") ?? siteConfig.description,
    130,
  );
  const label = truncate(
    searchParams.get("label") ?? "Journal & Portfolio",
    40,
  );
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 64px",
        background: "#17271f",
        color: "#f1f7f0",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {/* ImageResponse renders native image elements. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={new URL(portrait.src, request.url).toString()}
            width={66}
            height={66}
            alt=""
            style={{ borderRadius: 8 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", fontSize: 25, fontWeight: 700 }}>
              {siteConfig.name}
            </div>
            <div style={{ display: "flex", color: "#b3c6b6", fontSize: 16 }}>
              Independent thinking. Practical engineering.
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 16,
            color: "#c8edb7",
            padding: "12px 18px",
            border: "1px solid #526d5b",
            borderRadius: 4,
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          padding: "24px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: title.length > 58 ? 51 : 62,
            fontWeight: 700,
            lineHeight: 1.13,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 25,
            lineHeight: 1.4,
            color: "#b3c6b6",
            maxWidth: 1000,
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #526d5b",
          paddingTop: 22,
          fontSize: 19,
        }}
      >
        <div style={{ display: "flex", color: "#b3c6b6" }}>
          AI / Cloud / Engineering
        </div>
        <div style={{ display: "flex", color: "#c8edb7" }}>doniputra.com</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
