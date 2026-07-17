import { redirect } from "next/navigation";

// ── Resolve a Polymarket event slug to a tracking ID ──
async function resolveSlug(slug) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/tracker`, {
      signal: AbortSignal.timeout(10_000),
      // Revalidate so slug pages stay fresh
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Match slug against the end of the marketLink path
    const tracking = data.availableTrackings?.find((t) => {
      if (!t.marketLink) return false;
      try {
        const path = new URL(t.marketLink).pathname.replace(/\/$/, "");
        return path.endsWith(slug);
      } catch {
        return false;
      }
    });

    return tracking?.id ?? null;
  } catch {
    return null;
  }
}

export default async function SlugPage({ params }) {
  const { slug } = await params;
  const trackingId = await resolveSlug(slug);

  if (trackingId) {
    redirect(`/?trackingId=${trackingId}`);
  }

  // Slug not found — redirect to main page
  redirect("/");
}