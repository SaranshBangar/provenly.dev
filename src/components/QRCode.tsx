import QR from "qrcode";

/**
 * Real, scannable QR code rendered as a pure SVG (works in server & client).
 * `size` may be a number (px) or "100%" to fill its container.
 */
export function QRCode({
  value = "provenly.dev",
  size = 120,
  fg = "#0F1B2D",
  bg = "#fff",
}: {
  value?: string;
  size?: number | string;
  fg?: string;
  bg?: string;
}) {
  let n = 21;
  let data: Uint8Array | number[] = [];
  try {
    const qr = QR.create(value || "provenly.dev", { errorCorrectionLevel: "M" });
    n = qr.modules.size;
    data = qr.modules.data as unknown as Uint8Array;
  } catch {
    // fall back to empty grid on malformed input
  }

  const margin = 2;
  const dim = n + margin * 2;
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (data[r * n + c]) {
        rects.push(<rect key={r + "-" + c} x={c + margin} y={r + margin} width={1} height={1} fill={fg} />);
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      shapeRendering="crispEdges"
      style={{ borderRadius: 4, display: "block" }}
    >
      <rect width={dim} height={dim} fill={bg} />
      {rects}
    </svg>
  );
}
