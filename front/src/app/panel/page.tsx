"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Product } from "@/lib/api";

export default function PanelHomePage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    api<Product[]>("/api/admin/products")
      .then((products) => setCount(products.length))
      .catch(() => setCount(0));
  }, []);

  return (
    <>
      <h1>Resumo</h1>
      <div className="panel-card">
        <p>Use o menu para alimentar a loja: hero, história, produtos e configurações.</p>
        <p>Produtos cadastrados: {count === null ? "..." : count}</p>
        <div className="row-actions">
          <Link className="btn" href="/panel/produtos">
            Produtos
          </Link>
          <Link className="btn" href="/panel/acessos">
            Acessos
          </Link>
          <Link className="btn magenta" href="/panel/config">
            WhatsApp e Yampi
          </Link>
        </div>
      </div>
    </>
  );
}
