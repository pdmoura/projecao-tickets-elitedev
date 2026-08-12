import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Playfair_Display,
} from "next/font/google";

import "./globals.css";
import { BackToTopButton } from "@/components/back-to-top-button";

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const uiFont = IBM_Plex_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const codeFont = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

function getMetadataBase(): URL {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return new URL("http://localhost:3000");
  }

  try {
    return new URL(appUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Projeção — sessões de cinema",
    template: "%s | Projeção",
  },
  description: "Sessões especiais de cinema e ingressos digitais.",
  icons: {
    icon: "/brand/favicon.svg",
  },
  openGraph: {
    title: "Projeção — sessões de cinema",
    description: "Sessões especiais de cinema e ingressos digitais.",
    images: ["/brand/opengraph-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${displayFont.variable} ${uiFont.variable} ${codeFont.variable}`}
      >
        {children}
        <BackToTopButton />
      </body>
    </html>
  );
}
