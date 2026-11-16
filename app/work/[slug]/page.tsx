import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageMotion } from "@/components/motion/page-motion";
import CaseStudy from "@/features/case-study";
import { getProject, projects } from "@/lib/data/projects";

// Next 16: `params` is a Promise.
type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  const description = project.summary;
  return {
    title: project.title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    // Placeholder projects must not be indexed.
    robots: project.mock ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: `${project.title} — Case study`,
      description,
      url: `/work/${project.slug}`,
      images: project.image ? [{ url: project.image, alt: `${project.title} website preview` }] : undefined,
    },
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <CaseStudy project={project} />
      <PageMotion hero={false} />
    </>
  );
}
