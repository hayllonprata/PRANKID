"use client";

import { useEffect, useState } from "react";
import { api, type StoreData } from "@/lib/api";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductsSection } from "@/components/ProductsSection";
import { StorySection } from "@/components/StorySection";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function HomePage() {
  const [data, setData] = useState<StoreData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<StoreData>("/api/store")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="wrap" style={{ padding: 48 }}>
        <h1>PRANKID</h1>
        <p className="cart-error">Não foi possível carregar a loja: {error}</p>
      </main>
    );
  }

  if (!data) return <div className="skeleton" />;

  return (
    <>
      <Header />
      <main>
        <HeroSection hero={data.hero} />
        <ProductsSection products={data.products} />
        <StorySection story={data.story} />
      </main>
      <Footer settings={data.settings} />
      <CartDrawer yampiBaseUrl={data.settings.yampiBaseUrl} />
      <WhatsAppButton number={data.settings.whatsapp} />
    </>
  );
}
