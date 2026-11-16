import { CtaButton } from "@/components/ui/cta-button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-[100svh] place-items-center">
      <Container className="py-32">
        <p className="t-meta mb-6 text-electric-ink">404</p>
        <h1 className="t-display max-w-[12ch]">
          This page <span className="accent-text">doesn&apos;t exist.</span>
        </h1>
        <div className="mt-10">
          <CtaButton href="/" variant="solid">
            Back home
          </CtaButton>
        </div>
      </Container>
    </main>
  );
}
