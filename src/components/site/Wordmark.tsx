import { Link } from "@tanstack/react-router";

export function Wordmark({ logoUrl, name = "ZEON.CO", className = "" }: { logoUrl?: string | null | undefined; name?: string; className?: string }) {
  return (
    <Link to="/" aria-label={`${name} home`} className={`inline-flex items-center ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-7 w-auto object-contain md:h-8" />
      ) : (
        <span className="font-display text-xl font-black tracking-[0.18em] md:text-2xl">
          ZEON<span className="text-accent">.</span>CO
        </span>
      )}
    </Link>
  );
}
