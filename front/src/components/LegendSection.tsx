import { mediaUrl, type LegendBeat } from "@/lib/api";
import { siteCopy } from "@/lib/site-copy";
import { BrandLogo } from "./BrandLogo";

function storyParagraphs(beats: LegendBeat[]) {
  const paragraphs: string[] = [];
  for (const beat of beats) {
    const caption = beat.caption.trim();
    if (!caption) continue;
    if (beat.sortOrder === 2 && paragraphs.length > 0) {
      paragraphs[paragraphs.length - 1] = `${paragraphs[paragraphs.length - 1]} ${caption}`;
      continue;
    }
    paragraphs.push(caption);
  }
  return paragraphs;
}

export function LegendSection({ beats }: { beats: LegendBeat[] }) {
  if (!beats.length) return null;
  const photos = beats.map((beat) => mediaUrl(beat.imageUrl)).filter(Boolean);
  const paragraphs = storyParagraphs(beats);

  return (
    <section className="section" id="prankid">
      <div className="wrap">
        <div className="legend-story">
          <div>
            <p className="kicker">{siteCopy.legendKicker}</p>
            <h2>{siteCopy.legendTitle}</h2>
            {paragraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
            <p className="slogan">{siteCopy.slogan}</p>
            <p className="slogan-en">{siteCopy.sloganEn}</p>
            <BrandLogo href={null} height={56} />
          </div>
          {photos.length ? (
            <div className="legend-photos">
              {photos.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
