import { mediaUrl, type Story } from "@/lib/api";

export function StorySection({ story }: { story: Story | null }) {
  if (!story) return null;
  const src = mediaUrl(story.imageUrl);
  return (
    <section className="section" id="historia">
      <div className="wrap">
        <div className="story">
          {src ? <img src={src} alt={story.title} /> : <div className="story-placeholder" />}
          <div>
            <h2>{story.title}</h2>
            <p>{story.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
