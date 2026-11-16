import type { Metadata, Viewport } from "next";

import "./globals.css";
import { montserrat, spaceGrotesk } from "./font";
import Header from "@/components/navbar";
import SmoothScroll from "@/components/lenis";
import { Cursor } from "@/components/cursor";
import Loader from "@/components/loader";
import Footer from "@/features/footer";
import { BackToTop } from "@/features/footer/back-to-top";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  authors: [{ name: site.fullName, url: site.socials.github }],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.role}`,
    description: site.description,
    url: site.url,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* Decides before first paint whether the loader plays (once per session, "/" only, no reduced motion). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=sessionStorage.getItem("delyte:loaded")||window.matchMedia("(prefers-reduced-motion: reduce)").matches||location.pathname!=="/";document.documentElement.setAttribute("data-loader",s?"skip":"play")}catch(e){document.documentElement.setAttribute("data-loader","skip")}})();`,
          }}
        />
        <noscript>
          <style>{`.loader{display:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <SmoothScroll>
          <Loader />
          <Header />
          {children}
          <Footer />
          <BackToTop />
          <Cursor />
        </SmoothScroll>
      </body>
    </html>
  );
}
