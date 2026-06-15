import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "check" | "shield" | "plus" | "arrow" | "arrowL" | "upload" | "download"
  | "grid" | "doc" | "sliders" | "palette" | "type" | "image" | "pen" | "qr"
  | "cal" | "tag" | "user" | "lock" | "mail" | "eye" | "bolt" | "link" | "copy"
  | "trash" | "menu" | "x" | "chevD" | "chevR" | "spark" | "globe" | "coins"
  | "layout" | "rows" | "table" | "star" | "settings" | "logout";

export function Icon({
  name,
  size = 20,
  stroke = 1.8,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<IconName, ReactNode> = {
    check: <polyline points="20 6 9 17 4 12" {...p} />,
    shield: <><path d="M12 3l7 3v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" {...p} /><polyline points="9 12 11 14 15 10" {...p} /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" {...p} /><line x1="5" y1="12" x2="19" y2="12" {...p} /></>,
    arrow: <><line x1="5" y1="12" x2="19" y2="12" {...p} /><polyline points="13 6 19 12 13 18" {...p} /></>,
    arrowL: <><line x1="19" y1="12" x2="5" y2="12" {...p} /><polyline points="11 6 5 12 11 18" {...p} /></>,
    upload: <><path d="M4 15v4a1 1 0 001 1h14a1 1 0 001-1v-4" {...p} /><polyline points="8 8 12 4 16 8" {...p} /><line x1="12" y1="4" x2="12" y2="15" {...p} /></>,
    download: <><path d="M4 15v4a1 1 0 001 1h14a1 1 0 001-1v-4" {...p} /><polyline points="8 11 12 15 16 11" {...p} /><line x1="12" y1="4" x2="12" y2="15" {...p} /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" {...p} /><rect x="14" y="3" width="7" height="7" rx="1.5" {...p} /><rect x="3" y="14" width="7" height="7" rx="1.5" {...p} /><rect x="14" y="14" width="7" height="7" rx="1.5" {...p} /></>,
    doc: <><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" {...p} /><polyline points="14 3 14 8 19 8" {...p} /><line x1="8" y1="13" x2="16" y2="13" {...p} /><line x1="8" y1="17" x2="13" y2="17" {...p} /></>,
    sliders: <><line x1="4" y1="8" x2="20" y2="8" {...p} /><line x1="4" y1="16" x2="20" y2="16" {...p} /><circle cx="9" cy="8" r="2.4" {...p} /><circle cx="15" cy="16" r="2.4" {...p} /></>,
    palette: <><path d="M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 004-4c0-4.4-4-7.7-9-7.7z" {...p} /><circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="9.5" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="14" cy="7.5" r="1" fill="currentColor" stroke="none" /></>,
    type: <><polyline points="5 7 5 5 19 5 19 7" {...p} /><line x1="12" y1="5" x2="12" y2="19" {...p} /><line x1="9" y1="19" x2="15" y2="19" {...p} /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" {...p} /><circle cx="8.5" cy="9.5" r="1.5" {...p} /><path d="M21 16l-5-5L5 20" {...p} /></>,
    pen: <><path d="M4 20s2-.5 3.5-2L18 7.5a2 2 0 00-3-3L4.5 15C3 16.5 4 20 4 20z" {...p} /><line x1="13" y1="6" x2="17" y2="10" {...p} /></>,
    qr: <><rect x="3" y="3" width="7" height="7" rx="1" {...p} /><rect x="14" y="3" width="7" height="7" rx="1" {...p} /><rect x="3" y="14" width="7" height="7" rx="1" {...p} /><line x1="14" y1="14" x2="14" y2="17" {...p} /><line x1="14" y1="20" x2="17" y2="20" {...p} /><line x1="20" y1="14" x2="20" y2="20" {...p} /><line x1="17" y1="17" x2="17" y2="17" {...p} /></>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="2" {...p} /><line x1="3" y1="9" x2="21" y2="9" {...p} /><line x1="8" y1="3" x2="8" y2="6" {...p} /><line x1="16" y1="3" x2="16" y2="6" {...p} /></>,
    tag: <><path d="M3 12V5a2 2 0 012-2h7l8 8-9 9z" {...p} /><circle cx="8" cy="8" r="1.4" {...p} /></>,
    user: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" {...p} /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" {...p} /><path d="M8 10V7a4 4 0 018 0v3" {...p} /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" {...p} /><path d="M3 7l9 6 9-6" {...p} /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" {...p} /><circle cx="12" cy="12" r="3" {...p} /></>,
    bolt: <polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" {...p} />,
    link: <><path d="M9 15l6-6" {...p} /><path d="M11 6l1-1a4 4 0 016 6l-1 1" {...p} /><path d="M13 18l-1 1a4 4 0 01-6-6l1-1" {...p} /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" {...p} /><path d="M5 15V5a2 2 0 012-2h10" {...p} /></>,
    trash: <><polyline points="4 7 20 7" {...p} /><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" {...p} /><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" {...p} /></>,
    menu: <><line x1="4" y1="7" x2="20" y2="7" {...p} /><line x1="4" y1="12" x2="20" y2="12" {...p} /><line x1="4" y1="17" x2="20" y2="17" {...p} /></>,
    x: <><line x1="6" y1="6" x2="18" y2="18" {...p} /><line x1="18" y1="6" x2="6" y2="18" {...p} /></>,
    chevD: <polyline points="6 9 12 15 18 9" {...p} />,
    chevR: <polyline points="9 6 15 12 9 18" {...p} />,
    spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" {...p} />,
    globe: <><circle cx="12" cy="12" r="9" {...p} /><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" {...p} /></>,
    coins: <><ellipse cx="12" cy="6" rx="7" ry="3" {...p} /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" {...p} /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" {...p} /></>,
    layout: <><rect x="3" y="4" width="18" height="16" rx="2" {...p} /><line x1="3" y1="9" x2="21" y2="9" {...p} /><line x1="9" y1="9" x2="9" y2="20" {...p} /></>,
    rows: <><rect x="3" y="4" width="18" height="16" rx="2" {...p} /><line x1="3" y1="10" x2="21" y2="10" {...p} /><line x1="3" y1="15" x2="21" y2="15" {...p} /></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2" {...p} /><line x1="3" y1="9" x2="21" y2="9" {...p} /><line x1="9" y1="9" x2="9" y2="20" {...p} /><line x1="15" y1="9" x2="15" y2="20" {...p} /></>,
    star: <polygon points="12 3 14.5 9 21 9.3 16 13.5 17.5 20 12 16.3 6.5 20 8 13.5 3 9.3 9.5 9" {...p} />,
    settings: <><circle cx="12" cy="12" r="3" {...p} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...p} /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" {...p} /><polyline points="16 17 21 12 16 7" {...p} /><line x1="21" y1="12" x2="9" y2="12" {...p} /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} className={className} aria-hidden="true">
      {paths[name] || null}
    </svg>
  );
}
