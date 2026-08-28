"use client";

import { mediaUrl, type Story } from "@/lib/api";
import { useScrollDrift } from "@/hooks/useScrollDrift";

export function StorySection({ story }: { story: Story | null }) {
  const mediaRef = useScrollDrift<HTMLDivElement>(0.1);

  if (!story) return null;
  const src = mediaUrl(story.imageUrl);
  return (
    <section className="section" id="historia">
      <div className="wrap">
        <div className="story">
          <div className="story-media" ref={mediaRef}>
            {src ? <img src={src} alt={story.title} /> : <div className="story-placeholder" />}
          </div>
          <div>
            <p className="kicker">Os idealizadores</p>
            <h2>{story.title}</h2>
            {story.description.split(/\n\n+/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
