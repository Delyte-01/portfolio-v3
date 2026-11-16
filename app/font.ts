import { Montserrat, Space_Grotesk } from "next/font/google";

// Body / UI: Montserrat (matches the reference design).
export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Headings: Space Grotesk.
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
