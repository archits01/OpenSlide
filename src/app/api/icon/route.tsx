import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export function GET(req: NextRequest) {
  const s = Number(req.nextUrl.searchParams.get("size") || "512");
  const size = Math.min(Math.max(s, 16), 1024);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4338CA",
          borderRadius: size * 0.22,
        }}
      >
        <div
          style={{
            fontSize: size * 0.55,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          O
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
