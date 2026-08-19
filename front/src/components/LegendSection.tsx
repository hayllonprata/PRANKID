import { type Legend } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { BrandLogo } from "./BrandLogo";

export function LegendSection({ legend }: { legend: Legend | null }) {
  if (!legend) return null;
  const paragraphs = legend.description
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className="section" id="prankid">
      <div className="wrap">
        <div className="legend-story">
          <div>
            <p className="kicker">{siteCopy.legendKicker}</p>
            <h2>{legend.title || siteCopy.legendTitle}</h2>
            {paragraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
            <BrandLogo href={null} height={56} />
          </div>
        </div>
      </div>
    </section>
  );
}
