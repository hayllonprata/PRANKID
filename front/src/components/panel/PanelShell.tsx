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

  useEffect(() => {
    if (pathname === "/panel/login") {
      setReady(true);
      return;
    }
    api("/api/auth/me")
      .then(() => setReady(true))
      .catch(() => router.replace("/panel/login"));
  }, [pathname, router]);

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
    ["/panel/config", "Configurações"],
  ] as const;

  return (
    <div className="panel-shell">
      <aside className="panel-side">
        <div style={{ marginBottom: 24 }}>
          <BrandLogo href="/panel" height={36} />
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
