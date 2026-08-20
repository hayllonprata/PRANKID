"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { api, clearToken } from "@/lib/api";

export function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === "/panel/login");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/panel/login") {
      setReady(true);
      return;
    }
    api("/api/auth/me")
      .then(() => setReady(true))
      .catch(() => router.replace("/panel/login"));
  }, [pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname === "/panel/login") return <>{children}</>;
  if (!ready) return <div className="skeleton" />;

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearToken();
    router.replace("/panel/login");
  }

  const links = [
    ["/panel", "Resumo"],
    ["/panel/hero", "Hero"],
    ["/panel/historia", "Idealizadores"],
    ["/panel/lenda", "Lenda PRANKID"],
    ["/panel/crew", "Quem levou embora"],
    ["/panel/produtos", "Produtos"],
    ["/panel/personalizacoes", "Personalizações"],
    ["/panel/acessos", "Acessos"],
    ["/panel/config", "Configurações"],
  ] as const;

  return (
    <div className="panel-shell">
      <button className="panel-menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      {menuOpen && <div className="panel-menu-backdrop" onClick={() => setMenuOpen(false)} />}
      <aside className={`panel-side ${menuOpen ? "panel-side-open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <BrandLogo href="/panel" height={32} />
          <button
            className="panel-menu-close"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""}>
            {label}
          </Link>
        ))}
        <button className="link" type="button" onClick={logout} style={{ marginTop: 24 }}>
          Sair
        </button>
        <Link href="/" style={{ marginTop: 8 }}>
          Ver loja
        </Link>
      </aside>
      <div className="panel-main">{children}</div>
    </div>
  );
}
