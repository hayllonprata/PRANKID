"use client";

import { useMemo, useState } from "react";
import { mediaUrl, type CrewShot } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";

const PAGE_SIZE = 3;

export function CrewSection({ shots }: { shots: CrewShot[] }) {
  const photos = shots.filter((shot) => mediaUrl(shot.imageUrl));
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const carousel = photos.length > PAGE_SIZE;

  const visible = useMemo(() => {
    const start = (page % pageCount) * PAGE_SIZE;
    return photos.slice(start, start + PAGE_SIZE);
  }, [page, pageCount, photos]);

  if (!photos.length) return null;

  return (
    <section className="section" id="crew">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">{siteCopy.crewKicker}</p>
            <h2>{siteCopy.crewTitle}</h2>
          </div>
          <p>{siteCopy.crewLead}</p>
        </div>
        <div className="crew-stage">
          {carousel ? (
            <button
              className="crew-nav"
              type="button"
              aria-label="Fotos anteriores"
              onClick={() => setPage((current) => (current - 1 + pageCount) % pageCount)}
            >
              ‹
            </button>
          ) : null}
          <div className="crew-grid">
            {visible.map((shot) => (
              <figure className="crew-card" key={shot.id}>
                <img src={mediaUrl(shot.imageUrl)} alt={shot.caption || "Comprador PRANKID"} />
                {shot.caption ? <figcaption>{shot.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
          {carousel ? (
            <button
              className="crew-nav"
              type="button"
              aria-label="Próximas fotos"
              onClick={() => setPage((current) => (current + 1) % pageCount)}
            >
              ›
            </button>
          ) : null}
        </div>
        {carousel ? (
          <div className="crew-dots">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                className={index === page % pageCount ? "on" : ""}
                type="button"
                aria-label={`Página ${index + 1}`}
                onClick={() => setPage(index)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
