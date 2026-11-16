import type { MetadataRoute } from "next";
import { projects } from "@/lib/data/projects";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    // Mock projects are not indexable, so they stay out of the sitemap.
    ...projects
      .filter((p) => !p.mock)
      .map((p) => ({
        url: `${site.url}/work/${p.slug}`,
        changeFrequency: "yearly" as const,
        priority: 0.7,
      })),
  ];
}
