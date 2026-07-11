import { brand } from "@/config/brand";

/**
 * Placeholder landing page. Build the real one section-by-section via
 * docs/features/008-marketing-site.md using the 50-marketing.mdc rules.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-balance text-5xl font-semibold tracking-tight">
        {brand.tagline}
      </h1>
      <p className="max-w-md text-muted-foreground">{brand.description}</p>
    </main>
  );
}
