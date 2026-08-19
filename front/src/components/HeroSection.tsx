import { mediaUrl, type Hero } from "@/lib/api";

export function HeroSection({ hero }: { hero: Hero | null }) {
  if (!hero || !hero.enabled) return null;
  const src = mediaUrl(hero.imageUrl);
  return (
    <section className="wrap hero" id="topo">
      <div>
        <span className="kicker">toy art · drop limitado</span>
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
        {hero.ctaText ? (
          <a className="btn" href="#produtos">
            {hero.ctaText}
          </a>
        ) : null}
      </div>
      <div className="hero-visual">
        <div className="hero-frame">
          {src ? <img src={src} alt={hero.title} /> : <div className="card-media" style={{ height: 420 }}><div className="placeholder-toy" /></div>}
        </div>
        <span className="sticker s1">coleção</span>
        <span className="sticker s2">edição prank</span>
      </div>
    </section>
  );
}
