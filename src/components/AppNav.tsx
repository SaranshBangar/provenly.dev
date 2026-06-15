"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { signOut } from "@/lib/auth-client";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/customize", label: "Customizer", icon: "sliders" },
  { href: "/upload", label: "Bulk issue", icon: "upload" },
];

export function AppNav({
  credits,
  initials,
}: {
  credits: number;
  initials: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const logout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, height: "var(--nav-h)", background: "rgba(255,255,255,.82)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ height: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 22px", display: "flex", alignItems: "center", gap: 22 }}>
        <Link href="/dashboard" style={{ display: "flex" }}>
          <Logo size={20} />
        </Link>
        <nav className="appnav-desktop" style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              style={{
                display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 14px", borderRadius: 9,
                fontSize: 14.5, fontWeight: 600,
                color: active(it.href) ? "var(--green-700)" : "var(--ink-2)",
                background: active(it.href) ? "var(--green-tint)" : "transparent",
              }}
            >
              <Icon name={it.icon} size={17} /> {it.label}
            </Link>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div className="appnav-desktop" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/billing" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99, background: "var(--gold-tint)", color: "#8a6a1e", fontWeight: 700, fontSize: 13.5 }}>
            <Icon name="coins" size={16} /> {credits} credits
          </Link>
          <Link className="btn btn-primary btn-sm" href="/customize">
            <Icon name="plus" size={16} /> New
          </Link>
          <button onClick={logout} title="Log out" style={{ width: 36, height: 36, borderRadius: 99, background: "var(--ink)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>
            {initials}
          </button>
        </div>
        <button className="appnav-mobile" onClick={() => setMenu((m) => !m)} style={{ display: "none", color: "var(--ink)", marginLeft: "auto" }}>
          <Icon name={menu ? "x" : "menu"} size={24} />
        </button>
      </div>
      {menu && (
        <div className="appnav-mobile" style={{ display: "block", padding: "10px 18px 18px", background: "#fff", borderBottom: "1px solid var(--line)" }}>
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setMenu(false)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 8px", fontSize: 16, fontWeight: 600, color: active(it.href) ? "var(--green-700)" : "var(--ink-2)" }}>
              <Icon name={it.icon} size={19} /> {it.label}
            </Link>
          ))}
          <Link href="/billing" onClick={() => setMenu(false)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 8px", fontSize: 16, fontWeight: 600, color: "#8a6a1e" }}>
            <Icon name="coins" size={19} /> {credits} credits
          </Link>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 8px", fontSize: 16, fontWeight: 600, color: "var(--danger)" }}>
            <Icon name="logout" size={19} /> Log out
          </button>
        </div>
      )}
    </header>
  );
}
