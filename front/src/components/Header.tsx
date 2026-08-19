"use client";

import { BrandLogo } from "./BrandLogo";
import { useCart } from "./CartProvider";

export function Header() {
  const { count, setOpen } = useCart();
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <BrandLogo href="#topo" height={42} />
        <nav className="nav">
          <a href="#produtos">Produtos</a>
          <a href="#prankid">PRANKID</a>
          <a href="#historia">Idealizadores</a>
        </nav>
        <button className="icon-btn" type="button" onClick={() => setOpen(true)} aria-label="Abrir carrinho">
          🛒
          {count > 0 ? <span className="badge">{count}</span> : null}
        </button>
      </div>
    </header>
  );
}
