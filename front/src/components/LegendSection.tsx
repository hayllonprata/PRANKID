import { mediaUrl, type LegendBeat } from "@/lib/api";
import { BrandLogo } from "./BrandLogo";

export function LegendSection({ beats }: { beats: LegendBeat[] }) {
  if (!beats.length) return null;

  return (
    <section className="section" id="prankid">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">A lenda</p>
            <h2>A história do PRANKID</h2>
          </div>
          <p>Rebeldia, liberdade e Sucesso.</p>
        </div>
        <div className="legend-list">
          {beats.map((beat, index) => {
            const src = mediaUrl(beat.imageUrl);
            const finale = beat.id === "prankid-15";
            return (
              <article className={`legend-beat${index % 2 ? " alt" : ""}`} key={beat.id}>
                {src ? (
                  <img src={src} alt={beat.title} />
                ) : (
                  <div className="legend-placeholder">
                    <span>Cena {beat.sortOrder}</span>
                    <strong>{beat.title}</strong>
                  </div>
                )}
                <div className="legend-copy">
                  <span className="legend-num">{String(beat.sortOrder).padStart(2, "0")}</span>
                  {finale ? <BrandLogo href={null} height={56} /> : null}
                  <p>{beat.caption}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
