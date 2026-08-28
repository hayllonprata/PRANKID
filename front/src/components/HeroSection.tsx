"use client";

import { mediaUrl, type Hero } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { useScrollDrift } from "@/hooks/useScrollDrift";

export function HeroSection({ hero }: { hero: Hero | null }) {
  const frameRef = useScrollDrift<HTMLDivElement>(0.08);
  const stickerOneRef = useScrollDrift<HTMLSpanElement>(-0.16, 0.05);
  const stickerTwoRef = useScrollDrift<HTMLSpanElement>(0.18, -0.04);

  if (!hero || !hero.enabled) return null;
  const src = mediaUrl(hero.imageUrl);
  return (
    <section className="wrap hero" id="topo">
      <div>
        <span className="kicker">{siteCopy.heroKicker}</span>
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
        {hero.ctaText ? (
          <a className="btn" href="#produtos">
            {hero.ctaText}
          </a>
        ) : null}
      </div>
      <div className="hero-visual">
        <div className="hero-frame" ref={frameRef}>
          {src ? <img src={src} alt={hero.title} /> : <div className="card-media" style={{ height: 420 }}><div className="placeholder-toy" /></div>}
        </div>
        <span className="sticker s1" ref={stickerOneRef}>
          {siteCopy.heroSticker1}
        </span>
        <span className="sticker s2" ref={stickerTwoRef}>
          {siteCopy.heroSticker2}
        </span>
      </div>
    </section>
  );
}
