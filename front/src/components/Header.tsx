"use client";

import { useCart } from "./CartProvider";

export function Header() {
  const { count, setOpen } = useCart();
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <a className="logo" href="#topo">
          <span className="logo-mark">PK</span>
          PRANKID
        </a>
        <nav className="nav">
          <a href="#produtos">Produtos</a>
          <a href="#historia">História</a>
        </nav>
        <button className="icon-btn" type="button" onClick={() => setOpen(true)} aria-label="Abrir carrinho">
          🛒
          {count > 0 ? <span className="badge">{count}</span> : null}
        </button>
      </div>
    </header>
  );
}
