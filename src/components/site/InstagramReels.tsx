import { ArrowUpRight, Instagram } from "lucide-react";
import { selectedReels } from "@/lib/instagram";

export function InstagramReels() {
  return (
    <section aria-labelledby="selected-reels-title" className="border-y border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-2 text-accent"><Instagram className="h-4 w-4" aria-hidden="true" /> Selected reels</p>
            <h2 id="selected-reels-title" className="display-xl mt-2 text-4xl md:text-6xl">Watch The Fits</h2>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {selectedReels.map((reel, index) => (
            <article key={reel.id} className="w-full max-w-[400px] min-w-0 overflow-hidden rounded-sm border border-border bg-background">
              <iframe
                src={`${reel.url}embed/`}
                title={`ZEON.CO selected Instagram reel ${index + 1}`}
                loading="lazy"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                className="block h-[660px] w-full border-0"
              />
              <a href={reel.url} target="_blank" rel="noopener noreferrer" className="eyebrow flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-foreground transition hover:bg-secondary">
                Watch on Instagram <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}