import { ArrowUpRight, Instagram } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { readReels } from "@/lib/instagram";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export function InstagramReels() {
  const { data: settings } = useSuspenseQuery(settingsQuery());
  const reels = readReels(settings?.selected_reels);
  if (!reels.length) return null;
  return (
    <section aria-labelledby="selected-reels-title" className="border-y border-border bg-card py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Carousel opts={{ align: "start", dragFree: false }} aria-label="Selected Instagram reels">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-2 text-accent"><Instagram className="h-4 w-4" aria-hidden="true" /> Selected reels</p>
            <h2 id="selected-reels-title" className="display-xl mt-2 text-4xl md:text-6xl">Watch The Fits</h2>
          </div>
          <div className="flex gap-2">
            <CarouselPrevious className="static h-10 w-10 translate-y-0 rounded-sm" title="Previous reel" />
            <CarouselNext className="static h-10 w-10 translate-y-0 rounded-sm" title="Next reel" />
          </div>
        </div>
        <CarouselContent>
          {reels.map((reel, index) => (
            <CarouselItem key={reel.id} className="basis-[92%] sm:basis-1/2 lg:basis-1/3" aria-label={`Reel ${index + 1} of ${reels.length}`}>
            <article className="min-w-0 overflow-hidden rounded-sm border border-border bg-background">
              <iframe
                src={`${reel.url}embed/`}
                title={reel.title || `ZEON.CO selected Instagram reel ${index + 1}`}
                loading="lazy"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                className="block h-[660px] w-full border-0"
              />
              <a href={reel.url} target="_blank" rel="noopener noreferrer" className="eyebrow flex items-center justify-between gap-3 border-t border-border px-5 py-4 text-foreground transition hover:bg-secondary">
                Watch on Instagram <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}